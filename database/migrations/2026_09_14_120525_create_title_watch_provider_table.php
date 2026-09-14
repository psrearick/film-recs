<?php

use App\Enums\AccessType;
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
        Schema::create('title_watch_provider', function (Blueprint $table) {
            $table->id();
            $table->foreignId('title_id')->constrained()->cascadeOnDelete();
            $table->foreignId('watch_provider_id')->constrained()->cascadeOnDelete();
            $table->string('region', 2);
            $table->enum('access_type', AccessType::cases());
            $table->timestamp('fetched_at');
            $table->timestamps();

            $table->unique(['title_id', 'watch_provider_id', 'region', 'access_type'], 'title_watch_provider_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('title_watch_provider');
    }
};
