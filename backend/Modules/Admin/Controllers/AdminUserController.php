<?php

namespace Modules\Admin\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Modules\Auth\Models\User;

class AdminUserController extends Controller
{
    /**
     * Catalog of all system permissions grouped by module domain.
     */
    public const PERMISSIONS_CATALOG = [
        'Administrative' => [
            ['key' => 'system.admin', 'label' => 'Full System Super Admin', 'description' => 'Complete unrestricted administrative control across all ERP operations'],
            ['key' => 'admin.manage_users', 'label' => 'Manage Users & Credentials', 'description' => 'Create, edit, suspend, and manage all user accounts'],
            ['key' => 'admin.manage_permissions', 'label' => 'Manage Per-User Permissions', 'description' => 'Assign, override, or reset fine-grained permissions per user'],
            ['key' => 'admin.reset_passwords', 'label' => 'Reset User Passwords', 'description' => 'Set temporary passwords and revoke active login tokens'],
            ['key' => 'admin.audit_logs', 'label' => 'View System Audit Trail', 'description' => 'Inspect comprehensive administrative audit activity'],
        ],
        'Dashboard & Executive' => [
            ['key' => 'view-dashboard', 'label' => 'Executive Dashboard', 'description' => 'Access high-level KPI oversight and executive summary charts'],
        ],
        'Coordinator' => [
            ['key' => 'view-coordinator', 'label' => 'Coordinator Workspace', 'description' => 'Manage academic schedules, student allocations, and coordination workflows'],
        ],
        'Faculty' => [
            ['key' => 'view-faculty', 'label' => 'Faculty Portal', 'description' => 'Access course sprint supervision, task evaluation, and student feedback'],
        ],
        'Finance & Payroll' => [
            ['key' => 'view-finance', 'label' => 'Full Finance & Invoicing', 'description' => 'Enterprise billing, invoices, client payments, and disbursements'],
            ['key' => 'view-finance-readonly', 'label' => 'Read-Only Finance', 'description' => 'View project financials and budgets without modification rights'],
            ['key' => 'view-student-designations', 'label' => 'Student Designation Stipends', 'description' => 'View student stipend tiers and designation rate tracking'],
        ],
        'Student Portal' => [
            ['key' => 'view-student', 'label' => 'Student Portal', 'description' => 'Submit daily work logs, progress reports, and view tasks'],
        ],
        'Project & Deliverables' => [
            ['key' => 'view-projects', 'label' => 'View Project List', 'description' => 'Browse projects catalog and overview cards'],
            ['key' => 'project.view_global', 'label' => 'Global Project Visibility', 'description' => 'Access all university projects across all departments'],
            ['key' => 'project.view_assigned', 'label' => 'Assigned Projects Only', 'description' => 'Access only projects where explicitly assigned as member/lead'],
            ['key' => 'project.create', 'label' => 'Create Projects', 'description' => 'Initiate and configure new client/internal projects'],
            ['key' => 'project.close', 'label' => 'Close Projects', 'description' => 'Formally mark projects completed and archive milestones'],
            ['key' => 'project.assign_faculty', 'label' => 'Assign Faculty Guides', 'description' => 'Assign faculty mentors and supervisors to projects'],
            ['key' => 'project.assign_students', 'label' => 'Assign Student Members', 'description' => 'Assign students with track designations to projects'],
            ['key' => 'project.module.create', 'label' => 'Create Project Modules', 'description' => 'Define vertical sprint modules and deliverable specs'],
            ['key' => 'project.task.create', 'label' => 'Create Project Tasks', 'description' => 'Create sprint tasks and milestones within modules'],
            ['key' => 'project.task.update', 'label' => 'Update Task Progress', 'description' => 'Submit status changes and task progress updates'],
            ['key' => 'project.submission.review', 'label' => 'Review Task Deliverables', 'description' => 'Evaluate, score, and approve student deliverables'],
            ['key' => 'project.client_requirements.view', 'label' => 'View Client Requirements', 'description' => 'Inspect client specifications and scope items'],
            ['key' => 'project.client_requirements.create', 'label' => 'Add Client Requirements', 'description' => 'Add new functional requirements for a project'],
            ['key' => 'project.client_requirements.update', 'label' => 'Update Client Requirements', 'description' => 'Modify existing client requirement deliverables'],
        ],
        'Design Studio' => [
            ['key' => 'view-design', 'label' => 'Design Studio Portal', 'description' => 'Access UI/UX design assets, tickets, and Figma sync'],
            ['key' => 'design.create', 'label' => 'Create Design Tickets', 'description' => 'Raise design tickets and upload asset revisions'],
            ['key' => 'design.review', 'label' => 'Review Design Work', 'description' => 'Inspect and comment on creative design submissions'],
            ['key' => 'design.approve', 'label' => 'Approve Design Deliverables', 'description' => 'Formally approve brand kits and visual designs'],
        ],
        'GitHub & Code Tracking' => [
            ['key' => 'view-github', 'label' => 'GitHub Repositories', 'description' => 'Track repository branches, commits, and pull requests'],
        ],
        'Communication' => [
            ['key' => 'view-communication', 'label' => 'Team Chat & Meetings', 'description' => 'Access real-time chats, video meetings, and agendas'],
        ],
        'Certificates' => [
            ['key' => 'view-certificates', 'label' => 'Manage Certificates', 'description' => 'Issue, verify, and generate completion certificates'],
            ['key' => 'view-certificates-read', 'label' => 'View Personal Certificates', 'description' => 'Download earned project certificates'],
        ],
        'Audit & Notifications' => [
            ['key' => 'view-audit-notifications', 'label' => 'Audit & System Alerts', 'description' => 'View system event feed and notifications'],
        ],
    ];

