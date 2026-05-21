<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class EventRsvp extends Model {
    protected $table = 'event_rsvps';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','event_id','user_id','status'];
}
