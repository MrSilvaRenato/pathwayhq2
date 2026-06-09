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
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ClubTrophyController;
use App\Http\Controllers\SquadRequestController;
use App\Http\Controllers\ClubClaimController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\ClubJoinRequestController;
use App\Http\Controllers\SeasonController;
use App\Http\Controllers\SeasonRegistrationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\ConnectController;

// ─── Health check ────────────────────────────────────────────────────────────
Route::get('/health', fn() => response()->json([
    'status'    => 'ok',
    'version'   => '1.0.0',
    'timestamp' => now()->toISOString(),
]));

// ─── Public routes ───────────────────────────────────────────────────────────
Route::post('/auth/register',        [AuthController::class, 'register']);
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

// Public club directory
Route::get('/clubs/public',       [ClubController::class, 'publicIndex']);
Route::get('/clubs/public/{slug}',[ClubController::class, 'publicShow']);

// Public athlete profiles
Route::get('/athletes/public/{slug}', [AthleteController::class, 'publicShow']);

// Club claiming (public submission)
Route::post('/clubs/public/{slug}/claim', [ClubClaimController::class, 'store']);

// Public seasons list for a club
Route::get('/clubs/public/{slug}/seasons', [SeasonController::class, 'publicList']);

// Stripe webhook (no auth)
Route::post('/stripe/webhook',                [SeasonRegistrationController::class, 'stripeWebhook']);
Route::post('/stripe/subscription-webhook',   [SubscriptionController::class, 'webhook']);
Route::post('/stripe/connect-webhook',        [ConnectController::class, 'webhook']);

