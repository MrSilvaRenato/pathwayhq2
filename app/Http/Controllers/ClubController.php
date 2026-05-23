<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\Athlete;
use App\Models\Milestone;
use App\Models\Event;
use App\Models\Announcement;
use App\Models\ClubTrophy;
use App\Models\User;

class ClubController extends Controller
{
    // Public: list all public clubs
    public function publicIndex()
    {
        return response()->json(
            Club::where('is_public', true)
                ->select('id','name','sport','city','state','slug','description','logo_url','is_public','is_claimed','founded_year')
                ->orderBy('name')
                ->get()
        );
    }

    // Public: single club profile — respects per-section privacy toggles
    public function publicShow($slug)
    {
        $club    = Club::where('slug', $slug)->where('is_public', true)->firstOrFail();
        $columns = \Schema::getColumnListing('clubs');

        // Athletes — count + FTEM distribution
        $athletes = [];
        $ftemDist = [];
        $showCount = !in_array('show_athletes_count', $columns) || $club->show_athletes_count !== false;
        if ($showCount) {
            $ath = Athlete::where('club_id', $club->id)->where('is_active', true)
                    ->select('id','ftem_phase','sport','gender')->get();
            $athletes = $ath;
            foreach ($ath as $a) {
                $ftemDist[$a->ftem_phase] = ($ftemDist[$a->ftem_phase] ?? 0) + 1;
            }
        }

        // Milestones
        $milestones = [];
        $showMilestones = !in_array('show_milestones', $columns) || $club->show_milestones !== false;
        if ($showMilestones) {
            $milestones = Milestone::where('milestones.club_id', $club->id)
                ->where('milestones.is_shared_with_parent', true)
                ->leftJoin('athletes', 'milestones.athlete_id', '=', 'athletes.id')
                ->select('milestones.id','milestones.title','milestones.ftem_phase','milestones.achieved_at','athletes.first_name as athlete_name')
                ->orderBy('milestones.achieved_at', 'desc')->limit(12)->get();
        }

        // Upcoming events
        $events = [];
        $showEvents = in_array('show_events', $columns) && $club->show_events;
        if ($showEvents) {
            $events = Event::where('club_id', $club->id)
                ->where('start_time', '>=', now())
                ->with('squad:id,name')
                ->select('id','title','event_type','start_time','end_time','location','squad_id')
                ->orderBy('start_time')->limit(5)->get()
                ->map(function ($ev) {
                    $ev->squad_name = $ev->squad?->name;
                    unset($ev->squad);
                    return $ev;
                });
        }

        // Announcements
        $announcements = [];
        $showAnnouncements = in_array('show_announcements', $columns) && $club->show_announcements;
        if ($showAnnouncements) {
            $annQuery = Announcement::where('club_id', $club->id);
            $annCols  = \Schema::getColumnListing('announcements');
            if (in_array('posted_at', $annCols)) $annQuery->orderByDesc('posted_at');
            else $annQuery->orderByDesc('created_at');
            $announcements = $annQuery->select(
                array_intersect(['id','title','body','category','emoji','image_url','posted_at','created_at'], $annCols)
            )->limit(4)->get();
        }

        // Club Trophy Cabinet
        $clubTrophies = ClubTrophy::where('club_id', $club->id)
            ->where('is_public', true)
            ->orderByDesc('achieved_at')
            ->orderByDesc('created_at')
            ->get();

        // Club manager first name (only when claimed)
        $managerFirstName = null;
        if ($club->is_claimed) {
            $mgr = User::where('club_id', $club->id)
                ->where('role', 'club_admin')
                ->select('full_name')
                ->first();
            if ($mgr) {
                $managerFirstName = explode(' ', trim($mgr->full_name))[0];
            }
        }

        return response()->json(array_merge(
            compact('club','athletes','ftemDist','milestones','events','announcements','clubTrophies'),
            ['managerFirstName' => $managerFirstName]
        ));
    }

    // Auth: get my club
    public function mine(Request $request)
    {
        if (!$request->user()->club_id) return response()->json(null);
        return response()->json(Club::find($request->user()->club_id));
    }

    // Auth: update my club
    public function update(Request $request)
    {
        $user   = $request->user();
        $clubId = $user->role === 'site_admin'
            ? ($request->input('club_id') ?? $user->club_id)
            : $user->club_id;

        $data = $request->validate([
            'name'                => 'required|string',
            'city'                => 'nullable|string',
            'state'               => 'nullable|string',
            'sport'               => 'required|string',
            'slug'                => 'nullable|string',
            'description'         => 'nullable|string',
            'website'             => 'nullable|string',
            'contact_email'       => 'nullable|email',
            'phone'               => 'nullable|string',
            'is_public'           => 'boolean',
            'cover_image_url'     => 'nullable|string',
            'logo_url'            => 'nullable|string',
            'founded_year'        => 'nullable|integer|min:1800|max:2100',
            'social_facebook'     => 'nullable|string',
            'social_instagram'    => 'nullable|string',
            'social_twitter'      => 'nullable|string',
            'show_milestones'     => 'boolean',
            'show_athletes_count' => 'boolean',
            'show_events'         => 'boolean',
            'show_announcements'  => 'boolean',
        ]);

        // Only update columns that exist in DB (graceful before migration)
        $columns = \Schema::getColumnListing('clubs');
        $safe    = array_intersect_key($data, array_flip($columns));

        Club::where('id', $clubId)->update($safe);

        return response()->json(['ok' => true]);
    }

    // Site admin: all clubs
    public function all(Request $request)
    {
        if ($request->user()->role !== 'site_admin') abort(403);
        return response()->json(Club::orderBy('name')->get());
    }
}
