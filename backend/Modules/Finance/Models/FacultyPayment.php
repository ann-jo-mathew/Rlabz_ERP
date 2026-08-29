<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ProjectFaculty;

class FacultyPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_faculty_id',
        'project_finance_id',
        'faculty_id',
        'amount',
        'status',
        'payment_date',
        'payment_method',
        'payment_reference',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function projectFaculty()
    {
        return $this->belongsTo(ProjectFaculty::class);
    }

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }

    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }
}
