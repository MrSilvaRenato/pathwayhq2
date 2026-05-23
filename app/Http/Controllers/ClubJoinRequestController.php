<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Club;
use App\Models\ClubJoinRequest;
use App\Models\Athlete;
use App\Models\User;
use App\Models\Notification;

class ClubJoinRequestController extends Controller
{
    // Athlete submits a request to join a club (auth required)
    public function store(Request $request, $slug)
    {
        $club = Club::where('slug', $slug)->where('is_public', true)->firstOrFail();

        $user = $request->user();

        // Already a member at this club?
        $alreadyMember = Athlete::where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->where('invite_status', 'accepted')
            ->where('is_active', true)
            ->exists();

        if ($alreadyMember) {
            return response()->json(['message' => 'You are already a member of this club.'], 422);
        }

        // Already has a pending/approved request?
        $existing = ClubJoinRequest::where('club_id', $club->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => match($existing->status) {
                    'pending'  => 'You already have a pending request for this club.',
                    'approved' => 'Your request has already been approved.',
                    'rejected' => 'Your previous request was not accepted. Contact the club directly.',
                    default    => 'Request already exists.',
                },
            ], 422);
        }

        $data = $request->validate(['message' => 'nullable|string|max:500']);

        ClubJoinRequest::create([
            'id'      => (string) Str::uuid(),
            'club_id' => $club->id,
            'user_id' => $user->id,
            'message' => $data['message'] ?? null,
            'status'  => 'pending',
        ]);

        // Notify club admins and coaches
        $staff = User::where('club_id', $club->id)
            ->whereIn('role', ['club_admin', 'coach'])
            ->get();

        $name = $user->full_name ?? $user->email;
        foreach ($staff as $s) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $s->id,
                'title'   => "🙋 {$name} wants to join {$club->name}",
                'body'    => 'Review their request and approve or reject.',
                'link'    => '/join-requests',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['ok' => true], 201);
    }

    // Get current user's status for a specific club
    public function myStatus(Request $request, $slug)
    {
        $club = Club::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $isMember = Athlete::where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->where('invite_status', 'accepted')
            ->where('is_active', true)
            ->exists();

        if ($isMember) return response()->json(['status' => 'member']);

        $req = ClubJoinRequest::where('club_id', $club->id)
            ->where('user_id', $user->id)
            ->first();

        return response()->json(['status' => $req?->status ?? null]);
    }

    // Club admin / coach: list join requests
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $clubId = $request->user()->club_id;

        $requests = ClubJoinRequest::where('club_id', $clubId)
            ->with('user:id,full_name,email,phone')
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END")
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    // Club admin: approve — creates Athlete record
    public function approve(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $jr = ClubJoinRequest::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->where('status', 'pending')
            ->with('user', 'club')
            ->firstOrFail();

        // Create athlete record from user's name
        $parts     = explode(' ', trim($jr->user->full_name ?? 'Unknown'), 2);
        $firstName = $parts[0];
        $lastName  = $parts[1] ?? '';

        $baseSlug = Str::slug($firstName . '-' . $lastName);
        $slug     = $baseSlug;
        $i        = 1;
        while (Athlete::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }

        Athlete::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => $jr->club_id,
            'user_id'       => $jr->user_id,
            'first_name'    => $firstName,
            'last_name'     => $lastName,
            'sport'         => $jr->club->sport ?? 'soccer',
            'ftem_phase'    => 'F1',
            'invite_status' => 'accepted',
            'is_active'     => true,
            'slug'          => $slug,
            'is_public'     => false,
        ]);

        $jr->update(['status' => 'approved', 'responded_at' => now()]);

        // Notify athlete
        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $jr->user_id,
            'title'   => "✅ {$jr->club->name} approved your join request!",
            'body'    => "You're now on their roster. Welcome to the club!",
            'link'    => '/dashboard',
            'is_read' => false,
            'at'      => now()->toDateTimeString(),
        ]);

        return response()->json(['ok' => true]);
    }

    // Club admin: reject
    public function reject(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $jr = ClubJoinRequest::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->where('status', 'pending')
            ->with('club')
            ->firstOrFail();

        $jr->update(['status' => 'rejected', 'responded_at' => now()]);

        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $jr->user_id,
            'title'   => "Your request to join {$jr->club->name} was not accepted",
            'body'    => 'Contact the club directly if you have questions.',
            'link'    => '/clubs',
            'is_read' => false,
            'at'      => now()->toDateTimeString(),
        ]);

        return response()->json(['ok' => true]);
    }
}
