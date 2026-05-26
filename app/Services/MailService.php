<?php

namespace App\Services;

use App\Models\Club;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MailService
{
    // ─── Private helpers ──────────────────────────────────────────────────────

    private static function send(string $to, string $toName, string $subject, string $html): void
    {
        $key = config('services.resend.key');
        if (empty($key)) {
            Log::warning('[MailService] RESEND_API_KEY is not set — email skipped', compact('to', 'subject'));
            return;
        }

        try {
            $response = Http::withToken($key)->post('https://api.resend.com/emails', [
                'from'    => config('mail.from.name') . ' <' . config('mail.from.address') . '>',
                'to'      => ["{$toName} <{$to}>"],
                'subject' => $subject,
                'html'    => $html,
            ]);

            if ($response->failed()) {
                Log::error('[MailService] Resend API error', [
                    'to'      => $to,
                    'subject' => $subject,
                    'status'  => $response->status(),
                    'body'    => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('[MailService] Failed to send email', [
                'to'      => $to,
                'subject' => $subject,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    private static function layout(string $preheader, string $body): string
    {
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PathwayHQ</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">{$preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#10b981;padding:24px 32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">PathwayHQ</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
              {$body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background-color:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">
              &copy; {$year} PathwayHQ &mdash; You received this because you're a member or manager on PathwayHQ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    private static function button(string $label, string $url): string
    {
        return <<<HTML
<p style="margin:24px 0 0;">
  <a href="{$url}" style="display:inline-block;background-color:#10b981;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">{$label}</a>
</p>
HTML;
    }

    private static function appUrl(string $path = ''): string
    {
        return rtrim(config('app.url'), '/') . $path;
    }

    // ─── Public send methods ──────────────────────────────────────────────────

    /**
     * Notify manager(s) that someone wants to join their club.
     */
    public static function joinRequestToManagers(User $manager, User $applicant, Club $club): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $applicantName  = $applicant->full_name ?? $applicant->email;
            $applicantEmail = $applicant->email;
            $clubName       = $club->name;
            $subject        = "{$applicantName} wants to join {$clubName}";

            $body = self::layout(
                "New join request from {$applicantName}",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">New join request</p>
<p style="margin:0 0 16px;color:#4b5563;">Someone has requested to join <strong>{$clubName}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px;width:100%;">
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Name</td><td style="padding:4px 0;font-weight:600;color:#111827;">{$applicantName}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 0;color:#111827;">{$applicantEmail}</td></tr>
</table>
HTML
                . self::button('Review request', self::appUrl('/join-requests'))
            );

            self::send($manager->email, $manager->full_name ?? $manager->email, $subject, $body);
        } catch (\Throwable $e) {
            Log::error('[MailService] joinRequestToManagers failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify athlete that their join request was approved.
     */
    public static function joinRequestApproved(User $athlete, Club $club): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $clubName = $club->name;
            $subject  = "You're in! Welcome to {$clubName}";

            $body = self::layout(
                "Your request to join {$clubName} has been approved!",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Welcome to {$clubName}! 🎉</p>
<p style="margin:0 0 16px;color:#4b5563;">Your request to join <strong>{$clubName}</strong> has been approved. You're now on the roster — head to your dashboard to get started.</p>
HTML
                . self::button('Go to dashboard', self::appUrl('/dashboard'))
            );

            self::send($athlete->email, $athlete->full_name ?? $athlete->email, $subject, $body);
        } catch (\Throwable $e) {
            Log::error('[MailService] joinRequestApproved failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send a broadcast message from a manager to an athlete.
     */
    public static function broadcastToAthlete(User $athlete, string $senderName, string $title, string $body, ?string $link = null): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $subject   = "New message from {$senderName}: {$title}";
            $excerpt   = mb_substr(strip_tags($body), 0, 200);
            $ctaUrl    = $link ? self::appUrl($link) : self::appUrl('/dashboard');
            $escapedTitle   = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
            $escapedSender  = htmlspecialchars($senderName, ENT_QUOTES, 'UTF-8');
            $escapedExcerpt = htmlspecialchars($excerpt, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "New message from {$senderName}",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">{$escapedTitle}</p>
<p style="margin:0 0 16px;color:#4b5563;">You have a new notification from <strong>{$escapedSender}</strong>.</p>
<p style="margin:0 0 16px;color:#374151;background-color:#f9fafb;border-left:3px solid #10b981;padding:12px 16px;border-radius:0 4px 4px 0;">{$escapedExcerpt}</p>
HTML
                . self::button('View on dashboard', $ctaUrl)
            );

            self::send($athlete->email, $athlete->full_name ?? $athlete->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] broadcastToAthlete failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify an athlete about a new club announcement.
     */
    public static function announcementToAthlete(User $athlete, string $clubName, string $title, string $body): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $subject        = "📢 New announcement from {$clubName}";
            $excerpt        = mb_substr(strip_tags($body), 0, 200);
            $escapedClub    = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedTitle   = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
            $escapedExcerpt = htmlspecialchars($excerpt, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "New announcement from {$clubName}",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">{$escapedTitle}</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedClub}</strong> posted a new announcement.</p>
<p style="margin:0 0 16px;color:#374151;background-color:#f9fafb;border-left:3px solid #10b981;padding:12px 16px;border-radius:0 4px 4px 0;">{$escapedExcerpt}</p>
HTML
                . self::button('Read announcement', self::appUrl('/announcements'))
            );

            self::send($athlete->email, $athlete->full_name ?? $athlete->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] announcementToAthlete failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify a club member about a new volunteering opportunity.
     */
    public static function volunteeringCreatedToMember(User $member, string $clubName, string $title, ?string $date, ?string $location): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $subject      = "🙋 New volunteering opportunity: {$title}";
            $escapedClub  = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

            $detailRows = '';
            if ($date) {
                $dateFormatted = date('D j M Y', strtotime($date));
                $detailRows .= "<tr><td style='padding:4px 0;color:#6b7280;font-size:13px;'>Date</td><td style='padding:4px 0;color:#111827;'>{$dateFormatted}</td></tr>";
            }
            if ($location) {
                $escapedLocation = htmlspecialchars($location, ENT_QUOTES, 'UTF-8');
                $detailRows .= "<tr><td style='padding:4px 0;color:#6b7280;font-size:13px;'>Location</td><td style='padding:4px 0;color:#111827;'>{$escapedLocation}</td></tr>";
            }

            $detailTable = $detailRows
                ? "<table cellpadding='0' cellspacing='0' style='background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px;width:100%;'>{$detailRows}</table>"
                : '';

            $html = self::layout(
                "New volunteering opportunity from {$clubName}",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">{$escapedTitle}</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedClub}</strong> has posted a new volunteering opportunity.</p>
{$detailTable}
HTML
                . self::button('Sign up', self::appUrl('/volunteering'))
            );

            self::send($member->email, $member->full_name ?? $member->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] volunteeringCreatedToMember failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify a manager that a volunteer signed up.
     */
    public static function volunteeringSignupToManager(User $manager, User $volunteer, string $volunteeringTitle, ?string $date): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $volunteerName  = $volunteer->full_name ?? $volunteer->email;
            $volunteerEmail = $volunteer->email;
            $subject        = "{$volunteerName} signed up to volunteer";
            $escapedTitle   = htmlspecialchars($volunteeringTitle, ENT_QUOTES, 'UTF-8');
            $escapedName    = htmlspecialchars($volunteerName, ENT_QUOTES, 'UTF-8');

            $dateRow = '';
            if ($date) {
                $dateFormatted = date('D j M Y', strtotime($date));
                $dateRow = "<tr><td style='padding:4px 0;color:#6b7280;font-size:13px;'>Date</td><td style='padding:4px 0;color:#111827;'>{$dateFormatted}</td></tr>";
            }

            $html = self::layout(
                "{$volunteerName} signed up for {$volunteeringTitle}",
                <<<HTML
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedName}</strong> has signed up for the volunteering opportunity <strong>&ldquo;{$escapedTitle}&rdquo;</strong>.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px;width:100%;">
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Name</td><td style="padding:4px 0;color:#111827;">{$escapedName}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 0;color:#111827;">{$volunteerEmail}</td></tr>
  {$dateRow}
</table>
HTML
                . self::button('View volunteering', self::appUrl('/volunteering'))
            );

            self::send($manager->email, $manager->full_name ?? $manager->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] volunteeringSignupToManager failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify an athlete they've been invited to register for a season.
     */
    public static function seasonInviteToAthlete(User $athlete, string $clubName, string $seasonName, int $feeCents): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $subject        = "💳 Registration request: {$seasonName}";
            $feeDollars     = number_format($feeCents / 100, 2);
            $escapedClub    = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedSeason  = htmlspecialchars($seasonName, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "Registration request for {$seasonName}",
                <<<HTML
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Season registration: {$escapedSeason}</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedClub}</strong> has invited you to register for <strong>{$escapedSeason}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px;width:100%;">
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Season</td><td style="padding:4px 0;color:#111827;">{$escapedSeason}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Fee</td><td style="padding:4px 0;font-weight:600;color:#111827;">\${$feeDollars} AUD</td></tr>
</table>
HTML
                . self::button('View registration', self::appUrl('/my-registrations'))
            );

            self::send($athlete->email, $athlete->full_name ?? $athlete->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] seasonInviteToAthlete failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify a manager that an athlete chose to pay at the club.
     */
    public static function seasonRsvpToManager(User $manager, User $athlete, string $seasonName): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $athleteName  = $athlete->full_name ?? $athlete->email;
            $athleteEmail = $athlete->email;
            $subject      = "{$athleteName} will pay at club for {$seasonName}";
            $escapedName  = htmlspecialchars($athleteName, ENT_QUOTES, 'UTF-8');
            $escapedSeason = htmlspecialchars($seasonName, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "{$athleteName} selected pay at club for {$seasonName}",
                <<<HTML
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedName}</strong> has selected <strong>&ldquo;Pay at club&rdquo;</strong> for the season <strong>{$escapedSeason}</strong>.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:8px;width:100%;">
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Name</td><td style="padding:4px 0;color:#111827;">{$escapedName}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 0;color:#111827;">{$athleteEmail}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Season</td><td style="padding:4px 0;color:#111827;">{$escapedSeason}</td></tr>
</table>
<p style="margin:16px 0 0;color:#4b5563;font-size:13px;">Mark their registration as paid once you collect the fee.</p>
HTML
                . self::button('View season', self::appUrl('/seasons'))
            );

            self::send($manager->email, $manager->full_name ?? $manager->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] seasonRsvpToManager failed', ['error' => $e->getMessage()]);
        }
    }
}
