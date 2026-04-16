// API: Save survey responses and initiate video generation
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SurveyData } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { surveyData, vibeId = "warm_cinematic" }: { surveyData: SurveyData; vibeId: string } = body;

  // Validate required fields
  const required: (keyof SurveyData)[] = [
    "first_name", "current_identity", "occupation", "gender",
    "dream_description", "dream_scene", "future_identity",
    "daily_habit", "first_step", "if_time", "then_action",
  ];
  for (const field of required) {
    if (!surveyData[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // Save survey response
  const { data: surveyResponse, error: surveyError } = await supabase
    .from("survey_responses")
    .insert({ user_id: user.id, response_data: surveyData })
    .select()
    .single();

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 });

  // Create video record (queued)
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      survey_response_id: surveyResponse.id,
      template_id: "universal_v1",
      vibe_id: vibeId,
      status: "queued",
    })
    .select()
    .single();

  if (videoError) return NextResponse.json({ error: videoError.message }, { status: 500 });

  return NextResponse.json({
    surveyResponseId: surveyResponse.id,
    videoId: video.id,
  });
}
