<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class HostingCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_finance_id',
        'charge_type',
        'amount',
        'name_or_reference',
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
