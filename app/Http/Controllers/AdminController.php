<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Models\User;
use App\Models\Club;
use App\Models\Athlete;
use App\Models\Squad;
use App\Models\SquadRequest;
use App\Models\Season;
use App\Models\SeasonRegistration;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\Announcement;
use App\Models\Milestone;
use App\Models\ClubTrophy;
use App\Models\ClubJoinRequest;
use App\Models\ClubClaim;
use App\Models\Volunteering;
use App\Models\VolunteeringSignup;
use App\Models\Notification;
use App\Models\ActivityLog;

class AdminController extends Controller
{
    private function guard(Request $request)
    {
        if ($request->user()->role !== 'site_admin') abort(403);
    }

    // GET /admin/stats
    public function stats(Request $request)
    {
        $this->guard($request);

        return response()->json([
            'users_total'     => User::count(),
            'users_by_role'   => User::selectRaw('role, count(*) as count')
                ->groupBy('role')->get()->pluck('count', 'role'),
            'clubs_total'     => Club::count(),
            'clubs_claimed'   => Club::where('is_claimed', true)->count(),
            'clubs_public'    => Club::where('is_public', true)->count(),
            'athletes_active' => Athlete::where('is_active', true)->count(),
            'pending_claims'  => ClubClaim::where('status', 'pending')->count(),
            'active_seasons'  => Season::where('status', 'active')->count(),
        ]);
    }

    // GET /admin/users?q=&role=
    public function users(Request $request)
    {
        $this->guard($request);

        $q    = $request->query('q');
        $role = $request->query('role');

        $query = User::with('club:id,name')
            ->orderByRaw("CASE role
                WHEN 'site_admin' THEN 0
                WHEN 'club_admin' THEN 1
                WHEN 'coach'      THEN 2
                WHEN 'athlete'    THEN 3
                ELSE 4 END")
            ->orderBy('full_name');

        if ($q) {
            $query->where(function ($sq) use ($q) {
                $sq->where('full_name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if ($role) {
            $query->where('role', $role);
        }

        return response()->json($query->get()->map(fn($u) => [
            'id'         => $u->id,
            'full_name'  => $u->full_name,
            'email'      => $u->email,
            'phone'      => $u->phone,
            'role'       => $u->role,
            'club_id'    => $u->club_id,
            'club_name'  => $u->club?->name,
            'created_at' => $u->created_at,
        ]));
    }

    // PUT /admin/users/{id}
    public function updateUser(Request $request, $id)
    {
        $this->guard($request);

        $user = User::findOrFail($id);
        $oldRole = $user->role;

        $data = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'email'     => "nullable|email|unique:users,email,{$id}",
            'role'      => 'nullable|in:site_admin,club_admin,coach,athlete,parent',
            'club_id'   => 'nullable|exists:clubs,id',
        ]);

        $update = [];
        if (array_key_exists('full_name', $data)) $update['full_name'] = $data['full_name'];
        if (array_key_exists('email',     $data)) $update['email']     = $data['email'];
        if (array_key_exists('role',      $data)) $update['role']      = $data['role'];
        if (array_key_exists('club_id',   $data)) $update['club_id']   = $data['club_id'];

        $user->update($update);

        if (isset($data['role']) && $data['role'] !== $oldRole) {
            ActivityLog::record(
                $request->user(), 'user.role_changed', 'user', $user->id,
                $user->full_name ?? $user->email,
                ['from' => $oldRole, 'to' => $data['role']]
            );
        }

        return response()->json(['ok' => true]);
    }

    // DELETE /admin/users/{id}
    public function deleteUser(Request $request, $id)
    {
        $this->guard($request);

        if ($id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        $user = User::findOrFail($id);

        if ($user->role === 'site_admin' && User::where('role', 'site_admin')->count() <= 1) {
            return response()->json(['message' => 'Cannot delete the last site admin.'], 422);
        }

        ActivityLog::record($request->user(), 'user.deleted', 'user', $user->id, $user->full_name ?? $user->email);

        $user->delete();
        return response()->json(['ok' => true]);
    }

    // GET /admin/athletes?q=&club_id=
    public function athletes(Request $request)
    {
        $this->guard($request);

        $q      = $request->query('q');
        $clubId = $request->query('club_id');

        $query = Athlete::with('club:id,name')
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($q) {
            $query->where(function ($sq) use ($q) {
                $sq->where('first_name', 'like', "%{$q}%")
                   ->orWhere('last_name', 'like', "%{$q}%");
            });
        }
        if ($clubId) {
            $query->where('club_id', $clubId);
        }

        return response()->json($query->get()->map(fn($a) => [
            'id'            => $a->id,
            'first_name'    => $a->first_name,
            'last_name'     => $a->last_name,
            'sport'         => $a->sport,
            'ftem_phase'    => $a->ftem_phase,
            'is_active'     => $a->is_active,
            'club_id'       => $a->club_id,
            'club_name'     => $a->club?->name,
            'avatar_url'    => $a->avatar_url,
            'invite_status' => $a->invite_status,
            'slug'          => $a->slug,
        ]));
    }

    // POST /admin/clubs
    public function createClub(Request $request)
    {
        $this->guard($request);

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'sport'         => 'required|string',
            'city'          => 'nullable|string|max:100',
            'state'         => 'nullable|string|max:100',
            'description'   => 'nullable|string',
            'website'       => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'is_public'     => 'boolean',
            'is_claimed'    => 'boolean',
        ]);

        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        $i = 1;
        while (Club::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }

        $club = Club::create(array_merge($data, [
            'id'   => (string) Str::uuid(),
            'slug' => $slug,
        ]));

        ActivityLog::record($request->user(), 'club.created', 'club', $club->id, $club->name);

        return response()->json($club, 201);
    }

    // PUT /admin/clubs/{id}
    public function updateClub(Request $request, $id)
    {
        $this->guard($request);

        $club = Club::findOrFail($id);

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'sport'         => 'required|string',
            'city'          => 'nullable|string|max:100',
            'state'         => 'nullable|string|max:100',
            'description'   => 'nullable|string',
            'website'       => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'is_public'     => 'boolean',
            'is_claimed'    => 'boolean',
        ]);

