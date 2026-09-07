<?php

namespace Modules\Certificates\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\Models\User;
use Modules\Certificates\Models\Certificate;
use Modules\Project\Models\Module;
use Modules\Project\Models\Project;

class CertificatesController extends Controller
{
    protected function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    protected function generateCertificateNumber(): string
    {
        $year = date('Y');
        do {
            $sequence = str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
            $candidate = "CERT-{$year}-{$sequence}";
        } while (Certificate::where('certificate_number', $candidate)->exists());

        return $candidate;
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

        $certificates = Certificate::with(['project', 'module', 'student', 'issuer'])->latest('issue_date')->get();

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
            'data' => $certificate->load(['project', 'module', 'student', 'issuer']),
        ]);
    }

    public function projectCertificates(Request $request, Project $project)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $certificates = Certificate::with(['module', 'student', 'issuer'])
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

        $certificates = Certificate::with(['project', 'module', 'issuer'])
            ->where('student_id', $student->id)
            ->orderBy('issue_date', 'desc')
            ->get();

        return response()->json(['data' => $certificates]);
    }

    /**
     * Students eligible for a certificate for the given module: must have a
     * module_student record for this module (module_student is the source of truth
     * for "was assigned to / completed this module", per the certificate business rule).
     */
    public function moduleEligibleStudents(Request $request, Module $module)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $alreadyCertifiedIds = Certificate::where('module_id', $module->id)->pluck('student_id');

        $students = $module->students()
            ->select('users.id', 'users.name', 'users.email')
            ->whereNotIn('users.id', $alreadyCertifiedIds)
            ->get();

        $message = null;
        if ($module->status !== 'completed') {
            $message = 'This module is not marked completed yet — certificates cannot be issued until it is.';
        } elseif ($students->isEmpty()) {
            $message = $module->students()->count() === 0
                ? 'No students are assigned to this module yet.'
                : 'All students assigned to this module already have a certificate for it.';
        }

        return response()->json([
            'data' => $students,
            'module_status' => $module->status,
            'message' => $message,
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->isAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'module_id' => 'required|integer|exists:modules,id',
            'student_id' => 'required|integer|exists:users,id',
            'issue_date' => 'nullable|date',
            'certificate_file' => 'nullable|string|max:500',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $module = Module::findOrFail($validated['module_id']);

        if ((int) $module->project_id !== (int) $project->id) {
            return response()->json(['error' => 'Selected module does not belong to the selected project'], 422);
        }

        if ($module->status !== 'completed') {
            return response()->json(['error' => 'Certificates can only be issued once the module status is completed'], 422);
        }

        $student = User::find($validated['student_id']);
        if (!$student || $student->role !== 'student') {
            return response()->json(['error' => 'Selected user is not a student'], 422);
        }

        $isAssignedToProject = $project->students()->where('users.id', $student->id)->exists();
        if (!$isAssignedToProject) {
            return response()->json(['error' => 'Selected student is not assigned to this project'], 422);
        }

        $isAssignedToModule = $module->students()->where('users.id', $student->id)->exists();
        if (!$isAssignedToModule) {
            return response()->json(['error' => 'Selected student is not assigned to this module'], 422);
        }

        $duplicate = Certificate::where('project_id', $project->id)
            ->where('module_id', $module->id)
            ->where('student_id', $student->id)
            ->exists();
        if ($duplicate) {
            return response()->json(['error' => 'A certificate has already been issued to this student for this module'], 422);
        }

        $issuedBy = $this->currentUserId($request) ?? $request->user()?->id;
        if (!$issuedBy) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        $certificate = Certificate::create([
            'project_id' => $project->id,
            'module_id' => $module->id,
            'student_id' => $student->id,
            'certificate_number' => $this->generateCertificateNumber(),
            'description' => "Certificate awarded to {$student->name} for successfully completing the {$module->module_name} module of the {$project->title} project.",
            'issue_date' => $validated['issue_date'] ?? now()->toDateString(),
            'certificate_file' => $validated['certificate_file'] ?? null,
            'issued_by' => $issuedBy,
        ]);

        return response()->json([
            'message' => 'Certificate issued successfully',
            'data' => $certificate->load(['project', 'module', 'student', 'issuer']),
        ], 201);
    }
}
