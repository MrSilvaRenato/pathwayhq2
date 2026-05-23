<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Club;

class TestAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Site admin — renatoleite.log@gmail.com
        User::updateOrCreate(
            ['email' => 'renatoleite.log@gmail.com'],
            [
                'id'            => (string) Str::uuid(),
                'full_name'     => 'Renato Leite',
                'password_hash' => Hash::make('12345678'),
                'role'          => 'site_admin',
                'club_id'       => null,
            ]
        );

        // 2. Club manager for North Brisbane FC
        $club = Club::where('slug', 'north-brisbane-fc')->first();

        if (!$club) {
            $this->command->warn('North Brisbane FC not found — run BrisbaneClubsSeeder first.');
            return;
        }

        User::updateOrCreate(
            ['email' => 'clubmanager@test.com'],
            [
                'id'            => (string) Str::uuid(),
                'full_name'     => 'Club Manager',
                'password_hash' => Hash::make('12345678'),
                'role'          => 'club_admin',
                'club_id'       => $club->id,
            ]
        );

        // Mark the club as claimed
        $club->update(['is_claimed' => true]);

        $this->command->info('Done: renatoleite.log@gmail.com → site_admin');
        $this->command->info('Done: clubmanager@test.com → club_admin for ' . $club->name);
    }
}
