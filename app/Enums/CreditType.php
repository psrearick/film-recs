<?php

namespace App\Enums;

enum CreditType: string
{
    case Cast = 'cast';
    case Director = 'director';
    case Producer = 'producer';
    case Composer = 'composer';
}
