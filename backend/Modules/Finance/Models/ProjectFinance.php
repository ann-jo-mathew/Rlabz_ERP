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
}
