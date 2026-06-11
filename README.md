# CityPulse Aktau

CityPulse Aktau is a local demo platform for urban issue reporting and smart waste monitoring in Aktau.

The project combines two flows in one interface:

- `Citizen`: submit a report, track your reports, verify reports, manage profile
- `Admin`: view report map, monitor waste containers, review incoming incidents

The repository is built for hackathon demo use: fast local setup, clear UI, and a data flow that can work with Supabase and demo data.

## Stack

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Supabase`
- `Leaflet`
- `Recharts`
- `Tailwind CSS v4`

## Main sections

### Citizen

- `/citizen/report` - new report wizard
- `/citizen/my-reports` - personal report list
- `/citizen/verify` - report verification queue
- `/citizen/profile` - citizen profile

### Admin

- `/admin/map` - report map and recent reports
- `/admin/waste` - smart waste container map
- `/admin/settings` - admin settings

## What works now

- public landing page
- login by role
- citizen report submission
- report list and verification flow
- admin map with report points
- fallback display for reports that exist without a linked cluster
- waste container map with strict `green / yellow / red` status colors by fill level
- Supabase-backed data layer
- mock AI mode for demo

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment

Copy `.env.example` to `.env.local`.

Minimum values for local UI start:

```env
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_DEFAULT_CITY=aktau
NEXT_PUBLIC_DEFAULT_LAT=43.6532
NEXT_PUBLIC_DEFAULT_LNG=51.1975
NEXT_PUBLIC_CLUSTER_RADIUS_METERS=50

NEXT_PUBLIC_MAPBOX_TOKEN=
MAPBOX_GEOCODING_URL=https://api.mapbox.com/search/geocode/v6

AI_PROVIDER=mock
```

If you want auth, storage, reports, and live data to work fully, also set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=reports
SUPABASE_AVATAR_BUCKET=avatars
```

### 3. Start development server

```bash
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173
```

### 4. Production build

```bash
npm run build
```

### 5. Preview build

```bash
npm run preview
```

## Environment variables

### Core

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DEFAULT_CITY`
- `NEXT_PUBLIC_DEFAULT_LAT`
- `NEXT_PUBLIC_DEFAULT_LNG`
- `NEXT_PUBLIC_CLUSTER_RADIUS_METERS`

### Map

- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `MAPBOX_GEOCODING_URL`

Note:

- the current app uses `Leaflet` for the visible map
- `Mapbox` variables remain in the project for geocoding and future switch-back

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_AVATAR_BUCKET`

### AI providers

- `AI_PROVIDER`
- `AI_API_URL`
- `AI_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_MODEL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`
- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`

For hackathon demo, `AI_PROVIDER=mock` is enough.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Project structure

```text
src/
  components/
    citizen-v2/
    layout/
    maps/
    ui/
  contexts/
  hooks/
  lib/
  pages/
    admin/
    auth/
    citizen/
  types/

supabase/
tests/
public/
```

## Important implementation notes

- The admin report map renders from `clusters`.
- If a report exists but has no valid linked cluster, the UI now shows it as a direct fallback point on the map.
- The waste container map uses strict visual severity logic:
  - `0-50%` -> green
  - `51-80%` -> yellow
  - `81-100%`, `full`, `fire`, `sos` -> red
  - `offline` -> muted

## Demo notes

- This repository is optimized for local demo on a laptop.
- Hardware integration can send data into the same stack later.
- Without Supabase keys, the app shell can still render, but data actions will not fully work.

## Repository

- GitHub: [azapazaka/binmangystau](https://github.com/azapazaka/binmangystau)
