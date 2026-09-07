<?php

namespace Modules\Certificates\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;
use Modules\Project\Models\Project;
use Modules\Project\Models\Module;

class Certificate extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'module_id',
        'student_id',
        'certificate_number',
        'description',
        'issue_date',
        'certificate_file',
        'issued_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
