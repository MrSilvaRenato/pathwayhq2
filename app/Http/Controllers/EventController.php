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
        $user   = $request->user();
        $clubId = $user->resolveClubId();
        if (!$clubId) return response()->json([]);

        $userId = $user->id;

        $query = Event::where('club_id', $clubId)
            ->with([
                'squad:id,name',
                'rsvps' => fn($q) => $q->select('id','event_id','user_id','status'),
            ])
            ->orderBy('start_time', 'asc');

        // Athletes see their squad's events + club-wide events.
        // If not yet assigned to any squad, show all club events so new members aren't left blank.
        if ($user->role === 'athlete') {
            $athlete  = Athlete::where('user_id', $userId)->where('invite_status', 'accepted')->where('is_active', true)->first();
            $squadIds = $athlete ? $athlete->squads()->pluck('squads.id')->toArray() : [];
            if (!empty($squadIds)) {
                $query->where(function ($q) use ($squadIds) {
                    $q->whereNull('squad_id')->orWhereIn('squad_id', $squadIds);
                });
            }
            // If athlete has no squad assignments yet, no additional filter — show all club events
        }

        return response()->json(
            $query->get()
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
            'title'        => 'required|string',
            'description'  => 'nullable|string',
            'location'     => 'nullable|string',
            'start_time'   => 'required|date',
            'end_time'     => 'nullable|date',
            'event_type'   => 'nullable|string',
            'squad_id'     => 'nullable|string',
            'recurrence'   => 'nullable|in:none,daily,weekly,biweekly,monthly',
            'repeat_until' => 'nullable|date',
        ]);

        $clubId = $request->user()->club_id;

        $recurrence  = $data['recurrence'] ?? 'none';
        $seriesId    = ($recurrence && $recurrence !== 'none') ? (string) Str::uuid() : null;
        $startTime   = new \DateTime($data['start_time']);
        $endTime     = !empty($data['end_time']) ? new \DateTime($data['end_time']) : null;
        $duration    = $endTime ? $startTime->diff($endTime) : null;
        $repeatUntil = !empty($data['repeat_until']) ? new \DateTime($data['repeat_until']) : null;

        $occurrences = [];
        if ($recurrence === 'none' || !$repeatUntil) {
            $occurrences[] = clone $startTime;
        } else {
            $cur = clone $startTime; $count = 0;
            while ($cur <= $repeatUntil && $count < 104) {
                $occurrences[] = clone $cur;
                match($recurrence) {
                    'daily'    => $cur->modify('+1 day'),
                    'weekly'   => $cur->modify('+1 week'),
                    'biweekly' => $cur->modify('+2 weeks'),
                    'monthly'  => $cur->modify('+1 month'),
                    default    => $cur->modify('+999 years'),
                };
                $count++;
            }
        }

        $firstEventId = null;
        foreach ($occurrences as $i => $occ) {
            $occEnd = ($duration && $endTime) ? (clone $occ)->add($duration) : null;
            $event = Event::create([
                'id'          => (string) Str::uuid(),
                'club_id'     => $clubId,
                'title'       => $data['title'],
                'description' => $data['description'] ?? null,
                'location'    => $data['location'] ?? null,
                'start_time'  => $occ->format('Y-m-d H:i:s'),
                'end_time'    => $occEnd ? $occEnd->format('Y-m-d H:i:s') : null,
                'event_type'  => $data['event_type'] ?? 'training',
                'squad_id'    => $data['squad_id'] ?? null,
                'series_id'   => $seriesId,
                'recurrence'  => $recurrence !== 'none' ? $recurrence : null,
            ]);
            if ($i === 0) $firstEventId = $event->id;
        }

        // Notify relevant linked athletes — once per series
        $athleteQuery = Athlete::where('club_id', $clubId)->whereNotNull('user_id');
        if (!empty($data['squad_id'])) {
            $athleteQuery->whereHas('squads', fn($q) => $q->where('squads.id', $data['squad_id']));
        }
        $athletes = $athleteQuery->get();

        $totalSessions = count($occurrences);
        $dateStr = date('D j M', strtotime($data['start_time']));
        $suffix  = $totalSessions > 1 ? " ({$totalSessions} sessions)" : '';

        foreach ($athletes as $athlete) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => '📅 New session: ' . $data['title'] . $suffix,
                'body'    => $dateStr . ($data['location'] ? ' · ' . $data['location'] : ''),
                'link'    => '/calendar',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        return response()->json(['id' => $firstEventId, 'count' => $totalSessions], 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'start_time'  => 'nullable|date',
            'end_time'    => 'nullable|date',
            'event_type'  => 'nullable|string',
            'squad_id'    => 'nullable|string',
            'series_id'   => 'nullable|string',
            'recurrence'  => 'nullable|string',
        ]);

        $clubId = $request->user()->resolveClubId();

        if ($request->query('series') === 'true') {
            // Find the event to get its series_id
            $event = Event::where('id', $id)->where('club_id', $clubId)->first();
            if (!$event || !$event->series_id) {
                // Fallback: just update the single event
                Event::where('id', $id)->where('club_id', $clubId)->update($data);
                return response()->json(['ok' => true]);
            }

            // For series bulk-edit: update shared fields only.
            // Preserve each occurrence's own start_time / end_time.
            $sharedFields = array_filter([
                'title'       => $data['title'],
                'description' => $data['description'] ?? null,
                'location'    => $data['location']    ?? null,
                'event_type'  => $data['event_type']  ?? null,
                'squad_id'    => $data['squad_id']    ?? null,
            ], fn($v) => $v !== null);

            Event::where('series_id', $event->series_id)
                 ->where('club_id', $clubId)
                 ->update($sharedFields);
        } else {
            Event::where('id', $id)->where('club_id', $clubId)->update($data);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::where('id', $id)->where('club_id', $request->user()->club_id)->first();
        if (!$event) return response()->json(['error' => 'Not found'], 404);

        if ($request->query('series') === 'true' && $event->series_id) {
            Event::where('series_id', $event->series_id)
                 ->where('club_id', $request->user()->club_id)
                 ->delete();
        } else {
            $event->delete();
        }
        return response()->json(['ok' => true]);
    }

    public function attendees(Request $request, $id)
    {
        // Verify event belongs to this club
        $clubId = $request->user()->resolveClubId();
        $event  = Event::where('id', $id)->where('club_id', $clubId)->firstOrFail();

        $rsvps = EventRsvp::where('event_id', $id)
            ->with('user:id,full_name,email')
            ->get();

        // Pre-fetch avatars for all users in one query
        $userIds = $rsvps->pluck('user_id')->filter()->unique()->values();
        $avatars = \App\Models\Athlete::whereIn('user_id', $userIds)
            ->whereNotNull('avatar_url')
            ->get(['user_id', 'avatar_url'])
            ->keyBy('user_id');

        $grouped = ['yes' => [], 'maybe' => [], 'no' => []];
        foreach ($rsvps as $r) {
            $status = $r->status;
            if (!isset($grouped[$status])) continue;
            $grouped[$status][] = [
                'name'       => $r->user?->full_name ?? 'Unknown',
                'email'      => $r->user?->email ?? '',
                'avatar_url' => $avatars[$r->user_id]?->avatar_url ?? null,
                'initials'   => collect(explode(' ', $r->user?->full_name ?? '?'))
                    ->map(fn($w) => strtoupper($w[0] ?? ''))
                    ->implode(''),
            ];
        }

        return response()->json([
            'event'   => ['id' => $event->id, 'title' => $event->title, 'start_time' => $event->start_time, 'squad_name' => $event->squad?->name],
            'yes'     => $grouped['yes'],
            'maybe'   => $grouped['maybe'],
            'no'      => $grouped['no'],
            'total'   => count($rsvps),
        ]);
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
