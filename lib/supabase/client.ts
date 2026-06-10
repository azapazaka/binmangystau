"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getRequiredSupabaseConfig } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const config = getRequiredSupabaseConfig();

  return createBrowserClient(config.url, config.anonKey);
}
