<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Athlete;

class AthleteController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->club_id;
        if (!$clubId) return response()->json([]);

        $athletes = Athlete::where('club_id', $clubId)
            ->with('squads:id,name')
            ->orderBy('last_name')->orderBy('first_name')
            ->get()
            ->map(function ($a) {
                $a->squad_ids   = $a->squads->pluck('id')->join(',');
                $a->squad_names = $a->squads->pluck('name')->join(', ');
                unset($a->squads);
                return $a;
            });

        return response()->json($athletes);
    }

    public function show(Request $request, $id)
    {
        $athlete = Athlete::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->with('squads:id,name')
            ->firstOrFail();

        $athlete->squad_names = $athlete->squads->pluck('name')->join(', ');

        return response()->json($athlete);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'dob'        => 'nullable|date',
            'sport'      => 'nullable|string',
            'gender'     => 'nullable|string',
            'ftem_phase' => 'nullable|string',
            'notes'      => 'nullable|string',
            'squad_ids'  => 'nullable|array',
        ]);

        $athlete = Athlete::create([
            'id'         => (string) Str::uuid(),
            'club_id'    => $request->user()->club_id,
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'dob'        => $data['dob'] ?? null,
            'sport'      => $data['sport'] ?? 'soccer',
            'gender'     => $data['gender'] ?? 'male',
            'ftem_phase' => $data['ftem_phase'] ?? 'F1',
            'notes'      => $data['notes'] ?? null,
            'is_active'  => true,
        ]);

        if (!empty($data['squad_ids'])) {
            $athlete->squads()->sync($data['squad_ids']);
        }

        return response()->json($athlete, 201);
    }

    public function update(Request $request, $id)
    {
        $athlete = Athlete::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $data = $request->validate([
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'dob'        => 'nullable|date',
            'sport'      => 'nullable|string',
            'gender'     => 'nullable|string',
            'ftem_phase' => 'nullable|string',
            'is_active'  => 'boolean',
            'notes'      => 'nullable|string',
            'squad_ids'  => 'nullable|array',
        ]);

        $athlete->update($data);

        if (isset($data['squad_ids'])) {
            $athlete->squads()->sync($data['squad_ids']);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Athlete::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }
}
