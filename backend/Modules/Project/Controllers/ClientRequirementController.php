<?php

namespace Modules\Project\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClientRequirementController extends Controller
{
    private function checkPermission(Request $request, $permission)
    {
        $user = $request->input('auth_user');
        $role = $user['role'] ?? '';

        if (in_array($permission, ['project.client_requirements.create', 'project.client_requirements.update', 'project.client_requirements.delete']) && in_array($role, ['coordinator', 'director'])) {
            return;
        }

        $permissions = $user['permissions'] ?? [];
        if (!in_array($permission, $permissions)) {
            abort(403, 'Forbidden: Missing permission ' . $permission);
        }
    }

    public function index(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.client_requirements.view');
        
        $requirements = [];
        if (Schema::hasTable('client_requirements')) {
            $requirements = DB::table('client_requirements')->where('project_id', $projectId)->get();
        }

        return response()->json(['status' => 'success', 'data' => $requirements]);
    }

    public function store(Request $request, $projectId)
    {
        $this->checkPermission($request, 'project.client_requirements.create');
        
        $request->validate([
            'title' => 'required|string',
            'description' => 'required|string'
        ]);

        if (Schema::hasTable('client_requirements')) {
            $id = DB::table('client_requirements')->insertGetId([
                'project_id' => $projectId,
                'title' => $request->title,
                'description' => $request->description,
                'status' => 'new',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            return response()->json(['status' => 'success', 'data' => ['id' => $id]]);
        }
        
        return response()->json(['error' => 'Table not found'], 500);
    }

    public function update(Request $request, $id)
    {
        $this->checkPermission($request, 'project.client_requirements.update');
        
        $request->validate([
            'title' => 'string',
            'description' => 'string',
            'status' => 'string'
        ]);

        if (Schema::hasTable('client_requirements')) {
            $old = DB::table('client_requirements')->where('id', $id)->first();
            
            DB::table('client_requirements')->where('id', $id)->update(array_merge(
                $request->only(['title', 'description', 'status']),
                ['updated_at' => now()]
            ));

            if (Schema::hasTable('requirement_changes') && $old) {
                DB::table('requirement_changes')->insert([
                    'client_requirement_id' => $id,
                    'project_id' => $old->project_id,
                    'previous_value' => json_encode($old),
                    'updated_value' => json_encode($request->all()),
                    'changed_by' => $request->input('auth_user')['sub'] ?? 1,
                    'created_at' => now()
                ]);
            }

            return response()->json(['status' => 'success']);
        }

        return response()->json(['error' => 'Table not found'], 500);
    }
}
