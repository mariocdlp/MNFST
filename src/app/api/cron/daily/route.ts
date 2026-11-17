// Cron job: Send morning reminders and evening check-ins
// Schedule with Vercel Cron (vercel.json) or Cloud Scheduler
// Run every hour — check which users need a notification at this time
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

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
  const currentHour = format(new Date(), "HH");

  // Find users whose morning reminder time matches (within the current hour)
  const { data: morningUsers } = await supabase
    .from("notification_preferences")
    .select("user_id, morning_reminder_time, email_morning_reminder")
    .eq("email_morning_reminder", true)
    .like("morning_reminder_time", `${currentHour}:%`);

  // Find users whose evening check-in time matches
  const { data: eveningUsers } = await supabase
    .from("notification_preferences")
    .select("user_id, evening_checkin_time, email_evening_checkin")
    .eq("email_evening_checkin", true)
    .like("evening_checkin_time", `${currentHour}:%`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const results = { morning: 0, evening: 0, errors: 0 };

  // Send morning reminders
  for (const pref of morningUsers ?? []) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", pref.user_id)
        .single();

      const { data: latestSurvey } = await supabase
        .from("survey_responses")
        .select("response_data")
        .eq("user_id", pref.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!profile || !latestSurvey) continue;

      const surveyData = latestSurvey.response_data;

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: pref.user_id,
        type: "morning_reminder",
        title: `Good morning, ${profile.name}`,
        content: `Remember: ${surveyData.future_identity}. Time to ${surveyData.then_action}.`,
      });

      // Send email
      await fetch(`${appUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.CRON_SECRET ?? "",
        },
        body: JSON.stringify({
          type: "morning_reminder",
          email: profile.email,
          name: profile.name,
          data: {
            future_identity: surveyData.future_identity,
            daily_habit: surveyData.daily_habit,
            if_time: surveyData.if_time,
            then_action: surveyData.then_action,
          },
        }),
      });

      results.morning++;
    } catch {
      results.errors++;
    }
  }

  // Send evening check-ins
  for (const pref of eveningUsers ?? []) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", pref.user_id)
        .single();

      const { data: pledges } = await supabase
        .from("action_pledges")
        .select("id, action_text")
        .eq("user_id", pref.user_id)
        .eq("is_active", true);

      if (!profile) continue;

      await supabase.from("notifications").insert({
        user_id: pref.user_id,
        type: "evening_checkin",
        title: `How did today go, ${profile.name}?`,
        content: "Time to log your progress for today.",
      });

      await fetch(`${appUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.CRON_SECRET ?? "",
        },
        body: JSON.stringify({
          type: "evening_checkin",
          email: profile.email,
          name: profile.name,
          data: { pledges: pledges ?? [] },
        }),
      });

      results.evening++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
