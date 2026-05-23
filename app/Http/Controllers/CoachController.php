<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Club;
use App\Models\Notification;

class CoachController extends Controller
{
    // List coaches for my club
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $clubId = $request->user()->club_id;
        $coaches = User::where('club_id', $clubId)
            ->where('role', 'coach')
            ->select('id', 'full_name', 'email', 'phone', 'created_at')
            ->orderBy('full_name')
            ->get();

        return response()->json($coaches);
    }

    // Invite / create a coach for my club
    public function store(Request $request)
    {
        if ($request->user()->role !== 'club_admin') abort(403);

        $data = $request->validate([
            'email'     => 'required|email',
            'full_name' => 'required|string|max:100',
        ]);

        $myClubId = $request->user()->club_id;
        $existing = User::where('email', $data['email'])->first();

        if ($existing) {
            // Block if they manage or coach at a different club
            if ($existing->club_id && $existing->club_id !== $myClubId) {
                $other = Club::find($existing->club_id);
                return response()->json([
                    'message' => 'This user already belongs to ' . ($other?->name ?? 'another club') . '.',
                ], 422);
            }
            if ($existing->role === 'site_admin') {
                return response()->json(['message' => 'This user is a platform admin and cannot be assigned as a coach.'], 422);
            }

            $existing->update(['role' => 'coach', 'club_id' => $myClubId]);

            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $existing->id,
                'title'   => '🏅 You have been added as a coach',
                'body'    => Club::find($myClubId)?->name . ' has given you coach access.',
                'link'    => '/dashboard',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);

            return response()->json(['ok' => true, 'existing' => true]);
        }

        $tempPassword = Str::random(12);
        $coach = User::create([
            'id'            => (string) Str::uuid(),
            'email'         => $data['email'],
            'full_name'     => $data['full_name'],
            'password_hash' => Hash::make($tempPassword),
            'role'          => 'coach',
            'club_id'       => $myClubId,
        ]);

        return response()->json([
            'ok'           => true,
            'existing'     => false,
            'temp_password'=> $tempPassword,
            'email'        => $coach->email,
        ], 201);
    }

    // Remove a coach from my club (demotes to athlete role, clears club_id)
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'club_admin') abort(403);

        $coach = User::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->where('role', 'coach')
            ->firstOrFail();

        $coach->update(['role' => 'athlete', 'club_id' => null]);

        return response()->json(['ok' => true]);
    }
}
