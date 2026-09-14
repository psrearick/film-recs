<?php

use App\Enums\TitleType;
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
        Schema::create('titles', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('tmdb_id');
            $table->enum('type', TitleType::cases());
            $table->string('name');
            $table->unsignedSmallInteger('release_year')->nullable();
            $table->text('overview')->nullable();
            $table->string('poster_path')->nullable();
            $table->unsignedSmallInteger('runtime')->nullable();
            $table->float('popularity')->nullable();
            $table->decimal('vote_average', 3, 1)->nullable();
            $table->timestamp('metadata_fetched_at')->nullable();
            $table->timestamps();

            $table->unique(['tmdb_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('titles');
    }
};
