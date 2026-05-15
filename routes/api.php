<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\AthleteController;
use App\Http\Controllers\SquadController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\VolunteeringController;
use App\Http\Controllers\NotificationController;

// ─── Public routes ───────────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// Public club directory
Route::get('/clubs/public',       [ClubController::class, 'publicIndex']);
Route::get('/clubs/public/{slug}',[ClubController::class, 'publicShow']);

// ─── Authenticated routes ─────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Profile
    Route::get('/profile',  [ProfileController::class, 'show']);
    Route::put('/profile',  [ProfileController::class, 'update']);

    // Club
    Route::get('/club',         [ClubController::class, 'mine']);
    Route::put('/club',         [ClubController::class, 'update']);
    Route::get('/clubs/all',    [ClubController::class, 'all']);     // site_admin only

    // Athletes
    Route::get('/athletes',          [AthleteController::class, 'index']);
    Route::post('/athletes',         [AthleteController::class, 'store']);
    Route::get('/athletes/{id}',     [AthleteController::class, 'show']);
    Route::put('/athletes/{id}',     [AthleteController::class, 'update']);
    Route::delete('/athletes/{id}',  [AthleteController::class, 'destroy']);

    // Squads
    Route::get('/squads',                    [SquadController::class, 'index']);
    Route::post('/squads',                   [SquadController::class, 'store']);
    Route::put('/squads/{id}',               [SquadController::class, 'update']);
    Route::delete('/squads/{id}',            [SquadController::class, 'destroy']);
    Route::get('/squads/{id}/athletes',      [SquadController::class, 'athletes']);

    // Events / Calendar
    Route::get('/events',         [EventController::class, 'index']);
    Route::post('/events',        [EventController::class, 'store']);
    Route::put('/events/{id}',    [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);

    // Milestones
    Route::get('/milestones',         [MilestoneController::class, 'index']);
    Route::post('/milestones',        [MilestoneController::class, 'store']);
    Route::put('/milestones/{id}',    [MilestoneController::class, 'update']);
    Route::delete('/milestones/{id}', [MilestoneController::class, 'destroy']);

    // Announcements
    Route::get('/announcements',         [AnnouncementController::class, 'index']);
    Route::post('/announcements',        [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}',    [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Volunteering
    Route::get('/volunteering',                       [VolunteeringController::class, 'index']);
    Route::post('/volunteering',                      [VolunteeringController::class, 'store']);
    Route::put('/volunteering/{id}',                  [VolunteeringController::class, 'update']);
    Route::delete('/volunteering/{id}',               [VolunteeringController::class, 'destroy']);
    Route::post('/volunteering/{id}/signup',          [VolunteeringController::class, 'signup']);
    Route::delete('/volunteering/{id}/signup',        [VolunteeringController::class, 'cancelSignup']);
    Route::get('/volunteering/{id}/signups',          [VolunteeringController::class, 'signups']);

    // Notifications
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read',    [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all',     [NotificationController::class, 'markAllRead']);
});
