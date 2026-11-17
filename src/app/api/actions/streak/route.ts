// API: recalculate the user's streak (called after a completion changes).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMilestone, recalculateStreak } from "@/lib/streaks";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await recalculateStreak(supabase, user.id);

  if (result.current > 0 && isMilestone(result.current)) {
    // One milestone notification per streak length.
    const title = `${result.current}-day streak`;
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
        content: `You've shown up ${result.current} days running. Every one of them was a vote for who you're becoming.`,
      });
    }
  }

  return NextResponse.json({
    streak: result.current,
    longest: result.longest,
    todayComplete: result.todayComplete,
  });
}
