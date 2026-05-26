<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Announcement;
use App\Models\Athlete;
use App\Models\Notification;
use App\Models\Club;
use App\Models\User;
use App\Services\MailService;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $clubId = $request->user()->resolveClubId();
        if (!$clubId) return response()->json([]);

        try {
            $query = Announcement::where('club_id', $clubId)
                ->with('author:id,full_name');

            // Use new columns if they exist, fall back gracefully
            $columns = \Schema::getColumnListing('announcements');
            if (in_array('pinned', $columns))     $query->orderByDesc('pinned');
            if (in_array('posted_at', $columns))  $query->orderByDesc('posted_at');
            else                                   $query->orderByDesc('created_at');

            return response()->json(
                $query->get()->map(function ($a) {
                    $a->author_name = $a->author?->full_name;
                    unset($a->author);
                    return $a;
                })
            );
        } catch (\Exception $e) {
            // Absolute fallback — return basic data if anything goes wrong
            return response()->json(
                Announcement::where('club_id', $clubId)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function ($a) {
                        $a->author_name = null;
                        return $a;
                    })
            );
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'     => 'required|string|max:200',
            'body'      => 'required|string',
            'category'  => 'nullable|string|in:general,match,training,news,camp,urgent',
            'emoji'     => 'nullable|string|max:8',
            'image_url' => 'nullable|url',
            'pinned'    => 'boolean',
        ]);

        $clubId = $request->user()->resolveClubId();

        $columns  = \Schema::getColumnListing('announcements');
        $newCols  = in_array('posted_at', $columns);

        $announcement = Announcement::create(array_merge(
            array_intersect_key($data, array_flip(array_intersect(array_keys($data), $columns))),
            [
                'id'        => (string) Str::uuid(),
                'club_id'   => $clubId,
                'author_id' => $request->user()->id,
                'title'     => $data['title'],
                'body'      => $data['body'],
            ],
            $newCols ? [
                'category'  => $data['category'] ?? 'general',
                'pinned'    => $data['pinned'] ?? false,
                'posted_at' => now()->toDateTimeString(),
            ] : []
        ));

        // Notify all linked athletes
        $athletes = Athlete::where('club_id', $clubId)->whereNotNull('user_id')->get();

        $categoryEmojis = [
            'match'    => '⚽',
            'training' => '💪',
            'news'     => '📰',
            'camp'     => '🏕️',
            'urgent'   => '🚨',
            'general'  => '📢',
        ];
        $notifEmoji = $data['emoji'] ?? $categoryEmojis[$data['category'] ?? 'general'] ?? '📢';

        $club = Club::find($clubId);
        $clubName = $club?->name ?? 'Your club';

        foreach ($athletes as $athlete) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => $notifEmoji . ' ' . $data['title'],
                'body'    => Str::limit($data['body'], 120),
                'link'    => '/announcements',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
            $athleteUser = User::find($athlete->user_id);
            if ($athleteUser) MailService::announcementToAthlete($athleteUser, $clubName, $data['title'], $data['body']);
        }

        return response()->json($announcement, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'     => 'required|string|max:200',
            'body'      => 'required|string',
            'category'  => 'nullable|string|in:general,match,training,news,camp,urgent',
            'emoji'     => 'nullable|string|max:8',
            'image_url' => 'nullable|url',
            'pinned'    => 'boolean',
        ]);

        Announcement::where('id', $id)
            ->where('club_id', $request->user()->resolveClubId())
            ->update($data);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Announcement::where('id', $id)
            ->where('club_id', $request->user()->resolveClubId())
            ->delete();

        return response()->json(['ok' => true]);
    }
}
