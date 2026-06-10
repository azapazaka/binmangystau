# Supabase Full Setup — "aka bin" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new Supabase project called "aka bin", provision the full CityPulse database schema, storage buckets, demo users, and wire credentials into `.env.local`.

**Architecture:** Use the Supabase Management API (REST, Bearer token) to create the project and run SQL. All schema is applied via a single migration script executed through the Management API query endpoint. Demo users are seeded via the existing `scripts/bootstrap-demo-users.mjs` script once credentials are live.

**Tech Stack:** Node.js 18+ (fetch built-in), Supabase Management API v1, Supabase Auth Admin API, `.env.local` file

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `scripts/supabase-create-project.mjs` | Create project via Management API, poll until ready, write creds |
| Create | `scripts/supabase-migrate.mjs` | Run full SQL schema via Management API query endpoint |
| Modify | `.env.local` | Fill in real Supabase URL, anon key, service role key |
| Modify | `scripts/bootstrap-demo-users.mjs` | Already exists — run as-is once creds are set |

---

## Task 1: Create the Supabase Project

**Files:**
- Create: `scripts/supabase-create-project.mjs`

- [ ] **Step 1: Get your organization ID**

```bash
"/C/Program Files/nodejs/node.exe" -e "
fetch('https://api.supabase.com/v1/organizations', {
  headers: { 'Authorization': 'Bearer $SUPABASE_ACCESS_TOKEN' }
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)));
"
```

Expected: array of orgs with `id` field. Copy the first org's `id` — it looks like `abcdefghij`.

- [ ] **Step 2: Create `scripts/supabase-create-project.mjs`**

Replace `YOUR_ORG_ID` with the value from Step 1.

```js
// scripts/supabase-create-project.mjs
const ACCESS_TOKEN = '$SUPABASE_ACCESS_TOKEN';
const ORG_ID = 'YOUR_ORG_ID'; // replace with org id from step 1
const DB_PASS = 'CityPulse2024!Secure';

async function api(method, path, body) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Creating project "aka bin"...');
  const project = await api('POST', '/projects', {
    name: 'aka bin',
    organization_id: ORG_ID,
    db_pass: DB_PASS,
    region: 'eu-central-1',
    plan: 'free',
  });

  const ref = project.id;
  console.log(`Project created: ref=${ref}`);
  console.log('Polling until ready (this takes ~60s)...');

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await api('GET', `/projects/${ref}`);
    process.stdout.write(`  status: ${status.status}\r`);
    if (status.status === 'ACTIVE_HEALTHY') {
      console.log('\nProject is ready!');
      break;
    }
    if (i === 39) throw new Error('Timed out waiting for project to be ready');
  }

  // Get API keys
  const keys = await api('GET', `/projects/${ref}/api-keys`);
  const anon = keys.find(k => k.name === 'anon')?.api_key;
  const service = keys.find(k => k.name === 'service_role')?.api_key;

  console.log('\n=== CREDENTIALS ===');
  console.log(`NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${service}`);
  console.log(`DB_PASS=${DB_PASS}`);
  console.log('===================\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 3: Run it**

```bash
"/C/Program Files/nodejs/node.exe" scripts/supabase-create-project.mjs
```

Expected output:
```
Creating project "aka bin"...
Project created: ref=<12-char-ref>
Polling until ready (this takes ~60s)...
  status: ACTIVE_HEALTHY
Project is ready!

=== CREDENTIALS ===
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DB_PASS=CityPulse2024!Secure
===================
```

- [ ] **Step 4: Write credentials into `.env.local`**

Open `.env.local` and fill in the three values printed above:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Task 2: Run the Database Migration

**Files:**
- Create: `scripts/supabase-migrate.mjs`

- [ ] **Step 1: Create `scripts/supabase-migrate.mjs`**

Replace `PROJECT_REF` and `SERVICE_ROLE_KEY` with values from Task 1.

```js
// scripts/supabase-migrate.mjs
import { readFileSync } from 'fs';

