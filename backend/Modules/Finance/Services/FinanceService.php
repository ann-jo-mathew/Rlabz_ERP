<?php

namespace Modules\Finance\Services;

use Modules\Finance\Models\ProjectFinance;
use Modules\Finance\Models\Invoice;
use Modules\Finance\Models\StudentPayment;
use Modules\Finance\Models\HostingCharge;
use Modules\Project\Models\Project;
use Modules\Project\Models\Task;
use Carbon\Carbon;
use DB;

class FinanceService
{
    public function getDashboardSummary()
    {
        $totalInvoiced = Invoice::all()->sum('grand_total');
        $totalCollected = Invoice::get()->sum('total_paid'); // using accessor sum

        $hostingCharges = HostingCharge::sum('amount');
        $studentPayments = StudentPayment::sum('amount');
        $facultyPayments = \Modules\Finance\Models\FacultyPayment::sum('amount');
        $totalExpenses = $hostingCharges + $studentPayments + $facultyPayments;

        // Total Profit = Total Revenue/Billing - Total Costs, using the same figures
        // already computed above (totalBilling / totalExpenses) — not a separate metric.
        $totalProfit = $totalInvoiced - $totalExpenses;

        return [
            'totalBilling' => round($totalInvoiced, 2),
            'totalCollected' => round($totalCollected, 2),
            'outstanding' => max(0, round($totalInvoiced - $totalCollected, 2)),
            'totalPayroll' => round($studentPayments, 2),
            'totalFaculty' => round($facultyPayments, 2),
            'totalOtherExpenses' => round($hostingCharges, 2),
            'totalExpenses' => round($totalExpenses, 2),
            'totalProfit' => round($totalProfit, 2),
            'sslExpiring' => $this->getSslExpiryWarnings(),
        ];
    }

    /**
     * SSL certificates (hosting_charges.charge_type = 'ssl') that are expiring within the
     * next 30 days or have already expired. Reuses the existing hosting_charges data —
     * no separate SSL certificate table/model.
     */
    public function getSslExpiryWarnings()
    {
        return HostingCharge::with('projectFinance.project')
            ->where('charge_type', 'ssl')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->orderBy('expiry_date')
            ->get()
            ->map(function ($charge) {
                $expiry = Carbon::parse($charge->expiry_date)->startOfDay();
                $project = $charge->projectFinance->project ?? null;
                // Compare whole days (not time-of-day) so a cert expiring "today" reads as
                // 0 days remaining rather than already expired.
                $daysUntilExpiry = Carbon::now()->startOfDay()->diffInDays($expiry, false);

                return [
                    'hosting_charge_id' => $charge->id,
                    'project_id' => $project->id ?? null,
                    'project_title' => $project->title ?? 'Unknown project',
                    'expiry_date' => $expiry->toDateString(),
                    'days_until_expiry' => $daysUntilExpiry,
                    'expired' => $daysUntilExpiry < 0,
                ];
            })
            ->values();
    }

    public function getAllStudentPayments()
    {
        $students = DB::table('project_student')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->join('projects', 'project_student.project_id', '=', 'projects.id')
            ->leftJoin('student_profiles', 'users.id', '=', 'student_profiles.student_id')
            ->select('users.name as student_name', 'student_profiles.designation as designation', 'projects.title as project_name', 'projects.id as project_id', 'project_student.id as project_student_id', 'users.id as user_id')
            ->get();
            
        foreach ($students as $student) {
            $hours = DB::table('student_work_logs')
                ->where('project_student_id', $student->project_student_id)
                ->where('approval_status', 'approved')
                ->sum('hours_worked');
            
            $designation = $student->designation ?? 'Spark';
            $rate = match(strtolower($designation)) {
                'nova' => 250,
                'orbit' => 200,
                'spark' => 150,
                default => 150,
            };
            
            $student->designation = ucfirst($designation);
            $student->approved_hours = $hours;
            $student->hourly_rate = $rate;
            $student->gross_amount = $hours * $rate;
            $student->amount_paid = DB::table('student_payments')->where('project_student_id', $student->project_student_id)->sum('amount');
            $student->remaining_payable = max(0, $student->gross_amount - $student->amount_paid);
            
            if ($student->gross_amount == 0) $student->status = 'Pending';
            elseif ($student->remaining_payable == 0) $student->status = 'Paid';
            else $student->status = 'Partially Paid';
        }
        
        return $students;
    }

    public function getAllFacultyPayments()
    {
        $faculties = DB::table('project_faculty')
            ->join('users', 'project_faculty.faculty_id', '=', 'users.id')
            ->join('projects', 'project_faculty.project_id', '=', 'projects.id')
            ->select('users.name as faculty_name', 'projects.title as project_name', 'projects.id as project_id', 'project_faculty.id as project_faculty_id')
            ->get();
            
        foreach ($faculties as $faculty) {
            $faculty->amount = DB::table('faculty_payments')->where('project_faculty_id', $faculty->project_faculty_id)->sum('amount');
            $faculty->payment_date = DB::table('faculty_payments')->where('project_faculty_id', $faculty->project_faculty_id)->max('payment_date');
            $faculty->status = $faculty->amount > 0 ? 'Paid' : 'Pending';
        }
        
        return $faculties;
    }

    public function getAllInvoices()
    {
        return Invoice::with(['projectFinance.project', 'clientPayments'])->get();
    }

