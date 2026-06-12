// src/lib/env.ts
export const env = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? '') as string,
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string,
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN ?? '') as string,
  openRouterApiKey: (import.meta.env.VITE_OPENROUTER_API_KEY ?? '') as string,
  smartBinSource: (import.meta.env.VITE_SMART_BIN_SOURCE ?? '') as string,
  smartBinBridgeUrl: (import.meta.env.VITE_SMART_BIN_BRIDGE_URL ?? 'http://localhost:8787') as string,
  smartBinCloudUrl: (import.meta.env.VITE_SMART_BIN_CLOUD_URL ?? '/api/smart-bin/live') as string,
  defaultLat: 43.6532,
  defaultLng: 51.1975,
  clusterRadiusMeters: 50,
}

export const isSupabaseConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey)

export const isMapboxConfigured = () => Boolean(env.mapboxToken)
