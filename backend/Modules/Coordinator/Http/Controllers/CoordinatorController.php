<?php

namespace Modules\Coordinator\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ClientRequirement;
use Modules\Coordinator\Models\ProjectClosure;
use Modules\Coordinator\Models\ProjectFaculty;
use Modules\Coordinator\Models\ProjectStudent;
use Modules\Coordinator\Models\RequirementChange;
use Modules\Project\Models\Module;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;

class CoordinatorController extends Controller
{
    protected function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    protected function isAuthorized(Request $request, array $requiredPermissions = ['view-coordinator']): bool
    {
        $role = $request->auth_user['role'] ?? null;
        if ($role === 'coordinator') {
            return true;
        }

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
            'modules.students:id,name,email',
            'requirements',
            'closure',
        ])->latest()->get();

        $projects->each(function (Project $project) {
            $project->requirements_text = $project->getOriginal('requirements');
        });

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
            'modules.students:id,name,email',
            'requirements.uploader',
            'requirementChanges.requester',
            'closure.closer',
            'certificates.student',
            'certificates.module',
        ]);

        $project->requirements_text = $project->getOriginal('requirements');

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
            'contact_phone' => ['nullable', 'regex:/^[0-9+\-\s()]{7,20}$/'],
            'requirements' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'expected_timeline' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'priority' => 'required|in:normal,urgent',
        ]);

        $validated['created_by'] = $this->currentUserId($request) ?? $request->user()?->id;
        if (!$validated['created_by']) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        // New project proposals always start as 'proposed' — the Coordinator/creation
        // endpoint must never trust a client-supplied status. Director review is what
        // moves a project to accepted/rejected (see DashboardController::updateProposalStatus).
        $validated['status'] = 'proposed';

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

        $student = User::find($validated['student_id']);
        if (!$student || $student->role !== 'student') {
            return response()->json(['error' => 'Selected user is not a student'], 422);
        }

        $alreadyOnThisProject = DB::table('project_student')
            ->where('project_id', $project->id)
            ->where('student_id', $validated['student_id'])
            ->exists();
        if ($alreadyOnThisProject) {
            return response()->json(['error' => 'Student is already assigned to this project'], 422);
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

    /**
     * Students eligible to be (newly) assigned to a project: role = student, and not
     * already on THAT project (a student may belong to multiple different projects,
     * so only same-project duplicates are excluded). Pass ?project_id= to scope the
     * exclusion; without it, only role is filtered.
     */
    public function eligibleStudents(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-student'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $query = User::where('role', 'student');

        $projectId = $request->query('project_id');
        if ($projectId) {
            $alreadyOnProject = DB::table('project_student')->where('project_id', $projectId)->pluck('student_id');
            $query->whereNotIn('id', $alreadyOnProject);
        }

        $students = $query->orderBy('name')->get(['id', 'name', 'email']);

        return response()->json(['data' => $students]);
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

    // Faculty assignment/removal intentionally has no Coordinator endpoint — that is a
    // Director responsibility (Modules\Dashboard\Controllers\DashboardController::assignFaculty).
    // The Project::faculty() relationship and project_faculty table remain untouched and
    // are still used above (index/show) to let the Coordinator VIEW assigned faculty.

    /**
     * Assign a student to a module (module_student). The student must already be
     * assigned to the module's parent project via project_student.
     */
    public function assignStudentToModule(Request $request, Project $project, Module $module)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ((int) $module->project_id !== (int) $project->id) {
            return response()->json(['error' => 'Selected module does not belong to this project'], 422);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'assigned_date' => 'nullable|date',
        ]);

        $onProject = $project->students()->where('student_id', $validated['student_id'])->exists();
        if (!$onProject) {
            return response()->json(['error' => 'Student must be assigned to this project before being assigned to a module'], 422);
        }

        if ($module->students()->where('student_id', $validated['student_id'])->exists()) {
            return response()->json(['error' => 'Student is already assigned to this module'], 422);
        }

        $module->students()->attach($validated['student_id'], [
            'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
        ]);

        $record = $module->students()->where('users.id', $validated['student_id'])->first();

        return response()->json([
            'message' => 'Student assigned to module successfully',
            'data' => $record,
        ], 201);
    }

    public function storeModule(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'module_name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'weight_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:not_started,in_progress,completed',
        ]);

        $module = Module::create([
            'project_id' => $project->id,
            'module_name' => $validated['module_name'],
            'description' => $validated['description'] ?? null,
            'weight_percentage' => $validated['weight_percentage'] ?? null,
            'status' => $validated['status'] ?? 'not_started',
            'created_by' => $this->currentUserId($request) ?? $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Module created successfully',
            'data' => $module,
        ], 201);
    }

    public function updateModule(Request $request, Project $project, Module $module)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ((int) $module->project_id !== (int) $project->id) {
            return response()->json(['error' => 'Selected module does not belong to this project'], 422);
        }

        $validated = $request->validate([
            'module_name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'weight_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'sometimes|required|in:not_started,in_progress,completed',
        ]);

        $module->update($validated);

        return response()->json([
            'message' => 'Module updated successfully',
            'data' => $module->fresh(),
        ]);
    }

    public function storeTask(Request $request, Project $project, Module $module)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ((int) $module->project_id !== (int) $project->id) {
            return response()->json(['error' => 'Selected module does not belong to this project'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
            'status' => 'nullable|in:todo,in_progress,completed,blocked',
            'due_date' => 'nullable|date',
        ]);

        $assigneeOnProject = $project->students()->where('users.id', $validated['assigned_to'])->exists();
        if (!$assigneeOnProject) {
            return response()->json(['error' => 'Task can only be assigned to a student already assigned to this project'], 422);
        }

        $task = Task::create([
            'module_id' => $module->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'],
            'status' => $validated['status'] ?? 'todo',
            'due_date' => $validated['due_date'] ?? null,
            'created_by' => $this->currentUserId($request) ?? $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Task created successfully',
            'data' => $task,
        ], 201);
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
            'task_id' => 'required|integer|exists:tasks,id',
            'description' => 'required|string',
            'document_path' => 'nullable|string|max:500',
            'uploaded_on' => 'nullable|date',
        ]);

        $taskBelongsToProject = Task::where('id', $validated['task_id'])
            ->whereHas('module', function ($query) use ($project) {
                $query->where('project_id', $project->id);
            })->exists();

        if (!$taskBelongsToProject) {
            return response()->json(['error' => 'Selected task does not belong to this project'], 422);
        }

        $requirement = ClientRequirement::create([
            'project_id' => $project->id,
            'task_id' => $validated['task_id'],
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
            'new_description' => 'nullable|string',
            'change_description' => 'required|string',
            'reason' => 'nullable|string',
            'new_document_path' => 'nullable|string|max:500',
            'changed_on' => 'nullable|date',
        ]);

        $requirement = ClientRequirement::where('id', $validated['client_requirement_id'])
            ->where('project_id', $project->id)
            ->first();

        if (!$requirement) {
            return response()->json(['error' => 'Selected requirement does not belong to this project'], 422);
        }

        // Approval fields are never trusted from the client — this endpoint only records
        // a pending change request; approval is a separate workflow.
        $change = RequirementChange::create([
            'client_requirement_id' => $requirement->id,
            'project_id' => $project->id,
            'previous_description' => $requirement->description,
            'new_description' => $validated['new_description'] ?? null,
            'change_description' => $validated['change_description'],
            'reason' => $validated['reason'] ?? null,
            'previous_document_path' => $requirement->document_path,
            'new_document_path' => $validated['new_document_path'] ?? null,
            'requested_by' => $this->currentUserId($request) ?? $request->user()?->id,
            'status' => 'pending',
            'approved_by' => null,
            'approved_at' => null,
            'changed_on' => $validated['changed_on'] ?? now(),
        ]);

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

    public function students(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-student'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $users = DB::table('users')->where('role', 'student')->orderBy('name')->get();

        $assignmentsByStudent = DB::table('project_student')
            ->join('projects', 'projects.id', '=', 'project_student.project_id')
            ->select(
                'project_student.student_id',
                'project_student.role',
                'project_student.assigned_date',
                'projects.id as project_id',
                'projects.title as project_title'
            )
            ->get()
            ->groupBy('student_id');

        $students = $users->map(function ($user) use ($assignmentsByStudent) {
            $assignments = ($assignmentsByStudent->get($user->id) ?? collect())->map(function ($a) {
                return [
                    'project_id' => $a->project_id,
                    'project_title' => $a->project_title,
                    'designation' => ucwords(str_replace('_', ' ', $a->role)),
                    'assigned_date' => $a->assigned_date,
                ];
            })->values();

            $primary = $assignments->first();

            return [
                'id' => 'RLZ' . str_pad($user->id, 3, '0', STR_PAD_LEFT),
                'db_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'project' => $primary['project_title'] ?? 'Unassigned',
                'designation' => $primary['designation'] ?? '—',
                'assigned_date' => $primary['assigned_date'] ?? null,
                'assignments' => $assignments,
                'status' => $assignments->isEmpty() ? 'Unassigned' : 'Active',
            ];
        });

        return response()->json(['data' => $students]);
    }

    public function faculty(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-projects'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $users = DB::table('users')
            ->whereIn('role', ['faculty', 'director', 'coordinator'])
            ->orderBy('name')
            ->get();

        $faculty = $users->map(function ($user) {
            $profile = DB::table('faculty_profiles')->where('faculty_id', $user->id)->first();

            return [
                'id' => $user->id,
                'db_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $profile->department ?? null,
                'designation' => $profile->designation ?? null,
            ];
        });

        return response()->json(['data' => $faculty]);
    }

    /**
     * Create a brand-new student user account (users table only — no project_student
     * write, no student_profiles write). Separate from assignStudent(), which attaches
     * an EXISTING student to a project.
     */
    public function storeStudent(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-student'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|digits:10',
        ]);

        $userId = DB::table('users')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => 'student',
            'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = DB::table('users')->where('id', $userId)->first(['id', 'name', 'email', 'phone', 'role']);

        return response()->json([
            'message' => 'Student created successfully',
            'data' => $user,
        ], 201);
    }

    public function meetings(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-communication'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $meetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->select(
                'meetings.id',
                'meetings.title',
                'projects.title as project',
                'meetings.scheduled_at',
                'meetings.location',
                'meetings.meeting_link',
                'meetings.agenda',
                'meetings.status'
            )
            ->orderBy('meetings.scheduled_at', 'desc')
            ->get()
            ->map(function ($m) {
                $dt = new \DateTime($m->scheduled_at);
                return [
                    'id' => $m->id,
                    'date' => $dt->format('d M Y'),
                    'time' => $dt->format('h:i A'),
                    'title' => $m->title,
                    'project' => $m->project,
                    'location' => $m->location,
                    'meeting_link' => $m->meeting_link,
                    'agenda' => $m->agenda,
                    'participants' => 'Coordinator, Students',
                    'status' => ucfirst($m->status),
                ];
            });

        return response()->json(['data' => $meetings]);
    }

    public function storeMeeting(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-communication'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project' => 'required|string',
            'date' => 'required|date',
            'time' => 'required|string',
            'participants' => 'nullable|string',
            'agenda' => 'nullable|string',
            'meeting_link' => 'nullable|string|max:500',
        ]);

        $proj = Project::where('title', $validated['project'])->first();
        if (!$proj) {
            return response()->json(['error' => 'Selected project not found'], 404);
        }

        $scheduledAt = date('Y-m-d H:i:s', strtotime($validated['date'] . ' ' . $validated['time']));

        $meetingId = DB::table('meetings')->insertGetId([
            'project_id' => $proj->id,
            'title' => $validated['title'],
            'scheduled_at' => $scheduledAt,
            'agenda' => $validated['agenda'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
            'status' => 'scheduled',
            'created_by' => $this->currentUserId($request) ?? $request->user()?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $dt = new \DateTime($scheduledAt);

        return response()->json([
            'message' => 'Meeting scheduled successfully',
            'data' => [
                'id' => $meetingId,
                'date' => $dt->format('d M Y'),
                'time' => $dt->format('h:i A'),
                'title' => $validated['title'],
                'project' => $proj->title,
                'meeting_link' => $validated['meeting_link'] ?? null,
                'participants' => $validated['participants'] ?? 'Coordinator, Students',
                'status' => 'Scheduled',
            ],
        ], 201);
    }
}
