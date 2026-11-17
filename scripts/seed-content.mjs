// Pushes src/lib/content/library.json into public.content_library.
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the service
// role bypasses RLS, which is read-only on this table).
//   node scripts/seed-content.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const library = JSON.parse(readFileSync(new URL("../src/lib/content/library.json", import.meta.url), "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error } = await supabase.from("content_library").upsert(library, { onConflict: "id" });

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${library.length} library pieces.`);
