<?php

namespace Modules\Auth\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * @route POST /api/auth/register
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:director,coordinator,finance,faculty,student',
            'phone' => 'nullable|string|max:20',
        ]);
        $validated['password'] = Hash::make($validated['password']);
        $validated['permissions'] = json_encode([]); // Default empty permissions
        
        $userId = DB::table('users')->insertGetId($validated);
        $user = DB::table('users')->where('id', $userId)->first();
        
        $token = $this->generateJwt($user);
        
        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user
        ], 201);
    }

    /**
     * @route POST /api/auth/login
     */
    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (!$email || !str_contains($email, '@rajagiri.edu')) {
            return response()->json(['error' => 'Email must contain @rajagiri.edu'], 401);
        }

        $user = DB::table('users')->where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        $token = $this->generateJwt($user);

        return $this->respondWithToken($token, $user);
    }

    /**
     * @route POST /api/auth/logout
     */
    public function logout()
    {
        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * @route POST /api/auth/refresh
     */
    public function refresh()
    {
        // JWT Refresh could be implemented here
        return response()->json(['error' => 'Not implemented'], 501);
    }

    /**
     * Helper to format token response.
     */
    protected function respondWithToken($token, $user)
    {
        // Compute frontend-specific UI elements based on role
        $role = $user->role ?? 'student';
        
        $defaultRoutes = [
            'director' => '/dashboard',
            'coordinator' => '/coordinator',
            'finance' => '/finance',
            'faculty' => '/faculty',
            'student' => '/student'
        ];
        
        $modules = [
            'director' => ['dashboard', 'project-client', 'finance', 'github', 'audit-notifications', 'certificates', 'student', 'faculty', 'coordinator', 'communication'],
            'coordinator' => ['coordinator', 'project-client', 'student', 'communication', 'github', 'certificates'],
            'finance' => ['finance', 'project-client'],
            'faculty' => ['faculty', 'project-client', 'communication', 'github'],
            'student' => ['student', 'project-client', 'communication', 'github', 'certificates']
        ];
        
        // Convert stdClass to array for mutation if using DB facade
        $userArray = (array) $user;
        $userArray['defaultRoute'] = $defaultRoutes[$role] ?? '/student';
        $userArray['modules'] = $modules[$role] ?? $modules['student'];
        $userArray['permissions'] = is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? []);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => 3600,
            'user' => $userArray
        ]);
    }

    private function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private function generateJwt($user)
    {
        $permissions = is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? []);

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'permissions' => $permissions,
            'exp' => time() + 3600
        ]);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, config('app.key'), true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
}
