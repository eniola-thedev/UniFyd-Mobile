import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Access-Control-Allow-Origin": "*" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!paystackSecretKey) return json({ error: "Payment service is not configured" }, 503);

  const authorization = request.headers.get("Authorization") ?? "";
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "You must be signed in" }, 401);

  let reference: string;
  try {
    ({ reference } = await request.json());
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!reference) return json({ error: "reference is required" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, user_id, listing_id, amount, plan, status")
    .eq("reference", reference)
    .maybeSingle();
  if (paymentError || !payment || payment.user_id !== user.id) return json({ error: "Payment not found" }, 404);
  if (payment.status === "SUCCESSFUL") return json({ paid: true, alreadyVerified: true });

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecretKey}` },
  });
  const result = await response.json();
  const valid = response.ok && result.status && result.data?.status === "success" &&
    result.data?.reference === reference && result.data?.currency === "NGN" && result.data?.amount === payment.amount * 100;

  if (!valid) {
    if (response.ok && result.data?.status && result.data.status !== "pending") {
      await admin.from("payments").update({ status: "FAILED", provider_response: result }).eq("id", payment.id);
    }
    return json({ error: "Payment has not been confirmed" }, 422);
  }

  const visibilityDays = payment.plan === "BASIC" ? 7 : payment.plan === "FEATURED" ? 14 : 30;
  const expiresAt = new Date(Date.now() + visibilityDays * 24 * 60 * 60 * 1000).toISOString();
  const { error: paymentUpdateError } = await admin
    .from("payments")
    .update({ status: "SUCCESSFUL", verified_at: new Date().toISOString(), provider_response: result })
    .eq("id", payment.id);
  if (paymentUpdateError) return json({ error: paymentUpdateError.message }, 500);

  if (payment.listing_id) {
    const { error: listingUpdateError } = await admin
      .from("listings")
      .update({
        status: "ACTIVE",
        published_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_featured: payment.plan === "FEATURED" || payment.plan === "CLEARANCE",
        is_clearance: payment.plan === "CLEARANCE",
      })
      .eq("id", payment.listing_id)
      .eq("seller_id", user.id);
    if (listingUpdateError) return json({ error: listingUpdateError.message }, 500);
  }

  return json({ paid: true });
});
