<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ModuleStudent extends Pivot
{
    protected $table = 'module_student';

    protected $fillable = [
        'module_id',
        'student_id',
        'assigned_date',
    ];

    protected $casts = [
        'assigned_date' => 'date',
    ];
}
