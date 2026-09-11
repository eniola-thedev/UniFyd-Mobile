# Supabase Edge Functions

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
