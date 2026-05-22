<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Club extends Model
{
    protected $table = 'clubs';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'name', 'sport', 'city', 'state', 'slug', 'description',
        'website', 'contact_email', 'phone', 'is_public', 'subscription_tier',
        'cover_image_url', 'logo_url', 'founded_year',
        'social_facebook', 'social_instagram', 'social_twitter',
        'show_milestones', 'show_athletes_count', 'show_events', 'show_announcements',
    ];

    protected $casts = [
        'id'                  => 'string',
        'is_public'           => 'boolean',
        'show_milestones'     => 'boolean',
        'show_athletes_count' => 'boolean',
        'show_events'         => 'boolean',
        'show_announcements'  => 'boolean',
    ];

    public function athletes() { return $this->hasMany(Athlete::class); }
    public function users()    { return $this->hasMany(User::class); }
}
