<?php

namespace Modules\Student\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StudentController extends Controller
{
    private function getStudentId(Request $request)
    {
        $authUser = $request->get('auth_user');
        return $authUser['sub'] ?? null;
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
            $teamLead = $lead ? $lead['name'] : null;


            // Calculate progress and fetch modules + tasks
            $modules = DB::table('modules')
                ->where('project_id', $project->id)
                ->get();

            $moduleIds = $modules->pluck('id');
            $allTasks = DB::table('tasks')
                ->leftJoin('users', 'users.id', '=', 'tasks.assigned_to')
                ->whereIn('tasks.module_id', $moduleIds)
                ->select('tasks.id', 'tasks.module_id', 'tasks.title', 'tasks.assigned_to', 'users.name as assignee', 'tasks.status', 'tasks.due_date')
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
        // 2. MUST NOT be completed UNLESS rework is needed (status != 'completed' OR review_status == 'rejected')
        $tasks = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->where('tasks.assigned_to', $studentId)
            ->where(function ($q) {
                $q->where('tasks.status', '!=', 'completed')
                  ->orWhere('tasks.review_status', '=', 'rejected');
            })
            ->select(
                'tasks.id',
                'tasks.title',
                'tasks.description',
                'tasks.status',
                'tasks.review_status',
                'tasks.due_date',
                'modules.module_name'
            )
            ->orderBy('tasks.id', 'asc')
            ->get()
            ->map(function ($t) {
                $isRework = ($t->review_status === 'rejected');
                $statusMap = [
                    'todo' => 'Todo',
                    'in_progress' => 'In Progress',
                    'completed' => 'Completed',
                    'blocked' => 'Blocked',
                ];
                return [
                    'id' => $t->id,
                    'code' => 'T-' . $t->id,
                    'title' => $t->title,
                    'description' => $t->description ?: '',
                    'status' => $statusMap[strtolower($t->status ?: 'todo')] ?? ucfirst($t->status),
                    'rawStatus' => strtolower($t->status ?: 'todo'),
                    'reviewStatus' => $t->review_status ?: 'pending',
                    'isRework' => $isRework,
                    'moduleName' => $t->module_name,
                    'dueDate' => $t->due_date ? date('M j, Y', strtotime($t->due_date)) : null,
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
            ->where('student_reports.student_id', $studentId)
            ->whereNotNull('student_reports.project_id')
            ->where('student_reports.project_id', '>', 0)
            ->select(
                'student_reports.*',
                'projects.title as project_title',
                'tasks.title as task_title',
                'tasks.status as task_status'
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
                    'type' => ucfirst($r->report_type),
                    'date' => $r->report_date,
                    'weekStart' => $r->week_start,
                    'weekEnd' => $r->week_end,
                    'weekLabel' => $weekLabel,
                    'workDone' => $r->work_done,
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
        ], [
            'projectId.required' => 'Please select a project.',
            'taskId.required' => 'Please select an assigned task.',
            'date.required' => 'Report date is required.',
            'workDone.required' => 'Work done description is required.',
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

        if ($task->status === 'completed' && $task->review_status !== 'rejected') {
            return response()->json(['error' => 'This task is already completed and cannot accept reports unless rework is requested.'], 422);
        }

        // Calculate week boundaries for this daily report
        $dateCarbon = Carbon::parse($reportDate);
        $weekStart = $dateCarbon->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = $dateCarbon->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();

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
            'report_file' => null,
            'approval_status' => 'pending',
            'feedback' => null,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automatically create or update the corresponding Weekly Progress Report
        $this->syncWeeklyProgressReport($studentId, $projectId, $reportDate);

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

    /**
     * Automatically creates or updates the Weekly Progress Report for a student, project, and week.
     * Prevents duplicates with a database-level unique constraint on weekly_key.
     */
    private function syncWeeklyProgressReport($studentId, $projectId, $reportDate)
    {
        $dateCarbon = Carbon::parse($reportDate);
        $weekStart = $dateCarbon->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = $dateCarbon->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
        $weeklyKey = "std_{$studentId}_proj_{$projectId}_wk_{$weekStart}";

        // Fetch all daily reports for this student, project, and week range
        $dailyReports = DB::table('student_reports')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->where('student_reports.student_id', $studentId)
            ->where('student_reports.project_id', $projectId)
            ->where('student_reports.report_type', 'daily')
            ->whereBetween('student_reports.report_date', [$weekStart, $weekEnd])
            ->select(
                'student_reports.id',
                'student_reports.report_date',
                'student_reports.work_done',
                'student_reports.task_id',
                'tasks.title as task_title',
                'tasks.status as task_status'
            )
            ->orderBy('student_reports.report_date', 'asc')
            ->orderBy('student_reports.id', 'asc')
            ->get();

        if ($dailyReports->isEmpty()) {
            return;
        }

        // Group daily reports by task
        $tasksGrouped = [];
        foreach ($dailyReports as $dr) {
            $tId = $dr->task_id ?: 'general';
            if (!isset($tasksGrouped[$tId])) {
                $statusMap = [
                    'todo' => 'Todo',
                    'in_progress' => 'In Progress',
                    'completed' => 'Completed',
                    'blocked' => 'Blocked',
                ];
                $tasksGrouped[$tId] = [
                    'taskId' => $dr->task_id,
                    'taskCode' => $dr->task_id ? 'T-' . $dr->task_id : 'General',
                    'taskTitle' => $dr->task_title ?: 'General Work',
                    'taskStatus' => $statusMap[strtolower($dr->task_status ?: 'todo')] ?? ucfirst($dr->task_status ?: 'Todo'),
                    'entries' => [],
                ];
            }
            $tasksGrouped[$tId]['entries'][] = [
                'date' => $dr->report_date,
                'work' => $dr->work_done,
            ];
        }

        // Generate formatted readable text summary
        $formattedText = "Tasks Worked On:\n\n";
        foreach ($tasksGrouped as $tg) {
            $formattedText .= "{$tg['taskCode']} — {$tg['taskTitle']}\n";
            $formattedText .= "Status: {$tg['taskStatus']}\n";
            foreach ($tg['entries'] as $entry) {
                $formattedDate = date('M j', strtotime($entry['date']));
                $formattedText .= "• [{$formattedDate}] {$entry['work']}\n";
            }
            $formattedText .= "\n";
        }
        $formattedText = trim($formattedText);

        // Check if weekly report already exists for this weekly_key
        $existingWeekly = DB::table('student_reports')
            ->where('weekly_key', $weeklyKey)
            ->first();

        if ($existingWeekly) {
            // Update existing weekly report
            DB::table('student_reports')
                ->where('id', $existingWeekly->id)
                ->update([
                    'work_done' => $formattedText,
                    'report_date' => $weekEnd,
                    'week_start' => $weekStart,
                    'week_end' => $weekEnd,
                    'updated_at' => now(),
                ]);
        } else {
            // Insert new weekly report
            DB::table('student_reports')->insert([
                'student_id' => $studentId,
                'project_id' => $projectId,
                'task_id' => null,
                'report_type' => 'weekly',
                'report_date' => $weekEnd,
                'week_start' => $weekStart,
                'week_end' => $weekEnd,
                'weekly_key' => $weeklyKey,
                'work_done' => $formattedText,
                'report_file' => null,
                'approval_status' => 'pending',
                'feedback' => null,
                'submitted_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
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

        $projectId = $request->input('projectId');
        $projectTitle = $request->input('project');

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
            return response()->json(['error' => 'Student not assigned to this project'], 403);
        }

        $taskId = intval($request->input('taskId'));

        if ($taskId) {
            $task = DB::table('tasks')
                ->join('modules', 'modules.id', '=', 'tasks.module_id')
                ->where('tasks.id', $taskId)
                ->where('modules.project_id', $project->id)
                ->select('tasks.*')
                ->first();

            if (!$task) {
                return response()->json(['error' => 'Selected task does not belong to this project.'], 422);
            }

            if ($task->assigned_to != $studentId) {
                return response()->json(['error' => 'You can only log hours for tasks assigned to you.'], 403);
            }
        } else {
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
                'type' => 'work_log',
                'message' => "Daily Work Log for {$workDate} successfully submitted",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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

        $repos = DB::table('github_repositories')
            ->join('projects', 'projects.id', '=', 'github_repositories.project_id')
            ->leftJoin('users', 'users.id', '=', 'github_repositories.verified_by')
            ->whereIn('github_repositories.project_id', $projectIds)
            ->select(
                'projects.title as project',
                'github_repositories.repository_url as url',
                DB::raw('CASE WHEN github_repositories.is_verified = 1 THEN "Verified" ELSE "Pending" END as status'),
                'users.name as faculty'
            )
            ->get();

        return response()->json($repos);
    }

    public function saveGithubUrl(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectTitle = $request->input('project');
        $url = $request->input('url');

        $project = DB::table('projects')->where('title', $projectTitle)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $repoName = 'repo';
        $parts = explode('github.com/', $url);
        if (count($parts) > 1) {
            $repoName = $parts[1];
        }

        DB::table('github_repositories')->updateOrInsert(
            ['project_id' => $project->id],
            [
                'repository_name' => $repoName,
                'repository_url' => $url,
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
                'message' => "GitHub repository URL updated for {$projectTitle}",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

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
            ->pluck('project_id');

        $meetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->whereIn('meetings.project_id', $projectIds)
            ->select(
                'meetings.id',
                'meetings.title',
                'projects.title as project',
                'meetings.scheduled_at as date',
                'meetings.location',
                'meetings.meeting_link',
                'meetings.agenda as notes',
                'meetings.status'
            )
            ->get()
            ->map(function ($m) {
                $parts = explode(' ', $m->date);
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'project' => $m->project,
                    'date' => $parts[0],
                    'time' => isset($parts[1]) ? substr($parts[1], 0, 5) : '14:00',
                    'status' => ucfirst($m->status),
                    'location' => $m->location . ($m->meeting_link ? ': ' . $m->meeting_link : ''),
                    'notes' => $m->notes
                ];
            });

        return response()->json($meetings);
    }

    public function getChatMessages(Request $request, $projectId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $chat = DB::table('chats')->where('project_id', $projectId)->first();
        if (!$chat) {
            $chatId = DB::table('chats')->insertGetId([
                'project_id' => $projectId,
                'title' => 'Project Chat',
                'created_by' => $studentId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $chatId = $chat->id;
        }

        $messages = DB::table('chat_messages')
            ->join('users', 'users.id', '=', 'chat_messages.sender_id')
            ->where('chat_messages.chat_id', $chatId)
            ->select(
                'chat_messages.message as text',
                'users.role as sender_role',
                'users.name as sender_name',
                'chat_messages.created_at as time'
            )
            ->orderBy('chat_messages.created_at', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'sender' => $msg->sender_role === 'student' ? 'student' : 'faculty',
                    'senderName' => $msg->sender_name,
                    'text' => $msg->text,
                    'time' => $msg->time
                ];
            });

        return response()->json($messages);
    }

    public function saveChatMessage(Request $request, $projectId)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $chat = DB::table('chats')->where('project_id', $projectId)->first();
        if (!$chat) {
            $chatId = DB::table('chats')->insertGetId([
                'project_id' => $projectId,
                'title' => 'Project Chat',
                'created_by' => $studentId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $chatId = $chat->id;
        }

        DB::table('chat_messages')->insert([
            'chat_id' => $chatId,
            'sender_id' => $studentId,
            'message' => $request->input('text'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true]);
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
            return [
                'id' => $n->id,
                'title' => $n->message,
                'message' => $n->message,
                'type' => $n->type,
                'time' => $created->diffForHumans(),
                'created_at' => $n->created_at,
                'is_read' => (bool)$n->is_read,
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
            'semester_text' => $semesterText
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
                        'tasks.review_status',
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
                        'reviewStatus' => $t->review_status,
                        'isRework' => ($t->review_status === 'rejected'),
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
                'tasks.review_status',
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
                ];
                $assigner = $t->assigned_by_name ? ($t->assigned_by_name . ($t->assigned_by_role ? ' (' . ucfirst($t->assigned_by_role) . ')' : '')) : 'Faculty / Coordinator';
                return [
                    'id' => (string)$t->id,
                    'type' => 'task',
                    'title' => $t->title,
                    'description' => $t->description ?: '',
                    'status' => $statusMap[strtolower($t->status)] ?? ucfirst($t->status),
                    'rawStatus' => strtolower($t->status),
                    'reviewStatus' => $t->review_status,
                    'isRework' => ($t->review_status === 'rejected'),
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
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'project' => $m->project,
                    'date' => $timestamp ? date('M j, Y', $timestamp) : 'TBD',
                    'time' => $timestamp ? date('h:i A', $timestamp) : 'TBD',
                    'status' => ucfirst($m->status),
                    'location' => $m->location ?: 'Google Meet',
                    'meetingLink' => $m->meeting_link,
                    'agenda' => $m->agenda ?: '',
                    'scheduledBy' => $m->scheduled_by ?: 'Coordinator / Faculty',
                    'isUpcoming' => $timestamp ? ($timestamp >= time()) : true,
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
        $upcomingMeetingsCount = $meetings->filter(fn($m) => $m['status'] === 'Scheduled' && $m['isUpcoming'])->count();

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
            ]
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
}
