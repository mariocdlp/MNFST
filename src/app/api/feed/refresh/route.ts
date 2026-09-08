// API: generate today's personalized pieces (2-3 per user) via fal.ai.
// Called by the daily cron for every active user, and on demand from the feed.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyBatch } from "@/lib/ai/generate";
import type { SurveyData } from "@/types";

const DAILY_LIMIT = 3;

export async function POST() {
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
    return NextResponse.json({ error: "Complete your intake first" }, { status: 409 });
  }

  // One refresh a day. The feed stays fresh; the bill stays predictable.
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", "system_generated")
    .gte("created_at", since.toISOString());

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ created: 0, message: "Today's pieces are already generated." });
  }

  const { data: photo } = await supabase
    .from("user_photos")
    .select("photo_url")
    .eq("user_id", user.id)
    .eq("photo_type", "face_front")
    .limit(1)
    .maybeSingle();

  const { drafts, errors } = await generateDailyBatch(surveyRow.response_data as SurveyData, {
    referenceImageUrl: photo?.photo_url,
    count: DAILY_LIMIT - (count ?? 0),
  });

  if (drafts.length === 0) {
    return NextResponse.json({ error: "Generation failed", details: errors }, { status: 502 });
  }

  const { error } = await supabase.from("generated_content").insert(
    drafts.map((draft) => ({
      user_id: user.id,
      type: draft.type,
      title: draft.title,
      content_data: draft.content_data,
      generation_prompt: draft.generation_prompt,
      benefit_tag: draft.benefit_tag,
      science_ref: draft.science_ref,
      method_tags: draft.method_tags,
      status: draft.status,
      source: "system_generated",
      credits_spent: 0,
      duration_seconds: draft.duration_seconds,
    }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "content_ready",
    title: "New content in your feed",
    content: `${drafts.length} new ${drafts.length === 1 ? "piece" : "pieces"} made for you today.`,
  });

  return NextResponse.json({ created: drafts.length, errors });
}
