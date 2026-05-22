<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\SquadRequest;
use App\Models\Squad;
use App\Models\Athlete;
use App\Models\Notification;

class SquadRequestController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->club_id;
        if (!$clubId) return response()->json([]);

        return response()->json(
            SquadRequest::where('club_id', $clubId)
                ->where('status', 'pending')
                ->with([
                    'athlete:id,first_name,last_name,ftem_phase',
                    'squad:id,name',
                ])
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function approve(Request $request, $id)
    {
        $clubId = $request->user()->club_id;
        $sr     = SquadRequest::where('id', $id)
            ->where('club_id', $clubId)
            ->where('status', 'pending')
            ->firstOrFail();

        $newSquad    = Squad::find($sr->squad_id);
        $clubSquadIds = Squad::where('club_id', $clubId)->pluck('id')->toArray();

        // Remove athlete from every current squad in this club, then add to the new one
        \DB::table('squad_athletes')
            ->where('athlete_id', $sr->athlete_id)
            ->whereIn('squad_id', $clubSquadIds)
            ->delete();
        $newSquad->athletes()->attach($sr->athlete_id);

        $sr->update(['status' => 'approved']);

        $athlete = Athlete::find($sr->athlete_id);
        if ($athlete?->user_id) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => "✅ Squad request approved",
                'body'    => "You've been added to {$newSquad->name}.",
                'link'    => '/dashboard',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function reject(Request $request, $id)
    {
        $clubId = $request->user()->club_id;
        $sr     = SquadRequest::where('id', $id)
            ->where('club_id', $clubId)
            ->where('status', 'pending')
            ->firstOrFail();

        $squad = Squad::find($sr->squad_id);
        $sr->update(['status' => 'rejected']);

        $athlete = Athlete::find($sr->athlete_id);
        if ($athlete?->user_id) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => "❌ Squad request declined",
                'body'    => "Your request to join {$squad->name} was not approved.",
                'link'    => '/dashboard',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
