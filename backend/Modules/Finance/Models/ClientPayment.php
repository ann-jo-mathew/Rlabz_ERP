<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class ClientPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_finance_id',
        'amount',
        'payment_date',
        'payment_method',
        'payment_type',
        'payment_reference',
        'status',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
