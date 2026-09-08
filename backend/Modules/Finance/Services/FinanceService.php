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
    public function getApprovedHourlyRate($projectStudentId = null)
    {
        $setting = DB::table('finance_settings')->first();
        return $setting ? (float) $setting->student_hourly_rate : 0;
    }

    public function getDashboardSummary()
    {
        $totalInvoiced = Invoice::all()->sum('grand_total');
        $totalCollected = Invoice::get()->sum('total_paid'); // using accessor sum

        $hostingCharges = HostingCharge::sum('amount');
        $sslRenewals = DB::table('ssl_renewal_history')->sum('renewal_amount');
        $maintenanceCharges = \Modules\Finance\Models\MaintenanceSupportCharge::sum('amount');
        $studentPayments = StudentPayment::sum('amount');
        $facultyPayments = \Modules\Finance\Models\FacultyPayment::sum('amount');

        $totalOtherExpenses = $hostingCharges + $sslRenewals + $maintenanceCharges;
        $totalExpenses = $studentPayments + $facultyPayments + $totalOtherExpenses;

        return [
            'totalBilling' => round($totalInvoiced, 2),
            'totalCollected' => round($totalCollected, 2),
            'pendingFromClient' => max(0, round($totalInvoiced - $totalCollected, 2)),
            'totalPayroll' => round($studentPayments, 2),
            'totalFaculty' => round($facultyPayments, 2),
            // totalOtherExpenses = hosting + ssl renewals only (NOT maintenance, which is separate)
            'totalOtherExpenses' => round($hostingCharges + $sslRenewals, 2),
            'totalMaintenance' => round($maintenanceCharges, 2),
            'totalExpenses' => round($totalExpenses, 2),
            'projectProfit' => round($totalCollected - $totalExpenses, 2)
        ];
    }

    public function getAllStudentPayments($projectId = null)
    {
        $query = DB::table('project_student')
            ->join('users', 'project_student.student_id', '=', 'users.id')
            ->join('projects', 'project_student.project_id', '=', 'projects.id')
            ->leftJoin('student_profiles', 'users.id', '=', 'student_profiles.student_id')
            ->select('users.name as student_name', 'student_profiles.designation as designation', 'projects.title as project_name', 'projects.id as project_id', 'project_student.id as project_student_id', 'users.id as user_id');

        if ($projectId) {
            $query->where('project_student.project_id', $projectId);
        }

        $students = $query->get();
            
        foreach ($students as $student) {
            $hours = DB::table('student_work_logs')
                ->join('tasks', 'student_work_logs.task_id', '=', 'tasks.id')
                ->where('student_work_logs.project_student_id', $student->project_student_id)
                ->where('student_work_logs.approval_status', 'approved')
                ->where('tasks.status', 'completed')
                ->sum('student_work_logs.hours_worked');

            $completedTasks = DB::table('student_work_logs')
                ->join('tasks', 'student_work_logs.task_id', '=', 'tasks.id')
                ->where('student_work_logs.project_student_id', $student->project_student_id)
                ->where('student_work_logs.approval_status', 'approved')
                ->where('tasks.status', 'completed')
                ->distinct('tasks.id')
                ->count('tasks.id');
            
            $rate = $this->getApprovedHourlyRate($student->project_student_id);
            
            $student->designation = ucfirst($student->designation ?? 'None');
            $student->completed_tasks = $completedTasks;
            $student->approved_hours = $hours;
            $student->hourly_rate = $rate;
            $student->gross_amount = $hours * $rate;
            $student->amount_paid = DB::table('student_payments')->where('project_student_id', $student->project_student_id)->sum('amount');
            $student->remaining_payable = max(0, $student->gross_amount - $student->amount_paid);
            
            if ($student->gross_amount == 0 || $student->amount_paid == 0) {
                $student->status = 'Pending';
            } elseif ($student->remaining_payable == 0) {
                $student->status = 'Paid';
            } else {
                $student->status = 'Partially Paid';
            }
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
        // Only return projects that are accepted, in_progress, or closed
        $projects = Project::whereIn('status', ['accepted', 'in_progress', 'closed'])->get();
        $finances = ProjectFinance::with(['developmentAllocations', 'invoices'])->get()->keyBy('project_id');
        
        $projects->each(function($project) use ($finances) {
            $pf = $finances->get($project->id);
            if ($pf) {
                $pf->append(['total_invoiced', 'total_collected', 'pending_amount', 'total_expenses']);
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

        $projectFinance->append(['total_invoiced', 'total_collected', 'pending_amount', 'total_expenses']);

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
                ->join('tasks', 'student_work_logs.task_id', '=', 'tasks.id')
                ->where('student_work_logs.project_student_id', $student->project_student_id)
                ->where('student_work_logs.approval_status', 'approved')
                ->where('tasks.status', 'completed')
                ->sum('student_work_logs.hours_worked');
            
            $rate = $this->getApprovedHourlyRate($student->project_student_id);
            $student->amount = $hours * $rate;
            
            // Get paid
            $paid = DB::table('student_payments')->where('project_student_id', $student->project_student_id)->sum('amount');

            if ($student->amount == 0) {
                $student->status = 'No Work';
            } elseif ($paid >= $student->amount) {
                $student->status = 'Paid';
            } elseif ($paid > 0) {
                $student->status = 'Partially Paid';
            } else {
                $student->status = 'Pending';
            }
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
