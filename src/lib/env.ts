// src/lib/env.ts
export const env = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? '') as string,
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string,
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN ?? '') as string,
  openRouterApiKey: (import.meta.env.VITE_OPENROUTER_API_KEY ?? '') as string,
  defaultLat: 43.6532,
  defaultLng: 51.1975,
  clusterRadiusMeters: 50,
}

export const isSupabaseConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey)

export const isMapboxConfigured = () => Boolean(env.mapboxToken)
