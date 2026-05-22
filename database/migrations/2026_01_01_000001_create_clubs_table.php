<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('name');
            $table->string('sport', 100);
            $table->string('city', 100)->nullable();
            $table->string('state', 10)->nullable();
            $table->string('slug', 255)->nullable()->unique();
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->string('contact_email')->nullable();
            $table->boolean('is_public')->default(false);
            $table->string('subscription_tier', 50)->default('free');
            $table->timestamp('created_at')->useCurrent();
            $table->text('cover_image_url')->nullable();
            $table->text('logo_url')->nullable();
            $table->smallInteger('founded_year')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('social_facebook')->nullable();
            $table->string('social_instagram')->nullable();
            $table->string('social_twitter')->nullable();
            $table->boolean('show_milestones')->default(true);
            $table->boolean('show_athletes_count')->default(true);
            $table->boolean('show_events')->default(false);
            $table->boolean('show_announcements')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
