<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

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
     * club_admin / coach → club_id on users table.
     * athlete → club_id on the active accepted athletes record.
     * parent / site_admin → no club context (null).
     */
    public function resolveClubId(): ?string
    {
        if (in_array($this->role, ['parent', 'site_admin'])) return null;
        if ($this->club_id) return $this->club_id;

        $athlete = Athlete::where('user_id', $this->id)
            ->where('invite_status', 'accepted')
            ->where('is_active', true)
            ->first();
        return $athlete?->club_id;
    }
}
