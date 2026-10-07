<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('person_title', function (Blueprint $table) {
            $table->unsignedSmallInteger('billing_order')->nullable()->after('character');
            $table->unsignedSmallInteger('episode_count')->nullable()->after('billing_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('person_title', function (Blueprint $table) {
            $table->dropColumn(['billing_order', 'episode_count']);
        });
    }
};
