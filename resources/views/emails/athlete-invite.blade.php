<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You've been added to {{ $clubName }}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; padding: 0 16px; }
    .card { background: #1e293b; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .logo-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-text { color: #fff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 800; margin: 0; }
    .body { padding: 32px; }
    .body p { color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .body p strong { color: #e2e8f0; }
    .btn { display: block; text-align: center; background: #10b981; color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 12px; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
    .small { color: #475569; font-size: 12px; line-height: 1.6; }
    .small a { color: #10b981; word-break: break-all; }
    .footer { padding: 0 32px 28px; }
    .footer p { color: #334155; font-size: 12px; text-align: center; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">
          <span class="logo-text">⚡ PathwayHQ</span>
        </div>
        <h1>You've been added to {{ $clubName }}</h1>
      </div>

      <div class="body">
        <p>Hi <strong>{{ $firstName }}</strong>,</p>
        <p>
          <strong>{{ $clubName }}</strong> has created an athlete profile for you on PathwayHQ —
          the platform they use to manage athlete development, training calendars, milestones, and more.
        </p>
        <p>
          Click the button below to create your free account and claim your profile.
          Once claimed, you'll be able to see your development pathway, upcoming sessions, and any milestones your coaches log for you.
        </p>

        @php
          $url = config('app.url') . ':5173/claim/' . $token;
        @endphp

        <a href="{{ $url }}" class="btn">Claim my athlete profile →</a>

        <hr class="divider" />

        <p class="small">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="{{ $url }}">{{ $url }}</a>
        </p>
        <p class="small">
          If you weren't expecting this email, you can safely ignore it. No account will be created without your action.
        </p>
      </div>

      <div class="footer">
        <p>© {{ date('Y') }} PathwayHQ · Built in Brisbane</p>
      </div>
    </div>
  </div>
</body>
</html>
