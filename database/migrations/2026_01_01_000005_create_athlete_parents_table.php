<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('athlete_parents', function (Blueprint $table) {
            $table->string('athlete_id', 36);
            $table->string('parent_id', 36);

            $table->primary(['athlete_id', 'parent_id']);
            $table->foreign('athlete_id')->references('id')->on('athletes')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('athlete_parents');
    }
};
