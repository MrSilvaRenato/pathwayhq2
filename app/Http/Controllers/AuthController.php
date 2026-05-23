<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use App\Models\Athlete;
use App\Models\Notification;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'email'     => 'required|email|unique:users',
            'password'  => 'required|min:6',
            'full_name' => 'required|string',
        ]);

        $user = User::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => null,
            'email'         => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'full_name'     => $data['full_name'],
            'role'          => 'athlete',
        ]);

        // Auto-link any pending club invites sent to this email before they had an account
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

    /**
     * Admin-only lookup: check if an email belongs to an existing user.
     * Returns only name fields — no sensitive data exposed.
     */
    public function lookup(Request $request)
    {
        $email = $request->query('email');
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
