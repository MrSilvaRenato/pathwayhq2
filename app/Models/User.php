<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'users';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'club_id', 'email', 'password_hash', 'full_name', 'role',
    ];

    protected $hidden = ['password_hash'];

    protected $casts = ['id' => 'string', 'club_id' => 'string'];

    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }
    public function getAuthPassword() { return $this->password_hash; }

    public function club() { return $this->belongsTo(Club::class); }
}
