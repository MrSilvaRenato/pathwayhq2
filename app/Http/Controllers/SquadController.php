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
        $squad = Squad::where('id', $id)->where('club_id', $request->user()->club_id)->firstOrFail();
        return response()->json($squad->athletes);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name'=>'required|string','description'=>'nullable|string']);
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
        $data  = $request->validate(['name'=>'required|string','description'=>'nullable|string']);
        Squad::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Squad::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }
}
