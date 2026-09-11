import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("MESSAGE_WEBHOOK_SECRET");
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

const admin = createClient(supabaseUrl, serviceRoleKey);

type MessageRecord = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  message: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: MessageRecord;
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
  const message = payload.record;
  if (!message || payload.table && payload.table !== "messages") {
    return new Response("Missing message record", { status: 400 });
  }

  const { data: tokens, error: tokenError } = await admin
    .from("push_tokens")
    .select("token")
    .eq("user_id", message.receiver_id);
  if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 });
  if (!tokens?.length) return Response.json({ sent: 0 });

  const { data: sender } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", message.sender_id)
    .maybeSingle();

  const url = message.listing_id
    ? `uninest://messages/${message.listing_id}?receiverId=${message.sender_id}`
    : "uninest://messages";
  const body = message.message.length > 120 ? `${message.message.slice(0, 117)}...` : message.message;
  const notifications = tokens.map(({ token }) => ({
    to: token,
    title: sender?.full_name ? `${sender.full_name} sent a message` : "New UniFyd message",
    body,
    sound: "default",
    data: { url },
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
