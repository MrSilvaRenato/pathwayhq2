<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Event;

class EventController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Event::where('club_id', $request->user()->club_id)
                ->with('squad:id,name')
                ->orderBy('start_time', 'desc')->get()
                ->map(function($e) {
                    $e->squad_name = $e->squad?->name;
                    unset($e->squad);
                    return $e;
                })
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'start_time'  => 'required|date',
            'end_time'    => 'nullable|date',
            'event_type'  => 'nullable|string',
            'squad_id'    => 'nullable|string',
        ]);

        $event = Event::create(array_merge($data, [
            'id'      => (string) Str::uuid(),
            'club_id' => $request->user()->club_id,
        ]));

        return response()->json(['id' => $event->id], 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'start_time'  => 'required|date',
            'end_time'    => 'nullable|date',
            'event_type'  => 'nullable|string',
            'squad_id'    => 'nullable|string',
        ]);

        Event::where('id', $id)->where('club_id', $request->user()->club_id)->update($data);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        Event::where('id', $id)->where('club_id', $request->user()->club_id)->delete();
        return response()->json(['ok' => true]);
    }
}
