<?php

namespace Modules\Faculty\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FacultyController extends Controller
{
    /**
     * Resolve the faculty user ID from JWT token or request context.
     */
    private function getFacultyId(?Request $request = null)
    {
        $request = $request ?: request();
        // 1. Check if auth.jwt middleware merged auth_user
        $authUser = $request ? $request->get('auth_user') : null;
        if ($authUser && isset($authUser['sub'])) {
            return $authUser['sub'];
        }

        // 2. Try parsing Bearer token or query param token
        $token = $request->bearerToken() ?: $request->query('token');
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                if (isset($payload['sub'])) {
                    return $payload['sub'];
                }
            }
            if (str_contains($token, '|')) {
                [$tokenId, $tokenPlain] = explode('|', $token, 2);
                $pat = DB::table('personal_access_tokens')->where('id', $tokenId)->first();
                if ($pat && $pat->tokenable_id) {
                    return (int) $pat->tokenable_id;
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

    private function getWorkLogRatingColumnExpression(): mixed
    {
        static $expr = null;
        if ($expr !== null) {
            return $expr;
        }
        if (Schema::hasColumn('student_work_logs', 'rating')) {
            $expr = DB::raw('student_work_logs.rating as rating, student_work_logs.rating as ratings');
        } elseif (Schema::hasColumn('student_work_logs', 'ratings')) {
            $expr = DB::raw('student_work_logs.ratings as rating, student_work_logs.ratings as ratings');
        } else {
            $expr = DB::raw('NULL as rating, NULL as ratings');
        }
        return $expr;
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
            ->select('id', 'title', 'title as name', 'client_name', 'project_type', 'status', 'deliverables', 'expected_timeline', 'budget', 'created_at')
            ->get();

        // Calculate overall progress for each project based on modules and completed modules
        foreach ($projects as $p) {
            $modules = DB::table('modules')->where('project_id', $p->id)->get();
            $totalModules = $modules->count();
            $completedModules = 0;
            $totalTasks = 0;
            $completedTasks = 0;

            if ($totalModules > 0) {
                $moduleIds = $modules->pluck('id');
                $tasks = DB::table('tasks')->whereIn('module_id', $moduleIds)->get();
                $totalTasks = $tasks->count();
                $completedTasks = $tasks->where('status', 'completed')->count();

                foreach ($modules as $m) {
                    $mTasks = $tasks->where('module_id', $m->id);
                    $mTaskCount = $mTasks->count();
                    $mCompletedCount = $mTasks->where('status', 'completed')->count();

                    // A module is considered completed if marked as 'completed' in modules table
                    // OR if it has tasks and all tasks inside that module are completed
                    if (strtolower($m->status ?? '') === 'completed' || ($mTaskCount > 0 && $mCompletedCount === $mTaskCount)) {
                        $completedModules++;
                    }
                }
            }

            $p->total_modules = $totalModules;
            $p->completed_modules = $completedModules;
            $p->total_tasks = $totalTasks;
            $p->completed_tasks = $completedTasks;
            // Overall progress based on modules inside the project
            $p->progress = $totalModules > 0 ? round(($completedModules / $totalModules) * 100) : ($totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0);
            $p->students_count = DB::table('project_student')->where('project_id', $p->id)->count();
        }

        // Distinct students count under these projects
        $studentsCount = DB::table('project_student')
            ->whereIn('project_id', $projectIds)
            ->distinct('student_id')
            ->count('student_id');

        $facultyProjectIds = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->pluck('project_id');

        $participantMeetingIds = Schema::hasTable('meeting_participants')
            ? DB::table('meeting_participants')->where('user_id', $facultyId)->pluck('meeting_id')
            : collect([]);

        // Meetings today for logged in faculty
        $todayStart = date('Y-m-d 00:00:00');
        $todayEnd = date('Y-m-d 23:59:59');
        $meetingsTodayCount = DB::table('meetings')
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($facultyProjectIds, $facultyId, $participantMeetingIds, $projectIds) {
                $q->where('meetings.created_by', $facultyId);
                if ($facultyProjectIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.project_id', $facultyProjectIds);
                } elseif ($projectIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.project_id', $projectIds);
                }
                if ($participantMeetingIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.id', $participantMeetingIds);
                }
            })
            ->whereBetween('scheduled_at', [$todayStart, $todayEnd])
            ->count();

        // Upcoming meetings for logged in faculty
        $nowStr = date('Y-m-d H:i:s');
        $upcomingMeetings = DB::table('meetings')
            ->join('projects', 'projects.id', '=', 'meetings.project_id')
            ->where('meetings.status', '!=', 'cancelled')
            ->where(function ($q) use ($facultyProjectIds, $facultyId, $participantMeetingIds, $projectIds) {
                $q->where('meetings.created_by', $facultyId);
                if ($facultyProjectIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.project_id', $facultyProjectIds);
                } elseif ($projectIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.project_id', $projectIds);
                }
                if ($participantMeetingIds->isNotEmpty()) {
                    $q->orWhereIn('meetings.id', $participantMeetingIds);
                }
            })
            ->where(function ($q) use ($nowStr) {
                $q->where('meetings.scheduled_at', '>=', now())
                  ->orWhere('meetings.scheduled_at', '>=', $nowStr);
            })
            ->select('meetings.id', 'meetings.title', 'meetings.scheduled_at', 'meetings.location', 'meetings.meeting_link', 'projects.title as project_name')
            ->orderBy('meetings.scheduled_at', 'asc')
            ->limit(5)
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
                'photo' => ($profile && !empty($profile->photo)) ? $profile->photo : ($user && !empty($user->avatar) ? $user->avatar : null),
                'avatar' => ($profile && !empty($profile->photo)) ? $profile->photo : ($user && !empty($user->avatar) ? $user->avatar : null),
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
            ->select('id', 'name', 'email', 'phone', 'role', 'avatar', 'created_at')
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

        $photo = ($profile && !empty($profile->photo)) ? $profile->photo : ($user && !empty($user->avatar) ? $user->avatar : null);

        return response()->json([
            'id' => $user ? $user->id : $facultyId,
            'name' => $user ? $user->name : 'Faculty Member',
            'email' => $user ? $user->email : 'faculty@rajagiri.edu',
            'phone' => ($user && $user->phone) ? $user->phone : '+91 484 2660605',
            'role' => $user ? ucfirst($user->role) : 'Faculty',
            'department' => $profile ? $profile->department : 'Department of Computer Applications',
            'designation' => $profile ? $profile->designation : 'Associate Professor',
            'photo' => $photo,
            'avatar' => $photo,
            'created_at' => $user ? $user->created_at : null,
        ]);
    }

    /**
     * Update faculty profile details in users table and faculty_profiles table.
     */
    public function updateProfile(Request $request)
    {
        $facultyId = $this->getFacultyId($request);
        if (!$facultyId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Limits match the columns (users.name varchar(150), users.phone varchar(20),
        // faculty_profiles.department varchar(150), .designation varchar(100)).
        // The email must end in @rajagiri.edu: login only accepts those
        // (AuthController::login + LoginView), so any other address would lock
        // the faculty member out. Uniqueness is case-insensitive via the column collation.
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255|ends_with:@rajagiri.edu|unique:users,email,' . $facultyId,
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:150',
            'designation' => 'nullable|string|max:100',
        ], [
            'email.ends_with' => 'The email must be an @rajagiri.edu address — other addresses cannot be used to log in.',
            'name.max' => 'The name must not be longer than 150 characters.',
            'phone.max' => 'The phone number must not be longer than 20 characters.',
        ]);

        $user = DB::table('users')->where('id', $facultyId)->first();
        if (!$user) {
            return response()->json(['error' => 'Faculty user not found'], 404);
        }

        DB::table('users')->where('id', $facultyId)->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'updated_at' => now(),
        ]);

        $department = $validated['department'] ?? 'Department of Computer Applications';
        $designation = $validated['designation'] ?? 'Associate Professor';

