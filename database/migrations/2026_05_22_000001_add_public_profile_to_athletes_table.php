<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('is_active');
            $table->boolean('is_public')->default(false)->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn(['slug', 'is_public']);
        });
    }
};
