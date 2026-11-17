// API: everything the user has saved, newest first.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveFeedRows } from "@/lib/content/resolve";
import type { ContentFormat, GeneratedContent, SurveyData, UserFeedRow } from "@/types";

const FORMATS: ContentFormat[] = ["image", "carousel", "video", "meditation", "affirmation"];

export async function GET(request: NextRequest) {
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

  if (!surveyRow) return NextResponse.json({ cards: [] });

  const { data: rows } = await supabase
    .from("user_feed")
    .select("*")
    .eq("user_id", user.id)
    .eq("saved", true)
    .order("served_at", { ascending: false })
    .limit(50);

  const feedRows = (rows ?? []) as UserFeedRow[];

  const generatedIds = feedRows
    .map((row) => row.generated_content_id)
    .filter((id): id is string => id !== null);

  const { data: generated } = generatedIds.length
    ? await supabase.from("generated_content").select("*").in("id", generatedIds)
    : { data: [] };

  let cards = resolveFeedRows(
    feedRows,
    (generated ?? []) as GeneratedContent[],
    surveyRow.response_data as SurveyData
  );

  const type = request.nextUrl.searchParams.get("type");
  if (type && FORMATS.includes(type as ContentFormat)) {
    cards = cards.filter((card) => card.type === type);
  }

  return NextResponse.json({ cards });
}