        if (Schema::hasTable('faculty_profiles')) {
            $existingProfile = DB::table('faculty_profiles')->where('faculty_id', $facultyId)->first();
            if ($existingProfile) {
                DB::table('faculty_profiles')->where('faculty_id', $facultyId)->update([
                    'department' => $department,
                    'designation' => $designation,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('faculty_profiles')->insert([
                    'faculty_id' => $facultyId,
                    'department' => $department,
                    'designation' => $designation,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $facultyId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role' => ucfirst($user->role),
                'department' => $department,
                'designation' => $designation,
            ]
        ]);
    }

    /**
     * Upload or update faculty profile photo in faculty_profiles and users tables.
     */
    public function uploadProfilePhoto(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $file = $request->file('photo') ?? $request->file('file') ?? $request->file('avatar');
        
        $photoUrl = null;
        if ($file) {
            $destinationDir = public_path('storage/faculty_photos');
            if (!file_exists($destinationDir)) {
                mkdir($destinationDir, 0777, true);
            }
            $filename = 'faculty_' . $facultyId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationDir, $filename);
            $photoUrl = url('storage/faculty_photos/' . $filename);
        } else if ($request->filled('photo')) {
            $photoVal = $request->input('photo');
            if (preg_match('/^data:image\/(\w+);base64,/', $photoVal, $type)) {
                $data = substr($photoVal, strpos($photoVal, ',') + 1);
                $type = strtolower($type[1]);
                $data = base64_decode($data);
                if ($data !== false) {
                    $destinationDir = public_path('storage/faculty_photos');
                    if (!file_exists($destinationDir)) {
                        mkdir($destinationDir, 0777, true);
                    }
                    $filename = 'faculty_' . $facultyId . '_' . time() . '.' . $type;
                    file_put_contents($destinationDir . '/' . $filename, $data);
                    $photoUrl = url('storage/faculty_photos/' . $filename);
                }
            } else {
                $photoUrl = $photoVal;
            }
        }

        if (!$photoUrl) {
            return response()->json(['status' => 'error', 'message' => 'No image file or photo URL provided'], 422);
        }

        if (Schema::hasTable('faculty_profiles')) {
            $existing = DB::table('faculty_profiles')->where('faculty_id', $facultyId)->first();
            if ($existing) {
                DB::table('faculty_profiles')->where('faculty_id', $facultyId)->update([
                    'photo' => $photoUrl,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('faculty_profiles')->insert([
                    'faculty_id' => $facultyId,
                    'department' => 'Department of Computer Applications',
                    'designation' => 'Associate Professor',
                    'photo' => $photoUrl,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('users')->where('id', $facultyId)->update([
            'avatar' => $photoUrl,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile photo updated successfully',
            'photo_url' => $photoUrl,
            'photo' => $photoUrl,
            'data' => [
                'photo' => $photoUrl
            ]
        ]);
    }

    /**
     * Remove faculty profile photo from faculty_profiles and users tables.
     */
    public function deleteProfilePhoto(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        if (Schema::hasTable('faculty_profiles')) {
            DB::table('faculty_profiles')->where('faculty_id', $facultyId)->update([
                'photo' => null,
                'updated_at' => now(),
            ]);
        }

        DB::table('users')->where('id', $facultyId)->update([
            'avatar' => null,
            'updated_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile photo removed successfully'
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
                'projects.deliverables',
                'projects.expected_timeline',
                'projects.budget',
                'projects.priority',
                'projects.status',
                'projects.created_at',
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
                    'deliverables',
                    'expected_timeline',
                    'budget',
                    'priority',
                    'status',
                    'created_at'
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

        // Identify students who belong to this faculty's assigned projects
        $facultyStudentIds = collect();
        if ($projectIds->isNotEmpty()) {
            $facultyStudentIds = DB::table('project_student')
                ->whereIn('project_id', $projectIds)
                ->pluck('student_id')
                ->unique();
        }

        $query = DB::table('project_student')
            ->join('users', 'users.id', '=', 'project_student.student_id')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->join('projects', 'projects.id', '=', 'project_student.project_id');

        // If faculty has no assigned projects, return empty list
        if ($projectIds->isEmpty()) {
            return response()->json([]);
        }

        // Only include students working on projects assigned to this faculty!
        $query->whereIn('project_student.project_id', $projectIds);

        $studentRecords = $query->select(
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
        ->get();

        // Calculate average ratings from tasks table for each student per project
        $taskRatings = DB::table('tasks')
            ->join('modules', 'modules.id', '=', 'tasks.module_id')
            ->whereNotNull('tasks.assigned_to')
            ->where(function ($q) {
                $q->whereNotNull('tasks.rating');
            })
            ->select(
                'tasks.assigned_to as student_id',
                'modules.project_id',
                DB::raw('ROUND(AVG(tasks.rating), 1) as avg_rating'),
                DB::raw('COUNT(tasks.id) as rated_tasks_count')
            )
            ->groupBy('tasks.assigned_to', 'modules.project_id')
            ->get()
            ->keyBy(function ($item) {
                return $item->student_id . '_' . $item->project_id;
            });

        // Also calculate average ratings from student_work_logs table for each student per project
        $workLogCol = Schema::hasColumn('student_work_logs', 'rating') ? 'rating' : (Schema::hasColumn('student_work_logs', 'ratings') ? 'ratings' : null);
        $workLogRatings = collect();
        if ($workLogCol) {
            $workLogRatings = DB::table('student_work_logs')
                ->join('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
                ->whereNotNull("student_work_logs.{$workLogCol}")
                ->select(
                    'project_student.student_id',
                    'project_student.project_id',
                    DB::raw("ROUND(AVG(student_work_logs.{$workLogCol}), 1) as avg_rating"),
                    DB::raw('COUNT(student_work_logs.id) as rated_tasks_count')
                )
                ->groupBy('project_student.student_id', 'project_student.project_id')
                ->get()
                ->keyBy(function ($item) {
                    return $item->student_id . '_' . $item->project_id;
                });
        }

        $students = $studentRecords->map(function ($s) use ($taskRatings, $workLogRatings, $projectIds) {
            $key = $s->student_id . '_' . $s->project_id;
            $ratingObj = $taskRatings->get($key);
            $wlRatingObj = $workLogRatings->get($key);
            $avgRating = $ratingObj ? (float) $ratingObj->avg_rating : ($wlRatingObj ? (float) $wlRatingObj->avg_rating : null);
            $ratedTasksCount = $ratingObj ? (int) $ratingObj->rated_tasks_count : ($wlRatingObj ? (int) $wlRatingObj->rated_tasks_count : 0);

            // Calculate other projects this student is working in (excluding this faculty's assigned projects)
            $allStudentProjectIds = DB::table('project_student')
                ->where('student_id', $s->student_id)
                ->pluck('project_id');

            $otherProjectsQuery = DB::table('projects')
                ->whereIn('id', $allStudentProjectIds);

            if ($projectIds->isNotEmpty()) {
                $otherProjectsQuery->whereNotIn('id', $projectIds);
            } else {
                $otherProjectsQuery->where('id', '!=', $s->project_id);
            }

            $otherProjects = $otherProjectsQuery
                ->pluck('title')
                ->unique()
                ->values()
                ->toArray();

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
                'rating' => $avgRating,
                'avg_rating' => $avgRating,
                'rated_tasks_count' => $ratedTasksCount,
                'other_projects' => $otherProjects,
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
            'important_decisions' => 'nullable|string',
            'document' => 'nullable|file|max:20480'
        ]);

        $meeting = DB::table('meetings')->where('id', $id)->first();
        if (!$meeting) {
            return response()->json(['error' => 'Meeting not found.'], 404);
        }

        $newStatus = $validated['status'];

        if ($newStatus === 'completed') {
            $minutes = trim($validated['minutes'] ?? '');
            $decisions = trim($validated['important_decisions'] ?? '');

            // Handle optional document upload to insert into minutes field of meeting_notes table
            $documentUrl = null;
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
                $path = $file->storeAs('meeting_documents', $filename, 'public');
                $documentUrl = url('storage/' . $path);
            }

            if (!empty($documentUrl)) {
                if (!empty($minutes)) {
                    $minutes = $minutes . "\n\nAttached Document: " . $documentUrl;
                } else {
                    $minutes = "Attached Document: " . $documentUrl;
                }
            }

            if (empty($minutes)) {
                return response()->json([
                    'error' => 'Please provide minutes of meeting or upload a document.'
                ], 422);
            }

            if (empty($decisions)) {
                $decisions = 'Document attached for review and records.';
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
                    'file' => $documentUrl,
                    'uploaded_by' => $facultyId,
                    'uploaded_on' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Meeting status updated to completed and notes saved.",
                'status' => 'completed',
                'minutes' => $minutes,
                'important_decisions' => $decisions,
                'document_url' => $documentUrl
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
            ->leftJoin('users', 'users.id', '=', 'student_reports.student_id')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id');

        if ($request->filled('project_id')) {
            $reqProjectId = (int) $request->input('project_id');
            if ($projectIds->isNotEmpty() && !$projectIds->contains($reqProjectId)) {
                return response()->json([]);
            }
            $query->where('student_reports.project_id', $reqProjectId);
        } elseif ($projectIds->isNotEmpty()) {
            $query->whereIn('student_reports.project_id', $projectIds);
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
            'student_reports.work_done',
            'student_reports.report_file',
            'student_reports.approval_status',
            'student_reports.feedback',
            'student_reports.submitted_at',
            'student_reports.task_id',
            'tasks.title as task_title',
            'tasks.github_pr_url',
            'github_repositories.branch_name',
            'github_repositories.branch_url'
        )
        ->orderBy('student_reports.submitted_at', 'desc')
        ->get()
        ->map(function ($r) {
            $fileName = $r->report_file ? basename($r->report_file) : null;
            return [
                'id' => $r->id,
                'project_id' => $r->project_id,
                'project_title' => $r->project_title ?: 'General Project',
                'student_id' => $r->student_id,
                'student_name' => $r->student_name ?: 'Student',
                'student_email' => $r->student_email ?: '',
                'report_type' => ucfirst($r->report_type),
                'report_date' => $r->report_date,
                'work_done' => $r->work_done,
                'approval_status' => ucfirst($r->approval_status ?: 'pending'),
                'feedback' => $r->feedback,
                'submitted_at' => $r->submitted_at,
                'report_file' => $r->report_file,
                'file_name' => $fileName,
                'file_url' => $r->report_file ? asset('storage/' . $r->report_file) : null,
                'download_url' => $r->report_file ? url('api/faculty/reports/' . $r->id . '/download') : null,
                'task_id' => $r->task_id,
                'task_title' => $r->task_title,
                'github_pr_url' => $r->github_pr_url,
                'branch_name' => $r->branch_name,
                'branch_url' => $r->branch_url,
            ];
        });

        return response()->json($reports);
    }

    /**
     * Approve or reject a student progress report with feedback.
     */
    public function reviewReport(Request $request, $id)
    {
        $facultyId = $this->getFacultyId($request);

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

        // Notify student
        if (Schema::hasTable('notifications')) {
            $statusText = ucfirst($statusLower);
            $reportType = ucfirst($report->report_type);
            $msg = "Your {$reportType} Report for {$report->report_date} was {$statusText} by faculty.";
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
            'feedback' => $request->input('feedback') ?: $report->feedback
        ]);
    }

    /**
     * Download attached progress report file for faculty.
     */
    public function downloadReportFile(Request $request, $id)
    {
        $facultyId = $this->getFacultyId($request);
        if (!$facultyId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $report = DB::table('student_reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['error' => 'Report not found'], 404);
        }

        // Verify project is assigned to this faculty
        if ($report->project_id) {
            $isAssigned = DB::table('project_faculty')
                ->where('faculty_id', $facultyId)
                ->where('project_id', $report->project_id)
                ->exists();
            $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
            if ($hasAnyAssignments && !$isAssigned) {
                return response()->json(['error' => 'Unauthorized. This project is not assigned to you.'], 403);
            }
        }

        if ($report->report_file && Storage::disk('public')->exists($report->report_file)) {
            $filePath = Storage::disk('public')->path($report->report_file);
            $ext = pathinfo($report->report_file, PATHINFO_EXTENSION);
            $studentName = DB::table('users')->where('id', $report->student_id)->value('name') ?: 'Student';
            $safeStudentName = preg_replace('/[^A-Za-z0-9_]/', '_', $studentName);
            $downloadName = "Student_Report_{$safeStudentName}_{$report->report_date}_{$report->id}.{$ext}";

            return response()->download($filePath, $downloadName);
        }

        // If no physical file exists, export text summary of work done
        $studentName = DB::table('users')->where('id', $report->student_id)->value('name') ?: 'Student';
        $safeStudentName = preg_replace('/[^A-Za-z0-9_]/', '_', $studentName);
        $content = "STUDENT WORK REPORT (student_reports)\n";
        $content .= "====================================\n";
        $content .= "Report ID: " . $report->id . "\n";
        $content .= "Student: " . $studentName . "\n";
        $content .= "Report Type: " . ucfirst($report->report_type) . "\n";
        $content .= "Report Date: " . $report->report_date . "\n";
        $content .= "Status: " . ucfirst($report->approval_status ?? 'pending') . "\n";
        $content .= "Submitted At: " . $report->submitted_at . "\n\n";
        $content .= "WORK DONE:\n";
        $content .= ($report->work_done ?? 'None') . "\n\n";
        if (!empty($report->feedback)) {
            $content .= "FACULTY FEEDBACK:\n" . $report->feedback . "\n";
        }

        $downloadName = "Student_Report_{$safeStudentName}_{$report->report_date}_{$report->id}.txt";
        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$downloadName}\""
        ]);
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
            'task_id' => 'nullable|integer',
        ]);

        $insertData = [
            'project_id' => $validated['project_id'],
            'faculty_id' => $facultyId,
            'student_id' => $validated['student_id'],
            'comments' => $validated['comments'],
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (!empty($validated['task_id']) && Schema::hasColumn('feedback', 'task_id')) {
            $insertData['task_id'] = $validated['task_id'];
        }

        $feedbackId = DB::table('feedback')->insertGetId($insertData);

        // Notify student
        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $validated['student_id'],
                'type' => 'feedback',
                'message' => "Faculty added feedback on your task: {$validated['comments']}",
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['success' => true, 'feedback_id' => $feedbackId, 'message' => 'Feedback saved successfully.']);
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
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'user_id' => $n->user_id,
                    'type' => $n->type,
                    'title' => $n->type ? ucwords(str_replace('_', ' ', $n->type)) : 'Notification',
                    'description' => $n->message,
                    'message' => $n->message,
                    'is_read' => (bool) $n->is_read,
                    'unread' => empty($n->is_read) || $n->is_read == 0,
                    'time' => $n->created_at ? date('M d, Y h:i A', strtotime($n->created_at)) : 'Recently',
                    'created_at' => $n->created_at
                ];
            });

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
            ->leftJoin('users', 'users.id', '=', 'github_repositories.student_id')
            ->where('github_repositories.project_id', $id)
            ->select(
                'github_repositories.id',
                'github_repositories.project_id',
                'github_repositories.student_id',
                'users.name as student_name',
                'github_repositories.link_type',
                'github_repositories.repository_name',
                'github_repositories.repository_url',
                'github_repositories.branch_name',
                'github_repositories.branch_url',
                'github_repositories.submitted_date',
                'github_repositories.is_verified',
                'github_repositories.verified_by',
                'github_repositories.verified_at'
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
            ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'users.name as assigned_to_name',
                'tasks.github_repository_id',
                'tasks.github_pr_url',
                'github_repositories.branch_name',
                'github_repositories.branch_url'
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
        $facultyId = $this->getFacultyId($request);

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
            ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
            ->whereIn('tasks.module_id', $moduleIds)
            ->select(
                'tasks.id',
                'tasks.module_id',
                'modules.module_name',
                'tasks.title',
                'tasks.description',
                'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'tasks.github_repository_id',
                'tasks.github_pr_url',
                'github_repositories.branch_name',
                'github_repositories.branch_url',
                'tasks.reviewed_by',
                'tasks.reviewed_at',
                'assigned_user.name as assigned_to_name',
                'reviewer.name as reviewer_name'
            )
            ->orderBy('tasks.id', 'desc')
            ->get();

        // Calculate hours worked per task from student_work_logs
        $taskIds = $tasks->pluck('id');
        $taskWorkLogs = DB::table('student_work_logs')
            ->whereIn('task_id', $taskIds)
            ->select('task_id', 'hours_worked', 'approval_status')
            ->get();

        $taskHoursMap = [];
        foreach ($taskWorkLogs as $wl) {
            $tid = $wl->task_id;
            $h = (float) ($wl->hours_worked ?? 0);
            if (!isset($taskHoursMap[$tid])) {
                $taskHoursMap[$tid] = 0;
            }
            $taskHoursMap[$tid] += $h;
        }

        // Attach hours_worked to each task
        foreach ($tasks as $t) {
            $t->hours_worked = round($taskHoursMap[$t->id] ?? 0, 1);
            $t->weight = (int) ($t->weight ?? 1);
        }

        // Group tasks by module to calculate module weights, completed weight, and total hours worked
        $behindScheduleModules = [];
        foreach ($modules as $m) {
            $mTasks = $tasks->where('module_id', $m->id);
            $totalWeight = 0;
            $completedWeight = 0;
            $totalHours = 0;
            $completedCount = 0;
            $totalCount = $mTasks->count();

            foreach ($mTasks as $t) {
                $w = (int) ($t->weight ?? 1);
                $totalWeight += $w;
                $totalHours += ($t->hours_worked ?? 0);

                if (strtolower($t->status ?? '') === 'completed') {
                    $completedWeight += $w;
                    $completedCount++;
                }
            }

            $m->total_tasks = $totalCount;
            $m->completed_tasks = $completedCount;
            $m->total_weight = $totalWeight;
            $m->completed_weight = $completedWeight;
            $m->total_hours_worked = round($totalHours, 1);

            // Check if module is behind schedule:
            // If total hours spent exceeds expected weight for completed tasks
            // or if total hours spent exceeds total planned weight while tasks remain incomplete.
            $isBehind = false;
            $behindReason = null;

            if ($totalCount > 0 && strtolower($m->status ?? '') !== 'completed') {
                if ($completedCount < $totalCount) {
                    if ($totalWeight > 0 && $completedWeight > 0 && $totalHours > $completedWeight) {
                        $isBehind = true;
                        $behindReason = "Actual time logged ({$totalHours} hrs) exceeds the planned weight of completed tasks ({$completedWeight} hrs).";
                    } elseif ($totalWeight > 0 && $completedWeight === 0 && $totalHours > ($totalWeight * 0.5)) {
                        $isBehind = true;
                        $behindReason = "Students have logged {$totalHours} hrs without any tasks completed yet (total module weight: {$totalWeight} hrs).";
                    } elseif ($totalWeight > 0 && $totalHours > $totalWeight) {
                        $isBehind = true;
                        $behindReason = "Actual time logged ({$totalHours} hrs) has exceeded the entire module planned weight ({$totalWeight} hrs).";
                    }
                }
            }

            $m->is_behind_schedule = $isBehind;
            $m->behind_reason = $behindReason;

            if ($isBehind) {
                $behindScheduleModules[] = [
                    'module_id' => $m->id,
                    'module_name' => $m->module_name,
                    'total_weight' => $totalWeight,
                    'completed_weight' => $completedWeight,
                    'total_hours' => $totalHours,
                    'reason' => $behindReason
                ];

                // Auto-create or refresh a notification for the faculty (deduplicated by reference)
                $notifMsg = "Module \"{$m->module_name}\" in project \"{$project->title}\" is behind schedule. Total hours worked ({$totalHours} hrs) exceeds planned task time ({$completedWeight}/{$totalWeight} hrs).";
                
                $existingNotif = DB::table('notifications')
                    ->where('user_id', $facultyId)
                    ->where('type', 'module_behind_schedule')
                    ->where('message', 'like', "%Module \"{$m->module_name}\"%")
                    ->first();

                if (!$existingNotif) {
                    DB::table('notifications')->insert([
                        'user_id' => $facultyId,
                        'type' => 'module_behind_schedule',
                        'message' => $notifMsg,
                        'is_read' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        return response()->json([
            'project' => $project,
            'project_students' => $projectStudents,
            'modules' => $modules,
            'tasks' => $tasks,
            'behind_schedule_modules' => $behindScheduleModules
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
            'module_id' => 'nullable', // module ID from modules table or 'new'
            'new_module_name' => 'nullable|string|max:150',
            'name' => 'nullable|string|max:150',
            'module_name' => 'nullable|string|max:150',
            'new_description' => 'nullable|string',
            'description' => 'nullable|string',
            'document_path' => 'nullable|string|max:1000',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'integer'
        ]);

        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        if (strtolower($project->status ?? '') === 'closed') {
            return response()->json(['error' => 'Cannot assign modules or tasks. This project is closed.'], 422);
        }

        $moduleId = $validated['module_id'] ?? 'new';
        $moduleName = $validated['new_module_name'] ?? $validated['name'] ?? $validated['module_name'] ?? null;
        $moduleDesc = $validated['new_description'] ?? $validated['description'] ?? null;
        $moduleDoc = $validated['document_path'] ?? $request->input('document_path');

        try {
            if ($moduleId === 'new' || !is_numeric($moduleId)) {
                if (empty($moduleName)) {
                    return response()->json(['error' => 'Module name is required when adding a new module.'], 422);
                }
                $insertData = [
                    'project_id' => $id,
                    'module_name' => $moduleName,
                    'description' => $moduleDesc,
                    'weight_percentage' => 25.00,
                    'status' => 'not_started',
                    'created_by' => $facultyId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                if (Schema::hasColumn('modules', 'document_path')) {
                    $insertData['document_path'] = $moduleDoc;
                }
                if (Schema::hasColumn('modules', 'document_name') && $request->filled('document_name')) {
                    $insertData['document_name'] = $request->input('document_name');
                }
                $moduleId = DB::table('modules')->insertGetId($insertData);
            } else {
                $module = DB::table('modules')->where('id', $moduleId)->where('project_id', $id)->first();
                if (!$module) {
                    return response()->json(['error' => 'Selected module not found for this project.'], 404);
                }
                $moduleName = $module->module_name;
                if ($request->has('document_path') && Schema::hasColumn('modules', 'document_path')) {
                    DB::table('modules')->where('id', $moduleId)->update([
                        'document_path' => $moduleDoc,
                        'updated_at' => now(),
                    ]);
                }
                if ($request->filled('document_name') && Schema::hasColumn('modules', 'document_name')) {
                    DB::table('modules')->where('id', $moduleId)->update([
                        'document_name' => $request->input('document_name'),
                        'updated_at' => now(),
                    ]);
                }
            }

            $assignedStudentIds = $validated['student_ids'] ?? [];

            // Sync module_student table when re-assigning an existing module
            if ($moduleId !== 'new' && is_numeric($moduleId) && $request->has('student_ids')) {
                DB::table('module_student')
                    ->where('module_id', $moduleId)
                    ->whereNotIn('student_id', $assignedStudentIds)
                    ->delete();
            }

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

            // When students are assigned to module, change status to 'assigned' (assignment details stored strictly in module_student)
            if (!empty($assignedStudentIds)) {
                DB::table('modules')->where('id', $moduleId)->update([
                    'status' => 'assigned',
                    'updated_at' => now(),
                ]);
            } else {
                // If no students assigned, ensure status is 'not_started' if newly created or no students
                $hasAnyStudents = DB::table('module_student')->where('module_id', $moduleId)->exists();
                if (!$hasAnyStudents) {
                    DB::table('modules')->where('id', $moduleId)->update([
                        'status' => 'not_started',
                        'updated_at' => now(),
                    ]);
                }
            }

            $module = DB::table('modules')->where('id', $moduleId)->first();
            $module->assigned_students = DB::table('module_student')
                ->join('users', 'users.id', '=', 'module_student.student_id')
                ->where('module_student.module_id', $moduleId)
                ->select('users.id as student_id', 'users.name', 'users.email')
                ->get();

            return response()->json([
                'success' => true,
                'message' => "Module '{$moduleName}' updated successfully.",
                'module' => $module
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Error creating/updating module: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'error' => 'Failed to save module: ' . $e->getMessage()
            ], 500);
        }
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
     * When task is first created without student, status is 'todo'.
     * If module has only 1 student, auto-assign task to that student with status 'in_progress'.
     * If task is assigned to student, status becomes 'in_progress'.
     */
    public function createTask(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'module_id' => 'required|integer',
            'task_id' => 'nullable', // Task ID from tasks table or 'new'
            'new_title' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'new_description' => 'nullable|string',
            'description' => 'nullable|string',
            'weight' => 'nullable|integer',
            'assigned_to' => 'nullable|integer',
            'due_date' => 'nullable|date',
        ]);

        $module = DB::table('modules')->where('id', $validated['module_id'])->first();
        if (!$module) {
            return response()->json(['error' => 'Module not found'], 404);
        }

        $project = DB::table('projects')->where('id', $module->project_id)->first();
        if ($project && strtolower($project->status ?? '') === 'closed') {
            return response()->json(['error' => 'Cannot assign tasks. This project is closed.'], 422);
        }

        // Students assigned to this module
        $moduleStudents = DB::table('module_student')
            ->where('module_id', $validated['module_id'])
            ->pluck('student_id');

        $assignedTo = !empty($validated['assigned_to']) ? (int)$validated['assigned_to'] : null;
        $taskTitle = $validated['new_title'] ?? $validated['title'] ?? null;
        $taskDesc = $validated['new_description'] ?? $validated['description'] ?? null;
        $taskWeight = $validated['weight'] ?? 1;

        // Rule: if only one student is assigned to a module then, when a task is created for that module insert the student id in task table
        if ($moduleStudents->count() === 1) {
            $assignedTo = $moduleStudents->first();
        }

        // If a student was explicitly provided, ensure they belong to this module
        if ($assignedTo && !$moduleStudents->contains($assignedTo)) {
            return response()->json([
                'error' => 'Selected student is not assigned to this module. Tasks can only be assigned to students who belong to this module.'
            ], 422);
        }

        // Rule: when a student is assigned to a task, change status to 'in_progress', otherwise 'todo'
        $taskStatus = $assignedTo ? 'in_progress' : 'todo';

        $taskId = $validated['task_id'] ?? 'new';

        if (is_numeric($taskId) && $taskId !== 'new') {
            $task = DB::table('tasks')->where('id', $taskId)->where('module_id', $validated['module_id'])->first();
            if (!$task) {
                return response()->json(['error' => 'Selected task not found under this module.'], 404);
            }
            $taskUpdate = [
                'assigned_to' => $assignedTo,
                'status' => $taskStatus,
                'due_date' => !empty($validated['due_date']) ? $validated['due_date'] : $task->due_date,
                'updated_at' => now(),
            ];
            DB::table('tasks')->where('id', $taskId)->update($taskUpdate);
            $taskTitle = $task->title;
        } else {
            if (empty($taskTitle)) {
                return response()->json(['error' => 'Task title is required.'], 422);
            }
            $taskId = DB::table('tasks')->insertGetId([
                'module_id' => $validated['module_id'],
                'title' => $taskTitle,
                'description' => $taskDesc,
                'weight' => $taskWeight,
                'assigned_to' => $assignedTo,
                'status' => $taskStatus,
                'due_date' => !empty($validated['due_date']) ? $validated['due_date'] : null,
                'created_by' => $facultyId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Send notification to the assigned student
        if ($assignedTo && Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                'user_id' => $assignedTo,
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
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'users.name as assigned_to_name',
                'users.email as assigned_to_email'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => $assignedTo ? "Task '{$taskTitle}' assigned successfully." : "Task '{$taskTitle}' created successfully.",
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
            'review_status' => 'nullable|string',
            'status' => 'nullable|string|in:completed,rework,todo,in_progress',
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

        $inputStatus = $validated['status'] ?? $validated['review_status'] ?? 'completed';
        $newStatus = 'todo';
        if (in_array($inputStatus, ['verified', 'approved', 'completed'])) {
            $newStatus = 'completed';
        } elseif (in_array($inputStatus, ['changes_requested', 'rejected', 'rework'])) {
            $newStatus = 'rework';
        }

        $now = now();

        $taskUpdate = [
            'status' => $newStatus,
            'reviewed_by' => $facultyId,
            'reviewed_at' => $now,
            'updated_at' => $now
        ];

        DB::table('tasks')->where('id', $id)->update($taskUpdate);

        // Rule: if the status of all the task of a module is 'completed' then change the status of module table to 'completed'
        if ($newStatus === 'completed' && $task->module_id) {
            $this->checkAndUpdateModuleCompletion($task->module_id);
        } elseif ($newStatus === 'rework' && $task->module_id) {
            // If task is rework, mark module as rework if it was completed
            $mod = DB::table('modules')->where('id', $task->module_id)->first();
            if ($mod && $mod->status === 'completed') {
                DB::table('modules')->where('id', $task->module_id)->update(['status' => 'rework', 'updated_at' => $now]);
            }
        }

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
                'tasks.weight',
                'tasks.status',
                'tasks.due_date',
                'tasks.assigned_to',
                'tasks.reviewed_by',
                'tasks.reviewed_at',
                'assigned_user.name as assigned_to_name',
                'reviewer.name as reviewer_name'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Task status updated to ' . $newStatus . '.',
            'task' => $updatedTask
        ], 200);
    }

    /**
     * Get student work logs for a specific project assigned to the logged-in faculty.
     */
    public function getProjectWorkLogs($id, Request $request = null)
    {
        try {
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

            // Fetch student work logs related to this project (matched by task's module project OR project_student project)
            $workLogs = DB::table('student_work_logs')
                ->leftJoin('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
                ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
                ->leftJoin('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
                ->leftJoin('users as student', 'student.id', '=', DB::raw('COALESCE(tasks.assigned_to, project_student.student_id)'))
                ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'student.id')
                ->leftJoin('github_repositories', 'github_repositories.id', '=', 'tasks.github_repository_id')
                ->leftJoin('users as approver', 'approver.id', '=', 'student_work_logs.approved_by')
                ->where(function ($q) use ($id) {
                    $q->where('modules.project_id', $id)
                      ->orWhere('project_student.project_id', $id);
                })
                ->select(
                    'student_work_logs.id',
                    'student_work_logs.project_student_id',
                    'student_work_logs.task_id',
                    'student_work_logs.work_date',
                    'student_work_logs.hours_worked',
                    'student_work_logs.description',
                    'student_work_logs.approval_status',
                    $this->getWorkLogRatingColumnExpression(),
                    'student_work_logs.approved_by',
                    'student_work_logs.approved_at',
                    'student_work_logs.created_at',
                    'student.id as student_id',
                    'student.name as student_name',
                    'student.email as student_email',
                    'student_profiles.designation as student_designation',
                    'tasks.title as task_title',
                    'tasks.weight as task_weight',
                    'tasks.status as task_status',
                    'tasks.due_date as task_due_date',
                    'tasks.github_pr_url',
                    'github_repositories.branch_name',
                    'github_repositories.branch_url',
                    'modules.id as module_id',
                    'modules.module_name',
                    'approver.name as approved_by_name'
                )
                ->orderBy('student_work_logs.work_date', 'desc')
                ->orderBy('student_work_logs.id', 'desc')
                ->get();

            // Pre-fetch coordinator notifications once for this project to eliminate per-row N+1 queries
            $notifiedMessages = collect();
            if (Schema::hasTable('notifications')) {
                $notifiedMessages = DB::table('notifications')
                    ->where('project_id', $id)
                    ->where('type', 'task_time_exceeded')
                    ->pluck('message');
            }

            // Calculate deadline compliance, time overrun and coordinator notification status
            $workLogs = $workLogs->map(function ($log) use ($notifiedMessages) {
                $isLate = false;
                $daysLate = 0;
                if (!empty($log->task_due_date)) {
                    $subDate = !empty($log->created_at) ? date('Y-m-d', strtotime($log->created_at)) : $log->work_date;
                    if ($subDate > $log->task_due_date) {
                        $isLate = true;
                        $diff = (strtotime($subDate) - strtotime($log->task_due_date)) / 86400;
                        $daysLate = max(1, (int) ceil($diff));
                    }
                }
                $log->is_late = $isLate;
                $log->days_late = $daysLate;
                $taskWeight = (float) ($log->task_weight ?? 1);
                $hoursWorked = (float) ($log->hours_worked ?? 0);
                $log->task_weight = $taskWeight;
                $log->hours_worked = $hoursWorked;

                $isExceeded = ($taskWeight > 0 && $hoursWorked > $taskWeight);
                $log->is_time_exceeded = $isExceeded;
                $log->time_overrun = $isExceeded ? round($hoursWorked - $taskWeight, 1) : 0;

                // Check in-memory if coordinator has already been notified about this task overrun
                $notifExists = false;
                if ($notifiedMessages->isNotEmpty() && !empty($log->task_title)) {
                    $taskTitleEsc = $log->task_title;
                    $notifExists = $notifiedMessages->contains(function ($msg) use ($taskTitleEsc) {
                        return str_contains($msg, "task '{$taskTitleEsc}'");
                    });
                }
                $log->coordinator_notified = $notifExists;

                return $log;
            });

            // Compute module pace summary using a single bulk grouped query instead of per-module DB queries
            $projectModules = DB::table('modules')->where('project_id', $id)->get();
            $moduleIds = $projectModules->pluck('id');
            $allProjectTasks = $moduleIds->isNotEmpty() 
                ? DB::table('tasks')->whereIn('module_id', $moduleIds)->get() 
                : collect();

            $hoursByModule = collect();
            if ($moduleIds->isNotEmpty()) {
                $hoursByModule = DB::table('student_work_logs')
                    ->join('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
                    ->whereIn('tasks.module_id', $moduleIds)
                    ->groupBy('tasks.module_id')
                    ->select('tasks.module_id', DB::raw('SUM(student_work_logs.hours_worked) as total_logged_hours'))
                    ->pluck('total_logged_hours', 'tasks.module_id');
            }

            $behindScheduleModules = [];
            foreach ($projectModules as $pm) {
                $mTasks = $allProjectTasks->where('module_id', $pm->id);
                $totalW = 0;
                $completedW = 0;
                $totalCount = $mTasks->count();
                $completedCount = 0;

                foreach ($mTasks as $pt) {
                    $w = (int) ($pt->weight ?? 1);
                    $totalW += $w;
                    if (strtolower($pt->status ?? '') === 'completed') {
                        $completedW += $w;
                        $completedCount++;
                    }
                }

                $hoursInModule = round((float) ($hoursByModule->get($pm->id) ?? 0), 1);

                $isBehind = false;
                $reason = null;

                if ($totalCount > 0 && strtolower($pm->status ?? '') !== 'completed') {
                    if ($completedCount < $totalCount) {
                        if ($totalW > 0 && $completedW > 0 && $hoursInModule > $completedW) {
                            $isBehind = true;
                            $reason = "Actual time logged ({$hoursInModule} hrs) exceeds the planned weight of completed tasks ({$completedW} hrs).";
                        } elseif ($totalW > 0 && $completedW === 0 && $hoursInModule > ($totalW * 0.5)) {
                            $isBehind = true;
                            $reason = "Students logged {$hoursInModule} hrs without any tasks completed yet (planned module weight: {$totalW} hrs).";
                        } elseif ($totalW > 0 && $hoursInModule > $totalW) {
                            $isBehind = true;
                            $reason = "Actual time logged ({$hoursInModule} hrs) has exceeded the entire module planned weight ({$totalW} hrs).";
                        }
                    }
                }

                if ($isBehind) {
                    $behindScheduleModules[] = [
                        'module_id' => $pm->id,
                        'module_name' => $pm->module_name,
                        'total_weight' => $totalW,
                        'completed_weight' => $completedW,
                        'total_hours' => $hoursInModule,
                        'reason' => $reason
                    ];
                }
            }

            $studentReportDates = DB::table('student_reports')
                ->where('project_id', $id)
                ->whereNotNull('report_date')
                ->select('student_id', 'report_date', 'report_type')
                ->distinct()
                ->orderBy('report_date', 'desc')
                ->get()
                ->groupBy('student_id');

            return response()->json([
                'project' => $project,
                'work_logs' => $workLogs,
                'behind_schedule_modules' => $behindScheduleModules,
                'student_report_dates' => $studentReportDates
            ]);
        } catch (\Throwable $e) {
            \Log::error('getProjectWorkLogs error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'project' => $project ?? null,
                'work_logs' => [],
                'behind_schedule_modules' => []
            ]);
        }
    }

    /**
     * Download formatted work log for a specific project.
     * Organized hierarchically: Month -> Week -> Module -> Task, showing student work logs.
     */
    public function downloadProjectWorkLogs(Request $request, $id)
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
        $logs = DB::table('student_work_logs')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
            ->leftJoin('users as student', 'student.id', '=', DB::raw('COALESCE(tasks.assigned_to, project_student.student_id)'))
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'student.id')
            ->leftJoin('users as approver', 'approver.id', '=', 'student_work_logs.approved_by')
            ->where(function ($q) use ($id) {
                $q->where('modules.project_id', $id)
                  ->orWhere('project_student.project_id', $id);
            })
            ->select(
                'student_work_logs.id',
                'student_work_logs.work_date',
                'student_work_logs.hours_worked',
                'student_work_logs.description',
                'student_work_logs.approval_status',
                $this->getWorkLogRatingColumnExpression(),
                'student_work_logs.created_at',
                'student.name as student_name',
                'student.email as student_email',
                'student_profiles.designation as student_designation',
                'tasks.title as task_title',
                'tasks.weight as task_weight',
                'tasks.status as task_status',
                'modules.module_name',
                'approver.name as approved_by_name'
            )
            ->orderBy('student_work_logs.work_date', 'asc')
            ->orderBy('student_work_logs.id', 'asc')
            ->get();

        // Group hierarchical structure: Month -> Week -> Module -> Task
        $structured = [];
        $totalHours = 0;
        foreach ($logs as $log) {
            $dateStr = $log->work_date ?: ($log->created_at ? substr($log->created_at, 0, 10) : date('Y-m-d'));
            $timestamp = strtotime($dateStr) ?: time();
            $monthKey = date('F Y', $timestamp); // e.g. "October 2026"

            // Calculate week of month (1 to 5)
            $dayOfMonth = (int) date('j', $timestamp);
            $weekNum = (int) ceil($dayOfMonth / 7);
            $weekKey = "Week " . $weekNum;

            $moduleKey = $log->module_name ?: 'General Module';
            $taskKey = $log->task_title ?: 'General Task';

            if (!isset($structured[$monthKey])) {
                $structured[$monthKey] = [];
            }
            if (!isset($structured[$monthKey][$weekKey])) {
                $structured[$monthKey][$weekKey] = [];
            }
            if (!isset($structured[$monthKey][$weekKey][$moduleKey])) {
                $structured[$monthKey][$weekKey][$moduleKey] = [];
            }
            if (!isset($structured[$monthKey][$weekKey][$moduleKey][$taskKey])) {
                $structured[$monthKey][$weekKey][$moduleKey][$taskKey] = [];
            }

            $structured[$monthKey][$weekKey][$moduleKey][$taskKey][] = $log;
            $totalHours += (float) ($log->hours_worked ?? 0);
        }

        $structuredTree = [];
        foreach ($structured as $month => $weeks) {
            $monthData = ['month' => $month, 'weeks' => []];
            foreach ($weeks as $week => $modules) {
                $weekData = ['week' => $week, 'modules' => []];
                foreach ($modules as $module => $tasks) {
                    $moduleData = ['module_name' => $module, 'tasks' => []];
                    foreach ($tasks as $task => $entries) {
                        $moduleData['tasks'][] = [
                            'task_title' => $task,
                            'logs' => $entries
                        ];
                    }
                    $weekData['modules'][] = $moduleData;
                }
                $monthData['weeks'][] = $weekData;
            }
            $structuredTree[] = $monthData;
        }

        return response()->json([
            'status' => 'success',
            'project' => $project,
            'total_hours' => round($totalHours, 2),
            'total_logs' => count($logs),
            'hierarchical' => $structuredTree,
        ]);
    }

    /**
     * Download student work report from student_reports table.
     * Enforces that only reports for projects assigned to this faculty can be downloaded.
     */
    public function downloadProjectStudentReports(Request $request, $id)
    {
        $facultyId = $this->getFacultyId($request);
        if (!$facultyId) {
            return response()->json(['error' => 'Unauthorized. Please log in.'], 401);
        }

        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        // Strictly verify that this project is assigned to this faculty
        $isAssigned = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->where('project_id', $id)
            ->exists();
        $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
        if ($hasAnyAssignments && !$isAssigned) {
            return response()->json(['error' => 'Access denied. You can only download reports for projects assigned to you.'], 403);
        }

        $reportsQuery = DB::table('student_reports')
            ->leftJoin('users as student', 'student.id', '=', 'student_reports.student_id')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('student_reports.project_id', $id);

        if ($request->filled('type')) {
            $reportsQuery->where('student_reports.report_type', $request->input('type'));
        }

        $reports = $reportsQuery->select(
            'student_reports.*',
            'student.name as student_name',
            'student.email as student_email',
            'modules.module_name',
            'tasks.title as task_title'
        )
        ->orderBy('student_reports.report_date', 'desc')
        ->orderBy('student_reports.id', 'desc')
        ->get();

        // If JSON format is requested
        if ($request->query('format') === 'json') {
            return response()->json([
                'success' => true,
                'project_id' => $id,
                'project_title' => $project->title,
                'total_reports' => $reports->count(),
                'reports' => $reports
            ]);
        }

        // Export as clean CSV document
        $safeTitle = preg_replace('/[^A-Za-z0-9_\-]/', '_', $project->title ?: 'Project');
        $filename = "Student_Reports_{$safeTitle}_" . date('Ymd_His') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function () use ($reports, $project) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens with proper character encoding
            fputs($handle, "\xEF\xBB\xBF");

            // Header metadata
            fputcsv($handle, ['Student Work Reports (student_reports) - Project: ' . ($project->title ?? 'Untitled')]);
            fputcsv($handle, ['Exported Date: ' . date('Y-m-d H:i:s'), 'Total Reports: ' . count($reports)]);
            fputcsv($handle, []);

            // Table headers
            fputcsv($handle, [
                'Report ID',
                'Student Name',
                'Student Email',
                'Report Type',
                'Report Date',
                'Week Start',
                'Week End',
                'Module Name',
                'Task Title',
                'Work Done / Description',
                'Approval Status',
                'Faculty Feedback',
                'Attached File',
                'Submitted At'
            ]);

            foreach ($reports as $r) {
                fputcsv($handle, [
                    $r->id,
                    $r->student_name ?: 'N/A',
                    $r->student_email ?: 'N/A',
                    ucfirst($r->report_type ?: 'daily'),
                    $r->report_date ?: 'N/A',
                    $r->week_start ?: 'N/A',
                    $r->week_end ?: 'N/A',
                    $r->module_name ?: 'General',
                    $r->task_title ?: 'General Task',
                    $r->work_done ?: '',
                    ucfirst($r->approval_status ?: 'pending'),
                    $r->feedback ?: '',
                    $r->report_file ? basename($r->report_file) : 'None',
                    $r->submitted_at ?: 'N/A'
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get student reports (daily and weekly) EXCLUSIVELY from student_reports table for a specific student and project.
     * Only allows access if the project is assigned to the logged-in faculty.
     */
    public function getStudentReportsForFaculty($id, $studentId, Request $request)
    {
        $facultyId = $this->getFacultyId($request);
        if (!$facultyId) {
            return response()->json(['error' => 'Unauthorized. Please log in.'], 401);
        }

        $project = DB::table('projects')->where('id', $id)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found.'], 404);
        }

        // Strictly verify that this project is assigned to this faculty
        $isAssigned = DB::table('project_faculty')
            ->where('faculty_id', $facultyId)
            ->where('project_id', $id)
            ->exists();
        $hasAnyAssignments = DB::table('project_faculty')->where('faculty_id', $facultyId)->exists();
        if ($hasAnyAssignments && !$isAssigned) {
            return response()->json(['error' => 'Access denied. You can only view reports for projects assigned to you.'], 403);
        }

        // Fetch student details
        $student = DB::table('users')
            ->leftJoin('student_profiles', 'student_profiles.student_id', '=', 'users.id')
            ->where('users.id', $studentId)
            ->select('users.id', 'users.name', 'users.email', 'student_profiles.designation')
            ->first();

        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        // Fetch student reports EXCLUSIVELY from student_reports table
        $reportsQuery = DB::table('student_reports')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('student_reports.student_id', $studentId)
            ->where('student_reports.project_id', $id);

        if ($request->filled('date')) {
            $reportsQuery->where('student_reports.report_date', $request->input('date'));
        }

        if ($request->filled('type')) {
            $reportsQuery->where('student_reports.report_type', $request->input('type'));
        }

        $reports = $reportsQuery->select(
            'student_reports.*',
            'tasks.title as task_title',
            'tasks.status as task_status',
            'tasks.weight as task_weight',
            'modules.module_name'
        )
        ->orderBy('student_reports.report_date', 'desc')
        ->orderBy('student_reports.id', 'desc')
        ->get();

        // Collect all distinct dates strictly from student_reports table
        $distinctDates = DB::table('student_reports')
            ->where('student_id', $studentId)
            ->where('project_id', $id)
            ->whereNotNull('report_date')
            ->pluck('report_date')
            ->unique()
            ->sortDesc()
            ->values();

        // Also fetch all reports for this student/project without filters
        $allStudentReports = DB::table('student_reports')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_reports.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('student_reports.student_id', $studentId)
            ->where('student_reports.project_id', $id)
            ->select(
                'student_reports.*',
                'tasks.title as task_title',
                'tasks.status as task_status',
                'tasks.weight as task_weight',
                'modules.module_name'
            )
            ->orderBy('student_reports.report_date', 'desc')
            ->orderBy('student_reports.id', 'desc')
            ->get();

        $dailyReports = $allStudentReports->where('report_type', 'daily')->values();
        $weeklyReports = $allStudentReports->where('report_type', 'weekly')->values();

        return response()->json([
            'success' => true,
            'student' => $student,
            'project' => $project,
            'reports' => $reports,
            'all_reports' => $allStudentReports,
            'daily_reports' => $dailyReports,
            'weekly_reports' => $weeklyReports,
            'available_dates' => $distinctDates
        ]);
    }

    /**
     * Change password for the logged-in faculty user.
     * Validates current password and updates the password field in the users table.
     */
    public function changePassword(Request $request)
    {
        $facultyId = $this->getFacultyId($request);

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

        $user = DB::table('users')->where('id', $facultyId)->first();
        if (!$user) {
            return response()->json(['error' => 'Faculty account not found.'], 404);
        }

        // Verify current password against users table
        if (!Hash::check($currentPassword, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect.'], 400);
        }

        // Update password in users table
        DB::table('users')
            ->where('id', $facultyId)
            ->update([
                'password' => Hash::make($newPassword),
                'updated_at' => now(),
            ]);

        // Audit log if table exists
        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'user_id' => $facultyId,
                'action' => 'Password Changed',
                'description' => "Faculty {$user->name} changed their account password.",
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully.'
        ]);
    }

    /**
     * Approve or reject a student work log.
     * When faculty approves it:
     * - Update approval_status = 'approved', approved_by, approved_at in student_work_logs.
     * - Save rating in stars (1-5) in student_work_logs.ratings if provided.
     * - Update status in tasks table as 'completed', review_status as 'approved'.
     * - Notify student.
     */
    public function approveWorkLog($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'approval_status' => 'required|in:approved,rejected,pending',
            'rating' => 'nullable|numeric|min:1|max:5',
            'ratings' => 'nullable'
        ]);

        $workLog = DB::table('student_work_logs')->where('id', $id)->first();
        if (!$workLog) {
            return response()->json(['error' => 'Work log entry not found.'], 404);
        }

        // Resolve the project and student associated with this work log
        $projectStudent = DB::table('project_student')->where('id', $workLog->project_student_id)->first();
        $task = null;
        $projectId = null;
        if ($workLog->task_id) {
            $task = DB::table('tasks')
                ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
                ->where('tasks.id', $workLog->task_id)
                ->select('tasks.*', 'modules.project_id')
                ->first();
            if ($task && $task->project_id) {
                $projectId = $task->project_id;
            }
        }
        if (!$projectId && $projectStudent) {
            $projectId = $projectStudent->project_id;
        }

        if (!$projectId) {
            return response()->json(['error' => 'Project record not found for this work log.'], 404);
        }

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

        $updateData = [
            'approval_status' => $newStatus,
            'approved_by' => $facultyId,
            'approved_at' => $now,
            'updated_at' => $now
        ];

        // Save rating in stars into student_work_logs
        if ($request->filled('rating') || $request->filled('ratings')) {
            $starVal = $request->input('rating') ?? $request->input('ratings');
            $starInt = (int) round((float) $starVal);
            $updateData['rating'] = $starInt;
            if (Schema::hasColumn('student_work_logs', 'ratings')) {
                $updateData['ratings'] = (string) $starInt;
            }
        }

        // 1. Update student_work_logs
        DB::table('student_work_logs')->where('id', $id)->update($updateData);

        // 2. If approved, update status in tasks table as 'completed'
        $updatedTask = null;
        if ($newStatus === 'approved' && $workLog->task_id) {
            $taskUpdateData = [
                'status' => 'completed',
                'reviewed_by' => $facultyId,
                'reviewed_at' => $now,
                'updated_at' => $now
            ];
            if (isset($starInt) && $starInt > 0) {
                $taskUpdateData['rating'] = $starInt;
            }
            DB::table('tasks')->where('id', $workLog->task_id)->update($taskUpdateData);

            $updatedTask = DB::table('tasks')->where('id', $workLog->task_id)->first();
            if ($updatedTask && $updatedTask->module_id) {
                $this->checkAndUpdateModuleCompletion($updatedTask->module_id);
            }
        }

        // 3. Send notification to the student
        $taskTitle = $updatedTask ? $updatedTask->title : ($task ? $task->title : 'Assigned Task');
        $notifMessage = $newStatus === 'approved'
            ? "Your work log for task \"{$taskTitle}\" ({$workLog->hours_worked} hrs on {$workLog->work_date}) has been APPROVED by faculty, and the task status has been updated to COMPLETED."
            : "Your work log for task \"{$taskTitle}\" has been marked as REJECTED by faculty.";

        $studentUserId = $projectStudent ? $projectStudent->student_id : ($task ? $task->assigned_to : null);
        if ($studentUserId) {
            DB::table('notifications')->insert([
                'user_id' => $studentUserId,
                'type' => 'work_log_review',
                'message' => $notifMessage,
                'is_read' => false,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        // Fetch refreshed work log
        $refreshedLog = DB::table('student_work_logs')
            ->leftJoin('tasks', 'tasks.id', '=', 'student_work_logs.task_id')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->leftJoin('project_student', 'project_student.id', '=', 'student_work_logs.project_student_id')
            ->leftJoin('users as student', 'student.id', '=', DB::raw('COALESCE(tasks.assigned_to, project_student.student_id)'))
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
                $this->getWorkLogRatingColumnExpression(),
                'student_work_logs.approved_by',
                'student_work_logs.approved_at',
                'student.name as student_name',
                'student.email as student_email',
                'tasks.title as task_title',
                'tasks.status as task_status',
                'tasks.due_date as task_due_date',
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
     * Rate a student work log in stars (1-5).
     * Saves into student_work_logs table column 'ratings'.
     */
    public function rateWorkLog($id, Request $request)
    {
        $facultyId = $this->getFacultyId($request);

        $validated = $request->validate([
            'rating' => 'required|numeric|min:1|max:5'
        ]);

        $workLog = DB::table('student_work_logs')->where('id', $id)->first();
        if (!$workLog) {
            return response()->json(['error' => 'Work log not found.'], 404);
        }

        $ratingInt = (int) round((float) $validated['rating']);
        $ratingStr = (string) $ratingInt;

        $updatePayload = [
            'rating' => $ratingInt,
            'updated_at' => now()
        ];
        if (Schema::hasColumn('student_work_logs', 'ratings')) {
            $updatePayload['ratings'] = $ratingStr;
        }

        DB::table('student_work_logs')->where('id', $id)->update($updatePayload);

        // Also sync rating to tasks table if task_id exists
        if (!empty($workLog->task_id)) {
            DB::table('tasks')->where('id', $workLog->task_id)->update([
                'rating' => $ratingInt,
                'updated_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Rating of {$ratingInt} star(s) saved successfully.",
            'rating' => $ratingInt,
            'ratings' => $ratingStr
        ]);
    }

    /**
     * Alert / notify the corresponding coordinator about a task time overrun or deadline variance.
     */
    public function notifyCoordinator($id, Request $request = null)
    {
        $request = $request ?: request();
        $facultyId = $this->getFacultyId($request);

        $workLog = DB::table('student_work_logs')->where('id', $id)->first();
        if (!$workLog) {
            return response()->json(['error' => 'Work log not found.'], 404);
        }

        $task = DB::table('tasks')
            ->leftJoin('modules', 'modules.id', '=', 'tasks.module_id')
            ->where('tasks.id', $workLog->task_id)
            ->select('tasks.*', 'modules.project_id')
            ->first();

        $projectId = $task->project_id ?? null;
        if (!$projectId) {
            $ps = DB::table('project_student')->where('id', $workLog->project_student_id)->first();
            $projectId = $ps ? $ps->project_id : null;
        }

        $project = DB::table('projects')->where('id', $projectId)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found for this work log.'], 404);
        }

        // Identify corresponding coordinator (project creator coordinator or all coordinators)
        $coordinatorIds = [];
        if (!empty($project->created_by)) {
            $creator = DB::table('users')->where('id', $project->created_by)->first();
            if ($creator && $creator->role === 'coordinator') {
                $coordinatorIds[] = $creator->id;
            }
        }
        if (empty($coordinatorIds)) {
            $coordinatorIds = DB::table('users')->where('role', 'coordinator')->pluck('id')->toArray();
        }

        $student = DB::table('users')->where('id', $task->assigned_to ?? null)->first();
        if (!$student && $workLog->project_student_id) {
            $psRow = DB::table('project_student')->where('id', $workLog->project_student_id)->first();
            if ($psRow) {
                $student = DB::table('users')->where('id', $psRow->student_id)->first();
            }
        }
        $studentName = $student ? $student->name : 'Student';

        $faculty = DB::table('users')->where('id', $facultyId)->first();
        $facultyName = $faculty ? $faculty->name : 'Faculty Mentor';

        $hoursWorked = floatval($workLog->hours_worked);
        $taskWeight = floatval($task->weight ?? 1);
        $diff = round($hoursWorked - $taskWeight, 1);
        $taskTitle = $task->title ?? 'Assigned Task';
        $projTitle = $project->title ?? 'Project';

        if ($hoursWorked > $taskWeight) {
            $alertMsg = "Alert: Expected time exceeded for task '{$taskTitle}' in project '{$projTitle}'. {$hoursWorked} hrs logged (expected: {$taskWeight} hrs, +{$diff} hrs) by {$studentName}. (Flagged by {$facultyName})";
            if (!empty($task->due_date) && $workLog->work_date > $task->due_date) {
                $alertMsg .= " Also logged past due date ({$task->due_date}).";
            }
        } else {
            $alertMsg = "Alert: Task '{$taskTitle}' in project '{$projTitle}' logged work on {$workLog->work_date} exceeding expected due date ({$task->due_date}) by {$studentName}. (Flagged by {$facultyName})";
        }

        if (Schema::hasTable('notifications')) {
            foreach (array_unique($coordinatorIds) as $coordId) {
                $existing = DB::table('notifications')
                    ->where('user_id', $coordId)
                    ->where('project_id', $project->id)
                    ->where('type', 'task_time_exceeded')
                    ->where('message', 'like', "%task '{$taskTitle}'%")
                    ->where('is_read', 0)
                    ->first();

                if ($existing) {
                    DB::table('notifications')->where('id', $existing->id)->update([
                        'message' => $alertMsg,
                        'urgency' => 'high',
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('notifications')->insert([
                        'user_id' => $coordId,
                        'project_id' => $project->id,
                        'type' => 'task_time_exceeded',
                        'urgency' => 'high',
                        'message' => $alertMsg,
                        'is_read' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Coordinator notified successfully about task '{$taskTitle}'.",
            'task_title' => $taskTitle,
            'coordinator_notified' => true
        ]);
    }

    /**
     * Get documented client requirements for a project.
     */
    public function getProjectClientRequirements($id, Request $request)
    {
        $requirements = [];
        if (Schema::hasTable('client_requirements')) {
            $requirements = DB::table('client_requirements')
                ->where('project_id', $id)
                ->orderBy('id', 'asc')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $requirements
        ]);
    }

    /**
     * Get requirement changes and update notifications for a project.
     */
    public function getProjectRequirementChanges($id, Request $request)
    {
        try {
            $changes = [];
            if (Schema::hasTable('requirement_changes')) {
                $userFk = Schema::hasColumn('requirement_changes', 'changed_by') ? 'changed_by' : 'requested_by';
                $titleExpr = Schema::hasColumn('client_requirements', 'title') 
                    ? 'client_requirements.title as requirement_title' 
                    : (Schema::hasColumn('client_requirements', 'description') ? 'client_requirements.description as requirement_title' : DB::raw("'' as requirement_title"));
                $docsExpr = Schema::hasColumn('client_requirements', 'documents') 
                    ? 'client_requirements.documents as requirement_documents' 
                    : (Schema::hasColumn('client_requirements', 'document_path') ? 'client_requirements.document_path as requirement_documents' : DB::raw("NULL as requirement_documents"));

                $query = DB::table('requirement_changes')
                    ->leftJoin('client_requirements', 'client_requirements.id', '=', 'requirement_changes.client_requirement_id')
                    ->leftJoin('users as requesters', "requesters.id", '=', "requirement_changes.{$userFk}")
                    ->where(function ($q) use ($id) {
                        if (Schema::hasColumn('requirement_changes', 'project_id')) {
                            $q->where('requirement_changes.project_id', $id)
                              ->orWhere('client_requirements.project_id', $id);
                        } else {
                            $q->where('client_requirements.project_id', $id);
                        }
                    });

                $changes = $query->select(
                    'requirement_changes.*',
                    DB::raw($titleExpr),
                    DB::raw($docsExpr),
                    'requesters.name as requested_by_name'
                )
                ->orderBy('requirement_changes.id', 'desc')
                ->get();
            }

            return response()->json([
                'status' => 'success',
                'data' => $changes,
                'count' => count($changes)
            ]);
        } catch (\Throwable $e) {
            \Log::error('getProjectRequirementChanges error: ' . $e->getMessage());
            return response()->json([
                'status' => 'success',
                'data' => [],
                'count' => 0
            ]);
        }
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


    private function checkAndUpdateModuleCompletion($moduleId)
    {
        if (!$moduleId) {
            return;
        }

        $totalTasks = DB::table('tasks')->where('module_id', $moduleId)->count();
        if ($totalTasks > 0) {
            $incompleteTasks = DB::table('tasks')
                ->where('module_id', $moduleId)
                ->where('status', '!=', 'completed')
                ->count();

            if ($incompleteTasks === 0) {
                DB::table('modules')->where('id', $moduleId)->update([
                    'status' => 'completed',
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // =========================================================================
    // FACULTY CHAT: GROUP & INDIVIDUAL (PROJECTS & STUDENTS)
    // =========================================================================

    /**
     * Helper: Ensure a user is recorded in chat_participants
     */
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

    /**
     * Helper: Format and fetch chat messages for a chat
     */
    private function fetchChatMessages($chatId, $currentUserId)
    {
        return DB::table('chat_messages')
            ->join('users', 'users.id', '=', 'chat_messages.sender_id')
            ->where('chat_messages.chat_id', $chatId)
            ->select(
                'chat_messages.id',
                'chat_messages.message as text',
                'users.id as sender_id',
                'users.name as sender_name',
                'users.role as sender_role',
                'chat_messages.created_at as time'
            )
            ->orderBy('chat_messages.created_at', 'asc')
            ->get()
            ->map(function ($msg) use ($currentUserId) {
                $raw = $msg->text;
                $displayText = $raw;
                $attachment = null;

                if (is_string($raw) && (str_starts_with($raw, '{') || str_starts_with($raw, '{\\'))) {
                    $dec = json_decode($raw, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($dec)) {
                        $displayText = $dec['text'] ?? '';
                        $attachment = $dec['attachment'] ?? null;
                    }
                }

                return [
                    'id' => $msg->id,
                    'sender' => $msg->sender_id == $currentUserId ? 'faculty' : ($msg->sender_role === 'student' ? 'student' : 'other'),
                    'senderId' => $msg->sender_id,
                    'senderName' => $msg->sender_name,
                    'senderRole' => $msg->sender_role,
                    'isMe' => ($msg->sender_id == $currentUserId),
                    'text' => $displayText,
                    'attachment' => $attachment,
                    'time' => $msg->time
                ];
            });
    }

    /**
     * GET /api/faculty/chat/projects/{projectId}/group
     * Retrieve group chat messages for all students in a project
     */
    public function getGroupChatMessages(Request $request, $projectId)
    {
        $facultyId = $this->getFacultyId($request);

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
                'created_by' => $facultyId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $chatId = $chat->id;
        }

        // Register faculty in chat_participants
        $this->ensureChatParticipant($chatId, $facultyId);

        // Register all assigned students for this project
        $studentIds = DB::table('project_student')
            ->where('project_id', $projectId)
            ->pluck('student_id')
            ->toArray();

        foreach ($studentIds as $sId) {
            $this->ensureChatParticipant($chatId, $sId);
        }

        $messages = $this->fetchChatMessages($chatId, $facultyId);
        $project = DB::table('projects')->where('id', $projectId)->select('id', 'title', 'client_name', 'status')->first();

        return response()->json([
            'chat_id' => $chatId,
            'project' => $project,
            'participant_count' => count($studentIds) + 1,
            'messages' => $messages
        ]);
    }

    /**
     * POST /api/faculty/chat/projects/{projectId}/group/messages
     * Send a group message to all students in a project
     */
    public function saveGroupChatMessage(Request $request, $projectId)
    {
        $facultyId = $this->getFacultyId($request);
        $text = trim($request->input('text', ''));

        if (empty($text) && !$request->hasFile('file')) {
            return response()->json(['error' => 'Message or attachment is required'], 422);
        }

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
                'created_by' => $facultyId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $chatId = $chat->id;
        }

        $this->ensureChatParticipant($chatId, $facultyId);

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
        }

        $messagePayload = $text;
        if ($attachment) {
            $messagePayload = json_encode([
                'text' => $text,
                'attachment' => $attachment
            ]);
        }

        $messageId = DB::table('chat_messages')->insertGetId([
            'chat_id' => $chatId,
            'sender_id' => $facultyId,
            'message' => $messagePayload,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message_id' => $messageId,
            'message' => [
                'id' => $messageId,
                'sender' => 'faculty',
                'senderId' => $facultyId,
                'senderName' => DB::table('users')->where('id', $facultyId)->value('name') ?? 'Faculty',
                'isMe' => true,
                'text' => $text,
                'attachment' => $attachment,
                'time' => now()->toDateTimeString()
            ]
        ]);
    }

    /**
     * GET /api/faculty/chat/projects/{projectId}/students
     * List all students assigned to a project for 1-on-1 individual chat selection
     */
    public function getProjectChatStudents(Request $request, $projectId)
    {
        $facultyId = $this->getFacultyId($request);

        $students = DB::table('project_student')
            ->join('users', 'users.id', '=', 'project_student.student_id')
            ->where('project_student.project_id', $projectId)
            ->select(
                'users.id as student_id',
                'users.name',
                'users.email',
                'users.avatar',
                'project_student.role as project_role'
            )
            ->orderBy('users.name', 'asc')
            ->get();

        $studentList = $students->map(function ($s) use ($projectId, $facultyId) {
            // Find existing individual chat
            $chat = DB::table('chats')
                ->join('chat_participants as p1', 'p1.chat_id', '=', 'chats.id')
                ->join('chat_participants as p2', 'p2.chat_id', '=', 'chats.id')
                ->where('chats.project_id', $projectId)
                ->where('chats.title', 'like', 'Individual:%')
                ->where('p1.user_id', $facultyId)
                ->where('p2.user_id', $s->student_id)
                ->select('chats.id')
                ->first();

            $lastMessage = null;
            if ($chat) {
                $lastMsgRow = DB::table('chat_messages')
                    ->where('chat_id', $chat->id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($lastMsgRow) {
                    $raw = $lastMsgRow->message;
                    $txt = $raw;
                    if (is_string($raw) && str_starts_with($raw, '{')) {
                        $dec = json_decode($raw, true);
                        $txt = $dec['text'] ?? '[Attachment]';
                    }
                    $lastMessage = [
                        'text' => $txt,
                        'time' => $lastMsgRow->created_at,
                        'is_me' => ($lastMsgRow->sender_id == $facultyId)
                    ];
                }
            }

            return [
                'id' => $s->student_id,
                'name' => $s->name,
                'email' => $s->email,
                'avatar' => $s->avatar,
                'role' => $s->project_role ? ucwords(str_replace('_', ' ', $s->project_role)) : 'Team Member',
                'last_message' => $lastMessage
            ];
        });

        $project = DB::table('projects')->where('id', $projectId)->select('id', 'title', 'client_name')->first();

        return response()->json([
            'project' => $project,
            'students' => $studentList
        ]);
    }

    /**
     * GET /api/faculty/chat/projects/{projectId}/individual/{studentId}
     * Retrieve 1-on-1 private chat messages with a specific student
     */
    public function getIndividualChatMessages(Request $request, $projectId, $studentId)
    {
        $facultyId = $this->getFacultyId($request);

        $student = DB::table('users')->where('id', $studentId)->select('id', 'name', 'email', 'avatar')->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        $chat = DB::table('chats')
            ->join('chat_participants as p1', 'p1.chat_id', '=', 'chats.id')
            ->join('chat_participants as p2', 'p2.chat_id', '=', 'chats.id')
            ->where('chats.project_id', $projectId)
            ->where('chats.title', 'like', 'Individual:%')
            ->where('p1.user_id', $facultyId)
            ->where('p2.user_id', $studentId)
            ->select('chats.id')
            ->first();

        if (!$chat) {
            $chatId = DB::table('chats')->insertGetId([
                'project_id' => $projectId,
                'title' => "Individual: Faculty-{$facultyId}_Student-{$studentId}",
                'created_by' => $facultyId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $this->ensureChatParticipant($chatId, $facultyId);
            $this->ensureChatParticipant($chatId, $studentId);
        } else {
            $chatId = $chat->id;
        }

        $messages = $this->fetchChatMessages($chatId, $facultyId);
        $project = DB::table('projects')->where('id', $projectId)->select('id', 'title', 'client_name')->first();

        return response()->json([
            'chat_id' => $chatId,
            'project' => $project,
            'student' => $student,
            'messages' => $messages
        ]);
    }

    /**
     * POST /api/faculty/chat/projects/{projectId}/individual/{studentId}/messages
     * Send a 1-on-1 private message to a specific student
     */
    public function saveIndividualChatMessage(Request $request, $projectId, $studentId)
    {
        $facultyId = $this->getFacultyId($request);
        $text = trim($request->input('text', ''));

        if (empty($text) && !$request->hasFile('file')) {
            return response()->json(['error' => 'Message or attachment is required'], 422);
        }

        $chat = DB::table('chats')
            ->join('chat_participants as p1', 'p1.chat_id', '=', 'chats.id')
            ->join('chat_participants as p2', 'p2.chat_id', '=', 'chats.id')
            ->where('chats.project_id', $projectId)
            ->where('chats.title', 'like', 'Individual:%')
            ->where('p1.user_id', $facultyId)
            ->where('p2.user_id', $studentId)
            ->select('chats.id')
            ->first();

        if (!$chat) {
            $chatId = DB::table('chats')->insertGetId([
                'project_id' => $projectId,
                'title' => "Individual: Faculty-{$facultyId}_Student-{$studentId}",
                'created_by' => $facultyId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $this->ensureChatParticipant($chatId, $facultyId);
            $this->ensureChatParticipant($chatId, $studentId);
        } else {
            $chatId = $chat->id;
        }

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
        }

        $messagePayload = $text;
        if ($attachment) {
            $messagePayload = json_encode([
                'text' => $text,
                'attachment' => $attachment
            ]);
        }

        $messageId = DB::table('chat_messages')->insertGetId([
            'chat_id' => $chatId,
            'sender_id' => $facultyId,
            'message' => $messagePayload,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message_id' => $messageId,
            'message' => [
                'id' => $messageId,
                'sender' => 'faculty',
                'senderId' => $facultyId,
                'senderName' => DB::table('users')->where('id', $facultyId)->value('name') ?? 'Faculty',
                'isMe' => true,
                'text' => $text,
                'attachment' => $attachment,
                'time' => now()->toDateTimeString()
            ]
        ]);
    }
}


