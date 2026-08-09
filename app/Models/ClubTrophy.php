<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubTrophy extends Model
{
    protected $table      = 'club_trophies';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id', 'club_id', 'title', 'description',
        'category', 'achieved_at', 'image_url', 'is_public',
    ];

    protected $casts = [
        'is_public'   => 'boolean',
        'achieved_at' => 'date:Y-m-d',
    ];

    public function club() { return $this->belongsTo(Club::class); }
}
