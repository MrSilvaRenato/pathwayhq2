<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('squads', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('squads');
    }
};
