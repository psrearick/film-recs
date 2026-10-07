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
        Schema::table('attribute_affinities', function (Blueprint $table) {
            $table->unsignedBigInteger('attribute_id')->nullable()->after('attribute_type');
            $table->string('attribute_value')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Fails if any row has a null attribute_value (every genre and keyword affinity),
     * so clear the table before rolling back.
     */
    public function down(): void
    {
        Schema::table('attribute_affinities', function (Blueprint $table) {
            $table->dropColumn('attribute_id');
            $table->string('attribute_value')->nullable(false)->change();
        });
    }
};
