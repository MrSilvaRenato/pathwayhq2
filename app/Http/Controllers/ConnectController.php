<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Club;
use Stripe\Stripe;
use Stripe\Account;
use Stripe\AccountLink;
use Stripe\LoginLink;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class ConnectController extends Controller
{
    private function stripe(): void
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // POST /api/connect/onboard
    // Creates (or resumes) a Stripe Express account and returns the onboarding URL.
    public function onboard(Request $request)
    {
        $user = $request->user();
        $club = Club::find($user->club_id);
        if (!$club) return response()->json(['error' => 'No club found.'], 400);

        $this->stripe();

        // Create Express account if not already created
        if (!$club->stripe_connect_id) {
            $account = Account::create([
                'type'         => 'express',
                'country'      => 'AU',
                'email'        => $user->email,
                'capabilities' => [
                    'card_payments' => ['requested' => true],
                    'transfers'     => ['requested' => true],
                ],
                'business_type' => 'company',
                'metadata'      => ['club_id' => $club->id, 'club_name' => $club->name],
            ]);
            $club->update([
                'stripe_connect_id'     => $account->id,
                'stripe_connect_status' => 'pending',
            ]);
        }

        $webBase = rtrim(config('app.url'), '/');

        $link = AccountLink::create([
            'account'     => $club->stripe_connect_id,
            'refresh_url' => "{$webBase}/settings?connect=refresh",
            'return_url'  => "{$webBase}/settings?connect=success",
            'type'        => 'account_onboarding',
        ]);

        return response()->json(['url' => $link->url]);
    }

    // POST /api/connect/login-link
    // Returns a link to the club's Stripe Express dashboard.
    public function loginLink(Request $request)
    {
        $user = $request->user();
        $club = Club::find($user->club_id);

        if (!$club || !$club->stripe_connect_id) {
            return response()->json(['error' => 'No connected account found.'], 400);
        }

        if ($club->stripe_connect_status !== 'active') {
            return response()->json(['error' => 'Account is not fully activated yet.'], 400);
        }

        $this->stripe();

        $link = LoginLink::create($club->stripe_connect_id);

        return response()->json(['url' => $link->url]);
    }

    // GET /api/connect/status
    // Returns the club's current Connect status.
    public function status(Request $request)
    {
        $user = $request->user();
        $club = Club::find($user->club_id);
        if (!$club) return response()->json(null);

        return response()->json([
            'connected' => (bool) $club->stripe_connect_id,
            'status'    => $club->stripe_connect_status,
        ]);
    }

    // POST /api/connect/webhook  (public)
    // Handles Stripe Connect account status updates.
    public function webhook(Request $request)
    {
        $secret    = config('services.stripe.connect_webhook_secret');
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature.'], 400);
        }

        if ($event->type === 'account.updated') {
            $account = $event->data->object;
            $club    = Club::where('stripe_connect_id', $account->id)->first();
            if (!$club) return response()->json(['ok' => true]);

            $chargesEnabled  = $account->charges_enabled;
            $payoutsEnabled  = $account->payouts_enabled;
            $detailsSubmitted = $account->details_submitted;

            $status = 'pending';
            if ($chargesEnabled && $payoutsEnabled) {
                $status = 'active';
            } elseif ($detailsSubmitted) {
                $status = 'restricted';
            }

            $club->update(['stripe_connect_status' => $status]);
        }

        return response()->json(['ok' => true]);
    }
}
