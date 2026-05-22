<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36)->nullable();
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('password_hash');
            $table->string('full_name')->nullable();
            $table->string('role', 20)->default('coach');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->nullOnDelete();
            $table->index('club_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
