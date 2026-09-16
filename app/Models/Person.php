<?php

namespace App\Models;

use Database\Factories\PersonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * @property int $id
 * @property int $tmdb_id
 * @property string $name
 * @property string|null $biography
 * @property string|null $profile_path
 * @property Carbon|null $credits_fetched_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read bool $is_stale
 */
#[Fillable(['tmdb_id', 'name', 'biography', 'profile_path', 'credits_fetched_at'])]
class Person extends Model
{
    /** @use HasFactory<PersonFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credits_fetched_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Title, $this>
     */
    public function titles(): BelongsToMany
    {
        return $this->belongsToMany(Title::class, 'person_title')
            ->withPivot(['credit_type', 'character']);
    }

    /**
     * @return Attribute<bool, bool>
     */
    protected function isStale(): Attribute
    {
        $ttlDays = Config::integer('services.tmdb.metadata_ttl_days', 30);

        return Attribute::make(
            get: fn (mixed $value, array $attributes) => ! is_string($attributes['credits_fetched_at']) ||
                Carbon::parse($attributes['credits_fetched_at'])->lt(now()->subDays($ttlDays)),
        );
    }
}
