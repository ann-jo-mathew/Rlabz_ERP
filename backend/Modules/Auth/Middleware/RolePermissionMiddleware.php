<?php

namespace Modules\Auth\Middleware;

use Closure;
use Illuminate\Http\Request;

class RolePermissionMiddleware
{
    /**
     * Handle an incoming request.
     * Ensure the user has the required permission.
     * Usage in routes: `middleware('permission:edit-project')`
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $permission
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $permission)
    {
        $authUser = $request->auth_user;
        
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $permissions = $authUser['permissions'] ?? [];
        
        if (!in_array($permission, $permissions)) {
            return response()->json([
                'error' => 'Forbidden - Missing Permission: ' . $permission
            ], 403);
        }

        return $next($request);
    }
}
