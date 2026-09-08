<?php

namespace Modules\Finance\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Finance\Services\FinanceService;

class FinanceController extends Controller
{
    protected $financeService;

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

    public function getStudentPayments()
    {
        $payments = $this->financeService->getAllStudentPayments();
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
        
        $validated['recorded_by'] = auth()->id() ?? 1;

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
}
