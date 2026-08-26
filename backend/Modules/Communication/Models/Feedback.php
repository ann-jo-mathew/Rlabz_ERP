<?php

namespace Modules\Communication\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\ProjectClient\Models\Project;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'faculty_id',
        'student_id',
        'comments',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
