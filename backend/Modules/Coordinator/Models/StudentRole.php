<?php

namespace Modules\Coordinator\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Auth\Models\User;

class StudentRole extends Model
{
    protected $fillable = [
        'student_id',
        'role',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