    public function getAllTransactions()
    {
        $clientPayments = \Modules\Finance\Models\ClientPayment::with('invoice.projectFinance.project')->get();
        $studentPayments = StudentPayment::join('project_student', 'student_payments.project_student_id', '=', 'project_student.id')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->join('projects', 'project_student.project_id', '=', 'projects.id')
            ->select('student_payments.*', 'users.name as student_name', 'projects.title as project_name', 'projects.id as project_id')
            ->get();
        
        $facultyPayments = \Modules\Finance\Models\FacultyPayment::join('project_faculty', 'faculty_payments.project_faculty_id', '=', 'project_faculty.id')
            ->join('users', 'project_faculty.faculty_id', '=', 'users.id')
            ->join('projects', 'project_faculty.project_id', '=', 'projects.id')
            ->select('faculty_payments.*', 'users.name as faculty_name', 'projects.title as project_name', 'projects.id as project_id')
            ->get();

        $transactions = [];
        
        foreach ($clientPayments as $cp) {
            $transactions[] = [
                'id' => $cp->id,
                'date' => $cp->payment_date,
                'projectId' => $cp->invoice->projectFinance->project->id ?? null,
                'projectName' => $cp->invoice->projectFinance->project->title ?? 'Unknown',
                'type' => 'Client Payment',
                'desc' => 'Payment against ' . ($cp->invoice->invoice_number ?? 'Invoice'),
                'amount' => $cp->amount,
                'incomeExpense' => 'Income',
                'status' => 'Completed'
            ];
        }

        foreach ($studentPayments as $sp) {
            $transactions[] = [
                'id' => 'SP-'.$sp->id,
                'date' => $sp->payment_date,
                'projectId' => $sp->project_id,
                'projectName' => $sp->project_name,
                'type' => 'Student Payroll',
                'desc' => 'Payroll: ' . $sp->student_name,
                'amount' => $sp->amount,
                'incomeExpense' => 'Expense',
                'status' => 'Completed'
            ];
        }

        foreach ($facultyPayments as $fp) {
            $transactions[] = [
                'id' => 'FP-'.$fp->id,
                'date' => $fp->payment_date,
                'projectId' => $fp->project_id,
                'projectName' => $fp->project_name,
                'type' => 'Faculty/Resource',
                'desc' => 'Payment: ' . $fp->faculty_name,
                'amount' => $fp->amount,
                'incomeExpense' => 'Expense',
                'status' => 'Completed'
            ];
        }

        usort($transactions, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return $transactions;
    }

    public function getAllProjects()
    {
        $projects = Project::all();
        $finances = ProjectFinance::with(['developmentAllocations', 'invoices'])->get()->keyBy('project_id');
        
        $projects->each(function($project) use ($finances) {
            $pf = $finances->get($project->id);
            if ($pf) {
                $pf->append(['total_invoiced', 'total_collected', 'pending_amount']);
            }
            $project->project_finance = $pf;
        });
        
        return $projects;
    }

    public function getProjectFinanceDetails($id)
    {
        $projectFinance = ProjectFinance::with(['project', 'invoices.clientPayments', 'developmentAllocations', 'hostingCharges', 'maintenanceSupportCharges'])->where('project_id', $id)->first();
        if (!$projectFinance) {
            return null;
        }

        $projectFinance->append(['total_invoiced', 'total_collected', 'pending_amount']);

        // Fetch students via pivot, since we can't edit Project model
        $students = DB::table('project_student')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->leftJoin('student_profiles', 'users.id', '=', 'student_profiles.student_id')
            ->where('project_student.project_id', $id)
            ->select('users.name as resource_name', 'student_profiles.designation as designation', 'project_student.id as project_student_id')
            ->get();
            
        foreach ($students as $student) {
            $student->type = 'Student';
            // Calc amount from work logs
            $hours = DB::table('student_work_logs')
                ->where('project_student_id', $student->project_student_id)
                ->where('approval_status', 'approved')
                ->sum('hours_worked');
            
            $rate = match(strtolower($student->designation)) {
                'nova' => 250,
                'orbit' => 200,
                'spark' => 150,
                default => 150,
            };
            $student->amount = $hours * $rate;
            
            // Get paid
            $paid = DB::table('student_payments')->where('project_student_id', $student->project_student_id)->sum('amount');
            $student->status = $paid >= $student->amount && $student->amount > 0 ? 'Paid' : ($student->amount > 0 ? 'Pending' : 'No Work');
        }

        // Fetch faculty via pivot
        $faculties = DB::table('project_faculty')
            ->join('users', 'project_faculty.faculty_id', '=', 'users.id')
            ->where('project_faculty.project_id', $id)
            ->select('users.name as resource_name', 'project_faculty.id as project_faculty_id')
            ->get();
            
        foreach ($faculties as $faculty) {
            $faculty->designation = 'Faculty Guide';
            $faculty->type = 'Faculty';
            $paid = DB::table('faculty_payments')->where('project_faculty_id', $faculty->project_faculty_id)->sum('amount');
            $faculty->amount = $paid;
            $faculty->status = $paid > 0 ? 'Paid' : 'Pending';
        }

        $projectFinance->assigned_resources = $students->merge($faculties);

        return $projectFinance;
    }

    public function checkSslExpiries()
    {
        // Find SSLs expiring in the next 30 days
        $upcomingExpiries = HostingCharge::where('charge_type', 'ssl')
            ->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [Carbon::now(), Carbon::now()->addDays(30)])
            ->get();

        // Here we could dispatch notifications or events
        return $upcomingExpiries;
    }

    public function calculateProjectProgress($projectId)
    {
        $totalTasks = Task::where('project_id', $projectId)->count();
        if ($totalTasks === 0) return 0;

        $completedTasks = Task::where('project_id', $projectId)->where('status', 'completed')->count();
        return round(($completedTasks / $totalTasks) * 100, 2);
    }
}
