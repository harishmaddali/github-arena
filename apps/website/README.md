# Website App

This app now uses Supabase Auth for GitHub sign-in.

## Environment

Create `apps/website/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

For local Supabase CLI auth, export the GitHub provider secrets before running `supabase start`:

```bash
export SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=your-github-oauth-app-client-id
export SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=your-github-oauth-app-client-secret
```

## GitHub OAuth Setup

1. In Supabase Auth, enable the GitHub provider.
2. Set the provider callback URL in GitHub to `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Add your app callback URL to Supabase redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000/auth/callback`
   - your deployed app callback URL, if applicable
4. Keep the GitHub OAuth scopes aligned with the app: `read:user user:email repo`.

## Session Refresh

`middleware.ts` refreshes Supabase auth cookies on every request to keep App Router reads current. The client auth provider subscribes to auth state changes and refreshes the router after sign-in and sign-out.

The dashboard commit APIs read the authenticated Supabase user first, then use the session's GitHub provider token when available. If GitHub provider access is missing, the private commit endpoint returns `401`.
