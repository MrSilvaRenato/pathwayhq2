<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Athlete;
use App\Models\Notification;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->resolveClubId();
        if (!$clubId) return response()->json([]);

        $userId = $request->user()->id;

        return response()->json(
            Event::where('club_id', $clubId)
                ->with([
                    'squad:id,name',
                    'rsvps' => fn($q) => $q->select('id','event_id','user_id','status'),
                ])
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function($e) use ($userId) {
                    $e->squad_name = $e->squad?->name;
                    unset($e->squad);

                    $myRsvp = $e->rsvps->firstWhere('user_id', $userId);
                    $e->my_rsvp_status = $myRsvp?->status;

                    $e->rsvp_counts = [
                        'yes'   => $e->rsvps->where('status', 'yes')->count(),
                        'maybe' => $e->rsvps->where('status', 'maybe')->count(),
                        'no'    => $e->rsvps->where('status', 'no')->count(),
                    ];

                    unset($e->rsvps);
                    return $e;
                })
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'start_time'  => 'required|date',
            'end_time'    => 'nullable|date',
            'event_type'  => 'nullable|string',
            'squad_id'    => 'nullable|string',
        ]);

        $clubId = $request->user()->club_id;

        $event = Event::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $clubId,
        ]));

        // Notify all linked athletes in this club
        $athletes = Athlete::where('club_id', $clubId)
            ->whereNotNull('user_id')->get();

        $dateStr = date('D j M', strtotime($data['start_time']));
        foreach ($athletes as $athlete) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => '📅 New session: ' . $data['title'],
                'body'    => $dateStr . ($data['location'] ? ' · ' . $data['location'] : ''),
                'link'    => '/calendar',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['id' => $event->id], 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'start_time'  => 'required|date',
            'end_time'    => 'nullable|date',
            'event_type'  => 'nullable|string',
            'squad_id'    => 'nullable|string',
        ]);

        Event::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Event::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }

    public function rsvp(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|in:yes,no,maybe',
        ]);

        $user = $request->user();

        EventRsvp::updateOrCreate(
            ['event_id' => $id, 'user_id' => $user->id],
            ['id' => (string) Str::uuid(), 'status' => $data['status']]
        );

        return response()->json(['ok' => true]);
    }
}