    /**
     * Default baseline permissions per role.
     */
    public const ROLE_DEFAULTS = [
        'admin' => [
            'system.admin', 'admin.manage_users', 'admin.manage_permissions', 'admin.reset_passwords', 'admin.audit_logs',
            'view-dashboard', 'view-coordinator', 'view-faculty', 'view-finance', 'view-finance-readonly', 'view-student',
            'view-student-designations', 'view-projects', 'project.view_global', 'project.view_assigned', 'project.create',
            'project.close', 'project.assign_faculty', 'project.assign_students',
            'project.task.update', 'project.submission.review', 'project.client_requirements.view', 'project.client_requirements.create',
            'project.client_requirements.update', 'view-design', 'design.create', 'design.review', 'design.approve', 'view-github',
            'view-communication', 'view-certificates', 'view-certificates-read', 'view-audit-notifications'
        ],
        'director' => [
            'view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications',
            'project.assign_faculty', 'project.view_global', 'project.client_requirements.view'
        ],
        'developer' => [
            'view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications',
            'project.assign_faculty', 'project.view_global', 'project.client_requirements.view',
            'project.create', 'project.close', 'project.assign_students', 'project.client_requirements.create',
            'project.client_requirements.update', 'project.module.create', 'project.task.create', 'project.task.update'
        ],
        'coordinator' => [
            'view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication',
            'view-github', 'view-certificates', 'project.create', 'project.assign_students', 'project.view_global',
            'project.client_requirements.create', 'project.client_requirements.view', 'project.client_requirements.update',
            'project.close'
        ],
        'finance' => [
            'view-finance', 'view-student-designations', 'view-projects'
        ],
        'design_head' => [
            'view-design', 'view-projects', 'view-dashboard', 'view-communication', 'design.create', 'design.review', 'design.approve'
        ],
        'faculty' => [
            'view-faculty', 'view-projects', 'view-communication', 'view-github', 'project.view_assigned',
            'project.module.create', 'project.task.create', 'project.task.update', 'project.submission.review',
            'project.client_requirements.view', 'project.client_requirements.create', 'project.client_requirements.update'
        ],
        'student' => [
            'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read',
            'project.view_assigned', 'project.task.update'
        ],
    ];

