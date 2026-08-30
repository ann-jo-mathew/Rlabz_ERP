<?php

namespace Modules\Coordinator\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ClientRequirement;
use Modules\Coordinator\Models\ProjectClosure;
use Modules\Coordinator\Models\ProjectFaculty;
use Modules\Coordinator\Models\ProjectStudent;
use Modules\Coordinator\Models\RequirementChange;
use Modules\ProjectClient\Models\Project;

class CoordinatorController extends Controller
{
    protected function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    protected function isAuthorized(Request $request, array $requiredPermissions = ['view-coordinator']): bool
    {
        $permissions = $request->auth_user['permissions'] ?? [];
        if (!is_array($permissions)) {
            return false;
        }

        foreach ($requiredPermissions as $permission) {
            if (in_array($permission, $permissions, true)) {
                return true;
            }
        }

        return false;
    }

    protected function projectProgress(Project $project): array
    {
        $project->load('modules.tasks');

        $taskCount = 0;
        $completedTaskCount = 0;

        foreach ($project->modules as $module) {
            foreach ($module->tasks as $task) {
                $taskCount++;
                if (($task->status ?? '') === 'completed') {
                    $completedTaskCount++;
                }
            }
        }

        $completion = $taskCount > 0 ? round(($completedTaskCount / $taskCount) * 100, 2) : 0;

        return [
            'module_count' => $project->modules->count(),
            'task_count' => $taskCount,
            'completed_task_count' => $completedTaskCount,
            'completion_percentage' => $completion,
            'status' => $project->status,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $projects = Project::with([
            'creator',
            'students:id,name,email',
            'faculty:id,name,email',
            'modules.tasks',
            'requirements',
            'closure',
        ])->latest()->get();

        return response()->json([
            'data' => $projects,
            'count' => $projects->count(),
        ]);
    }

    public function show(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $project->load([
            'creator',
            'students:id,name,email',
            'faculty:id,name,email',
            'modules.tasks',
            'requirements.uploader',
            'requirementChanges.requester',
            'closure.closer',
            'certificates.student',
        ]);

        return response()->json([
            'data' => [
                'project' => $project,
                'progress' => $this->projectProgress($project),
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project_type' => 'nullable|string|max:100',
            'source_type' => 'required|in:faculty,student,alumni,institution,external',
            'brought_by' => 'nullable|string|max:150',
            'client_name' => 'nullable|string|max:150',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:30',
            'requirements' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'expected_timeline' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'priority' => 'required|in:normal,urgent',
            'status' => 'nullable|in:proposed,accepted,rejected,in_progress,closed',
        ]);

        $validated['created_by'] = $this->currentUserId($request) ?? $request->user()?->id;
        if (!$validated['created_by']) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        $project = Project::create($validated);

        return response()->json([
            'message' => 'Project created successfully',
            'data' => $project,
        ], 201);
    }

    public function assignStudent(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'role' => 'required|in:project_lead,developer,designer,tester,other',
            'assigned_date' => 'nullable|date',
        ]);

        $assignment = $project->students()->where('student_id', $validated['student_id'])->first();
        if ($assignment) {
            $project->students()->updateExistingPivot($validated['student_id'], [
                'role' => $validated['role'],
                'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
            ]);
            $record = $project->students()->where('student_id', $validated['student_id'])->first();
            return response()->json(['message' => 'Student assignment updated successfully', 'data' => $record]);
        }

        $project->students()->attach($validated['student_id'], [
            'role' => $validated['role'],
            'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
        ]);

        $record = $project->students()->where('student_id', $validated['student_id'])->first();

        return response()->json([
            'message' => 'Student assigned successfully',
            'data' => $record,
        ], 201);
    }

    public function removeStudent(Request $request, Project $project, $studentId)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $student = User::findOrFail($studentId);
        $project->students()->detach($student->id);

