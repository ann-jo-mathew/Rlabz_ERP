<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Certificates\Models\Certificate;
use Modules\Coordinator\Models\ClientRequirement;
use Modules\Coordinator\Models\ProjectClosure;
use Modules\Coordinator\Models\RequirementChange;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'project_type',
        'source_type',
        'brought_by',
        'client_name',
        'contact_email',
        'contact_phone',
        'requirements',
        'deliverables',
        'expected_timeline',
        'budget',
        'priority',
        'status',
        'created_by',
    ];

    protected $casts = [
        'expected_timeline' => 'date',
        'budget' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function modules()
    {
        return $this->hasMany(Module::class);
    }
<<<<<<< ours

   public function students()
{
    return $this->belongsToMany(User::class, 'project_student', 'project_id', 'student_id')
        ->withPivot('role', 'assigned_date')
        ->withTimestamps();
}

public function faculty()
{
    return $this->belongsToMany(User::class, 'project_faculty', 'project_id', 'faculty_id')
        ->withPivot('assigned_date')
        ->withTimestamps();
}

public function requirements()
{
    return $this->hasMany(ClientRequirement::class);
}

public function requirementChanges()
{
    return $this->hasMany(RequirementChange::class);
}

public function closure()
{
    return $this->hasOne(ProjectClosure::class);
}

public function certificates()
{
    return $this->hasMany(Certificate::class);
}
||||||| base
=======

    public function faculty()
    {
        return $this->belongsToMany(User::class, 'project_faculty', 'project_id', 'faculty_id')
                    ->withPivot('assigned_date')
                    ->withTimestamps();
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'project_student', 'project_id', 'student_id')
                    ->withPivot('role', 'assigned_date')
                    ->withTimestamps();
    }
>>>>>>> theirs
}