    /**
     * Verify caller has administrative privileges.
     */
    protected function checkAdmin(Request $request): int
    {
        $authUser = $request->auth_user ?? null;
        if (!$authUser) {
            abort(401, 'Unauthorized');
        }

        $role = $authUser['role'] ?? null;
        $permissions = $authUser['permissions'] ?? [];
        if (!is_array($permissions)) {
            $permissions = [];
        }

        $hasAccess = ($role === 'admin')
            || in_array('system.admin', $permissions, true)
            || in_array('admin.manage_users', $permissions, true);

        if (!$hasAccess) {
            abort(403, 'Forbidden: Administrative privileges required.');
        }

        return (int) ($authUser['sub'] ?? ($authUser['id'] ?? 0));
    }

    /**
     * Log an action in audit_logs.
     */
    protected function audit(int $actorId, string $action, string $description): void
    {
        if (!Schema::hasTable('audit_logs')) {
            return;
        }

        try {
            DB::table('audit_logs')->insert([
                'user_id' => $actorId,
                'action' => $action,
                'description' => $description,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Log quietly if audit table has foreign key constraint issues
        }
    }

    /**
     * GET /api/admin/overview
     * High-level admin summary KPIs.
     */
    public function overview(Request $request)
    {
        $this->checkAdmin($request);

        $totalUsers = DB::table('users')->count();
        $activeUsers = Schema::hasColumn('users', 'status')
            ? DB::table('users')->where('status', 'active')->count()
            : $totalUsers;
        $suspendedUsers = Schema::hasColumn('users', 'status')
            ? DB::table('users')->where('status', 'suspended')->count()
            : 0;

        $roleCounts = DB::table('users')
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        $recentAudits = [];
        if (Schema::hasTable('audit_logs')) {
            $recentAudits = DB::table('audit_logs')
                ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                ->select('audit_logs.id', 'audit_logs.action', 'audit_logs.description', 'audit_logs.created_at', 'users.name as actor_name', 'users.email as actor_email')
                ->orderBy('audit_logs.created_at', 'desc')
                ->limit(6)
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'suspended_users' => $suspendedUsers,
                'roles_breakdown' => $roleCounts,
                'recent_audits' => $recentAudits,
            ],
        ]);
    }

    /**
     * GET /api/admin/permissions-catalog
     * Returns full catalog of system permissions and role defaults.
     */
    public function permissionsCatalog(Request $request)
    {
        $this->checkAdmin($request);

        return response()->json([
            'status' => 'success',
            'catalog' => self::PERMISSIONS_CATALOG,
            'role_defaults' => self::ROLE_DEFAULTS,
        ]);
    }

