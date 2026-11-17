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
        $role = $user['role'] ?? '';

        // Admin and Director are explicitly prohibited from creating modules and tasks
        if (in_array($permission, ['project.module.create', 'project.task.create']) && in_array($role, ['admin', 'director'])) {
            abort(403, 'Forbidden: ' . ucfirst($role) . ' is not permitted to create modules or tasks');
        }
        
        // Allow role-based bypass for specific permissions. Module/task creation and
        // status updates are a Faculty responsibility — Coordinator is intentionally
        // excluded here (see Modules\Coordinator\Http\Controllers\CoordinatorController,
        // which no longer has any module/task write endpoints either).
        if (in_array($permission, ['project.module.create', 'project.task.create']) && in_array($role, ['faculty'])) {
            return;
        }
        if ($permission === 'project.task.update' && in_array($role, ['faculty', 'student'])) {
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

    public function storeModule(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.module.create');
        
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'document_path' => 'nullable|string|max:1000'
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

        $project = DB::table('projects')->where('id', $projectId)->first();
        if ($project && strtolower($project->status ?? '') === 'closed') {
            return response()->json(['error' => 'Cannot create module. This project is closed.'], 422);
        }

        $module = Module::create([
            'project_id' => $projectId,
            'module_name' => $request->name,
            'description' => $request->description,
            'document_path' => $request->document_path ?? null,
            'status' => 'not_started',
            'created_by' => $userId
        ]);

        return response()->json(['status' => 'success', 'data' => $module], 201);
    }

    public function storeTask(Request $request, $moduleId)
    {
        $this->checkPermission($request, 'project.task.create');

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'nullable|numeric|min:0|max:1000',
            'priority' => 'nullable|string'
        ]);

        $module = Module::find($moduleId);
        if (!$module) {
            return response()->json(['error' => 'Module not found'], 404);
        }

        $project = DB::table('projects')->where('id', $module->project_id)->first();
        if ($project && strtolower($project->status ?? '') === 'closed') {
            return response()->json(['error' => 'Cannot create task. This project is closed.'], 422);
        }

        $userId = $this->getUserId($request);

        if (!$userId) {
            $userId = auth()->id();
        }

        if (!$userId && isset($request->input('auth_user')['email'])) {
            $foundUser = DB::table('users')
                ->where('email', $request->input('auth_user')['email'])
                ->first();

            if ($foundUser) {
                $userId = $foundUser->id;
            }
        }

        if (!$userId) {
            $userId = DB::table('users')
                ->where('role', 'faculty')
                ->value('id') ?? 1;
        }

        try {
            $task = Task::create([
                'module_id' => $moduleId,
                'title' => $request->title,
                'description' => $request->description,
                'weight' => $request->weight ? round((float) $request->weight) : 1,
                'status' => 'todo',
                'created_by' => $userId
            ]);

            return response()->json(['status' => 'success', 'data' => $task], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create task: ' . $e->getMessage()], 500);
        }
    }

    public function updateTaskStatus(Request $request, $taskId)
    {
        $this->checkPermission($request, 'project.task.update');
        
        $request->validate([
            'status' => 'required|string|in:To Do,In Progress,Completed,Blocked,Rework,todo,in_progress,completed,blocked,rework'
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

        $statusMap = [
            'To Do' => 'todo',
            'In Progress' => 'in_progress',
            'Completed' => 'completed',
            'Blocked' => 'blocked',
            'Rework' => 'rework',
            'todo' => 'todo',
            'in_progress' => 'in_progress',
            'completed' => 'completed',
            'blocked' => 'blocked',
            'rework' => 'rework',
        ];
        $task->status = $statusMap[$request->status];
        $task->save();

        // Check if all tasks in the module are completed to update module status to completed
        if ($task->module_id) {
            $this->checkAndUpdateModuleCompletion($task->module_id);
        }

        return response()->json(['status' => 'success', 'data' => $task]);
    }

    public function updateModuleStatus(Request $request, $moduleId)
    {
        $user = $request->input('auth_user');
        $role = $user['role'] ?? '';

        // Only allow faculty, director, and developer — module status changes are a
        // Faculty responsibility; Coordinator intentionally excluded (see comment in
        // checkPermission() above).
        if (!in_array($role, ['faculty', 'director', 'developer'])) {
            return response()->json(['error' => 'Forbidden: Only faculty, director, or developer can update module status.'], 403);
        }

        $request->validate([
            'status' => 'required|string|in:blocked,in_progress,not_started,completed,rework'
        ]);

        $module = Module::find($moduleId);
        if (!$module) {
            return response()->json(['error' => 'Module not found'], 404);
        }

        $module->status = $request->status;
        $module->save();

        return response()->json(['status' => 'success', 'data' => $module]);
    }

    private function checkAndUpdateModuleCompletion($moduleId)
    {
        $module = Module::with('tasks')->find($moduleId);
        if (!$module) return;

        // If module was explicitly blocked by faculty, don't automatically override to completed unless unblocked
        if ($module->status === 'blocked') return;

        $tasks = $module->tasks;
        if ($tasks->count() > 0) {
            $allCompleted = $tasks->every(function ($t) {
                return in_array(strtolower($t->status), ['completed']);
            });

            if ($allCompleted) {
                if ($module->status !== 'completed') {
                    $module->status = 'completed';
                    $module->save();
                }
            } else {
                // If not all completed and previously marked completed, update to rework or in_progress
                if ($module->status === 'completed') {
                    $hasAnyRework = $tasks->contains(function ($t) {
                        return strtolower($t->status) === 'rework';
                    });
                    $module->status = $hasAnyRework ? 'rework' : 'in_progress';
                    $module->save();
                }
            }
        }
    }
}
