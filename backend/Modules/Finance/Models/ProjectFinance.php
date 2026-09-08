<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Project\Models\Project;

class ProjectFinance extends Model
{
    protected $fillable = [
        'project_id',
        'total_development_amount',
        'gst_percentage',
        'created_by',
        'approved_by',
        'approved_at',
        'status',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function developmentAllocations()
    {
        return $this->hasMany(DevelopmentAllocation::class);
    }

    public function hostingCharges()
    {
        return $this->hasMany(HostingCharge::class);
    }

    public function maintenanceSupportCharges()
    {
        return $this->hasMany(MaintenanceSupportCharge::class);
    }

    public function getTotalInvoicedAttribute()
    {
        return $this->invoices->sum('grand_total');
    }

    public function getTotalCollectedAttribute()
    {
        return $this->invoices->sum('total_paid');
    }

    public function getPendingAmountAttribute()
    {
        return max(0, $this->total_invoiced - $this->total_collected);
    }

    public function getTotalExpensesAttribute()
    {
        $hosting = $this->hostingCharges->sum('amount');
        $maintenance = $this->maintenanceSupportCharges->sum('amount');
        
        $student = \DB::table('student_payments')
            ->join('project_student', 'student_payments.project_student_id', '=', 'project_student.id')
            ->where('project_student.project_id', $this->project_id)
            ->sum('student_payments.amount');

        $faculty = \DB::table('faculty_payments')
            ->join('project_faculty', 'faculty_payments.project_faculty_id', '=', 'project_faculty.id')
            ->where('project_faculty.project_id', $this->project_id)
            ->sum('faculty_payments.amount');

        return $hosting + $maintenance + $student + $faculty;
    }
}
