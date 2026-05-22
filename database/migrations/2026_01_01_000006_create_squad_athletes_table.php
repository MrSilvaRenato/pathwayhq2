<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('squad_athletes', function (Blueprint $table) {
            $table->string('squad_id', 36);
            $table->string('athlete_id', 36);

            $table->primary(['squad_id', 'athlete_id']);
            $table->foreign('squad_id')->references('id')->on('squads')->cascadeOnDelete();
            $table->foreign('athlete_id')->references('id')->on('athletes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('squad_athletes');
    }
};
