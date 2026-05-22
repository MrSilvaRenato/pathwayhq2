<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_trophies', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 50)->default('competition');
            $table->date('achieved_at')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_public')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->index('club_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_trophies');
    }
};
