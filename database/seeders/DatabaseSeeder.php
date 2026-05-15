<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Club;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Club for demo ────────────────────────────────────────────────────
        $club = Club::create([
            'id'          => (string) Str::uuid(),
            'name'        => 'PathwayHQ Demo Club',
            'sport'       => 'soccer',
            'city'        => 'Brisbane',
            'state'       => 'QLD',
            'slug'        => 'pathwayhq-demo',
            'description' => 'Official demo club for PathwayHQ.',
            'is_public'   => true,
        ]);

        // ── Club Admin ───────────────────────────────────────────────────────
        User::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => $club->id,
            'email'         => 'renatinholc@gmail.com',
            'password_hash' => Hash::make('12345678'),
            'full_name'     => 'Renato Silva',
            'role'          => 'club_admin',
        ]);

        // ── Site Admin ───────────────────────────────────────────────────────
        User::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => null,
            'email'         => 'renatoleite.log@gmail.com',
            'password_hash' => Hash::make('12345678'),
            'full_name'     => 'Renato Leite',
            'role'          => 'site_admin',
        ]);

        // ── Test Athlete ─────────────────────────────────────────────────────
        User::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => $club->id,
            'email'         => 'testatlete08071990@gmail.com',
            'password_hash' => Hash::make('12345678'),
            'full_name'     => 'Test Athlete',
            'role'          => 'athlete',
        ]);
    }
}
