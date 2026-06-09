<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->string('stripe_connect_id')->nullable()->after('stripe_subscription_id');
            $table->string('stripe_connect_status', 30)->nullable()->after('stripe_connect_id');
            // pending = account created, not yet onboarded
            // active  = fully onboarded, can receive payments
            // restricted = charges/payouts restricted (needs more info)
        });
    }

    public function down(): void
    {
        Schema::table('clubs', function (Blueprint $table) {
            $table->dropColumn(['stripe_connect_id', 'stripe_connect_status']);
        });
    }
};
