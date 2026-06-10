<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use App\Models\Athlete;
use App\Models\Club;
use App\Models\Notification;
use App\Services\MailService;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->merge(['email' => strtolower(trim($request->input('email', '')))]);

        $data = $request->validate([
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:6',
            'full_name'  => 'required|string',
            'role'       => 'nullable|in:athlete,parent,club_admin',
            'club_name'  => 'required_if:role,club_admin|nullable|string|max:255',
            'sport'      => 'nullable|string',
            'city'       => 'nullable|string|max:100',
            'state'      => 'nullable|string|max:100',
        ]);

        $role   = $data['role'] ?? 'athlete';
        $clubId = null;

        if ($role === 'club_admin') {
            $baseSlug = Str::slug($data['club_name']);
            $slug = $baseSlug;
            $i    = 1;
            while (Club::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $i++;
            }

            $club   = Club::create([
                'id'         => (string) Str::uuid(),
                'name'       => $data['club_name'],
                'sport'      => $data['sport'] ?? 'soccer',
                'city'       => $data['city']  ?? null,
                'state'      => $data['state'] ?? null,
                'slug'       => $slug,
                'is_claimed' => true,
            ]);
            $clubId = $club->id;
        }

        $user = User::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => $clubId,
            'email'         => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'full_name'     => $data['full_name'],
            'role'          => $role,
        ]);

        // Auto-link pending club invites for athletes
        if ($role === 'athlete') {
            $pending = Athlete::where('invite_email', $data['email'])
                ->whereNull('user_id')
                ->where('invite_status', 'pending')
                ->with('club:id,name')
                ->get();

            foreach ($pending as $athlete) {
                $athlete->user_id      = $user->id;
                $athlete->invite_token = null;
                $athlete->save();

                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'title'   => '🏟️ ' . ($athlete->club->name ?? 'A club') . ' added you to their roster',
                    'body'    => 'Accept to join their team and see your development pathway, sessions, and milestones.',
                    'link'    => '/dashboard',
                    'is_read' => false,
                    'at'      => now()->toDateTimeString(),
                ]);
            }
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $credentials['email'] = strtolower(trim($credentials['email']));

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password_hash)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request)
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['ok' => true]);
    }

    public function me(Request $request)
    {
        return response()->json($this->userPayload($request->user()));
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $data['email'] = strtolower(trim($data['email']));

        $user = User::where('email', $data['email'])->first();

        // Always return success — never reveal whether the email exists
        if (!$user) {
            return response()->json(['ok' => true]);
        }

        $rawToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($rawToken), 'created_at' => now()]
        );

        $resetUrl = config('app.url') . '/reset-password?token=' . $rawToken . '&email=' . urlencode($user->email);

        MailService::passwordReset($user, $resetUrl);

        return response()->json(['ok' => true]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|min:6',
        ]);
        $data['email'] = strtolower(trim($data['email']));

        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or expired reset link.'], 422);
        }

        // Expire after 60 minutes
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            return response()->json(['message' => 'This reset link has expired. Please request a new one.'], 422);
        }

        if (!Hash::check($data['token'], $record->token)) {
            return response()->json(['message' => 'Invalid or expired reset link.'], 422);
        }

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->update(['password_hash' => Hash::make($data['password'])]);

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Admin-only lookup: check if an email belongs to an existing user.
     * Returns only name fields — no sensitive data exposed.
     */
    public function lookup(Request $request)
    {
        $email = strtolower(trim($request->query('email', '')));
        if (!$email) return response()->json(['found' => false]);

        $user = User::where('email', $email)->first();
        if (!$user) return response()->json(['found' => false]);

        return response()->json([
            'found'      => true,
            'full_name'  => $user->full_name,
            'first_name' => explode(' ', $user->full_name)[0],
            'last_name'  => implode(' ', array_slice(explode(' ', $user->full_name), 1)) ?: '',
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id'        => $user->id,
            'email'     => $user->email,
            'full_name' => $user->full_name,
            'role'      => $user->role,
            'club_id'   => $user->club_id,
        ];
    }
}
