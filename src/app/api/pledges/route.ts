// API: the user's action pledges — the commitments derived from their intake.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTION_TYPES, pledgeTextFor } from "@/lib/pledges";
import type { ActionType, SurveyData } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pledges } = await supabase
    .from("action_pledges")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("pledged_at", { ascending: true });

  return NextResponse.json({ pledges: pledges ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { actionType } = (await request.json()) as { actionType?: ActionType };

  if (!actionType || !ACTION_TYPES.includes(actionType)) {
    return NextResponse.json({ error: "A valid actionType is required" }, { status: 400 });
  }

  const { data: surveyRow } = await supabase
    .from("survey_responses")
    .select("id, response_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!surveyRow) {
    return NextResponse.json({ error: "Complete your intake first" }, { status: 409 });
  }

  const survey = surveyRow.response_data as SurveyData;
  const actionText = pledgeTextFor(actionType, survey).trim();

  if (!actionText) {
    return NextResponse.json({ error: "That commitment is empty in your intake" }, { status: 400 });
  }

  // Re-pledging replaces the old commitment rather than stacking a second one —
  // completions stay attached to the pledge that was active when they happened.
  await supabase
    .from("action_pledges")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("action_type", actionType)
    .eq("is_active", true);

  const { data: pledge, error } = await supabase
    .from("action_pledges")
    .insert({
      user_id: user.id,
      survey_response_id: surveyRow.id,
      action_type: actionType,
      action_text: actionText,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pledge });
}

/** Withdraw a pledge. History is kept; it just stops counting toward streaks. */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pledgeId = request.nextUrl.searchParams.get("id");
  if (!pledgeId) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("action_pledges")
    .update({ is_active: false })
    .eq("id", pledgeId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
