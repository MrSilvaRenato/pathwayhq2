<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Announcement::where('club_id', $request->user()->club_id)
                ->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'    => 'required|string',
            'body'     => 'required|string',
            'audience' => 'nullable|string',
        ]);

        $announcement = Announcement::create(array_merge($data, [
            'id'         => (string) Str::uuid(),
            'club_id'    => $request->user()->club_id,
            'author_id'  => $request->user()->id,
        ]));

        return response()->json($announcement, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'    => 'required|string',
            'body'     => 'required|string',
            'audience' => 'nullable|string',
        ]);

        Announcement::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Announcement::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }
}
