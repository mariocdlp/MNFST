// Service-role client, for server-side work that spans users.
//
// The cron routes have no session, so the anon client would be blocked by RLS
// on every table and silently send nothing. This client bypasses RLS — only
// import it from routes that verify CRON_SECRET first, and never from anything
// that runs in the browser.
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for scheduled jobs"
    );
  }

  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
