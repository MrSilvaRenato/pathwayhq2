<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dateTime('trial_ends_at')->nullable()->after('subscription_ends_at');
        });

        // Seed existing free-plan clubs that have no trial yet with a 14-day trial from now
        DB::table('clubs')
            ->where('subscription_tier', 'free')
            ->orWhereNull('subscription_tier')
            ->whereNull('trial_ends_at')
            ->update(['trial_ends_at' => now()->addDays(14)]);
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn('trial_ends_at');
        });
    }
};
