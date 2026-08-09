<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AthleteParent extends Model
{
    protected $table = 'athlete_parents';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['id', 'athlete_id', 'parent_user_id'];

    protected $casts = ['id' => 'string', 'athlete_id' => 'string', 'parent_user_id' => 'string'];

    public function athlete() { return $this->belongsTo(Athlete::class); }
    public function parent()  { return $this->belongsTo(User::class, 'parent_user_id'); }
}
