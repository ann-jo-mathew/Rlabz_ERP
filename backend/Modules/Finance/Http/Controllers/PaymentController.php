<?php

namespace Modules\Finance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Finance\Models\StudentPayment;
use Modules\Finance\Models\FacultyPayment;
use Modules\Finance\Models\ClientPayment;
use DB;

class PaymentController extends Controller
{
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
            
        $designation = $ps ? ($ps->designation ?? 'spark') : 'spark';
        
        $rate = match(strtolower($designation)) {
            'nova' => 250,
            'orbit' => 200,
            'spark' => 150,
            default => 150,
        };

        $hours = DB::table('student_work_logs')
            ->where('project_student_id', $validated['project_student_id'])
            ->where('approval_status', 'approved')
            ->sum('hours_worked');

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

        $validated['recorded_by'] = auth()->id() ?? 1;

        $payment = ClientPayment::create($validated);

        return response()->json(['message' => 'Client payment recorded successfully', 'payment' => $payment]);
    }
}
