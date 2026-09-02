<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Project\Models\ProjectFaculty;

class FacultyPayment extends Model
{
    protected $fillable = [
        'project_faculty_id',
        'amount',
        'payment_date',
        'status',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function projectFaculty()
    {
        return $this->belongsTo(ProjectFaculty::class);
    }
}
