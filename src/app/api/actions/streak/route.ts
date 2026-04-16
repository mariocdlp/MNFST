// API: Recalculate and update user streak after action completion
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = format(new Date(), "yyyy-MM-dd");

  // Get all active pledges
  const { data: pledges } = await supabase
    .from("action_pledges")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!pledges || pledges.length === 0) {
    return NextResponse.json({ streak: 0 });
  }

  const pledgeIds = pledges.map((p: { id: string }) => p.id);

  // Check if today is complete (all pledges have "done" status)
  const { data: todayCompletions } = await supabase
    .from("action_completions")
    .select("pledge_id")
    .in("pledge_id", pledgeIds)
    .eq("date", today)
    .eq("status", "done");

  const todayComplete = (todayCompletions?.length ?? 0) >= pledgeIds.length;

  // Walk back days to calculate streak
  let streak = 0;
  let checkDate = todayComplete ? today : format(subDays(new Date(), 1), "yyyy-MM-dd");

  for (let i = 0; i < 365; i++) {
    const { data: dayCompletions } = await supabase
      .from("action_completions")
      .select("pledge_id")
      .in("pledge_id", pledgeIds)
      .eq("date", checkDate)
      .eq("status", "done");

    if ((dayCompletions?.length ?? 0) >= pledgeIds.length) {
      streak++;
      checkDate = format(subDays(parseISO(checkDate), 1), "yyyy-MM-dd");
    } else {
      break;
    }
  }

  // Get current streak record to update longest
  const { data: currentStreak } = await supabase
    .from("streaks")
    .select("longest_streak")
    .eq("user_id", user.id)
    .single();

  const longestStreak = Math.max(streak, currentStreak?.longest_streak ?? 0);

  await supabase.from("streaks").upsert({
    user_id: user.id,
    current_streak: streak,
    longest_streak: longestStreak,
    last_completion_date: todayComplete ? today : null,
  });

  // Create streak milestone notification
  if (streak > 0 && [3, 7, 14, 21, 30, 60, 90].includes(streak)) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "streak_milestone",
      title: `${streak}-day streak! 🔥`,
      content: `You've shown up ${streak} days in a row. Every day is a vote for who you're becoming.`,
    });
  }

  return NextResponse.json({ streak, longest: longestStreak });
}
