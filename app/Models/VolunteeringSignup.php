<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VolunteeringSignup extends Model
{
    protected $table = 'volunteering_signups';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','volunteering_id','user_id'];
    protected $casts = ['id'=>'string'];

    public function user() { return $this->belongsTo(\App\Models\User::class); }
}
