<?php

namespace Modules\Faculty\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FacultyController extends Controller
{
    /**
     * Resolve the faculty user ID from JWT token or request context.
     */
    private function getFacultyId(Request $request)
    {
        // 1. Check if auth.jwt middleware merged auth_user
        $authUser = $request->get('auth_user');
        if ($authUser && isset($authUser['sub'])) {
            return $authUser['sub'];
        }

        // 2. Try parsing Bearer token directly
        $token = $request->bearerToken();
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                if (isset($payload['sub'])) {
                    return $payload['sub'];
                }
            }
        }

        // 3. Check query parameter or header
        if ($request->filled('user_id')) {
            return (int) $request->input('user_id');
        }
        if ($request->filled('email')) {
            $id = DB::table('users')->where('email', $request->input('email'))->value('id');
            if ($id) return $id;
        }

        // 4. Default fallback to first faculty user in users table
        return DB::table('users')->where('role', 'faculty')->value('id') ?? 4;
    }

    /**
     * Get comprehensive dashboard overview for the logged-in faculty:
     * - Profile details of the faculty member from users and faculty_profiles
     * - Live stats (assigned projects, mentored students, meetings today, pending notes, github repos)
     * - Assigned projects with real calculated task completion progress
     * - Upcoming meetings
     * - Recent notifications
     */
    public function getDashboardData(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $user = DB::table('users')->where('id', $facultyId)->first();
        if (!$user) {
            $user = DB::table('users')->where('role', 'faculty')->first();
            $facultyId = $user ? $user->id : 4;
        }

        $profile = Schema::hasTable('faculty_profiles')
            ? DB::table('faculty_profiles')->where('faculty_id', $facultyId)->first()
            : null;

        // Assigned project IDs
        $projectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        if ($projectIds->isEmpty()) {
            $projectIds = DB::table('projects')->pluck('id');
        }

        // Projects assigned to this faculty
        $projects = DB::table('projects')
            ->whereIn('id', $projectIds)
            ->select('id', 'title', 'title as name', 'client_name', 'project_type', 'status', 'requirements')
            ->get();

        // Calculate progress for each project (completed tasks / total tasks)
        foreach ($projects as $p) {
            $moduleIds = DB::table('modules')->where('project_id', $p->id)->pluck('id');
            $totalTasks = DB::table('tasks')->whereIn('module_id', $moduleIds)->count();
            $completedTasks = DB::table('tasks')->whereIn('module_id', $moduleIds)->where('status', 'completed')->count();
            $p->total_tasks = $totalTasks;
            $p->completed_tasks = $completedTasks;
            $p->progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
            $p->students_count = DB::table('project_student')->where('project_id', $p->id)->count();
        }

        // Distinct students count under these projects
        $studentsCount = DB::table('project_student')
            ->whereIn('project_id', $projectIds)
            ->distinct('student_id')
            ->count('student_id');

        // Meetings today
        $todayStart = date('Y-m-d 00:00:00');
        $todayEnd = date('Y-m-d 23:59:59');
        $meetingsTodayCount = DB::table('meetings')
            ->whereIn('project_id', $projectIds)
            ->whereBetween('scheduled_at', [$todayStart, $todayEnd])
            ->count();

        // Upcoming meetings
        $upcomingMeetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->whereIn('meetings.project_id', $projectIds)
            ->where('meetings.scheduled_at', '>=', now())
            ->select('meetings.id', 'meetings.title', 'meetings.scheduled_at', 'meetings.location', 'meetings.meeting_link', 'projects.title as project_name')
            ->orderBy('meetings.scheduled_at', 'asc')
            ->limit(3)
            ->get();

        // Past meetings pending notes
        $pastMeetingsPendingCount = DB::table('meetings')
            ->whereIn('project_id', $projectIds)
            ->where('scheduled_at', '<', now())
            ->where('status', 'scheduled')
            ->count();

        // GitHub repos count
        $githubCount = DB::table('github_repositories')
            ->whereIn('project_id', $projectIds)
            ->count();

        // Recent Notifications for this faculty
        $notifications = DB::table('notifications')
            ->where('user_id', $facultyId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'faculty' => [
                'id' => $user ? $user->id : $facultyId,
                'name' => $user ? $user->name : 'Faculty Member',
                'email' => $user ? $user->email : 'faculty@rajagiri.edu',
                'phone' => ($user && $user->phone) ? $user->phone : '+91 484 2660605',
                'department' => $profile ? $profile->department : 'Department of Computer Applications',
                'designation' => $profile ? $profile->designation : 'Associate Professor',
            ],
            'stats' => [
                'projects_count' => $projects->count(),
                'students_count' => $studentsCount,
                'meetings_today_count' => $meetingsTodayCount,
                'past_meetings_pending_count' => $pastMeetingsPendingCount,
                'github_repos_count' => $githubCount,
            ],
            'projects' => $projects,
            'upcoming_meetings' => $upcomingMeetings,
            'notifications' => $notifications,
        ]);
    }

    /**
     * 1. Faculty Profile from users and faculty_profiles tables.
     * Pick faculty details (name, email, phone) directly from the users table.
     */
    public function getProfile(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $user = DB::table('users')
            ->where('id', $facultyId)
            ->select('id', 'name', 'email', 'phone', 'role', 'created_at')
            ->first();

        // Fallback to any faculty member if specific ID not found
        if (!$user) {
            $user = DB::table('users')->where('role', 'faculty')->first();
            $facultyId = $user ? $user->id : 4;
        }

        $profile = null;
        if (Schema::hasTable('faculty_profiles')) {
            $profile = DB::table('faculty_profiles')
                ->where('faculty_id', $facultyId)
                ->first();
        }

        return response()->json([
            'id' => $user ? $user->id : $facultyId,
            'name' => $user ? $user->name : 'Faculty Member',
            'email' => $user ? $user->email : 'faculty@rajagiri.edu',
            'phone' => ($user && $user->phone) ? $user->phone : '+91 484 2660605',
            'role' => $user ? ucfirst($user->role) : 'Faculty',
            'department' => $profile ? $profile->department : 'Department of Computer Applications',
            'designation' => $profile ? $profile->designation : 'Associate Professor',
            'created_at' => $user ? $user->created_at : null,
        ]);
    }

    /**
     * Get projects assigned to the currently logged in faculty.
     */
    public function getProjects(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $projects = DB::table('project_faculty')
            ->join('projects', 'projects.id', '=', 'project_faculty.project_id')
            ->where('project_faculty.faculty_id', $facultyId)
            ->select(
                'projects.id',
                'projects.title',
                'projects.title as name',
                'projects.project_type',
                'projects.source_type',
                'projects.client_name',
                'projects.requirements',
                'projects.deliverables',
                'projects.expected_timeline',
                'projects.budget',
                'projects.priority',
                'projects.status',
                'project_faculty.assigned_date'
            )
            ->get();

        // If no assignments exist for this specific faculty, return all active projects
        if ($projects->isEmpty()) {
            $projects = DB::table('projects')
                ->select(
                    'id',
                    'title',
                    'title as name',
                    'project_type',
                    'source_type',
                    'client_name',
                    'requirements',
                    'deliverables',
                    'expected_timeline',
                    'budget',
                    'priority',
                    'status'
                )
                ->get();
        }

        return response()->json($projects);
    }

    /**
     * 2. Students under Projects assigned to logged-in faculty
     * Shows student name, email, project name, and designation.
     */
    public function getStudents(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        // Find projects assigned to this faculty
        $projectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        $query = DB::table('project_student')
            ->join('users', 'users.id', '=', 'project_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->join('projects', 'projects.id', '=', 'project_student.project_id');

        // Filter by assigned projects if the faculty has project assignments
        if ($projectIds->isNotEmpty()) {
            $query->whereIn('project_student.project_id', $projectIds);
        }

        $students = $query->select(
            'users.id as student_id',
            'users.name as student_name',
            'users.name',
            'users.email as student_email',
            'users.email',
            'users.phone as student_phone',
            'projects.id as project_id',
            'projects.title as project_name',
            'projects.title as project',
            'student_profiles.designation',
            'student_profiles.course',
            'student_profiles.batch',
            'student_profiles.semester',
            'project_student.role',
            'project_student.assigned_date'
        )
        ->distinct()
        ->get()
        ->map(function ($s) {
            return [
                'student_id' => $s->student_id,
                'student_name' => $s->student_name,
                'name' => $s->student_name,
                'student_email' => $s->student_email,
                'email' => $s->student_email,
                'project_name' => $s->project_name,
                'project' => $s->project_name,
                'project_id' => $s->project_id,
                'designation' => $s->designation ?: 'Nova',
                'role' => $s->role ?: 'developer',
                'course' => $s->course ?: 'MCA',
                'batch' => $s->batch ?: '2025-2027',
                'semester' => $s->semester ?: '3',
            ];
        });

        return response()->json($students);
    }

    /**
     * 3. Meetings for assigned projects
     */
    public function getMeetings(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $projectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        $query = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id');

        if ($projectIds->isNotEmpty()) {
            $query->where(function ($q) use ($projectIds, $facultyId) {
                $q->whereIn('meetings.project_id', $projectIds)
                  ->orWhere('meetings.created_by', $facultyId);
            });
        }

        $meetings = $query->select(
            'meetings.id',
            'meetings.project_id',
            'projects.title as project_name',
            'projects.title as project_title',
            'meetings.title',
            'meetings.scheduled_at',
            'meetings.location',
            'meetings.meeting_link',
            'meetings.agenda',
            'meetings.status',
            'meetings.created_by'
        )
        ->orderBy('meetings.scheduled_at', 'desc')
        ->get();

        foreach ($meetings as $m) {
            $notes = null;
            if (Schema::hasTable('meeting_notes')) {
                $notes = DB::table('meeting_notes')
                    ->where('meeting_id', $m->id)
                    ->latest('id')
                    ->first();
            }
            $m->notes = $notes;
            $m->is_date_over = strtotime($m->scheduled_at) < time();
        }

        return response()->json($meetings);
    }

    /**
     * Schedule a new meeting and enter it into the meetings table with status 'scheduled'.
     */
    public function createMeeting(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'project_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'scheduled_at' => 'required|string',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|string|max:500',
            'agenda' => 'nullable|string',
        ]);

        $scheduledTimestamp = strtotime($validated['scheduled_at']);
        if (!$scheduledTimestamp) {
            return response()->json(['error' => 'Invalid date/time format.'], 422);
        }

        // Validate that date is not before today's start of day
        $todayTimestamp = strtotime(date('Y-m-d 00:00:00'));
        if ($scheduledTimestamp < $todayTimestamp) {
            return response()->json(['error' => 'Cannot schedule a meeting on a past date.'], 422);
        }

        // When entry is made to table, make its status as scheduled
        $meetingId = DB::table('meetings')->insertGetId([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'scheduled_at' => date('Y-m-d H:i:s', $scheduledTimestamp),
            'location' => !empty($validated['location']) ? $validated['location'] : 'Google Meet',
            'meeting_link' => !empty($validated['meeting_link']) ? $validated['meeting_link'] : null,
            'agenda' => !empty($validated['agenda']) ? $validated['agenda'] : null,
            'status' => 'scheduled',
            'created_by' => $facultyId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Automatically invite students of the project if meeting_participants table exists
        if (Schema::hasTable('meeting_participants')) {
            $studentIds = DB::table('project_student')
                ->where('project_id', $validated['project_id'])
                ->pluck('student_id');

            foreach ($studentIds as $sId) {
                DB::table('meeting_participants')->insert([
                    'meeting_id' => $meetingId,
                    'user_id' => $sId,
                    'attendance_status' => 'invited',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Also record faculty as participant
            DB::table('meeting_participants')->insert([
                'meeting_id' => $meetingId,
                'user_id' => $facultyId,
                'attendance_status' => 'attended',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Send notification to particular students working on that project
            if (Schema::hasTable('notifications')) {
                $projectTitle = DB::table('projects')->where('id', $validated['project_id'])->value('title') ?? "Project #{$validated['project_id']}";
                $formattedTime = date('M j, Y g:i A', $scheduledTimestamp);

                foreach ($studentIds as $sId) {
                    DB::table('notifications')->insert([
                        'user_id' => $sId,
                        'type' => 'meeting_scheduled',
                        'message' => "New meeting scheduled for project '{$projectTitle}': '{$validated['title']}' on {$formattedTime}.",
                        'is_read' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $meeting = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->where('meetings.id', $meetingId)
            ->select(
                'meetings.id',
                'meetings.project_id',
                'projects.title as project_name',
                'projects.title as project_title',
                'meetings.title',
                'meetings.scheduled_at',
                'meetings.location',
                'meetings.meeting_link',
                'meetings.agenda',
                'meetings.status'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Meeting scheduled successfully.',
            'meeting' => $meeting
        ], 201);
    }

    /**
     * Update meeting status when meeting date is over:
     * - 'completed': enters minutes and important_decisions into meeting_notes table.
     * - 'cancelled': enters minutes and important_decisions as 'meeting cancelled'.
     */
    public function updateMeetingStatus($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'status' => 'required|string|in:completed,cancelled',
            'minutes' => 'nullable|string',
            'important_decisions' => 'nullable|string'
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

            // Update status in meetings table
            DB::table('meetings')->where('id', $id)->update([
                'status' => 'completed',
                'updated_at' => now()
            ]);

            // Enter into meeting_notes table only when status is completed
            if (Schema::hasTable('meeting_notes')) {
                DB::table('meeting_notes')->insert([
                    'meeting_id' => $id,
                    'minutes' => $minutes,
                    'important_decisions' => $decisions,
                    'uploaded_by' => $facultyId,
                    'uploaded_on' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Meeting status updated to completed and notes saved.",
                'status' => 'completed',
                'minutes' => $minutes,
                'important_decisions' => $decisions
            ]);
        } else {
            // If cancelled is selected, DO NOT enter anything in meeting_notes table
            DB::table('meetings')->where('id', $id)->update([
                'status' => 'cancelled',
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Meeting status updated to cancelled.",
                'status' => 'cancelled'
            ]);
        }
    }

    /**
     * Get sprints (modules) for projects.
     */
    public function getSprints(Request $request)
    {
        $facultyId = $this->getFacultyId($request);
        $projectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        $query = DB::table('modules')
            ->join('projects', 'projects.id', '=', 'modules.project_id');

        if ($projectIds->isNotEmpty()) {
            $query->whereIn('modules.project_id', $projectIds);
        }

        $modules = $query->select(
            'modules.id',
            'modules.project_id',
            'projects.title as project_title',
            'modules.module_name',
            'modules.description',
            'modules.status',
            'modules.weight_percentage',
            'modules.created_at'
        )->get();

        return response()->json($modules);
    }

    /**
     * Get student reports.
     */
    public function getReports(Request $request)
    {
        $facultyId = $this->getFacultyId($request);
        $projectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        $query = DB::table('student_reports')
            ->leftJoin('projects', 'projects.id', '=', 'student_reports.project_id')
            ->leftJoin('users', 'users.id', '=', 'student_reports.student_id');

        if ($projectIds->isNotEmpty()) {
            $query->whereIn('student_reports.project_id', $projectIds);
        }

        $reports = $query->select(
            'student_reports.id',
            'student_reports.project_id',
            'projects.title as project_title',
            'student_reports.student_id',
            'users.name as student_name',
            'student_reports.task_id',
            'student_reports.report_type',
            'student_reports.report_date',
            'student_reports.work_done',
            'student_reports.challenges',
            'student_reports.next_plan',
            'student_reports.approval_status',
            'student_reports.feedback',
            'student_reports.submitted_at'
        )
        ->orderBy('student_reports.submitted_at', 'desc')
        ->get();

        return response()->json($reports);
    }

    /**
     * Send feedback on student work.
     */
    public function sendFeedback(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'project_id' => 'required|integer',
            'student_id' => 'required|integer',
            'comments' => 'required|string',
        ]);

        $feedbackId = DB::table('feedback')->insertGetId([
            'project_id' => $validated['project_id'],
            'faculty_id' => $facultyId,
            'student_id' => $validated['student_id'],
            'comments' => $validated['comments'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'feedback_id' => $feedbackId]);
    }

    /**
     * Get notifications for faculty.
     */
    public function getNotifications(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $notifications = DB::table('notifications')
            ->where('user_id', $facultyId)
            ->select('id', 'user_id', 'type', 'message', 'is_read', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Get comprehensive project report data:
     * - Project details from projects table
     * - Faculty assigned details from users and faculty_profiles tables
     * - Students assigned details from student_profiles and users tables
     * - GitHub repository details from github_repositories table
     * - Modules and tasks details from modules and tasks tables
     */
    public function getProjectReport($id, Request $request)
    {
        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        // Details of faculty assigned to that project from users table
        $faculty = DB::table('project_faculty')
            ->join('users', 'users.id', '=', 'project_faculty.faculty_id')
            ->leftJoin('faculty_profiles', 'faculty_profiles.faculty_id', '=', 'users.id')
            ->where('project_faculty.project_id', $id)
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'faculty_profiles.department',
                'faculty_profiles.designation',
                'project_faculty.assigned_date'
            )
            ->get();

        // Details of students assigned to that project from student_profiles and users tables
        $students = DB::table('project_student')
            ->join('users', 'users.id', '=', 'project_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->where('project_student.project_id', $id)
            ->select(
                'users.id as student_id',
                'users.name',
                'users.email',
                'users.phone',
                'student_profiles.course',
                'student_profiles.batch',
                'student_profiles.semester',
                'student_profiles.designation',
                'project_student.role',
                'project_student.assigned_date'
            )
            ->get();

        // GitHub repository details from github_repositories table
        $repositories = DB::table('github_repositories')
            ->where('project_id', $id)
            ->select(
                'id',
                'project_id',
                'repository_name',
                'repository_url',
                'submitted_date',
                'is_verified',
                'verified_by',
                'verified_at'
            )
            ->get();

        // Modules details from modules table
        $modules = DB::table('modules')
            ->where('project_id', $id)
            ->select('id', 'project_id', 'module_name', 'description', 'status', 'weight_percentage', 'created_at')
            ->get();

        $moduleIds = $modules->pluck('id');

        // Tasks details from tasks table
        $tasks = DB::table('tasks')
            ->leftJoin('users', 'users.id', '=', 'tasks.assigned_to')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                // 'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'users.name as assigned_to_name'
            )
            ->get();

        return response()->json([
            'project' => $project,
            'faculty' => $faculty,
            'students' => $students,
            'repositories' => $repositories,
            'modules' => $modules,
            'tasks' => $tasks
        ]);
    }

    /**
     * Get project modules and tasks with student assignments.
     */
    public function getProjectModulesAndTasks($id, Request $request)
    {
        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        // Students assigned to this project from project_student
        $projectStudents = DB::table('project_student')
            ->join('users', 'users.id', '=', 'project_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->where('project_student.project_id', $id)
            ->select(
                'users.id as student_id',
                'users.name',
                'users.email',
                'student_profiles.designation',
                'student_profiles.course',
                'project_student.role',
                'project_student.assigned_date'
            )
            ->get();

        // Modules for this project from modules table
        $modules = DB::table('modules')
            ->where('project_id', $id)
            ->orderBy('id', 'desc')
            ->get();

        // Attach assigned students from module_student table to each module
        foreach ($modules as $m) {
            $m->assigned_students = DB::table('module_student')
                ->join('users', 'users.id', '=', 'module_student.student_id')
                ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
                ->where('module_student.module_id', $m->id)
                ->select(
                    'users.id as student_id',
                    'users.name',
                    'users.email',
                    'student_profiles.designation',
                    'module_student.assigned_date'
                )
                ->get();
        }

        // Tasks for these modules
        $moduleIds = $modules->pluck('id');
        $tasks = DB::table('tasks')
            ->leftJoin('users as assigned_user', 'assigned_user.id', '=', 'tasks.assigned_to')
            ->leftJoin('users as reviewer', 'reviewer.id', '=', 'tasks.reviewed_by')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                // 'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'tasks.review_status',
                'tasks.reviewed_by',
                'tasks.reviewed_at',
                'assigned_user.name as assigned_to_name',
                'reviewer.name as reviewer_name'
            )
            ->orderBy('tasks.id', 'desc')
            ->get();

        return response()->json([
            'project' => $project,
            'project_students' => $projectStudents,
            'modules' => $modules,
            'tasks' => $tasks
        ]);
    }

    /**
     * Assign students to a module (selected from dropdown from modules table)
     * Weight option removed.
     */
    public function createModule($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'module_id' => 'required', // module ID from modules table or 'new'
            'new_module_name' => 'nullable|string|max:150',
            'new_description' => 'nullable|string',
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer'
        ]);

        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $moduleId = $validated['module_id'];

        if ($moduleId === 'new' || !is_numeric($moduleId)) {
            if (empty($validated['new_module_name'])) {
                return response()->json(['error' => 'Module name is required when adding a new module.'], 422);
            }
            $moduleId = DB::table('modules')->insertGetId([
                'project_id' => $id,
                'module_name' => $validated['new_module_name'],
                'description' => $validated['new_description'] ?? null,
                'weight_percentage' => 25.00,
                'status' => 'todo',
                'created_by' => $facultyId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $moduleName = $validated['new_module_name'];
        } else {
            $module = DB::table('modules')->where('id', $moduleId)->where('project_id', $id)->first();
            if (!$module) {
                return response()->json(['error' => 'Selected module not found for this project.'], 404);
            }
            $moduleName = $module->module_name;
        }

        $assignedStudentIds = $validated['student_ids'] ?? [];

        // Insert each student into module_student table
        foreach ($assignedStudentIds as $sId) {
            $exists = DB::table('module_student')
                ->where('module_id', $moduleId)
                ->where('student_id', $sId)
                ->exists();

            if (!$exists) {
                DB::table('module_student')->insert([
                    'module_id' => $moduleId,
                    'student_id' => $sId,
                    'assigned_date' => date('Y-m-d'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Notify student
            if (Schema::hasTable('notifications')) {
                DB::table('notifications')->insert([
                    'user_id' => $sId,
                    'type' => 'module_assigned',
                    'message' => "You have been assigned to module '{$moduleName}' in project '{$project->title}'.",
                    'is_read' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Insert selected student's id to modules table and update status as assigned
        if (!empty($assignedStudentIds)) {
            $firstStudentId = $assignedStudentIds[0];
            $moduleUpdate = [
                'status' => 'assigned',
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('modules', 'student_id')) {
                $moduleUpdate['student_id'] = $firstStudentId;
            }
            if (Schema::hasColumn('modules', 'assigned_to')) {
                // If assigned_to has a foreign key to student_profiles, find matching profile id
                $profileId = DB::table('student_profiles')->where('student_id', $firstStudentId)->value('id');
                if ($profileId) {
                    $moduleUpdate['assigned_to'] = $profileId;
                }
            }
            DB::table('modules')->where('id', $moduleId)->update($moduleUpdate);
        }

        $module = DB::table('modules')->where('id', $moduleId)->first();
        $module->assigned_students = DB::table('module_student')
            ->join('users', 'users.id', '=', 'module_student.student_id')
            ->where('module_student.module_id', $moduleId)
            ->select('users.id as student_id', 'users.name', 'users.email')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "Students successfully assigned to module '{$moduleName}'.",
            'module' => $module
        ], 200);
    }

    /**
     * Get student names assigned to a specific module from module_student table.
     */
    public function getModuleStudents($moduleId, Request $request)
    {
        $students = DB::table('module_student')
            ->join('users', 'users.id', '=', 'module_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->where('module_student.module_id', $moduleId)
            ->select(
                'users.id as student_id',
                'users.name',
                'users.email',
                'student_profiles.designation'
            )
            ->get();

        return response()->json($students);
    }

    /**
     * Assign a task under a module.
     * When task is assigned, its status becomes 'todo'.
     * Only allows assigning to students who are assigned with that particular module.
     */
    public function createTask(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'module_id' => 'required|integer',
            'task_id' => 'nullable', // Task ID from tasks table or 'new'
            'new_title' => 'nullable|string|max:255',
            'new_description' => 'nullable|string',
            'assigned_to' => 'required|integer',
            'due_date' => 'nullable|date',
        ]);

        $module = DB::table('modules')->where('id', $validated['module_id'])->first();
        if (!$module) {
            return response()->json(['error' => 'Module not found'], 404);
        }

        // STRICT VALIDATION: Student MUST be assigned to this particular module in module_student table!
        $isAssigned = DB::table('module_student')
            ->where('module_id', $validated['module_id'])
            ->where('student_id', $validated['assigned_to'])
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'error' => 'Selected student is not assigned to this module. Tasks can only be assigned to students who belong to this module.'
            ], 422);
        }

        $taskId = $validated['task_id'] ?? 'new';

        if (is_numeric($taskId) && $taskId !== 'new') {
            $task = DB::table('tasks')->where('id', $taskId)->where('module_id', $validated['module_id'])->first();
            if (!$task) {
                return response()->json(['error' => 'Selected task not found under this module.'], 404);
            }
            // Update task assignment and set status to 'todo'
            DB::table('tasks')->where('id', $taskId)->update([
                'assigned_to' => $validated['assigned_to'],
                'status' => 'todo',
                'due_date' => !empty($validated['due_date']) ? $validated['due_date'] : $task->due_date,
                'updated_at' => now(),
            ]);
            $taskTitle = $task->title;
        } else {
            if (empty($validated['new_title'])) {
                return response()->json(['error' => 'Task title is required.'], 422);
            }
            $taskId = DB::table('tasks')->insertGetId([
                'module_id' => $validated['module_id'],
                'title' => $validated['new_title'],
                'description' => $validated['new_description'] ?? null,
                'weight' => 1,
                'assigned_to' => $validated['assigned_to'],
                'status' => 'todo',
                'due_date' => !empty($validated['due_date']) ? $validated['due_date'] : null,
                'created_by' => $facultyId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $taskTitle = $validated['new_title'];
        }

        // Send notification to the assigned student
        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $validated['assigned_to'],
                'type' => 'task_assigned',
                'message' => "New task assigned to you: '{$taskTitle}' under module '{$module->module_name}'.",
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $task = DB::table('tasks')
            ->leftJoin('users', 'users.id', '=', 'tasks.assigned_to')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $taskId)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                // 'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'users.name as assigned_to_name'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Task assigned successfully.',
            'task' => $task
        ], 200);
    }

    /**
     * Remove a student from a module.
     */
    public function removeStudentFromModule($moduleId, $studentId)
    {
        DB::table('module_student')
            ->where('module_id', $moduleId)
            ->where('student_id', $studentId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student removed from module successfully.'
        ], 200);
    }

    /**
     * Verify or update review status of a task by faculty.
     * Updates review_status, reviewed_by, reviewed_at in tasks table.
     * Inserts notification for the assigned student.
     */
    public function verifyTask($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'review_status' => 'required|in:verified,approved,changes_requested,rejected,pending',
            'remarks' => 'nullable|string'
        ]);

        $task = DB::table('tasks')->where('id', $id)->first();
        if (!$task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        // Verify that this task belongs to a project assigned to this faculty
        $module = DB::table('modules')->where('id', $task->module_id)->first();
        if ($module) {
            $isAssigned = DB::table('project_faculty')
                ->where('faculty_id', $facultyId)
                ->where('project_id', $module->project_id)
                ->exists();
            $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
            if ($hasAnyAssignments && !$isAssigned) {
                return response()->json(['error' => 'You are not assigned to this project.'], 403);
            }
        }

        $inputStatus = $validated['review_status'];
        // Map to MySQL tasks.review_status ENUM('pending','approved','rejected')
        $dbStatus = 'pending';
        if ($inputStatus === 'verified' || $inputStatus === 'approved') {
            $dbStatus = 'approved';
        } elseif ($inputStatus === 'changes_requested' || $inputStatus === 'rejected') {
            $dbStatus = 'rejected';
        }

        $now = now();

        DB::table('tasks')->where('id', $id)->update([
            'review_status' => $dbStatus,
            'reviewed_by' => $facultyId,
            'reviewed_at' => $now,
            'updated_at' => $now
        ]);

        // Send notification to the assigned student
        if ($task->assigned_to) {
            $statusLabel = $dbStatus === 'approved' ? 'VERIFIED' : ($dbStatus === 'rejected' ? 'REVISIONS REQUESTED' : 'PENDING');
            DB::table('notifications')->insert([
                'user_id' => $task->assigned_to,
                'type' => 'task_review',
                'message' => 'Your task "' . $task->title . '" has been marked as ' . $statusLabel . ' by faculty.',
                'is_read' => false,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        $updatedTask = DB::table('tasks')
            ->leftJoin('users as assigned_user', 'assigned_user.id', '=', 'tasks.assigned_to')
            ->leftJoin('users as reviewer', 'reviewer.id', '=', 'tasks.reviewed_by')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $id)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                // 'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'tasks.review_status',
                'tasks.reviewed_by',
                'tasks.reviewed_at',
                'assigned_user.name as assigned_to_name',
                'reviewer.name as reviewer_name'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Task review status updated to ' . $dbStatus . '.',
            'task' => $updatedTask
        ], 200);
    }

    /**
     * Get student work logs for a specific project assigned to the logged-in faculty.
     */
    public function getProjectWorkLogs($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        // Verify project assignment for faculty
        $isAssigned = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->where('project_id', $id)
            ->exists();
        $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
        if ($hasAnyAssignments && !$isAssigned) {
            return response()->json(['error' => 'You are not assigned to this project.'], 403);
        }

        // Fetch student work logs related to this project
        $workLogs = DB::table('student_work_logs')
            ->join('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
            ->join('users as student', 'student.id', '=', 'project_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'student.id')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('users as approver', 'approver.id', '=', 'student_work_logs.approved_by')
            ->where('project_student.project_id', $id)
            ->select(
                'student_work_logs.id',
                'student_work_logs.project_student_id',
                'student_work_logs.task_id',
                'student_work_logs.work_date',
                'student_work_logs.hours_worked',
                'student_work_logs.description',
                'student_work_logs.approval_status',
                'student_work_logs.approved_by',
                'student_work_logs.approved_at',
                'student_work_logs.created_at',
                'student.id as student_id',
                'student.name as student_name',
                'student.email as student_email',
                'student_profiles.designation as student_designation',
                'tasks.title as task_title',
                'tasks.status as task_status',
                'tasks.due_date as task_due_date',
                'modules.id as module_id',
                'modules.module_name',
                'approver.name as approved_by_name'
            )
            ->orderBy('student_work_logs.work_date', 'desc')
            ->orderBy('student_work_logs.id', 'desc')
            ->get();

        return response()->json([
            'project' => $project,
            'work_logs' => $workLogs
        ]);
    }

    /**
     * Approve or reject a student work log.
     * When faculty approves it:
     * - Update approval_status = 'approved', approved_by, approved_at in student_work_logs.
     * - Update status in tasks table as 'completed', review_status as 'approved'.
     * - Notify student.
     */
    public function approveWorkLog($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'approval_status' => 'required|in:approved,rejected,pending'
        ]);

        $workLog = DB::table('student_work_logs')->where('id', $id)->first();
        if (!$workLog) {
            return response()->json(['error' => 'Work log entry not found.'], 404);
        }

        // Verify that the project student belongs to a project assigned to this faculty
        $projectStudent = DB::table('project_student')->where('id', $workLog->project_student_id)->first();
        if (!$projectStudent) {
            return response()->json(['error' => 'Project student record not found.'], 404);
        }

        $projectId = $projectStudent->project_id;
        $isAssigned = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->where('project_id', $projectId)
            ->exists();
        $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
        if ($hasAnyAssignments && !$isAssigned) {
            return response()->json(['error' => 'You are not assigned to this project.'], 403);
        }

        $newStatus = $validated['approval_status'];
        $now = now();

        // 1. Update student_work_logs
        DB::table('student_work_logs')->where('id', $id)->update([
            'approval_status' => $newStatus,
            'approved_by' => $facultyId,
            'approved_at' => $now,
            'updated_at' => $now
        ]);

        // 2. If approved, update status in tasks table as 'completed'
        $updatedTask = null;
        if ($newStatus === 'approved' && $workLog->task_id) {
            DB::table('tasks')->where('id', $workLog->task_id)->update([
                'status' => 'completed',
                'review_status' => 'approved',
                'reviewed_by' => $facultyId,
                'reviewed_at' => $now,
                'updated_at' => $now
            ]);

            $updatedTask = DB::table('tasks')->where('id', $workLog->task_id)->first();
        }

        // 3. Send notification to the student
        $taskTitle = $updatedTask ? $updatedTask->title : 'Assigned Task';
        $notifMessage = $newStatus === 'approved'
            ? "Your work log for task \"{$taskTitle}\" ({$workLog->hours_worked} hrs on {$workLog->work_date}) has been APPROVED by faculty, and the task status has been updated to COMPLETED."
            : "Your work log for task \"{$taskTitle}\" has been marked as REJECTED by faculty.";

        DB::table('notifications')->insert([
            'user_id' => $projectStudent->student_id,
            'type' => 'work_log_review',
            'message' => $notifMessage,
            'is_read' => false,
            'created_at' => $now,
            'updated_at' => $now
        ]);

        // Fetch refreshed work log
        $refreshedLog = DB::table('student_work_logs')
            ->join('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
            ->join('users as student', 'student.id', '=', 'project_student.student_id')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('users as approver', 'approver.id', '=', 'student_work_logs.approved_by')
            ->where('student_work_logs.id', $id)
            ->select(
                'student_work_logs.id',
                'student_work_logs.project_student_id',
                'student_work_logs.task_id',
                'student_work_logs.work_date',
                'student_work_logs.hours_worked',
                'student_work_logs.description',
                'student_work_logs.approval_status',
                'student_work_logs.approved_by',
                'student_work_logs.approved_at',
                'student.name as student_name',
                'student.email as student_email',
                'tasks.title as task_title',
                'tasks.status as task_status',
                'modules.module_name',
                'approver.name as approved_by_name'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'approved' 
                ? 'Work log approved successfully and task status updated to completed.' 
                : 'Work log marked as rejected.',
            'work_log' => $refreshedLog,
            'task' => $updatedTask
        ], 200);
    }

    /**
     * Verify a GitHub repository link for a project.
     * Updates is_verified, verified_by, and verified_at in github_repositories table.
     */
    public function verifyGithubRepository($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $repo = DB::table('github_repositories')->where('id', $id)->first();
        if (!$repo) {
            return response()->json(['error' => 'Repository not found.'], 404);
        }

        DB::table('github_repositories')->where('id', $id)->update([
            'is_verified' => 1,
            'verified_by' => $facultyId,
            'verified_at' => now(),
            'updated_at' => now(),
        ]);

        $updatedRepo = DB::table('github_repositories')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'GitHub repository link verified successfully.',
            'repository' => $updatedRepo
        ], 200);
    }
}


