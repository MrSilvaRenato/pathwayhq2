<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeasonRegistration extends Model
{
    protected $table = 'season_registrations';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'season_id', 'athlete_id', 'user_id', 'invited_by',
        'status', 'payment_method', 'stripe_payment_intent_id', 'paid_at', 'notes',
    ];

    protected $casts = ['id' => 'string', 'season_id' => 'string', 'athlete_id' => 'string'];

    public function season()  { return $this->belongsTo(Season::class); }
    public function athlete() { return $this->belongsTo(Athlete::class); }
    public function user()    { return $this->belongsTo(User::class); }
}
