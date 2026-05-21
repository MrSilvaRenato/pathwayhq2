<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Athlete;
use App\Models\User;
use App\Models\Notification;
use App\Mail\AthleteInvite;
use Illuminate\Support\Facades\Mail;

class AthleteController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->club_id;
        if (!$clubId) return response()->json([]);

        $query = Athlete::where('club_id', $clubId)
            ->where('invite_status', '!=', 'rejected')
            ->with(['squads:id,name', 'user:id,phone,email'])
            ->orderBy('last_name')->orderBy('first_name');

        // Server-side filtering
        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('invite_email', 'like', "%{$q}%");
            });
        }

        if ($phase = $request->query('phase')) {
            $query->where('ftem_phase', $phase);
        }

        if ($squadId = $request->query('squad_id')) {
            $query->whereHas('squads', fn($sq) => $sq->where('squads.id', $squadId));
        }

        if ($request->query('is_active') !== null) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $mapAthlete = function ($a) {
            $a->squad_ids     = $a->squads->pluck('id')->join(',');
            $a->squad_names   = $a->squads->pluck('name')->join(', ');
            $a->is_claimed    = !is_null($a->user_id);
            $a->contact_phone = $a->user?->phone ?? $a->phone;
            $a->contact_email = $a->user?->email ?? $a->invite_email;
            unset($a->squads, $a->user);
            return $a;
        };

        // Pagination — opt-in. If per_page param present (and paginate != 'false'), paginate.
        $perPage = $request->query('per_page');
        $paginate = $request->query('paginate', 'true');

        if ($perPage !== null && $paginate !== 'false') {
            $perPage = max(1, min(200, (int) $perPage));
            $page    = max(1, (int) $request->query('page', 1));

            $total   = $query->count();
            $athletes = $query->forPage($page, $perPage)->get()->map($mapAthlete);

            return response()->json([
                'data'        => $athletes,
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ]);
        }

        // Backward-compatible flat array (React web app path)
        $athletes = $query->get()->map($mapAthlete);
        return response()->json($athletes);
    }

    public function show(Request $request, $id)
    {
        $athlete = Athlete::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->with(['squads:id,name', 'user:id,phone,email'])
            ->firstOrFail();

        $athlete->squad_names   = $athlete->squads->pluck('name')->join(', ');
        $athlete->is_claimed    = !is_null($athlete->user_id);
        $athlete->contact_phone = $athlete->user?->phone ?? $athlete->phone;
        $athlete->contact_email = $athlete->user?->email ?? $athlete->invite_email;
        unset($athlete->user);

        return response()->json($athlete);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'   => 'required|string',
            'last_name'    => 'required|string',
            'dob'          => 'nullable|date',
            'sport'        => 'nullable|string',
            'gender'       => 'nullable|string',
            'ftem_phase'   => 'nullable|string',
            'notes'        => 'nullable|string',
            'phone'        => 'nullable|string|max:20',
            'squad_ids'    => 'nullable|array',
            'invite_email' => 'nullable|email',
        ]);

        $club    = $request->user()->club;
        $userId  = null;
        $inviteToken = null;
        $inviteEmail = $data['invite_email'] ?? null;
        $status  = 'no_invite';

        $inviteStatus = 'accepted'; // default for no-email adds

        if ($inviteEmail) {
            $existingUser = User::where('email', $inviteEmail)->first();

            if ($existingUser) {
                // Existing user — require their consent before linking
                $userId       = $existingUser->id;
                $status       = 'pending';
                $inviteStatus = 'pending';

                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $existingUser->id,
                    'title'   => "🏟️ {$club->name} wants to add you as an athlete",
                    'body'    => "Accept to join their roster and see your development pathway, sessions, and milestones. You can decline if this wasn't expected.",
                    'link'    => '/dashboard',
                    'is_read' => false,
                    'at'      => now()->toDateTimeString(),
                ]);
            } else {
                // New user — send email invite to create account & claim profile
                $inviteToken  = Str::random(48);
                $status       = 'invited';
                $inviteStatus = 'pending';

                Mail::to($inviteEmail)->send(
                    new AthleteInvite(
                        $data['first_name'],
                        $data['last_name'],
                        $club->name,
                        $inviteToken
                    )
                );
            }
        }

        $athlete = Athlete::create([
            'id'            => (string) Str::uuid(),
            'club_id'       => $request->user()->club_id,
            'user_id'       => $userId,
            'first_name'    => $data['first_name'],
            'last_name'     => $data['last_name'],
            'dob'           => $data['dob']    ?? null,
            'sport'         => $data['sport']  ?? 'soccer',
            'gender'        => $data['gender'] ?? 'male',
            'ftem_phase'    => $data['ftem_phase'] ?? 'F1',
            'notes'         => $data['notes']  ?? null,
            'phone'         => $data['phone']  ?? null,
            'invite_email'  => $inviteEmail,
            'invite_token'  => $inviteToken,
            'invite_status' => $inviteStatus,
            'is_active'     => true,
        ]);

        if (!empty($data['squad_ids'])) {
            $athlete->squads()->sync($data['squad_ids']);
        }

        return response()->json([
            'athlete' => $athlete,
            'status'  => $status, // 'linked' | 'invited' | 'no_invite'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $athlete = Athlete::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->first();

        if (!$athlete) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $data = $request->validate([
            'first_name'   => 'required|string',
            'last_name'    => 'required|string',
            'dob'          => 'nullable|date',
            'sport'        => 'nullable|string',
            'gender'       => 'nullable|string',
            'ftem_phase'   => 'nullable|string',
            'is_active'    => 'boolean',
            'notes'        => 'nullable|string',
            'phone'        => 'nullable|string|max:20',
            'squad_ids'    => 'nullable|array',
        ]);

        $athlete->update($data);

        if (isset($data['squad_ids'])) {
            $athlete->squads()->sync($data['squad_ids']);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $affected = Athlete::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->delete();

        if (!$affected) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    // Returns the accepted athlete profile linked to the current user
    public function me(Request $request)
    {
        $athlete = Athlete::where('user_id', $request->user()->id)
            ->where('invite_status', 'accepted')
            ->with('squads:id,name')
            ->first();

        if (!$athlete) return response()->json(null);

        $athlete->squad_names = $athlete->squads->pluck('name')->join(', ');
        $athlete->is_claimed  = true;
        unset($athlete->squads);

        return response()->json($athlete);
    }

    // Returns pending club invites for the current athlete user
    public function invites(Request $request)
    {
        $pending = Athlete::where('user_id', $request->user()->id)
            ->where('invite_status', 'pending')
            ->with('club:id,name,sport,city')
            ->get()
            ->map(function ($a) {
                return [
                    'id'         => $a->id,
                    'club_name'  => $a->club->name ?? 'Unknown club',
                    'club_city'  => $a->club->city ?? null,
                    'first_name' => $a->first_name,
                    'last_name'  => $a->last_name,
                    'ftem_phase' => $a->ftem_phase,
                ];
            });

        return response()->json($pending);
    }

    // Athlete accepts a club invite
    public function acceptInvite(Request $request, $id)
    {
        $athlete = Athlete::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('invite_status', 'pending')
            ->firstOrFail();

        $athlete->update(['invite_status' => 'accepted']);

        return response()->json(['ok' => true]);
    }

    // Athlete declines a club invite — removes the profile record
    public function rejectInvite(Request $request, $id)
    {
        $athlete = Athlete::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('invite_status', 'pending')
            ->firstOrFail();

        $athlete->delete();

        return response()->json(['ok' => true]);
    }

    // Called when an athlete clicks the invite link and creates an account
    public function claim(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
        ]);

        $athlete = Athlete::where('invite_token', $data['token'])->first();

        if (!$athlete) {
            return response()->json(['message' => 'Invalid or expired invite link.'], 404);
        }

        if ($athlete->user_id) {
            return response()->json(['message' => 'This profile has already been claimed.'], 409);
        }

        // Link the currently authenticated user to this athlete profile
        $athlete->user_id      = $request->user()->id;
        $athlete->invite_token = null; // consume the token
        $athlete->save();

        return response()->json(['ok' => true, 'athlete_id' => $athlete->id]);
    }
}
