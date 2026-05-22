<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('club_id', 36);
            $table->string('author_id', 36)->nullable();
            $table->string('title');
            $table->text('body');
            $table->string('category', 50)->default('general');
            $table->string('emoji', 10)->nullable();
            $table->text('image_url')->nullable();
            $table->boolean('pinned')->default(false);
            $table->timestamp('posted_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
