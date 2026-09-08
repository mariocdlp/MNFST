// Cron job: Send weekly summary emails every Sunday
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { format, subDays } from "date-fns";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scheduled work spans every user, so it runs with the service role.
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Get all users with weekly summary enabled
  const { data: prefUsers } = await supabase
    .from("notification_preferences")
    .select("user_id")
    .eq("email_weekly_summary", true);

  const results = { sent: 0, errors: 0 };
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
  );

  for (const pref of prefUsers ?? []) {
    try {
      const [profileRes, pledgesRes, streakRes] = await Promise.all([
        supabase.from("profiles").select("email, name").eq("id", pref.user_id).single(),
        supabase.from("action_pledges").select("id").eq("user_id", pref.user_id).eq("is_active", true),
        supabase.from("streaks").select("current_streak, longest_streak").eq("user_id", pref.user_id).single(),
      ]);

      const profile = profileRes.data;
      const pledgeIds = pledgesRes.data?.map((p: { id: string }) => p.id) ?? [];
      const streak = streakRes.data;

      if (!profile || pledgeIds.length === 0) continue;

      // Count days this week where all pledges were done
      const { data: completions } = await supabase
        .from("action_completions")
        .select("date")
        .in("pledge_id", pledgeIds)
        .in("date", weekDates)
        .eq("status", "done");

      // Count unique dates where all pledges were done
      const dateCounts: Record<string, number> = {};
      for (const c of completions ?? []) {
        dateCounts[c.date] = (dateCounts[c.date] ?? 0) + 1;
      }
      const daysCompleted = Object.values(dateCounts).filter(
        (count) => count >= pledgeIds.length
      ).length;

      // Get identity statement
      const { data: latestSurvey } = await supabase
        .from("survey_responses")
        .select("response_data")
        .eq("user_id", pref.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const futureIdentity = latestSurvey?.response_data?.future_identity ?? "";

      await supabase.from("notifications").insert({
        user_id: pref.user_id,
        type: "weekly_summary",
        title: "Your weekly summary",
        content: `You completed ${daysCompleted} out of 7 days this week.`,
      });

      await fetch(`${appUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.CRON_SECRET ?? "",
        },
        body: JSON.stringify({
          type: "weekly_summary",
          email: profile.email,
          name: profile.name,
          data: {
            daysCompleted,
            currentStreak: streak?.current_streak ?? 0,
            longestStreak: streak?.longest_streak ?? 0,
            future_identity: futureIdentity,
          },
        }),
      });

      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
