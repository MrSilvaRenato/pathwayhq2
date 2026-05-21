<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Announcement;
use App\Models\Athlete;
use App\Models\Notification;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->resolveClubId();
        if (!$clubId) return response()->json([]);

        return response()->json(
            Announcement::where('club_id', $clubId)
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

        $clubId = $request->user()->club_id;

        $announcement = Announcement::create(array_merge($data, [
            'id'         => (string) Str::uuid(),
            'club_id'    => $clubId,
            'author_id'  => $request->user()->id,
        ]));

        // Notify all linked athletes in this club
        $athletes = Athlete::where('club_id', $clubId)
            ->whereNotNull('user_id')->get();

        foreach ($athletes as $athlete) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => '📢 ' . $data['title'],
                'body'    => Str::limit($data['body'], 120),
                'link'    => '/announcements',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
        }

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
