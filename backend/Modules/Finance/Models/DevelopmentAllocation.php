<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class DevelopmentAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_finance_id',
        'recipient_type',
        'recipient_id',
        'amount',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
