<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ProjectFaculty extends Pivot
{
    protected $table = 'project_faculty';

    protected $fillable = [
        'project_id',
        'faculty_id',
        'assigned_date',
    ];

    protected $casts = [
        'assigned_date' => 'date',
    ];
}
