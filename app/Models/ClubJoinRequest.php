<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubJoinRequest extends Model
{
    protected $table = 'club_join_requests';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['id', 'club_id', 'user_id', 'message', 'status', 'responded_at'];
    protected $casts = ['id' => 'string', 'club_id' => 'string', 'user_id' => 'string'];

    public function club() { return $this->belongsTo(Club::class); }
    public function user() { return $this->belongsTo(User::class); }
}
