"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { ActionPledge, ActionCompletion, Video, Streak, SurveyData } from "@/types";

interface DashboardData {
  latestVideo: Video | null;
  surveyData: SurveyData | null;
  pledges: ActionPledge[];
  todayCompletions: ActionCompletion[];
  streak: Streak;
  weekCompletions: Record<string, boolean>; // date string -> all done
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "settings">("today");

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/auth/login"); return; }

    const today = format(new Date(), "yyyy-MM-dd");

    // Load all dashboard data in parallel
    const [videosRes, pledgesRes, streakRes, completionsRes] = await Promise.all([
      supabase
        .from("videos")
        .select("*, survey_responses(response_data)")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("action_pledges")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("is_active", true),
      supabase
        .from("streaks")
        .select("*")
        .eq("user_id", authUser.id)
        .single(),
      supabase
        .from("action_completions")
        .select("*")
        .eq("date", today)
        .in(
          "pledge_id",
          (await supabase
            .from("action_pledges")
            .select("id")
            .eq("user_id", authUser.id)
            .eq("is_active", true)
          ).data?.map((p: { id: string }) => p.id) ?? []
        ),
    ]);

    // Build 7-day week completion map
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
    );
    const pledgeIds = pledgesRes.data?.map((p: ActionPledge) => p.id) ?? [];
    let weekCompletions: Record<string, boolean> = {};

    if (pledgeIds.length > 0) {
      const { data: weekComp } = await supabase
        .from("action_completions")
        .select("date, pledge_id")
        .in("pledge_id", pledgeIds)
        .in("date", weekDates)
        .eq("status", "done");

      // A day is "complete" if all active pledges have a completion entry
      for (const date of weekDates) {
        const completedOnDay = (weekComp ?? []).filter(
          (c: { date: string }) => c.date === date
        ).length;
        weekCompletions[date] = completedOnDay >= pledgeIds.length && pledgeIds.length > 0;
      }
    } else {
      for (const date of weekDates) weekCompletions[date] = false;
    }

    const latestVideo = videosRes.data?.[0] ?? null;
    const surveyData = latestVideo?.survey_responses?.response_data ?? null;

    setData({
      latestVideo,
      surveyData,
      pledges: pledgesRes.data ?? [],
      todayCompletions: completionsRes.data ?? [],
      streak: streakRes.data ?? { user_id: authUser.id, current_streak: 0, longest_streak: 0, last_completion_date: null },
      weekCompletions,
    });
    setLoading(false);
  }

  async function markComplete(pledgeId: string, status: "done" | "skipped") {
    setCompletingId(pledgeId);
    const supabase = createClient();
    const today = format(new Date(), "yyyy-MM-dd");

    await supabase.from("action_completions").upsert({
      pledge_id: pledgeId,
      date: today,
      status,
      completed_at: new Date().toISOString(),
    }, { onConflict: "pledge_id,date" });

    // Recalculate streak via API
    await fetch("/api/actions/streak", { method: "POST" });

    await loadDashboard();
    setCompletingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No video yet — show welcome / start flow
  if (!data?.latestVideo) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-16 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold">
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted mt-3 text-lg max-w-md mx-auto">
              You have <span className="text-accent font-semibold">{user?.credits_remaining ?? 3} free videos</span> waiting.
              It takes 5 minutes to tell us your dream.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link href="/survey">
              <Button size="lg" className="px-10">
                Create Your First Video
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const { latestVideo, surveyData, pledges, todayCompletions, streak, weekCompletions } = data;
  const today = format(new Date(), "yyyy-MM-dd");
  const weekDates = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-8">

        {/* Identity banner */}
        {surveyData?.future_identity && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6 px-4 rounded-2xl bg-gradient-to-r from-accent/10 via-purple-500/5 to-accent/10 border border-accent/20"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2">Your Identity</p>
            <p className="text-xl font-bold gradient-text leading-snug">
              &ldquo;{surveyData.future_identity}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(["today", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              {tab === "today" ? "Today" : "Settings"}
            </button>
          ))}
        </div>

        {activeTab === "today" && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="md:col-span-2 space-y-6">

              {/* Today's Actions */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">Today&apos;s Actions</h2>
                {pledges.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted text-sm">No active pledges yet.</p>
                    {latestVideo?.status === "completed" && (
                      <Link href={`/plan/${latestVideo.id}`}>
                        <Button size="sm" className="mt-3">Create Action Plan</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pledges.map((pledge) => {
                      const completion = todayCompletions.find((c) => c.pledge_id === pledge.id);
                      const isDone = completion?.status === "done";
                      const isSkipped = completion?.status === "skipped";
                      return (
                        <div
                          key={pledge.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            isDone ? "border-success/30 bg-success/5"
                            : isSkipped ? "border-border/50 bg-surface opacity-60"
                            : "border-border bg-surface-light"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-xs uppercase tracking-wider text-muted mb-1">
                                {pledge.action_type.replace(/_/g, " ")}
                              </p>
                              <p className={`text-sm font-medium ${isDone ? "line-through text-muted" : ""}`}>
                                {pledge.action_text}
                              </p>
                            </div>
                            {!completion ? (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => markComplete(pledge.id, "done")}
                                  disabled={completingId === pledge.id}
                                  className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => markComplete(pledge.id, "skipped")}
                                  disabled={completingId === pledge.id}
                                  className="p-1.5 rounded-lg bg-surface hover:bg-border text-muted transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                                isDone ? "bg-success/10 text-success" : "bg-border text-muted"
                              }`}>
                                {isDone ? "Done" : "Skipped"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Weekly progress grid */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">This Week</h2>
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isToday = dateStr === today;
                    const isDone = weekCompletions[dateStr];
                    return (
                      <div key={dateStr} className="flex flex-col items-center gap-1.5">
                        <span className="text-xs text-muted">{format(date, "EEE")}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium transition-colors ${
                          isDone ? "bg-success/20 text-success border border-success/30"
                          : isToday ? "bg-accent/10 border-2 border-accent text-accent"
                          : "bg-surface border border-border text-muted"
                        }`}>
                          {isDone ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            format(date, "d")
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Video card */}
              {latestVideo && (
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Your Video</h2>
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-purple-900/30 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {surveyData?.goal_categories?.map(c => c.replace(/_/g, " ")).join(", ") ?? "Manifestation Video"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {latestVideo.status === "completed" ? "Ready to watch" : `Status: ${latestVideo.status}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {latestVideo.status === "completed" && (
                        <Link href={`/watch/${latestVideo.id}`}>
                          <Button size="sm" variant="secondary">Rewatch</Button>
                        </Link>
                      )}
                      {latestVideo.video_url && (
                        <a href={latestVideo.video_url} download>
                          <Button size="sm" variant="ghost">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Side column */}
            <div className="space-y-6">
              {/* Streak */}
              <Card className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted mb-2">Current Streak</p>
                <motion.div
                  className="text-5xl font-bold gradient-text pulse-gentle"
                  key={streak.current_streak}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  {streak.current_streak}
                </motion.div>
                <p className="text-sm text-muted mt-1">days</p>
                {streak.longest_streak > 0 && (
                  <p className="text-xs text-muted/60 mt-3">
                    Personal best: {streak.longest_streak} days
                  </p>
                )}
              </Card>

              {/* Credits */}
              <Card>
                <p className="text-xs uppercase tracking-wider text-muted mb-3">Video Credits</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < (user?.credits_remaining ?? 0) ? "bg-accent" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted">
                    {user?.credits_remaining ?? 0} remaining
                  </span>
                </div>
                {(user?.credits_remaining ?? 0) > 0 ? (
                  <Link href="/survey" className="block mt-4">
                    <Button size="sm" variant="secondary" className="w-full">
                      + New Video
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-muted mt-3">
                    You&apos;ve used all your free credits. More coming soon.
                  </p>
                )}
              </Card>

              {/* Quick stats */}
              {pledges.length > 0 && (
                <Card>
                  <p className="text-xs uppercase tracking-wider text-muted mb-3">Today</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Completed</span>
                      <span className="font-medium text-success">
                        {todayCompletions.filter(c => c.status === "done").length}/{pledges.length}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-light overflow-hidden">
                      <div
                        className="h-full rounded-full bg-success transition-all"
                        style={{
                          width: `${pledges.length > 0
                            ? (todayCompletions.filter(c => c.status === "done").length / pledges.length) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <NotificationSettings userId={user?.id ?? ""} />
        )}
      </div>
    </div>
  );
}

// Notification preferences component inline
function NotificationSettings({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState({
    morning_reminder_time: "07:00",
    evening_checkin_time: "20:00",
    email_morning_reminder: true,
    email_evening_checkin: true,
    email_weekly_summary: true,
    email_video_ready: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setPrefs((p) => ({ ...p, ...data }));
      });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...prefs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold">Notification Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Morning reminder time</p>
            <p className="text-xs text-muted">Daily habit reminder</p>
          </div>
          <input
            type="time"
            value={prefs.morning_reminder_time}
            onChange={(e) => setPrefs((p) => ({ ...p, morning_reminder_time: e.target.value }))}
            className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Evening check-in time</p>
            <p className="text-xs text-muted">End-of-day reflection</p>
          </div>
          <input
            type="time"
            value={prefs.evening_checkin_time}
            onChange={(e) => setPrefs((p) => ({ ...p, evening_checkin_time: e.target.value }))}
            className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-medium">Email notifications</p>
          {[
            { key: "email_morning_reminder", label: "Morning reminders" },
            { key: "email_evening_checkin", label: "Evening check-ins" },
            { key: "email_weekly_summary", label: "Weekly summary" },
            { key: "email_video_ready", label: "Video ready alerts" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted">{label}</span>
              <button
                onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                  prefs[key as keyof typeof prefs] ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs[key as keyof typeof prefs] ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving} size="sm">
        {saved ? "Saved!" : "Save Settings"}
      </Button>
    </Card>
  );
}
