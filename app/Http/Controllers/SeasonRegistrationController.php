<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Season;
use App\Models\SeasonRegistration;
use App\Models\Athlete;
use App\Models\User;
use App\Models\Notification;
use App\Services\MailService;

class SeasonRegistrationController extends Controller
{
    // Club admin: send registration payment request to selected athletes
    public function invite(Request $request, $seasonId)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $season = Season::where('id', $seasonId)
            ->where('club_id', $request->user()->club_id)
            ->firstOrFail();

        $data = $request->validate([
            'athlete_ids'   => 'required|array|min:1',
            'athlete_ids.*' => 'string',
        ]);

        $season->load('club');

        $manager  = $request->user();
        $created  = 0;
        $skipped  = 0;

        foreach ($data['athlete_ids'] as $athleteId) {
            $athlete = Athlete::where('id', $athleteId)
                ->where('club_id', $manager->club_id)
                ->where('invite_status', 'accepted')
                ->where('is_active', true)
                ->first();

            if (!$athlete || !$athlete->user_id) { $skipped++; continue; }

            // Skip if already invited for this season
            $exists = SeasonRegistration::where('season_id', $seasonId)
                ->where('athlete_id', $athleteId)
                ->exists();
            if ($exists) { $skipped++; continue; }

            SeasonRegistration::create([
                'id'         => (string) Str::uuid(),
                'season_id'  => $seasonId,
                'athlete_id' => $athleteId,
                'user_id'    => $athlete->user_id,
                'invited_by' => $manager->id,
                'status'     => 'invited',
            ]);

            $feeDollars = number_format($season->fee_cents / 100, 2);
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $athlete->user_id,
                'title'   => "💳 Registration request: {$season->name}",
                'body'    => "You've been invited to register for {$season->name}. Fee: \${$feeDollars} AUD. Tap to pay.",
                'link'    => '/my-registrations',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);

            $athleteUser = User::find($athlete->user_id);
            if ($athleteUser) MailService::seasonInviteToAthlete($athleteUser, $season->club?->name ?? '', $season->name, $season->fee_cents);

