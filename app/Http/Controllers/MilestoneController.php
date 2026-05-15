<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Milestone;

class MilestoneController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Milestone::where('club_id', $request->user()->club_id)
                ->orderBy('achieved_at', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'athlete_id'           => 'nullable|string',
            'title'                => 'required|string',
            'description'          => 'nullable|string',
            'ftem_phase'           => 'nullable|string',
            'achieved_at'          => 'nullable|date',
            'is_shared_with_parent'=> 'boolean',
        ]);

        $milestone = Milestone::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $request->user()->club_id,
        ]));

        return response()->json($milestone, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'athlete_id'           => 'nullable|string',
            'title'                => 'required|string',
            'description'          => 'nullable|string',
            'ftem_phase'           => 'nullable|string',
            'achieved_at'          => 'nullable|date',
            'is_shared_with_parent'=> 'boolean',
        ]);

        Milestone::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Milestone::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }
}
