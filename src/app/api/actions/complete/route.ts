// API: mark a pledged action done / partial / skipped for a day.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { isMilestone, recalculateStreak } from "@/lib/streaks";
import type { CompletionStatus } from "@/types";

const STATUSES: CompletionStatus[] = ["done", "skipped", "partial"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pledgeId, status, reflection, date } = (await request.json()) as {
    pledgeId?: string;
    status?: CompletionStatus;
    reflection?: string;
    date?: string;
  };

  if (!pledgeId || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "pledgeId and a valid status are required" }, { status: 400 });
  }

  // RLS covers this too; checking here turns a silent no-op into a 404.
  const { data: pledge } = await supabase
    .from("action_pledges")
    .select("id")
    .eq("id", pledgeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!pledge) return NextResponse.json({ error: "Pledge not found" }, { status: 404 });

  const { error } = await supabase.from("action_completions").upsert(
    {
      pledge_id: pledgeId,
      date: date ?? format(new Date(), "yyyy-MM-dd"),
      status,
      reflection_text: reflection ?? null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "pledge_id,date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const streak = await recalculateStreak(supabase, user.id);

  if (streak.current > 0 && isMilestone(streak.current)) {
    const title = `${streak.current}-day streak`;
    const { data: already } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "streak_milestone")
      .eq("title", title)
      .limit(1)
      .maybeSingle();

    if (!already) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "streak_milestone",
        title,
        content: `You've shown up ${streak.current} days running. Every one of them was a vote for who you're becoming.`,
      });
    }
  }

  return NextResponse.json({ success: true, streak: streak.current, longest: streak.longest });
}
