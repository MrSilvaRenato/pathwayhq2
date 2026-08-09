<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Athlete extends Model
{
    protected $table = 'athletes';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'club_id', 'user_id', 'first_name', 'last_name',
        'dob', 'sport', 'gender', 'ftem_phase', 'position', 'is_active', 'notes',
        'invite_email', 'invite_token', 'invite_status', 'phone',
        'slug', 'is_public', 'avatar_url',
    ];

    protected $casts = ['id' => 'string', 'club_id' => 'string', 'is_active' => 'boolean', 'is_public' => 'boolean'];

    public function club()       { return $this->belongsTo(Club::class); }
    public function squads()     { return $this->belongsToMany(Squad::class, 'squad_athletes'); }
    public function milestones() { return $this->hasMany(Milestone::class); }
    public function user()       { return $this->belongsTo(User::class); }
}
