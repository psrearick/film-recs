<?php

namespace App\Models;

use Database\Factories\WatchProviderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tmdb_id
 * @property string $name
 * @property string|null $logo_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['tmdb_id', 'name', 'logo_path'])]
class WatchProvider extends Model
{
    /** @use HasFactory<WatchProviderFactory> */
    use HasFactory;

    /**
     * @return BelongsToMany<Title, $this>
     */
    public function titles(): BelongsToMany
    {
        return $this->belongsToMany(Title::class, 'title_watch_provider')
            ->withPivot(['region', 'access_type', 'fetched_at']);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_watch_provider');
    }
}