const PROJECT_REF = 'YOUR_PROJECT_REF';     // e.g. abcdefghijkl
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  // Use Management API for raw SQL instead
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer $SUPABASE_ACCESS_TOKEN`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!mgmtRes.ok) {
    const text = await mgmtRes.text();
    throw new Error(`SQL failed (${mgmtRes.status}): ${text}`);
  }
  return mgmtRes.json();
}

const MIGRATION_SQL = `
-- ============================================
-- CityPulse Full Schema Migration
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Public users (synced from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clusters (groups of nearby reports)
CREATE TABLE IF NOT EXISTS public.clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('road', 'light', 'trash', 'traffic', 'other')),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  district text,
  zone_key text,
  zone_coefficient double precision NOT NULL DEFAULT 1,
  report_count integer NOT NULL DEFAULT 1,
  severity double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  representative_photo_url text,
  priority_score double precision NOT NULL DEFAULT 0,
  priority_reason text,
  top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority_source_report_id uuid,
  ai_validation_status text NOT NULL DEFAULT 'unavailable' CHECK (ai_validation_status IN ('valid', 'invalid', 'uncertain', 'unavailable')),
  effective_category text CHECK (effective_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  effective_visual_severity text CHECK (effective_visual_severity IN ('low', 'medium', 'high')),
  moderator_review_status text NOT NULL DEFAULT 'pending' CHECK (moderator_review_status IN ('pending', 'confirmed', 'corrected', 'invalidated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reports (individual citizen submissions)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE SET NULL,
  user_category text NOT NULL CHECK (user_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  description text,
  photo_url text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  district text,
  severity double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  ai_category text CHECK (ai_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  ai_confidence double precision,
  ai_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_validation_status text NOT NULL DEFAULT 'unavailable' CHECK (ai_validation_status IN ('valid', 'invalid', 'uncertain', 'unavailable')),
  ai_needs_review boolean NOT NULL DEFAULT false,
  ai_reason text,
  ai_visual_severity text CHECK (ai_visual_severity IN ('low', 'medium', 'high')),
  ai_deep_analysis jsonb,
  ai_deep_analyzed_at timestamptz,
  ai_raw jsonb,
  ai_priority_score double precision NOT NULL DEFAULT 0,
  ai_priority_reason text,
  ai_top_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'corrected', 'invalidated')),
  ai_correct boolean,
  expert_category text CHECK (expert_category IN ('road', 'light', 'trash', 'traffic', 'other')),
  expert_visual_severity text CHECK (expert_visual_severity IN ('low', 'medium', 'high')),
  review_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  human_real_votes integer NOT NULL DEFAULT 0,
  human_fake_votes integer NOT NULL DEFAULT 0,
  human_votes_total integer NOT NULL DEFAULT 0,
  human_confirmation_status text NOT NULL DEFAULT 'pending' CHECK (human_confirmation_status IN ('pending', 'confirmed_real', 'confirmed_fake', 'disputed')),
  human_last_voted_at timestamptz,
  submitted_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add cross-reference FK after both tables exist
ALTER TABLE public.clusters
  DROP CONSTRAINT IF EXISTS clusters_priority_source_report_id_fkey;
ALTER TABLE public.clusters
  ADD CONSTRAINT clusters_priority_source_report_id_fkey
  FOREIGN KEY (priority_source_report_id) REFERENCES public.reports(id) ON DELETE SET NULL;

-- Status change history
CREATE TABLE IF NOT EXISTS public.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  old_status text CHECK (old_status IN ('open', 'in_progress', 'closed')),
  new_status text NOT NULL CHECK (new_status IN ('open', 'in_progress', 'closed')),
  changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- User profiles (display name, avatar, role-specific fields)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  district text,
  bio text,
  avatar_path text,
  position text,
  department text,
  categories text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Human verification votes
CREATE TABLE IF NOT EXISTS public.report_human_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict text NOT NULL CHECK (verdict IN ('real', 'fake')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_human_votes_report_id_user_id_key UNIQUE (report_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clusters_category ON public.clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON public.clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_created_at ON public.clusters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_priority_score ON public.clusters(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_cluster_id ON public.reports(cluster_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_category ON public.reports(user_category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_ai_validation_status ON public.reports(ai_validation_status);
CREATE INDEX IF NOT EXISTS idx_reports_ai_priority_score ON public.reports(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_review_status ON public.reports(review_status);
CREATE INDEX IF NOT EXISTS idx_report_human_votes_report_id ON public.report_human_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_human_votes_user_id ON public.report_human_votes(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clusters_updated_at ON public.clusters;
CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON public.clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_human_votes_updated_at ON public.report_human_votes;
CREATE TRIGGER update_report_human_votes_updated_at
  BEFORE UPDATE ON public.report_human_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync auth.users → public.users on create/update
CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_from_auth();

-- Auto-create empty profile on new user
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_human_votes ENABLE ROW LEVEL SECURITY;

-- users: public read, own write
DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

-- clusters: public read, authenticated write
DROP POLICY IF EXISTS clusters_select_all ON public.clusters;
CREATE POLICY clusters_select_all ON public.clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS clusters_insert_auth ON public.clusters;
CREATE POLICY clusters_insert_auth ON public.clusters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS clusters_update_auth ON public.clusters;
CREATE POLICY clusters_update_auth ON public.clusters FOR UPDATE USING (auth.role() = 'authenticated');

-- reports: public read, authenticated write
DROP POLICY IF EXISTS reports_select_all ON public.reports;
CREATE POLICY reports_select_all ON public.reports FOR SELECT USING (true);
DROP POLICY IF EXISTS reports_insert_auth ON public.reports;
CREATE POLICY reports_insert_auth ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS reports_update_auth ON public.reports;
CREATE POLICY reports_update_auth ON public.reports FOR UPDATE USING (auth.role() = 'authenticated');

-- status_history: public read, authenticated insert
DROP POLICY IF EXISTS status_history_select_all ON public.status_history;
CREATE POLICY status_history_select_all ON public.status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS status_history_insert_auth ON public.status_history;
CREATE POLICY status_history_insert_auth ON public.status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- user_profiles: public read, own write
DROP POLICY IF EXISTS user_profiles_select_all ON public.user_profiles;
CREATE POLICY user_profiles_select_all ON public.user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- report_human_votes: public read, own write
DROP POLICY IF EXISTS report_human_votes_select_all ON public.report_human_votes;
CREATE POLICY report_human_votes_select_all ON public.report_human_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS report_human_votes_insert_auth ON public.report_human_votes;
CREATE POLICY report_human_votes_insert_auth ON public.report_human_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS report_human_votes_update_own ON public.report_human_votes;
CREATE POLICY report_human_votes_update_own ON public.report_human_votes FOR UPDATE USING (auth.uid() = user_id);
`;

async function main() {
  console.log('Running CityPulse migration...');
  const result = await runSQL(MIGRATION_SQL);
  console.log('Migration complete:', JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 2: Fill in PROJECT_REF and SERVICE_ROLE_KEY from Task 1 output, then run**

```bash
"/C/Program Files/nodejs/node.exe" scripts/supabase-migrate.mjs
```

Expected output:
```
Running CityPulse migration...
Migration complete: [...]
```

---

## Task 3: Create Storage Buckets

**Files:**
- No new files — inline Node script

- [ ] **Step 1: Create `reports` and `avatars` buckets**

Replace `PROJECT_REF` and `SERVICE_ROLE_KEY`:

```bash
"/C/Program Files/nodejs/node.exe" -e "
const REF = 'YOUR_PROJECT_REF';
const KEY = 'YOUR_SERVICE_ROLE_KEY';
const BASE = 'https://' + REF + '.supabase.co/storage/v1';

async function createBucket(name, maxSize, mimes) {
  const r = await fetch(BASE + '/bucket', {
    method: 'POST',
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: name, name, public: true, file_size_limit: maxSize, allowed_mime_types: mimes })
  });
  const d = await r.json();
  console.log(name + ':', r.status, JSON.stringify(d));
}

Promise.all([
  createBucket('reports', 10485760, ['image/png','image/jpeg','image/webp']),
  createBucket('avatars', 3145728, ['image/png','image/jpeg','image/webp']),
]);
"
```

Expected output:
```
reports: 200 {"name":"reports"}
avatars: 200 {"name":"avatars"}
```

---

## Task 4: Seed Demo Users

**Files:**
- Use existing: `scripts/bootstrap-demo-users.mjs`

- [ ] **Step 1: Verify `.env.local` has all three Supabase vars set**

```bash
"/C/Program Files/nodejs/node.exe" -e "
require('fs').readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.startsWith('NEXT_PUBLIC_SUPABASE')||l.startsWith('SUPABASE_SERVICE'))
  .forEach(l=>console.log(l));
"
```

Expected — all three lines should have real values (not empty):
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- [ ] **Step 2: Run the bootstrap script**

```bash
"/C/Program Files/nodejs/node.exe" --env-file=.env.local scripts/bootstrap-demo-users.mjs
```

Expected output:
```
Bootstrapping demo users...
✓ citizen@citypulse.local created/updated (citizen)
✓ demo@citypulse.local created/updated (admin)
Done.
```

If the script doesn't support `--env-file`, load vars manually:
```bash
"/C/Program Files/nodejs/node.exe" -e "
const env = require('fs').readFileSync('.env.local','utf8')
  .split('\n').filter(l=>l.includes('='))
  .reduce((a,l)=>{ const [k,...v]=l.split('='); a[k]=v.join('='); return a; }, {});
Object.assign(process.env, env);
import('./scripts/bootstrap-demo-users.mjs');
"
```

---

## Task 5: Verify End-to-End Connection

- [ ] **Step 1: Test anon key can read clusters (empty is fine)**

```bash
"/C/Program Files/nodejs/node.exe" -e "
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
" 
```

Better — check via curl equivalent in Node:
```bash
"/C/Program Files/nodejs/node.exe" -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')).reduce((a,l)=>{const [k,...v]=l.split('=');a[k.trim()]=v.join('=').trim();return a;},{});
const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
fetch(url+'/rest/v1/clusters?select=id&limit=1', {
  headers:{'apikey':key,'Authorization':'Bearer '+key}
}).then(r=>r.json()).then(d=>console.log('clusters query OK:', JSON.stringify(d)));
"
```

Expected: `clusters query OK: []` (empty array — no data yet, but schema exists)

- [ ] **Step 2: Restart the dev server to pick up new `.env.local`**

Kill PID 4504 and restart:
```bash
"/C/Program Files/nodejs/npm.cmd" run dev
```

- [ ] **Step 3: Open http://localhost:3000 — landing page should render with stats showing 0**

- [ ] **Step 4: Navigate to http://localhost:3000/auth/citizen/login and log in with:**
  - Email: `citizen@citypulse.local`
  - Password: `citypulse-demo`

Expected: redirected to `/citizen/my-reports` or `/citizen/report`

- [ ] **Step 5: Navigate to http://localhost:3000/auth/admin/login and log in with:**
  - Email: `demo@citypulse.local`
  - Password: `citypulse-demo`

Expected: redirected to `/admin`

---

## Troubleshooting Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid supabaseUrl` | `.env.local` still has empty or placeholder URL | Paste real URL from Task 1 |
| `relation "clusters" does not exist` | Migration didn't run | Re-run Task 2 |
| `new row violates row-level security` | RLS policies not applied | Re-run migration SQL from the RLS section |
| Demo login fails | Bootstrap script didn't run or failed | Re-run Task 4 |
| `Storage bucket not found` | Buckets not created | Re-run Task 3 |
| `406 Not Acceptable` on REST | Missing `Accept: application/json` header in app code | Check `lib/supabase/server.ts` |
