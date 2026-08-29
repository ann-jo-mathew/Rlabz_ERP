<?php

namespace Modules\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class AuditLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
