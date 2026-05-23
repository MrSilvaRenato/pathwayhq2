<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('athlete_parents')) return;

        Schema::create('athlete_parents', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('athlete_id', 36);
            $table->string('parent_user_id', 36);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('athlete_id')->references('id')->on('athletes')->cascadeOnDelete();
            $table->foreign('parent_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['athlete_id', 'parent_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('athlete_parents');
    }
};
