<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'events';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','club_id','squad_id','title','description','location','start_time','end_time','event_type'];
    protected $casts = ['id'=>'string','club_id'=>'string'];

    public function squad() { return $this->belongsTo(Squad::class); }
    public function rsvps() { return $this->hasMany(EventRsvp::class); }
}
