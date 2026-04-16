// Supabase client for browser-side usage
// Using Supabase for auth, database, and storage — best fit for Next.js App Router
// with built-in Row Level Security, real-time, and generous free tier.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a mock client for local dev without Supabase configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local" } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), data: null, error: null }), data: null, error: null, order: () => ({ limit: () => ({ single: async () => ({ data: null, error: null }) }), data: [] }), in: () => ({ data: [], error: null }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }), data: null, error: null }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        upsert: () => ({ data: null, error: null }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(url, key);
}
