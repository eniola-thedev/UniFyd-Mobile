# Supabase Edge Functions

## Paystack listing payments

The mobile app creates a pending listing, opens Paystack Checkout, then calls a
server-side verification endpoint before publishing the listing. The Paystack
secret key is never bundled into the Expo app.

Apply `supabase/migrations/20260916_paystack_payments.sql`, then set the secret
in the Supabase project (use `sk_test_...` while testing):

```bash
supabase secrets set PAYSTACK_SECRET_KEY="sk_test_your_key"
```

Deploy the authenticated payment functions normally, and make the redirect-only
callback public because Paystack calls it from its hosted checkout:

```bash
supabase functions deploy create-listing-payment
supabase functions deploy verify-listing-payment
supabase functions deploy paystack-callback --no-verify-jwt
```

The callback function is an HTTPS URL generated from `SUPABASE_URL`; it returns
the customer to `uninest://payment/callback`. The scheme is already declared in
`app.json`. Test this in a development or production build, not Expo Go.

## Welcome emails for new signups

Function: `send-welcome-email`

Sends a branded welcome email to every new user via Resend. It is triggered by a
database webhook on `auth.users` so no client code is required.

Deploy it with the Supabase CLI:

```bash
supabase functions deploy send-welcome-email --no-verify-jwt
```

Set these function secrets:

```bash
supabase secrets set RESEND_API_KEY="re_xxx"
supabase secrets set WELCOME_EMAIL_FROM="UniFyd <noreply@unifyd.app>"
supabase secrets set WELCOME_WEBHOOK_SECRET="use-a-long-random-value"
```

In the Supabase Dashboard, create a Database Webhook:

- Table: `auth.users`
- Events: `INSERT`
- Method: `POST`
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email`
- Header: `x-webhook-secret: use-a-long-random-value`

The function reads the new user's email and display name from `raw_user_meta_data`
and sends a welcome email with steps for verifying their student ID.

## New-message push notifications

Function: `notify-new-message`

Deploy it with the Supabase CLI from the project root:

```bash
supabase functions deploy notify-new-message --no-verify-jwt
```

Set these function secrets:

```bash
supabase secrets set MESSAGE_WEBHOOK_SECRET="use-a-long-random-value"
supabase secrets set EXPO_ACCESS_TOKEN="your-expo-access-token"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available to deployed Supabase functions automatically. The service-role key must remain server-side.

In Supabase Dashboard, create a Database Webhook:

- Table: `public.messages`
- Events: `INSERT`
- Method: `POST`
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-new-message`
- Header: `x-webhook-secret: use-a-long-random-value`

The function looks up the recipient's rows in `push_tokens` and sends an Expo notification containing a deep link to the conversation.

## New-verification push notifications for admins

Function: `notify-new-verification`

When a student submits their student ID for review, this function finds every admin
user with a registered push token and sends them a notification that opens the
admin verification review screen.

Deploy it with the Supabase CLI:

```bash
supabase functions deploy notify-new-verification --no-verify-jwt
```

Set these function secrets:

```bash
supabase secrets set VERIFICATION_WEBHOOK_SECRET="use-a-long-random-value"
supabase secrets set EXPO_ACCESS_TOKEN="your-expo-access-token"
```

In the Supabase Dashboard, create a Database Webhook:

- Table: `public.verifications`
- Events: `INSERT`
- Method: `POST`
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-new-verification`
- Header: `x-webhook-secret: use-a-long-random-value`

The function looks up all admin roles, fetches their push tokens, and sends an Expo
notification with a deep link to `uninest://admin/verifications`.
