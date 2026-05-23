<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Season;
use App\Models\SeasonRegistration;

class SeasonController extends Controller
{
    // Club admin: list my seasons
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $seasons = Season::where('club_id', $request->user()->club_id)
            ->withCount('registrations')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($s) {
                $s->paid_count = SeasonRegistration::where('season_id', $s->id)
                    ->whereIn('status', ['paid', 'manual_confirmed'])
                    ->count();
                return $s;
            });

        return response()->json($seasons);
    }

    // Public: list open seasons for a club (shown on public profile)
    public function publicList($slug)
    {
        $seasons = Season::whereHas('club', fn($q) => $q->where('slug', $slug)->where('is_public', true))
            ->where('status', 'open')
            ->select('id', 'name', 'description', 'start_date', 'end_date', 'registration_deadline', 'fee_cents', 'currency')
            ->orderBy('start_date')
            ->get();

        return response()->json($seasons);
    }

    // Club admin: create season
    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'description'           => 'nullable|string',
            'start_date'            => 'nullable|date',
            'end_date'              => 'nullable|date|after_or_equal:start_date',
            'registration_deadline' => 'nullable|date',
            'fee_cents'             => 'required|integer|min:0',
            'status'                => 'in:draft,open,closed',
        ]);

        $season = Season::create(array_merge($data, [
            'id'       => (string) Str::uuid(),
            'club_id'  => $request->user()->club_id,
            'status'   => $data['status'] ?? 'draft',
            'currency' => 'AUD',
        ]));

        return response()->json($season, 201);
    }

    // Club admin: update season
    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $season = Season::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'description'           => 'nullable|string',
            'start_date'            => 'nullable|date',
            'end_date'              => 'nullable|date',
            'registration_deadline' => 'nullable|date',
            'fee_cents'             => 'required|integer|min:0',
            'status'                => 'in:draft,open,closed',
        ]);

        $season->update($data);

        return response()->json(['ok' => true]);
    }

    // Club admin: delete season
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'club_admin') abort(403);

        Season::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail()
            ->delete();

        return response()->json(['ok' => true]);
    }

    // Club admin: get single season with registrations
    public function show(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $season = Season::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $registrations = SeasonRegistration::where('season_id', $id)
            ->with('athlete:id,first_name,last_name,ftem_phase', 'user:id,email,phone')
            ->get()
            ->map(function ($r) {
                $r->athlete_name = $r->athlete
                    ? "{$r->athlete->first_name} {$r->athlete->last_name}"
                    : '—';
                $r->email = $r->user?->email;
                $r->phone = $r->user?->phone;
                return $r;
            });

        return response()->json(compact('season', 'registrations'));
    }
}
