<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Squad;
use App\Models\Athlete;
use App\Models\User;
use App\Models\Notification;

class SquadController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();
        return response()->json(
            Squad::where('club_id', $clubId)
                ->withCount('athletes')
                ->orderBy('name')->get()
        );
    }

    public function athletes(Request $request, $id)
    {
        $squad = Squad::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $athletes = $squad->athletes()
            ->with('user:id,phone,email')
            ->orderBy('last_name')->orderBy('first_name')
            ->get()
            ->map(function ($a) {
                return [
                    'id'            => $a->id,
                    'first_name'    => $a->first_name,
                    'last_name'     => $a->last_name,
                    'ftem_phase'    => $a->ftem_phase,
                    'is_active'     => $a->is_active,
                    'sport'         => $a->sport,
                    'dob'           => $a->dob,
                    'contact_phone' => $a->user?->phone ?? $a->phone,
                    'contact_email' => $a->user?->email ?? $a->invite_email,
                    'invite_status' => $a->invite_status,
                ];
            });

        return response()->json($athletes);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string', 'description' => 'nullable|string']);
        $squad = Squad::create([
            'id'          => (string) Str::uuid(),
            'club_id'     => $request->user()->club_id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
        ]);
        return response()->json($squad, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate(['name' => 'required|string', 'description' => 'nullable|string']);
        Squad::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Squad::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }

    public function addAthlete(Request $request, $id)
    {
        $data  = $request->validate(['athlete_id' => 'required|string']);
        $squad = Squad::where('id', $id)->where('club_id', $request->user()->club_id)->firstOrFail();

        // Verify athlete belongs to the same club
        Athlete::where('id', $data['athlete_id'])
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $squad->athletes()->syncWithoutDetaching([$data['athlete_id']]);
        return response()->json(['ok' => true]);
    }

    public function removeAthlete(Request $request, $id, $athleteId)
    {
        $squad = Squad::where('id', $id)->where('club_id', $request->user()->club_id)->firstOrFail();
        $squad->athletes()->detach($athleteId);
        return response()->json(['ok' => true]);
    }

    // Athlete requests to join/transfer to a squad
    public function requestSquadChange(Request $request, $id)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $user = $request->user();

        $athlete = Athlete::where('user_id', $user->id)
            ->where('invite_status', 'accepted')
            ->firstOrFail();

        $squad = Squad::where('id', $id)->where('club_id', $athlete->club_id)->firstOrFail();

        $admins = User::where('club_id', $athlete->club_id)
            ->whereIn('role', ['club_admin', 'coach'])
            ->get();

        $reason = !empty($data['reason']) ? ' — "' . $data['reason'] . '"' : '';
        foreach ($admins as $admin) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $admin->id,
                'title'   => "🔄 Squad request: {$athlete->first_name} {$athlete->last_name}",
                'body'    => "Wants to join: {$squad->name}{$reason}",
                'link'    => '/squads',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
