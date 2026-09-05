# DEAD PIXELS Whitelist

Production-ready static whitelist site for DEAD PIXELS.

## Enforced rules
- Google OAuth authentication
- 1 Google account = 1 whitelist application
- 1 wallet address = 1 whitelist application
- Wallet is normalized to lowercase
- Maximum 10,000 applications
- Users can only read their own application
- Google provider is enforced again inside the database RPC
- Users cannot directly insert/update/delete whitelist rows
- Submission is enforced through a PostgreSQL RPC with a transaction lock

## One-time Supabase setup
1. Create/open a Supabase project.
2. SQL Editor -> run `supabase/setup.sql`.
3. Authentication -> Providers -> Google -> enable Google and add your Google OAuth Client ID + Client Secret.
4. Authentication -> URL Configuration:
   - Site URL: your production Vercel URL
   - Redirect URLs: add your production URL and any preview URL you use.
5. Project Settings -> API -> copy Project URL and anon/public key.
6. Put them in `config.js`.
7. Deploy the folder to Vercel.

## Google Cloud OAuth
Create a Web application OAuth client in Google Cloud Console.
Use the Supabase callback URL shown in Supabase's Google provider settings as an Authorized redirect URI.

## Admin / CSV export
In Supabase Dashboard -> Table Editor -> `whitelist_applications`, filter `status = accepted` if needed, then Export CSV.
Useful columns for allowlist export are `wallet_address` and `status`.

The public site never needs a service-role key. Do not put a service-role key in `config.js`.
