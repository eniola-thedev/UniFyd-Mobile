import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("WELCOME_EMAIL_FROM") ?? "UniFyd <noreply@unifyd.app>";
const webhookSecret = Deno.env.get("WELCOME_WEBHOOK_SECRET");

const admin = createClient(supabaseUrl, serviceRoleKey);

type WelcomePayload = {
  type?: string;
  table?: string;
  record?: {
    id: string;
    email?: string;
    raw_user_meta_data?: {
      full_name?: string;
      university?: string;
    };
  };
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (webhookSecret && request.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!resendApiKey) {
    return Response.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  let payload: WelcomePayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type && payload.type !== "INSERT") return Response.json({ skipped: true });
  const user = payload.record;
  if (!user) return new Response("Missing user record", { status: 400 });

  const email = user.email;
  if (!email) return Response.json({ error: "No email address" }, { status: 400 });

  const fullName = user.raw_user_meta_data?.full_name ?? "there";
  const university = user.raw_user_meta_data?.university ?? "your campus";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to UniFyd</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; padding: 32px 20px; }
    .card { background: #FFFFFF; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(27, 36, 54, 0.08); }
    .logo { font-size: 28px; font-weight: 800; color: #149A6B; letter-spacing: -0.5px; }
    .logo span { color: #1B2A4A; }
    h1 { font-size: 24px; font-weight: 700; color: #1B2436; margin: 24px 0 8px; }
    p { font-size: 15px; line-height: 1.6; color: #697182; margin: 0 0 16px; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .step-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #E3F6EC; color: #149A6B; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .step-text { font-size: 14px; color: #1B2436; line-height: 1.5; }
    .step-text strong { color: #1B2436; }
    .button { display: inline-block; background: #149A6B; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin-top: 8px; }
    .footer { margin-top: 24px; font-size: 12px; color: #94A3B8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">UniFyd<span>Market</span></div>
      <h1>Welcome to UniFyd, ${fullName}!</h1>
      <p>Your account has been created. UniFyd is the campus marketplace where students at ${university} buy and sell second-hand items with confidence.</p>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text"><strong>Verify your student ID.</strong> Upload a clear photo of your student ID card so you can publish listings.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text"><strong>Browse your campus marketplace.</strong> See what students near you are selling.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text"><strong>Sell something you no longer need.</strong> Post a listing in minutes. New users get one free listing.</div>
        </div>
      </div>

      <a href="uninest://verify" class="button">Get verified</a>

      <div class="footer">
        <p>If you did not create this account, you can ignore this email.</p>
        <p>&copy; 2026 UniFyd Market. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Welcome to UniFyd, ${fullName}!

Your account has been created. UniFyd is the campus marketplace where students at ${university} buy and sell second-hand items with confidence.

Next steps:
1. Verify your student ID. Upload a clear photo of your student ID card so you can publish listings.
2. Browse your campus marketplace. See what students near you are selling.
3. Sell something you no longer need. Post a listing in minutes. New users get one free listing.

Open the app and complete your verification: uninest://verify

If you did not create this account, you can ignore this email.

(c) 2026 UniFyd Market. All rights reserved.
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: `Welcome to UniFyd, ${fullName}!`,
      html,
      text,
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    return Response.json({ error: result }, { status: 502 });
  }
  return Response.json({ ok: true, id: result.id });
});