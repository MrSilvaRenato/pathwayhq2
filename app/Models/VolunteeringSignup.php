<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VolunteeringSignup extends Model
{
    protected $table = 'volunteering_signups';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id','volunteering_id','user_id'];
    protected $casts = ['id'=>'string'];
}
