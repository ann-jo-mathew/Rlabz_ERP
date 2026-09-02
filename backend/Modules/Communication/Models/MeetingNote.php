<?php

namespace Modules\Communication\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Auth\Models\User;

class MeetingNote extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'meeting_id',
        'minutes',
        'important_decisions',
        'uploaded_by',
        'uploaded_on',
    ];

    protected $casts = [
        'uploaded_on' => 'datetime',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
