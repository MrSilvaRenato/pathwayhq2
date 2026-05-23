<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('seasons')) return;

        Schema::create('seasons', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('name', 100);             // e.g. "Winter 2025"
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('registration_deadline')->nullable();
            $table->unsignedInteger('fee_cents')->default(0); // stored in cents
            $table->string('currency', 3)->default('AUD');
            $table->string('status', 20)->default('draft'); // draft|open|closed
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
        });
    }

    public function down(): void { Schema::dropIfExists('seasons'); }
};
