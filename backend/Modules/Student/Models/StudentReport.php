<?php

namespace Modules\Student\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\ProjectClient\Models\Project;
use Modules\ProjectClient\Models\Task;

class StudentReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'student_id',
        'task_id',
        'report_type',
        'report_date',
        'work_done',
        'challenges',
        'next_plan',
        'submitted_at',
    ];

    protected $casts = [
        'report_date' => 'date',
        'submitted_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
