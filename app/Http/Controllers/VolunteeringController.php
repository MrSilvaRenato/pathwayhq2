<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Volunteering;
use App\Models\VolunteeringSignup;

class VolunteeringController extends Controller
{
    // List all volunteering opportunities for the club
    public function index(Request $request)
    {
        return response()->json(
            Volunteering::where('club_id', $request->user()->club_id)
                ->withCount('signups')
                ->orderBy('event_date', 'asc')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'event_date'  => 'nullable|date',
            'location'    => 'nullable|string',
            'slots'       => 'nullable|integer',
        ]);

        $volunteering = Volunteering::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $request->user()->club_id,
        ]));

        return response()->json($volunteering, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'event_date'  => 'nullable|date',
            'location'    => 'nullable|string',
            'slots'       => 'nullable|integer',
        ]);

        Volunteering::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Volunteering::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }

    // Sign up for a volunteering slot
    public function signup(Request $request, $id)
    {
        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $existing = VolunteeringSignup::where('volunteering_id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already signed up'], 409);
        }

        VolunteeringSignup::create([
            'id'              => (string) Str::uuid(),
            'volunteering_id' => $id,
            'user_id'         => $request->user()->id,
        ]);

        return response()->json(['ok' => true], 201);
    }

    // Cancel signup
    public function cancelSignup(Request $request, $id)
    {
        VolunteeringSignup::where('volunteering_id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    // List signups for a specific opportunity (admin)
    public function signups(Request $request, $id)
    {
        $volunteering = Volunteering::where('id', $id)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        return response()->json(
            VolunteeringSignup::where('volunteering_id', $id)
                ->with('user:id,full_name,email')
                ->get()
        );
    }
}
