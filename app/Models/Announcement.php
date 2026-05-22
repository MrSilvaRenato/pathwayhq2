<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $table = 'announcements';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $fillable = ['id','club_id','author_id','title','body','category','emoji','image_url','pinned','posted_at'];
    protected $casts = ['id'=>'string','club_id'=>'string','pinned'=>'boolean'];

    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
