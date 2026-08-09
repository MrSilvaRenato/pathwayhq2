<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Club;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\BillingPortal\Session as PortalSession;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class SubscriptionController extends Controller
{
    private function stripe(): void
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // POST /api/subscription/checkout  { plan: 'pro'|'elite' }
    public function checkout(Request $request)
    {
        $request->validate(['plan' => 'required|in:pro,elite']);

        $user  = $request->user();
        $club  = Club::find($user->club_id);
        if (!$club) return response()->json(['error' => 'No club found.'], 400);

        $priceId = config("services.stripe.price_{$request->plan}");
        if (!$priceId) return response()->json(['error' => 'Plan not configured.'], 500);

        $this->stripe();

        // Create or reuse Stripe customer
        if (!$club->stripe_customer_id) {
            $customer = Customer::create([
                'email'    => $user->email,
                'name'     => $club->name,
                'metadata' => ['club_id' => $club->id],
            ]);
            $club->update(['stripe_customer_id' => $customer->id]);
        }

        $webBase = rtrim(config('app.url'), '/');

        $session = CheckoutSession::create([
            'customer'   => $club->stripe_customer_id,
            'mode'       => 'subscription',
            'line_items' => [[
                'price'    => $priceId,
                'quantity' => 1,
            ]],
            'metadata'            => ['club_id' => $club->id, 'plan' => $request->plan],
            'subscription_data'   => ['metadata' => ['club_id' => $club->id, 'plan' => $request->plan]],
            'success_url'         => "{$webBase}/subscription/success?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url'          => "{$webBase}/subscription/cancel",
            'allow_promotion_codes' => true,
        ]);

        return response()->json(['url' => $session->url]);
    }

    // POST /api/subscription/portal
    public function portal(Request $request)
    {
        $user = $request->user();
        $club = Club::find($user->club_id);
        if (!$club || !$club->stripe_customer_id) {
            return response()->json(['error' => 'No billing account found.'], 400);
        }

        $this->stripe();

        $session = PortalSession::create([
            'customer'   => $club->stripe_customer_id,
            'return_url' => rtrim(config('app.url'), '/') . '/settings',
        ]);

        return response()->json(['url' => $session->url]);
    }

    // POST /api/subscription/webhook  (public — verified by Stripe signature)
    public function webhook(Request $request)
    {
        $secret  = config('services.stripe.webhook_secret');
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature.'], 400);
        }

        match ($event->type) {
            'checkout.session.completed'     => $this->handleCheckoutComplete($event->data->object),
            'customer.subscription.updated'  => $this->handleSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted'  => $this->handleSubscriptionDeleted($event->data->object),
            default => null,
        };

        return response()->json(['ok' => true]);
    }

    private function handleCheckoutComplete(object $session): void
    {
        $clubId = $session->metadata->club_id ?? null;
        $plan   = $session->metadata->plan   ?? null;
        if (!$clubId || !$plan) return;

        Club::where('id', $clubId)->update([
            'subscription_tier'          => $plan,
            'stripe_subscription_id'     => $session->subscription,
            'subscription_status'        => 'active',
            'subscription_ends_at'       => null,
        ]);
    }

    private function handleSubscriptionUpdated(object $subscription): void
    {
        $clubId = $subscription->metadata->club_id ?? null;
        if (!$clubId) return;

        $plan = $subscription->metadata->plan ?? null;

        Club::where('id', $clubId)->update(array_filter([
            'subscription_tier'      => $plan,
            'subscription_status'    => $subscription->status,
            'stripe_subscription_id' => $subscription->id,
            'subscription_ends_at'   => $subscription->cancel_at
                ? \Carbon\Carbon::createFromTimestamp($subscription->cancel_at)
                : null,
        ], fn($v) => $v !== null));
    }

    private function handleSubscriptionDeleted(object $subscription): void
    {
        $clubId = $subscription->metadata->club_id ?? null;
        if (!$clubId) return;

        Club::where('id', $clubId)->update([
            'subscription_tier'    => 'free',
            'subscription_status'  => 'cancelled',
            'subscription_ends_at' => now(),
        ]);
    }
}
