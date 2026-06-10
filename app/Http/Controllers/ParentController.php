<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Athlete;
use App\Models\AthleteParent;
use App\Models\Club;
use App\Models\User;
use App\Models\Notification;
use App\Services\MailService;

class ParentController extends Controller
{
    // Club admin / coach: add a parent/guardian to an athlete
    public function addParent(Request $request, $athleteId)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $clubId  = $request->user()->resolveClubId();
        $athlete = Athlete::where('id', $athleteId)
            ->where('club_id', $clubId)
            ->firstOrFail();

        $data = $request->validate([
            'email'     => 'required|email',
            'full_name' => 'required|string|max:100',
        ]);
        $data['email'] = strtolower(trim($data['email']));

        $parentUser  = User::where('email', $data['email'])->first();
        $tempPassword = null;

        if ($parentUser) {
            if (in_array($parentUser->role, ['club_admin', 'coach', 'site_admin'])) {
                return response()->json([
                    'message' => 'This user already has a staff role and cannot be added as a parent.',
                ], 422);
            }
            // Upgrade to parent role if they're just an unaffiliated athlete
            if ($parentUser->role === 'athlete' && !$parentUser->club_id) {
                $parentUser->update(['role' => 'parent']);
            }
        } else {
            $tempPassword = Str::random(12);
            $parentUser   = User::create([
                'id'            => (string) Str::uuid(),
                'email'         => $data['email'],
                'full_name'     => $data['full_name'],
                'password_hash' => Hash::make($tempPassword),
                'role'          => 'parent',
                'club_id'       => null,
            ]);
            $athleteName = trim($athlete->first_name . ' ' . $athlete->last_name);
            MailService::welcomeParent($parentUser->email, $parentUser->full_name, $athleteName, $tempPassword);
        }

        // Link parent → athlete (idempotent)
        $alreadyLinked = AthleteParent::where('athlete_id', $athlete->id)
            ->where('parent_user_id', $parentUser->id)
            ->exists();

        if (!$alreadyLinked) {
            AthleteParent::create([
                'id'             => (string) Str::uuid(),
                'athlete_id'     => $athlete->id,
                'parent_user_id' => $parentUser->id,
            ]);
        }

        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $parentUser->id,
            'title'   => "👨‍👧 You're linked as a parent/guardian for {$athlete->first_name} {$athlete->last_name}",
            'body'    => "You can now follow {$athlete->first_name}'s development pathway, milestones, and events.",
            'link'    => '/dashboard',
            'is_read' => false,
            'at'      => now()->toDateTimeString(),
        ]);

        return response()->json([
            'ok'           => true,
            'temp_password'=> $tempPassword,
            'email'        => $parentUser->email,
        ], 201);
    }

    // Club admin / coach: list parents linked to an athlete
    public function listParents(Request $request, $athleteId)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $clubId  = $request->user()->resolveClubId();
        $athlete = Athlete::where('id', $athleteId)->where('club_id', $clubId)->firstOrFail();

        $parents = AthleteParent::where('athlete_id', $athlete->id)
            ->with('parent:id,full_name,email,phone')
            ->get()
            ->map(fn($l) => $l->parent);

        return response()->json($parents);
    }

    // Club admin / coach: remove a parent link
    public function removeParent(Request $request, $athleteId, $parentUserId)
    {
        if (!in_array($request->user()->role, ['club_admin', 'coach', 'site_admin'])) abort(403);

        $clubId  = $request->user()->resolveClubId();
        $athlete = Athlete::where('id', $athleteId)->where('club_id', $clubId)->firstOrFail();

        AthleteParent::where('athlete_id', $athlete->id)
            ->where('parent_user_id', $parentUserId)
            ->delete();

        return response()->json(['ok' => true]);
    }

    // Parent: list my linked athletes with club + milestone summary
    public function myAthletes(Request $request)
    {
        if ($request->user()->role !== 'parent') abort(403);

        $links = AthleteParent::where('parent_user_id', $request->user()->id)
            ->with([
                'athlete' => fn($q) => $q
                    ->with('club:id,name,city,sport,slug', 'squads:id,name')
                    ->select('id','club_id','user_id','first_name','last_name','ftem_phase','sport','gender','is_active','slug','is_public'),
            ])
            ->get();

        $athletes = $links->map(fn($l) => $l->athlete)->filter()->values();

        return response()->json($athletes);
    }
}
