<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ClientPayment extends Model
{
    protected $fillable = [
        'invoice_id',
        'amount',
        'payment_date',
        'payment_method',
        'payment_reference',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
