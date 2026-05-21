<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Squad;

class SquadController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Squad::where('club_id', $request->user()->club_id)
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

    public function removeAthlete(Request $request, $id, $athleteId)
    {
        $squad = Squad::where('id', $id)->where('club_id', $request->user()->club_id)->firstOrFail();
        $squad->athletes()->detach($athleteId);
        return response()->json(['ok' => true]);
    }
}
