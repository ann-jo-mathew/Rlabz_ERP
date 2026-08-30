<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\ProjectClient\Models\Project;
use Modules\ProjectClient\Models\Task;

class ClientRequirement extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'task_id',
        'description',
        'document_path',
        'uploaded_by',
        'uploaded_on',
    ];

    protected $casts = [
        'uploaded_on' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function changes()
    {
        return $this->hasMany(RequirementChange::class, 'client_requirement_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