        return response()->json([
            'message' => 'Student removed successfully',
            'student_id' => $student->id,
        ]);
    }

    public function assignFaculty(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'faculty_id' => ['required', 'integer', 'exists:users,id'],
            'assigned_date' => 'nullable|date',
        ]);

        $faculty = User::findOrFail($validated['faculty_id']);
        if (!in_array(($faculty->role ?? ''), ['director', 'coordinator', 'faculty'], true)) {
            return response()->json(['error' => 'Faculty user is not eligible for assignment'], 422);
        }

        if ($project->faculty()->where('faculty_id', $faculty->id)->exists()) {
            $project->faculty()->updateExistingPivot($faculty->id, [
                'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
            ]);
        } else {
            $project->faculty()->attach($faculty->id, [
                'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
            ]);
        }

        $record = $project->faculty()->where('faculty_id', $faculty->id)->first();

        return response()->json([
            'message' => 'Faculty assigned successfully',
            'data' => $record,
        ], 201);
    }

    public function removeFaculty(Request $request, Project $project, $facultyId)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $faculty = User::findOrFail($facultyId);
        $project->faculty()->detach($faculty->id);

        return response()->json([
            'message' => 'Faculty removed successfully',
            'faculty_id' => $faculty->id,
        ]);
    }

    public function requirements(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $requirements = ClientRequirement::with(['uploader', 'task', 'changes'])
            ->where('project_id', $project->id)
            ->latest('uploaded_on')
            ->get();

        return response()->json(['data' => $requirements]);
    }

    public function storeRequirement(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'task_id' => 'nullable|integer|exists:tasks,id',
            'description' => 'required|string',
            'document_path' => 'nullable|string|max:500',
            'uploaded_on' => 'nullable|date',
        ]);

        $requirement = ClientRequirement::create([
            'project_id' => $project->id,
            'task_id' => $validated['task_id'] ?? null,
            'description' => $validated['description'],
            'document_path' => $validated['document_path'] ?? null,
            'uploaded_by' => $this->currentUserId($request) ?? $request->user()?->id,
            'uploaded_on' => $validated['uploaded_on'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Client requirement saved successfully',
            'data' => $requirement->load('uploader', 'task'),
        ], 201);
    }

    public function requirementChanges(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $changes = RequirementChange::with(['clientRequirement', 'requester', 'approver'])
            ->where('project_id', $project->id)
            ->latest('changed_on')
            ->get();

        return response()->json(['data' => $changes]);
    }

    public function storeRequirementChange(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'client_requirement_id' => 'required|integer|exists:client_requirements,id',
            'previous_description' => 'nullable|string',
            'new_description' => 'nullable|string',
            'change_description' => 'required|string',
            'reason' => 'nullable|string',
            'previous_document_path' => 'nullable|string|max:500',
            'new_document_path' => 'nullable|string|max:500',
            'status' => 'nullable|in:pending,approved,rejected',
            'approved_by' => 'nullable|integer|exists:users,id',
            'approved_at' => 'nullable|date',
            'changed_on' => 'nullable|date',
        ]);

        $validated['project_id'] = $project->id;
        $validated['requested_by'] = $this->currentUserId($request) ?? $request->user()?->id;
        $validated['status'] = $validated['status'] ?? 'pending';
        $validated['changed_on'] = $validated['changed_on'] ?? now();

        $change = RequirementChange::create($validated);

        return response()->json([
            'message' => 'Requirement change recorded successfully',
            'data' => $change->load('clientRequirement', 'requester', 'approver'),
        ], 201);
    }

    public function close(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'final_status' => 'required|string|max:50',
            'remarks' => 'nullable|string',
            'closure_date' => 'nullable|date',
        ]);

        $project->status = 'closed';
        $project->save();

        $closure = ProjectClosure::updateOrCreate(
            ['project_id' => $project->id],
            [
                'closed_by' => $this->currentUserId($request) ?? $request->user()?->id,
                'closure_date' => $validated['closure_date'] ?? now(),
                'final_status' => $validated['final_status'],
                'remarks' => $validated['remarks'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Project closed successfully',
            'data' => $closure->load('closer'),
        ]);
    }
}
