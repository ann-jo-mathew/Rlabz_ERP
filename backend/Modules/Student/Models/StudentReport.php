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
        'task_id',
        'report_type',
        'report_date',
        'week_start',
        'week_end',
        'weekly_key',
        'work_done',
        'report_file',
        'approval_status',
        'feedback',
        'submitted_at',
    ];

    protected $casts = [
        'report_date' => 'date',
        'week_start' => 'date',
        'week_end' => 'date',
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

    public function task()
    {
        return $this->belongsTo(\Modules\Project\Models\Task::class, 'task_id');
    }
}