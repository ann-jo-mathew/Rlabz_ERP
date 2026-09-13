<?php

namespace Modules\Finance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Finance\Models\StudentPayment;
use Modules\Finance\Models\FacultyPayment;
use Modules\Finance\Models\ClientPayment;
use Modules\Finance\Models\ProjectFinance;
use Modules\Finance\Models\Invoice;
use Modules\Finance\Models\HostingCharge;
use Modules\Finance\Models\MaintenanceSupportCharge;
use Modules\Finance\Services\FinanceService;
use Modules\Project\Models\Project;

class PaymentController extends Controller
{
    protected $financeService;

    private function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    public function __construct(FinanceService $financeService)
    {
        $this->financeService = $financeService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helper: resolve Project from a project_finance_id
    // ─────────────────────────────────────────────────────────────────────────
    private function projectFromFinanceId(int $projectFinanceId): ?Project
    {
        $pf = ProjectFinance::with('project')->find($projectFinanceId);
        return $pf ? $pf->project : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Student Payment  (Rule A + Rule B)
    // ─────────────────────────────────────────────────────────────────────────
    public function recordStudentPayment(Request $request)
    {
        $validated = $request->validate([
            'project_student_id' => 'required|exists:project_student,id',
            'amount'             => 'required|numeric|min:0.01',
            'payment_date'       => 'required|date'
        ]);

        // Resolve project via project_student pivot
        $ps      = DB::table('project_student')->where('id', $validated['project_student_id'])->first();
        $project = $ps ? Project::find($ps->project_id) : null;
        if (!$project) {
            return response()->json(['message' => 'Project not found for this student assignment.'], 422);
        }

        // Rule A + Rule B
        $check = $this->financeService->validateProjectForFinancialWrite($project);
        if (!$check['valid']) {
            return response()->json(['message' => $check['message']], $check['http_status']);
        }

        // Get true designation from student_profiles
        $psRow = DB::table('project_student')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->leftJoin('student_profiles', 'users.id', '=', 'student_profiles.student_id')
            ->where('project_student.id', $validated['project_student_id'])
            ->select('student_profiles.designation')
            ->first();

        $designation = $psRow ? ($psRow->designation ?? 'None') : 'None';
        $rate        = $this->financeService->getApprovedHourlyRate($validated['project_student_id']);

        $hours = DB::table('student_work_logs')
            ->join('tasks', 'student_work_logs.task_id', '=', 'tasks.id')
            ->where('student_work_logs.project_student_id', $validated['project_student_id'])
            ->where('student_work_logs.approval_status', 'approved')
            ->where('tasks.status', 'completed')
            ->sum('student_work_logs.hours_worked');

        $payment = StudentPayment::create([
            'project_student_id' => $validated['project_student_id'],
            'designation'        => strtolower($designation),
            'amount'             => $validated['amount'],
            'payment_date'       => $validated['payment_date'],
            'approved_hours'     => $hours,
            'hourly_rate'        => $rate,
        ]);

        return response()->json(['message' => 'Payment recorded successfully', 'payment' => $payment]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Faculty Payment  (Rule A + Rule B)
    // ─────────────────────────────────────────────────────────────────────────
    public function recordFacultyPayment(Request $request)
    {
        $validated = $request->validate([
            'project_faculty_id' => 'required|exists:project_faculty,id',
            'amount'             => 'required|numeric|min:0.01',
            'payment_date'       => 'required|date',
            'status'             => 'nullable|string'
        ]);

        // Resolve project via project_faculty pivot
        $pf      = DB::table('project_faculty')->where('id', $validated['project_faculty_id'])->first();
        $project = $pf ? Project::find($pf->project_id) : null;
        if (!$project) {
            return response()->json(['message' => 'Project not found for this faculty assignment.'], 422);
        }

        // Rule A + Rule B
        $check = $this->financeService->validateProjectForFinancialWrite($project);
        if (!$check['valid']) {
            return response()->json(['message' => $check['message']], $check['http_status']);
        }

        $payment = FacultyPayment::create([
            'project_faculty_id' => $validated['project_faculty_id'],
            'amount'             => $validated['amount'],
            'payment_date'       => $validated['payment_date'],
            'status'             => $validated['status'] ?? 'Paid'
        ]);

        return response()->json(['message' => 'Faculty payment recorded successfully', 'payment' => $payment]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Client Payment  (Rule B only — status lock; budget N/A for receipts)
    // ─────────────────────────────────────────────────────────────────────────
    public function recordClientPayment(Request $request)
    {
        $validated = $request->validate([
            'invoice_id'        => 'required|exists:invoices,id',
            'amount'            => 'required|numeric|min:0.01',
            'payment_date'      => 'required|date',
            'payment_method'    => 'nullable|string',
            'payment_reference' => 'nullable|string',
            'remarks'           => 'nullable|string'
        ]);

        $invoice = Invoice::with(['clientPayments', 'projectFinance.project'])
            ->findOrFail($validated['invoice_id']);

        // Rule B – status lock via invoice → project_finance → project
        $project = $invoice->projectFinance->project ?? null;
        if ($project) {
            $lockedStatuses = ['closed', 'completed', 'cancelled'];
            if (in_array($project->status, $lockedStatuses)) {
                $label = ucfirst($project->status);
                return response()->json([
                    'message' => "Financial updates disabled: This project is {$label} and locked."
                ], 422);
            }
        }

        if ($validated['amount'] > $invoice->pending_amount) {
            return response()->json([
                'message' => 'Payment amount cannot exceed the remaining balance (' . $invoice->pending_amount . ')'
            ], 422);
        }

        $validated['recorded_by'] = $this->currentUserId($request);

        $payment = ClientPayment::create($validated);

        return response()->json(['message' => 'Client payment recorded successfully', 'payment' => $payment]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Hosting Charge  (Rule A + Rule B)
    // ─────────────────────────────────────────────────────────────────────────
    public function recordHostingCharge(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id' => 'required|exists:project_finances,id',
            'charge_type'        => 'required|string|in:ssl,domain,api,hosting',
            'provider'           => 'nullable|string',
            'amount'             => 'required|numeric|min:0',
            'purchase_date'      => 'nullable|date',
            'expiry_date'        => 'nullable|date',
            'reference_details'  => 'nullable|string'
        ]);

        $project = $this->projectFromFinanceId((int) $validated['project_finance_id']);
        if (!$project) {
            return response()->json(['message' => 'Project not found for this finance record.'], 422);
        }

        // Rule A + Rule B
        $check = $this->financeService->validateProjectForFinancialWrite($project);
        if (!$check['valid']) {
            return response()->json(['message' => $check['message']], $check['http_status']);
        }

        $charge = HostingCharge::create($validated);

        return response()->json(['message' => 'Resource payment recorded successfully', 'charge' => $charge]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Maintenance Charge  (Rule A + Rule B)
    // ─────────────────────────────────────────────────────────────────────────
    public function recordMaintenanceCharge(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id' => 'required|exists:project_finances,id',
            'amount'             => 'required|numeric|min:0',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date',
            'description'        => 'nullable|string'
        ]);

        $project = $this->projectFromFinanceId((int) $validated['project_finance_id']);
        if (!$project) {
            return response()->json(['message' => 'Project not found for this finance record.'], 422);
        }

        // Rule A + Rule B
        $check = $this->financeService->validateProjectForFinancialWrite($project);
        if (!$check['valid']) {
            return response()->json(['message' => $check['message']], $check['http_status']);
        }

        $charge = MaintenanceSupportCharge::create($validated);

        return response()->json(['message' => 'Maintenance record added successfully', 'charge' => $charge]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Billing limits — read-only, no validation needed
    // ─────────────────────────────────────────────────────────────────────────
    public function getProjectBillingLimits($id)
    {
        $pf = ProjectFinance::with(['project', 'hostingCharges', 'maintenanceSupportCharges'])
            ->where('id', $id)
            ->orWhere('project_id', $id)
            ->first();

        if (!$pf) {
            return response()->json(['error' => 'Project finance record not found'], 404);
        }

        $totalDevAmount     = (float) ($pf->total_development_amount ?? 0);
        $totalProjectBudget = (float) ($pf->project->budget ?? $totalDevAmount);

        $alreadyBilledDev = (float) DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.project_finance_id', $pf->id)
            ->where(function ($q) {
                $q->where('invoice_items.description', 'LIKE', '%development%')
                  ->orWhere('invoice_items.description', 'LIKE', '%dev%');
            })
            ->sum('invoice_items.amount');

        $remainingDevBillable = max(0, $totalDevAmount - $alreadyBilledDev);

        return response()->json([
            'total_development_amount' => $totalDevAmount,
            'remaining_dev_billable'   => $remainingDevBillable,
            'total_project_budget'     => $totalProjectBudget,
            'hosting_charges'          => $pf->hostingCharges,
            'maintenance_charges'      => $pf->maintenanceSupportCharges
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create Invoice  (Rule A + Rule B)
    // ─────────────────────────────────────────────────────────────────────────
    public function createInvoice(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id'  => 'required|exists:project_finances,id',
            'invoice_number'      => 'required|string|unique:invoices,invoice_number',
            'invoice_date'        => 'required|date',
            'due_date'            => 'nullable|date',
            'gst_percentage'      => 'nullable|numeric|min:0',
            'description'         => 'nullable|string',
            'items'               => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.rate'        => 'required|numeric|min:0',
            'items.*.quantity'    => 'required|integer|min:1',
        ]);

        $project = $this->projectFromFinanceId((int) $validated['project_finance_id']);
        if (!$project) {
            return response()->json(['message' => 'Project not found for this finance record.'], 422);
        }

        // Rule A + Rule B
        $check = $this->financeService->validateProjectForFinancialWrite($project);
        if (!$check['valid']) {
            return response()->json(['message' => $check['message']], $check['http_status']);
        }

        $userId = $this->currentUserId($request);

        $invoice = DB::transaction(function () use ($validated, $userId) {
            $totalAmountBeforeGst = 0;
            $itemsData            = [];

            foreach ($validated['items'] as $item) {
                $rate   = (float) $item['rate'];
                $qty    = (int)   $item['quantity'];
                $amount = round($rate * $qty, 2);
                $totalAmountBeforeGst += $amount;

                $itemsData[] = [
                    'description' => $item['description'],
                    'rate'        => $rate,
                    'quantity'    => $qty,
                    'amount'      => $amount,
                ];
            }

            $inv = Invoice::create([
                'project_finance_id' => $validated['project_finance_id'],
                'invoice_number'     => $validated['invoice_number'],
                'invoice_date'       => $validated['invoice_date'],
                'due_date'           => $validated['due_date'] ?? null,
                'amount_before_gst'  => round($totalAmountBeforeGst, 2),
                'gst_percentage'     => $validated['gst_percentage'] ?? 18.00,
                'description'        => $validated['description'] ?? null,
                'created_by'         => $userId,
            ]);

            foreach ($itemsData as $itemData) {
                $inv->items()->create($itemData);
            }

            return $inv;
        });

        $invoice->load(['items', 'projectFinance.project', 'clientPayments']);

        return response()->json(['message' => 'Invoice created successfully', 'invoice' => $invoice]);
    }
}