// ─── Authenticated routes ─────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::get('/users/lookup', [AuthController::class, 'lookup']);

    // Profile
    Route::get('/profile',  [ProfileController::class, 'show']);
    Route::put('/profile',  [ProfileController::class, 'update']);

    // Club
    Route::get('/club',         [ClubController::class, 'mine']);
    Route::put('/club',         [ClubController::class, 'update']);
    Route::get('/club/plan',                    [ClubController::class, 'plan']);
    Route::post('/subscription/checkout',       [SubscriptionController::class, 'checkout']);
    Route::post('/subscription/portal',         [SubscriptionController::class, 'portal']);
    Route::get('/connect/status',               [ConnectController::class, 'status']);
    Route::post('/connect/onboard',             [ConnectController::class, 'onboard']);
    Route::post('/connect/login-link',          [ConnectController::class, 'loginLink']);
    Route::get('/clubs/all',    [ClubController::class, 'all']);     // site_admin only

    // Athletes
    Route::get('/athletes',                       [AthleteController::class, 'index']);
    Route::get('/athletes/me',                    [AthleteController::class, 'me']);
    Route::put('/athletes/me',                    [AthleteController::class, 'updateMe']);
    Route::get('/athletes/invites',               [AthleteController::class, 'invites']);
    Route::post('/athletes',                      [AthleteController::class, 'store']);
    Route::post('/athletes/claim',                [AthleteController::class, 'claim']);
    Route::post('/athletes/{id}/accept-invite',   [AthleteController::class, 'acceptInvite']);
    Route::delete('/athletes/{id}/reject-invite', [AthleteController::class, 'rejectInvite']);
    Route::get('/athletes/{id}',                  [AthleteController::class, 'show']);
    Route::put('/athletes/{id}',                  [AthleteController::class, 'update']);
    Route::delete('/athletes/{id}',               [AthleteController::class, 'destroy']);

    // Squads
    Route::get('/squads',                    [SquadController::class, 'index']);
    Route::post('/squads',                   [SquadController::class, 'store']);
    Route::put('/squads/{id}',               [SquadController::class, 'update']);
    Route::delete('/squads/{id}',            [SquadController::class, 'destroy']);
    Route::get('/squads/{id}/athletes',      [SquadController::class, 'athletes']);
    Route::post('/squads/{id}/athletes',     [SquadController::class, 'addAthlete']);
    Route::delete('/squads/{id}/athletes/{athleteId}', [SquadController::class, 'removeAthlete']);
    Route::post('/squads/{id}/request',      [SquadController::class, 'requestSquadChange']);

    // Squad change requests (admin/coach approve/reject)
    Route::get('/squad-requests',                    [SquadRequestController::class, 'index']);
    Route::put('/squad-requests/{id}/approve',       [SquadRequestController::class, 'approve']);
    Route::put('/squad-requests/{id}/reject',        [SquadRequestController::class, 'reject']);

    // Events / Calendar
    Route::get('/events',              [EventController::class, 'index']);
    Route::post('/events',             [EventController::class, 'store']);
    Route::post('/events/{id}/rsvp',       [EventController::class, 'rsvp']);
    Route::get('/events/{id}/attendees',   [EventController::class, 'attendees']);
    Route::put('/events/{id}',         [EventController::class, 'update']);
    Route::delete('/events/{id}',      [EventController::class, 'destroy']);

    // Milestones
    Route::get('/milestones',              [MilestoneController::class, 'index']);
    Route::get('/milestones/athlete/{id}', [MilestoneController::class, 'byAthlete']);
    Route::post('/milestones',             [MilestoneController::class, 'store']);
    Route::put('/milestones/{id}',         [MilestoneController::class, 'update']);
    Route::delete('/milestones/{id}',      [MilestoneController::class, 'destroy']);

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
    Route::post('/volunteering/{id}/signup',                      [VolunteeringController::class, 'signup']);
    Route::delete('/volunteering/{id}/signup',                    [VolunteeringController::class, 'cancelSignup']);
    Route::get('/volunteering/{id}/signups',                      [VolunteeringController::class, 'signups']);
    Route::delete('/volunteering/{id}/volunteers/{userId}',       [VolunteeringController::class, 'removeVolunteer']);

    // Club Trophy Cabinet
    Route::get('/club-trophies',       [ClubTrophyController::class, 'index']);
    Route::post('/club-trophies',      [ClubTrophyController::class, 'store']);
    Route::put('/club-trophies/{id}',  [ClubTrophyController::class, 'update']);
    Route::delete('/club-trophies/{id}', [ClubTrophyController::class, 'destroy']);

    // Club claims (site admin)
    Route::get('/club-claims',                  [ClubClaimController::class, 'index']);
    Route::put('/club-claims/{id}/approve',     [ClubClaimController::class, 'approve']);
    Route::put('/club-claims/{id}/reject',      [ClubClaimController::class, 'reject']);
    Route::put('/club-claims/{id}/revoke',      [ClubClaimController::class, 'revoke']);

    // Site admin — platform CRUD
    Route::get('/admin/stats',           [AdminController::class, 'stats']);
    Route::get('/admin/users',           [AdminController::class, 'users']);
    Route::put('/admin/users/{id}',      [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}',   [AdminController::class, 'deleteUser']);
    Route::get('/admin/athletes',        [AdminController::class, 'athletes']);
    Route::post('/admin/clubs',           [AdminController::class, 'createClub']);
    Route::put('/admin/clubs/{id}',       [AdminController::class, 'updateClub']);
    Route::delete('/admin/clubs/{id}',    [AdminController::class, 'deleteClub']);
    Route::post('/admin/broadcast',       [AdminController::class, 'broadcast']);
    Route::get('/admin/activity-log',     [AdminController::class, 'activityLog']);
    Route::post('/admin/impersonate/{id}',[AdminController::class, 'impersonate']);

    // Club broadcast
    Route::get('/club/broadcast/athletes',  [ClubController::class, 'broadcastAthletes']);
    Route::post('/club/broadcast',          [ClubController::class, 'broadcast']);

    // Coaches (club_admin manages coaches for their club)
    Route::get('/club/coaches',         [CoachController::class, 'index']);
    Route::post('/club/coaches',        [CoachController::class, 'store']);
    Route::delete('/club/coaches/{id}', [CoachController::class, 'destroy']);

    // Parents / guardians
    Route::get('/athletes/{id}/parents',                    [ParentController::class, 'listParents']);
    Route::post('/athletes/{id}/parents',                   [ParentController::class, 'addParent']);
    Route::delete('/athletes/{id}/parents/{parentUserId}',  [ParentController::class, 'removeParent']);
    Route::get('/parent/my-athletes',                       [ParentController::class, 'myAthletes']);

    // Club join requests (athlete → requests to join a club)
    Route::post('/clubs/public/{slug}/join-request',    [ClubJoinRequestController::class, 'store']);
    Route::delete('/clubs/public/{slug}/join-request',  [ClubJoinRequestController::class, 'revoke']);
    Route::get('/clubs/public/{slug}/my-join-status',   [ClubJoinRequestController::class, 'myStatus']);
    Route::get('/my/join-requests',                     [ClubJoinRequestController::class, 'myRequests']);
    Route::get('/club/join-requests',                   [ClubJoinRequestController::class, 'index']);
    Route::put('/club/join-requests/{id}/approve',      [ClubJoinRequestController::class, 'approve']);
    Route::put('/club/join-requests/{id}/reject',       [ClubJoinRequestController::class, 'reject']);
    Route::delete('/club/join-requests/{id}',           [ClubJoinRequestController::class, 'destroy']);

    // Seasons
    Route::get('/seasons',           [SeasonController::class, 'index']);
    Route::post('/seasons',          [SeasonController::class, 'store']);
    Route::get('/seasons/{id}',      [SeasonController::class, 'show']);
    Route::put('/seasons/{id}',      [SeasonController::class, 'update']);
    Route::delete('/seasons/{id}',   [SeasonController::class, 'destroy']);

    // Season registrations
    Route::post('/seasons/{id}/invite',               [SeasonRegistrationController::class, 'invite']);
    Route::get('/my-registrations',                   [SeasonRegistrationController::class, 'myRegistrations']);
    Route::post('/registrations/{id}/pay',            [SeasonRegistrationController::class, 'pay']);
    Route::post('/registrations/{id}/reject',         [SeasonRegistrationController::class, 'reject']);
    Route::put('/registrations/{id}/mark-paid',       [SeasonRegistrationController::class, 'markPaid']);
    Route::delete('/registrations/{id}',              [SeasonRegistrationController::class, 'destroy']);

    // File uploads
    Route::post('/upload/image', [UploadController::class, 'image']);

    // Notifications
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read',    [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all',     [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications',           [NotificationController::class, 'clearAll']);
});
