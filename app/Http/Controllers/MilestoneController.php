<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Milestone;
use App\Models\Athlete;
use App\Models\Notification;
use App\Models\Club;
use App\Services\PlanService;

class MilestoneController extends Controller
{
    public function index(Request $request)
    {
        $user   = $request->user();
        $clubId = $user->resolveClubId();
        if (!$clubId) return response()->json([]);

        $query = Milestone::where('club_id', $clubId)
            ->with([
                'athlete:id,first_name,last_name,ftem_phase,is_active,user_id,avatar_url',
                'club:id,name,sport',
            ])
            ->orderBy('achieved_at', 'desc');

        // Athletes only see their own milestones
        if ($user->role === 'athlete') {
            $athlete = \App\Models\Athlete::where('user_id', $user->id)->where('invite_status', 'accepted')->where('is_active', true)->first();
            if ($athlete) {
                $query->where('athlete_id', $athlete->id);
            } else {
                return response()->json([]);
            }
        }

        return response()->json(
            $query->get()->map(function ($m) {
                $m->first_name   = $m->athlete?->first_name;
                $m->last_name    = $m->athlete?->last_name;
                $m->avatar_url   = $m->athlete?->avatar_url;
                $m->athlete_ftem = $m->athlete?->ftem_phase;
                $m->is_claimed   = !is_null($m->athlete?->user_id);
                $m->club_name    = $m->club?->name;
                unset($m->athlete, $m->club);
                return $m;
            })
        );
    }

    public function store(Request $request)
    {
        $club = Club::find($request->user()->resolveClubId());
        if ($err = PlanService::checkFeature($club, 'milestones')) return $err;

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
            'club_id' => $request->user()->resolveClubId(),
        ]));

        // Notify the athlete if their user account is linked
        if (!empty($data['athlete_id'])) {
            $athlete = Athlete::find($data['athlete_id']);
            if ($athlete && $athlete->user_id) {
                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $athlete->user_id,
                    'title'   => '🏆 New milestone: ' . $data['title'],
                    'body'    => 'Your coach recorded a new milestone for you.',
                    'link'    => '/milestones',
                    'is_read' => false,
                    'at'      => now()->toDateTimeString(),
                ]);
            }
        }

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

        Milestone::where('id', $id)->where('club_id', $request->user()->resolveClubId())->update($data);
        return response()->json(['ok' => true]);
    }

    public function byAthlete(Request $request, $id)
    {
        return response()->json(
            Milestone::where('club_id', $request->user()->resolveClubId())
                ->where('athlete_id', $id)
                ->orderBy('achieved_at', 'desc')
                ->get()
        );
    }

    public function destroy(Request $request, $id)
    {
        Milestone::where('id', $id)->where('club_id', $request->user()->resolveClubId())->delete();
        return response()->json(['ok' => true]);
    }
}
