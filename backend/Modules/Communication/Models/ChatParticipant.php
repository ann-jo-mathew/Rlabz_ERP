<?php

namespace Modules\Communication\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class ChatParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'user_id',
        'joined_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
