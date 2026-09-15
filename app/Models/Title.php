<?php

namespace App\Models;

use App\Enums\CreditType;
use App\Enums\TitleType;
use Database\Factories\TitleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tmdb_id
 * @property TitleType $type
 * @property string $name
 * @property int|null $release_year
 * @property string|null $overview
 * @property string|null $poster_path
 * @property int|null $runtime
 * @property float|null $popularity
 * @property float|null $vote_average
 * @property Carbon|null $metadata_fetched_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tmdb_id',
    'type',
    'name',
    'release_year',
    'overview',
    'poster_path',
    'runtime',
    'popularity',
    'vote_average',
    'metadata_fetched_at',
])]
class Title extends Model
{
    /** @use HasFactory<TitleFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => TitleType::class,
            'popularity' => 'float',
            'vote_average' => 'float',
            'metadata_fetched_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Genre, $this>
     */
    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'genre_title');
    }

    /**
     * @return BelongsToMany<Keyword, $this>
     */
    public function keywords(): BelongsToMany
    {
        return $this->belongsToMany(Keyword::class, 'keyword_title');
    }

    /**
     * @return BelongsToMany<Person, $this>
     */
    public function people(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'person_title')
            ->withPivot(['credit_type', 'character']);
    }

    /**
     * @return BelongsToMany<Person, $this>
     */
    public function actors(): BelongsToMany
    {
        return $this->people()->wherePivot('credit_type', CreditType::Cast);
    }

    /**
     * @return BelongsToMany<Person, $this>
     */
    public function directors(): BelongsToMany
    {
        return $this->people()->wherePivot('credit_type', CreditType::Director);
    }

    /**
     * @return BelongsToMany<Person, $this>
     */
    public function producers(): BelongsToMany
    {
        return $this->people()->wherePivot('credit_type', CreditType::Producer);
    }

    /**
     * @return BelongsToMany<Person, $this>
     */
    public function composers(): BelongsToMany
    {
        return $this->people()->wherePivot('credit_type', CreditType::Composer);
    }

    /**
     * @return BelongsToMany<WatchProvider, $this>
     */
    public function watchProviders(): BelongsToMany
    {
        return $this->belongsToMany(WatchProvider::class, 'title_watch_provider')
            ->withPivot(['region', 'access_type', 'fetched_at']);
    }

    /**
     * @return HasMany<Rating, $this>
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }
}
