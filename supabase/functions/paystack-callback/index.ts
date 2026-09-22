// Paystack redirects successful checkout sessions here. This public endpoint
// only sends the device back to the app; payment verification remains in the
// authenticated verify-listing-payment function.
Deno.serve((request) => {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const redirect = new URL("uninest://payment/callback");
  if (reference) redirect.searchParams.set("reference", reference);
  return Response.redirect(redirect.toString(), 302);
});
