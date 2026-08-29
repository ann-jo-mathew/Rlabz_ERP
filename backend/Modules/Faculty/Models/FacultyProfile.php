<?php

namespace Modules\Faculty\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class FacultyProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'department',
        'designation',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }
}
