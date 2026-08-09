<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('club_join_requests')) return;

        Schema::create('club_join_requests', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('user_id', 36);
            $table->text('message')->nullable();
            $table->string('status', 20)->default('pending'); // pending|approved|rejected
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['club_id', 'user_id']); // one active request per user per club
        });
    }

    public function down(): void { Schema::dropIfExists('club_join_requests'); }
};
