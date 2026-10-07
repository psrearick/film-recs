<?php

namespace App\Enums;

enum AttributeType: string
{
    case Genre = 'genre';
    case Keyword = 'keyword';
    case Person = 'person';
    case Decade = 'decade';
}
