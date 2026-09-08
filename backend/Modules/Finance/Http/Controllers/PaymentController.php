<?php

namespace Modules\Finance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Finance\Models\StudentPayment;
use Modules\Finance\Models\FacultyPayment;
use Modules\Finance\Models\ClientPayment;
use Modules\Finance\Services\FinanceService;
use DB;

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

    public function recordStudentPayment(Request $request)
    {
        $validated = $request->validate([
            'project_student_id' => 'required|exists:project_student,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date'
        ]);

        // Get true designation from student_profiles
        $ps = DB::table('project_student')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->leftJoin('student_profiles', 'users.id', '=', 'student_profiles.student_id')
            ->where('project_student.id', $validated['project_student_id'])
            ->select('student_profiles.designation')
            ->first();
            
        $designation = $ps ? ($ps->designation ?? 'None') : 'None';
        
        $rate = $this->financeService->getApprovedHourlyRate($validated['project_student_id']);

        $hours = DB::table('student_work_logs')
            ->join('tasks', 'student_work_logs.task_id', '=', 'tasks.id')
            ->where('student_work_logs.project_student_id', $validated['project_student_id'])
            ->where('student_work_logs.approval_status', 'approved')
            ->where('tasks.status', 'completed')
            ->sum('student_work_logs.hours_worked');

        $payment = StudentPayment::create([
            'project_student_id' => $validated['project_student_id'],
            'designation' => strtolower($designation),
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'approved_hours' => $hours,
            'hourly_rate' => $rate, 
        ]);

        return response()->json(['message' => 'Payment recorded successfully', 'payment' => $payment]);
    }

    public function recordFacultyPayment(Request $request)
    {
        $validated = $request->validate([
            'project_faculty_id' => 'required|exists:project_faculty,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'status' => 'nullable|string'
        ]);

        $payment = FacultyPayment::create([
            'project_faculty_id' => $validated['project_faculty_id'],
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'status' => $validated['status'] ?? 'Paid'
        ]);

        return response()->json(['message' => 'Faculty payment recorded successfully', 'payment' => $payment]);
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

        $invoice = \Modules\Finance\Models\Invoice::with('clientPayments')->findOrFail($validated['invoice_id']);
        if ($validated['amount'] > $invoice->pending_amount) {
            return response()->json([
                'message' => 'Payment amount cannot exceed the remaining balance (' . $invoice->pending_amount . ')'
            ], 422);
        }

        $validated['recorded_by'] = $this->currentUserId($request);

        $payment = ClientPayment::create($validated);

        return response()->json(['message' => 'Client payment recorded successfully', 'payment' => $payment]);
    }

    public function recordHostingCharge(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id' => 'required|exists:project_finances,id',
            'charge_type' => 'required|string|in:ssl,domain,api,hosting',
            'provider' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'purchase_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'reference_details' => 'nullable|string'
        ]);

        $charge = \Modules\Finance\Models\HostingCharge::create($validated);

        return response()->json(['message' => 'Resource payment recorded successfully', 'charge' => $charge]);
    }
    public function recordMaintenanceCharge(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id' => 'required|exists:project_finances,id',
            'amount' => 'required|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string'
        ]);

        $charge = \Modules\Finance\Models\MaintenanceSupportCharge::create($validated);

        return response()->json(['message' => 'Maintenance record added successfully', 'charge' => $charge]);
    }

    public function createInvoice(Request $request)
    {
        $validated = $request->validate([
            'project_finance_id' => 'required|exists:project_finances,id',
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'amount_before_gst' => 'required|numeric|min:0',
            'gst_percentage' => 'nullable|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        $validated['created_by'] = $this->currentUserId($request);
        $validated['gst_percentage'] = $validated['gst_percentage'] ?? 18.00;

        $invoice = \Modules\Finance\Models\Invoice::create($validated);

        return response()->json(['message' => 'Invoice created successfully', 'invoice' => $invoice]);
    }
}
