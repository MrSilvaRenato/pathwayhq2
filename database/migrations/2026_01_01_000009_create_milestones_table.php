<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('milestones', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('athlete_id', 36);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('ftem_phase', 10)->nullable();
            $table->date('achieved_at');
            $table->boolean('is_shared_with_parent')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreign('athlete_id')->references('id')->on('athletes')->cascadeOnDelete();
            $table->index('club_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('milestones');
    }
};
