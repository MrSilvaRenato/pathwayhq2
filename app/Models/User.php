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
    public $timestamps = false;

    protected $fillable = [
        'id', 'club_id', 'email', 'password_hash', 'full_name', 'role', 'phone',
    ];

    protected $hidden = ['password_hash'];

    protected $casts = ['id' => 'string', 'club_id' => 'string'];

    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }
    public function getAuthPassword() { return $this->password_hash; }

    public function club()    { return $this->belongsTo(Club::class); }
    public function athlete() { return $this->hasOne(Athlete::class); }

    /**
     * Resolve the club_id for any role.
     * Coaches/admins have club_id directly on users.
     * Athletes are linked via the athletes table.
     */
    public function resolveClubId(): ?string
    {
        if ($this->club_id) return $this->club_id;

        // athlete or parent — look up via athlete profile
        $athlete = Athlete::where('user_id', $this->id)->first();
        return $athlete?->club_id;
    }
}
