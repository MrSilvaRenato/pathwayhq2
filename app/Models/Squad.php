<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Squad extends Model
{
    protected $table = 'squads';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'club_id', 'name', 'description'];
    protected $casts = ['id' => 'string', 'club_id' => 'string'];

    public function athletes() { return $this->belongsToMany(Athlete::class, 'squad_athletes'); }
}
