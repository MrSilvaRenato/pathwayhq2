<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SquadRequest extends Model
{
    protected $table      = 'squad_requests';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = ['id', 'club_id', 'athlete_id', 'squad_id', 'reason', 'status'];

    public function athlete() { return $this->belongsTo(Athlete::class); }
    public function squad()   { return $this->belongsTo(Squad::class); }
}
