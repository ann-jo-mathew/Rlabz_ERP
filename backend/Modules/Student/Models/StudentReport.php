<?php

namespace Modules\Student\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class StudentReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'project_id',
        'report_type',
        'report_date',
        'work_done',
        'report_file',
        'approval_status',
        'feedback',
        'submitted_at',
    ];

    protected $casts = [
        'report_date' => 'date',
        'submitted_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function project()
    {
        return $this->belongsTo(\Modules\Project\Models\Project::class, 'project_id');
    }
}