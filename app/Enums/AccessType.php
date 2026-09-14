<?php

namespace App\Enums;

enum AccessType: string
{
    case Subscription = 'subscription';
    case Rent = 'rent';
    case Buy = 'buy';
}
