<?php

namespace Modules\Finance\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Finance\Services\FinanceService;

class FinanceController extends Controller
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

    public function getDashboard()
    {
        $summary = $this->financeService->getDashboardSummary();
        return response()->json($summary);
    }

    public function getProjects()
    {
        $projects = $this->financeService->getAllProjects();
        return response()->json($projects);
    }

    public function getProjectDetails($id)
    {
        $project = $this->financeService->getProjectFinanceDetails($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        return response()->json($project);
    }

    public function getStudentPayments(Request $request)
    {
        $projectId = $request->query('project_id') ? (int) $request->query('project_id') : null;
        $payments = $this->financeService->getAllStudentPayments($projectId);
        return response()->json($payments);
    }

    public function getFacultyPayments()
    {
        $payments = $this->financeService->getAllFacultyPayments();
        return response()->json($payments);
    }

    public function getInvoices()
    {
        $invoices = $this->financeService->getAllInvoices();
        return response()->json($invoices);
    }

    public function getTransactions()
    {
        $transactions = $this->financeService->getAllTransactions();
        return response()->json($transactions);
    }

    public function updateAllocations(Request $request, $id)
    {
        $validated = $request->validate([
            'student_allocation' => 'required|numeric|min:0',
            'faculty_allocation' => 'required|numeric|min:0',
            'rlabz_allocation' => 'required|numeric|min:0'
        ]);

        $projectFinance = \Modules\Finance\Models\ProjectFinance::where('project_id', $id)->firstOrFail();
        
        // Remove existing allocations
        \DB::table('development_allocations')->where('project_finance_id', $projectFinance->id)->delete();
        
        // Insert new allocations
        \DB::table('development_allocations')->insert([
            ['project_finance_id' => $projectFinance->id, 'category' => 'student', 'amount' => $validated['student_allocation'], 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $projectFinance->id, 'category' => 'faculty', 'amount' => $validated['faculty_allocation'], 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $projectFinance->id, 'category' => 'rlabz', 'amount' => $validated['rlabz_allocation'], 'created_at' => now(), 'updated_at' => now()],
        ]);

        return response()->json(['message' => 'Allocations updated successfully']);
    }

    public function recordClientPayment(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
            'remarks' => 'nullable|string'
        ]);
        
        $validated['recorded_by'] = $this->currentUserId($request);

        $payment = \Modules\Finance\Models\ClientPayment::create($validated);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'data' => $payment
        ]);
    }

    public function recordStudentPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'designation' => 'nullable|string',
            'approved_hours' => 'nullable|numeric',
            'hourly_rate' => 'nullable|numeric'
        ]);
        
        $validated['project_student_id'] = $id;

        $payment = \Modules\Finance\Models\StudentPayment::create($validated);

        return response()->json([
            'message' => 'Student payment processed successfully',
            'data' => $payment,
            'id' => $id
        ]);
    }

    public function recordFacultyPayment(Request $request)
    {
        $validated = $request->validate([
            'project_faculty_id' => 'required|exists:project_faculty,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'status' => 'nullable|string'
        ]);

        $payment = \Modules\Finance\Models\FacultyPayment::create($validated);

        return response()->json([
            'message' => 'Faculty payment processed successfully',
            'data' => $payment
        ]);
    }
    public function getStudentHourlyRateHistory()
    {
        $history = \DB::table('student_hourly_rate_history')
            ->join('users', 'student_hourly_rate_history.updated_by', '=', 'users.id')
            ->select('student_hourly_rate_history.*', 'users.name as updated_by_name')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($history);
    }

    public function updateStudentHourlyRate(Request $request)
    {
        $validated = $request->validate([
            'new_rate' => 'required|numeric|min:0'
        ]);

        $setting = \DB::table('finance_settings')->first();
        $oldRate = $setting ? $setting->student_hourly_rate : 0;

        \DB::table('student_hourly_rate_history')->insert([
            'old_rate' => $oldRate,
            'new_rate' => $validated['new_rate'],
            'updated_by' => $this->currentUserId($request),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        if ($setting) {
            \DB::table('finance_settings')->update(['student_hourly_rate' => $validated['new_rate'], 'updated_at' => now()]);
        } else {
            \DB::table('finance_settings')->insert(['student_hourly_rate' => $validated['new_rate'], 'created_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['message' => 'Rate updated successfully', 'new_rate' => $validated['new_rate']]);
    }

    public function renewSsl(Request $request, $hostingChargeId)
    {
        $validated = $request->validate([
            'renewal_date' => 'required|date',
            'new_expiry_date' => 'required|date',
            'renewal_amount' => 'required|numeric|min:0',
            'payment_reference' => 'nullable|string',
            'remarks' => 'nullable|string'
        ]);

        $hostingCharge = \Modules\Finance\Models\HostingCharge::findOrFail($hostingChargeId);

        \DB::table('ssl_renewal_history')->insert([
            'hosting_charge_id' => $hostingCharge->id,
            'renewal_date' => $validated['renewal_date'],
            'previous_expiry_date' => $hostingCharge->expiry_date,
            'new_expiry_date' => $validated['new_expiry_date'],
            'renewal_amount' => $validated['renewal_amount'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'renewed_by' => $this->currentUserId($request),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $hostingCharge->expiry_date = $validated['new_expiry_date'];
        $hostingCharge->save();

        return response()->json(['message' => 'SSL renewed successfully', 'data' => $hostingCharge]);
    }

    public function getSslRenewalHistory()
    {
        $history = \DB::table('ssl_renewal_history')
            ->join('hosting_charges', 'ssl_renewal_history.hosting_charge_id', '=', 'hosting_charges.id')
            ->join('project_finances', 'hosting_charges.project_finance_id', '=', 'project_finances.id')
            ->join('projects', 'project_finances.project_id', '=', 'projects.id')
            ->leftJoin('users', 'ssl_renewal_history.renewed_by', '=', 'users.id')
            ->select(
                'ssl_renewal_history.*',
                'projects.title as project_name',
                'hosting_charges.reference_details as hosting_details',
                'users.name as renewed_by_name'
            )
            ->orderBy('ssl_renewal_history.renewal_date', 'desc')
            ->get();
        return response()->json($history);
    }

    public function getStudentHourlyRate()
    {
        $setting = \DB::table('finance_settings')->first();
        $rate = $setting ? (float) $setting->student_hourly_rate : 0;
        return response()->json(['student_hourly_rate' => $rate]);
    }
}
