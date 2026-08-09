<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('season_registrations')) return;

        Schema::create('season_registrations', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('season_id', 36);
            $table->string('athlete_id', 36);
            $table->string('user_id', 36);                      // the user account to notify
            $table->string('invited_by', 36);                   // manager who sent the request
            // status: invited → awaiting payment | paid | manual_pending → awaiting manual confirmation | rejected
            $table->string('status', 30)->default('invited');
            $table->string('payment_method', 20)->nullable();   // stripe|manual
            $table->string('stripe_payment_intent_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('season_id')->references('id')->on('seasons')->cascadeOnDelete();
            $table->foreign('athlete_id')->references('id')->on('athletes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('invited_by')->references('id')->on('users');
            $table->unique(['season_id', 'athlete_id']); // one registration per athlete per season
        });
    }

    public function down(): void { Schema::dropIfExists('season_registrations'); }
};
