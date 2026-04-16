// Supabase client for browser-side usage
// Using Supabase for auth, database, and storage — best fit for Next.js App Router
// with built-in Row Level Security, real-time, and generous free tier.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
