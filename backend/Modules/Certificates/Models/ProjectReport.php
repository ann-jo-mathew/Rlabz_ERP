<?php

namespace Modules\Certificates\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\ProjectClient\Models\Project;

class ProjectReport extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'report_title',
        'report_file',
        'uploaded_by',
        'upload_date',
    ];

    protected $casts = [
        'upload_date' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
