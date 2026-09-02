<?php

namespace Modules\Project\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Project\Models\Project;

class ProjectController extends Controller
{
    private function checkPermission(Request $request, $permission)
    {
        $user = $request->input('auth_user');
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

    public function index(Request $request)
    {
        $user = $request->input('auth_user');
        $role = $user['role'] ?? '';
        $permissions = $user['permissions'] ?? [];
        
        $query = Project::query();

        if ($role === 'director' || $role === 'coordinator' || in_array('project.view_global', $permissions)) {
            // Can see all projects
        } elseif ($role === 'faculty' || $role === 'student' || in_array('project.view_assigned', $permissions)) {
            $userId = $this->getUserId($request);
            if ($role === 'faculty') {
                $query->where(function($q) use ($userId) {
                    $q->whereHas('faculty', function($sub) use ($userId) {
                        $sub->where('user_id', $userId);
                    })->orWhere('faculty_id', $userId);
                });
            } elseif ($role === 'student') {
                $query->whereHas('students', function($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            }
        } else {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $projects = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $projects]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->input('auth_user');
        $permissions = $user['permissions'] ?? [];
        
        $project = Project::find($id);
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $role = $user['role'] ?? '';
        if ($role !== 'director' && $role !== 'coordinator' && !in_array('project.view_global', $permissions)) {
            if (!in_array('project.view_assigned', $permissions) && $role !== 'faculty' && $role !== 'student') {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            
            $userId = $this->getUserId($request);
            $hasAccess = false;
            
            if ($role === 'faculty') {
                $hasAccess = DB::table('project_faculty')->where('project_id', $id)->where('faculty_id', $userId)->exists() || $project->faculty_id == $userId;
            } elseif ($role === 'student') {
                $hasAccess = DB::table('project_student')->where('project_id', $id)->where('student_id', $userId)->exists();
            }
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Forbidden: Not assigned to this project'], 403);
            }
        }

        return response()->json(['status' => 'success', 'data' => $project]);
    }

    public function store(Request $request)
    {
        $this->checkPermission($request, 'project.create');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project_type' => 'nullable|string|max:100',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'budget' => 'nullable|numeric',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|string'
        ]);

        $validated['created_by'] = $this->getUserId($request) ?? 1;

        $project = Project::create($validated);
        
        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'action' => 'Project Created',
                'description' => "Project {$project->id} created.",
                'user_id' => $this->getUserId($request) ?? 1,
                'created_at' => now(),
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $project], 201);
    }

    public function close(Request $request, $id)
    {
        $this->checkPermission($request, 'project.close');
        
        $project = Project::find($id);
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        $project->status = 'completed';
        $project->save();
        
        if (Schema::hasTable('audit_logs')) {
            DB::table('audit_logs')->insert([
                'action' => 'Project Closed',
                'description' => "Project {$id} closed.",
                'user_id' => $this->getUserId($request) ?? 1,
                'created_at' => now(),
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $project]);
    }
}
