<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $table = 'announcements';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id','club_id','author_id','title','body'];
    protected $casts = ['id'=>'string','club_id'=>'string'];

    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
