<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('athletes', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('user_id', 36)->nullable();
            $table->string('invite_email')->nullable();
            $table->string('invite_token', 64)->nullable();
            $table->string('invite_status', 20)->default('accepted');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('dob')->nullable();
            $table->string('sport', 100)->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('ftem_phase', 10)->default('F1');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('slug', 100)->nullable()->unique();
            $table->boolean('is_public')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['club_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('athletes');
    }
};
