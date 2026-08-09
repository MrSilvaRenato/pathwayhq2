<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Athlete;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('club');
        $club = $user->club;

        return response()->json([
            'id'                 => $user->id,
            'email'              => $user->email,
            'full_name'          => $user->full_name,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'club_id'            => $user->club_id,
            // Club fields
            'club_name'          => $club?->name,
            'sport'              => $club?->sport,
            'city'               => $club?->city,
            'state'              => $club?->state,
            'slug'               => $club?->slug,
            'description'        => $club?->description,
            'website'            => $club?->website,
            'contact_email'      => $club?->contact_email,
            'phone'              => $club?->phone ?? $user->phone,
            'founded_year'       => $club?->founded_year,
            'logo_url'           => $club?->logo_url,
            'cover_image_url'    => $club?->cover_image_url,
            'social_facebook'    => $club?->social_facebook,
            'social_instagram'   => $club?->social_instagram,
            'social_twitter'     => $club?->social_twitter,
            'is_public'          => $club?->is_public,
            'show_milestones'    => $club?->show_milestones ?? true,
            'show_athletes_count'=> $club?->show_athletes_count ?? true,
            'show_events'        => $club?->show_events ?? false,
            'show_announcements' => $club?->show_announcements ?? false,
            'subscription_tier'  => $club?->subscription_tier,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'full_name' => 'required|string',
            'email'     => 'required|email|unique:users,email,' . $user->id,
            'phone'     => 'nullable|string|max:20',
            'password'  => 'nullable|min:6',
        ]);

        $oldEmail = $user->email;

        $user->full_name = $data['full_name'];
        $user->email     = strtolower(trim($data['email']));
        $user->phone     = $data['phone'] ?? $user->phone;

        if (!empty($data['password'])) {
            $user->password_hash = Hash::make($data['password']);
        }

        $user->save();

        // Keep invite_email in sync on linked athlete records
        if ($data['email'] !== $oldEmail) {
            Athlete::where('user_id', $user->id)
                ->where('invite_email', $oldEmail)
                ->update(['invite_email' => $data['email']]);
        }

        // Issue a fresh token so the client reflects the updated email immediately
        $token = JWTAuth::fromUser($user);

        return response()->json(['ok' => true, 'token' => $token]);
    }
}
