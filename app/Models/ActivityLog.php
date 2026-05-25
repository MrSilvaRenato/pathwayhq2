<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ActivityLog extends Model
{
    protected $table      = 'activity_logs';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id', 'admin_id', 'admin_name', 'action',
        'target_type', 'target_id', 'target_name', 'metadata', 'created_at',
    ];

    public static function record(User $actor, string $action, ?string $targetType = null, ?string $targetId = null, ?string $targetName = null, array $metadata = []): void
    {
        static::create([
            'id'          => (string) Str::uuid(),
            'admin_id'    => $actor->id,
            'admin_name'  => $actor->full_name ?? $actor->email,
            'action'      => $action,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'target_name' => $targetName,
            'metadata'    => !empty($metadata) ? json_encode($metadata) : null,
            'created_at'  => now(),
        ]);
    }
}
