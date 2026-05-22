<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('volunteering_signups', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('volunteering_id', 36);
            $table->string('user_id', 36);
            $table->timestamp('signed_up_at')->useCurrent();

            $table->foreign('volunteering_id')->references('id')->on('volunteering')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('volunteering_signups');
    }
};