            $created++;
        }

        return response()->json(['ok' => true, 'invited' => $created, 'skipped' => $skipped]);
    }

    // Athlete: list my pending + past registration requests
    public function myRegistrations(Request $request)
    {
        $regs = SeasonRegistration::where('user_id', $request->user()->id)
            ->with('season:id,name,start_date,end_date,fee_cents,currency,club_id', 'season.club:id,name,slug,logo_url')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($r) {
                return [
                    'id'             => $r->id,
                    'status'         => $r->status,
                    'payment_method' => $r->payment_method,
                    'paid_at'        => $r->paid_at,
                    'season_name'    => $r->season?->name,
                    'fee_cents'      => $r->season?->fee_cents,
                    'currency'       => $r->season?->currency ?? 'AUD',
                    'club_name'      => $r->season?->club?->name,
                    'club_slug'      => $r->season?->club?->slug,
                    'club_logo'      => $r->season?->club?->logo_url,
                    'start_date'     => $r->season?->start_date,
                    'end_date'       => $r->season?->end_date,
                ];
            });

        return response()->json($regs);
    }

    // Athlete: initiate payment (Stripe or "pay at club")
    public function pay(Request $request, $id)
    {
        $reg = SeasonRegistration::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['invited'])
            ->with('season')
            ->firstOrFail();

        $data = $request->validate([
            'method' => 'required|in:stripe,manual',
        ]);

        if ($data['method'] === 'manual') {
            $reg->update([
                'status'         => 'manual_pending',
                'payment_method' => 'manual',
            ]);

            // Notify manager
            $managers = User::where('club_id', $reg->season->club_id)
                ->where('role', 'club_admin')
                ->get();
            $user = $request->user();
            foreach ($managers as $mgr) {
                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $mgr->id,
                    'title'   => "💰 {$user->full_name} will pay at club",
                    'body'    => "For {$reg->season->name}. Mark as paid when you receive the fee.",
                    'link'    => "/seasons/{$reg->season_id}",
                    'is_read' => false,
                    'at'      => now()->toDateTimeString(),
                ]);
            }

            foreach ($managers as $mgr) {
                MailService::seasonRsvpToManager($mgr, $user, $reg->season->name);
            }

            return response()->json(['ok' => true, 'method' => 'manual']);
        }

        // Stripe payment
        $stripeKey = config('services.stripe.secret');
        if (!$stripeKey) {
            return response()->json(['message' => 'Online payment is not configured. Please select "Pay at club".'], 422);
        }

        // Require the club to have completed Stripe Connect onboarding
        $club = $reg->season->club;
        if (!$club->stripe_connect_id || $club->stripe_connect_status !== 'active') {
            return response()->json([
                'message' => 'Online payment is not available for this club yet. Please select "Pay at club".',
            ], 422);
        }

        \Stripe\Stripe::setApiKey($stripeKey);

        $amount      = $reg->season->fee_cents;
        $feePercent  = (float) config('services.stripe.platform_fee_percent', 0);
        $feeCents    = $feePercent > 0 ? (int) round($amount * $feePercent / 100) : 0;

        $intentParams = [
            'amount'                    => $amount,
            'currency'                  => strtolower($reg->season->currency ?? 'aud'),
            'metadata'                  => ['registration_id' => $reg->id],
            'transfer_data'             => ['destination' => $club->stripe_connect_id],
        ];

        if ($feeCents > 0) {
            $intentParams['application_fee_amount'] = $feeCents;
        }

        $intent = \Stripe\PaymentIntent::create($intentParams);

        $reg->update([
            'payment_method'           => 'stripe',
            'stripe_payment_intent_id' => $intent->id,
        ]);

        return response()->json(['client_secret' => $intent->client_secret]);
    }

    // Athlete: decline a season registration invite
    public function reject(Request $request, $id)
    {
        $reg = SeasonRegistration::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['invited'])
            ->with('season.club')
            ->firstOrFail();

        $reg->update(['status' => 'rejected']);

        $user = $request->user();

        // Notify managers
        $managers = User::where('club_id', $reg->season->club_id)
            ->where('role', 'club_admin')
            ->get();

        foreach ($managers as $mgr) {
            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $mgr->id,
                'title'   => "❌ {$user->full_name} declined {$reg->season->name}",
                'body'    => "They chose not to register for this season.",
                'link'    => "/seasons/{$reg->season_id}",
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);
            MailService::seasonRejectedToManager($mgr, $user, $reg->season->name);
        }

        return response()->json(['ok' => true]);
    }

    // Stripe webhook: confirm payment
    public function stripeWebhook(Request $request)
    {
        $secret    = config('services.stripe.webhook_secret');
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'payment_intent.succeeded') {
            $intentId = $event->data->object->id;
            $reg = SeasonRegistration::where('stripe_payment_intent_id', $intentId)
                ->with('season.club')
                ->first();
            if ($reg) {
                $reg->update(['status' => 'paid', 'paid_at' => now()]);

                // Notify athlete
                Notification::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $reg->user_id,
                    'title'   => '✅ Payment confirmed!',
                    'body'    => "Your registration for {$reg->season?->name} is complete.",
                    'link'    => '/my-registrations',
                    'is_read' => false,
                    'at'      => now()->toDateTimeString(),
                ]);

                // Notify managers
                $athleteUser = User::find($reg->user_id);
                $managers = User::where('club_id', $reg->season->club_id)
                    ->where('role', 'club_admin')
                    ->get();
                foreach ($managers as $mgr) {
                    Notification::create([
                        'id'      => (string) Str::uuid(),
                        'user_id' => $mgr->id,
                        'title'   => "💳 {$athleteUser?->full_name} paid online for {$reg->season->name}",
                        'body'    => "Card payment confirmed. Registration is complete.",
                        'link'    => "/seasons/{$reg->season_id}",
                        'is_read' => false,
                        'at'      => now()->toDateTimeString(),
                    ]);
                    if ($athleteUser) {
                        MailService::seasonPaidOnlineToManager($mgr, $athleteUser, $reg->season->name);
                    }
                }
            }
        }

        return response()->json(['ok' => true]);
    }

    // Club admin: mark a manual payment as confirmed
    public function markPaid(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $reg = SeasonRegistration::where('id', $id)
            ->whereHas('season', fn($q) => $q->where('club_id', $request->user()->club_id))
            ->firstOrFail();

        $reg->update([
            'status'  => 'paid',
            'paid_at' => now(),
            'payment_method' => $reg->payment_method ?? 'manual',
        ]);

        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $reg->user_id,
            'title'   => '✅ Payment confirmed!',
            'body'    => "Your registration for {$reg->season?->name} has been confirmed.",
            'link'    => '/my-registrations',
            'is_read' => false,
            'at'      => now()->toDateTimeString(),
        ]);

        return response()->json(['ok' => true]);
    }

    // Club admin: remove/revoke a registration invite
    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_admin', 'site_admin'])) abort(403);

        $reg = SeasonRegistration::where('id', $id)
            ->whereHas('season', fn($q) => $q->where('club_id', $request->user()->club_id))
            ->whereNotIn('status', ['paid'])
            ->with('season.club')
            ->firstOrFail();

        $reg->delete();

        if ($reg->user_id) {
            $athleteUser = User::find($reg->user_id);
            $clubName    = $reg->season->club?->name ?? '';

            Notification::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $reg->user_id,
                'title'   => "Registration invite withdrawn",
                'body'    => "Your registration invite for {$reg->season->name} has been withdrawn by the club.",
                'link'    => '/my-registrations',
                'is_read' => false,
                'at'      => now()->toDateTimeString(),
            ]);

            if ($athleteUser) {
                MailService::seasonRevokedToAthlete($athleteUser, $clubName, $reg->season->name);
            }
        }

        return response()->json(['ok' => true]);
    }
}
