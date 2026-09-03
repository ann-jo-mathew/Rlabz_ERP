<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceSupportCharge extends Model
{
    protected $fillable = [
        'project_finance_id',
        'amount',
        'start_date',
        'end_date',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }
}
