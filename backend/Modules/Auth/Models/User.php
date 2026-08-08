<?php

namespace Modules\Auth\Models;

// use Illuminate\Foundation\Auth\User as Authenticatable;
// use Tymon\JWTAuth\Contracts\JWTSubject;
// use Spatie\Permission\Traits\HasRoles;

// REAL IMPLEMENTATION (Commented out):
/*
class User extends Authenticatable implements JWTSubject
{
    use HasRoles;

    protected $fillable = [
        'username', 'password', 'role', 'modules', 'category'
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'modules' => 'array',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'modules' => $this->modules,
            'permissions' => $this->getAllPermissions()->pluck('name')->toArray()
        ];
    }
}
*/

// MOCK IMPLEMENTATION (Just a placeholder class)
class User {
    // This file is ready for when you run Laravel and migrate the DB.
    // Uncomment the real implementation above.
}
