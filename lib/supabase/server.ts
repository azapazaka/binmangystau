import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getRequiredSupabaseConfig } from "@/lib/env";

export async function createSupabaseServerClient() {
  const config = getRequiredSupabaseConfig();

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Next.js only allows cookie mutation in route handlers and server actions.
          // During Server Component rendering we can still read the session, while
          // auth routes remain responsible for persisting refreshed cookies.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const config = getRequiredSupabaseConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
