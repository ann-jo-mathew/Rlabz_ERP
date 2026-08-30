<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ProjectStudent;
use Modules\ProjectClient\Models\Task;

class StudentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_student_id',
        'task_id',
        'project_finance_id',
        'designation',
        'approved_hours',
        'hourly_rate',
        'amount',
        'payment_period_start',
        'payment_period_end',
        'status',
        'payment_date',
        'payment_method',
        'payment_reference',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'approved_hours' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'payment_period_start' => 'date',
        'payment_period_end' => 'date',
        'payment_date' => 'date',
    ];

    public function projectStudent()
    {
        return $this->belongsTo(ProjectStudent::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
