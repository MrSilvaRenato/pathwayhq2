<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\Athlete;
use App\Models\Milestone;

class ClubController extends Controller
{
    // Public: list all public clubs
    public function publicIndex()
    {
        return response()->json(
            Club::where('is_public', true)
                ->select('id','name','sport','city','state','slug','description','is_public')
                ->orderBy('name')
                ->get()
        );
    }

    // Public: single club profile
    public function publicShow($slug)
    {
        $club = Club::where('slug', $slug)->where('is_public', true)->firstOrFail();

        $athletes  = Athlete::where('club_id', $club->id)->where('is_active', true)
                        ->select('id','ftem_phase','sport','gender')->get();

        $milestones = Milestone::where('club_id', $club->id)
                        ->where('is_shared_with_parent', true)
                        ->select('id','title','ftem_phase','achieved_at')
                        ->orderBy('achieved_at', 'desc')->limit(6)->get();

        return response()->json(compact('club', 'athletes', 'milestones'));
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
            'name'          => 'required|string',
            'city'          => 'nullable|string',
            'state'         => 'nullable|string',
            'sport'         => 'required|string',
            'slug'          => 'nullable|string',
            'description'   => 'nullable|string',
            'website'       => 'nullable|string',
            'contact_email' => 'nullable|email',
            'is_public'     => 'boolean',
        ]);

        Club::where('id', $clubId)->update($data);

        return response()->json(['ok' => true]);
    }

    // Site admin: all clubs
    public function all(Request $request)
    {
        if ($request->user()->role !== 'site_admin') abort(403);
        return response()->json(Club::orderBy('name')->get());
    }
}
