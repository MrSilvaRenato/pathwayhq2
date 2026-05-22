<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('squad_id', 36)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->string('event_type', 20)->default('training');
            $table->string('series_id', 36)->nullable();
            $table->string('recurrence', 20)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreign('squad_id')->references('id')->on('squads')->nullOnDelete();
            $table->index(['club_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
