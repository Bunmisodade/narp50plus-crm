import { createClient } from "@supabase/supabase-js";

// Server-only. Uses the service role key, which bypasses RLS —
// never import this file into anything that runs in the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
