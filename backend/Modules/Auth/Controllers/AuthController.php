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
        
        // MOCK USERS CONFIGURATION:
        $mockUsers = [
            'director' => [
                'password' => 'director123',
                'id' => 1,
                'username' => 'director',
                'name' => 'Director & Co-ordinator',
                'role' => 'director',
                'defaultRoute' => '/dashboard',
                'modules' => ['dashboard', 'finance', 'project-client', 'github', 'audit-notifications', 'auth'],
                'permissions' => ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications'],
            ],
            'coordinator' => [
                'password' => 'coord123',
                'id' => 2,
                'username' => 'coordinator',
                'name' => 'Co-ordinator',
                'role' => 'coordinator',
                'defaultRoute' => '/coordinator',
                'modules' => ['coordinator', 'finance', 'student', 'project-client', 'communication', 'github', 'certificates', 'auth'],
                'permissions' => ['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates'],
            ],
            'finance_head' => [
                'password' => 'finance123',
                'id' => 3,
                'username' => 'finance_head',
                'name' => 'Finance Head',
                'role' => 'finance_head',
                'defaultRoute' => '/finance',
                'modules' => ['finance', 'student', 'project-client', 'auth'],
                'permissions' => ['view-finance', 'view-student-designations', 'view-projects'],
            ],
            'faculty' => [
                'password' => 'faculty123',
                'id' => 4,
                'username' => 'faculty',
                'name' => 'Faculty Member',
                'role' => 'faculty',
                'defaultRoute' => '/faculty',
                'modules' => ['faculty', 'project-client', 'communication', 'github', 'auth'],
                'permissions' => ['view-faculty', 'view-projects', 'view-communication', 'view-github'],
            ],
            'student' => [
                'password' => 'student123',
                'id' => 5,
                'username' => 'student',
                'name' => 'Student User',
                'role' => 'student',
                'defaultRoute' => '/student',
                'modules' => ['student', 'project-client', 'communication', 'github', 'certificates', 'auth'],
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read'],
            ],
            // Legacy / Fallback Admin account
            'admin' => [
                'password' => 'password',
                'id' => 99,
                'username' => 'admin',
                'name' => 'Administrator',
                'role' => 'director',
                'defaultRoute' => '/dashboard',
                'modules' => ['dashboard', 'finance', 'project-client', 'github', 'audit-notifications', 'auth'],
                'permissions' => ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications'],
            ]
        ];

        $username = $request->username;
        $password = $request->password;

        if (isset($mockUsers[$username]) && $mockUsers[$username]['password'] === $password) {
            $userConfig = $mockUsers[$username];
            unset($userConfig['password']);

            $mockToken = base64_encode(json_encode([
                'typ' => 'JWT', 'alg' => 'HS256'
            ])) . '.' . base64_encode(json_encode(array_merge($userConfig, [
                'sub' => $userConfig['id'],
                'exp' => time() + 3600
            ]))) . '.mocksignature';

            return $this->respondWithToken($mockToken, $userConfig);
        }

        return response()->json(['error' => 'Invalid username or password. Check MOCK_LOGIN_CREDENTIALS.txt.'], 401);
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
