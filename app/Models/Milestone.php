<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Club;

class Milestone extends Model
{
    protected $table = 'milestones';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','club_id','athlete_id','title','category','description','ftem_phase','achieved_at','is_shared_with_parent','is_edited'];
    protected $casts = ['id'=>'string','club_id'=>'string','athlete_id'=>'string','is_shared_with_parent'=>'boolean','is_edited'=>'boolean'];

    public function athlete() { return $this->belongsTo(Athlete::class); }
    public function club()    { return $this->belongsTo(Club::class); }
}
