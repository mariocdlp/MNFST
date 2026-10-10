// API: the intake survey — save answers, read the latest set back.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SurveyData } from "@/types";

const REQUIRED: (keyof SurveyData)[] = [
  "first_name",
  "current_identity",
  "occupation",
  "gender",
  "dream_description",
  "dream_scene",
  "future_identity",
  "daily_habit",
  "first_step",
  "if_time",
  "then_action",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: survey } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!survey) return NextResponse.json({ survey: null }, { status: 404 });

  return NextResponse.json({ survey });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { surveyData } = (await request.json()) as { surveyData: SurveyData };

  for (const field of REQUIRED) {
    if (!surveyData?.[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const { data: surveyResponse, error } = await supabase
    .from("survey_responses")
    .insert({ user_id: user.id, response_data: surveyData })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

  return NextResponse.json({ surveyResponseId: surveyResponse.id });
}
