<?php

namespace Modules\Certificates\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Project\Models\Project;

class FinalProjectDocument extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'final_report',
        'code_handover',
        'closure_notes',
        'uploaded_on',
    ];

    protected $casts = [
        'uploaded_on' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
