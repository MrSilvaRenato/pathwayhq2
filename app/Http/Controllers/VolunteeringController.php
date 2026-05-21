<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Volunteering;
use App\Models\VolunteeringSignup;
use App\Models\Notification;
use App\Models\User;
use App\Models\Athlete;

class VolunteeringController extends Controller
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * All admin/coach users in a given club.
     */
    private function clubStaff(string $clubId)
    {
        return User::where('club_id', $clubId)
            ->whereIn('role', ['club_admin', 'coach'])
            ->get();
    }

    /**
     * All users who are members of a club — staff + linked athletes/parents.
     */
    private function allClubMembers(string $clubId): array
    {
        $staff = User::where('club_id', $clubId)->pluck('id')->toArray();

        $athletes = Athlete::where('club_id', $clubId)
            ->whereNotNull('user_id')
            ->where('invite_status', 'accepted')
            ->pluck('user_id')
            ->toArray();

        return array_unique(array_merge($staff, $athletes));
    }

    private function notify(string $userId, string $title, string $body, string $link): void
    {
        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $userId,
            'title'   => $title,
            'body'    => $body,
            'link'    => $link,
            'is_read' => false,
            'at'      => now()->toDateTimeString(),
        ]);
    }

    private function dateStr(?string $date): string
    {
        return $date ? date('D j M', strtotime($date)) : '';
    }

    // ─── List ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $clubId = $request->user()->resolveClubId();
        if (!$clubId) return response()->json([]);

        $userId = $request->user()->id;

        $items = Volunteering::where('club_id', $clubId)
            ->withCount('signups')
            ->with('signups:id,volunteering_id,user_id')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($v) use ($userId) {
                $v->signed_up   = $v->signups_count;
                $v->i_signed_up = $v->signups->contains('user_id', $userId);
                unset($v->signups, $v->signups_count);
                return $v;
            });

        return response()->json($items);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'date'        => 'nullable|date',
            'location'    => 'nullable|string',
            'spots'       => 'nullable|integer',
        ]);

        $clubId = $request->user()->club_id;

        $volunteering = Volunteering::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $clubId,
        ]));

        // Notify every club member about the new opportunity
        $dateStr     = $this->dateStr($data['date'] ?? null);
        $spotsStr    = isset($data['spots']) ? " · {$data['spots']} spot" . ($data['spots'] !== 1 ? 's' : '') . ' available' : '';
        $locationStr = isset($data['location']) ? " · {$data['location']}" : '';
        $body        = trim($dateStr . $locationStr . $spotsStr, ' · ');

        foreach ($this->allClubMembers($clubId) as $uid) {
            // Don't notify the admin who just created it
            if ($uid === $request->user()->id) continue;
            $this->notify(
                $uid,
                "🙋 New volunteering opportunity: {$data['title']}",
                $body ?: 'Head to the Volunteering page to sign up.',
                '/volunteering'
            );
        }

        return response()->json($volunteering, 201);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'date'        => 'nullable|date',
            'location'    => 'nullable|string',
            'spots'       => 'nullable|integer',
        ]);

        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $volunteering->update($data);

        // Notify everyone who is signed up that details changed
        $signedUpUsers = VolunteeringSignup::where('volunteering_id', $id)
            ->pluck('user_id');

        foreach ($signedUpUsers as $uid) {
            $this->notify(
                $uid,
                "📝 \"{$data['title']}\" has been updated",
                'Details for a volunteering opportunity you signed up for have changed — please check the updated date and location.',
                '/volunteering'
            );
        }

        return response()->json(['ok' => true]);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, $id)
    {
        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        // Notify all signed-up volunteers that the event is cancelled
        $signedUpUsers = VolunteeringSignup::where('volunteering_id', $id)
            ->pluck('user_id');

        foreach ($signedUpUsers as $uid) {
            $this->notify(
                $uid,
                "❌ \"{$volunteering->title}\" has been cancelled",
                'A volunteering opportunity you had signed up for has been removed by the club.',
                '/volunteering'
            );
        }

        $volunteering->delete();

        return response()->json(['ok' => true]);
    }

    // ─── Sign up ──────────────────────────────────────────────────────────────

    public function signup(Request $request, $id)
    {
        $user   = $request->user();
        $clubId = $user->resolveClubId();

        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $clubId)
            ->firstOrFail();

        if (VolunteeringSignup::where('volunteering_id', $id)->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Already signed up'], 409);
        }

        // Check spots
        if ($volunteering->spots) {
            $filled = VolunteeringSignup::where('volunteering_id', $id)->count();
            if ($filled >= $volunteering->spots) {
                return response()->json(['message' => 'No spots remaining'], 409);
            }
        }

        VolunteeringSignup::create([
            'id'              => (string) Str::uuid(),
            'volunteering_id' => $id,
            'user_id'         => $user->id,
        ]);

        $dateStr = $this->dateStr($volunteering->date);
        $locStr  = $volunteering->location ? " · {$volunteering->location}" : '';

        // 1. Confirmation to the volunteer
        $this->notify(
            $user->id,
            "✅ You're signed up for \"{$volunteering->title}\"",
            "You're confirmed" . ($dateStr ? " for {$dateStr}" : '') . $locStr . '. The club will be in touch if anything changes.',
            '/volunteering'
        );

        // 2. Notify all club admins/coaches
        $spotsAfter = $volunteering->spots
            ? $volunteering->spots - (VolunteeringSignup::where('volunteering_id', $id)->count())
            : null;

        $phoneStr  = $user->phone ? " · 📞 {$user->phone}" : '';
        $staffBody = "{$user->full_name} · {$user->email}{$phoneStr} signed up.";
        if ($spotsAfter !== null) {
            $staffBody .= " {$spotsAfter} spot" . ($spotsAfter !== 1 ? 's' : '') . ' remaining.';
        }

        foreach ($this->clubStaff($clubId) as $staff) {
            $this->notify(
                $staff->id,
                "🙋 {$user->full_name} volunteered for \"{$volunteering->title}\"",
                $staffBody,
                '/volunteering'
            );
        }

        // 3. If now full, send a "full" notification to admins
        if ($spotsAfter === 0) {
            foreach ($this->clubStaff($clubId) as $staff) {
                $this->notify(
                    $staff->id,
                    "🎉 \"{$volunteering->title}\" is now fully staffed",
                    "All {$volunteering->spots} volunteer spots have been filled.",
                    '/volunteering'
                );
            }
        }

        return response()->json(['ok' => true], 201);
    }

    // ─── Cancel own signup ────────────────────────────────────────────────────

    public function cancelSignup(Request $request, $id)
    {
        $user   = $request->user();
        $clubId = $user->resolveClubId();

        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $clubId)
            ->firstOrFail();

        VolunteeringSignup::where('volunteering_id', $id)
            ->where('user_id', $user->id)
            ->delete();

        // Notify admins/coaches
        foreach ($this->clubStaff($clubId) as $staff) {
            $this->notify(
                $staff->id,
                "↩️ {$user->full_name} cancelled their signup for \"{$volunteering->title}\"",
                "{$user->full_name} ({$user->email}) is no longer volunteering. A spot has opened up.",
                '/volunteering'
            );
        }

        // Notify the member
        $this->notify(
            $user->id,
            "↩️ Signup cancelled for \"{$volunteering->title}\"",
            "You've been removed from the volunteer list. You can sign up again if you change your mind.",
            '/volunteering'
        );

        return response()->json(['ok' => true]);
    }

    // ─── Admin removes a volunteer ────────────────────────────────────────────

    public function removeVolunteer(Request $request, $id, $userId)
    {
        $clubId = $request->user()->club_id;

        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $clubId)
            ->firstOrFail();

        VolunteeringSignup::where('volunteering_id', $id)
            ->where('user_id', $userId)
            ->delete();

        // Notify the removed person
        $this->notify(
            $userId,
            "❌ You've been removed from \"{$volunteering->title}\"",
            'The club admin has removed you from this volunteer slot. Contact your club if you think this was a mistake.',
            '/volunteering'
        );

        return response()->json(['ok' => true]);
    }

    // ─── List signups for admin ───────────────────────────────────────────────

    public function signups(Request $request, $id)
    {
        Volunteering::where('id', $id)
            ->where('club_id', $request->user()->resolveClubId())
            ->firstOrFail();

        $signups = VolunteeringSignup::where('volunteering_id', $id)
            ->with('user:id,full_name,email,phone,role')
            ->get()
            ->map(fn($s) => [
                'signup_id' => $s->id,
                'user_id'   => $s->user_id,
                'full_name' => $s->user?->full_name ?? 'Unknown',
                'email'     => $s->user?->email ?? '—',
                'phone'     => $s->user?->phone ?? null,
                'role'      => $s->user?->role ?? '—',
            ]);

        return response()->json($signups);
    }
}
