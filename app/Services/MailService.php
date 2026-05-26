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
            $managerName    = $manager->full_name ?? 'there';
            $applicantName  = $applicant->full_name ?? $applicant->email;
            $applicantEmail = $applicant->email;
            $clubName       = $club->name;
            $subject        = "{$applicantName} wants to join {$clubName}";

            $body = self::layout(
                "New join request from {$applicantName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Someone wants to join your club!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$managerName},</p>
<p style="margin:0 0 16px;color:#4b5563;">Great news — <strong>{$applicantName}</strong> has just submitted a request to join <strong>{$clubName}</strong>. They're keen to be part of your team and are waiting for your approval.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:16px;width:100%;">
  <tr><td style="padding:4px 8px;color:#6b7280;font-size:13px;width:80px;">Name</td><td style="padding:4px 8px;font-weight:600;color:#111827;">{$applicantName}</td></tr>
  <tr><td style="padding:4px 8px;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 8px;color:#111827;">{$applicantEmail}</td></tr>
</table>
<p style="margin:0;color:#4b5563;">Head over to your dashboard to review and approve their request. Growing your club with motivated members is what it's all about!</p>
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
            $athleteName = $athlete->full_name ? explode(' ', $athlete->full_name)[0] : 'there';
            $clubName    = $club->name;
            $subject     = "You're in! Welcome to {$clubName} 🎉";

            $body = self::layout(
                "Your request to join {$clubName} has been approved!",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Welcome to the team!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$athleteName},</p>
<p style="margin:0 0 16px;color:#4b5563;">Your request to join <strong>{$clubName}</strong> has been approved — and we couldn't be more excited to have you on board! You're now officially part of the team.</p>
<p style="margin:0 0 16px;color:#4b5563;">Here's to new beginnings, great training sessions, and unforgettable moments ahead. Your journey with <strong>{$clubName}</strong> starts right now.</p>
<p style="margin:0 0 16px;color:#4b5563;">Log in to your dashboard to explore your profile, check for upcoming events, and connect with your club.</p>
<p style="margin:0;color:#4b5563;">We're glad you're here. Let's make this season one to remember! 🏆</p>
HTML
                . self::button('Go to my dashboard', self::appUrl('/dashboard'))
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
            $athleteName    = $athlete->full_name ? explode(' ', $athlete->full_name)[0] : 'there';
            $subject        = "Message from {$senderName}: {$title}";
            $excerpt        = mb_substr(strip_tags($body), 0, 300);
            $ctaUrl         = $link ? self::appUrl($link) : self::appUrl('/dashboard');
            $escapedTitle   = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
            $escapedSender  = htmlspecialchars($senderName, ENT_QUOTES, 'UTF-8');
            $escapedExcerpt = htmlspecialchars($excerpt, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "New message from {$senderName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">You've got a message!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$athleteName},</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedSender}</strong> has sent you a message. Here's what they had to say:</p>
<div style="margin:0 0 16px;background-color:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 6px 6px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">{$escapedTitle}</p>
  <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">{$escapedExcerpt}</p>
</div>
<p style="margin:0;color:#4b5563;">Head to your dashboard to read the full message and stay up to date with everything happening at your club.</p>
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
            $athleteName    = $athlete->full_name ? explode(' ', $athlete->full_name)[0] : 'there';
            $subject        = "Announcement from {$clubName}: {$title}";
            $excerpt        = mb_substr(strip_tags($body), 0, 300);
            $escapedClub    = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedTitle   = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
            $escapedExcerpt = htmlspecialchars($excerpt, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "New announcement from {$clubName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Club announcement</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$athleteName},</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedClub}</strong> just posted a new announcement. Here's the latest news from your club — don't miss it!</p>
<div style="margin:0 0 16px;background-color:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 6px 6px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">{$escapedTitle}</p>
  <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">{$escapedExcerpt}</p>
</div>
<p style="margin:0;color:#4b5563;">Stay informed and keep up with everything going on at your club. Click below to read the full announcement.</p>
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
            $memberName   = $member->full_name ? explode(' ', $member->full_name)[0] : 'there';
            $subject      = "Volunteer opportunity: {$title}";
            $escapedClub  = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

            $detailRows = '';
            if ($date) {
                $dateFormatted = date('D j M Y', strtotime($date));
                $detailRows .= "<tr><td style='padding:5px 8px;color:#6b7280;font-size:13px;width:80px;'>Date</td><td style='padding:5px 8px;font-weight:600;color:#111827;'>{$dateFormatted}</td></tr>";
            }
            if ($location) {
                $escapedLocation = htmlspecialchars($location, ENT_QUOTES, 'UTF-8');
                $detailRows .= "<tr><td style='padding:5px 8px;color:#6b7280;font-size:13px;'>Location</td><td style='padding:5px 8px;font-weight:600;color:#111827;'>{$escapedLocation}</td></tr>";
            }

            $detailTable = $detailRows
                ? "<table cellpadding='0' cellspacing='0' style='background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 8px;margin:0 0 16px;width:100%;'>{$detailRows}</table>"
                : '';

            $html = self::layout(
                "New volunteering opportunity from {$clubName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Make a difference!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$memberName},</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedClub}</strong> has a new volunteering opportunity and would love your help. Volunteering is a fantastic way to give back to your club, meet other members, and make a real impact.</p>
<div style="margin:0 0 16px;background-color:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 6px 6px 0;">
  <p style="margin:0 0 12px;font-weight:600;font-size:16px;color:#111827;">{$escapedTitle}</p>
  {$detailTable}
</div>
<p style="margin:0;color:#4b5563;">Every hand counts — sign up today and be a part of something bigger than the game!</p>
HTML
                . self::button('Sign up to volunteer', self::appUrl('/volunteering'))
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
            $managerName    = $manager->full_name ? explode(' ', $manager->full_name)[0] : 'there';
            $volunteerName  = $volunteer->full_name ?? $volunteer->email;
            $volunteerEmail = $volunteer->email;
            $subject        = "{$volunteerName} signed up to volunteer";
            $escapedTitle   = htmlspecialchars($volunteeringTitle, ENT_QUOTES, 'UTF-8');
            $escapedName    = htmlspecialchars($volunteerName, ENT_QUOTES, 'UTF-8');

            $dateRow = '';
            if ($date) {
                $dateFormatted = date('D j M Y', strtotime($date));
                $dateRow = "<tr><td style='padding:5px 8px;color:#6b7280;font-size:13px;width:80px;'>Date</td><td style='padding:5px 8px;font-weight:600;color:#111827;'>{$dateFormatted}</td></tr>";
            }

            $html = self::layout(
                "{$volunteerName} signed up for {$volunteeringTitle}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">A new volunteer has signed up!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$managerName},</p>
<p style="margin:0 0 16px;color:#4b5563;">Great news! <strong>{$escapedName}</strong> has put their hand up to volunteer for <strong>&ldquo;{$escapedTitle}&rdquo;</strong>. It's wonderful to see members stepping up and supporting the club — please take a moment to appreciate them!</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 8px;margin-bottom:16px;width:100%;">
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;width:80px;">Name</td><td style="padding:5px 8px;font-weight:600;color:#111827;">{$escapedName}</td></tr>
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;">Email</td><td style="padding:5px 8px;color:#111827;">{$volunteerEmail}</td></tr>
  {$dateRow}
</table>
<p style="margin:0;color:#4b5563;">Head to your volunteering page to manage sign-ups and keep everything running smoothly on the day.</p>
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
            $athleteName    = $athlete->full_name ? explode(' ', $athlete->full_name)[0] : 'there';
            $subject        = "Season registration: {$seasonName}";
            $feeDollars     = number_format($feeCents / 100, 2);
            $escapedClub    = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');
            $escapedSeason  = htmlspecialchars($seasonName, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "You've been invited to register for {$seasonName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Your season is about to begin!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$athleteName},</p>
<p style="margin:0 0 16px;color:#4b5563;">Exciting times ahead — <strong>{$escapedClub}</strong> has invited you to register for the upcoming season. This is your chance to lock in your spot and get ready for another great year of competition.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 8px;margin-bottom:16px;width:100%;">
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;width:80px;">Season</td><td style="padding:5px 8px;font-weight:600;color:#111827;">{$escapedSeason}</td></tr>
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;">Club</td><td style="padding:5px 8px;font-weight:600;color:#111827;">{$escapedClub}</td></tr>
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;">Registration fee</td><td style="padding:5px 8px;font-weight:700;font-size:16px;color:#10b981;">\${$feeDollars} AUD</td></tr>
</table>
<p style="margin:0;color:#4b5563;">Don't miss out — complete your registration now and secure your place in the team. We can't wait to see you out there!</p>
HTML
                . self::button('Register now', self::appUrl('/my-registrations'))
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
            $managerName   = $manager->full_name ? explode(' ', $manager->full_name)[0] : 'there';
            $athleteName   = $athlete->full_name ?? $athlete->email;
            $athleteEmail  = $athlete->email;
            $subject       = "Action needed: {$athleteName} will pay at club for {$seasonName}";
            $escapedName   = htmlspecialchars($athleteName, ENT_QUOTES, 'UTF-8');
            $escapedSeason = htmlspecialchars($seasonName, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "{$athleteName} selected pay at club for {$seasonName}",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Payment to collect at club</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$managerName},</p>
<p style="margin:0 0 16px;color:#4b5563;"><strong>{$escapedName}</strong> has confirmed their registration for <strong>{$escapedSeason}</strong> and has chosen to <strong>pay at the club</strong> in person.</p>
<table cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 8px;margin-bottom:16px;width:100%;">
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;width:80px;">Name</td><td style="padding:5px 8px;font-weight:600;color:#111827;">{$escapedName}</td></tr>
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;">Email</td><td style="padding:5px 8px;color:#111827;">{$athleteEmail}</td></tr>
  <tr><td style="padding:5px 8px;color:#6b7280;font-size:13px;">Season</td><td style="padding:5px 8px;font-weight:600;color:#111827;">{$escapedSeason}</td></tr>
</table>
<p style="margin:0 0 16px;color:#4b5563;">Once you've collected their payment, remember to mark their registration as paid in the system to keep your records up to date.</p>
<p style="margin:0;color:#4b5563;">Thanks for keeping things running smoothly — your athletes appreciate it!</p>
HTML
                . self::button('View season registrations', self::appUrl('/seasons'))
            );

            self::send($manager->email, $manager->full_name ?? $manager->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] seasonRsvpToManager failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify an athlete they have been added to a squad.
     */
    public static function squadAddedToAthlete(User $athlete, string $squadName, string $clubName): void
    {
        $key = config('services.resend.key');
        if (empty($key)) return;

        try {
            $athleteName   = $athlete->full_name ? explode(' ', $athlete->full_name)[0] : 'there';
            $subject       = "You've been added to {$squadName}";
            $escapedSquad  = htmlspecialchars($squadName, ENT_QUOTES, 'UTF-8');
            $escapedClub   = htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8');

            $html = self::layout(
                "You're now part of the {$squadName} squad",
                <<<HTML
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">You've been added to a squad!</p>
<p style="margin:0 0 16px;color:#4b5563;">Hi {$athleteName},</p>
<p style="margin:0 0 16px;color:#4b5563;">Great news — <strong>{$escapedClub}</strong> has added you to the <strong>{$escapedSquad}</strong> squad. You're officially part of the group!</p>
<p style="margin:0 0 16px;color:#4b5563;">Your coach will be in touch with training schedules, sessions, and any upcoming events for your squad. Keep an eye on your dashboard for updates.</p>
<p style="margin:0;color:#4b5563;">Time to train hard and make your squad proud. See you out there!</p>
HTML
                . self::button('View my dashboard', self::appUrl('/dashboard'))
            );

            self::send($athlete->email, $athlete->full_name ?? $athlete->email, $subject, $html);
        } catch (\Throwable $e) {
            Log::error('[MailService] squadAddedToAthlete failed', ['error' => $e->getMessage()]);
        }
    }
}
