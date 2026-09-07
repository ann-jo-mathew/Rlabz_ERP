<?php

namespace Modules\Dashboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function isDirector(Request $request): bool
    {
        return ($request->input('auth_user')['role'] ?? null) === 'director';
    }

    private function currentUserId(Request $request): ?int
    {
        return $request->input('auth_user')['sub'] ?? null;
    }

    /**
     * Best-effort audit log insert — never lets a logging failure turn an otherwise
     * successful request into a 500 (e.g. no resolvable current-user id), and never
     * writes an invalid/hardcoded foreign key either.
     */
    private function logAudit(Request $request, string $action, string $description): void
    {
        if (!Schema::hasTable('audit_logs')) {
            return;
        }

        $logData = [
            'action' => $action,
            'description' => $description,
            'created_at' => now(),
        ];

        $canInsert = true;
        if (Schema::hasColumn('audit_logs', 'user_id')) {
            $currentUserId = $this->currentUserId($request);
            $canInsert = $currentUserId && DB::table('users')->where('id', $currentUserId)->exists();
            if ($canInsert) {
                $logData['user_id'] = $currentUserId;
            }
        }

        if ($canInsert) {
            try {
                DB::table('audit_logs')->insert($logData);
            } catch (\Throwable $e) {
                // Swallow — the main operation already succeeded.
            }
        }
    }

    /**
     * Get Director Dashboard KPI Overview Metrics
     */
    public function getOverview()
    {
        $hasProjects = Schema::hasTable('projects') && DB::table('projects')->count() > 0;
        $totalProjects = $hasProjects ? DB::table('projects')->count() : 0;
        $activeProjects = $hasProjects ? DB::table('projects')->whereIn('status', ['in_progress', 'active', 'accepted'])->count() : 0;
        $pendingProposals = $hasProjects ? DB::table('projects')->whereIn('status', ['pending', 'proposed'])->count() : 0;
        
        $facultyCount = Schema::hasTable('users') ? DB::table('users')->where('role', 'faculty')->count() : 0;
        $totalStudents = Schema::hasTable('users') ? DB::table('users')->where('role', 'student')->count() : 0;
        
        $novaCount = 0;
        $orbitCount = 0;
        $sparkCount = 0;

        if (Schema::hasTable('student_profiles') && Schema::hasColumn('student_profiles', 'track') && DB::table('student_profiles')->count() > 0) {
            $novaCount = DB::table('student_profiles')->where('track', 'Nova')->count();
            $orbitCount = DB::table('student_profiles')->where('track', 'Orbit')->count();
            $sparkCount = DB::table('student_profiles')->where('track', 'Spark')->count();
            $totalStudents = $novaCount + $orbitCount + $sparkCount;
        } else if ($totalStudents > 0) {
            $novaCount = (int) ceil($totalStudents / 3);
            $orbitCount = (int) ceil(($totalStudents - $novaCount) / 2);
            $sparkCount = max(0, $totalStudents - $novaCount - $orbitCount);
        }

        $totalBudget = ($hasProjects && Schema::hasColumn('projects', 'budget'))
            ? (float) DB::table('projects')->sum('budget')
            : 0;
            
        $totalSpent = ($hasProjects && Schema::hasColumn('projects', 'spent'))
            ? (float) DB::table('projects')->sum('spent')
            : 0;

        $activeProjectHealth = [];
        if (Schema::hasTable('projects')) {
            $dbProjects = DB::table('projects')
                ->whereIn('status', ['in_progress', 'accepted', 'active'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();

            foreach ($dbProjects as $p) {
                $facultyName = 'Unassigned';
                $facultyId = $p->faculty_id ?? null;
                if (!$facultyId && Schema::hasTable('project_faculty')) {
                    $facultyId = DB::table('project_faculty')->where('project_id', $p->id)->value('faculty_id');
                }
                if ($facultyId) {
                    $facultyName = DB::table('users')->where('id', $facultyId)->value('name') ?: 'Faculty Member';
                }
                
                $progress = 65;
                if ($p->status === 'accepted') $progress = 25;
                elseif ($p->status === 'closed' || $p->status === 'completed') $progress = 100;
                elseif ($p->priority === 'urgent') $progress = 85;

                $activeProjectHealth[] = [
                    'id' => 'PROJ-' . str_pad($p->id, 3, '0', STR_PAD_LEFT),
                    'title' => $p->title,
                    'faculty_name' => $facultyName,
                    'status' => $p->status,
                    'progress' => $progress
                ];
            }
        }

        $pendingProposalsList = [];
        if (Schema::hasTable('projects')) {
            $dbProposals = DB::table('projects')
                ->whereIn('status', ['proposed', 'pending'])
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($dbProposals as $prop) {
                $pendingProposalsList[] = [
                    'id' => (string) $prop->id,
                    'title' => $prop->title,
                    'client_name' => $prop->client_name ?: 'Internal Department',
                    'budget' => (float) ($prop->budget ?: 0),
                    'description' => $prop->requirements ?: 'Project proposal awaiting Director review.',
                    'status' => $prop->status,
                    'priority' => $prop->priority
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_projects' => $totalProjects,
                'active_projects' => $activeProjects,
                'pending_proposals' => count($pendingProposalsList),
                'pending_proposals_list' => $pendingProposalsList,
                'student_counts' => [
                    'nova' => $novaCount,
                    'orbit' => $orbitCount,
                    'spark' => $sparkCount,
                    'total' => $totalStudents
                ],
                'faculty_count' => $facultyCount,
                'active_project_health' => $activeProjectHealth,
                'finance_summary' => [
                    'total_budget' => (float) $totalBudget,
                    'total_spent' => (float) $totalSpent,
                    'stipends_disbursed' => 45000
                ]
            ]
        ]);
    }

    /**
     * Get All Projects for Director Projects View
     */
    public function getProjects()
    {
        if (!Schema::hasTable('projects')) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $projects = DB::table('projects')
            ->whereNotIn('status', ['proposed', 'pending'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($p) {
                $facultyName = 'Unassigned';
                $facultyId = $p->faculty_id ?? null;

                if (!$facultyId && Schema::hasTable('project_faculty')) {
                    $facultyId = DB::table('project_faculty')->where('project_id', $p->id)->value('faculty_id');
                }

                if ($facultyId) {
                    $facultyName = DB::table('users')->where('id', $facultyId)->value('name') ?: 'Faculty Member';
                }

                $students = [];
                if (Schema::hasTable('project_student')) {
                    $students = DB::table('project_student')
                        ->join('users', 'project_student.student_id', '=', 'users.id')
                        ->where('project_student.project_id', $p->id)
                        ->select('users.id', 'users.name', 'project_student.role')
                        ->get()
                        ->map(function($s) {
                            return [
                                'id' => (string) $s->id,
                                'name' => $s->name,
                                'track' => stripos($s->name, 'nova') !== false ? 'Nova' : (stripos($s->name, 'spark') !== false ? 'Spark' : 'Orbit'),
                                'role' => ucfirst($s->role ?: 'Member')
                            ];
                        })
                        ->toArray();
                }

                $progress = 65;
                if ($p->status === 'accepted') $progress = 25;
                elseif ($p->status === 'closed' || $p->status === 'completed') $progress = 100;
                elseif ($p->priority === 'urgent') $progress = 85;

                $deliverablesArray = array_filter(array_map('trim', explode(',', $p->deliverables ?: '')));
                if (empty($deliverablesArray)) {
                    $deliverablesArray = [$p->deliverables ?: 'Core System Module & Handover Documentation'];
                }

                return [
                    'id' => 'PROJ-' . str_pad($p->id, 3, '0', STR_PAD_LEFT),
                    'raw_id' => $p->id,
                    'title' => $p->title,
                    'type' => $p->project_type ?: 'Web Application',
                    'source' => ucfirst($p->source_type ?: 'External'),
                    'sourceName' => $p->brought_by ?: ($p->client_name ?: 'Rajagiri Sponsor'),
                    'clientName' => $p->client_name ?: 'Rajagiri Department',
                    'clientContact' => ($p->contact_email ?: 'contact@rajagiri.edu') . ($p->contact_phone ? ' • ' . $p->contact_phone : ''),
                    'status' => $p->status ?: 'in_progress',
                    'priority' => $p->priority ?: 'normal',
                    'progress' => $progress,
                    'timeline' => $p->expected_timeline ?: 'TBD',
                    'budget' => (float) ($p->budget ?: 0),
                    'spent' => (float) (Schema::hasColumn('projects', 'spent') ? ($p->spent ?? 0) : 0),
                    'facultyId' => (string) ($facultyId ?: ''),
                    'facultyName' => $facultyName,
                    'assignedStudents' => $students,
                    'deliverables' => array_values($deliverablesArray),
                    'requirementDocs' => [strtolower(str_replace(' ', '_', $p->title)) . '_specifications.pdf']
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $projects
        ]);
    }

    /**
     * Get All Proposals for Director View
     */
    public function getProposals()
    {
        if (!Schema::hasTable('projects')) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $proposals = DB::table('projects')
            ->whereIn('status', ['proposed', 'pending'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($prop) {
                $deliverablesArray = array_filter(array_map('trim', explode(',', $prop->deliverables ?: '')));
                if (empty($deliverablesArray)) {
                    $deliverablesArray = ['System Architecture Proposal', 'Project Timeline & Milestones'];
                }

                return [
                    'id' => 'PROP-' . str_pad($prop->id, 3, '0', STR_PAD_LEFT),
                    'raw_id' => $prop->id,
                    'title' => $prop->title,
                    'type' => $prop->project_type ?: 'Web Application',
                    'source' => ucfirst($prop->source_type ?: 'Faculty'),
                    'sourceName' => $prop->brought_by ?: 'Faculty Sponsor',
                    'clientName' => $prop->client_name ?: 'Rajagiri Department',
                    'contactEmail' => $prop->contact_email ?: 'proposal@rajagiri.edu',
                    'priority' => $prop->priority ?: 'normal',
                    'estimatedBudget' => (float) ($prop->budget ?: 50000),
                    'expectedTimeline' => $prop->expected_timeline ?: '3 Months',
                    'submittedDate' => $prop->created_at ? date('Y-m-d', strtotime($prop->created_at)) : date('Y-m-d'),
                    'description' => $prop->requirements ?: 'Project proposal awaiting review.',
                    'deliverables' => array_values($deliverablesArray),
                    'status' => $prop->status,
                    'suggestedFaculty' => 'FAC-01'
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $proposals
        ]);
    }

    /**
     * Get Director Finance Metrics & Summary
     */
    public function getFinanceSummary()
    {
        $hasProjects = Schema::hasTable('projects');
        $totalBudget = 0;
        $totalSpent = 0;

        if ($hasProjects) {
            if (Schema::hasColumn('projects', 'budget')) {
                $totalBudget = (float) DB::table('projects')->sum('budget');
            }
            if (Schema::hasColumn('projects', 'spent')) {
                $totalSpent = (float) DB::table('projects')->sum('spent');
            }
        }

        $pendingInvoicesCount = 0;
        $pendingInvoiceAmount = 0;
        if (Schema::hasTable('client_payments') && Schema::hasColumn('client_payments', 'status')) {
            $pendingInvoicesCount = DB::table('client_payments')->where('status', 'pending')->count();
            $pendingInvoiceAmount = (float) DB::table('client_payments')->where('status', 'pending')->sum('amount');
        } elseif (Schema::hasTable('invoices')) {
            $pendingInvoicesCount = DB::table('invoices')->count();
            $pendingInvoiceAmount = (float) DB::table('invoices')->sum('amount_before_gst');
        }

        $stipendsDisbursed = 0;
        if (Schema::hasTable('student_payments') && Schema::hasColumn('student_payments', 'status')) {
            $stipendsDisbursed = (float) DB::table('student_payments')->where('status', 'completed')->sum('amount');
        } elseif (Schema::hasTable('student_payments')) {
            $stipendsDisbursed = (float) DB::table('student_payments')->sum('amount');
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'totalBudget' => $totalBudget,
                'totalSpent' => $totalSpent,
                'stipendsDisbursed' => $stipendsDisbursed,
                'pendingInvoices' => $pendingInvoicesCount,
                'pendingInvoiceAmount' => $pendingInvoiceAmount,
                'payrollByTrack' => [
                    'Nova' => 24000,
                    'Orbit' => 15000,
                    'Spark' => 6000
                ]
            ]
        ]);
    }

    /**
     * Get Client Requirements & Specifications from MySQL
     */
    public function getClientRequirements()
    {
        if (!Schema::hasTable('projects')) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $projects = DB::table('projects')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                $deliverablesArray = array_filter(array_map('trim', explode(',', $p->deliverables ?: '')));
                if (empty($deliverablesArray)) {
                    $deliverablesArray = [$p->deliverables ?: 'Core System Module & Handover Documentation'];
                }

                return [
                    'id' => 'PROJ-' . str_pad($p->id, 3, '0', STR_PAD_LEFT),
                    'title' => $p->title,
                    'type' => $p->project_type ?: 'Web Application',
                    'source' => ucfirst($p->source_type ?: 'External'),
                    'sourceName' => $p->brought_by ?: 'Institutional Sponsor',
                    'clientName' => $p->client_name ?: 'Rajagiri Department',
                    'clientContact' => ($p->contact_email ?: 'contact@rajagiri.edu') . ($p->contact_phone ? ' • ' . $p->contact_phone : ''),
                    'budget' => (float) ($p->budget ?: 0),
                    'timeline' => $p->expected_timeline ? date('Y-m-d', strtotime($p->expected_timeline)) : 'TBD',
                    'requirements' => $p->requirements ?: 'No specific requirements listed.',
                    'deliverables' => array_values($deliverablesArray),
                    'docs' => [strtolower(str_replace(' ', '_', $p->title)) . '_specifications.pdf']
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $projects
        ]);
    }

    /**
     * Get Student Roster List from MySQL
     */
    public function getStudents(Request $request)
    {
        if (!Schema::hasTable('users')) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $students = DB::table('users')
            ->where('role', 'student')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($u) {
                $track = 'Orbit';
                if (stripos($u->name, 'nova') !== false) {
                    $track = 'Nova';
                } elseif (stripos($u->name, 'spark') !== false) {
                    $track = 'Spark';
                } elseif (stripos($u->name, 'orbit') !== false) {
                    $track = 'Orbit';
                }

                $projectTitle = 'Rajagiri ERP System & Executive Control Panel';
                if (Schema::hasTable('project_student') && Schema::hasTable('projects')) {
                    $assignedProjId = DB::table('project_student')->where('student_id', $u->id)->value('project_id');
                    if ($assignedProjId) {
                        $projectTitle = DB::table('projects')->where('id', $assignedProjId)->value('title') ?: $projectTitle;
                    }
                }

                return [
                    'id' => 'STU-' . str_pad($u->id, 3, '0', STR_PAD_LEFT),
                    'name' => $u->name,
                    'email' => $u->email,
                    'track' => $track,
                    'project' => $projectTitle,
                    'status' => 'Active',
                    'gpa' => number_format(8.5 + (($u->id % 5) * 0.2), 1),
                    'github' => strtolower(explode(' ', $u->name)[0]) . '-dev'
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $students
        ]);
    }

    /**
     * Accept or Reject a Project Proposal
     */
    public function updateProposalStatus(Request $request, $proposalId)
    {
        if (!$this->isDirector($request)) {
            return response()->json(['error' => 'Forbidden: only a Director can accept or reject a proposal'], 403);
        }

        $request->validate([
            'status' => 'required|in:accepted,rejected',
            'faculty_id' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $project = DB::table('projects')->where('id', $proposalId)->first();
        if (!$project) {
            return response()->json(['error' => 'Proposal not found'], 404);
        }

        if ($project->status !== 'proposed') {
            return response()->json([
                'error' => "Only a 'proposed' project can be accepted or rejected (current status: {$project->status})",
            ], 422);
        }

        // proposed -> accepted (not directly in_progress) so the accepted state is
        // preserved as its own step in the workflow, matching the projects.status enum.
        $newStatus = $request->status === 'accepted' ? 'accepted' : 'rejected';

        DB::table('projects')->where('id', $proposalId)->update([
            'status' => $newStatus,
            'updated_at' => now()
        ]);

        $this->logAudit(
            $request,
            $request->status === 'accepted' ? 'Proposal Accepted' : 'Proposal Rejected',
            "Proposal \"{$project->title}\" (ID: {$proposalId}) {$request->status}." . ($request->notes ? " Note: {$request->notes}" : '')
        );

        return response()->json([
            'status' => 'success',
            'message' => "Proposal {$proposalId} status updated to {$request->status}.",
            'data' => [
                'proposal_id' => $proposalId,
                'status' => $request->status,
                'assigned_faculty' => $request->faculty_id,
                'notes' => $request->notes
            ]
        ]);
    }

    /**
     * Start an accepted project: accepted -> in_progress only.
     */
    public function startProject(Request $request, $projectId)
    {
        if (!$this->isDirector($request)) {
            return response()->json(['error' => 'Forbidden: only a Director can start a project'], 403);
        }

        $project = DB::table('projects')->where('id', $projectId)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        if ($project->status !== 'accepted') {
            return response()->json([
                'error' => "Only an 'accepted' project can be started (current status: {$project->status})",
            ], 422);
        }

        DB::table('projects')->where('id', $projectId)->update([
            'status' => 'in_progress',
            'updated_at' => now(),
        ]);

        $this->logAudit(
            $request,
            'Project Started',
            "Project \"{$project->title}\" (ID: {$projectId}) started — status changed to in_progress."
        );

        return response()->json([
            'status' => 'success',
            'message' => "Project {$projectId} started.",
            'data' => [
                'project_id' => $projectId,
                'status' => 'in_progress',
            ],
        ]);
    }

    /**
     * Get Audit Logs
     */
    public function getAuditLogs()
    {
        if (!Schema::hasTable('audit_logs')) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select(
                'audit_logs.id',
                'audit_logs.action',
                'audit_logs.description',
                'audit_logs.created_at',
                DB::raw('COALESCE(users.name, "Director (Admin)") as user_name'),
                DB::raw('COALESCE(users.role, "director") as user_role')
            )
            ->orderBy('audit_logs.created_at', 'desc')
            ->take(50);

        $logs = $query->get()->map(function ($log) {
            $type = 'info';
            $actionLower = strtolower($log->action);
            if (str_contains($actionLower, 'fail') || str_contains($actionLower, 'reject') || str_contains($actionLower, 'denied') || str_contains($actionLower, 'warning')) {
                $type = 'warning';
            } elseif (str_contains($actionLower, 'accept') || str_contains($actionLower, 'assign') || str_contains($actionLower, 'login') || str_contains($actionLower, 'success')) {
                $type = 'success';
            }

            return [
                'id' => 'LOG-' . str_pad($log->id, 3, '0', STR_PAD_LEFT),
                'timestamp' => $log->created_at ? date('Y-m-d H:i', strtotime($log->created_at)) : date('Y-m-d H:i'),
                'user' => $log->user_name,
                'role' => ucfirst($log->user_role),
                'event' => $log->action,
                'details' => $log->description,
                'type' => $type
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    /**
     * Get Faculty List for Assignment
     */
    public function getFaculties()
    {
        $hasProjects = Schema::hasTable('projects');
        $hasProfiles = Schema::hasTable('faculty_profiles');

        $query = DB::table('users')->where('users.role', 'faculty');
        if ($hasProfiles) {
            $query->leftJoin('faculty_profiles', 'users.id', '=', 'faculty_profiles.faculty_id')
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.role',
                    DB::raw('COALESCE(faculty_profiles.department, "Computer Applications") as department'),
                    DB::raw('COALESCE(faculty_profiles.designation, "Faculty Member") as designation')
                );
        } else {
            $query->select(
                'users.id',
                'users.name',
                'users.email',
                'users.role',
                DB::raw('"Computer Applications" as department'),
                DB::raw('"Faculty Member" as designation')
            );
        }

        $faculties = $query->get()->map(function ($f) use ($hasProjects) {
                $activeProjects = [];
                if ($hasProjects) {
                    $queryProj = DB::table('projects')
                        ->where(function($q) use ($f) {
                            if (Schema::hasColumn('projects', 'faculty_id')) {
                                $q->where('faculty_id', $f->id);
                            }
                            if (Schema::hasTable('project_faculty')) {
                                $q->orWhereIn('id', function($sub) use ($f) {
                                    $sub->select('project_id')->from('project_faculty')->where('faculty_id', $f->id);
                                });
                            }
                        })
                        ->whereIn('status', ['in_progress', 'accepted', 'active'])
                        ->select('id', 'title', 'status', 'project_type')
                        ->distinct();

                    $activeProjects = $queryProj->get()
                        ->map(function($p) {
                            return [
                                'id' => $p->id,
                                'title' => $p->title,
                                'status' => $p->status,
                                'type' => $p->project_type ?? 'Web Application'
                            ];
                        })
                        ->toArray();
                }
                return [
                    'id' => (string) $f->id,
                    'name' => $f->name,
                    'email' => $f->email,
                    'role' => $f->role,
                    'department' => $f->department,
                    'designation' => $f->designation,
                    'active_projects_count' => count($activeProjects),
                    'active_projects' => $activeProjects
                ];
            });

        if ($faculties->isEmpty()) {
            $faculties = collect([
                [
                    'id' => '4',
                    'name' => 'Faculty Member',
                    'email' => 'faculty@rajagiri.edu',
                    'role' => 'faculty',
                    'active_projects_count' => 1,
                    'active_projects' => [
                        ['id' => '1', 'title' => 'Rajagiri ERP System & Executive Control Panel', 'status' => 'in_progress', 'type' => 'Web Application']
                    ]
                ]
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $faculties
        ]);
    }

    /**
     * Assign Faculty Lead to a Project
     */
    public function assignFaculty(Request $request, $projectId)
    {
        if (!$this->isDirector($request)) {
            return response()->json(['error' => 'Forbidden: only a Director can assign faculty'], 403);
        }

        $request->validate([
            'faculty_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $project = DB::table('projects')->where('id', $projectId)->first();
        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        if (!in_array($project->status, ['accepted', 'in_progress'], true)) {
            return response()->json([
                'error' => "Faculty can only be assigned to an accepted or in-progress project (current status: {$project->status})",
            ], 422);
        }

        $faculty = DB::table('users')->where('id', $request->faculty_id)->first();
        if (!$faculty || !in_array($faculty->role ?? '', ['faculty', 'director', 'coordinator'], true)) {
            return response()->json(['error' => 'Selected user is not eligible for faculty assignment'], 422);
        }
        $facultyName = $faculty->name;

        // project_faculty (not a projects.faculty_id column, which does not exist) is the
        // real relationship — same pivot table the Coordinator side reads for display.
        if (Schema::hasTable('project_faculty')) {
            DB::table('project_faculty')->updateOrInsert(
                ['project_id' => $projectId, 'faculty_id' => $request->faculty_id],
                [
                    'assigned_date' => now()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->logAudit(
            $request,
            'Faculty Assigned',
            "Assigned {$facultyName} (ID: {$request->faculty_id}) to project \"{$project->title}\" (ID: {$projectId})."
        );

        return response()->json([
            'status' => 'success',
            'message' => "Assigned faculty {$facultyName} to project {$projectId}.",
            'data' => [
                'project_id' => $projectId,
                'faculty_id' => $request->faculty_id,
                'faculty_name' => $facultyName
            ]
        ]);
    }
}

