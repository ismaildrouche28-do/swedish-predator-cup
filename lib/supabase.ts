import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createClientServer() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      get(name)                          { return cookieStore.get(name)?.value; },
      set(name, value, options)          { try { cookieStore.set({ name, value, ...options }); } catch {} },
      remove(name, options)              { try { cookieStore.set({ name, value: "", ...options }); } catch {} },
    },
  });
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
