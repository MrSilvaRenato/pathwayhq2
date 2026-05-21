<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Volunteering extends Model
{
    protected $table = 'volunteering';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','club_id','title','description','date','spots'];
    protected $casts = ['id'=>'string','club_id'=>'string'];

    public function signups() { return $this->hasMany(VolunteeringSignup::class); }
}
