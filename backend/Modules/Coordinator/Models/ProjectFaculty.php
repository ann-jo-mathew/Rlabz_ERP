<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Modules\Auth\Models\User;
use Modules\Project\Models\Project;

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

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }
}
