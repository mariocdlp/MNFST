// Streak calculation.
//
// A day counts when every active pledge was marked done. The whole history is
// pulled in one query and walked in memory — the previous per-day round trip
// cost up to 365 queries for one recalculation.

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";

export interface StreakResult {
  current: number;
  longest: number;
  lastCompletionDate: string | null;
  todayComplete: boolean;
}

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export function isMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}

/** Days, most recent first, on which every pledge was marked done. */
function completeDays(
  completions: { date: string; status: string }[],
  pledgeCount: number
): Set<string> {
  const doneByDate = new Map<string, number>();

  for (const completion of completions) {
    if (completion.status !== "done") continue;
    doneByDate.set(completion.date, (doneByDate.get(completion.date) ?? 0) + 1);
  }

  const complete = new Set<string>();
  for (const [date, count] of doneByDate) {
    if (count >= pledgeCount) complete.add(date);
  }
  return complete;
}

export async function recalculateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakResult> {
  const { data: pledges } = await supabase
    .from("action_pledges")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  const pledgeIds = (pledges ?? []).map((pledge: { id: string }) => pledge.id);

  if (pledgeIds.length === 0) {
    return { current: 0, longest: 0, lastCompletionDate: null, todayComplete: false };
  }

  const windowStart = format(subDays(new Date(), 400), "yyyy-MM-dd");
  const { data: completions } = await supabase
    .from("action_completions")
    .select("date, status")
    .in("pledge_id", pledgeIds)
    .gte("date", windowStart);

  const complete = completeDays(completions ?? [], pledgeIds.length);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayComplete = complete.has(today);

  // Walk back from today (or yesterday, if today isn't done yet — a streak
  // shouldn't break just because it's 9am).
  let current = 0;
  let cursor = todayComplete ? new Date() : subDays(new Date(), 1);
  while (complete.has(format(cursor, "yyyy-MM-dd"))) {
    current++;
    cursor = subDays(cursor, 1);
  }

  const { data: existing } = await supabase
    .from("streaks")
    .select("longest_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const longest = Math.max(current, existing?.longest_streak ?? 0);
  const lastCompletionDate = [...complete].sort().pop() ?? null;

  await supabase.from("streaks").upsert({
    user_id: userId,
    current_streak: current,
    longest_streak: longest,
    last_completion_date: lastCompletionDate,
  });

  return { current, longest, lastCompletionDate, todayComplete };
}
