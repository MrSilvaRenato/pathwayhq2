<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use App\Models\Club;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:6',
            'full_name'  => 'required|string',
            'club_name'  => 'required|string',
            'sport'      => 'nullable|string',
            'city'       => 'nullable|string',
            'state'      => 'nullable|string',
        ]);

        $clubId = (string) Str::uuid();
        $slug   = Str::slug($data['club_name']);

        $club = Club::create([
            'id'    => $clubId,
            'name'  => $data['club_name'],
            'sport' => $data['sport'] ?? 'soccer',
            'city'  => $data['city']  ?? null,
            'state' => $data['state'] ?? null,
            'slug'  => $slug,
        ]);

        $user = User::create([
            'id'           => (string) Str::uuid(),
            'club_id'      => $clubId,
            'email'        => $data['email'],
            'password_hash'=> Hash::make($data['password']),
            'full_name'    => $data['full_name'],
            'role'         => 'club_admin',
        ]);

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
