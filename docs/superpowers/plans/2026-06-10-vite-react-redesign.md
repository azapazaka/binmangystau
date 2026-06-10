# CityPulse — Vite + React Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild CityPulse as a Vite + React SPA with the new mockup design (sidebar layout, map-centric admin, 5-step citizen report wizard), replacing Next.js entirely.

**Architecture:** Vite + React 19 + React Router v7 SPA. Supabase called directly from the browser using the anon key + auth session (RLS enforces access). No server-side API routes — all data goes through `src/lib/api.ts` which wraps the Supabase browser client. AI runs in mock mode (browser-safe).

**Tech Stack:** Vite 6, React 19, TypeScript, React Router v7, Tailwind CSS v4 (`@tailwindcss/vite`), Supabase JS v2, Mapbox GL JS v3, Recharts, React Hook Form + Zod v4, Lucide React, date-fns

---

## Design Tokens (from mockups — use everywhere)

```
Brand green:      #16a34a   sidebar accent, buttons, badges
Content bg:       #f8fafc   page background (slate-50)
Card bg:          #ffffff   all cards
Border:           #e2e8f0   card borders (slate-200)
Sidebar bg:       #ffffff   left nav
Text primary:     #0f172a   headings (slate-900)
Text secondary:   #64748b   body (slate-500)
Text muted:       #94a3b8   labels (slate-400)
Card radius:      12px
Card shadow:      0 1px 3px rgba(0,0,0,.08)
Sidebar width:    224px
Topbar height:    64px

Category colours:
  road:    #ef4444   trash:   #22c55e
  light:   #f59e0b   traffic: #3b82f6
  other:   #94a3b8
```

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `index.html` | Vite entry HTML |
| Create | `vite.config.ts` | Vite + Tailwind + React config |
| Create | `src/main.tsx` | Router + app bootstrap |
| Create | `src/index.css` | Tailwind import + CSS variables |
| Create | `src/lib/supabase.ts` | Browser Supabase client |
| Create | `src/lib/env.ts` | VITE_ env vars |
| Create | `src/lib/api.ts` | All Supabase data calls |
| Create | `src/lib/constants.ts` | Category/status metadata (ported) |
| Create | `src/contexts/AuthContext.tsx` | Session + role state |
| Create | `src/components/layout/AppShell.tsx` | Sidebar + topbar wrapper |
| Create | `src/components/layout/Sidebar.tsx` | Left nav |
| Create | `src/components/layout/Topbar.tsx` | Top bar with user avatar |
| Create | `src/components/ui/index.ts` | Card, Badge, Button, Sparkline |
| Create | `src/components/maps/CityMap.tsx` | Mapbox map with cluster pins |
| Create | `src/pages/admin/AdminOverview.tsx` | Screen 1 — admin dashboard |
| Create | `src/pages/admin/AdminMapPage.tsx` | Screen 2 — explore issues |
| Create | `src/pages/citizen/ReportWizard.tsx` | Screen 3 — 5-step report form |
| Create | `src/pages/auth/LoginPage.tsx` | Login (citizen + admin) |
| Modify | `.env.local` | Rename NEXT_PUBLIC_ → VITE_ keys |
| Modify | `package.json` | Replace Next.js deps with Vite stack |

---

## Task 1: Replace package.json and scaffold Vite

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Back up types and lib**

```bash
"C:/Program Files/nodejs/node.exe" -e "
const fs = require('fs');
fs.cpSync('C:/projects/aka/types', 'C:/projects/aka/_backup_types', {recursive:true});
fs.cpSync('C:/projects/aka/lib', 'C:/projects/aka/_backup_lib', {recursive:true});
console.log('backed up');
"
```

- [ ] **Step 2: Write new `package.json`**

Replace entire `C:/projects/aka/package.json` with:

```json
{
  "name": "citypulse",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run --passWithNoTests"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.100.1",
    "@hookform/resolvers": "^5.2.2",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.7.0",
    "mapbox-gl": "^3.20.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-hook-form": "^7.72.0",
    "react-router": "^7.6.2",
    "recharts": "^2.15.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4",
    "@types/mapbox-gl": "^3.4.3",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.4.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
"C:/Program Files/nodejs/npm.cmd" install
```

Expected: `added N packages`

- [ ] **Step 4: Create `vite.config.ts`**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 3000 },
})
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CityPulse</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --color-brand: #16a34a;
  --color-brand-50: #f0fdf4;
  --color-brand-100: #dcfce7;
  --color-brand-600: #16a34a;
  --color-brand-700: #15803d;
  --color-cat-road: #ef4444;
  --color-cat-light: #f59e0b;
  --color-cat-trash: #22c55e;
  --color-cat-traffic: #3b82f6;
  --color-cat-other: #94a3b8;
  --radius-card: 12px;
  --shadow-card: 0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.08);
}

* { box-sizing: border-box; }

