<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Season extends Model
{
    protected $table = 'seasons';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'club_id', 'name', 'description',
        'start_date', 'end_date', 'registration_deadline',
        'fee_cents', 'currency', 'status',
    ];

    protected $casts = [
        'id'        => 'string',
        'club_id'   => 'string',
        'fee_cents' => 'integer',
    ];

    public function club()         { return $this->belongsTo(Club::class); }
    public function registrations(){ return $this->hasMany(SeasonRegistration::class); }

    // Convenience: fee in dollars
    public function getFeeAttribute(): float
    {
        return $this->fee_cents / 100;
    }
}
