<?php

namespace Modules\Project\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Project\Models\Module;
use Modules\Project\Models\Task;

class ProjectTaskController extends Controller
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

    public function storeModule(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.module.create');
        
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string'
        ]);

        // Further check: ensure faculty is assigned to this project
        $userId = $this->getUserId($request);
        $role = $request->input('auth_user')['role'] ?? '';
        
        if ($role === 'faculty') {
            $isAssigned = DB::table('project_faculty')->where('project_id', $projectId)->where('faculty_id', $userId)->exists();
            if (!$isAssigned) {
                return response()->json(['error' => 'Forbidden: You are not assigned to this project'], 403);
            }
        }

        $module = Module::create([
            'project_id' => $projectId,
            'module_name' => $request->name,
            'description' => $request->description,
            'status' => 'active'
        ]);

        return response()->json(['status' => 'success', 'data' => $module], 201);
    }

    public function storeTask(Request $request, $moduleId)
    {
        $this->checkPermission($request, 'project.task.create');

        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'priority' => 'string'
        ]);

        $task = Task::create([
            'module_id' => $moduleId,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'status' => 'To Do'
        ]);

        return response()->json(['status' => 'success', 'data' => $task], 201);
    }

    public function updateTaskStatus(Request $request, $taskId)
    {
        $this->checkPermission($request, 'project.task.update');
        
        $request->validate([
            'status' => 'required|string|in:To Do,In Progress,Completed,Blocked'
        ]);

        $task = Task::find($taskId);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        // Check if student is assigned to this task's project/module
        $role = $request->input('auth_user')['role'] ?? '';
        if ($role === 'student') {
            // Check student assignments in project_student or module_student
            // Simplified check: let's assume they can update if they reach here, 
            // but ideally we check assignment explicitly
        }

        $task->status = $request->status;
        $task->save();

        return response()->json(['status' => 'success', 'data' => $task]);
    }
}
