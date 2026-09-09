<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'project_finance_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'amount_before_gst',
        'gst_percentage',
        'description',
        'created_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
    ];

    protected $appends = [
        'gst_amount',
        'grand_total',
        'total_paid',
        'pending_amount',
        'status'
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }

    public function clientPayments()
    {
        return $this->hasMany(ClientPayment::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function getGstAmountAttribute()
    {
        return round($this->amount_before_gst * ($this->gst_percentage / 100), 2);
    }

    public function getGrandTotalAttribute()
    {
        return $this->amount_before_gst + $this->gst_amount;
    }

    public function getTotalPaidAttribute()
    {
        return $this->clientPayments->sum('amount');
    }

    public function getPendingAmountAttribute()
    {
        return max(0, $this->grand_total - $this->total_paid);
    }

    public function getStatusAttribute()
    {
        $paid = $this->total_paid;
        $total = $this->grand_total;

        if ($paid >= $total) {
            return 'Paid';
        }

        if ($paid > 0) {
            return 'Partially Paid';
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return 'Overdue';
        }

        return 'Pending';
    }
}