body {
  font-family: var(--font-family-sans);
  background: #f8fafc;
  color: #0f172a;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid #e2e8f0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.sidebar-link:hover { background: #f1f5f9; color: #0f172a; }
.sidebar-link.active { background: #f0fdf4; color: #16a34a; }
.sidebar-link.active svg { color: #16a34a; }

.btn-primary {
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #15803d; }

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #f8fafc; }
```

- [ ] **Step 7: Create `src/main.tsx`** (placeholder — full router added in Task 4)

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#16a34a' }}>CityPulse — Vite OK ✓</h1>
    </div>
  </StrictMode>
)
```

- [ ] **Step 8: Verify dev server starts**

```bash
"C:/Program Files/nodejs/npm.cmd" run dev
```

Expected: `Local: http://localhost:3000` — browser shows green "CityPulse — Vite OK ✓"

- [ ] **Step 9: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add vite.config.ts index.html src/main.tsx src/index.css package.json package-lock.json
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: scaffold vite+react+tailwind foundation"
```

---

## Task 2: Core lib — env, Supabase client, constants, API

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/api.ts`
- Modify: `.env.local`

- [ ] **Step 1: Add VITE_ keys to `.env.local`**

Open `C:/projects/aka/.env.local` and add these lines (keep the NEXT_PUBLIC_ ones too for now):

```
VITE_SUPABASE_URL=https://tzmhrpjamwwagubneazc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhycGphbXd3YWd1Ym5lYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODA4NjAsImV4cCI6MjA5NjY1Njg2MH0.5WSkqRaiINDR5Xn8eKEWyyk8YJtmzCQzUmxfD9ydsls
VITE_MAPBOX_TOKEN=
```

- [ ] **Step 2: Create `src/lib/env.ts`**

```ts
// src/lib/env.ts
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN as string ?? '',
  defaultLat: 43.238949,
  defaultLng: 76.889709,
  clusterRadiusMeters: 50,
}

export const isSupabaseConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey)

export const isMapboxConfigured = () => Boolean(env.mapboxToken)
```

- [ ] **Step 3: Create `src/lib/supabase.ts`**

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})
```

- [ ] **Step 4: Create `src/lib/constants.ts`**

```ts
// src/lib/constants.ts
import type { ReportCategory, ClusterStatus, AiValidationStatus } from '@/types'

export const APP_NAME = 'CityPulse'

export const CATEGORY_META: Record<ReportCategory, {
  label: string; color: string; bgClass: string; textClass: string
}> = {
  road:    { label: 'Дороги',    color: '#ef4444', bgClass: 'bg-red-100',    textClass: 'text-red-700'    },
  light:   { label: 'Освещение', color: '#f59e0b', bgClass: 'bg-amber-100',  textClass: 'text-amber-700'  },
  trash:   { label: 'Мусор',     color: '#22c55e', bgClass: 'bg-green-100',  textClass: 'text-green-700'  },
  traffic: { label: 'Трафик',    color: '#3b82f6', bgClass: 'bg-blue-100',   textClass: 'text-blue-700'   },
  other:   { label: 'Другое',    color: '#94a3b8', bgClass: 'bg-slate-100',  textClass: 'text-slate-600'  },
}

export const STATUS_META: Record<ClusterStatus, { label: string; bgClass: string; textClass: string }> = {
  open:        { label: 'Открыто',  bgClass: 'bg-red-100',    textClass: 'text-red-700'    },
  in_progress: { label: 'В работе', bgClass: 'bg-amber-100',  textClass: 'text-amber-700'  },
  closed:      { label: 'Закрыто',  bgClass: 'bg-green-100',  textClass: 'text-green-700'  },
}

export const AI_STATUS_META: Record<AiValidationStatus, { label: string; bgClass: string; textClass: string }> = {
  valid:       { label: 'Подтверждено', bgClass: 'bg-green-100', textClass: 'text-green-700'  },
  invalid:     { label: 'Отклонено',    bgClass: 'bg-red-100',   textClass: 'text-red-700'    },
  uncertain:   { label: 'Под вопросом', bgClass: 'bg-amber-100', textClass: 'text-amber-700'  },
  unavailable: { label: 'Нет данных',   bgClass: 'bg-slate-100', textClass: 'text-slate-600'  },
}

export const DEMO_ACCOUNTS = {
  citizen: { email: 'citizen@citypulse.local', password: 'citypulse-demo' },
  admin:   { email: 'demo@citypulse.local',    password: 'citypulse-demo' },
}
```

- [ ] **Step 5: Create `src/lib/api.ts`**

```ts
// src/lib/api.ts
import { supabase } from './supabase'
import type { ClusterRecord, ReportRecord, DashboardStats } from '@/types'

// ── Clusters ──────────────────────────────────────────────────────────────
export async function listClusters(filters?: {
  category?: string; period?: 'week' | 'month' | 'all'
}): Promise<ClusterRecord[]> {
  let q = supabase
    .from('clusters')
    .select('*')
    .order('priority_score', { ascending: false })

  if (filters?.category && filters.category !== 'all')
    q = q.eq('category', filters.category)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapCluster)
}

export async function updateClusterStatus(
  clusterId: string,
  status: 'open' | 'in_progress' | 'closed'
) {
  const { error } = await supabase
    .from('clusters')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', clusterId)
  if (error) throw error
}

// ── Reports ───────────────────────────────────────────────────────────────
export async function listReports(filters?: { clusterId?: string; submittedBy?: string }): Promise<ReportRecord[]> {
  let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
  if (filters?.clusterId) q = q.eq('cluster_id', filters.clusterId)
  if (filters?.submittedBy) q = q.eq('submitted_by', filters.submittedBy)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapReport)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, inProg, resolved] = await Promise.all([
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
  ])
  return {
    totalReports: total.count ?? 0,
    weeklyReports: 0,
    inProgress: inProg.count ?? 0,
    resolved: resolved.count ?? 0,
    reviewedReports: 0,
    aiCorrectReports: 0,
    correctedReports: 0,
    aiAgreementRate: 0,
  }
}

