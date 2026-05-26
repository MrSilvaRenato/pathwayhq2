<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change default to true for new records
        Schema::table('athletes', function (Blueprint $table) {
            $table->boolean('is_public')->default(true)->change();
        });

        // Make existing athletes public unless they explicitly set private
        DB::table('athletes')->where('is_public', false)->update(['is_public' => true]);
    }

    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->change();
        });
    }
};
