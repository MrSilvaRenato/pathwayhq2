<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload an image and return its public URL.
     * Accepts: logo, cover, announcement
     */
    public function image(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5 MB
            'type'  => 'nullable|string|in:logo,cover,announcement,avatar',
        ]);

        $type   = $request->input('type', 'general');
        $folder = "uploads/{$type}s";

        $file     = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        // Store in storage/app/public/uploads/{type}s/
        $path = $file->storeAs($folder, $filename, 'public');

        $url = asset('storage/' . $path);

        return response()->json(['url' => $url]);
    }
}
