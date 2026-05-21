<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('club');
        $club = $user->club;

        return response()->json([
            'id'               => $user->id,
            'email'            => $user->email,
            'full_name'        => $user->full_name,
            'phone'            => $user->phone,
            'role'             => $user->role,
            'club_id'          => $user->club_id,
            'club_name'        => $club?->name,
            'sport'            => $club?->sport,
            'city'             => $club?->city,
            'state'            => $club?->state,
            'slug'             => $club?->slug,
            'description'      => $club?->description,
            'website'          => $club?->website,
            'contact_email'    => $club?->contact_email,
            'is_public'        => $club?->is_public,
            'subscription_tier'=> $club?->subscription_tier,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'full_name' => 'required|string',
            'phone'     => 'nullable|string|max:20',
            'password'  => 'nullable|min:6',
        ]);

        $user = $request->user();
        $user->full_name = $data['full_name'];
        $user->phone     = $data['phone'] ?? $user->phone;

        if (!empty($data['password'])) {
            $user->password_hash = Hash::make($data['password']);
        }

        $user->save();

        return response()->json(['ok' => true]);
    }
}
