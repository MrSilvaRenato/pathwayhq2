<?php

return [

    'free' => [
        'name'       => 'Free',
        'price_aud'  => 0,
        'stripe_price_id' => null,
        'limits' => [
            'athletes'      => 8,
            'squads'        => 1,
            'announcements' => 3,   // per month
        ],
        'features' => [
            'calendar'       => false,
            'seasons'        => false,
            'broadcast'      => false,
            'volunteering'   => false,
            'analytics'      => false,
            'trophy_cabinet' => false,
            'remove_branding'=> false,
        ],
    ],

    'pro' => [
        'name'       => 'Pro',
        'price_aud'  => 29,
        'stripe_price_id' => env('STRIPE_PRICE_PRO'),
        'limits' => [
            'athletes'      => 100,
            'squads'        => 5,
            'announcements' => -1,  // unlimited
        ],
        'features' => [
            'calendar'       => true,
            'seasons'        => true,
            'broadcast'      => true,
            'volunteering'   => true,
            'analytics'      => true,
            'trophy_cabinet' => false,
            'remove_branding'=> false,
        ],
    ],

    'elite' => [
        'name'       => 'Elite',
        'price_aud'  => 79,
        'stripe_price_id' => env('STRIPE_PRICE_ELITE'),
        'limits' => [
            'athletes'      => -1,  // unlimited
            'squads'        => -1,
            'announcements' => -1,
        ],
        'features' => [
            'calendar'       => true,
            'seasons'        => true,
            'broadcast'      => true,
            'volunteering'   => true,
            'analytics'      => true,
            'trophy_cabinet' => true,
            'remove_branding'=> true,
        ],
    ],

];
