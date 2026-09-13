<?php

namespace Modules\Project\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Coordinator\Models\StudentRole;
use Modules\Project\Models\Project;

class ProjectAssignmentController extends Controller
{
    private function checkPermission(Request $request, $permission)
    {
        $user = $request->input('auth_user');
        $role = $user['role'] ?? '';

        if (in_array($permission, ['project.assign_faculty', 'project.assign_students']) && in_array($role, ['director', 'coordinator'])) {
            return;
        }

        $permissions = $user['permissions'] ?? [];
        if (!in_array($permission, $permissions)) {
            abort(403, 'Forbidden: Missing permission ' . $permission);
        }
    }

    private function getUserId(Request $request)
    {
        $user = $request->input('auth_user');
        return $user['sub'] ?? ($user['id'] ?? null);
    }

    public function assignFaculty(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.assign_faculty');

        $request->validate([
            'faculty_id' => 'required'
        ]);

        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $faculty = DB::table('users')->where('id', $request->faculty_id)->first();
        $facultyName = $faculty ? $faculty->name : 'Faculty Member';

        if (Schema::hasColumn('projects', 'faculty_id')) {
            DB::table('projects')->where('id', $projectId)->update([
                'faculty_id' => $request->faculty_id,
                'updated_at' => now()
            ]);
        }

        if (Schema::hasTable('project_faculty')) {
            DB::table('project_faculty')->where('project_id', $projectId)->delete();
            DB::table('project_faculty')->insert([
                'project_id' => $projectId,
                'faculty_id' => $request->faculty_id,
                'assigned_date' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'action' => 'Faculty Assigned',
                'description' => "Assigned {$facultyName} (ID: {$request->faculty_id}) to project {$projectId}.",
                'user_id' => $this->getUserId($request) ?? 1,
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Assigned faculty {$facultyName} to project {$projectId}."
        ]);
    }

    public function assignStudent(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.assign_students');

        $request->validate([
            'student_id' => 'required',
            'designation' => 'nullable|string'
        ]);

        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        if (Schema::hasTable('project_student')) {
            $allowedRoles = ['project_lead', 'developer', 'designer', 'tester', 'other'];
            $submittedDesignation = strtolower((string) $request->designation);
            $submittedRole = in_array($submittedDesignation, $allowedRoles, true) ? $submittedDesignation : null;

            // A student's project role is global (set once, reused everywhere) — see
            // StudentRole. If they already have one, it's used regardless of what was
            // submitted; an explicit, differing submission is rejected rather than
            // silently overwritten.
            $existingRole = StudentRole::where('student_id', $request->student_id)->first();
            if ($existingRole && $submittedRole && $existingRole->role !== $submittedRole) {
                $label = ucwords(str_replace('_', ' ', $existingRole->role));
                return response()->json([
                    'error' => "This student's role is already set to \"{$label}\" and cannot be changed by assigning them to a new project.",
                ], 422);
            }

            $role = $existingRole->role ?? $submittedRole ?? 'other';

            if (!$existingRole) {
                StudentRole::create([
                    'student_id' => $request->student_id,
                    'role' => $role,
                ]);
            }

            DB::table('project_student')->updateOrInsert(
                ['project_id' => $projectId, 'student_id' => $request->student_id],
                [
                    'role' => $role,
                    'assigned_date' => now()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => "Assigned student to project {$projectId}."
        ]);
    }
}