export async function createReport(input: {
  photo: File
  userCategory: string
  description: string
  lat: number
  lng: number
  address: string
  submittedBy: string
}): Promise<void> {
  // Upload photo
  const ext = input.photo.name.split('.').pop()
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(path, input.photo, { contentType: input.photo.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)

  const { error } = await supabase.from('reports').insert({
    user_category: input.userCategory,
    description: input.description,
    photo_url: urlData.publicUrl,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    submitted_by: input.submittedBy,
    status: 'open',
    ai_validation_status: 'unavailable',
    ai_needs_review: false,
    ai_tags: [],
    ai_priority_score: 0,
    ai_top_factors: [],
    review_status: 'pending',
    human_real_votes: 0,
    human_fake_votes: 0,
    human_votes_total: 0,
    human_confirmation_status: 'pending',
    severity: 0,
  })
  if (error) throw error
}

export async function castHumanVote(
  reportId: string, userId: string, verdict: 'real' | 'fake'
) {
  const { error } = await supabase.from('report_human_votes').upsert(
    { report_id: reportId, user_id: userId, verdict },
    { onConflict: 'report_id,user_id' }
  )
  if (error) throw error
}

export async function getVerifyQueue(userId: string): Promise<ReportRecord[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('ai_needs_review', true)
    .neq('submitted_by', userId)
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return (data ?? []).map(mapReport)
}

// ── Row mappers ───────────────────────────────────────────────────────────
function mapCluster(row: Record<string, unknown>): ClusterRecord {
  return {
    id: row.id as string,
    category: row.category as ClusterRecord['category'],
    effectiveCategory: (row.effective_category ?? row.category) as ClusterRecord['category'],
    lat: row.lat as number,
    lng: row.lng as number,
    address: row.address as string | null,
    district: row.district as string | null,
    zoneCoefficient: (row.zone_coefficient as number) ?? 1,
    reportCount: (row.report_count as number) ?? 1,
    severity: (row.severity as number) ?? 0,
    priorityScore: (row.priority_score as number) ?? 0,
    priorityReason: row.priority_reason as string | null,
    topFactors: (row.top_factors as ClusterRecord['topFactors']) ?? [],
    status: row.status as ClusterRecord['status'],
    representativePhotoUrl: row.representative_photo_url as string | null,
    aiValidationStatus: row.ai_validation_status as ClusterRecord['aiValidationStatus'],
    effectiveVisualSeverity: row.effective_visual_severity as ClusterRecord['effectiveVisualSeverity'],
    moderatorReviewStatus: row.moderator_review_status as ClusterRecord['moderatorReviewStatus'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapReport(row: Record<string, unknown>): ReportRecord {
  return {
    id: row.id as string,
    clusterId: row.cluster_id as string,
    userCategory: row.user_category as ReportRecord['userCategory'],
    description: (row.description as string) ?? '',
    photoUrl: row.photo_url as string,
    lat: row.lat as number,
    lng: row.lng as number,
    address: row.address as string | null,
    district: row.district as string | null,
    severity: (row.severity as number) ?? 0,
    priorityScore: (row.ai_priority_score as number) ?? 0,
    priorityReason: row.ai_priority_reason as string | null,
    topFactors: (row.ai_top_factors as ReportRecord['topFactors']) ?? [],
    status: row.status as ReportRecord['status'],
    aiCategory: row.ai_category as ReportRecord['aiCategory'],
    aiConfidence: row.ai_confidence as number | null,
    aiTags: (row.ai_tags as string[]) ?? [],
    aiValidationStatus: row.ai_validation_status as ReportRecord['aiValidationStatus'],
    aiNeedsReview: (row.ai_needs_review as boolean) ?? false,
    aiReason: row.ai_reason as string | null,
    aiVisualSeverity: row.ai_visual_severity as ReportRecord['aiVisualSeverity'],
    aiDeepAnalysis: row.ai_deep_analysis as ReportRecord['aiDeepAnalysis'],
    aiDeepAnalyzedAt: row.ai_deep_analyzed_at as string | null,
    aiRaw: row.ai_raw as Record<string, unknown> | null,
    reviewStatus: row.review_status as ReportRecord['reviewStatus'],
    aiCorrect: row.ai_correct as boolean | null,
    expertCategory: row.expert_category as ReportRecord['expertCategory'],
    expertVisualSeverity: row.expert_visual_severity as ReportRecord['expertVisualSeverity'],
    reviewNote: row.review_note as string | null,
    reviewedBy: row.reviewed_by as string | null,
    reviewedAt: row.reviewed_at as string | null,
    humanRealVotes: (row.human_real_votes as number) ?? 0,
    humanFakeVotes: (row.human_fake_votes as number) ?? 0,
    humanVotesTotal: (row.human_votes_total as number) ?? 0,
    humanConfirmationStatus: row.human_confirmation_status as ReportRecord['humanConfirmationStatus'],
    humanLastVotedAt: row.human_last_voted_at as string | null,
    submittedBy: row.submitted_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
```

- [ ] **Step 6: Copy `types/index.ts` to `src/types/index.ts`**

```bash
"C:/Program Files/nodejs/node.exe" -e "
const fs = require('fs');
fs.mkdirSync('C:/projects/aka/src/types', {recursive:true});
fs.copyFileSync('C:/projects/aka/types/index.ts', 'C:/projects/aka/src/types/index.ts');
console.log('copied');
"
```

- [ ] **Step 7: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/ .env.local
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: add lib layer (env, supabase client, api, constants, types)"
```

---

## Task 3: AuthContext + protected routes

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/main.tsx` (full router version)

- [ ] **Step 1: Create `src/contexts/AuthContext.tsx`**

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthUser = {
  id: string
  email: string
  role: 'citizen' | 'admin'
  fullName: string
}

type AuthCtx = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>(null!)

function userFromSession(session: Session): AuthUser {
  const u: User = session.user
  return {
    id: u.id,
    email: u.email ?? '',
    role: (u.user_metadata?.role as 'citizen' | 'admin') ?? 'citizen',
    fullName: (u.user_metadata?.full_name as string) ?? u.email ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? userFromSession(data.session) : null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? userFromSession(session) : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 2: Replace `src/main.tsx` with full router**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router'
import './index.css'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Pages (lazy-ish imports — add as we build them)
import LoginPage from '@/pages/auth/LoginPage'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminMapPage from '@/pages/admin/AdminMapPage'
import ReportWizard from '@/pages/citizen/ReportWizard'
import { AppShell } from '@/components/layout/AppShell'

function RequireAuth({ role }: { role: 'citizen' | 'admin' }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Загрузка…</div>
  if (!user) return <Navigate to={`/login/${role}`} state={{ from: loc }} replace />
  if (user.role !== role) return <Navigate to={`/login/${role}`} replace />
  return <AppShell role={role}><Outlet /></AppShell>
}

const router = createBrowserRouter([
  { path: '/',                    element: <Navigate to="/admin" replace /> },
  { path: '/login/:role',         element: <LoginPage /> },
  {
    element: <RequireAuth role="admin" />,
    children: [
      { path: '/admin',           element: <AdminOverview /> },
      { path: '/admin/map',       element: <AdminMapPage /> },
    ],
  },
  {
    element: <RequireAuth role="citizen" />,
    children: [
      { path: '/citizen/report',  element: <ReportWizard /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
```

- [ ] **Step 3: Create placeholder pages so the app compiles**

Create `src/pages/auth/LoginPage.tsx`:
```tsx
export default function LoginPage() { return <div>Login</div> }
```

Create `src/pages/admin/AdminOverview.tsx`:
```tsx
export default function AdminOverview() { return <div>Admin Overview</div> }
```

Create `src/pages/admin/AdminMapPage.tsx`:
```tsx
export default function AdminMapPage() { return <div>Admin Map</div> }
```

Create `src/pages/citizen/ReportWizard.tsx`:
```tsx
export default function ReportWizard() { return <div>Report Wizard</div> }
```

- [ ] **Step 4: Verify build compiles with no TS errors**

```bash
"C:/Program Files/nodejs/npm.cmd" run build 2>&1
```

Expected: `✓ built in Xs` — no errors. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: add auth context and router with protected routes"
```

---

## Task 4: App Shell — Sidebar + Topbar

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create `src/components/layout/Sidebar.tsx`**

```tsx
// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import { LayoutDashboard, Map, BarChart3, Users, MessageSquare, Settings, MapPin } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { ReactNode } from 'react'

type NavItem = { label: string; href: string; icon: ReactNode }

const ADMIN_NAV: NavItem[] = [
  { label: 'Обзор',      href: '/admin',         icon: <LayoutDashboard size={18} /> },
  { label: 'Карта',      href: '/admin/map',      icon: <Map size={18} /> },
  { label: 'Аналитика',  href: '/admin/analytics',icon: <BarChart3 size={18} /> },
  { label: 'Сообщество', href: '/admin/community',icon: <Users size={18} /> },
  { label: 'Сообщения',  href: '/admin/messages', icon: <MessageSquare size={18} /> },
  { label: 'Настройки',  href: '/admin/settings', icon: <Settings size={18} /> },
]

const CITIZEN_NAV: NavItem[] = [
  { label: 'Подать жалобу', href: '/citizen/report',      icon: <MapPin size={18} /> },
  { label: 'Мои обращения', href: '/citizen/my-reports',  icon: <LayoutDashboard size={18} /> },
  { label: 'Карта',         href: '/citizen/map',          icon: <Map size={18} /> },
  { label: 'Проверка',      href: '/citizen/verify',       icon: <Users size={18} /> },
  { label: 'Рейтинг',       href: '/citizen/rating',       icon: <BarChart3 size={18} /> },
]

export function Sidebar({ role }: { role: 'admin' | 'citizen' }) {
  const items = role === 'admin' ? ADMIN_NAV : CITIZEN_NAV

  return (
    <aside className="flex flex-col w-56 h-screen bg-white border-r border-slate-200 px-3 py-5 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <MapPin size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-extrabold text-slate-900">{APP_NAME}</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {items.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin' || item.href === '/citizen/report'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 px-2">Stronger city. Together.</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/Topbar.tsx`**

```tsx
// src/components/layout/Topbar.tsx
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Topbar({ title }: { title: string }) {
  const { user, signOut } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-none">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
              {user?.role === 'admin' ? 'City Administrator' : 'Citizen'}
            </p>
          </div>
        </div>
        <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-700 ml-1">
          Выйти
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/AppShell.tsx`**

```tsx
// src/components/layout/AppShell.tsx
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useLocation } from 'react-router'

const PAGE_TITLES: Record<string, string> = {
  '/admin':           'Обзор города',
  '/admin/map':       'Карта проблем',
  '/admin/analytics': 'Аналитика',
  '/citizen/report':  'Подать жалобу',
  '/citizen/my-reports': 'Мои обращения',
}

export function AppShell({ role, children }: { role: 'admin' | 'citizen'; children: ReactNode }) {
  const loc = useLocation()
  const title = PAGE_TITLES[loc.pathname] ?? 'CityPulse'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify shell renders — log in with demo admin account, confirm sidebar + topbar appear**

Open `http://localhost:3000/login/admin` — login with `demo@citypulse.local` / `citypulse-demo`.
Expected: sidebar with nav items + topbar with user name visible.

- [ ] **Step 5: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: app shell with sidebar and topbar"
```

---

## Task 5: Login page

**Files:**
- Modify: `src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Write `src/pages/auth/LoginPage.tsx`**

```tsx
// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { MapPin, Eye, EyeOff } from 'lucide-react'
import { APP_NAME, DEMO_ACCOUNTS } from '@/lib/constants'

export default function LoginPage() {
  const { role = 'citizen' } = useParams<{ role: 'citizen' | 'admin' }>()
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fill = () => {
    const acc = DEMO_ACCOUNTS[role as 'citizen' | 'admin']
    setEmail(acc.email); setPassword(acc.password)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err); return }
    nav(role === 'admin' ? '/admin' : '/citizen/report', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900">{APP_NAME}</span>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {role === 'admin' ? 'Вход для администратора' : 'Вход для гражданина'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">Введите email и пароль для входа</p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? 'Вход…' : 'Войти'}
            </button>
          </form>

          <button onClick={fill}
            className="mt-3 w-full text-center text-xs text-slate-400 hover:text-brand-600">
            Использовать демо-аккаунт
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          {role === 'admin'
            ? <a href="/login/citizen" className="hover:underline">Войти как гражданин →</a>
            : <a href="/login/admin" className="hover:underline">Войти как администратор →</a>}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test login flow**

Open `http://localhost:3000/login/admin`, click "Использовать демо-аккаунт", click "Войти".
Expected: redirected to `/admin` with shell visible.

- [ ] **Step 3: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/pages/auth/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: login page with demo account fill"
```

---

## Task 6: Admin Overview Dashboard (Screen 1)

**Files:**
- Create: `src/components/ui/StatCard.tsx`
- Create: `src/components/ui/Sparkline.tsx`
- Create: `src/components/ui/CategoryBadge.tsx`
- Modify: `src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Create `src/components/ui/Sparkline.tsx`**

```tsx
// src/components/ui/Sparkline.tsx
import { LineChart, Line, ResponsiveContainer } from 'recharts'

type Props = { data: number[]; color?: string }

export function Sparkline({ data, color = '#16a34a' }: Props) {
  const d = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/CategoryBadge.tsx`**

```tsx
// src/components/ui/CategoryBadge.tsx
import { CATEGORY_META } from '@/lib/constants'
import type { ReportCategory } from '@/types'

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const meta = CATEGORY_META[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.bgClass} ${meta.textClass}`}>
      {meta.label}
    </span>
  )
}
```

- [ ] **Step 3: Create `src/components/ui/StatCard.tsx`**

```tsx
// src/components/ui/StatCard.tsx
import { Sparkline } from './Sparkline'
import type { ReactNode } from 'react'

type Props = {
  label: string
  value: number | string
  sub?: string
  trend?: number[]
  trendColor?: string
  icon?: ReactNode
}

export function StatCard({ label, value, sub, trend, trendColor }: Props) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      {trend && <div className="mt-1"><Sparkline data={trend} color={trendColor} /></div>}
    </div>
  )
}
```

- [ ] **Step 4: Write full `src/pages/admin/AdminOverview.tsx`**

```tsx
// src/pages/admin/AdminOverview.tsx
import { useEffect, useState } from 'react'
import { getDashboardStats, listReports } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { STATUS_META } from '@/lib/constants'
import { format } from 'date-fns'
import type { DashboardStats, ReportRecord } from '@/types'

const MOCK_TREND = [2,5,3,8,6,9,7,12,10,14]

export default function AdminOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reports, setReports] = useState<ReportRecord[]>([])

  useEffect(() => {
    getDashboardStats().then(setStats)
    listReports().then(r => setReports(r.slice(0, 8)))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">{greeting}, {user?.fullName} 👋</h2>
        <p className="text-sm text-slate-500 mt-0.5">Вот что происходит в Алматы сегодня</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего обращений" value={stats?.totalReports ?? 0}
          sub="за всё время" trend={MOCK_TREND} trendColor="#3b82f6" />
        <StatCard label="В работе" value={stats?.inProgress ?? 0}
          sub="активных кластеров" trend={[4,3,6,5,7,9,8,10,9,11]} trendColor="#f59e0b" />
        <StatCard label="Закрыто" value={stats?.resolved ?? 0}
          sub="решено" trend={[1,2,2,3,4,5,5,7,8,9]} trendColor="#22c55e" />
        <StatCard label="AI точность" value={`${stats?.aiAgreementRate ?? 0}%`}
          sub="проверено AI" trend={[60,65,70,72,75,80,78,82,84,85]} trendColor="#16a34a" />
      </div>

      {/* Recent reports */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">Последние обращения</h3>
          <button className="text-xs text-brand-600 font-medium hover:underline">Все обращения</button>
        </div>
        <div className="divide-y divide-slate-50">
          {reports.map(r => {
            const sm = STATUS_META[r.status]
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">
                    {r.description || r.address || 'Без описания'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{r.district ?? '—'}</p>
                </div>
                <CategoryBadge category={r.userCategory} />
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sm.bgClass} ${sm.textClass}`}>
                  {sm.label}
                </span>
                <span className="hidden md:block text-[11px] text-slate-400 shrink-0">
                  {format(new Date(r.createdAt), 'dd.MM.yyyy')}
                </span>
              </div>
            )
          })}
          {reports.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Обращений пока нет</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify the page renders stat cards and table**

Navigate to `/admin` while logged in. Expected: greeting header, 4 stat cards, recent reports table.

- [ ] **Step 6: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: admin overview dashboard with stats and recent reports"
```

---

## Task 7: Mapbox map component + Admin Map page (Screen 2)

**Files:**
- Create: `src/components/maps/CityMap.tsx`
- Modify: `src/pages/admin/AdminMapPage.tsx`

- [ ] **Step 1: Add Mapbox token to `.env.local`**

Get a free token from mapbox.com (if you have one) and set:
```
VITE_MAPBOX_TOKEN=pk.your_token_here
```
If no token: the map will show a blank tile layer — all markers still work.

- [ ] **Step 2: Create `src/components/maps/CityMap.tsx`**

```tsx
// src/components/maps/CityMap.tsx
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { env } from '@/lib/env'
import { CATEGORY_META } from '@/lib/constants'
import type { ClusterRecord } from '@/types'

type Props = {
  clusters: ClusterRecord[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  height?: string
}

export function CityMap({ clusters, selectedId, onSelect, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    mapboxgl.accessToken = env.mapboxToken || 'pk.placeholder'

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [env.defaultLng, env.defaultLat],
      zoom: 11,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    return () => { map.remove() }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    clusters.forEach(c => {
      const color = CATEGORY_META[c.category]?.color ?? '#94a3b8'
      const el = document.createElement('div')
      el.className = 'flex items-center justify-center text-white text-[11px] font-bold cursor-pointer transition-transform hover:scale-110'
      el.style.cssText = `
        width:36px; height:36px; border-radius:50%;
        background:${color}; border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,.25);
        ${c.id === selectedId ? 'transform:scale(1.25);' : ''}
      `
      el.textContent = String(c.reportCount)
      el.addEventListener('click', () => onSelect?.(c.id))

      const marker = new mapboxgl.Marker(el)
        .setLngLat([c.lng, c.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }, [clusters, selectedId, onSelect])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
```

- [ ] **Step 3: Write full `src/pages/admin/AdminMapPage.tsx`**

```tsx
// src/pages/admin/AdminMapPage.tsx
import { useEffect, useState } from 'react'
import { listClusters, updateClusterStatus } from '@/lib/api'
import { CityMap } from '@/components/maps/CityMap'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { STATUS_META, CATEGORY_META } from '@/lib/constants'
import { X, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import type { ClusterRecord, ReportCategory } from '@/types'

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all',     label: 'Все' },
  { key: 'road',    label: 'Дороги' },
  { key: 'light',   label: 'Освещение' },
  { key: 'trash',   label: 'Мусор' },
  { key: 'traffic', label: 'Трафик' },
  { key: 'other',   label: 'Другое' },
]

export default function AdminMapPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>([])
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState<ClusterRecord | null>(null)

  useEffect(() => {
    listClusters({ category: cat !== 'all' ? cat as ReportCategory : undefined })
      .then(setClusters)
  }, [cat])

  const handleStatusChange = async (status: ClusterRecord['status']) => {
    if (!selected) return
    await updateClusterStatus(selected.id, status)
    setClusters(cs => cs.map(c => c.id === selected.id ? { ...c, status } : c))
    setSelected(s => s ? { ...s, status } : null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-slate-200 overflow-x-auto">
        <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">Фильтр:</span>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              cat === c.key
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {c.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 shrink-0">{clusters.length} кластеров</span>
      </div>

      {/* Map + panel */}
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1">
          <CityMap
            clusters={clusters}
            selectedId={selected?.id}
            onSelect={id => setSelected(clusters.find(c => c.id === id) ?? null)}
            height="100%"
          />
        </div>

        {/* Cluster detail panel */}
        {selected && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col overflow-y-auto z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <CategoryBadge category={selected.category} />
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {selected.representativePhotoUrl && (
                <img src={selected.representativePhotoUrl} alt=""
                  className="w-full h-36 object-cover rounded-lg" />
              )}

              <div>
                <h3 className="font-bold text-slate-900">
                  {selected.address ?? `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
                </h3>
                {selected.district && (
                  <p className="text-xs text-slate-400 mt-0.5">{selected.district}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">{selected.reportCount}</p>
                  <p className="text-[10px] text-slate-400">Обращений</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">
                    {selected.priorityScore > 66 ? 'Выс.' : selected.priorityScore > 33 ? 'Сред.' : 'Низк.'}
                  </p>
                  <p className="text-[10px] text-slate-400">Приоритет</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-900">{Math.round(selected.priorityScore)}</p>
                  <p className="text-[10px] text-slate-400">Рейтинг</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Статус</p>
                <div className="flex gap-2">
                  {(['open', 'in_progress', 'closed'] as const).map(s => {
                    const sm = STATUS_META[s]
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                          selected.status === s
                            ? `${sm.bgClass} ${sm.textClass} border-current`
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}>
                        {sm.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Создано: {format(new Date(selected.createdAt), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify map renders with cluster pins, panel slides in on click**

Navigate to `/admin/map`. Expected: map centered on Almaty, colored circle markers for each cluster, detail panel on click.

- [ ] **Step 5: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: admin map page with cluster pins and detail panel"
```

---

## Task 8: Citizen Report Wizard — 5 steps (Screen 3)

**Files:**
- Modify: `src/pages/citizen/ReportWizard.tsx`

- [ ] **Step 1: Write full 5-step wizard**

```tsx
// src/pages/citizen/ReportWizard.tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { createReport } from '@/lib/api'
import { env } from '@/lib/env'
import { CATEGORY_META } from '@/lib/constants'
import { Upload, MapPin, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import type { ReportCategory } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5
const STEP_LABELS = ['Фото', 'Место', 'Категория', 'Детали', 'Отправка']
const CATEGORIES = Object.keys(CATEGORY_META) as ReportCategory[]

export default function ReportWizard() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [lat, setLat] = useState(env.defaultLat)
  const [lng, setLng] = useState(env.defaultLng)
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<ReportCategory>('road')
  const [aiConfidence] = useState(84) // mock
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  const geolocate = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude)
      setLng(pos.coords.longitude)
      setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
    })
  }

  const submit = async () => {
    if (!photo || !user) return
    setSubmitting(true)
    try {
      await createReport({
        photo, userCategory: category,
        description, lat, lng, address,
        submittedBy: user.id,
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Обращение отправлено!</h2>
      <p className="text-sm text-slate-500">Ваш запрос принят и будет обработан городской службой.</p>
      <button onClick={() => nav('/citizen/my-reports')} className="btn-primary">
        Мои обращения
      </button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            return (
              <div key={n} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  n < step ? 'bg-brand-600 text-white' :
                  n === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {n < step ? '✓' : n}
                </div>
                <span className={`text-[10px] font-medium ${n === step ? 'text-brand-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="relative h-1 bg-slate-100 rounded-full">
          <div className="absolute h-1 bg-brand-600 rounded-full transition-all"
            style={{ width: `${((step - 1) / 4) * 100}%` }} />
        </div>
      </div>

      <div className="card p-6">
        {/* Step 1: Photo */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Добавьте фото</h3>
            <p className="text-sm text-slate-500 mb-5">Сделайте или загрузите фото проблемы</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="" className="w-full h-64 object-cover rounded-xl" />
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-slate-500 hover:text-red-500">
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-brand-400 hover:bg-brand-50 transition-colors">
                <Upload size={28} className="text-slate-300" />
                <span className="text-sm text-slate-400">Нажмите для загрузки фото</span>
              </button>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Подтвердите место</h3>
            <p className="text-sm text-slate-500 mb-5">Укажите, где находится проблема</p>
            <div className="h-48 rounded-xl bg-slate-100 flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-slate-400 text-sm text-center p-4">
                <MapPin size={28} className="mx-auto mb-2 text-brand-400" />
                <p>Карта: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Введите адрес вручную"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600" />
              <button onClick={geolocate} className="btn-ghost shrink-0">
                <MapPin size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Category */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Категория</h3>
            <p className="text-sm text-slate-500 mb-4">AI определил категорию. Вы можете изменить.</p>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-brand-700">AI определил:</p>
                <CategoryBadge category={category} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-brand-100 rounded-full">
                  <div className="h-2 bg-brand-600 rounded-full" style={{ width: `${aiConfidence}%` }} />
                </div>
                <span className="text-xs font-bold text-brand-700">{aiConfidence}%</span>
              </div>
              <p className="text-[11px] text-brand-600 mt-1">Уверенность AI</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(c => {
                const m = CATEGORY_META[c]
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      category === c
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="w-3 h-3 rounded-full mb-2" style={{ background: m.color }} />
                    <p className="text-xs font-semibold text-slate-900">{m.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Детали (необязательно)</h3>
            <p className="text-sm text-slate-500 mb-5">Опишите проблему подробнее</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={5} placeholder="AI предзаполнил описание — вы можете изменить или оставить пустым..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 resize-none" />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Проверьте и отправьте</h3>
            <p className="text-sm text-slate-500 mb-5">Убедитесь, что всё верно</p>
            <div className="flex gap-4">
              {photoPreview && (
                <img src={photoPreview} alt="" className="w-24 h-24 object-cover rounded-xl shrink-0" />
              )}
              <div className="flex flex-col gap-1.5 text-sm">
                <div><span className="text-slate-400">Место:</span> <span className="font-medium">{address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span></div>
                <div className="flex items-center gap-2"><span className="text-slate-400">Категория:</span> <CategoryBadge category={category} /></div>
                {description && <div><span className="text-slate-400">Описание:</span> <span>{description}</span></div>}
              </div>
            </div>
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 font-medium">
                ✓ Данные будут переданы в городскую службу и обработаны AI-системой
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button onClick={() => setStep(s => (s > 1 ? s - 1 : s) as Step)}
          disabled={step === 1}
          className="btn-ghost flex items-center gap-2 disabled:opacity-40">
          <ChevronLeft size={16} /> Назад
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(s => (s + 1) as Step)}
            disabled={step === 1 && !photo}
            className="btn-primary flex items-center gap-2 disabled:opacity-40">
            Далее <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? 'Отправка…' : 'Отправить обращение'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test wizard flow**

Log in as citizen (`citizen@citypulse.local`), go to `/citizen/report`.
- Step 1: upload a photo → "Далее" activates
- Step 2: click geolocate or enter address
- Step 3: AI confidence bar shows 84%, can change category
- Step 4: optional description
- Step 5: summary → submit → success screen

- [ ] **Step 3: Commit**

```bash
"C:/Program Files/Git/cmd/git.exe" add src/pages/citizen/
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: 5-step citizen report wizard with AI confidence bar"
```

---

## Task 9: Build, env vars for Vercel, deploy

**Files:**
- Modify: `.env.local` (VITE_ vars)
- Create: `vercel.json` (SPA rewrites)

- [ ] **Step 1: Add SPA rewrite rule in `vercel.json`**

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Add VITE_ env vars to Vercel**

```bash
cd C:/projects/aka
echo "https://tzmhrpjamwwagubneazc.supabase.co" | VERCEL_TOKEN=$VERCEL_TOKEN "C:/Users/Acer/AppData/Roaming/npm/vercel.cmd" env add VITE_SUPABASE_URL production --scope alokkolala-1463s-projects
echo "$VITE_SUPABASE_ANON_KEY" | VERCEL_TOKEN=$VERCEL_TOKEN "C:/Users/Acer/AppData/Roaming/npm/vercel.cmd" env add VITE_SUPABASE_ANON_KEY production --scope alokkolala-1463s-projects
```

- [ ] **Step 3: Run production build locally**

```bash
"C:/Program Files/nodejs/npm.cmd" run build
```

Expected: `dist/` folder created, `✓ built in Xs`

- [ ] **Step 4: Push and deploy**

```bash
"C:/Program Files/Git/cmd/git.exe" add -A
"C:/Program Files/Git/cmd/git.exe" commit -m "feat: complete vite+react redesign"
"C:/Program Files/Git/cmd/git.exe" push
VERCEL_TOKEN=$VERCEL_TOKEN "C:/Users/Acer/AppData/Roaming/npm/vercel.cmd" --prod --yes --scope alokkolala-1463s-projects
```

Expected: `▲ Production  https://aka-blond-eight.vercel.app — READY`

---

## Self-Review

**Spec coverage:**
- ✅ Vite + React + TypeScript scaffold
- ✅ Tailwind v4 with design tokens from mockups
- ✅ Supabase browser client (no SSR)
- ✅ React Router v7 with protected routes
- ✅ App shell (sidebar + topbar) matching mockup layout
- ✅ Screen 1: Admin Overview (stats cards + sparklines + recent reports)
- ✅ Screen 2: Admin Map (filter bar + Mapbox + cluster detail panel)
- ✅ Screen 3: Citizen Report Wizard (5 steps, AI confidence bar, photo upload)
- ✅ Login page with demo account fill
- ✅ Vercel SPA deployment

**Out of scope for this plan (next plan):**
- Admin Analytics page
- Citizen My Reports, Verify Queue, Rating
- Profile editors
- Real AI image classification (needs serverless)
- Mapbox heatmap overlay
