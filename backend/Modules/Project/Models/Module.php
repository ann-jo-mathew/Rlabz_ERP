<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'weight_percentage',
        'module_name',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'weight_percentage' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'module_student', 'module_id', 'student_id')
                    ->withPivot('assigned_date')
                    ->withTimestamps();
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
