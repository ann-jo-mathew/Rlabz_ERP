<?php

namespace Modules\Github\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\ProjectClient\Models\Project;

class GithubRepository extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'repository_name',
        'repository_url',
        'submitted_date',
        'is_verified',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'submitted_date' => 'date',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
