<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

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

        // 2. Test athlete account (no club — will claim via directory)
        $manager = User::where('email', 'clubmanager@test.com')->first();
        if ($manager) {
            $manager->update([
                'password_hash' => Hash::make('12345678'),
                'role'          => 'athlete',
                'club_id'       => null,
            ]);
        } else {
            User::create([
                'id'            => (string) Str::uuid(),
                'email'         => 'clubmanager@test.com',
                'full_name'     => 'Club Manager',
                'password_hash' => Hash::make('12345678'),
                'role'          => 'athlete',
                'club_id'       => null,
            ]);
        }

        $this->command->info('Done: renatoleite.log@gmail.com → site_admin');
        $this->command->info('Done: clubmanager@test.com → athlete (no club)');
    }
}
