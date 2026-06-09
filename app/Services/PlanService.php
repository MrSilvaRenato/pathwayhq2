<?php

namespace App\Services;

use App\Models\Club;
use Illuminate\Http\JsonResponse;

class PlanService
{
    public static function upgradeResponse(string $message, string $requiredPlan = 'pro'): JsonResponse
    {
        return response()->json([
            'error'            => $message,
            'upgrade_required' => true,
            'required_plan'    => $requiredPlan,
        ], 403);
    }

    public static function hasFeature(Club $club, string $feature): bool
    {
        return (bool) config("plans.{$club->subscription_tier}.features.{$feature}", false);
    }

    public static function limit(Club $club, string $key): int
    {
        return (int) config("plans.{$club->subscription_tier}.limits.{$key}", 0);
    }

    // Returns null if allowed, or a 403 JsonResponse if blocked.
    public static function checkFeature(Club $club, string $feature, string $requiredPlan = 'pro'): ?JsonResponse
    {
        if (!self::hasFeature($club, $feature)) {
            $planName = ucfirst($requiredPlan);
            return self::upgradeResponse("This feature requires the {$planName} plan.", $requiredPlan);
        }
        return null;
    }

    public static function checkAthleteLimit(Club $club): ?JsonResponse
    {
        $limit = self::limit($club, 'athletes');
        if ($limit === -1) return null;

        $current = $club->athletes()->where('is_active', true)->count();
        if ($current >= $limit) {
            return self::upgradeResponse(
                "Your plan allows up to {$limit} active athletes. Upgrade to add more."
            );
        }
        return null;
    }

    public static function checkSquadLimit(Club $club): ?JsonResponse
    {
        $limit = self::limit($club, 'squads');
        if ($limit === -1) return null;

        $current = \App\Models\Squad::where('club_id', $club->id)->count();
        if ($current >= $limit) {
            return self::upgradeResponse(
                "Your plan allows up to {$limit} squad" . ($limit === 1 ? '' : 's') . ". Upgrade to create more."
            );
        }
        return null;
    }

    public static function checkAnnouncementLimit(Club $club): ?JsonResponse
    {
        $limit = self::limit($club, 'announcements');
        if ($limit === -1) return null;

        $current = \App\Models\Announcement::where('club_id', $club->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        if ($current >= $limit) {
            return self::upgradeResponse(
                "Your free plan allows {$limit} announcement" . ($limit === 1 ? '' : 's') . " per month. Upgrade for unlimited."
            );
        }
        return null;
    }
}
