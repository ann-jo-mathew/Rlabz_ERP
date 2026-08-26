<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MaintenanceSupportCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_finance_id',
        'amount',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }
}
