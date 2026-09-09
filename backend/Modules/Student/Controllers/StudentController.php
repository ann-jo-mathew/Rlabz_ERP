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

        // Fetch project IDs student is assigned to
        $projectStudentData = DB::table('project_student')
            ->where('student_id', $studentId)
            ->get();

        $projectIds = $projectStudentData->pluck('project_id');

        $projects = DB::table('projects')
            ->whereIn('id', $projectIds)
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

            // Find team members
            $students = DB::table('project_student')
                ->join('users', 'users.id', '=', 'project_student.student_id')
                ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                ->where('project_student.project_id', $project->id)
                ->select('users.name', 'student_profiles.designation', 'project_student.role')
                ->get();

            $membersList = $students->map(function ($s) {
                return [
                    'name' => $s->name,
                    'designation' => $s->designation,
                    'isTeamLead' => $s->role === 'project_lead',
                ];
            })->toArray();

            $members = implode(', ', $students->pluck('name')->toArray());

            // Fetch team lead
            $lead = $students->firstWhere('role', 'project_lead');
            $teamLead = $lead ? $lead->name : null;


            // Calculate progress based on completed tasks
            $modules = DB::table('modules')
                ->where('project_id', $project->id)
                ->get();

            $moduleIds = $modules->pluck('id');
            $totalTasks = DB::table('tasks')->whereIn('module_id', $moduleIds)->count();
            $completedTasks = DB::table('tasks')->whereIn('module_id', $moduleIds)->where('status', 'completed')->count();
            
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

        $projectIds = DB::table('project_student')
            ->where('student_id', $studentId)
            ->pluck('project_id');

        $modules = DB::table('modules')
            ->whereIn('project_id', $projectIds)
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

    public function getReports(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $reports = DB::table('student_reports')
            ->leftJoin('projects', 'projects.id', '=', 'student_reports.project_id')
            ->where('student_reports.student_id', $studentId)
            ->select(
                'student_reports.*',
                'projects.title as project_title'
            )
            ->orderBy('student_reports.report_date', 'desc')
            ->orderBy('student_reports.id', 'desc')
            ->get()
            ->map(function ($r) {
                $fileName = $r->report_file ? basename($r->report_file) : null;
                return [
                    'id' => $r->id,
                    'projectId' => $r->project_id,
                    'projectTitle' => $r->project_title ?: 'General',
                    'type' => ucfirst($r->report_type),
                    'date' => $r->report_date,
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

        $rawType = strtolower($request->input('type', 'weekly'));
        if (!in_array($rawType, ['daily', 'weekly'])) {
            return response()->json(['error' => 'Invalid report type. Allowed types are Daily and Weekly.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|string',
            'date' => 'required|date',
            'projectId' => 'nullable|integer',
            'workDone' => 'required|string',
            'report_file' => 'nullable|file|mimes:pdf,docx|max:10240',
        ], [
            'report_file.mimes' => 'Only PDF (.pdf) and Word (.docx) files are allowed for Weekly Reports.',
            'report_file.max' => 'The attached file size must not exceed 10MB.',
            'workDone.required' => 'Work done description is required.',
            'date.required' => 'Report date is required.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $reportFilePath = null;
        if ($rawType === 'weekly') {
            if ($request->hasFile('report_file')) {
                $file = $request->file('report_file');
                $reportFilePath = $file->store("reports/weekly/{$studentId}", 'public');
            }
        } else {
            // For Daily report: enforce file attachment is NULL even if sent
            $reportFilePath = null;
        }

        $projectId = $request->input('projectId') ? intval($request->input('projectId')) : null;
        if ($projectId && !DB::table('projects')->where('id', $projectId)->exists()) {
            $projectId = null;
        }

        $reportDate = $request->input('date', now()->toDateString());
        $reportType = ucfirst($rawType);

        $reportId = DB::table('student_reports')->insertGetId([
            'student_id' => $studentId,
            'project_id' => $projectId,
            'report_type' => $rawType,
            'report_date' => $reportDate,
            'work_done' => $request->input('workDone'),
            'report_file' => $reportFilePath,
            'approval_status' => 'pending',
            'feedback' => null,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $studentId,
                'type' => 'report',
                'message' => "{$reportType} Progress Report for {$reportDate} successfully submitted",
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'report_id' => $reportId,
            'report_file' => $reportFilePath,
            'message' => "{$reportType} report submitted successfully.",
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
                'projects.title as project',
                'student_work_logs.work_date as date',
                'student_work_logs.hours_worked as hours',
                'student_work_logs.description',
                'student_work_logs.approval_status as status'
            )
            ->orderBy('student_work_logs.work_date', 'desc')
            ->get();

        return response()->json($logs);
    }

    public function saveWorkLog(Request $request)
    {
        $studentId = $this->getStudentId($request);
        if (!$studentId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $projectTitle = $request->input('project');
        $project = DB::table('projects')->where('title', $projectTitle)->first();

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

        // Find or create a generic task under the module
        $task = DB::table('tasks')
            ->where('module_id', $moduleId)
            ->where('assigned_to', $studentId)
            ->first();

        if (!$task) {
            $taskId = DB::table('tasks')->insertGetId([
                'module_id' => $moduleId,
                'title' => 'General Tasks',
                'assigned_to' => $studentId,
                'status' => 'in_progress',
                'created_by' => $studentId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $taskId = $task->id;
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
}
