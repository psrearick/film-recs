<?php

namespace App\Models;

use App\Enums\AttributeType;
use Database\Factories\AttributeAffinityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * @property int $id
 * @property int $user_id
 * @property AttributeType $attribute_type
 * @property int|null $attribute_id
 * @property string|null $attribute_value
 * @property float $affinity_score
 * @property int $sample_size
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read float $confidence
 */
#[Fillable(['user_id', 'attribute_type', 'attribute_id', 'attribute_value', 'affinity_score', 'sample_size'])]
class AttributeAffinity extends Model
{
    /** @use HasFactory<AttributeAffinityFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attribute_type' => AttributeType::class,
            'attribute_id' => 'integer',
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
     * Whether too few rated titles back this affinity to trust it.
     */
    public function isLowConfidence(): bool
    {
        return $this->confidence < Config::float('recommendations.minimum_confidence');
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
