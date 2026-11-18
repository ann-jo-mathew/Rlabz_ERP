<?php

namespace Modules\Coordinator\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ClientRequirement;
use Modules\Coordinator\Models\ProjectClosure;
use Modules\Coordinator\Models\ProjectFaculty;
use Modules\Coordinator\Models\ProjectStudent;
use Modules\Coordinator\Models\RequirementChange;
use Modules\Coordinator\Models\StudentRole;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Modules\Student\Models\StudentReport;

class CoordinatorController extends Controller
{
    /** Roles the coordinator's Assign Student flow can set (project_student.role / student_roles.role). */
    private const ASSIGNABLE_STUDENT_ROLES = ['nova', 'orbit', 'spark'];

    protected function currentUserId(?Request $request = null): ?int
    {
        $request = $request ?: request();
        if (!$request) return null;

        if (isset($request->auth_user['sub'])) {
            return (int) $request->auth_user['sub'];
        }

        $token = $request->bearerToken() ?: $request->query('token');
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                if (isset($payload['sub'])) {
                    return (int) $payload['sub'];
                }
            }
        }

        if ($request->filled('user_id')) {
            return (int) $request->input('user_id');
        }

        return DB::table('users')->where('role', 'coordinator')->value('id');
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

        // Matches Modules\Faculty\Http\Controllers\FacultyController::getDashboardData()'s
        // progress formula exactly: completed tasks / total tasks across all of the
        // project's modules, rounded to a whole percent (no decimals) — same data
        // source (modules.tasks), same ratio, same rounding.
        $completion = $taskCount > 0 ? round(($completedTaskCount / $taskCount) * 100) : 0;

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

        $perPage = (int) $request->input('per_page', 20);
        $paginator = Project::with([
            'creator',
            'students:id,name,email',
            'faculty:id,name,email',
            'modules.tasks',
            'modules.students:id,name,email',
            'requirements',
            'closure',
        ])->latest()->paginate($perPage);

        $projects = collect($paginator->items());
        $projects->each(function (Project $project) {
            $project->requirements_text = $project->getOriginal('requirements');
        });

        return response()->json([
            'data' => $projects,
            'count' => $paginator->total(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
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
            'source_type' => 'required|in:faculty,student,alumni,institution,external,other',
            // brought_by doubles as the "please specify source" text when source_type is
            // 'other' (reusing the existing free-text column rather than adding a new one)
            // and is required in that case.
            'brought_by' => 'required_if:source_type,other|nullable|string|max:150',
            'client_name' => 'nullable|string|max:150',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => ['nullable', 'regex:/^[0-9+\-\s()]{7,20}$/'],
            'requirements' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'expected_timeline' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'priority' => 'required|in:normal,urgent',
            'drive_link' => 'nullable|string|max:2048',
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
            'role' => 'required|in:' . implode(',', self::ASSIGNABLE_STUDENT_ROLES),
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

        // A student's project role is global (set once, reused everywhere) — see
        // StudentRole. If they already have one, it overrides whatever was submitted;
        // a mismatched submission is rejected rather than silently accepted.
        // Exception: a legacy role (project_lead/developer/designer/tester/other)
        // can no longer be chosen in Assign Student, so it would block the student
        // from ever being assigned again — it is replaced by the submitted
        // Nova/Orbit/Spark role instead. Existing project_student rows are untouched.
        $existingRole = StudentRole::where('student_id', $validated['student_id'])->first();
        if ($existingRole && !in_array($existingRole->role, self::ASSIGNABLE_STUDENT_ROLES, true)) {
            $existingRole->update(['role' => $validated['role']]);
        }
        if ($existingRole && $existingRole->role !== $validated['role']) {
            $label = ucwords(str_replace('_', ' ', $existingRole->role));
            return response()->json([
                'error' => "This student's role is already set to \"{$label}\" and cannot be changed by assigning them to a new project.",
            ], 422);
        }
        if (!$existingRole) {
            StudentRole::create([
                'student_id' => $validated['student_id'],
                'role' => $validated['role'],
            ]);
        }

        $project->students()->attach($validated['student_id'], [
            'role' => $validated['role'],
            'assigned_date' => $validated['assigned_date'] ?? now()->toDateString(),
        ]);

        if (Schema::hasTable('notifications')) {
            $roleLabel = ucfirst(str_replace('_', ' ', $validated['role']));
            DB::table('notifications')->insert([
                'user_id' => $validated['student_id'],
                'type' => 'project_assigned',
                'message' => "Coordinator assigned you to project '{$project->title}' as {$roleLabel}.",
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

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

        // Surface each student's existing global role (if any) so the assignment UI
        // can lock the role picker before submission instead of only finding out
        // via a validation error after the coordinator picks a conflicting one.
        $existingRoles = StudentRole::whereIn('student_id', $students->pluck('id'))
            ->pluck('role', 'student_id');

        $students->each(function ($student) use ($existingRoles) {
            $student->existing_role = $existingRoles->get($student->id);
        });

        return response()->json(['data' => $students]);
    }

    /**
     * The given student's current (non-closed, non-rejected) project
     * assignments — a student can be on more than one project at once, so
     * this returns an array, not a single project. "Current" mirrors the
     * same definition CoordinatorHome.js already uses for "active projects"
     * (status in proposed/accepted/in_progress). Used by the Assign Student
     * side panel so the coordinator can see what a student is already
     * working on before assigning them to something new.
     */
    public function studentCurrentProjects(Request $request, $studentId)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-student'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $projects = DB::table('project_student')
            ->join('projects', 'projects.id', '=', 'project_student.project_id')
            ->where('project_student.student_id', $studentId)
            ->whereIn('projects.status', ['proposed', 'accepted', 'in_progress'])
            ->select(
                'projects.id',
                'projects.title',
                'projects.client_name',
                'projects.status',
                'project_student.role',
                'project_student.assigned_date'
            )
            ->orderBy('project_student.assigned_date', 'desc')
            ->get();

        return response()->json(['data' => $projects]);
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

    // Module/task creation, editing, and student-to-module assignment (previously
    // storeModule/updateModule/assignStudentToModule/storeTask) have been removed —
    // that is a Faculty responsibility (Modules\Faculty\Http\Controllers\FacultyController,
    // which owns module_student and task assignment). Their routes were also removed
    // from Modules\Coordinator\Routes\api.php, so this isn't just a hidden UI control —
    // the endpoints no longer exist for the Coordinator. Read-only access to module/task
    // data (module status, tasks, assigned students) is preserved via GET
    // /coordinator/projects/{project} (show(), which eager-loads modules.tasks and
    // modules.students below).

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

        $changes = RequirementChange::whereHas('clientRequirement', function ($query) use ($project) {
            $query->where('project_id', $project->id);
        })->with(['clientRequirement', 'requester', 'approver'])
          ->latest('created_at')
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

        $userId = $this->currentUserId($request) ?? $request->user()?->id;
        if (!$userId) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        $change = RequirementChange::create([
            'client_requirement_id' => $requirement->id,
            'previous_value' => json_encode($requirement),
            'updated_value' => json_encode($validated),
            'changed_by' => $userId,
        ]);

        return response()->json([
            'message' => 'Requirement change recorded successfully',
            'data' => $change->load('clientRequirement', 'requester', 'approver'),
        ], 201);
    }

    public function start(Request $request, Project $project)
    {
        // Starting a project is a coordinator action. 'view-projects' is deliberately not
        // accepted here (unlike read endpoints) because students also hold that permission.
        if (!$this->isAuthorized($request, ['view-coordinator'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Only accepted → in_progress is allowed. The status check is part of the UPDATE
        // itself, so a concurrent rejection/start cannot slip in between check and write.
        $updated = Project::where('id', $project->id)
            ->where('status', 'accepted')
            ->update(['status' => 'in_progress']);

        if (!$updated) {
            $currentStatus = Project::where('id', $project->id)->value('status');
            return response()->json([
                'error' => "Only an 'accepted' project can be started (current status: {$currentStatus})",
            ], 422);
        }

        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'user_id' => $this->currentUserId($request),
                'action' => 'Project Started',
                'description' => "Project \"{$project->title}\" (ID: {$project->id}) started by Coordinator — status changed to in_progress.",
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Project started successfully',
            'data' => $project->fresh(),
        ]);
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
                'projects.title as project_title',
                'projects.status as project_status'
            )
            ->get()
            ->groupBy('student_id');

        // "Current" assignment = same definition as studentCurrentProjects() and
        // CoordinatorHome's active projects: project status proposed/accepted/in_progress.
        $currentStatuses = ['proposed', 'accepted', 'in_progress'];

        $students = $users->map(function ($user) use ($assignmentsByStudent, $currentStatuses) {
            $assignments = ($assignmentsByStudent->get($user->id) ?? collect())->map(function ($a) use ($currentStatuses) {
                return [
                    'project_id' => $a->project_id,
                    'project_title' => $a->project_title,
                    'project_status' => $a->project_status,
                    'is_current' => in_array($a->project_status, $currentStatuses, true),
                    'designation' => ucwords(str_replace('_', ' ', $a->role)),
                    'assigned_date' => $a->assigned_date,
                ];
            })->values();

            $primary = $assignments->first();
            $hasCurrentAssignment = $assignments->contains('is_current', true);

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
                'status' => $hasCurrentAssignment ? 'Active' : 'Unassigned',
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
            ->whereIn('role', ['faculty', 'director', 'coordinator', 'developer'])
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
            // leftJoin (not join): meetings without a project must still be listed.
            ->leftJoin('projects', 'projects.id', '=', 'meetings.project_id')
            ->select(
                'meetings.id',
                'meetings.title',
                'meetings.meeting_type',
                'projects.title as project',
                'meetings.scheduled_at',
                'meetings.location',
                'meetings.mode',
                'meetings.meeting_link',
                'meetings.agenda',
                'meetings.status'
            )
            ->orderBy('meetings.scheduled_at', 'desc')
            ->get()
            ->map(function ($m) {
                $dt = new \DateTime($m->scheduled_at);

                $notes = null;
                if (strtolower($m->status) === 'completed' && Schema::hasTable('meeting_notes')) {
                    $notes = DB::table('meeting_notes')
                        ->where('meeting_id', $m->id)
                        ->latest('id')
                        ->first();
                }

                return [
                    'id' => $m->id,
                    'date' => $dt->format('d M Y'),
                    'time' => $dt->format('h:i A'),
                    'title' => $m->title,
                    'meeting_type' => $m->meeting_type,
                    'project' => $m->project,
                    'location' => $m->location,
                    'mode' => $m->mode,
                    'meeting_link' => $m->meeting_link,
                    'agenda' => $m->agenda,
                    'participants' => 'Coordinator, Students',
                    'status' => ucfirst($m->status),
                    'minutes' => $notes->minutes ?? null,
                    'important_decisions' => $notes->important_decisions ?? null,
                    'uploaded_by' => $notes->uploaded_by ?? null,
                    'uploaded_on' => $notes->uploaded_on ?? null,
                ];
            });

        return response()->json(['data' => $meetings]);
    }

    public function storeMeeting(Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-communication'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // A link only belongs to an Online meeting — drop any stale value left over
        // from switching the form from Online to Offline before it is validated or saved.
        if ($request->input('mode') !== 'Online') {
            $request->merge(['meeting_link' => null]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project' => 'nullable|string',
            'meeting_type' => 'nullable|string|in:Faculty Meeting,Project Presentation',
            'date' => 'required|date',
            'time' => 'required|string',
            'participants' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'mode' => 'nullable|string|in:Offline,Online',
            'agenda' => 'nullable|string',
            // Optional for all meetings (not compulsory); if provided, must be a valid http/https URL.
            'meeting_link' => ['nullable', 'string', 'max:500', 'url', 'regex:/^https?:\/\//i'],
        ], [
            'meeting_link.url' => 'The meeting link must be a valid http:// or https:// URL.',
            'meeting_link.regex' => 'The meeting link must be a valid http:// or https:// URL.',
        ]);

        $proj = null;
        if (!empty($validated['project'])) {
            $proj = Project::where('title', $validated['project'])->first();
            if (!$proj) {
                return response()->json(['error' => 'Selected project not found'], 404);
            }
        }

        $scheduledAt = date('Y-m-d H:i:s', strtotime($validated['date'] . ' ' . $validated['time']));

        $meetingId = DB::table('meetings')->insertGetId([
            'project_id' => $proj?->id,
            'title' => $validated['title'],
            'meeting_type' => $validated['meeting_type'] ?? null,
            'scheduled_at' => $scheduledAt,
            'location' => $validated['location'] ?? null,
            'mode' => $validated['mode'] ?? null,
            'agenda' => $validated['agenda'] ?? null,
            'meeting_link' => ($validated['mode'] ?? null) === 'Offline' ? null : ($validated['meeting_link'] ?? null),
            'status' => 'scheduled',
            'created_by' => $this->currentUserId($request) ?? $request->user()?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automatically invite and notify students of the project (only when a
        // project is attached — a project-less meeting has no student roster to notify).
        if ($proj) {
            $studentIds = DB::table('project_student')
                ->where('project_id', $proj->id)
                ->pluck('student_id');

            if (Schema::hasTable('meeting_participants')) {
                foreach ($studentIds as $sId) {
                    DB::table('meeting_participants')->insert([
                        'meeting_id' => $meetingId,
                        'user_id' => $sId,
                        'attendance_status' => 'invited',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            if (Schema::hasTable('notifications')) {
                $formattedTime = date('M j, Y g:i A', strtotime($scheduledAt));
                foreach ($studentIds as $sId) {
                    DB::table('notifications')->insert([
                        'user_id' => $sId,
                        'type' => 'meeting_scheduled',
                        'message' => "New meeting scheduled by Coordinator for project '{$proj->title}': '{$validated['title']}' on {$formattedTime}.",
                        'is_read' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $dt = new \DateTime($scheduledAt);

        return response()->json([
            'message' => 'Meeting scheduled successfully',
            'data' => [
                'id' => $meetingId,
                'date' => $dt->format('d M Y'),
                'time' => $dt->format('h:i A'),
                'title' => $validated['title'],
                'meeting_type' => $validated['meeting_type'] ?? null,
                'project' => $proj?->title,
                'location' => $validated['location'] ?? null,
                'mode' => $validated['mode'] ?? null,
                'meeting_link' => $validated['meeting_link'] ?? null,
                'participants' => $validated['participants'] ?? 'Coordinator, Students',
                'status' => 'Scheduled',
            ],
        ], 201);
    }

    /**
     * Update meeting status when meeting date is over:
     * - 'completed': enters minutes and important_decisions into meeting_notes table.
     * - 'cancelled': just updates status, no meeting_notes entry.
     */
    public function updateMeetingStatus($id, Request $request)
    {
        if (!$this->isAuthorized($request, ['view-coordinator', 'view-communication'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:completed,cancelled',
            'minutes' => 'nullable|string',
            'important_decisions' => 'nullable|string',
        ]);

        $meeting = DB::table('meetings')->where('id', $id)->first();
        if (!$meeting) {
            return response()->json(['error' => 'Meeting not found.'], 404);
        }

        $newStatus = $validated['status'];

        if ($newStatus === 'completed') {
            $minutes = trim($validated['minutes'] ?? '');
            $decisions = trim($validated['important_decisions'] ?? '');
            if (empty($minutes) || empty($decisions)) {
                return response()->json([
                    'error' => 'Please provide both minutes of meeting and important decisions to mark as completed.'
                ], 422);
            }

            DB::table('meetings')->where('id', $id)->update([
                'status' => 'completed',
                'updated_at' => now(),
            ]);

            if (Schema::hasTable('meeting_notes')) {
                DB::table('meeting_notes')->insert([
                    'meeting_id' => $id,
                    'minutes' => $minutes,
                    'important_decisions' => $decisions,
                    'uploaded_by' => $this->currentUserId($request) ?? $request->user()?->id,
                    'uploaded_on' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Meeting status updated to completed and notes saved.',
                'status' => 'completed',
                'minutes' => $minutes,
                'important_decisions' => $decisions,
            ]);
        }

        DB::table('meetings')->where('id', $id)->update([
            'status' => 'cancelled',
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Meeting status updated to cancelled.',
            'status' => 'cancelled',
        ]);
    }

    /**

     * List student daily/weekly reports, optionally filtered by project, student,
     * report type, approval status, and date range. Coordinators are global in this
     * app (no per-coordinator project assignment table exists — every other
     * coordinator endpoint is unscoped the same way), so this intentionally returns
     * across all projects rather than a restricted subset.
     */
    public function reports(Request $request)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $query = DB::table('student_reports')
            ->leftJoin('projects', 'projects.id', '=', 'student_reports.project_id')
            ->leftJoin('users', 'users.id', '=', 'student_reports.student_id');

        if ($request->filled('project_id')) {
            $query->where('student_reports.project_id', $request->input('project_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_reports.student_id', $request->input('student_id'));
        }
        if ($request->filled('report_type')) {
            $query->where('student_reports.report_type', strtolower($request->input('report_type')));
        }
        if ($request->filled('status')) {
            $query->where('student_reports.approval_status', strtolower($request->input('status')));
        }
        if ($request->filled('date_from')) {
            $query->where('student_reports.report_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('student_reports.report_date', '<=', $request->input('date_to'));
        }

        $reports = $query->select(
            'student_reports.id',
            'student_reports.project_id',
            'projects.title as project_title',
            'student_reports.student_id',
            'users.name as student_name',
            'users.email as student_email',
            'student_reports.report_type',
            'student_reports.report_date',
            'student_reports.week_start',
            'student_reports.week_end',
            'student_reports.work_done',
            'student_reports.tasks_completed',
            'student_reports.next_plan',
            'student_reports.challenges',
            'student_reports.remarks',
            'student_reports.hours_worked',
            'student_reports.report_file',
            'student_reports.approval_status',
            'student_reports.feedback',
            'student_reports.submitted_at'
        )
        ->orderBy('student_reports.submitted_at', 'desc')
        ->get()
        ->map(function ($r) {
            $fileName = $r->report_file ? basename($r->report_file) : null;

            $dailyCount = null;
            if (strtolower($r->report_type) === 'weekly' && $r->week_start && $r->week_end) {
                $dailyCount = DB::table('student_reports')
                    ->where('student_id', $r->student_id)
                    ->where('project_id', $r->project_id)
                    ->where('report_type', 'daily')
                    ->whereBetween('report_date', [$r->week_start, $r->week_end])
                    ->count();
            }

            return [
                'id' => $r->id,
                'project_id' => $r->project_id,
                'project_title' => $r->project_title ?: 'General Project',
                'student_id' => $r->student_id,
                'student_name' => $r->student_name ?: 'Student',
                'student_email' => $r->student_email ?: '',
                'report_type' => ucfirst($r->report_type),
                'report_date' => $r->report_date,
                'week_start' => $r->week_start,
                'week_end' => $r->week_end,
                'daily_report_count' => $dailyCount,
                'work_done' => $r->work_done,
                'tasks_completed' => $r->tasks_completed,
                'pending_work' => $r->next_plan,
                'blockers' => $r->challenges,
                'remarks' => $r->remarks,
                'hours_worked' => $r->hours_worked !== null ? (float) $r->hours_worked : null,
                'approval_status' => ucfirst($r->approval_status ?: 'pending'),
                'feedback' => $r->feedback,
                'submitted_at' => $r->submitted_at,
                'report_file' => $r->report_file,
                'file_name' => $fileName,
                'file_url' => $r->report_file ? asset('storage/' . $r->report_file) : null,
                'download_url' => $r->report_file ? url('api/coordinator/reports/' . $r->id . '/download') : null,
            ];
        });

        return response()->json($reports);
    }

    /**
     * Approve/reject/reset a student daily or weekly report, with optional remarks.
     * Mirrors FacultyController::reviewReport() exactly.
     */
    public function reviewReport(Request $request, $id)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected,pending,Approved,Rejected,Pending',
            'feedback' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $report = DB::table('student_reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['error' => 'Student report not found.'], 404);
        }

        $statusLower = strtolower($request->input('status'));

        DB::table('student_reports')->where('id', $id)->update([
            'approval_status' => $statusLower,
            'feedback' => $request->filled('feedback') ? $request->input('feedback') : $report->feedback,
            'updated_at' => now(),
        ]);

        if (Schema::hasTable('notifications')) {
            $statusText = ucfirst($statusLower);
            $reportType = ucfirst($report->report_type);
            $msg = "Your {$reportType} Report for {$report->report_date} was {$statusText} by your coordinator.";
            if ($request->filled('feedback')) {
                $msg .= " Feedback: " . $request->input('feedback');
            }

            DB::table('notifications')->insert([
                'user_id' => $report->student_id,
                'type' => 'report_review',
                'message' => $msg,
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Report status updated successfully.',
            'status' => ucfirst($statusLower),
            'feedback' => $request->input('feedback') ?: $report->feedback,
        ]);
    }

    /**
     * Download a report's attached file. Mirrors Faculty/Student downloadReportFile().
     */
    public function downloadReportFile(Request $request, $id)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $report = DB::table('student_reports')->where('id', $id)->first();
        if (!$report || !$report->report_file) {
            return response()->json(['error' => 'Report file not found'], 404);
        }

        if (!Storage::disk('public')->exists($report->report_file)) {
            return response()->json(['error' => 'File not found on storage'], 404);
        }

        $filePath = Storage::disk('public')->path($report->report_file);
        $ext = pathinfo($report->report_file, PATHINFO_EXTENSION);
        $studentName = DB::table('users')->where('id', $report->student_id)->value('name') ?: 'Student';
        $safeStudentName = preg_replace('/[^A-Za-z0-9_]/', '_', $studentName);
        $downloadName = "Report_{$safeStudentName}_{$report->report_date}_{$report->id}.{$ext}";

        return response()->download($filePath, $downloadName);
    }

    /**
     * Explicitly generate (or refresh) a weekly report for a chosen student/project/
     * week from their real daily reports. Reuses StudentReport::syncWeekly() — the
     * same function the automatic per-submission rollup uses — so manual and
     * automatic generation can never produce conflicting/duplicate weekly rows
     * (enforced by the unique weekly_key constraint).
     */
    public function generateWeeklyReport(Request $request)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'student_id' => 'required|integer|exists:users,id',
            'project_id' => 'required|integer|exists:projects,id',
            'week_start' => 'required|date',
            'week_end' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $studentId = (int) $request->input('student_id');
        $projectId = (int) $request->input('project_id');
        $canonicalWeekStart = Carbon::parse($request->input('week_start'))->startOfWeek(Carbon::MONDAY);
        $canonicalWeekEnd = $canonicalWeekStart->copy()->endOfWeek(Carbon::SUNDAY);

        if ($request->filled('week_end')) {
            $requestedWeekEnd = Carbon::parse($request->input('week_end'))->toDateString();
            if ($requestedWeekEnd !== $canonicalWeekEnd->toDateString()) {
                return response()->json([
                    'error' => "Weeks must run Monday to Sunday. For week_start {$canonicalWeekStart->toDateString()}, week_end must be {$canonicalWeekEnd->toDateString()}."
                ], 422);
            }
        }

        $isAssigned = DB::table('project_student')
            ->where('project_id', $projectId)
            ->where('student_id', $studentId)
            ->exists();
        if (!$isAssigned) {
            return response()->json(['error' => 'Selected student is not assigned to this project.'], 422);
        }

        $weekly = StudentReport::syncWeekly($studentId, $projectId, $canonicalWeekStart->toDateString());

        if (!$weekly) {
            return response()->json([
                'success' => false,
                'message' => "No daily reports found for this student/project between {$canonicalWeekStart->toDateString()} and {$canonicalWeekEnd->toDateString()}.",
            ]);
        }

        $dailyCount = DB::table('student_reports')
            ->where('student_id', $studentId)
            ->where('project_id', $projectId)
            ->where('report_type', 'daily')
            ->whereBetween('report_date', [$canonicalWeekStart->toDateString(), $canonicalWeekEnd->toDateString()])
            ->count();

        return response()->json([
            'success' => true,
            'message' => "Weekly report generated from {$dailyCount} daily report(s).",
            'data' => [
                'id' => $weekly->id,
                'student_id' => $weekly->student_id,
                'project_id' => $weekly->project_id,
                'week_start' => $weekly->week_start,
                'week_end' => $weekly->week_end,
                'daily_report_count' => $dailyCount,
                'work_done' => $weekly->work_done,
                'tasks_completed' => $weekly->tasks_completed,
                'pending_work' => $weekly->next_plan,
                'blockers' => $weekly->challenges,
                'remarks' => $weekly->remarks,
                'hours_worked' => $weekly->hours_worked !== null ? (float) $weekly->hours_worked : null,
                'approval_status' => ucfirst($weekly->approval_status ?: 'pending'),
            ],
        ]);
    }

    /**
     * Get notifications for the logged-in coordinator.
     */
    public function getNotifications(Request $request)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notifications = DB::table('notifications')
            ->leftJoin('projects', 'projects.id', '=', 'notifications.project_id')
            ->where('notifications.user_id', $userId)
            ->select(
                'notifications.*',
                'projects.title as project_title'
            )
            ->orderBy('notifications.created_at', 'desc')
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'user_id' => $n->user_id,
                    'project_id' => $n->project_id,
                    'project_title' => $n->project_title,
                    'type' => $n->type,
                    'urgency' => $n->urgency ?? 'normal',
                    'title' => $n->type ? ucwords(str_replace('_', ' ', $n->type)) : 'Notification',
                    'description' => $n->message,
                    'message' => $n->message,
                    'is_read' => (bool) $n->is_read,
                    'unread' => empty($n->is_read) || $n->is_read == 0,
                    'time' => $n->created_at ? date('M d, Y h:i A', strtotime($n->created_at)) : 'Recently',
                    'created_at' => $n->created_at,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
            'unread_count' => $notifications->where('unread', true)->count(),
        ]);
    }

    /**
     * Mark a single notification as read for coordinator.
     */
    public function markNotificationRead($id, Request $request)
    {
        $userId = $this->currentUserId($request);
        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $userId)
            ->update([
                'is_read' => 1,
                'updated_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read for coordinator.
     */
    public function markAllNotificationsRead(Request $request)
    {
        $userId = $this->currentUserId($request);
        DB::table('notifications')
            ->where('user_id', $userId)
            ->update([
                'is_read' => 1,
                'updated_at' => now(),
            ]);

        return response()->json(['success' => true]);

    }

    /**
     * The authenticated coordinator's own profile details. Mirrors Faculty's
     * getProfile() pattern (Modules\Faculty\Http\Controllers\FacultyController),
     * but there is no coordinator-equivalent side table (no department/
     * designation concept for this role in the current schema), so this is
     * users-table fields only — nothing invented beyond what's there.
     */
    public function getProfile(Request $request)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = DB::table('users')
            ->where('id', $userId)
            ->select('id', 'name', 'email', 'phone', 'role', 'created_at')
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Coordinator user not found'], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => ucfirst($user->role),
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * Update the authenticated coordinator's own name/email/phone. role and
     * permissions are intentionally never accepted here — those stay
     * controller-assigned, not self-editable.
     */
    public function updateProfile(Request $request)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json(['error' => 'Coordinator user not found'], 404);
        }

        // Limits match the users columns (name varchar(150), phone varchar(20)).
        // The email must end in @rajagiri.edu: login only accepts those
        // (AuthController::login + LoginView), so any other address would lock
        // the coordinator out of their own account.
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255|ends_with:@rajagiri.edu|unique:users,email,' . $userId,
            'phone' => 'nullable|string|max:20',
        ], [
            'email.ends_with' => 'The email must be an @rajagiri.edu address — other addresses cannot be used to log in.',
            'name.max' => 'The name must not be longer than 150 characters.',
            'phone.max' => 'The phone number must not be longer than 20 characters.',
        ]);

        DB::table('users')->where('id', $userId)->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $userId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role' => ucfirst($user->role),
            ],
        ]);
    }

    /**
     * Change password for the logged-in coordinator. Mirrors Faculty's
     * changePassword() exactly — current-password verification, no approval
     * step (unlike the Student flow, which is approval-gated and not
     * appropriate for a coordinator changing their own password).
     */
    public function changePassword(Request $request)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $currentPassword = $request->input('current_password');
        $newPassword = $request->input('new_password');
        $confirmPassword = $request->input('confirm_password') ?: $request->input('new_password_confirmation');

        if (!$currentPassword) {
            return response()->json(['error' => 'Current password is required.'], 422);
        }
        if (!$newPassword) {
            return response()->json(['error' => 'New password is required.'], 422);
        }
        if (strlen($newPassword) < 6) {
            return response()->json(['error' => 'New password must be at least 6 characters long.'], 422);
        }
        if ($newPassword !== $confirmPassword) {
            return response()->json(['error' => 'New password and confirmation do not match.'], 422);
        }

        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json(['error' => 'Coordinator account not found.'], 404);
        }

        if (!Hash::check($currentPassword, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect.'], 400);
        }

        DB::table('users')->where('id', $userId)->update([
            'password' => Hash::make($newPassword),
            'updated_at' => now(),
        ]);

        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'user_id' => $userId,
                'action' => 'Password Changed',
                'description' => "Coordinator {$user->name} changed their account password.",
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully.',
        ]);
    }
}
