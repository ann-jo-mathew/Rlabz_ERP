<?php

namespace Modules\Student\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Coordinator\Models\ProjectStudent;
use Modules\Project\Models\Task;

class StudentWorkLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_student_id',
        'task_id',
        'work_date',
        'hours_worked',
        'description',
        'approval_status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'work_date' => 'date',
        'hours_worked' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function projectStudent()
    {
        return $this->belongsTo(ProjectStudent::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
