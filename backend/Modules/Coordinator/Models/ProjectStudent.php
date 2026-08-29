<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

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
}
