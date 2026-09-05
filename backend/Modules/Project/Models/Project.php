<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

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
}
