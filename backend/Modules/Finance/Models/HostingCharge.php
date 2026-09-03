<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;

class HostingCharge extends Model
{
    protected $fillable = [
        'project_finance_id',
        'charge_type',
        'amount',
        'purchase_date',
        'expiry_date',
        'reference_details',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }
}
