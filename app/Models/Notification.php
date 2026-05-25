<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','user_id','title','body','link','type','is_read','at'];
    protected $casts = ['id'=>'string','is_read'=>'boolean'];
}
