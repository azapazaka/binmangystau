# CityPulse

CityPulse is a Russian-language MVP for reporting urban infrastructure issues in Almaty. Citizens submit photo-backed reports from the public site, and municipal operators review prioritized clusters in a protected dashboard.

## Stack

- Next.js 16 + App Router + TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres + Storage
- Mapbox GL JS
- AI image validation/classification through a server-side provider abstraction
- Netlify for deployment

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in Supabase credentials before running the app. Runtime without Supabase is no longer supported.
3. Mapbox already has a committed public fallback token, but you can override it with `NEXT_PUBLIC_MAPBOX_TOKEN`.
4. Keep `AI_PROVIDER=mock` for local development until a real provider key is configured. If you want to use OpenRouter, set `AI_PROVIDER=openrouter` and fill `OPENROUTER_API_KEY`.
5. Install dependencies:

```bash
npm install
```

6. Run the app:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Supabase setup

The repo is designed for a mixed setup:

- schema, policies, profile sync, avatar storage rules, and profile persistence live in repo migrations
- project creation, report-photo bucket setup, secrets, and initial admin users are configured manually in Supabase dashboard

Use a separate test Supabase project first, then move the same settings to production after verification.

1. Create a Supabase project.
2. In `Authentication -> Sign In / Providers`, keep Email enabled and turn on email confirmation for citizen sign-up.
3. Apply the SQL files from [`supabase/migrations`](/C:/Users/User/Desktop/Decentrthon/decentr/supabase/migrations) strictly in order, from the oldest timestamp to the newest.
5. Fill `.env.local` with:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=reports`
   - `SUPABASE_AVATAR_BUCKET=avatars`
6. Run `npm run supabase:bootstrap-demo-users` to create or refresh the repo demo citizen/admin accounts in Supabase and ensure the `reports` / `avatars` buckets exist with the expected limits.
7. Create any additional real admins manually in `Authentication -> Users`.
8. Set this metadata on each real admin user:

```json
{
  "role": "admin",
  "full_name": "CityPulse Admin"
}
```

Notes:

- Citizen self-registration is enabled through Supabase Auth.
- Admin self-registration is intentionally disabled in the app for now.
- The auth sync migration mirrors `auth.users` into `public.users`, so real citizen accounts become available to the rest of the app automatically.
- User profiles now persist in `public.user_profiles`, and avatar uploads are stored in the `avatars` bucket created by migrations.
- Cluster status history now records the admin UUID, which matches the `status_history.changed_by` foreign key.

## Deployment

- Connect the GitHub repo to Netlify.
- Add all environment variables from `.env.example`.
- Deploy from `main`.

## MVP scope

- Public report submission page
- Public Almaty map with filtered issue clusters
- Admin login and operator dashboard
- Rule-based severity scoring and 50m clustering
- AI-assisted validation/classification with review flags

## OpenRouter setup

CityPulse can call OpenRouter through the same image-analysis flow used for OpenAI-compatible models.

1. In `.env.local`, set:
   - `AI_PROVIDER=openrouter`
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-4.1-mini` or any vision-capable OpenRouter model you prefer
2. Optional but recommended:
   - `OPENROUTER_SITE_URL=https://your-domain`
   - `OPENROUTER_APP_NAME=CityPulse`
3. Leave `OPENAI_*` empty unless you also want direct OpenAI support.

If the OpenRouter key is missing or the request fails, the app safely falls back to mock analysis in local/demo flows.
