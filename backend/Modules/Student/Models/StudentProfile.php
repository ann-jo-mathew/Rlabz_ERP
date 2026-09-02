<?php

namespace Modules\Student\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course',
        'batch',
        'semester',
        'designation',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
