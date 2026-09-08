// Regenerates supabase/seed/content_library.sql from src/lib/content/library.json.
// Run after editing the library:  node scripts/generate-content-seed.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const library = JSON.parse(readFileSync(new URL("../src/lib/content/library.json", import.meta.url), "utf8"));

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const textArray = (values) => `array[${values.map(quote).join(", ")}]::text[]`;
const jsonb = (value) => `${quote(JSON.stringify(value))}::jsonb`;

const rows = library.map((item) =>
  `  (${[
    quote(item.id),
    quote(item.type),
    quote(item.title),
    jsonb(item.content_data),
    quote(item.benefit_tag),
    quote(item.science_ref),
    textArray(item.method_tags),
    textArray(item.goal_categories),
    textArray(item.personalization_variables),
    quote(item.intensity),
    quote(item.time_of_day_affinity),
    item.duration_seconds === null ? "null" : item.duration_seconds,
    item.is_premium,
  ].join(", ")})`
);

const sql = `-- IDSHIFT content library seed — ${library.length} pieces
-- GENERATED FILE. Edit src/lib/content/library.json, then run:
--   node scripts/generate-content-seed.mjs

insert into public.content_library (
  id, type, title, content_data, benefit_tag, science_ref, method_tags,
  goal_categories, personalization_variables, intensity, time_of_day_affinity,
  duration_seconds, is_premium
) values
${rows.join(",\n")}
on conflict (id) do update set
  type = excluded.type,
  title = excluded.title,
  content_data = excluded.content_data,
  benefit_tag = excluded.benefit_tag,
  science_ref = excluded.science_ref,
  method_tags = excluded.method_tags,
  goal_categories = excluded.goal_categories,
  personalization_variables = excluded.personalization_variables,
  intensity = excluded.intensity,
  time_of_day_affinity = excluded.time_of_day_affinity,
  duration_seconds = excluded.duration_seconds,
  is_premium = excluded.is_premium;
`;

mkdirSync(new URL("../supabase/seed/", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/seed/content_library.sql", import.meta.url), sql);
console.log(`Wrote supabase/seed/content_library.sql (${library.length} pieces)`);
