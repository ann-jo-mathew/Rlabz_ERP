<?php

namespace Modules\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
// use Modules\Auth\Models\User; // Commented out for mock

class AuthController extends Controller
{
    /**
     * @route POST /api/auth/register
     */
    public function register(Request $request)
    {
        // REAL IMPLEMENTATION (Commented out):
        // $validated = $request->validate([...]);
        // $validated['password'] = Hash::make($validated['password']);
        // $user = User::create($validated);
        // $token = auth()->login($user);
        
        // MOCK IMPLEMENTATION (No DB needed):
        return response()->json([
            'message' => 'User registered successfully (MOCK)',
            'user' => [
                'username' => $request->username,
                'role' => $request->role ?? 'student',
            ]
        ], 201);
    }

    /**
     * @route POST /api/auth/login
     */
    public function login(Request $request)
    {
        // REAL IMPLEMENTATION (Commented out):
        // $credentials = $request->only('username', 'password');
        // if (! $token = auth()->attempt($credentials)) {
        //     return response()->json(['error' => 'Unauthorized'], 401);
        // }
        
        // MOCK IMPLEMENTATION (No DB needed):
        if ($request->username === 'admin' && $request->password === 'password') {
            $mockToken = base64_encode(json_encode([
                'typ' => 'JWT', 'alg' => 'HS256'
            ])) . '.' . base64_encode(json_encode([
                'sub' => 1,
                'username' => 'admin',
                'role' => 'director',
                'permissions' => ['view-dashboard', 'edit-project'],
                'modules' => ['dashboard', 'project-client', 'auth'],
                'exp' => time() + 3600
            ])) . '.mocksignature';

            return $this->respondWithToken($mockToken, [
                'id' => 1,
                'username' => 'admin',
                'role' => 'director',
                'permissions' => ['view-dashboard', 'edit-project'],
                'modules' => ['dashboard', 'project-client', 'auth'],
            ]);
        }

        return response()->json(['error' => 'Unauthorized (Use admin/password for mock)'], 401);
    }

    /**
     * @route POST /api/auth/logout
     */
    public function logout()
    {
        // REAL: auth()->logout();
        return response()->json(['message' => 'Successfully logged out (MOCK)']);
    }

    /**
     * @route POST /api/auth/refresh
     */
    public function refresh()
    {
        // REAL: return $this->respondWithToken(auth()->refresh());
        return response()->json(['message' => 'Token refreshed (MOCK)', 'token' => 'mock-refreshed-token']);
    }

    /**
     * Helper to format token response.
     */
    protected function respondWithToken($token, $userMock = null)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => 3600, // REAL: auth()->factory()->getTTL() * 60
            'user' => $userMock
        ]);
    }
}
