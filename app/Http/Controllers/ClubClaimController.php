<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Club;
use App\Models\ClubClaim;
use App\Models\User;
use App\Models\Notification;

class ClubClaimController extends Controller
{
    // Public: submit a claim for a club
    public function store(Request $request, $slug)
    {
        $club = Club::where('slug', $slug)->where('is_public', true)->firstOrFail();

        if ($club->is_claimed) {
            return response()->json(['message' => 'This club has already been claimed.'], 422);
        }

        $alreadyPending = ClubClaim::where('club_id', $club->id)
            ->where('email', $request->input('email'))
            ->where('status', 'pending')
            ->exists();

        if ($alreadyPending) {
            return response()->json(['message' => 'You already have a pending claim for this club.'], 422);
        }

        // Prevent users who already manage a different club from submitting
        $existingManager = User::where('email', $request->input('email'))
            ->whereNotNull('club_id')
            ->where('role', 'club_admin')
            ->first();

        if ($existingManager && $existingManager->club_id !== $club->id) {
            $managedClub = Club::find($existingManager->club_id);
            return response()->json([
                'message' => 'This email already manages ' . ($managedClub?->name ?? 'another club') . '. A manager can only manage one club.',
            ], 422);
        }

        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|max:150',
            'phone'        => 'nullable|string|max:30',
            'role_at_club' => 'nullable|string|max:100',
            'message'      => 'nullable|string|max:1000',
        ]);

        $claim = ClubClaim::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $club->id,
            'status'  => 'pending',
        ]));

        // Notify site admins
        $admins = User::where('role', 'site_admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $admin->id,
                'title'   => "🏟️ Club claim: {$club->name}",
                'body'    => "{$data['name']} ({$data['email']}) wants to manage this club.",
                'link'    => '/site-admin',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['ok' => true], 201);
    }

    // Site admin: list all claims
    public function index(Request $request)
    {
        if ($request->user()->role !== 'site_admin') abort(403);

        return response()->json(
            ClubClaim::with('club:id,name,city,state,slug')
                ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END")
                ->orderByDesc('created_at')
                ->get()
        );
    }

    // Site admin: approve a claim → create user account
    public function approve(Request $request, $id)
    {
        if ($request->user()->role !== 'site_admin') abort(403);

        $claim = ClubClaim::with('club')->where('id', $id)->where('status', 'pending')->firstOrFail();

        // Check if a user with this email already exists
        $existing = User::where('email', $claim->email)->first();
        $tempPassword = null;

        if ($existing) {
            // Block if they already manage a different club
            if ($existing->club_id && $existing->club_id !== $claim->club_id) {
                $managedClub = Club::find($existing->club_id);
                return response()->json([
                    'message' => 'This user already manages ' . ($managedClub?->name ?? 'another club') . '. A manager can only manage one club.',
                ], 422);
            }
            $existing->update([
                'role'    => 'club_admin',
                'club_id' => $claim->club_id,
            ]);
        } else {
            $tempPassword = Str::random(12);
            User::create([
                'id'            => (string) Str::uuid(),
                'email'         => $claim->email,
                'password_hash' => bcrypt($tempPassword),
                'full_name'     => $claim->name,
                'role'          => 'club_admin',
                'club_id'       => $claim->club_id,
            ]);
        }

        // Mark club as claimed
        $claim->club->update(['is_claimed' => true]);

        // Mark claim approved
        $claim->update(['status' => 'approved']);

        return response()->json([
            'ok'           => true,
            'temp_password'=> $tempPassword,
            'email'        => $claim->email,
            'existing_user'=> $existing !== null,
        ]);
    }

    // Site admin: reject a claim
    public function reject(Request $request, $id)
    {
        if ($request->user()->role !== 'site_admin') abort(403);

        $claim = ClubClaim::where('id', $id)->where('status', 'pending')->firstOrFail();
        $claim->update(['status' => 'rejected']);

        return response()->json(['ok' => true]);
    }
}
