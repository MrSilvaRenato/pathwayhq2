<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubClaim extends Model
{
    protected $table      = 'club_claims';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id', 'club_id', 'name', 'email', 'phone',
        'role_at_club', 'message', 'status',
    ];

    public function club() { return $this->belongsTo(Club::class); }
}
