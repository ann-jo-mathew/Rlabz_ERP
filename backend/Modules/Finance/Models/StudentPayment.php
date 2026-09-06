<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Project\Models\ProjectStudent;

class StudentPayment extends Model
{
    protected $fillable = [
        'project_student_id',
        'designation',
        'approved_hours',
        'hourly_rate',
        'amount',
        'payment_date',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function projectStudent()
    {
        return $this->belongsTo(\Modules\Coordinator\Models\ProjectStudent::class, 'project_student_id', 'id');
    }
}
