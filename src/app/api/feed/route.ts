// API: serve the personalized feed for a time slot.
//
// A slot is built once per user per day and then stored, so the feed is stable
// if they reopen it, and so "what did I see yesterday" stays answerable.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildFeed, currentTimeOfDay } from "@/lib/content/feed";
import { getLibraryItem } from "@/lib/content/library";
import { libraryCard, resolveFeedRows } from "@/lib/content/resolve";
import { sampleSurvey } from "@/lib/content/sample-survey";
import type { GeneratedContent, SurveyData, TimeOfDay, UserFeedRow } from "@/types";

const SLOTS: TimeOfDay[] = ["morning", "midday", "evening"];
const FEED_LENGTH = 6;
/** Library pieces served in the last week are held back from a new slot. */
const REPEAT_WINDOW_DAYS = 7;

function parseSlot(value: string | null): TimeOfDay {
  return SLOTS.includes(value as TimeOfDay) ? (value as TimeOfDay) : currentTimeOfDay();
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const slot = parseSlot(request.nextUrl.searchParams.get("slot"));

  // Local dev without a Supabase project: render the library against a sample
  // profile so the feed is workable. Never reachable once env vars are set.
  if (!isSupabaseConfigured()) {
    const selections = buildFeed({ survey: sampleSurvey, slot, count: FEED_LENGTH, seed: "preview" });
    const cards = selections
      .map((selection) => getLibraryItem(selection.id))
      .filter((item) => item !== null)
      .map((item) => libraryCard(item, sampleSurvey, { time_slot: slot }));
    return NextResponse.json({ slot, cards, preview: true });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: surveyRow } = await supabase
    .from("survey_responses")
    .select("response_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!surveyRow) {
    return NextResponse.json({ error: "Complete your intake first", needsSurvey: true }, { status: 409 });
  }

  const survey = surveyRow.response_data as SurveyData;
  const today = isoDate(new Date());

  const { data: generatedRows } = await supabase
    .from("generated_content")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(20);

  const generated = (generatedRows ?? []) as GeneratedContent[];

  const { data: existing } = await supabase
    .from("user_feed")
    .select("*")
    .eq("user_id", user.id)
    .eq("feed_date", today)
    .eq("time_slot", slot)
    .order("position", { ascending: true });

  if (existing && existing.length > 0) {
    return NextResponse.json({
      slot,
      cards: resolveFeedRows(existing as UserFeedRow[], generated, survey),
    });
  }

  // Nothing served for this slot yet — build it.
  const since = new Date();
  since.setDate(since.getDate() - REPEAT_WINDOW_DAYS);

  const { data: recent } = await supabase
    .from("user_feed")
    .select("library_content_id")
    .eq("user_id", user.id)
    .gte("feed_date", isoDate(since))
    .not("library_content_id", "is", null);

  const excludeIds = (recent ?? [])
    .map((row: { library_content_id: string | null }) => row.library_content_id)
    .filter((id: string | null): id is string => id !== null);

  // Only offer generated pieces the feed hasn't used yet.
  const { data: usedGenerated } = await supabase
    .from("user_feed")
    .select("generated_content_id")
    .eq("user_id", user.id)
    .not("generated_content_id", "is", null);

  const usedGeneratedIds = new Set(
    (usedGenerated ?? []).map((row: { generated_content_id: string | null }) => row.generated_content_id)
  );

  const selections = buildFeed({
    survey,
    slot,
    generated: generated.filter((item) => !usedGeneratedIds.has(item.id)),
    excludeIds,
    count: FEED_LENGTH,
    seed: `${user.id}:${today}`,
  });

  const rows = selections.map((selection) => ({
    user_id: user.id,
    content_source: selection.source,
    library_content_id: selection.source === "library" ? selection.id : null,
    generated_content_id: selection.source === "generated" ? selection.id : null,
    time_slot: slot,
    feed_date: today,
    position: selection.position,
  }));

  const { data: inserted, error } = await supabase.from("user_feed").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordered = (inserted as UserFeedRow[]).sort((a, b) => a.position - b.position);

  return NextResponse.json({
    slot,
    cards: resolveFeedRows(ordered, generated, survey),
  });
}
