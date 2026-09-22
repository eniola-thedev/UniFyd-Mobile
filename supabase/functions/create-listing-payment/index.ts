import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
const paystackCallbackUrl = `${supabaseUrl}/functions/v1/paystack-callback`;
const returnUrl = "uninest://payment/callback";

const planPrices = { FREE: 0, BASIC: 300, FEATURED: 700, CLEARANCE: 2000 } as const;
type Plan = keyof typeof planPrices;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Access-Control-Allow-Origin": "*" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "You must be signed in" }, 401);

  let listingId: string;
  try {
    ({ listingId } = await request.json());
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!listingId) return json({ error: "listingId is required" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, seller_id, plan, status")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError || !listing || listing.seller_id !== user.id) return json({ error: "Listing not found" }, 404);
  if (listing.status === "ACTIVE") return json({ error: "This listing is already live" }, 409);
  if (!listing.plan || !(listing.plan in planPrices)) return json({ error: "Listing has an invalid payment plan" }, 400);

  const plan = listing.plan as Plan;
  const amount = planPrices[plan];
  if (plan === "FREE") {
    const { count, error: listingCountError } = await admin
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .neq("id", listing.id);
    if (listingCountError) return json({ error: listingCountError.message }, 500);
    if ((count ?? 0) > 0) return json({ error: "The free listing is available only for your first item" }, 403);

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const reference = `free-listing-${listing.id}`;
    const { error: freePaymentError } = await admin.from("payments").upsert({
      listing_id: listing.id,
      user_id: user.id,
      plan,
      amount: 0,
      provider: "free",
      reference,
      status: "SUCCESSFUL",
      verified_at: new Date().toISOString(),
    }, { onConflict: "reference" });
    if (freePaymentError) return json({ error: freePaymentError.message }, 500);
    const { error: publishError } = await admin.from("listings").update({
      status: "ACTIVE", published_at: new Date().toISOString(), expires_at: expiresAt, is_featured: false, is_clearance: false,
    }).eq("id", listing.id).eq("seller_id", user.id);
    if (publishError) return json({ error: publishError.message }, 500);
    return json({ free: true });
  }
  if (!paystackSecretKey) return json({ error: "Payment service is not configured" }, 503);
  if (!user.email) return json({ error: "You must be signed in with an email address" }, 401);
  const reference = `listing-${listing.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const { error: paymentError } = await admin.from("payments").insert({
    listing_id: listing.id,
    user_id: user.id,
    plan,
    amount,
    provider: "paystack",
    reference,
    status: "PENDING",
  });
  if (paymentError) return json({ error: paymentError.message }, 500);

  const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${paystackSecretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      amount: String(amount * 100),
      currency: "NGN",
      reference,
      callback_url: paystackCallbackUrl,
      metadata: JSON.stringify({ listing_id: listing.id, user_id: user.id, plan }),
    }),
  });
  const paystack = await paystackResponse.json();
  if (!paystackResponse.ok || !paystack.status || !paystack.data?.authorization_url) {
    await admin.from("payments").update({ status: "FAILED", provider_response: paystack }).eq("reference", reference);
    return json({ error: paystack.message ?? "Could not initialize payment" }, 502);
  }

  return json({ authorizationUrl: paystack.data.authorization_url, reference, returnUrl });
});
