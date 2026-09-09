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
        'previous_value',
        'updated_value',
        'changed_by',
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

    protected $appends = [
        'change_description',
        'status',
        'changed_on',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'changed_on' => 'datetime',
    ];

    public function clientRequirement()
    {
        return $this->belongsTo(ClientRequirement::class, 'client_requirement_id');
    }

    public function project()
    {
        return $this->hasOneThrough(
            Project::class,
            ClientRequirement::class,
            'id',
            'id',
            'client_requirement_id',
            'project_id'
        );
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function getChangeDescriptionAttribute()
    {
        if (!empty($this->attributes['change_description'])) {
            return $this->attributes['change_description'];
        }
        if (!empty($this->attributes['updated_value'])) {
            $val = json_decode($this->attributes['updated_value'], true);
            return $val['change_description'] ?? $val['description'] ?? 'Requirement updated';
        }
        return 'Requirement updated';
    }

    public function getStatusAttribute()
    {
        return $this->attributes['status'] ?? 'approved';
    }

    public function getChangedOnAttribute()
    {
        return $this->attributes['changed_on'] ?? $this->created_at;
    }
}
