<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Project\Models\Project;

class RequirementChange extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_requirement_id',
        'project_id',
        'previous_description',
        'new_description',
        'change_description',
        'reason',
        'previous_document_path',
        'new_document_path',
        'requested_by',
        'status',
        'approved_by',
        'approved_at',
        'changed_on',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'changed_on' => 'datetime',
    ];

    public function clientRequirement()
    {
        return $this->belongsTo(ClientRequirement::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