    /**
     * GET /api/admin/users
     * Paginated and filterable user list.
     */
    public function index(Request $request)
    {
        $this->checkAdmin($request);

        $query = DB::table('users');

        // Search by name or email (reusing existing search query structure)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('department', 'like', '%' . $search . '%');
            });
        }

        // Filter by role
        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        // Filter by status (active/suspended)
        if ($status = $request->input('status')) {
            if (Schema::hasColumn('users', 'status')) {
                $query->where('status', $status);
            }
        }

        // Filter by department
        if ($dept = $request->input('department')) {
            $query->where('department', $dept);
        }

        // Sorting
        $allowedSorts = ['name', 'created_at', 'email', 'role', 'status', 'department'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts, true) ? $request->input('sort_by') : 'created_at';
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function ($u) {
            $perms = is_string($u->permissions) ? (json_decode($u->permissions, true) ?: []) : ($u->permissions ?: []);
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'role' => $u->role,
                'status' => $u->status ?? 'active',
                'department' => $u->department ?? 'General',
                'location' => $u->location ?? 'Kochi, India',
                'avatar' => $u->avatar,
                'profile_photo_path' => $u->profile_photo_path,
                'permissions_count' => count($perms),
                'created_at' => $u->created_at,
                'updated_at' => $u->updated_at,
            ];
        });

        // Unique department list for UI filter dropdown
        $departments = DB::table('users')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department');

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'departments' => $departments,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/users/{id}
     * Inspect individual user details, role profile, and activity.
     */
    public function show(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $userArray = (array) $user;
        unset($userArray['password']);
        $userArray['permissions'] = is_string($user->permissions)
            ? (json_decode($user->permissions, true) ?: [])
            : ($user->permissions ?: []);

        // Retrieve role-specific profiles
        $profile = null;
        if ($user->role === 'student' && Schema::hasTable('student_profiles')) {
            $profile = DB::table('student_profiles')->where('student_id', $id)->first();
        } elseif ($user->role === 'faculty' && Schema::hasTable('faculty_profiles')) {
            $profile = DB::table('faculty_profiles')->where('faculty_id', $id)->first();
        } elseif (($user->role === 'design_head' || $user->role === 'student') && Schema::hasTable('design_user_profiles')) {
            $profile = DB::table('design_user_profiles')->where('user_id', $id)->first();
        }

        // Retrieve user recent audits
        $userAudits = [];
        if (Schema::hasTable('audit_logs')) {
            $userAudits = DB::table('audit_logs')
                ->where('user_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'user' => $userArray,
            'role_profile' => $profile,
            'audit_history' => $userAudits,
            'role_defaults' => self::ROLE_DEFAULTS[$user->role] ?? [],
        ]);
    }

    /**
     * POST /api/admin/users
     * Create new user with validation, role defaults, and optional role profile.
     */
    public function store(Request $request)
    {
        $actorId = $this->checkAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
                function ($attribute, $value, $fail) {
                    if (!str_contains($value, '@rajagiri.edu')) {
                        $fail('The email must contain the @rajagiri.edu domain.');
                    }
                },
            ],
            'password' => 'required|string|min:6',
            'role' => 'required|in:director,coordinator,finance,faculty,student,developer,design_head,admin',
            'status' => 'nullable|in:active,suspended',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:150',
            'location' => 'nullable|string|max:150',
            'bio' => 'nullable|string|max:1000',
            'permissions' => 'nullable|array',
            // Student profile fields
            'course' => 'nullable|string|max:100',
            'batch' => 'nullable|string|max:50',
            'semester' => 'nullable|integer|min:1|max:12',
            'student_designation' => 'nullable|in:nova,orbit,spark',
            // Faculty profile fields
            'faculty_designation' => 'nullable|string|max:100',
            // Design profile fields
            'division' => 'nullable|string|max:100',
            'weekly_capacity_hours' => 'nullable|integer|min:0|max:80',
        ]);

        $role = $validated['role'];
        $status = $validated['status'] ?? 'active';

        // Compute effective permissions: if provided, validate against catalog, otherwise use role defaults
        $permissions = $validated['permissions'] ?? (self::ROLE_DEFAULTS[$role] ?? []);
        $allAllowedKeys = collect(self::PERMISSIONS_CATALOG)->flatten(1)->pluck('key')->all();
        $permissions = array_values(array_intersect($permissions, $allAllowedKeys));

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'phone' => $validated['phone'] ?? null,
            'department' => $validated['department'] ?? 'Creative Design & Innovation',
            'location' => $validated['location'] ?? 'Kochi, India',
            'bio' => $validated['bio'] ?? null,
            'permissions' => json_encode($permissions),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('users', 'status')) {
            $userData['status'] = $status;
        }

        $userId = DB::table('users')->insertGetId($userData);

        // Populate matching profile row
        $this->syncRoleProfile($userId, $role, $validated);

        // Log audit
        $this->audit($actorId, 'User Created', "Admin created user '{$validated['name']}' ({$validated['email']}) with role '{$role}' and status '{$status}'.");

        $createdUser = DB::table('users')->where('id', $userId)->first();
        $createdUserArray = (array) $createdUser;
        unset($createdUserArray['password']);
        $createdUserArray['permissions'] = $permissions;

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully.',
            'user' => $createdUserArray,
        ], 201);
    }

    /**
     * PUT /api/admin/users/{id}
     * Update existing user details, status, and role-specific profile.
     */
    public function update(Request $request, $id)
    {
        $actorId = $this->checkAdmin($request);

        $targetUser = DB::table('users')->where('id', $id)->first();
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($id),
                function ($attribute, $value, $fail) {
                    if (!str_contains($value, '@rajagiri.edu')) {
                        $fail('The email must contain the @rajagiri.edu domain.');
                    }
                },
            ],
            'role' => 'required|in:director,coordinator,finance,faculty,student,developer,design_head,admin',
            'status' => 'nullable|in:active,suspended',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:150',
            'location' => 'nullable|string|max:150',
            'bio' => 'nullable|string|max:1000',
            // Student profile
            'course' => 'nullable|string|max:100',
            'batch' => 'nullable|string|max:50',
            'semester' => 'nullable|integer|min:1|max:12',
            'student_designation' => 'nullable|in:nova,orbit,spark',
            // Faculty profile
            'faculty_designation' => 'nullable|string|max:100',
            // Design profile
            'division' => 'nullable|string|max:100',
            'weekly_capacity_hours' => 'nullable|integer|min:0|max:80',
        ]);

        $newRole = $validated['role'];
        $newStatus = $validated['status'] ?? ($targetUser->status ?? 'active');

        // Safety Guard 1: Cannot demote or change your own administrative role
        if ($actorId === (int)$id && $newRole !== $targetUser->role) {
            return response()->json(['error' => 'Safety violation: You cannot alter your own system role.'], 422);
        }

        // Safety Guard 2: Cannot suspend your own account
        if ($actorId === (int)$id && $newStatus === 'suspended') {
            return response()->json(['error' => 'Safety violation: You cannot suspend your own administrative account.'], 422);
        }

        // Safety Guard 3: Cannot remove or suspend the last active Administrator
        if ($targetUser->role === 'admin' && ($newRole !== 'admin' || $newStatus === 'suspended')) {
            $otherAdmins = DB::table('users')
                ->where('role', 'admin')
                ->where('id', '!=', $id);
            if (Schema::hasColumn('users', 'status')) {
                $otherAdmins->where('status', 'active');
            }
            if ($otherAdmins->count() === 0) {
                return response()->json(['error' => 'Safety violation: Cannot remove or suspend the last active Administrator in the system.'], 422);
            }
        }

        // Track changed fields for precise audit logs
        $changedFields = [];
        foreach (['name', 'email', 'role', 'phone', 'department', 'location', 'bio'] as $field) {
            if (isset($validated[$field]) && $validated[$field] != $targetUser->$field) {
                $changedFields[] = "{$field}: '{$targetUser->$field}' -> '{$validated[$field]}'";
            }
        }
        if (Schema::hasColumn('users', 'status') && isset($validated['status']) && $validated['status'] != ($targetUser->status ?? 'active')) {
            $changedFields[] = "status: '{$targetUser->status}' -> '{$validated['status']}'";
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $newRole,
            'phone' => $validated['phone'] ?? null,
            'department' => $validated['department'] ?? $targetUser->department,
            'location' => $validated['location'] ?? 'Kochi, India',
            'bio' => $validated['bio'] ?? null,
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('users', 'status')) {
            $updateData['status'] = $newStatus;
        }

        // If role changed and permissions were previously default or empty, optionally adjust
        if ($newRole !== $targetUser->role) {
            $currentPerms = is_string($targetUser->permissions) ? (json_decode($targetUser->permissions, true) ?: []) : [];
            // Merge in new role defaults if current permissions were minimal or empty
            if (empty($currentPerms)) {
                $updateData['permissions'] = json_encode(self::ROLE_DEFAULTS[$newRole] ?? []);
            }
        }

        DB::table('users')->where('id', $id)->update($updateData);

        // If suspended, revoke active Sanctum access tokens
        if ($newStatus === 'suspended' && Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_id', $id)->delete();
        }

        // Sync role-specific profile row (never silently deletes past profiles)
        $this->syncRoleProfile((int)$id, $newRole, $validated);

        // Audit log
        $desc = count($changedFields) > 0
            ? "Admin updated user #{$id} ({$validated['name']}): " . implode(', ', $changedFields)
            : "Admin updated user #{$id} ({$validated['name']}) without changing core fields.";
        $this->audit($actorId, 'User Updated', $desc);

        $updatedUser = DB::table('users')->where('id', $id)->first();
        $updatedUserArray = (array) $updatedUser;
        unset($updatedUserArray['password']);
        $updatedUserArray['permissions'] = is_string($updatedUser->permissions)
            ? (json_decode($updatedUser->permissions, true) ?: [])
            : ($updatedUser->permissions ?: []);

        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully.',
            'user' => $updatedUserArray,
        ]);
    }

    /**
     * PUT /api/admin/users/{id}/permissions
     * Store fine-grained per-user permissions as a flat array in users.permissions JSON.
     */
    public function updatePermissions(Request $request, $id)
    {
        $actorId = $this->checkAdmin($request);

        $targetUser = DB::table('users')->where('id', $id)->first();
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'permissions' => 'required|array',
        ]);

        $submitted = $validated['permissions'];

        // Validate all submitted keys against catalog; reject unknown keys
        $allAllowedKeys = collect(self::PERMISSIONS_CATALOG)->flatten(1)->pluck('key')->all();
        $unknown = array_diff($submitted, $allAllowedKeys);
        if (!empty($unknown)) {
            return response()->json([
                'error' => 'Validation failed: Unknown permission keys: ' . implode(', ', $unknown),
                'unknown_keys' => array_values($unknown),
            ], 422);
        }

        // Safety Guard: cannot remove system.admin / admin.manage_users from yourself
        if ($actorId === (int)$id) {
            if (!in_array('admin.manage_permissions', $submitted, true) && !in_array('system.admin', $submitted, true)) {
                return response()->json(['error' => 'Safety violation: You cannot revoke your own permission-management access.'], 422);
            }
        }

        $finalPerms = array_values(array_unique($submitted));

        DB::table('users')->where('id', $id)->update([
            'permissions' => json_encode($finalPerms),
            'updated_at' => now(),
        ]);

        $this->audit(
            $actorId,
            'Permissions Updated',
            "Admin updated permissions for user {$targetUser->name} ({$targetUser->email}). Total active permissions: " . count($finalPerms) . "."
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Permissions updated successfully.',
            'permissions' => $finalPerms,
        ]);
    }

    /**
     * POST /api/admin/users/{id}/reset-password
     * Admin sets a temporary password and revokes all active login tokens.
     */
    public function resetPassword(Request $request, $id)
    {
        $actorId = $this->checkAdmin($request);

        $targetUser = DB::table('users')->where('id', $id)->first();
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        DB::table('users')->where('id', $id)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);

        // Revoke active Sanctum personal access tokens immediately
        if (Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_id', $id)->delete();
        }

        $this->audit(
            $actorId,
            'Password Reset',
            "Admin set a temporary password for {$targetUser->name} ({$targetUser->email}). Active access tokens revoked."
        );

        return response()->json([
            'status' => 'success',
            'message' => "Password reset successfully for {$targetUser->name}. Active access tokens have been revoked.",
        ]);
    }

    /**
     * PUT /api/admin/users/{id}/status
     * Toggle active / suspended status.
     */
    public function updateStatus(Request $request, $id)
    {
        $actorId = $this->checkAdmin($request);

        $targetUser = DB::table('users')->where('id', $id)->first();
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $newStatus = $validated['status'];

        if ($actorId === (int)$id && $newStatus === 'suspended') {
            return response()->json(['error' => 'Safety violation: You cannot suspend your own account.'], 422);
        }

        if ($targetUser->role === 'admin' && $newStatus === 'suspended') {
            $otherActiveAdmins = DB::table('users')
                ->where('role', 'admin')
                ->where('status', 'active')
                ->where('id', '!=', $id)
                ->count();
            if ($otherActiveAdmins === 0) {
                return response()->json(['error' => 'Safety violation: Cannot suspend the only active Administrator.'], 422);
            }
        }

        if (Schema::hasColumn('users', 'status')) {
            DB::table('users')->where('id', $id)->update([
                'status' => $newStatus,
                'updated_at' => now(),
            ]);
        }

        // Revoke tokens if suspended
        if ($newStatus === 'suspended' && Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_id', $id)->delete();
        }

        $this->audit(
            $actorId,
            'User Status Changed',
            "Admin changed account status to '{$newStatus}' for {$targetUser->name} ({$targetUser->email})."
        );

        return response()->json([
            'status' => 'success',
            'message' => "User status updated to '{$newStatus}'.",
            'status_value' => $newStatus,
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Safe deletion checking relational dependencies.
     */
    public function destroy(Request $request, $id)
    {
        $actorId = $this->checkAdmin($request);

        if ($actorId === (int)$id) {
            return response()->json(['error' => 'Safety violation: You cannot delete your own account.'], 422);
        }

        $targetUser = DB::table('users')->where('id', $id)->first();
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($targetUser->role === 'admin') {
            $otherAdmins = DB::table('users')->where('role', 'admin')->where('id', '!=', $id)->count();
            if ($otherAdmins === 0) {
                return response()->json(['error' => 'Safety violation: Cannot delete the only remaining Administrator.'], 422);
            }
        }

        // Comprehensive dependency check across foreign-key referencing tables
        $blockingDeps = [];
        $checkTables = [
            'projects' => ['created_by' => 'created projects', 'faculty_id' => 'assigned projects'],
            'project_student' => ['student_id' => 'enrolled projects'],
            'project_faculty' => ['faculty_id' => 'guided projects'],
            'tasks' => ['assigned_to' => 'assigned tasks', 'created_by' => 'created tasks', 'reviewed_by' => 'task reviews'],
            'modules' => ['created_by' => 'project modules'],
            'client_payments' => ['recorded_by' => 'recorded client payments'],
            'invoices' => ['created_by' => 'invoices'],
            'project_finances' => ['created_by' => 'financial records', 'approved_by' => 'financial approvals'],
            'project_closures' => ['closed_by' => 'project closures'],
            'requirement_changes' => ['requested_by' => 'requirement changes', 'approved_by' => 'change approvals'],
            'client_requirements' => ['uploaded_by' => 'client requirements'],
            'student_work_logs' => ['student_id' => 'student work logs'],
            'certificates' => ['issued_by' => 'issued certificates'],
            'chats' => ['created_by' => 'chat channels'],
            'chat_messages' => ['sender_id' => 'chat messages'],
            'meetings' => ['created_by' => 'scheduled meetings'],
        ];

        foreach ($checkTables as $table => $columns) {
            if (!Schema::hasTable($table)) continue;
            foreach ($columns as $column => $label) {
                if (!Schema::hasColumn($table, $column)) continue;
                $count = DB::table($table)->where($column, $id)->count();
                if ($count > 0) {
                    $blockingDeps[] = "{$count} {$label}";
                }
            }
        }

        if (!empty($blockingDeps)) {
            return response()->json([
                'error' => "Cannot delete user '{$targetUser->name}' because linked historical records exist: " . implode(', ', $blockingDeps) . ". To prevent breaking audit trails and system integrity, please suspend the user instead of deleting.",
                'dependencies' => $blockingDeps,
            ], 422);
        }

        // If no blocking transactional dependencies, clean up profile tables and delete
        if (Schema::hasTable('student_profiles')) {
            DB::table('student_profiles')->where('student_id', $id)->delete();
        }
        if (Schema::hasTable('faculty_profiles')) {
            DB::table('faculty_profiles')->where('faculty_id', $id)->delete();
        }
        if (Schema::hasTable('design_user_profiles')) {
            DB::table('design_user_profiles')->where('user_id', $id)->delete();
        }
        if (Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_id', $id)->delete();
        }
        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->where('user_id', $id)->delete();
        }

        DB::table('users')->where('id', $id)->delete();

        $this->audit($actorId, 'User Deleted', "Admin permanently deleted user #{$id} ({$targetUser->name}, {$targetUser->email}).");

        return response()->json([
            'status' => 'success',
            'message' => "User '{$targetUser->name}' deleted successfully.",
        ]);
    }

    /**
     * GET /api/admin/audit-logs
     * Paginated audit logs with search and user filtering.
     */
    public function auditLogs(Request $request)
    {
        $this->checkAdmin($request);

        if (!Schema::hasTable('audit_logs')) {
            return response()->json(['status' => 'success', 'data' => [], 'pagination' => ['total' => 0]]);
        }

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select(
                'audit_logs.id',
                'audit_logs.action',
                'audit_logs.description',
                'audit_logs.created_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                'users.role as user_role'
            );

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('audit_logs.action', 'like', '%' . $search . '%')
                  ->orWhere('audit_logs.description', 'like', '%' . $search . '%')
                  ->orWhere('users.name', 'like', '%' . $search . '%')
                  ->orWhere('users.email', 'like', '%' . $search . '%');
            });
        }

        if ($userId = $request->input('user_id')) {
            $query->where('audit_logs.user_id', $userId);
        }

        if ($action = $request->input('action')) {
            $query->where('audit_logs.action', $action);
        }

        $query->orderBy('audit_logs.created_at', 'desc');

        $perPage = min(max((int)$request->input('per_page', 20), 5), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Helper to create or update corresponding profile records when creating or editing a user.
     */
    protected function syncRoleProfile(int $userId, string $role, array $data): void
    {
        if ($role === 'student' && Schema::hasTable('student_profiles')) {
            $profileData = [
                'updated_at' => now(),
            ];
            if (isset($data['course'])) $profileData['course'] = $data['course'];
            if (isset($data['batch'])) $profileData['batch'] = $data['batch'];
            if (isset($data['semester'])) $profileData['semester'] = (int)$data['semester'];
            if (isset($data['student_designation'])) $profileData['designation'] = $data['student_designation'];

            $exists = DB::table('student_profiles')->where('student_id', $userId)->exists();
            if (!$exists) {
                $profileData['student_id'] = $userId;
                $profileData['course'] = $profileData['course'] ?? 'MCA';
                $profileData['batch'] = $profileData['batch'] ?? date('Y') . '-' . (date('Y') + 2);
                $profileData['semester'] = $profileData['semester'] ?? 1;
                $profileData['designation'] = $profileData['designation'] ?? 'spark';
                $profileData['created_at'] = now();
                DB::table('student_profiles')->insert($profileData);
            } else {
                DB::table('student_profiles')->where('student_id', $userId)->update($profileData);
            }
        } elseif ($role === 'faculty' && Schema::hasTable('faculty_profiles')) {
            $profileData = [
                'updated_at' => now(),
            ];
            if (isset($data['department'])) $profileData['department'] = $data['department'];
            if (isset($data['faculty_designation'])) $profileData['designation'] = $data['faculty_designation'];

            $exists = DB::table('faculty_profiles')->where('faculty_id', $userId)->exists();
            if (!$exists) {
                $profileData['faculty_id'] = $userId;
                $profileData['department'] = $profileData['department'] ?? 'Computer Applications';
                $profileData['designation'] = $profileData['designation'] ?? 'Assistant Professor';
                $profileData['created_at'] = now();
                DB::table('faculty_profiles')->insert($profileData);
            } else {
                DB::table('faculty_profiles')->where('faculty_id', $userId)->update($profileData);
            }
        } elseif (($role === 'design_head' || $role === 'student') && Schema::hasTable('design_user_profiles')) {
            $profileData = [
                'updated_at' => now(),
            ];
            if (isset($data['division'])) $profileData['division'] = $data['division'];
            if (isset($data['weekly_capacity_hours'])) $profileData['weekly_capacity_hours'] = (int)$data['weekly_capacity_hours'];

            $exists = DB::table('design_user_profiles')->where('user_id', $userId)->exists();
            if (!$exists && ($role === 'design_head' || isset($data['division']))) {
                $profileData['user_id'] = $userId;
                $profileData['division'] = $profileData['division'] ?? 'Design';
                $profileData['weekly_capacity_hours'] = $profileData['weekly_capacity_hours'] ?? 20;
                $profileData['is_active'] = 1;
                $profileData['created_at'] = now();
                DB::table('design_user_profiles')->insert($profileData);
            } elseif ($exists) {
                DB::table('design_user_profiles')->where('user_id', $userId)->update($profileData);
            }
        }
    }
}
