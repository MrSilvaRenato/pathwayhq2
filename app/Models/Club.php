<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Club extends Model
{
    protected $table = 'clubs';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'sport', 'city', 'state', 'slug', 'description',
        'website', 'contact_email', 'is_public', 'subscription_tier',
    ];

    protected $casts = ['id' => 'string', 'is_public' => 'boolean'];

    public function athletes() { return $this->hasMany(Athlete::class); }
    public function users()    { return $this->hasMany(User::class); }
}
