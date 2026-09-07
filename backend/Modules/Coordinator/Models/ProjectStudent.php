<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Modules\Auth\Models\User;
use Modules\Project\Models\Project;

class ProjectStudent extends Pivot
{
    protected $table = 'project_student';

    protected $fillable = [
        'project_id',
        'student_id',
        'role',
        'assigned_date',
    ];

    protected $casts = [
        'assigned_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
