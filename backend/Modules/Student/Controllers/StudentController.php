<?php

namespace Modules\Student\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Modules\Student\Models\StudentReport;

class StudentController extends Controller
{
    private function getStudentId(Request $request)
    {
        $authUser = $request->get('auth_user') ?: $request->auth_user;
        if (is_array($authUser)) {
            return $authUser['sub'] ?? $authUser['id'] ?? null;
        }
        if (is_object($authUser)) {
            return $authUser->sub ?? $authUser->id ?? null;
        }
        $user = $request->user();
        if ($user) {
            return $user->id ?? null;
        }
        $token = $request->bearerToken() ?: $request->query('token');
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                if (isset($payload['sub'])) {
                    return $payload['sub'];
                }
            }
        }
        return null;
    }

    public function getProjects(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Fetch project IDs student is assigned to (from project_student & module_student)
        $projectStudentData = DB::table('project_student')
            ->where('student_id', $studentId)
            ->get();

        $projectIds = $projectStudentData->pluck('project_id')->toArray();

        $moduleProjectIds = DB::table('module_student')
            ->join('modules', 'modules.id', '=', 'module_student.module_id')
            ->where('module_student.student_id', $studentId)
            ->pluck('modules.project_id')
            ->toArray();

        $allProjectIds = array_values(array_unique(array_merge($projectIds, $moduleProjectIds)));

        $projects = DB::table('projects')
            ->whereIn('id', $allProjectIds)
            ->get();

        $formattedProjects = [];

        foreach ($projects as $project) {
            // Find student assignment role
            $assignment = $projectStudentData->firstWhere('project_id', $project->id);
            $role = $assignment ? $assignment->role : 'developer';
            
            // Map student profile designation
            $designation = DB::table('student_profiles')
                ->where('student_id', $studentId)
                ->value('designation') ?: 'Not assigned';

            // Map status
            $status = 'In Progress';
            if ($project->status === 'closed') {
                $status = 'Completed';
            } elseif ($project->status === 'proposed') {
                $status = 'Proposed';
            }

            // Find supervisor (faculty)
            $facultyName = DB::table('project_faculty')
                ->join('users', 'users.id', '=', 'project_faculty.faculty_id')
                ->where('project_faculty.project_id', $project->id)
                ->value('users.name') ?: 'Faculty Member';

            // Find team members (both from project_student and module_student)
            $directStudents = DB::table('project_student')
                ->join('users', 'users.id', '=', 'project_student.student_id')
                ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                ->where('project_student.project_id', $project->id)
                ->select('users.id as user_id', 'users.name', 'users.email', 'student_profiles.designation', 'project_student.role')
                ->get();

            $moduleStudents = DB::table('module_student')
                ->join('modules', 'modules.id', '=', 'module_student.module_id')
                ->join('users', 'users.id', '=', 'module_student.student_id')
                ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                ->where('modules.project_id', $project->id)
                ->select('users.id as user_id', 'users.name', 'users.email', 'student_profiles.designation', DB::raw("'developer' as role"))
                ->get();

            $allStudentsCollection = $directStudents->concat($moduleStudents)->unique('user_id');

            $membersList = $allStudentsCollection->map(function ($s) use ($studentId) {
                $rawRole = strtolower($s->role ?: 'developer');
                if ($rawRole === 'project_lead' || $rawRole === 'team_lead' || $rawRole === 'lead') {
                    $roleDisplay = 'Project Lead';
                    $isLead = true;
                } elseif ($rawRole === 'developer' || $rawRole === 'dev') {
                    $roleDisplay = 'Developer';
                    $isLead = false;
                } elseif ($rawRole === 'designer' || $rawRole === 'ui/ux') {
                    $roleDisplay = 'UI/UX Designer';
                    $isLead = false;
                } elseif ($rawRole === 'qa' || $rawRole === 'tester') {
                    $roleDisplay = 'QA / Tester';
                    $isLead = false;
                } else {
                    $roleDisplay = ucwords(str_replace('_', ' ', $rawRole));
                    $isLead = false;
                }

                return [
                    'id' => $s->user_id,
                    'name' => $s->name,
                    'email' => $s->email ?? '',
                    'designation' => $s->designation ?: 'Student',
                    'role' => $s->role ?: 'developer',
                    'roleDisplay' => $roleDisplay,
                    'isTeamLead' => $isLead,
                    'isCurrentUser' => ($s->user_id == $studentId),
                ];
            })->values()->toArray();

            $members = implode(', ', $allStudentsCollection->pluck('name')->toArray());

            // Fetch team lead
            $lead = collect($membersList)->firstWhere('isTeamLead', true);
            $teamLead = null;
            if ($lead) {
                $teamLead = is_array($lead) ? ($lead['name'] ?? null) : ($lead->name ?? null);
            }


            // Calculate progress and fetch modules + tasks
            $modules = DB::table('modules')
                ->where('project_id', $project->id)
                ->get();

            $moduleIds = $modules->pluck('id');
            $allTasks = DB::table('tasks')
                ->leftJoin('users', 'users.id', '=', 'tasks.assigned_to')
                ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
                ->whereIn('tasks.module_id', $moduleIds)
                ->select(
                    'tasks.id',
                    'tasks.module_id',
                    'tasks.title',
                    'tasks.assigned_to',
                    'users.name as assignee',
                    'tasks.status',
                    'tasks.due_date',
                    'tasks.github_repository_id',
                    'tasks.github_pr_url',
                    'github_repositories.branch_name',
                    'github_repositories.branch_url'
                )
                ->get();

            $totalTasks = $allTasks->count();
            $completedTasks = $allTasks->where('status', 'completed')->count();

            $statusMap = [
                'completed' => 'Completed',
                'in_progress' => 'In Progress',
                'todo' => 'Todo',
                'blocked' => 'Blocked',
                'not_started' => 'Todo',
            ];

            $tasksByModule = [];
            foreach ($allTasks as $t) {
                $tasksByModule[$t->module_id][] = [
                    'id' => $t->id,
                    'title' => $t->title,
                    'assignedTo' => $t->assigned_to,
                    'assignee' => $t->assignee ?: 'Unassigned',
                    'isMyTask' => ($t->assigned_to == $studentId),
                    'status' => $statusMap[strtolower($t->status ?: 'todo')] ?? 'Todo',
                    'dueDate' => $t->due_date ? date('M d, Y', strtotime($t->due_date)) : null,
                    'githubRepositoryId' => $t->github_repository_id,
                    'githubPrUrl' => $t->github_pr_url,
                    'branchName' => $t->branch_name,
                    'branchUrl' => $t->branch_url,
                ];
            }

            $modulesList = $modules->map(function ($m) use ($tasksByModule, $statusMap) {
                $rawStatus = strtolower($m->status ?: 'todo');
                $mStatus = $statusMap[$rawStatus] ?? 'Todo';
                $mTasks = $tasksByModule[$m->id] ?? [];
                $completedMTasks = count(array_filter($mTasks, fn($t) => $t['status'] === 'Completed'));

                return [
                    'id' => $m->id,
                    'name' => $m->module_name,
                    'status' => $mStatus,
                    'tasks' => $mTasks,
                    'tasksCount' => count($mTasks),
                    'completedTasksCount' => $completedMTasks,
                ];
            })->values()->toArray();
            
            $progress = 0;
            if ($project->status === 'closed') {
                $progress = 100;
            } elseif ($totalTasks > 0) {
                $progress = round(($completedTasks / $totalTasks) * 100);
            } else {
                $progress = 0; 
            }

            $timeline = 'Not specified';

            if ($project->expected_timeline) {
                $timeline = date('M Y', strtotime($project->expected_timeline));
            }

            // Current Active Sprint
            $activeModule = $modules->firstWhere('status', 'in_progress');
            $currentSprint = $activeModule ? $activeModule->module_name : ($modules->first()?->module_name ?: 'None');

            $formattedProjects[] = [
                'id' => $project->id,
                'title' => $project->title,
                'designation' => $designation,
                'status' => $status,
                'faculty' => $facultyName,
                'timeline' => $timeline,
                'progress' => $progress,
                'description' => $project->requirements ?: 'No description available.',
                'members' => $members,
                'membersList' => $membersList,
                'team' => $membersList,
                'modules' => $modulesList,
                'modulesList' => $modulesList,
                'totalTasksCount' => $totalTasks,
                'completedTasksCount' => $completedTasks,
                'clientInfo' => $project->client_name ?: 'Not specified',
                'teamLead' => $teamLead,
                'currentSprint' => $currentSprint,
                'assignedModules' => $modules->pluck('module_name')->toArray(),
            ];
        }

        return response()->json($formattedProjects);
    }

    public function getSprints(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $assignedModuleIds = DB::table('module_student')
            ->where('student_id', $studentId)
            ->pluck('module_id')
            ->toArray();

        $projectIds = DB::table('project_student')
            ->where('student_id', $studentId)
            ->pluck('project_id')
            ->toArray();

        $modules = DB::table('modules')
            ->where(function ($q) use ($assignedModuleIds, $projectIds) {
                if (!empty($assignedModuleIds)) {
                    $q->whereIn('id', $assignedModuleIds);
                }
                if (!empty($projectIds)) {
                    $q->orWhereIn('project_id', $projectIds);
                }
            })
            ->get();

        $sprints = [];

        foreach ($modules as $module) {
            $meta = json_decode($module->description, true) ?: [];

            // Fetch tasks for this module
            $tasks = DB::table('tasks')
                ->join('users', 'users.id', '=', 'tasks.assigned_to')
                ->where('tasks.module_id', $module->id)
                ->select('tasks.id', 'tasks.title as name', 'users.name as assignee', 'tasks.status')
                ->get()
                ->map(function ($t) {
                    $statusMap = [
                        'todo' => 'Todo',
                        'in_progress' => 'In Progress',
                        'completed' => 'Completed',
                        'blocked' => 'Blocked',
                    ];
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                        'assignee' => $t->assignee,
                        'status' => $statusMap[$t->status] ?? 'Todo'
                    ];
                })->toArray();

            $completedCount = count(array_filter($tasks, fn($t) => $t['status'] === 'Completed'));
            $progress = count($tasks) > 0 ? round(($completedCount / count($tasks)) * 100) : 0;

            // Map status
            $status = 'DRAFT';
            if ($module->status === 'completed') {
                $status = 'COMPLETED';
            } elseif ($module->status === 'in_progress') {
                $status = 'IN PROGRESS';
            }

            $sprints[] = [
                'id' => $module->id,
                'projectId' => $module->project_id,
                'name' => $module->module_name,
                'objective' => $meta['objective'] ?? ($module->description ?: 'No objective specified.'),
                'startDate' => $meta['startDate'] ?? null,
                'endDate' => $meta['endDate'] ?? null,
                'status' => $status,
                'progress' => $progress,
                'approvalStatus' => $meta['approvalStatus'] ?? ($module->status === 'completed' ? 'Approved' : ($module->status === 'in_progress' ? 'In Progress' : 'Draft')),
                'feedback' => $meta['feedback'] ?? '',
                'tasks' => $tasks,
                'modules' => $meta['modules'] ?? [$module->module_name]
            ];
        }

        return response()->json($sprints);
    }

    public function saveSprint(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectId = $request->input('projectId');
        $sprintId = $request->input('id');
        $name = $request->input('name');
        $status = $request->input('status', 'DRAFT');

        // Map status
        $dbStatus = 'not_started';
        if ($status === 'COMPLETED') {
            $dbStatus = 'completed';
        } elseif ($status === 'IN PROGRESS') {
            $dbStatus = 'in_progress';
        }

        $meta = [
            'objective' => $request->input('objective'),
            'startDate' => $request->input('startDate'),
            'endDate' => $request->input('endDate'),
            'approvalStatus' => $request->input('approvalStatus', 'Approved'),
            'feedback' => $request->input('feedback', ''),
            'modules' => $request->input('modules', [])
        ];

        $moduleData = [
            'project_id' => $projectId,
            'module_name' => $name,
            'description' => json_encode($meta),
            'status' => $dbStatus,
            'created_by' => $studentId,
            'updated_at' => now(),
        ];

        // Check if sprintId is a valid database record or custom timestamp
        $exists = false;
        if ($sprintId && $sprintId < 1000000000) {
            $exists = DB::table('modules')->where('id', $sprintId)->exists();
        }

        if ($exists) {
            DB::table('modules')->where('id', $sprintId)->update($moduleData);
            $insertedModuleId = $sprintId;
        } else {
            $moduleData['created_at'] = now();
            $insertedModuleId = DB::table('modules')->insertGetId($moduleData);
        }

        // Sync Tasks
        DB::table('tasks')->where('module_id', $insertedModuleId)->delete();

        $tasks = $request->input('tasks', []);
        foreach ($tasks as $task) {
            $assigneeId = DB::table('users')->where('name', $task['assignee'])->value('id') ?: $studentId;
            
            $taskStatus = 'todo';
            $fStatus = strtolower($task['status']);
            if ($fStatus === 'completed') {
                $taskStatus = 'completed';
            } elseif ($fStatus === 'in progress') {
                $taskStatus = 'in_progress';
            } elseif ($fStatus === 'blocked') {
                $taskStatus = 'blocked';
            }

            DB::table('tasks')->insert([
                'module_id' => $insertedModuleId,
                'title' => $task['name'],
                'description' => '',
                'assigned_to' => $assigneeId,
                'status' => $taskStatus,
                'created_by' => $studentId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function getProjectTasks(Request $request, $projectId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Verify project exists
        $project = DB::table('projects')->where('id', $projectId)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        // Verify student belongs to this project or has assigned tasks
        $isAssigned = DB::table('project_student')
            ->where('project_id', $projectId)
            ->where('student_id', $studentId)
            ->exists();

        $hasTasks = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('modules.project_id', $projectId)
            ->where('tasks.assigned_to', $studentId)
            ->exists();

        if (!$isAssigned && !$hasTasks) {
            return response()->json(['error' => 'You do not have access to this project.'], 403);
        }

        // Get modules for this project
        $moduleIds = DB::table('modules')
            ->where('project_id', $projectId)
            ->pluck('id');

        // Query tasks:
        // 1. MUST be assigned to this student (assigned_to = $studentId)
        // 2. MUST NOT be completed (status != 'completed')
        $tasks = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->where('tasks.assigned_to', $studentId)
            ->where('tasks.status', '!=', 'completed')
            ->select(
                'tasks.id',
                'tasks.title',
                'tasks.description',
                'tasks.status',
                'tasks.due_date',
                'tasks.github_repository_id',
                'tasks.github_pr_url',
                'github_repositories.branch_name',
                'github_repositories.branch_url',
                'modules.module_name'
            )
            ->orderBy('tasks.id', 'asc')
            ->get()
            ->map(function ($t) {
                $isRework = (strtolower($t->status) === 'rework');
                $statusMap = [
                    'todo' => 'Todo',
                    'in_progress' => 'In Progress',
                    'completed' => 'Completed',
                    'blocked' => 'Blocked',
                    'rework' => 'Rework',
                ];
                return [
                    'id' => $t->id,
                    'code' => 'T-' . $t->id,
                    'title' => $t->title,
                    'description' => $t->description ?: '',
                    'status' => $statusMap[strtolower($t->status ?: 'todo')] ?? ucfirst($t->status),
                    'rawStatus' => strtolower($t->status ?: 'todo'),
                    'isRework' => $isRework,
                    'moduleName' => $t->module_name,
                    'dueDate' => $t->due_date ? date('M j, Y', strtotime($t->due_date)) : null,
                    'githubRepositoryId' => $t->github_repository_id,
                    'githubPrUrl' => $t->github_pr_url,
                    'branchName' => $t->branch_name,
                    'branchUrl' => $t->branch_url,
                ];
            });

        return response()->json($tasks);
    }

    public function getReports(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $reports = DB::table('student_reports')
            ->leftJoin('projects', 'projects.id', '=', 'student_reports.project_id')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
            ->where('student_reports.student_id', $studentId)
            ->whereNotNull('student_reports.project_id')
            ->where('student_reports.project_id', '>', 0)
            ->select(
                'student_reports.*',
                'projects.title as project_title',
                'tasks.title as task_title',
                'tasks.status as task_status',
                'tasks.github_repository_id',
                'tasks.github_pr_url',
                'github_repositories.branch_name',
                'github_repositories.branch_url'
            )
            ->orderBy('student_reports.report_date', 'desc')
            ->orderBy('student_reports.id', 'desc')
            ->get()
            ->map(function ($r) {
                $fileName = $r->report_file ? basename($r->report_file) : null;
                $isWeekly = strtolower($r->report_type) === 'weekly';

                $weekLabel = null;
                if ($r->week_start && $r->week_end) {
                    $startStr = date('j M', strtotime($r->week_start));
                    $endStr = date('j M Y', strtotime($r->week_end));
                    $weekLabel = "{$startStr} – {$endStr}";
                }

                return [
                    'id' => $r->id,
                    'projectId' => $r->project_id,
                    'projectTitle' => $r->project_title ?: '',
                    'taskId' => $r->task_id,
                    'taskCode' => $r->task_id ? 'T-' . $r->task_id : null,
                    'taskTitle' => $r->task_title,
                    'branchName' => $r->branch_name,
                    'branchUrl' => $r->branch_url,
                    'githubPrUrl' => $r->github_pr_url,
                    'type' => ucfirst($r->report_type),
                    'date' => $r->report_date,
                    'weekStart' => $r->week_start,
                    'weekEnd' => $r->week_end,
                    'weekLabel' => $weekLabel,
                    'workDone' => $r->work_done,
                    'tasksCompleted' => $r->tasks_completed,
                    'pendingWork' => $r->next_plan,
                    'blockers' => $r->challenges,
                    'remarks' => $r->remarks,
                    'hoursWorked' => $r->hours_worked !== null ? (float) $r->hours_worked : null,
                    'status' => ucfirst($r->approval_status ?: 'pending'),
                    'feedback' => $r->feedback,
                    'reportFile' => $r->report_file,
                    'fileName' => $fileName,
                    'fileUrl' => $r->report_file ? asset('storage/' . $r->report_file) : null,
                    'downloadUrl' => $r->report_file ? url('api/student/reports/' . $r->id . '/download') : null,
                    'submittedAt' => $r->submitted_at,
                ];
            });

        return response()->json($reports);
    }

    public function saveReport(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $rawType = strtolower($request->input('type', 'daily'));
        if ($rawType === 'weekly') {
            return response()->json([
                'error' => 'Weekly progress reports are generated automatically from your daily reports. Please submit a Daily Report.'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'projectId' => 'required|integer',
            'taskId' => 'required|integer',
            'date' => 'required|date',
            'workDone' => 'required|string|min:3',
            'tasksCompleted' => 'nullable|string|max:5000',
            'pendingWork' => 'nullable|string|max:5000',
            'blockers' => 'nullable|string|max:5000',
            'hoursWorked' => 'nullable|numeric|min:0|max:24',
            'remarks' => 'nullable|string|max:5000',
            'reportFile' => 'nullable|file|max:10240',
        ], [
            'projectId.required' => 'Please select a project.',
            'taskId.required' => 'Please select an assigned task.',
            'date.required' => 'Report date is required.',
            'workDone.required' => 'Work done description is required.',
            'hoursWorked.max' => 'Hours worked cannot exceed 24 for a single day.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $projectId = intval($request->input('projectId'));
        $taskId = intval($request->input('taskId'));
        $reportDate = $request->input('date', now()->toDateString());
        $workDone = trim($request->input('workDone'));

        // Verify project exists
        $project = DB::table('projects')->where('id', $projectId)->first();
        if (!$project) {
            return response()->json(['error' => 'Selected project does not exist.'], 422);
        }

        // Verify the student is actually assigned to this project (project-level check,
        // in addition to the task-level ownership check below).
        $isAssignedToProject = DB::table('project_student')
            ->where('project_id', $projectId)
            ->where('student_id', $studentId)
            ->exists();
        if (!$isAssignedToProject) {
            return response()->json(['error' => 'You are not assigned to this project.'], 403);
        }

        // Verify task exists, belongs to project, assigned to student, and is active or rework
        $task = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $taskId)
            ->where('modules.project_id', $projectId)
            ->select('tasks.*')
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Selected task does not belong to this project.'], 422);
        }

        if ($task->assigned_to != $studentId) {
            return response()->json(['error' => 'You can only log reports for tasks assigned to you.'], 403);
        }

        if ($task->status === 'completed') {
            return response()->json(['error' => 'This task is already completed and cannot accept reports unless rework is requested.'], 422);
        }

        // Prevent an accidental duplicate submission for the same student+project+task+
        // date. Different tasks on the same day remain allowed (existing per-task design).
        $duplicate = DB::table('student_reports')
            ->where('student_id', $studentId)
            ->where('project_id', $projectId)
            ->where('task_id', $taskId)
            ->where('report_type', 'daily')
            ->where('report_date', $reportDate)
            ->exists();
        if ($duplicate) {
            return response()->json(['error' => 'You have already submitted a daily report for this task on this date.'], 422);
        }

        // Update task's github repository and PR if provided in report submission
        $taskGithubUpdate = [];
        if ($request->has('githubRepositoryId') && $request->filled('githubRepositoryId')) {
            $taskGithubUpdate['github_repository_id'] = $request->input('githubRepositoryId');
        }
        if ($request->has('githubPrUrl')) {
            $taskGithubUpdate['github_pr_url'] = $request->input('githubPrUrl') ?: null;
        }
        if (!empty($taskGithubUpdate)) {
            $taskGithubUpdate['updated_at'] = now();
            DB::table('tasks')->where('id', $taskId)->update($taskGithubUpdate);
        }

        // Calculate week boundaries for this daily report
        $dateCarbon = Carbon::parse($reportDate);
        $weekStart = $dateCarbon->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = $dateCarbon->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();

        $storedFilePath = null;
        if ($request->hasFile('reportFile')) {
            $storedFilePath = $request->file('reportFile')->store('reports', 'public');
        }

        // Insert Daily Report
        $reportId = DB::table('student_reports')->insertGetId([
            'student_id' => $studentId,
            'project_id' => $projectId,
            'task_id' => $taskId,
            'report_type' => 'daily',
            'report_date' => $reportDate,
            'week_start' => $weekStart,
            'week_end' => $weekEnd,
            'weekly_key' => null, // Daily reports have NULL weekly_key
            'work_done' => $workDone,
            'tasks_completed' => $request->input('tasksCompleted') ?: null,
            'next_plan' => $request->input('pendingWork') ?: null,
            'challenges' => $request->input('blockers') ?: null,
            'remarks' => $request->input('remarks') ?: null,
            'hours_worked' => $request->filled('hoursWorked') ? (float) $request->input('hoursWorked') : null,
            'report_file' => $storedFilePath,
            'approval_status' => 'pending',
            'feedback' => null,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automatically create or update the corresponding Weekly Progress Report
        StudentReport::syncWeekly($studentId, $projectId, $reportDate);

        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $studentId,
                'type' => 'report',
                'message' => "Daily Report for {$reportDate} logged (Task T-{$taskId}). Weekly Progress updated.",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'report_id' => $reportId,
            'message' => "Daily report submitted successfully and weekly progress updated.",
        ]);
    }

    public function downloadReportFile(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $report = DB::table('student_reports')
            ->where('id', $id)
            ->where('student_id', $studentId)
            ->first();

        if (!$report || !$report->report_file) {
            return response()->json(['error' => 'Report file not found'], 404);
        }

        if (!Storage::disk('public')->exists($report->report_file)) {
            return response()->json(['error' => 'File not found on storage'], 404);
        }

        $filePath = Storage::disk('public')->path($report->report_file);
        $ext = pathinfo($report->report_file, PATHINFO_EXTENSION);
        $downloadName = "Weekly_Report_{$report->report_date}_{$report->id}.{$ext}";

        return response()->download($filePath, $downloadName);
    }

    public function getWorkLogs(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectStudentIds = DB::table('project_student')
            ->where('student_id', $studentId)
            ->pluck('id');

        $logs = DB::table('student_work_logs')
            ->join('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->join('projects', 'projects.id', '=', 'modules.project_id')
            ->whereIn('student_work_logs.project_student_id', $projectStudentIds)
            ->select(
                'student_work_logs.id',
                'projects.id as project_id',
                'projects.title as project',
                'tasks.id as task_id',
                'tasks.title as task_title',
                'student_work_logs.work_date as date',
                'student_work_logs.hours_worked as hours',
                'student_work_logs.description',
                'student_work_logs.approval_status as status'
            )
            ->orderBy('student_work_logs.work_date', 'desc')
            ->orderBy('student_work_logs.id', 'desc')
            ->get()
            ->map(function ($l) {
                return [
                    'id' => $l->id,
                    'projectId' => $l->project_id,
                    'project' => $l->project,
                    'taskId' => $l->task_id,
                    'taskCode' => $l->task_id ? 'T-' . $l->task_id : null,
                    'taskTitle' => $l->task_title,
                    'date' => $l->date,
                    'hours' => $l->hours,
                    'description' => $l->description,
                    'status' => $l->status,
                ];
            });

        return response()->json($logs);
    }

    public function saveWorkLog(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $taskId = intval($request->input('taskId'));
        $task = null;

        if ($taskId) {
            $task = DB::table('tasks')
                ->join('modules', 'modules.id', '=', 'tasks.module_id')
                ->where('tasks.id', $taskId)
                ->select('tasks.*', 'modules.project_id as module_project_id')
                ->first();

            if (!$task) {
                return response()->json(['error' => 'Selected task not found.'], 404);
            }

            if ($task->assigned_to != $studentId) {
                return response()->json(['error' => 'You can only log hours for tasks assigned to you.'], 403);
            }

            $projectId = $task->module_project_id;
        }

        $projectQuery = DB::table('projects');
        if ($projectId) {
            $project = $projectQuery->where('id', $projectId)->first();
        } else {
            $project = $projectQuery->where('title', $projectTitle)->first();
        }

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $ps = DB::table('project_student')
            ->where('project_id', $project->id)
            ->where('student_id', $studentId)
            ->first();

        if (!$ps) {
            $psId = DB::table('project_student')->insertGetId([
                'project_id' => $project->id,
                'student_id' => $studentId,
                'role' => 'developer',
                'assigned_date' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $ps = (object)['id' => $psId];
        }

        if (!$taskId) {
            // Find or create active module
            $module = DB::table('modules')->where('project_id', $project->id)->first();
            if (!$module) {
                $moduleId = DB::table('modules')->insertGetId([
                    'project_id' => $project->id,
                    'module_name' => 'General Module',
                    'status' => 'in_progress',
                    'created_by' => $studentId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $moduleId = $module->id;
            }

            // Find or create a task under the module
            $task = DB::table('tasks')
                ->where('module_id', $moduleId)
                ->where('assigned_to', $studentId)
                ->first();

            if (!$task) {
                $taskId = DB::table('tasks')->insertGetId([
                    'module_id' => $moduleId,
                    'title' => 'Assigned Tasks',
                    'assigned_to' => $studentId,
                    'status' => 'in_progress',
                    'created_by' => $studentId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $taskId = $task->id;
            }
        }

        $workDate = $request->input('date', now()->toDateString());

        DB::table('student_work_logs')->insert([
            'project_student_id' => $ps->id,
            'task_id' => $taskId,
            'work_date' => $workDate,
            'hours_worked' => $request->input('hours'),
            'description' => $request->input('description'),
            'approval_status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $studentId,
                'project_id' => $project->id,
                'type' => 'work_log',
                'message' => "Daily Work Log for {$workDate} successfully submitted",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // If expected time exceeds for the task in worklog, alert the corresponding coordinator
            if ($taskId) {
                $taskRecord = DB::table('tasks')->where('id', $taskId)->first();
                if ($taskRecord) {
                    $expectedHours = floatval($taskRecord->weight ?? 0);
                    $totalLoggedHours = floatval(
                        DB::table('student_work_logs')
                            ->where('task_id', $taskId)
                            ->sum('hours_worked')
                    );
                    $totalLoggedHours = round($totalLoggedHours, 2);

                    $hoursExceeded = ($expectedHours > 0 && $totalLoggedHours > $expectedHours);
                    $dateExceeded = (!empty($taskRecord->due_date) && $workDate > $taskRecord->due_date);

                    if ($hoursExceeded || $dateExceeded) {
                        // Find the corresponding coordinator who oversees/created this project
                        $coordinatorIds = [];
                        if (!empty($project->created_by)) {
                            $creator = DB::table('users')->where('id', $project->created_by)->first();
                            if ($creator && $creator->role === 'coordinator') {
                                $coordinatorIds[] = $creator->id;
                            }
                        }
                        if (empty($coordinatorIds)) {
                            $coordinatorIds = DB::table('users')
                                ->where('role', 'coordinator')
                                ->pluck('id')
                                ->toArray();
                        }

                        $studentUser = DB::table('users')->where('id', $studentId)->first();
                        $studentName = $studentUser ? $studentUser->name : 'Student';
                        $taskTitle = $taskRecord->title ?? 'Assigned Task';
                        $projTitle = $project->title ?? 'Project';

                        if ($hoursExceeded) {
                            $diff = round($totalLoggedHours - $expectedHours, 2);
                            $alertMessage = "Alert: Expected time exceeded for task '{$taskTitle}' in project '{$projTitle}'. {$totalLoggedHours} hrs logged out of {$expectedHours} hrs planned (+{$diff} hrs) by {$studentName}.";
                            if ($dateExceeded) {
                                $alertMessage .= " Also logged past due date ({$taskRecord->due_date}).";
                            }
                        } else {
                            $alertMessage = "Alert: Work logged past expected due date for task '{$taskTitle}' in project '{$projTitle}'. Date: {$workDate} (due: {$taskRecord->due_date}) by {$studentName}.";
                        }

                        foreach (array_unique($coordinatorIds) as $coordId) {
                            // Check if an unread notification for this task already exists to prevent duplicate spam
                            $existingAlert = DB::table('notifications')
                                ->where('user_id', $coordId)
                                ->where('project_id', $project->id)
                                ->where('type', 'task_time_exceeded')
                                ->where('message', 'like', "%task '{$taskTitle}'%")
                                ->where('is_read', 0)
                                ->first();

                            if ($existingAlert) {
                                DB::table('notifications')
                                    ->where('id', $existingAlert->id)
                                    ->update([
                                        'message' => $alertMessage,
                                        'urgency' => 'high',
                                        'updated_at' => now(),
                                    ]);
                        } else {
                                DB::table('notifications')->insert([
                                    'user_id' => $coordId,
                                    'project_id' => $project->id,
                                    'type' => 'task_time_exceeded',
                                    'urgency' => 'high',
                                    'message' => $alertMessage,
                                    'is_read' => 0,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                }
            }
        }

        return response()->json(['success' => true]);
    }

    public function getGithub(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectIds = DB::table('project_student')
            ->where('student_id', $studentId)
            ->pluck('project_id');

        $projects = DB::table('projects')
            ->whereIn('id', $projectIds)
            ->get();

        $projectDetails = [];
        $flatRepos = [];

        foreach ($projects as $proj) {
            $isLead = DB::table('project_student')
                ->where('project_id', $proj->id)
                ->where('student_id', $studentId)
                ->where('role', 'project_lead')
                ->exists();

            $totalStudents = DB::table('project_student')
                ->where('project_id', $proj->id)
                ->count();
            if ($totalStudents <= 1) {
                $isLead = true;
            }

            $leadStudent = DB::table('project_student')
                ->join('users', 'users.id', '=', 'project_student.student_id')
                ->where('project_student.project_id', $proj->id)
                ->where('project_student.role', 'project_lead')
                ->select('users.name')
                ->first();
            $leadName = $leadStudent ? $leadStudent->name : ($isLead ? 'You' : 'Unassigned');

            $supervisor = DB::table('project_faculty')
                ->join('users', 'users.id', '=', 'project_faculty.faculty_id')
                ->where('project_faculty.project_id', $proj->id)
                ->value('users.name');

            // Main Repo
            $mainRepo = DB::table('github_repositories')
                ->leftJoin('users as verifier', 'verifier.id', '=', 'github_repositories.verified_by')
                ->where('github_repositories.project_id', $proj->id)
                ->where('github_repositories.link_type', 'main')
                ->select(
                    'github_repositories.id',
                    'github_repositories.repository_name',
                    'github_repositories.repository_url as url',
                    'github_repositories.is_verified',
                    'github_repositories.submitted_date',
                    'verifier.name as verified_by_name',
                    'github_repositories.verified_at',
                    DB::raw('CASE WHEN github_repositories.is_verified = 1 THEN "Verified" ELSE "Pending" END as status')
                )
                ->first();

            // Student's own branches
            $myBranches = DB::table('github_repositories')
                ->where('project_id', $proj->id)
                ->where('student_id', $studentId)
                ->where('link_type', 'branch')
                ->select(
                    'id',
                    'branch_name',
                    'branch_url',
                    'submitted_date',
                    'created_at'
                )
                ->get()
                ->map(function ($b) {
                    $b->linked_tasks_count = DB::table('tasks')
                        ->where('github_repository_id', $b->id)
                        ->count();
                    return $b;
                });

            // All team branches for this project
            $teamBranches = DB::table('github_repositories')
                ->join('users', 'users.id', '=', 'github_repositories.student_id')
                ->where('github_repositories.project_id', $proj->id)
                ->where('github_repositories.link_type', 'branch')
                ->select(
                    'github_repositories.id',
                    'github_repositories.student_id',
                    'users.name as student_name',
                    'github_repositories.branch_name',
                    'github_repositories.branch_url',
                    'github_repositories.submitted_date',
                    'github_repositories.created_at'
                )
                ->get()
                ->map(function ($b) {
                    $b->linked_tasks_count = DB::table('tasks')
                        ->where('github_repository_id', $b->id)
                        ->count();
                    return $b;
                });

            $flatRepos[] = [
                'id' => $mainRepo ? $mainRepo->id : null,
                'projectId' => $proj->id,
                'project' => $proj->title,
                'url' => $mainRepo ? $mainRepo->url : '',
                'status' => $mainRepo ? $mainRepo->status : 'Pending',
                'isVerified' => $mainRepo ? (bool)$mainRepo->is_verified : false,
                'faculty' => $supervisor ?: ($mainRepo ? $mainRepo->verified_by_name : 'Unassigned'),
                'isLead' => $isLead,
                'leadName' => $leadName,
                'myBranches' => $myBranches,
                'teamBranches' => $teamBranches,
            ];

            $projectDetails[] = [
                'projectId' => $proj->id,
                'projectTitle' => $proj->title,
                'isLead' => $isLead,
                'leadName' => $leadName,
                'supervisor' => $supervisor ?: 'Unassigned',
                'mainRepo' => $mainRepo,
                'myBranches' => $myBranches,
                'teamBranches' => $teamBranches,
            ];
        }

        return response()->json([
            'repos' => $flatRepos,
            'projects' => $projectDetails,
        ]);
    }

    public function saveGithubUrl(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectTitle = $request->input('project');
        $projectId = $request->input('projectId');
        $url = $request->input('url');

        $project = null;
        if ($projectId) {
            $project = DB::table('projects')->where('id', $projectId)->first();
        } elseif ($projectTitle) {
            $project = DB::table('projects')->where('title', $projectTitle)->first();
        }

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        // Check if student is Team Lead or sole student on project
        $isLead = DB::table('project_student')
            ->where('project_id', $project->id)
            ->where('student_id', $studentId)
            ->where('role', 'project_lead')
            ->exists();

        $totalStudents = DB::table('project_student')
            ->where('project_id', $project->id)
            ->count();

        if (!$isLead && $totalStudents > 1) {
            return response()->json(['error' => 'Only the Team Lead can set or edit the main repository link for this project.'], 403);
        }

        $repoName = 'repo';
        $parts = explode('github.com/', $url);
        if (count($parts) > 1) {
            $repoName = $parts[1];
        }

        DB::table('github_repositories')->updateOrInsert(
            [
                'project_id' => $project->id,
                'link_type' => 'main',
            ],
            [
                'repository_name' => $repoName,
                'repository_url' => $url,
                'student_id' => null,
                'branch_name' => null,
                'branch_url' => null,
                'submitted_date' => now()->toDateString(),
                'is_verified' => false,
                'verified_by' => null,
                'verified_at' => null,
                'updated_at' => now()
            ]
        );

        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $studentId,
                'type' => 'github',
                'message' => "Main GitHub repository URL updated for {$project->title}",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function saveGithubBranch(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectId = $request->input('projectId');
        $projectTitle = $request->input('project');
        $branchName = trim($request->input('branchName', ''));
        $branchUrl = trim($request->input('branchUrl', ''));

        $project = null;
        if ($projectId) {
            $project = DB::table('projects')->where('id', $projectId)->first();
        } elseif ($projectTitle) {
            $project = DB::table('projects')->where('title', $projectTitle)->first();
        }

        if (!$project) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        if (empty($branchName)) {
            return response()->json(['error' => 'Branch name is required.'], 422);
        }

        // Verify student is assigned to this project
        $isAssigned = DB::table('project_student')
            ->where('project_id', $project->id)
            ->where('student_id', $studentId)
            ->exists();

        if (!$isAssigned) {
            return response()->json(['error' => 'You are not assigned to this project.'], 403);
        }

        // Auto-construct branchUrl if not provided
        if (empty($branchUrl)) {
            $mainRepo = DB::table('github_repositories')
                ->where('project_id', $project->id)
                ->where('link_type', 'main')
                ->first();

            if ($mainRepo && !empty($mainRepo->repository_url)) {
                $branchUrl = rtrim($mainRepo->repository_url, '/') . '/tree/' . ltrim($branchName, '/');
            } else {
                return response()->json(['error' => 'Please provide a Branch URL or set the main repository first.'], 422);
            }
        }

        $branchId = $request->input('id');
        if ($branchId) {
            DB::table('github_repositories')
                ->where('id', $branchId)
                ->where('student_id', $studentId)
                ->update([
                    'branch_name' => $branchName,
                    'branch_url' => $branchUrl,
                    'repository_name' => $branchName,
                    'repository_url' => $branchUrl,
                    'updated_at' => now(),
                ]);
        } else {
            $branchId = DB::table('github_repositories')->insertGetId([
                'project_id' => $project->id,
                'student_id' => $studentId,
                'link_type' => 'branch',
                'branch_name' => $branchName,
                'branch_url' => $branchUrl,
                'repository_name' => $branchName,
                'repository_url' => $branchUrl,
                'submitted_date' => now()->toDateString(),
                'is_verified' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'branch' => [
                'id' => $branchId,
                'branchName' => $branchName,
                'branchUrl' => $branchUrl,
            ]
        ]);
    }

    public function deleteGithubBranch(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $branch = DB::table('github_repositories')
            ->where('id', $id)
            ->where('link_type', 'branch')
            ->first();

        if (!$branch) {
            return response()->json(['error' => 'Branch record not found.'], 404);
        }

        if ($branch->student_id != $studentId) {
            $isLead = DB::table('project_student')
                ->where('project_id', $branch->project_id)
                ->where('student_id', $studentId)
                ->where('role', 'project_lead')
                ->exists();

            if (!$isLead) {
                return response()->json(['error' => 'You cannot delete another member\'s branch.'], 403);
            }
        }

        // Unlink tasks referencing this branch
        DB::table('tasks')
            ->where('github_repository_id', $id)
            ->update(['github_repository_id' => null]);

        DB::table('github_repositories')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }

    public function updateTaskGithub(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $task = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $id)
            ->select('tasks.*', 'modules.project_id')
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        $githubRepoId = $request->input('github_repository_id');
        $githubPrUrl = $request->input('github_pr_url');

        if ($githubRepoId) {
            $branch = DB::table('github_repositories')
                ->where('id', $githubRepoId)
                ->where('project_id', $task->project_id)
                ->first();

            if (!$branch) {
                return response()->json(['error' => 'Invalid branch selected for this project.'], 422);
            }
        }

        DB::table('tasks')->where('id', $id)->update([
            'github_repository_id' => $githubRepoId ?: null,
            'github_pr_url' => $githubPrUrl ?: null,
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    public function getCertificates(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $certificates = DB::table('certificates')
            ->join('projects', 'projects.id', '=', 'certificates.project_id')
            ->where('certificates.student_id', $studentId)
            ->select(
                'certificates.id',
                'projects.title as project',
                'certificates.certificate_number',
                'certificates.description',
                'certificates.issue_date as issue_date'
            )
            ->get();

        return response()->json($certificates);
    }

    public function getMeetings(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectIds = DB::table('project_student')
            ->where('student_id', $studentId)
            ->pluck('project_id')
            ->toArray();

        $participantMeetingIds = [];
        if (Schema::hasTable('meeting_participants')) {
            $participantMeetingIds = DB::table('meeting_participants')
                ->where('user_id', $studentId)
                ->pluck('meeting_id')
                ->toArray();
        }

        $meetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'meetings.created_by')
            ->where(function ($q) use ($projectIds, $participantMeetingIds) {
                if (!empty($projectIds)) {
                    $q->whereIn('meetings.project_id', $projectIds);
                }
                if (!empty($participantMeetingIds)) {
                    $q->orWhereIn('meetings.id', $participantMeetingIds);
                }
            })
            ->select(
                'meetings.id',
                'meetings.title',
                'meetings.project_id',
                'projects.title as project',
                'meetings.scheduled_at',
                'meetings.location',
                'meetings.meeting_link',
                'meetings.agenda',
                'meetings.status',
                'creator.name as scheduled_by'
            )
            ->distinct()
            ->orderBy('meetings.scheduled_at', 'desc')
            ->get()
            ->map(function ($m) {
                $ts = strtotime($m->scheduled_at);
                $date = $ts ? date('Y-m-d', $ts) : date('Y-m-d');
                $formattedDate = $ts ? date('M j, Y', $ts) : 'TBD';
                $time = $ts ? date('h:i A', $ts) : '14:00';
                $rawStatus = strtolower(trim($m->status ?: 'scheduled'));
                $isCompleted = ($rawStatus === 'completed');
                $isCancelled = ($rawStatus === 'cancelled');
                $isUpcoming = ($rawStatus === 'scheduled' || $rawStatus === 'upcoming' || (!$isCompleted && !$isCancelled));

                // Fetch meeting notes from meeting_notes table
                $notesRecord = null;
                if (Schema::hasTable('meeting_notes')) {
                    $notesRecord = DB::table('meeting_notes')
                        ->leftJoin('users as uploader', 'uploader.id', '=', 'meeting_notes.uploaded_by')
                        ->where('meeting_id', $m->id)
                        ->select(
                            'meeting_notes.id',
                            'meeting_notes.minutes',
                            'meeting_notes.important_decisions',
                            'meeting_notes.uploaded_on',
                            'uploader.name as uploaded_by_name'
                        )
                        ->latest('meeting_notes.id')
                        ->first();
                }

                // Fetch meeting participants from meeting_participants table
                $participants = [];
                if (Schema::hasTable('meeting_participants')) {
                    $participants = DB::table('meeting_participants')
                        ->join('users', 'users.id', '=', 'meeting_participants.user_id')
                        ->where('meeting_participants.meeting_id', $m->id)
                        ->select(
                            'users.id as user_id',
                            'users.name',
                            'users.email',
                            'users.role',
                            'meeting_participants.attendance_status'
                        )
                        ->get();
                }

                return [
                    'id' => $m->id,
                    'source_id' => $m->id,
                    'category' => 'meeting',
                    'category_label' => 'Project Review / Meeting',
                    'title' => $m->title,
                    'project' => $m->project,
                    'projectId' => $m->project_id,
                    'date' => $date,
                    'formatted_date' => $formattedDate,
                    'time' => $time,
                    'status' => ucfirst($rawStatus),
                    'raw_status' => $rawStatus,
                    'is_completed' => $isCompleted,
                    'is_cancelled' => $isCancelled,
                    'is_upcoming' => $isUpcoming,
                    'location' => $m->location ?: 'Google Meet',
                    'meeting_link' => $m->meeting_link,
                    'meetingLink' => $m->meeting_link,
                    'agenda' => $m->agenda ?: '',
                    'description' => $m->agenda ?: 'Scheduled standup and project evaluation session with supervisor.',
                    'scheduled_by' => $m->scheduled_by ?: 'Supervisor / Faculty',
                    'assigned_by' => $m->scheduled_by ?: 'Supervisor / Faculty',
                    'notes' => $notesRecord ? ($notesRecord->minutes . ($notesRecord->important_decisions ? "\n\nImportant Decisions:\n" . $notesRecord->important_decisions : '')) : ($m->agenda ?: ''),
                    'meeting_notes' => $notesRecord ? [
                        'minutes' => $notesRecord->minutes,
                        'important_decisions' => $notesRecord->important_decisions,
                        'uploaded_by' => $notesRecord->uploaded_by_name,
                        'uploaded_on' => $notesRecord->uploaded_on ? date('M j, Y h:i A', strtotime($notesRecord->uploaded_on)) : null
                    ] : null,
                    'participants' => $participants,
                    'badge_color' => $isCompleted ? 'emerald' : ($isCancelled ? 'rose' : 'teal')
                ];
            });

        return response()->json($meetings);
    }

    private function ensureChatParticipant($chatId, $userId)
    {
        if (!$chatId || !$userId) return;
        $exists = DB::table('chat_participants')
            ->where('chat_id', $chatId)
            ->where('user_id', $userId)
            ->exists();

        if (!$exists) {
            DB::table('chat_participants')->insert([
                'chat_id' => $chatId,
                'user_id' => $userId,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    public function getChatMessages(Request $request, $projectId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $type = $request->query('type', null);

        // Find assigned faculty for this project
        $facultyId = DB::table('project_faculty')
            ->where('project_id', $projectId)
            ->value('faculty_id');

        // If type not explicitly specified, prioritize individual chat with supervisor if faculty exists
        if (!$type) {
            $hasIndividualChat = false;
            if ($facultyId) {
                $hasIndividualChat = DB::table('chats')
                    ->where('project_id', $projectId)
                    ->where('title', "Individual: Faculty-{$facultyId}_Student-{$studentId}")
                    ->exists();
            }
            $type = ($hasIndividualChat || $facultyId) ? 'individual' : 'group';
        }

        if ($type === 'individual' && $facultyId) {
            // Find or create 1-on-1 chat with assigned supervisor
            $chat = DB::table('chats')
                ->where('project_id', $projectId)
                ->where('title', "Individual: Faculty-{$facultyId}_Student-{$studentId}")
                ->first();

            if (!$chat) {
                // Check by participants as fallback
                $chat = DB::table('chats')
                    ->join('chat_participants as p1', 'p1.chat_id', '=', 'chats.id')
                    ->join('chat_participants as p2', 'p2.chat_id', '=', 'chats.id')
                    ->where('chats.project_id', $projectId)
                    ->where('chats.title', 'like', 'Individual:%')
                    ->where('p1.user_id', $facultyId)
                    ->where('p2.user_id', $studentId)
                    ->select('chats.id')
                    ->first();
            }

            if (!$chat) {
                $chatId = DB::table('chats')->insertGetId([
                    'project_id' => $projectId,
                    'title' => "Individual: Faculty-{$facultyId}_Student-{$studentId}",
                    'created_by' => $studentId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $chatId = $chat->id;
            }

            $this->ensureChatParticipant($chatId, $studentId);
            $this->ensureChatParticipant($chatId, $facultyId);
        } else {
            // Group chat for project
            $chat = DB::table('chats')
                ->where('project_id', $projectId)
                ->where(function ($q) {
                    $q->where('title', 'Project Group Chat')
                      ->orWhere('title', 'Project Chat')
                      ->orWhereNull('title');
                })
                ->first();

            if (!$chat) {
                $chatId = DB::table('chats')->insertGetId([
                    'project_id' => $projectId,
                    'title' => 'Project Group Chat',
                    'created_by' => $studentId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $chatId = $chat->id;
            }

            $this->ensureChatParticipant($chatId, $studentId);
            if ($facultyId) {
                $this->ensureChatParticipant($chatId, $facultyId);
            }
        }

        $messages = DB::table('chat_messages')
            ->join('users', 'users.id', '=', 'chat_messages.sender_id')
            ->where('chat_messages.chat_id', $chatId)
            ->select(
                'chat_messages.id',
                'chat_messages.message as text',
                'users.id as sender_id',
                'users.role as sender_role',
                'users.name as sender_name',
                'chat_messages.created_at as time'
            )
            ->orderBy('chat_messages.created_at', 'asc')
            ->get()
            ->map(function ($msg) use ($studentId) {
                $rawText = $msg->text;
                $displayText = $rawText;
                $attachment = null;

                if (is_string($rawText) && (str_starts_with($rawText, '{') || str_starts_with($rawText, '{\\'))) {
                    $decoded = json_decode($rawText, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $displayText = $decoded['text'] ?? '';
                        $attachment = $decoded['attachment'] ?? null;
                    }
                }

                return [
                    'id' => $msg->id,
                    'sender' => $msg->sender_id == $studentId ? 'student' : ($msg->sender_role === 'student' ? 'student' : 'faculty'),
                    'senderId' => $msg->sender_id,
                    'senderName' => $msg->sender_name,
                    'senderRole' => $msg->sender_role,
                    'isMe' => ($msg->sender_id == $studentId),
                    'text' => $displayText,
                    'attachment' => $attachment,
                    'time' => $msg->time
                ];
            });

        return response()->json([
            'chat_id' => $chatId,
            'type' => $type,
            'messages' => $messages,
            'data' => $messages
        ]);
    }

    public function saveChatMessage(Request $request, $projectId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $type = $request->input('type', null);

        $facultyId = DB::table('project_faculty')
            ->where('project_id', $projectId)
            ->value('faculty_id');

        if (!$type) {
            $type = $facultyId ? 'individual' : 'group';
        }

        if ($type === 'individual' && $facultyId) {
            $chat = DB::table('chats')
                ->where('project_id', $projectId)
                ->where('title', "Individual: Faculty-{$facultyId}_Student-{$studentId}")
                ->first();

            if (!$chat) {
                $chat = DB::table('chats')
                    ->join('chat_participants as p1', 'p1.chat_id', '=', 'chats.id')
                    ->join('chat_participants as p2', 'p2.chat_id', '=', 'chats.id')
                    ->where('chats.project_id', $projectId)
                    ->where('chats.title', 'like', 'Individual:%')
                    ->where('p1.user_id', $facultyId)
                    ->where('p2.user_id', $studentId)
                    ->select('chats.id')
                    ->first();
            }

            if (!$chat) {
                $chatId = DB::table('chats')->insertGetId([
                    'project_id' => $projectId,
                    'title' => "Individual: Faculty-{$facultyId}_Student-{$studentId}",
                    'created_by' => $studentId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $chatId = $chat->id;
            }

            $this->ensureChatParticipant($chatId, $studentId);
            $this->ensureChatParticipant($chatId, $facultyId);
        } else {
            $chat = DB::table('chats')
                ->where('project_id', $projectId)
                ->where(function ($q) {
                    $q->where('title', 'Project Group Chat')
                      ->orWhere('title', 'Project Chat')
                      ->orWhereNull('title');
                })
                ->first();

            if (!$chat) {
                $chatId = DB::table('chats')->insertGetId([
                    'project_id' => $projectId,
                    'title' => 'Project Group Chat',
                    'created_by' => $studentId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $chatId = $chat->id;
            }

            $this->ensureChatParticipant($chatId, $studentId);
            if ($facultyId) {
                $this->ensureChatParticipant($chatId, $facultyId);
            }
        }

        $text = trim($request->input('text', ''));
        $attachment = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('chat_attachments', 'public');
            $url = Storage::disk('public')->url($path);
            $attachment = [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
                'url' => $url
            ];
        } elseif ($request->has('attachment')) {
            $rawAttach = $request->input('attachment');
            if (is_array($rawAttach)) {
                $attachment = $rawAttach;
                // If dataUrl is present, write file to disk to keep database clean
                if (!empty($rawAttach['dataUrl']) && str_starts_with($rawAttach['dataUrl'], 'data:')) {
                    try {
                        $parts = explode(',', $rawAttach['dataUrl'], 2);
                        if (count($parts) === 2) {
                            $fileData = base64_decode($parts[1]);
                            $origName = $rawAttach['name'] ?? 'attachment';
                            $ext = pathinfo($origName, PATHINFO_EXTENSION);
                            if (!$ext) {
                                if (str_contains($parts[0], 'pdf')) $ext = 'pdf';
                                elseif (str_contains($parts[0], 'csv')) $ext = 'csv';
                                else $ext = 'bin';
                            }
                            $safeName = 'chat_' . time() . '_' . uniqid() . '.' . $ext;
                            Storage::disk('public')->put('chat_attachments/' . $safeName, $fileData);
                            $url = Storage::disk('public')->url('chat_attachments/' . $safeName);
                            $attachment = [
                                'name' => $origName,
                                'size' => $rawAttach['size'] ?? strlen($fileData),
                                'type' => $rawAttach['type'] ?? 'application/octet-stream',
                                'url' => $url
                            ];
                        }
                    } catch (\Exception $e) {
                        $attachment = $rawAttach;
                    }
                }
            }
        }

        if (empty($text) && !$attachment) {
            return response()->json(['error' => 'Message or attachment is required'], 422);
        }

        $finalMessage = $text;
        if ($attachment) {
            $finalMessage = json_encode([
                'text' => $text,
                'attachment' => $attachment
            ]);
        }

        try {
            $msgId = DB::table('chat_messages')->insertGetId([
                'chat_id' => $chatId,
                'sender_id' => $studentId,
                'message' => $finalMessage,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Exception $e) {
            // In case of any schema limitation, alter table and retry
            try {
                DB::statement('ALTER TABLE chat_messages MODIFY message LONGTEXT');
                $msgId = DB::table('chat_messages')->insertGetId([
                    'chat_id' => $chatId,
                    'sender_id' => $studentId,
                    'message' => $finalMessage,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } catch (\Exception $retryEx) {
                return response()->json(['error' => $retryEx->getMessage()], 500);
            }
        }

        return response()->json([
            'success' => true,
            'message_id' => $msgId,
            'chat_id' => $chatId
        ]);
    }

    public function getNotifications(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!Schema::hasTable('notifications')) {
            return response()->json([]);
        }

        $notifs = DB::table('notifications')
            ->where('user_id', $studentId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // If no notifications exist yet in DB for this student, synthesize and store initial real activity notifications
        if ($notifs->isEmpty()) {
            $initialNotifs = [];

            // 1. Scheduled meetings for this student
            $meetings = DB::table('meetings')
                ->join('meeting_participants', 'meetings.id', '=', 'meeting_participants.meeting_id')
                ->where('meeting_participants.user_id', $studentId)
                ->orderBy('meetings.scheduled_at', 'desc')
                ->limit(3)
                ->select('meetings.title', 'meetings.scheduled_at')
                ->get();

            foreach ($meetings as $m) {
                $schedDate = date('M d', strtotime($m->scheduled_at));
                $initialNotifs[] = [
                    'user_id' => $studentId,
                    'type' => 'meeting',
                    'message' => "{$m->title} meeting scheduled for {$schedDate}",
                    'is_read' => false,
                    'created_at' => Carbon::now()->subHours(2),
                    'updated_at' => Carbon::now()->subHours(2),
                ];
            }

            // 2. Student work logs
            $workLogs = DB::table('student_work_logs')
                ->join('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
                ->where('project_student.student_id', $studentId)
                ->orderBy('student_work_logs.created_at', 'desc')
                ->limit(2)
                ->select('student_work_logs.work_date')
                ->get();

            foreach ($workLogs as $wl) {
                $logDate = date('M d', strtotime($wl->work_date));
                $initialNotifs[] = [
                    'user_id' => $studentId,
                    'type' => 'work_log',
                    'message' => "Daily Work Log for {$logDate} successfully submitted",
                    'is_read' => false,
                    'created_at' => Carbon::now()->subDays(1),
                    'updated_at' => Carbon::now()->subDays(1),
                ];
            }

            // 3. GitHub repository links for assigned projects
            $projectIds = DB::table('project_student')
                ->where('student_id', $studentId)
                ->pluck('project_id');

            $repos = DB::table('github_repositories')
                ->join('projects', 'projects.id', '=', 'github_repositories.project_id')
                ->whereIn('github_repositories.project_id', $projectIds)
                ->select('projects.title')
                ->limit(2)
                ->get();

            foreach ($repos as $r) {
                $initialNotifs[] = [
                    'user_id' => $studentId,
                    'type' => 'github',
                    'message' => "GitHub repository URL updated for {$r->title}",
                    'is_read' => false,
                    'created_at' => Carbon::now()->subDays(2),
                    'updated_at' => Carbon::now()->subDays(2),
                ];
            }

            if (!empty($initialNotifs)) {
                DB::table('notifications')->insert($initialNotifs);
                $notifs = DB::table('notifications')
                    ->where('user_id', $studentId)
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get();
            }
        }

        $formatted = $notifs->map(function ($n) {
            $created = Carbon::parse($n->created_at);
            $projectName = null;
            if (!empty($n->project_id) && Schema::hasTable('projects')) {
                $projectName = DB::table('projects')->where('id', $n->project_id)->value('title');
            }
            $cat = 'General';
            if ($n->type === 'meeting' || $n->type === 'meeting_scheduled') $cat = 'Meeting';
            elseif ($n->type === 'task' || $n->type === 'task_assigned') $cat = 'Task';
            elseif ($n->type === 'module' || $n->type === 'module_assigned') $cat = 'Sprint';
            elseif ($n->type === 'work_log') $cat = 'Work Log';
            elseif ($n->type === 'github') $cat = 'GitHub';
            elseif (str_contains($n->type, 'password')) $cat = 'Security';
            elseif ($n->type) $cat = ucfirst(str_replace(['_', '-'], ' ', $n->type));

            return [
                'id' => $n->id,
                'title' => $n->message,
                'message' => $n->message,
                'type' => $n->type,
                'category' => $cat,
                'urgency' => $n->urgency ?? 'normal',
                'projectName' => $projectName,
                'time' => $created->diffForHumans(),
                'created_at' => $n->created_at,
                'is_read' => (bool)$n->is_read,
                'isRead' => (bool)$n->is_read,
            ];
        });

        return response()->json($formatted);
    }

    public function getProfile(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = DB::table('users')->where('id', $studentId)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $profile = Schema::hasTable('student_profiles')
            ? DB::table('student_profiles')->where('student_id', $studentId)->first()
            : null;

        $semesterNum = $profile->semester ?? 3;
        $suffix = 'th';
        if ($semesterNum == 1) $suffix = 'st';
        elseif ($semesterNum == 2) $suffix = 'nd';
        elseif ($semesterNum == 3) $suffix = 'rd';

        $yearNum = (int)ceil($semesterNum / 2);
        $yearSuffix = ($yearNum == 1) ? 'st' : (($yearNum == 2) ? 'nd' : (($yearNum == 3) ? 'rd' : 'th'));
        $semesterText = "{$yearNum}{$yearSuffix} Year / {$semesterNum}{$suffix} Semester";

        $hasDesignAccess = false;
        $designProfile = null;
        if (Schema::hasTable('design_user_profiles')) {
            $membership = DB::table('design_user_profiles')->where('user_id', $studentId)->first();
            if ($membership && (bool)$membership->is_active) {
                $hasDesignAccess = true;
                $designProfile = [
                    'division' => $membership->division,
                    'skill_tags' => json_decode($membership->skill_tags ?? '[]', true),
                    'weekly_capacity_hours' => $membership->weekly_capacity_hours,
                    'is_active' => (bool)$membership->is_active
                ];
            }
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'designation' => $profile && $profile->designation ? ucfirst($profile->designation) : 'Nova',
            'department' => 'Computer Applications',
            'course' => $profile->course ?? 'MCA',
            'batch' => $profile->batch ?? '2025-2027',
            'semester' => $semesterNum,
            'semester_text' => $semesterText,
            'profile_photo_path' => $user->profile_photo_path ?? null,
            'avatar' => $user->profile_photo_path ?? ($user->avatar ?? null),
            'has_design_access' => $hasDesignAccess,
            'design_profile' => $designProfile,
            'permissions' => is_string($user->permissions) ? (json_decode($user->permissions, true) ?: []) : ($user->permissions ?: []),
        ]);
    }

    public function getDashboard(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // 1. Student Assigned Projects (from project_student + module_student)
        $projectStudentData = DB::table('project_student')
            ->where('student_id', $studentId)
            ->get();
        $projectIds = $projectStudentData->pluck('project_id')->toArray();

        $moduleProjectIds = DB::table('module_student')
            ->join('modules', 'modules.id', '=', 'module_student.module_id')
            ->where('module_student.student_id', $studentId)
            ->pluck('modules.project_id')
            ->toArray();

        $allProjectIds = array_values(array_unique(array_merge($projectIds, $moduleProjectIds)));

        $projects = DB::table('projects')
            ->whereIn('id', $allProjectIds)
            ->get()
            ->map(function ($p) use ($projectStudentData, $studentId) {
                $assignment = $projectStudentData->firstWhere('project_id', $p->id);
                $role = $assignment ? ucfirst(str_replace('_', ' ', $assignment->role)) : 'Team Member';

                // Find student designation
                $designation = DB::table('student_profiles')
                    ->where('student_id', $studentId)
                    ->value('designation') ?: 'Student';

                // Find faculty supervisor
                $facultyName = DB::table('project_faculty')
                    ->join('users', 'users.id', '=', 'project_faculty.faculty_id')
                    ->where('project_faculty.project_id', $p->id)
                    ->value('users.name') ?: 'Faculty Member';

                // Find team members (both from project_student and module_student)
                $directStudents = DB::table('project_student')
                    ->join('users', 'users.id', '=', 'project_student.student_id')
                    ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                    ->where('project_student.project_id', $p->id)
                    ->select('users.id as user_id', 'users.name', 'users.email', 'student_profiles.designation', 'project_student.role')
                    ->get();

                $moduleStudents = DB::table('module_student')
                    ->join('modules', 'modules.id', '=', 'module_student.module_id')
                    ->join('users', 'users.id', '=', 'module_student.student_id')
                    ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                    ->where('modules.project_id', $p->id)
                    ->select('users.id as user_id', 'users.name', 'users.email', 'student_profiles.designation', DB::raw("'developer' as role"))
                    ->get();

                $allStudentsCollection = $directStudents->concat($moduleStudents)->unique('user_id');

                $membersList = $allStudentsCollection->map(function ($s) use ($studentId) {
                    $rawRole = strtolower($s->role ?: 'developer');
                    if ($rawRole === 'project_lead' || $rawRole === 'team_lead' || $rawRole === 'lead') {
                        $roleDisplay = 'Project Lead';
                        $isLead = true;
                    } elseif ($rawRole === 'developer' || $rawRole === 'dev') {
                        $roleDisplay = 'Developer';
                        $isLead = false;
                    } elseif ($rawRole === 'designer' || $rawRole === 'ui/ux') {
                        $roleDisplay = 'UI/UX Designer';
                        $isLead = false;
                    } elseif ($rawRole === 'qa' || $rawRole === 'tester') {
                        $roleDisplay = 'QA / Tester';
                        $isLead = false;
                    } else {
                        $roleDisplay = ucwords(str_replace('_', ' ', $rawRole));
                        $isLead = false;
                    }

                    return [
                        'id' => $s->user_id,
                        'name' => $s->name,
                        'email' => $s->email ?? '',
                        'designation' => $s->designation ?: 'Student',
                        'role' => $s->role ?: 'developer',
                        'roleDisplay' => $roleDisplay,
                        'isTeamLead' => $isLead,
                        'isCurrentUser' => ($s->user_id == $studentId),
                    ];
                })->values()->toArray();

                $members = implode(', ', $allStudentsCollection->pluck('name')->toArray());

                // Calculate progress and fetch modules + tasks
                $modules = DB::table('modules')->where('project_id', $p->id)->get();
                $moduleIds = $modules->pluck('id');
                $allTasks = DB::table('tasks')
                    ->leftJoin('users', 'users.id', '=', 'tasks.assigned_to')
                    ->whereIn('tasks.module_id', $moduleIds)
                    ->select(
                        'tasks.id', 
                        'tasks.module_id', 
                        'tasks.title', 
                        'tasks.description',
                        'tasks.assigned_to', 
                        'users.name as assignee', 
                        'tasks.status', 
                        'tasks.due_date'
                    )
                    ->get();

                $totalTasks = $allTasks->count();
                $completedTasks = $allTasks->where('status', 'completed')->count();

                $statusMap = [
                    'completed' => 'Completed',
                    'in_progress' => 'In Progress',
                    'todo' => 'Todo',
                    'blocked' => 'Blocked',
                    'not_started' => 'Todo',
                    'rework' => 'Rework',
                ];

                $tasksByModule = [];
                foreach ($allTasks as $t) {
                    $tasksByModule[$t->module_id][] = [
                        'id' => $t->id,
                        'title' => $t->title,
                        'description' => $t->description ?: '',
                        'assignedTo' => $t->assigned_to,
                        'assignee' => $t->assignee ?: 'Unassigned',
                        'isMyTask' => ($t->assigned_to == $studentId),
                        'status' => $statusMap[strtolower($t->status ?: 'todo')] ?? 'Todo',
                        'isRework' => (strtolower($t->status ?: '') === 'rework'),
                        'dueDate' => $t->due_date ? date('M d, Y', strtotime($t->due_date)) : null,
                    ];
                }

                $modulesList = $modules->map(function ($m) use ($tasksByModule, $statusMap) {
                    $rawStatus = strtolower($m->status ?: 'todo');
                    $mStatus = $statusMap[$rawStatus] ?? 'Todo';
                    $mTasks = $tasksByModule[$m->id] ?? [];
                    $completedMTasks = count(array_filter($mTasks, fn($t) => $t['status'] === 'Completed'));

                    return [
                        'id' => $m->id,
                        'name' => $m->module_name,
                        'status' => $mStatus,
                        'tasks' => $mTasks,
                        'tasksCount' => count($mTasks),
                        'completedTasksCount' => $completedMTasks,
                    ];
                })->values()->toArray();
                
                $progress = 0;
                if ($p->status === 'closed') {
                    $progress = 100;
                } elseif ($totalTasks > 0) {
                    $progress = round(($completedTasks / $totalTasks) * 100);
                }

                $timeline = 'Not specified';
                if ($p->expected_timeline) {
                    $timeline = date('M Y', strtotime($p->expected_timeline));
                }

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status === 'closed' ? 'Completed' : ($p->status === 'proposed' ? 'Proposed' : 'In Progress'),
                    'role' => $role,
                    'designation' => ucfirst($designation),
                    'faculty' => $facultyName,
                    'timeline' => $timeline,
                    'progress' => $progress,
                    'description' => $p->requirements ?: 'No description available.',
                    'members' => $members,
                    'membersList' => $membersList,
                    'team' => $membersList,
                    'modules' => $modulesList,
                    'modulesList' => $modulesList,
                    'totalTasksCount' => $totalTasks,
                    'completedTasksCount' => $completedTasks,
                    'clientInfo' => $p->client_name ?: 'Not specified',
                ];
            });

        // 2. Assigned Tasks & Deliverables directly from module_student (Faculty / Coordinator assignments)
        $assignedFromModuleStudent = DB::table('module_student')
            ->join('modules', 'modules.id', '=', 'module_student.module_id')
            ->join('projects', 'projects.id', '=', 'modules.project_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'modules.created_by')
            ->where('module_student.student_id', $studentId)
            ->select(
                'module_student.id as ms_id',
                'module_student.module_id',
                'module_student.assigned_date',
                'modules.module_name',
                'modules.description',
                'modules.status as module_status',
                'projects.id as project_id',
                'projects.title as project_title',
                'creator.name as assigned_by_name',
                'creator.role as assigned_by_role'
            )
            ->get()
            ->map(function ($ms) {
                $rawStatus = strtolower($ms->module_status ?: 'todo');
                if ($rawStatus === 'not_started' || $rawStatus === 'assigned') {
                    $rawStatus = 'todo';
                }
                $statusMap = [
                    'todo' => 'Todo',
                    'in_progress' => 'In Progress',
                    'completed' => 'Completed',
                    'blocked' => 'Blocked',
                ];
                $assigner = $ms->assigned_by_name ? ($ms->assigned_by_name . ($ms->assigned_by_role ? ' (' . ucfirst($ms->assigned_by_role) . ')' : '')) : 'Faculty / Coordinator';

                return [
                    'id' => 'mod-' . $ms->module_id,
                    'type' => 'module',
                    'title' => $ms->module_name,
                    'description' => $ms->description ?: 'Assigned module deliverable under ' . $ms->project_title,
                    'status' => $statusMap[$rawStatus] ?? ucfirst($rawStatus),
                    'rawStatus' => $rawStatus,
                    'dueDate' => $ms->assigned_date ? date('M j, Y', strtotime($ms->assigned_date)) : 'Active',
                    'createdAt' => $ms->assigned_date ?: null,
                    'isOverdue' => false,
                    'module' => $ms->module_name,
                    'project' => $ms->project_title ?: 'Academic Project',
                    'assignedBy' => $assigner,
                ];
            });

        // Granular sub-tasks from tasks table
        $assignedModuleIds = DB::table('module_student')
            ->where('student_id', $studentId)
            ->pluck('module_id')
            ->toArray();

        $granularTasks = DB::table('tasks')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('projects', 'projects.id', '=', 'modules.project_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'tasks.created_by')
            ->where(function ($q) use ($studentId, $assignedModuleIds) {
                $q->where('tasks.assigned_to', $studentId);
                if (!empty($assignedModuleIds)) {
                    $q->orWhereIn('tasks.module_id', $assignedModuleIds);
                }
            })
            ->select(
                'tasks.id',
                'tasks.title',
                'tasks.description',
                'tasks.status',
                'tasks.due_date',
                'tasks.created_at',
                'modules.id as module_id',
                'modules.module_name',
                'projects.id as project_id',
                'projects.title as project_title',
                'creator.name as assigned_by_name',
                'creator.role as assigned_by_role'
            )
            ->orderBy('tasks.id', 'desc')
            ->get()
            ->map(function ($t) {
                $statusMap = [
                    'todo' => 'Todo',
                    'in_progress' => 'In Progress',
                    'completed' => 'Completed',
                    'blocked' => 'Blocked',
                    'rework' => 'Rework',
                ];
                $assigner = $t->assigned_by_name ? ($t->assigned_by_name . ($t->assigned_by_role ? ' (' . ucfirst($t->assigned_by_role) . ')' : '')) : 'Faculty / Coordinator';
                return [
                    'id' => (string)$t->id,
                    'type' => 'task',
                    'title' => $t->title,
                    'description' => $t->description ?: '',
                    'status' => $statusMap[strtolower($t->status)] ?? ucfirst($t->status),
                    'rawStatus' => strtolower($t->status),
                    'isRework' => (strtolower($t->status) === 'rework'),
                    'dueDate' => $t->due_date ? date('M j, Y', strtotime($t->due_date)) : 'No deadline',
                    'createdAt' => $t->created_at ? (string)$t->created_at : null,
                    'isOverdue' => $t->due_date ? (strtotime($t->due_date) < time() && strtolower($t->status) !== 'completed') : false,
                    'module' => $t->module_name ?: 'General Module',
                    'project' => $t->project_title ?: 'Academic Project',
                    'projectId' => $t->project_id,
                    'assignedBy' => $assigner,
                ];
            });

        // Combined: module assignments + granular tasks (sorted latest first)
        $tasks = $assignedFromModuleStudent->concat($granularTasks)
            ->sortByDesc(function ($item) {
                if (!empty($item['createdAt'])) {
                    return strtotime($item['createdAt']);
                }
                $num = preg_replace('/\D/', '', $item['id']);
                return (int)$num;
            })
            ->values();

        // 3. Assigned Modules / Sprints list
        $modules = DB::table('modules')
            ->join('projects', 'projects.id', '=', 'modules.project_id')
            ->where(function ($q) use ($assignedModuleIds, $allProjectIds) {
                if (!empty($assignedModuleIds)) {
                    $q->whereIn('modules.id', $assignedModuleIds);
                }
                if (!empty($allProjectIds)) {
                    $q->orWhereIn('modules.project_id', $allProjectIds);
                }
            })
            ->select('modules.id', 'modules.module_name', 'modules.status', 'modules.project_id', 'projects.title as project_title')
            ->distinct()
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->module_name,
                    'status' => ucfirst(str_replace('_', ' ', $m->status)),
                    'project' => $m->project_title,
                ];
            });

        // 4. Upcoming Meetings (Scheduled by Faculty / Coordinator for student's projects)
        $meetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'meetings.created_by')
            ->whereIn('meetings.project_id', $allProjectIds)
            ->select(
                'meetings.id',
                'meetings.title',
                'projects.title as project',
                'meetings.scheduled_at',
                'meetings.location',
                'meetings.meeting_link',
                'meetings.agenda',
                'meetings.status',
                'creator.name as scheduled_by'
            )
            ->orderBy('meetings.scheduled_at', 'asc')
            ->get()
            ->map(function ($m) {
                $timestamp = strtotime($m->scheduled_at);
                $rawStatus = strtolower(trim($m->status ?: 'scheduled'));
                $isCompleted = ($rawStatus === 'completed');
                $isCancelled = ($rawStatus === 'cancelled');
                $isUpcoming = $timestamp ? ($timestamp >= (time() - 86400)) : true;

                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'project' => $m->project,
                    'scheduled_at' => $m->scheduled_at,
                    'date' => $timestamp ? date('Y-m-d', $timestamp) : date('Y-m-d'),
                    'formatted_date' => $timestamp ? date('M j, Y', $timestamp) : 'TBD',
                    'time' => $timestamp ? date('h:i A', $timestamp) : 'TBD',
                    'status' => ucfirst($m->status),
                    'raw_status' => $rawStatus,
                    'is_completed' => $isCompleted,
                    'is_cancelled' => $isCancelled,
                    'location' => $m->location ?: 'Google Meet',
                    'meetingLink' => $m->meeting_link,
                    'meeting_link' => $m->meeting_link,
                    'agenda' => $m->agenda ?: '',
                    'scheduledBy' => $m->scheduled_by ?: 'Coordinator / Faculty',
                    'isUpcoming' => $isUpcoming,
                ];
            });

        // 5. Notifications
        $notifications = DB::table('notifications')
            ->where('user_id', $studentId)
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($n) {
                $ts = strtotime($n->created_at);
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'message' => $n->message,
                    'isRead' => (bool)$n->is_read,
                    'time' => $ts ? Carbon::parse($n->created_at)->diffForHumans() : 'Recently'
                ];
            });

        // 6. Summary Stats
        $pendingTasksCount = $tasks->filter(fn($t) => $t['rawStatus'] !== 'completed')->count();
        $completedTasksCount = $tasks->filter(fn($t) => $t['rawStatus'] === 'completed')->count();
        $activeProjectsCount = $projects->filter(fn($p) => $p['status'] === 'In Progress')->count();
        $upcomingMeetingsCount = $meetings->filter(function($m) {
            return !$m['is_completed'] && !$m['is_cancelled'] && $m['isUpcoming'];
        })->count();

        return response()->json([
            'projects' => $projects,
            'tasks' => $tasks,
            'modules' => $modules,
            'meetings' => $meetings,
            'notifications' => $notifications,
            'stats' => [
                'activeProjectsCount' => $activeProjectsCount,
                'totalProjectsCount' => $projects->count(),
                'pendingTasksCount' => $pendingTasksCount,
                'completedTasksCount' => $completedTasksCount,
                'totalTasksCount' => $tasks->count(),
                'assignedModulesCount' => $modules->count(),
                'upcomingMeetingsCount' => $upcomingMeetingsCount,
            ],
            'has_design_access' => $this->hasActiveDesignMembership($studentId),
        ]);
    }

    public function updateTaskStatus(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:todo,in_progress,completed,blocked,Todo,In Progress,Completed,Blocked',
            'type' => 'nullable|string'
        ]);

        $statusNormalized = strtolower(str_replace(' ', '_', $validated['status']));

        // If updating a module assigned from module_student
        if (str_starts_with((string)$id, 'mod-') || $request->input('type') === 'module') {
            $modId = (int) str_replace('mod-', '', (string)$id);
            $isAssigned = DB::table('module_student')
                ->where('module_id', $modId)
                ->where('student_id', $studentId)
                ->exists();

            if (!$isAssigned) {
                return response()->json(['error' => 'You do not have permission to update this module.'], 403);
            }

            $moduleStatus = $statusNormalized === 'todo' ? 'not_started' : $statusNormalized;

            DB::table('modules')->where('id', $modId)->update([
                'status' => $moduleStatus,
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Module status updated to ' . ucfirst(str_replace('_', ' ', $statusNormalized)),
                'status' => $statusNormalized,
            ]);
        }

        // Verify task exists and belongs to a project the student is on, or assigned to student
        $task = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $id)
            ->select('tasks.*', 'modules.project_id')
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        $isStudentOnProject = DB::table('project_student')
            ->where('project_id', $task->project_id)
            ->where('student_id', $studentId)
            ->exists();

        $isAssignedToModule = DB::table('module_student')
            ->where('module_id', $task->module_id)
            ->where('student_id', $studentId)
            ->exists();

        if ($task->assigned_to != $studentId && !$isStudentOnProject && !$isAssignedToModule) {
            return response()->json(['error' => 'You do not have permission to update this task.'], 403);
        }

        DB::table('tasks')->where('id', $id)->update([
            'status' => $statusNormalized,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task status updated to ' . ucfirst(str_replace('_', ' ', $statusNormalized)),
            'status' => $statusNormalized,
        ]);
    }

    /**
     * Change the logged-in student's own password. Requires the current
     * password — same pattern as Faculty/Coordinator changePassword(). The
     * former request → coordinator approval step has been retired.
     */
    public function updatePassword(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = DB::table('users')->where('id', $studentId)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'confirm_password' => 'required|string|same:new_password',
        ], [
            'current_password.required' => 'Please enter your current password.',
            'new_password.required' => 'Please enter your new password.',
            'new_password.min' => 'Password must be at least 6 characters.',
            'confirm_password.required' => 'Please confirm your new password.',
            'confirm_password.same' => 'New password and confirmation password do not match.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['error' => 'Current password is incorrect.'], 400);
        }

        // Update password with Laravel's standard Hash::make
        DB::table('users')->where('id', $studentId)->update([
            'password' => Hash::make($request->input('new_password')),
            'updated_at' => now(),
        ]);

        // Record audit log
        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'user_id' => $studentId,
                'action' => 'Password Changed',
                'description' => "Student {$user->name} changed their account password.",
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Password changed successfully! You can now use your new password.'
        ]);
    }

    /**
     * Mark a student notification as read.
     */
    public function markNotificationRead(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $studentId)
            ->update([
                'is_read' => 1,
                'updated_at' => now(),
            ]);

        return response()->json(['success' => true, 'message' => 'Notification marked as read']);
    }

    /**
     * Mark all student notifications as read.
     */
    public function markAllNotificationsRead(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json(['success' => true, 'message' => 'All notifications marked as read']);
    }

    /**
     * Aggregate ERP-related Calendar Highlights & Activities for the logged-in student.
     * Includes project deadlines, task deadlines, sprints, reviews/meetings, reports, and announcements.
     */
    public function getCalendarEvents(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // 1. Fetch project IDs assigned to this student
        $projectStudentData = DB::table('project_student')
            ->where('student_id', $studentId)
            ->get();
        $projectIds = $projectStudentData->pluck('project_id')->toArray();

        $moduleProjectIds = DB::table('module_student')
            ->join('modules', 'modules.id', '=', 'module_student.module_id')
            ->where('module_student.student_id', $studentId)
            ->pluck('modules.project_id')
            ->toArray();

        $allProjectIds = array_values(array_unique(array_merge($projectIds, $moduleProjectIds)));

        $events = [];
        $today = Carbon::today()->toDateString();

        // 2. Project Review Meetings & Evaluations
        if (!empty($allProjectIds)) {
            $meetings = DB::table('meetings')
                ->join('projects', 'projects.id', '=', 'meetings.project_id')
                ->leftJoin('users as creator', 'creator.id', '=', 'meetings.created_by')
                ->whereIn('meetings.project_id', $allProjectIds)
                ->select(
                    'meetings.id',
                    'meetings.title',
                    'meetings.project_id',
                    'projects.title as project_title',
                    'meetings.scheduled_at',
                    'meetings.location',
                    'meetings.meeting_link',
                    'meetings.agenda',
                    'meetings.status',
                    'creator.name as scheduled_by'
                )
                ->get();

            foreach ($meetings as $m) {
                if (!$m->scheduled_at) continue;
                $date = Carbon::parse($m->scheduled_at)->toDateString();
                $time = Carbon::parse($m->scheduled_at)->format('h:i A');
                $rawStatus = strtolower($m->status ?: 'scheduled');
                $isCompleted = ($rawStatus === 'completed');
                $isOverdue = (!$isCompleted && $date < $today);

                // Fetch meeting notes from meeting_notes table
                $notesRecord = null;
                if (Schema::hasTable('meeting_notes')) {
                    $notesRecord = DB::table('meeting_notes')
                        ->leftJoin('users as uploader', 'uploader.id', '=', 'meeting_notes.uploaded_by')
                        ->where('meeting_id', $m->id)
                        ->select(
                            'meeting_notes.id',
                            'meeting_notes.minutes',
                            'meeting_notes.important_decisions',
                            'meeting_notes.uploaded_on',
                            'uploader.name as uploaded_by_name'
                        )
                        ->latest('meeting_notes.id')
                        ->first();
                }

                // Fetch meeting participants from meeting_participants table
                $participants = [];
                if (Schema::hasTable('meeting_participants')) {
                    $participants = DB::table('meeting_participants')
                        ->join('users', 'users.id', '=', 'meeting_participants.user_id')
                        ->where('meeting_participants.meeting_id', $m->id)
                        ->select(
                            'users.id as user_id',
                            'users.name',
                            'users.email',
                            'users.role',
                            'meeting_participants.attendance_status'
                        )
                        ->get();
                }

                $events[] = [
                    'id' => 'meet-' . $m->id,
                    'source_id' => $m->id,
                    'category' => 'meeting',
                    'category_label' => 'Project Review / Meeting',
                    'title' => $m->title,
                    'description' => $notesRecord ? ($notesRecord->minutes . ($notesRecord->important_decisions ? "\n\nImportant Decisions:\n" . $notesRecord->important_decisions : '')) : ($m->agenda ?: 'Scheduled standup and project evaluation session with supervisor.'),
                    'project' => $m->project_title,
                    'projectId' => $m->project_id,
                    'date' => $date,
                    'time' => $time,
                    'status' => ucfirst($rawStatus),
                    'raw_status' => $rawStatus,
                    'is_completed' => $isCompleted,
                    'is_overdue' => $isOverdue,
                    'is_upcoming' => (!$isCompleted && $date >= $today),
                    'location' => $m->location ?: 'Google Meet',
                    'meeting_link' => $m->meeting_link,
                    'meetingLink' => $m->meeting_link,
                    'assigned_by' => $m->scheduled_by ?: 'Faculty Supervisor',
                    'notes' => $notesRecord ? $notesRecord->minutes : ($m->agenda ?: ''),
                    'meeting_notes' => $notesRecord ? [
                        'minutes' => $notesRecord->minutes,
                        'important_decisions' => $notesRecord->important_decisions,
                        'uploaded_by' => $notesRecord->uploaded_by_name,
                        'uploaded_on' => $notesRecord->uploaded_on ? date('M j, Y h:i A', strtotime($notesRecord->uploaded_on)) : null
                    ] : null,
                    'participants' => $participants,
                    'badge_color' => 'blue'
                ];
            }
        }

        // 3. Task Deadlines & Deliverables assigned to this student
        $assignedModuleIds = DB::table('module_student')
            ->where('student_id', $studentId)
            ->pluck('module_id')
            ->toArray();

        $tasks = DB::table('tasks')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('projects', 'projects.id', '=', 'modules.project_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'tasks.created_by')
            ->where(function ($q) use ($studentId, $assignedModuleIds) {
                $q->where('tasks.assigned_to', $studentId);
                if (!empty($assignedModuleIds)) {
                    $q->orWhereIn('tasks.module_id', $assignedModuleIds);
                }
            })
            ->whereNotNull('tasks.due_date')
            ->select(
                'tasks.id',
                'tasks.title',
                'tasks.description',
                'tasks.status',
                'tasks.due_date',
                'modules.module_name',
                'projects.id as project_id',
                'projects.title as project_title',
                'creator.name as creator_name'
            )
            ->get();

        foreach ($tasks as $t) {
            if (!$t->due_date) continue;
            $date = Carbon::parse($t->due_date)->toDateString();
            $rawStatus = strtolower($t->status ?: 'todo');
            $isCompleted = ($rawStatus === 'completed');
            $isOverdue = (!$isCompleted && $date < $today);

            $events[] = [
                'id' => 'task-' . $t->id,
                'source_id' => $t->id,
                'category' => 'task',
                'category_label' => 'Task & Deliverable Deadline',
                'title' => $t->title,
                'description' => $t->description ?: ('Deliverable under module ' . ($t->module_name ?: 'General')),
                'project' => $t->project_title ?: 'Academic Project',
                'projectId' => $t->project_id,
                'module' => $t->module_name,
                'date' => $date,
                'time' => '11:59 PM',
                'status' => ucfirst(str_replace('_', ' ', $rawStatus)),
                'raw_status' => $rawStatus,
                'is_completed' => $isCompleted,
                'is_overdue' => $isOverdue,
                'is_upcoming' => (!$isCompleted && $date >= $today),
                'assigned_by' => $t->creator_name ?: 'Supervisor',
                'badge_color' => $isOverdue ? 'red' : ($isCompleted ? 'emerald' : 'amber')
            ];
        }

        // 4. Sprint / Module Start and End Dates
        if (!empty($allProjectIds)) {
            $modules = DB::table('modules')
                ->join('projects', 'projects.id', '=', 'modules.project_id')
                ->whereIn('modules.project_id', $allProjectIds)
                ->select('modules.*', 'projects.title as project_title')
                ->get();

            foreach ($modules as $m) {
                $meta = [];
                if (!empty($m->description) && str_starts_with(trim($m->description), '{')) {
                    $meta = json_decode($m->description, true) ?: [];
                }

                $startDate = $meta['startDate'] ?? null;
                $endDate = $meta['endDate'] ?? null;
                $objective = $meta['objective'] ?? ($m->description ?: 'Sprint module milestone.');
                $rawStatus = strtolower($m->status ?: 'not_started');
                $isCompleted = ($rawStatus === 'completed');

                if ($startDate) {
                    $sDate = Carbon::parse($startDate)->toDateString();
                    $events[] = [
                        'id' => 'sprint-start-' . $m->id,
                        'source_id' => $m->id,
                        'category' => 'sprint',
                        'category_label' => 'Sprint Kickoff',
                        'title' => 'Sprint Start: ' . $m->module_name,
                        'description' => 'Kickoff date for ' . $m->module_name . '. ' . $objective,
                        'project' => $m->project_title,
                        'projectId' => $m->project_id,
                        'date' => $sDate,
                        'time' => '09:00 AM',
                        'status' => ucfirst(str_replace('_', ' ', $rawStatus)),
                        'raw_status' => $rawStatus,
                        'is_completed' => $isCompleted,
                        'is_overdue' => false,
                        'is_upcoming' => ($sDate >= $today),
                        'badge_color' => 'purple'
                    ];
                }

                if ($endDate) {
                    $eDate = Carbon::parse($endDate)->toDateString();
                    $isOverdue = (!$isCompleted && $eDate < $today);
                    $events[] = [
                        'id' => 'sprint-end-' . $m->id,
                        'source_id' => $m->id,
                        'category' => 'sprint',
                        'category_label' => 'Sprint Deadline',
                        'title' => 'Sprint End: ' . $m->module_name,
                        'description' => 'Target completion deadline for ' . $m->module_name . '. ' . $objective,
                        'project' => $m->project_title,
                        'projectId' => $m->project_id,
                        'date' => $eDate,
                        'time' => '11:59 PM',
                        'status' => ucfirst(str_replace('_', ' ', $rawStatus)),
                        'raw_status' => $rawStatus,
                        'is_completed' => $isCompleted,
                        'is_overdue' => $isOverdue,
                        'is_upcoming' => (!$isCompleted && $eDate >= $today),
                        'badge_color' => $isOverdue ? 'red' : 'purple'
                    ];
                }
            }
        }


        // 6. Progress Reports submitted & daily/weekly activity
        if (Schema::hasTable('student_reports')) {
            $reports = DB::table('student_reports')
                ->leftJoin('projects', 'projects.id', '=', 'student_reports.project_id')
                ->where('student_reports.student_id', $studentId)
                ->whereNotNull('student_reports.report_date')
                ->select('student_reports.*', 'projects.title as project_title')
                ->get();

            foreach ($reports as $r) {
                if (!$r->report_date) continue;
                $rDate = Carbon::parse($r->report_date)->toDateString();
                $rawStatus = strtolower($r->approval_status ?: 'pending');
                $isCompleted = ($rawStatus === 'approved');

                $events[] = [
                    'id' => 'rep-' . $r->id,
                    'source_id' => $r->id,
                    'category' => 'report',
                    'category_label' => ucfirst($r->report_type ?: 'Daily') . ' Report Submission',
                    'title' => ucfirst($r->report_type ?: 'Daily') . ' Report: ' . ($r->project_title ?: 'Project Task'),
                    'description' => $r->work_done ?: 'Progress report submitted for supervisor review.',
                    'project' => $r->project_title ?: 'Academic Project',
                    'projectId' => $r->project_id,
                    'date' => $rDate,
                    'time' => $r->submitted_at ? Carbon::parse($r->submitted_at)->format('h:i A') : '05:00 PM',
                    'status' => ucfirst($rawStatus),
                    'raw_status' => $rawStatus,
                    'is_completed' => $isCompleted,
                    'is_overdue' => false,
                    'is_upcoming' => false,
                    'feedback' => $r->feedback,
                    'badge_color' => 'emerald'
                ];
            }
        }

        // 7. Important Announcements & Scheduled Academic Activities
        if (Schema::hasTable('notifications')) {
            $notifs = DB::table('notifications')
                ->where('user_id', $studentId)
                ->whereIn('type', ['announcement', 'academic_event', 'evaluation', 'deadline_reminder', 'security', 'meeting'])
                ->orderBy('created_at', 'desc')
                ->limit(15)
                ->get();

            foreach ($notifs as $n) {
                $nDate = Carbon::parse($n->created_at)->toDateString();
                $events[] = [
                    'id' => 'notif-' . $n->id,
                    'source_id' => $n->id,
                    'category' => 'announcement',
                    'category_label' => 'Academic Announcement',
                    'title' => 'Announcement: ' . mb_strimwidth($n->message, 0, 45, '...'),
                    'description' => $n->message,
                    'project' => 'RLabZ Academic ERP',
                    'date' => $nDate,
                    'time' => Carbon::parse($n->created_at)->format('h:i A'),
                    'status' => $n->is_read ? 'Acknowledged' : 'Active',
                    'raw_status' => $n->is_read ? 'read' : 'unread',
                    'is_completed' => (bool)$n->is_read,
                    'is_overdue' => false,
                    'is_upcoming' => ($nDate >= $today),
                    'badge_color' => 'cyan'
                ];
            }
        }

        // Sort events by date ascending, then time
        usort($events, function ($a, $b) {
            $cmp = strcmp($a['date'], $b['date']);
            if ($cmp !== 0) return $cmp;
            return strcmp($a['time'], $b['time']);
        });

        return response()->json($events);
    }

    /**
     * Check if authenticated student has active Design team membership
     */
    protected function hasActiveDesignMembership(int $studentId): bool
    {
        if (!Schema::hasTable('design_user_profiles')) {
            return false;
        }
        $membership = DB::table('design_user_profiles')->where('user_id', $studentId)->first();
        return $membership && (bool)$membership->is_active;
    }

    /**
     * Student Design Dashboard: calculated genuine KPIs
     */
    public function getDesignDashboard(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$this->hasActiveDesignMembership($studentId)) {
            return response()->json([
                'status' => 'error',
                'has_design_access' => false,
                'message' => 'No active Design team membership found. Please contact the Design Head to join the team.'
            ], 403);
        }

        if (!Schema::hasTable('design_tickets')) {
            return response()->json([
                'status' => 'success',
                'has_design_access' => true,
                'kpis' => [
                    'my_open' => 0,
                    'in_progress' => 0,
                    'submitted' => 0,
                    'revision' => 0,
                    'upcoming_deadlines' => 0,
                    'overdue' => 0
                ]
            ]);
        }

        $allTickets = DB::table('design_tickets')
            ->where('assigned_to', $studentId)
            ->get();

        $now = Carbon::now();
        $in7Days = Carbon::now()->addDays(7);

        $openCount = $allTickets->whereNotIn('status', ['Approved', 'Closed', 'Cancelled'])->count();
        $inProgressCount = $allTickets->where('status', 'In Progress')->count();
        $submittedCount = $allTickets->whereIn('status', ['Submitted', 'In Review'])->count();
        $revisionCount = $allTickets->where('status', 'Revision')->count();

        $upcomingCount = $allTickets->filter(function ($t) use ($now, $in7Days) {
            if (in_array($t->status, ['Approved', 'Closed', 'Cancelled'])) return false;
            $d = $t->committed_delivery_date ?: $t->required_by;
            if (!$d) return false;
            $date = Carbon::parse($d);
            return $date->between($now, $in7Days);
        })->count();

        $overdueCount = $allTickets->filter(function ($t) use ($now) {
            if (in_array($t->status, ['Approved', 'Closed', 'Cancelled'])) return false;
            $d = $t->committed_delivery_date ?: $t->required_by;
            if (!$d) return false;
            return Carbon::parse($d)->isPast();
        })->count();

        return response()->json([
            'status' => 'success',
            'has_design_access' => true,
            'kpis' => [
                'my_open' => $openCount,
                'in_progress' => $inProgressCount,
                'submitted' => $submittedCount,
                'revision' => $revisionCount,
                'upcoming_deadlines' => $upcomingCount,
                'overdue' => $overdueCount,
                'total_assigned' => $allTickets->count()
            ]
        ]);
    }

    /**
     * Retrieve Design tickets assigned to the authenticated student
     * Enforces student-level access scoping, status/priority filtering, search, sorting and pagination
     */
    public function getDesignTickets(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$this->hasActiveDesignMembership($studentId)) {
            return response()->json([
                'status' => 'error',
                'has_design_access' => false,
                'message' => 'No active Design team membership found.',
                'data' => []
            ], 403);
        }

        if (!Schema::hasTable('design_tickets')) {
            return response()->json([
                'status' => 'success',
                'has_design_access' => true,
                'data' => [],
                'pagination' => ['total' => 0, 'current_page' => 1, 'per_page' => 10, 'last_page' => 1]
            ]);
        }

        $query = DB::table('design_tickets')
            ->leftJoin('users as requesters', 'design_tickets.requester_id', '=', 'requesters.id')
            ->leftJoin('projects', 'design_tickets.project_id', '=', 'projects.id')
            ->leftJoin('design_versions', 'design_tickets.current_version_id', '=', 'design_versions.id')
            ->where('design_tickets.assigned_to', $studentId)
            ->select(
                'design_tickets.id',
                'design_tickets.ticket_number',
                'design_tickets.title',
                'design_tickets.work_type',
                'design_tickets.priority',
                'design_tickets.status',
                'design_tickets.ball_is_with',
                'design_tickets.committed_delivery_date',
                'design_tickets.required_by',
                'design_tickets.requesting_division',
                'design_tickets.brand_kit_name',
                'design_tickets.estimated_hours',
                'design_tickets.actual_hours_logged',
                'design_tickets.revision_count',
                'design_tickets.created_at',
                'requesters.name as requester_name',
                'requesters.email as requester_email',
                'projects.title as project_title',
                'design_versions.version_number as current_version_number',
                'design_versions.file_url as current_preview_url'
            );

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('design_tickets.status', $request->status);
        }

        // Priority Filter
        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('design_tickets.priority', $request->priority);
        }

        // Work Type Filter
        if ($request->filled('work_type') && $request->work_type !== 'all') {
            $query->where('design_tickets.work_type', $request->work_type);
        }

        // Search Filter
        if ($request->filled('search') && !empty(trim($request->search))) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('design_tickets.ticket_number', 'like', $s)
                  ->orWhere('design_tickets.title', 'like', $s)
                  ->orWhere('design_tickets.work_type', 'like', $s)
                  ->orWhere('design_tickets.brand_kit_name', 'like', $s)
                  ->orWhere('projects.title', 'like', $s);
            });
        }

        // Sorting by deadline
        $sortParam = $request->input('sort_deadline', $request->input('sort', 'asc'));
        $sortOrder = ($sortParam === 'desc') ? 'desc' : 'asc';
        $query->orderByRaw("COALESCE(design_tickets.committed_delivery_date, design_tickets.required_by) {$sortOrder}");

        $perPage = max(1, min(50, (int)$request->input('per_page', 10)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'has_design_access' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage()
            ]
        ]);
    }

    /**
     * View complete ticket brief, attachments, references, versions, feedback comments
     */
    public function getDesignTicketDetail(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$this->hasActiveDesignMembership($studentId)) {
            return response()->json(['error' => 'Forbidden: Active Design membership required'], 403);
        }

        $ticket = DB::table('design_tickets')
            ->leftJoin('users as requesters', 'design_tickets.requester_id', '=', 'requesters.id')
            ->leftJoin('projects', 'design_tickets.project_id', '=', 'projects.id')
            ->where('design_tickets.id', $id)
            ->where('design_tickets.assigned_to', $studentId)
            ->select(
                'design_tickets.*',
                'requesters.name as requester_name',
                'requesters.email as requester_email',
                'projects.title as project_title'
            )
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Design ticket not found or access denied.'], 404);
        }

        // Decode JSON fields
        $ticket->type_specific_fields = json_decode($ticket->type_specific_fields ?? '{}', true);
        $ticket->attachments = json_decode($ticket->attachments ?? '[]', true);
        $ticket->collaborators = json_decode($ticket->collaborators ?? '[]', true);

        // Fetch Versions
        $versions = DB::table('design_versions')
            ->leftJoin('users', 'design_versions.uploader_id', '=', 'users.id')
            ->where('design_versions.ticket_id', $id)
            ->select('design_versions.*', 'users.name as uploader_name')
            ->orderBy('design_versions.version_number', 'desc')
            ->get();

        // Fetch Comments
        $comments = DB::table('design_comments')
            ->leftJoin('users', 'design_comments.user_id', '=', 'users.id')
            ->where('design_comments.ticket_id', $id)
            ->select(
                'design_comments.*',
                'users.name as author_name',
                'users.role as author_role'
            )
            ->orderBy('design_comments.created_at', 'asc')
            ->get();

        // Fetch brand kit guidelines if applicable
        $brandKit = null;
        if (Schema::hasTable('design_brand_kits') && !empty($ticket->brand_kit_name)) {
            $brandKit = DB::table('design_brand_kits')
                ->where('name', $ticket->brand_kit_name)
                ->orWhere('name', 'like', "%{$ticket->brand_kit_name}%")
                ->orWhere('slug', $ticket->brand_kit_name)
                ->first();
            if ($brandKit) {
                $rawColors = $brandKit->brand_colors ?? ($brandKit->color_palette ?? null);
                $rawType = $brandKit->typography ?? ($brandKit->typography_rules ?? null);
                $rawLogos = $brandKit->downloadable_kits ?? ($brandKit->logo_assets ?? null);

                $brandKit->color_palette = is_string($rawColors) ? json_decode($rawColors, true) : ($rawColors ?: []);
                $brandKit->typography_rules = is_string($rawType) ? json_decode($rawType, true) : ($rawType ?: []);
                $brandKit->logo_assets = is_string($rawLogos) ? json_decode($rawLogos, true) : ($rawLogos ?: []);
            }
        }

        // Fetch audit history if available
        $history = [];
        if (Schema::hasTable('design_audit_logs')) {
            $history = DB::table('design_audit_logs')
                ->leftJoin('users', 'design_audit_logs.user_id', '=', 'users.id')
                ->where('design_audit_logs.ticket_id', $id)
                ->select(
                    'design_audit_logs.*',
                    'users.name as actor_name',
                    'users.role as actor_role'
                )
                ->orderBy('design_audit_logs.created_at', 'desc')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'ticket' => $ticket,
            'versions' => $versions,
            'comments' => $comments,
            'brand_kit' => $brandKit,
            'history' => $history,
        ]);
    }

    /**
     * Update progress state by assigned designer
     * Students cannot approve or close tickets
     */
    public function updateDesignTicketStatus(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $ticket = DB::table('design_tickets')
            ->where('id', $id)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found or unauthorized.'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:In Progress,Submitted,Revision',
            'note' => 'nullable|string|max:1000'
        ]);

        $newStatus = $validated['status'];
        if (in_array($newStatus, ['Approved', 'Closed'])) {
            return response()->json(['error' => 'Role restriction: Students cannot self-approve or close tickets.'], 403);
        }

        $ball = ($newStatus === 'Submitted') ? 'Requester' : 'Designer';

        DB::table('design_tickets')->where('id', $id)->update([
            'status' => $newStatus,
            'ball_is_with' => $ball,
            'updated_at' => now()
        ]);

        // Audit Log
        if (Schema::hasTable('design_audit_logs')) {
            DB::table('design_audit_logs')->insert([
                'ticket_id' => $id,
                'user_id' => $studentId,
                'action' => 'status_update',
                'previous_value' => $ticket->status,
                'new_value' => $newStatus,
                'reason' => $validated['note'] ?? 'Status updated by designer',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Ticket status updated to {$newStatus}.",
            'current_status' => $newStatus,
            'ball_is_with' => $ball
        ]);
    }

    /**
     * Upload a new deliverable version (V1, V2, V3...) with mandatory change summary
     */
    public function uploadDesignDeliverableVersion(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $ticket = DB::table('design_tickets')
            ->where('id', $id)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found or unauthorized.'], 404);
        }

        if (in_array($ticket->status, ['Approved', 'Closed', 'Cancelled'])) {
            return response()->json(['error' => "This ticket is {$ticket->status} and cannot accept new deliverable submissions."], 403);
        }

        $changeNotes = $request->input('change_notes') ?? $request->input('change_summary');
        $fileUrl = $request->input('file_url') ?? $request->input('deliverable_url');

        if (empty($changeNotes) || !is_string($changeNotes)) {
            return response()->json(['error' => 'Change notes describing this version are required.'], 422);
        }

        $fileName = $request->input('file_name', 'deliverable_output');
        $fileType = $request->input('file_type', 'image');
        $fileSizeKb = 0;

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => 'required|file|max:51200|mimes:png,jpg,jpeg,webp,svg,pdf,mp4,webm,zip,tar,gz',
            ]);
            $uploaded = $request->file('file');
            $fileName = $uploaded->getClientOriginalName();
            $fileSizeKb = (int)ceil($uploaded->getSize() / 1024);
            $mime = $uploaded->getMimeType();
            if (str_starts_with($mime, 'image/')) $fileType = 'image';
            elseif (str_starts_with($mime, 'video/')) $fileType = 'video';
            elseif ($mime === 'application/pdf') $fileType = 'pdf';
            else $fileType = 'archive';

            $path = $uploaded->store('design_deliverables', 'public');
            $fileUrl = Storage::disk('public')->url($path);
        } elseif (!empty($fileUrl)) {
            if (!filter_var($fileUrl, FILTER_VALIDATE_URL) && !str_starts_with($fileUrl, '/')) {
                return response()->json(['error' => 'A valid deliverable file or URL is required.'], 422);
            }
            if (empty($fileName)) $fileName = 'Deliverable_URL';
        } else {
            return response()->json(['error' => 'Please select a deliverable file or enter a valid URL.'], 422);
        }

        // Determine next version number
        $lastVer = DB::table('design_versions')->where('ticket_id', $id)->max('version_number') ?: 0;
        $nextVer = $lastVer + 1;

        // Reset previous is_current flags
        DB::table('design_versions')->where('ticket_id', $id)->update(['is_current' => false]);

        $versionId = DB::table('design_versions')->insertGetId([
            'ticket_id' => $id,
            'version_number' => $nextVer,
            'uploader_id' => $studentId,
            'file_url' => $fileUrl,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size_kb' => $fileSizeKb,
            'change_notes' => $changeNotes,
            'is_current' => true,
            'is_approved' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Update Ticket to Submitted and set ball to Design Lead
        DB::table('design_tickets')->where('id', $id)->update([
            'current_version_id' => $versionId,
            'status' => 'Submitted',
            'ball_is_with' => 'Design Lead',
            'revision_count' => DB::raw('revision_count + 1'),
            'updated_at' => now()
        ]);

        // Audit Log
        if (Schema::hasTable('design_audit_logs')) {
            DB::table('design_audit_logs')->insert([
                'ticket_id' => $id,
                'user_id' => $studentId,
                'action' => 'version_upload',
                'previous_value' => "V{$lastVer}",
                'new_value' => "V{$nextVer}",
                'reason' => $request->input('change_notes'),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Version V{$nextVer} submitted successfully for review.",
            'version_id' => $versionId,
            'version_number' => $nextVer,
            'file_url' => $fileUrl
        ]);
    }

    /**
     * Add work note, question, blocker, or reply to feedback
     */
    public function addDesignTicketComment(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $ticket = DB::table('design_tickets')
            ->where('id', $id)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found or unauthorized.'], 404);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:3000',
            'version_id' => 'nullable|integer',
            'parent_id' => 'nullable|integer'
        ]);

        $commentId = DB::table('design_comments')->insertGetId([
            'ticket_id' => $id,
            'version_id' => $validated['version_id'] ?? $ticket->current_version_id,
            'user_id' => $studentId,
            'parent_id' => $validated['parent_id'] ?? null,
            'comment' => $validated['comment'],
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $author = DB::table('users')->where('id', $studentId)->first(['name', 'role']);

        return response()->json([
            'status' => 'success',
            'message' => 'Comment posted successfully.',
            'comment' => [
                'id' => $commentId,
                'ticket_id' => $id,
                'version_id' => $validated['version_id'] ?? $ticket->current_version_id,
                'user_id' => $studentId,
                'author_name' => $author->name ?? 'Designer',
                'author_role' => $author->role ?? 'student',
                'comment' => $validated['comment'],
                'status' => 'open',
                'created_at' => now()->toIso8601String()
            ]
        ]);
    }

    /**
     * Resolve feedback comment
     */
    public function resolveDesignTicketComment(Request $request, $ticketId, $commentId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $ticket = DB::table('design_tickets')
            ->where('id', $ticketId)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found or unauthorized.'], 404);
        }

        DB::table('design_comments')
            ->where('id', $commentId)
            ->where('ticket_id', $ticketId)
            ->update([
                'status' => 'resolved',
                'resolved_by' => $studentId,
                'resolved_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Comment marked as resolved.'
        ]);
    }

    public function resolveDesignCommentDirect(Request $request, $commentId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        DB::table('design_comments')
            ->where('id', $commentId)
            ->update([
                'status' => 'resolved',
                'resolved_by' => $studentId,
                'resolved_at' => now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Comment marked as resolved.'
        ]);
    }

    /**
     * Log time against assigned Design ticket
     */
    public function logDesignTime(Request $request, $id)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $ticket = DB::table('design_tickets')
            ->where('id', $id)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found or unauthorized.'], 404);
        }

        $rawHours = $request->input('hours') ?? $request->input('hours_spent');
        $rawNotes = $request->input('notes') ?? $request->input('work_description');

        if (!is_numeric($rawHours) || (float)$rawHours < 0.25 || (float)$rawHours > 24) {
            return response()->json(['error' => 'Please provide valid hours between 0.25 and 24.'], 422);
        }

        $hours = (float)$rawHours;

        DB::table('design_tickets')->where('id', $id)->update([
            'actual_hours_logged' => DB::raw("actual_hours_logged + {$hours}"),
            'updated_at' => now()
        ]);

        if (Schema::hasTable('design_audit_logs')) {
            DB::table('design_audit_logs')->insert([
                'ticket_id' => $id,
                'user_id' => $studentId,
                'action' => 'time_logged',
                'previous_value' => (string)$ticket->actual_hours_logged,
                'new_value' => (string)($ticket->actual_hours_logged + $hours),
                'reason' => $validated['notes'] ?? "Logged {$hours}h of creative design work",
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Successfully logged {$hours} hours.",
            'total_hours' => (float)$ticket->actual_hours_logged + $hours
        ]);
    }
}
