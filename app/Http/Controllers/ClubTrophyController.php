<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\ClubTrophy;
use App\Models\Club;
use App\Services\PlanService;

class ClubTrophyController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();
        if (!$clubId) return response()->json([]);

        return response()->json(
            ClubTrophy::where('club_id', $clubId)
                ->orderByDesc('achieved_at')
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();
        $club   = Club::find($clubId);
        if ($err = PlanService::checkFeature($club, 'trophy_cabinet', 'elite')) return $err;

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'nullable|string|in:competition,award,sponsorship,facility,milestone,other',
            'achieved_at' => 'nullable|date',
            'image_url'   => 'nullable|string',
            'is_public'   => 'boolean',
        ]);

        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();

        $trophy = ClubTrophy::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $clubId,
        ]));

        return response()->json($trophy, 201);
    }

    public function update(Request $request, $id)
    {
        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'nullable|string|in:competition,award,sponsorship,facility,milestone,other',
            'achieved_at' => 'nullable|date',
            'image_url'   => 'nullable|string',
            'is_public'   => 'boolean',
        ]);

        ClubTrophy::where('id', $id)->where('club_id', $clubId)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        $clubId = $request->user()->club_id ?? $request->user()->resolveClubId();
        ClubTrophy::where('id', $id)->where('club_id', $clubId)->delete();
        return response()->json(['ok' => true]);
    }
}
