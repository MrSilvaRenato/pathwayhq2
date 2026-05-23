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
        $admin = User::where('email', 'renatoleite.log@gmail.com')->first();
        if ($admin) {
            $admin->update([
                'password_hash' => Hash::make('12345678'),
                'role'          => 'site_admin',
                'club_id'       => null,
            ]);
        } else {
            User::create([
                'id'            => (string) Str::uuid(),
                'email'         => 'renatoleite.log@gmail.com',
                'full_name'     => 'Renato Leite',
                'password_hash' => Hash::make('12345678'),
                'role'          => 'site_admin',
                'club_id'       => null,
            ]);
        }

        // 2. Club manager for North Brisbane FC
        $club = Club::where('slug', 'north-brisbane-fc')->first();

        if (!$club) {
            $this->command->warn('North Brisbane FC not found — run BrisbaneClubsSeeder first.');
            return;
        }

        $manager = User::where('email', 'clubmanager@test.com')->first();
        if ($manager) {
            $manager->update([
                'password_hash' => Hash::make('12345678'),
                'role'          => 'club_admin',
                'club_id'       => $club->id,
            ]);
        } else {
            User::create([
                'id'            => (string) Str::uuid(),
                'email'         => 'clubmanager@test.com',
                'full_name'     => 'Club Manager',
                'password_hash' => Hash::make('12345678'),
                'role'          => 'club_admin',
                'club_id'       => $club->id,
            ]);
        }

        // Mark the club as claimed
        $club->update(['is_claimed' => true]);

        $this->command->info('Done: renatoleite.log@gmail.com → site_admin');
        $this->command->info('Done: clubmanager@test.com → club_admin for ' . $club->name);
    }
}
