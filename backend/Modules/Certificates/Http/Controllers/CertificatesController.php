<?php

namespace Modules\Certificates\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\Models\User;
use Modules\Certificates\Models\Certificate;
use Modules\ProjectClient\Models\Project;

class CertificatesController extends Controller
{
    protected function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    protected function isAuthorized(Request $request): bool
    {
        $permissions = $request->auth_user['permissions'] ?? [];
        if (!is_array($permissions)) {
            return false;
        }

        return in_array('view-certificates', $permissions, true)
            || in_array('view-certificates-read', $permissions, true)
            || in_array('view-coordinator', $permissions, true)
            || in_array('view-projects', $permissions, true);
    }

    public function index(Request $request)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $certificates = Certificate::with(['project', 'student', 'issuer'])->latest('issue_date')->get();

        return response()->json([
            'data' => $certificates,
            'count' => $certificates->count(),
        ]);
    }

    public function show(Request $request, Certificate $certificate)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json([
            'data' => $certificate->load(['project', 'student', 'issuer']),
        ]);
    }

    public function projectCertificates(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $certificates = Certificate::with(['student', 'issuer'])
            ->where('project_id', $project->id)
            ->orderBy('issue_date', 'desc')
            ->get();

        return response()->json(['data' => $certificates]);
    }

    public function studentCertificates(Request $request, User $student)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $certificates = Certificate::with(['project', 'issuer'])
            ->where('student_id', $student->id)
            ->orderBy('issue_date', 'desc')
            ->get();

        return response()->json(['data' => $certificates]);
    }

    public function store(Request $request)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'student_id' => 'required|integer|exists:users,id',
            'certificate_number' => 'required|string|max:50|unique:certificates',
            'description' => 'required|string|max:100',
            'issue_date' => 'required|date',
            'certificate_file' => 'nullable|string|max:500',
        ]);

        $validated['issued_by'] = $this->currentUserId($request) ?? $request->user()?->id;
        if (!$validated['issued_by']) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        $certificate = Certificate::create($validated);

        return response()->json([
            'message' => 'Certificate issued successfully',
            'data' => $certificate->load(['project', 'student', 'issuer']),
        ], 201);
    }
}
