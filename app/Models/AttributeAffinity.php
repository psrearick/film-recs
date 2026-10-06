<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * @property int $id
 * @property string $attribute_type
 * @property string $attribute_value
 * @property float $affinity_score
 * @property int $sample_size
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read float $confidence
 */
#[Fillable(['user_id', 'attribute_type', 'attribute_value', 'affinity_score', 'sample_size'])]
class AttributeAffinity extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sample_size' => 'integer',
            'affinity_score' => 'double',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return Attribute<float, never>
     */
    protected function confidence(): Attribute
    {
        return Attribute::get(fn (): float => fdiv(
            $this->sample_size,
            $this->sample_size + Config::float('recommendations.shrinkage_k'),
        ));
    }
}
