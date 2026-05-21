<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Milestone extends Model
{
    protected $table = 'milestones';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','club_id','athlete_id','title','description','ftem_phase','achieved_at','is_shared_with_parent'];
    protected $casts = ['id'=>'string','club_id'=>'string','athlete_id'=>'string','is_shared_with_parent'=>'boolean'];

    public function athlete() { return $this->belongsTo(Athlete::class); }
}
