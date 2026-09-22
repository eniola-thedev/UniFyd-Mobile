import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
const webhookSecret = Deno.env.get("VERIFICATION_WEBHOOK_SECRET");

const admin = createClient(supabaseUrl, serviceRoleKey);

type VerificationRecord = {
  id: string;
  full_name: string;
  university: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: VerificationRecord;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (webhookSecret && request.headers.get("x-webhook-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type && payload.type !== "INSERT") return Response.json({ skipped: true });
  const verification = payload.record;
  if (!verification || payload.table && payload.table !== "verifications") {
    return new Response("Missing verification record", { status: 400 });
  }

  // Find all admin users and their push tokens.
  const { data: adminRoles, error: rolesError } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (rolesError) return Response.json({ error: rolesError.message }, { status: 500 });
  if (!adminRoles?.length) return Response.json({ sent: 0, reason: "No admins found" });

  const adminIds = adminRoles.map((r) => r.user_id);
  const { data: tokens, error: tokenError } = await admin
    .from("push_tokens")
    .select("token")
    .in("user_id", adminIds);
  if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 });
  if (!tokens?.length) return Response.json({ sent: 0, reason: "No admin push tokens" });

  const name = verification.full_name || "A student";
  const uni = verification.university || "your campus";

  const notifications = tokens.map(({ token }) => ({
    to: token,
    title: "New verification request",
    body: `${name} from ${uni} submitted their student ID for review.`,
    sound: "default",
    data: { url: "uninest://admin/verifications" },
    ...(expoAccessToken ? { channelId: "default" } : {}),
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
    },
    body: JSON.stringify(notifications),
  });

  const result = await response.json();
  if (!response.ok) return Response.json({ error: result }, { status: 502 });
  return Response.json({ sent: notifications.length, result });
});