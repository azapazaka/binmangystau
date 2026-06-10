const DEFAULT_LAT = 43.238949;
const DEFAULT_LNG = 76.889709;
const DEFAULT_MAPBOX_PUBLIC_TOKEN = "";

const REQUIRED_SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || "almaty",
  defaultLat: parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LAT, DEFAULT_LAT),
  defaultLng: parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LNG, DEFAULT_LNG),
  clusterRadiusMeters: parseNumber(
    process.env.NEXT_PUBLIC_CLUSTER_RADIUS_METERS,
    50,
  ),
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || DEFAULT_MAPBOX_PUBLIC_TOKEN,
  mapboxGeocodingUrl:
    process.env.MAPBOX_GEOCODING_URL || "https://api.mapbox.com/search/geocode/v6",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "reports",
  supabaseAvatarBucket: process.env.SUPABASE_AVATAR_BUCKET || "avatars",
  aiProvider: process.env.AI_PROVIDER || "mock",
  aiApiUrl: process.env.AI_API_URL || "",
  aiApiKey: process.env.AI_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || process.env.AI_API_URL || "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  openrouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
  openrouterSiteUrl: process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  openrouterAppName: process.env.OPENROUTER_APP_NAME || "CityPulse",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};

function getMissingSupabaseEnvKeys() {
  return REQUIRED_SUPABASE_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

export function assertSupabaseConfigured() {
  const [missingKey] = getMissingSupabaseEnvKeys();

  if (missingKey) {
    throw new Error(`Missing required Supabase environment variable: ${missingKey}`);
  }
}

export function getRequiredSupabaseConfig() {
  assertSupabaseConfigured();

  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceRoleKey: env.supabaseServiceRoleKey,
    reportsBucket: env.supabaseStorageBucket,
    avatarBucket: env.supabaseAvatarBucket,
  };
}

export function isSupabaseConfigured() {
  return getMissingSupabaseEnvKeys().length === 0;
}

export function isMapboxConfigured() {
  return Boolean(env.mapboxToken);
}
