<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id','user_id','title','body','link','is_read'];
    protected $casts = ['id'=>'string','is_read'=>'boolean'];
}