        $club->update($data);

        ActivityLog::record($request->user(), 'club.updated', 'club', $club->id, $club->name);

        return response()->json(['ok' => true, 'club' => $club->fresh()]);
    }

    // DELETE /admin/clubs/{id}
    public function deleteClub(Request $request, $id)
    {
        $this->guard($request);

        $club = Club::findOrFail($id);
        $clubName = $club->name;

        User::where('club_id', $id)
            ->whereIn('role', ['club_admin', 'coach'])
            ->update(['role' => 'athlete', 'club_id' => null]);

        $athleteIds = Athlete::where('club_id', $id)->pluck('id');
        DB::table('squad_athletes')->whereIn('athlete_id', $athleteIds)->delete();
        SquadRequest::where('club_id', $id)->delete();
        Athlete::where('club_id', $id)->delete();
        Squad::where('club_id', $id)->delete();

        $seasonIds = Season::where('club_id', $id)->pluck('id');
        SeasonRegistration::whereIn('season_id', $seasonIds)->delete();
        Season::where('club_id', $id)->delete();

        $eventIds = Event::where('club_id', $id)->pluck('id');
        EventRsvp::whereIn('event_id', $eventIds)->delete();
        Event::where('club_id', $id)->delete();

        $volIds = Volunteering::where('club_id', $id)->pluck('id');
        VolunteeringSignup::whereIn('volunteering_id', $volIds)->delete();
        Volunteering::where('club_id', $id)->delete();

        Announcement::where('club_id', $id)->delete();
        Milestone::where('club_id', $id)->delete();
        ClubTrophy::where('club_id', $id)->delete();
        ClubJoinRequest::where('club_id', $id)->delete();
        ClubClaim::where('club_id', $id)->delete();

        $club->delete();

        ActivityLog::record($request->user(), 'club.deleted', 'club', $id, $clubName);

        return response()->json(['ok' => true]);
    }

    // POST /admin/broadcast
    public function broadcast(Request $request)
    {
        $this->guard($request);

        $data = $request->validate([
            'title'  => 'required|string|max:255',
            'body'   => 'required|string|max:1000',
            'link'   => 'nullable|string|max:255',
            'target' => 'required|string',
        ]);

        $query = User::query();

        if ($data['target'] !== 'all') {
            if (str_starts_with($data['target'], 'role:')) {
                $query->where('role', substr($data['target'], 5));
            } elseif (str_starts_with($data['target'], 'club:')) {
                $query->where('club_id', substr($data['target'], 5));
            }
        }

        $userIds = $query->pluck('id');
        $count   = $userIds->count();

        foreach ($userIds as $userId) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $userId,
                'title'   => $data['title'],
                'body'    => $data['body'],
                'link'    => $data['link'] ?? null,
                'type'    => 'broadcast',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

        ActivityLog::record(
            $request->user(), 'broadcast.sent', 'broadcast', null, $data['title'],
            ['target' => $data['target'], 'recipients' => $count]
        );

        return response()->json(['ok' => true, 'count' => $count]);
    }

    // GET /admin/activity-log
    public function activityLog(Request $request)
    {
        $this->guard($request);

        $logs = ActivityLog::orderByDesc('created_at')
            ->limit(300)
            ->get();

        return response()->json($logs);
    }

    // POST /admin/impersonate/{id}
    public function impersonate(Request $request, $id)
    {
        $this->guard($request);

        $target = User::findOrFail($id);

        if ($target->role === 'site_admin') {
            return response()->json(['message' => 'Cannot impersonate another site admin.'], 422);
        }

        $token = JWTAuth::fromUser($target);

        ActivityLog::record(
            $request->user(), 'user.impersonated', 'user', $target->id,
            $target->full_name ?? $target->email
        );

        return response()->json(['token' => $token, 'user' => $target]);
    }
}
