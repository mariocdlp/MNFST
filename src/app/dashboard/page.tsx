"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { format, isToday, subDays } from "date-fns";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { ACTION_LABELS } from "@/lib/pledges";
import type { ActionPledge, CompletionStatus, FeedCard, Streak, SurveyData } from "@/types";

type Tab = "today" | "saved" | "settings";

interface DayCell {
  date: Date;
  complete: boolean;
  partial: boolean;
}

interface DashboardData {
  redirect?: string;
  survey: SurveyData | null;
  streak: Streak | null;
  pledges: ActionPledge[];
  today: Record<string, CompletionStatus>;
  week: DayCell[];
  saved: FeedCard[];
}

function emptyWeek(): DayCell[] {
  return Array.from({ length: 7 }, (_, index) => ({
    date: subDays(new Date(), 6 - index),
    complete: false,
    partial: false,
  }));
}

async function loadDashboard(): Promise<DashboardData> {
  const empty: DashboardData = {
    survey: null,
    streak: null,
    pledges: [],
    today: {},
    week: emptyWeek(),
    saved: [],
  };

  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return empty;

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const [{ data: surveyRow }, { data: pledgeRows }, { data: streakRow }] = await Promise.all([
    supabase
      .from("survey_responses")
      .select("response_data")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("action_pledges")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("is_active", true)
      .order("pledged_at", { ascending: true }),
    supabase.from("streaks").select("*").eq("user_id", authUser.id).maybeSingle(),
  ]);

  if (!surveyRow) return { ...empty, redirect: "/survey" };

  const pledges = (pledgeRows ?? []) as ActionPledge[];
  const result: DashboardData = {
    ...empty,
    survey: surveyRow.response_data as SurveyData,
    streak: streakRow as Streak | null,
    pledges,
  };

  if (pledges.length > 0) {
    const pledgeIds = pledges.map((pledge) => pledge.id);
    const { data: completions } = await supabase
      .from("action_completions")
      .select("pledge_id, date, status")
      .in("pledge_id", pledgeIds)
      .gte("date", weekStart);

    const rows = (completions ?? []) as {
      pledge_id: string;
      date: string;
      status: CompletionStatus;
    }[];

    result.today = Object.fromEntries(
      rows.filter((row) => row.date === todayKey).map((row) => [row.pledge_id, row.status])
    );

    result.week = emptyWeek().map((cell) => {
      const key = format(cell.date, "yyyy-MM-dd");
      const onDay = rows.filter((row) => row.date === key);
      const done = onDay.filter((row) => row.status === "done").length;
      return { ...cell, complete: done >= pledgeIds.length, partial: onDay.length > 0 && done < pledgeIds.length };
    });
  }

  const savedResponse = await fetch("/api/feed/saved");
  if (savedResponse.ok) {
    result.saved = (await savedResponse.json()).cards;
  }

  return result;
}

export default function DashboardPage() {
  // useSearchParams needs a boundary: the shell renders while the tab resolves.
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-24">
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((state) => state.user);

  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "today");
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [pledges, setPledges] = useState<ActionPledge[]>([]);
  const [today, setToday] = useState<Record<string, CompletionStatus>>({});
  const [week, setWeek] = useState<DayCell[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [saved, setSaved] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadDashboard().then((result) => {
      if (!active) return;
      if (result.redirect) {
        router.push(result.redirect);
        return;
      }
      setSurvey(result.survey);
      setStreak(result.streak);
      setPledges(result.pledges);
      setToday(result.today);
      setWeek(result.week);
      setSaved(result.saved);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);


  async function mark(pledgeId: string, status: CompletionStatus) {
    setToday((current) => ({ ...current, [pledgeId]: status }));

    const response = await fetch("/api/actions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pledgeId, status }),
    });

    if (response.ok) {
      const { streak: current, longest } = await response.json();
      setStreak((existing) => ({
        user_id: existing?.user_id ?? "",
        current_streak: current,
        longest_streak: longest,
        last_completion_date: format(new Date(), "yyyy-MM-dd"),
      }));
      setWeek((current7) =>
        current7.map((cell) => (isToday(cell.date) ? { ...cell, partial: true } : cell))
      );
    }
  }

  if (loading) return <DashboardSkeleton />;

  const savedMeditations = saved.filter((card) => card.type === "meditation");
  const doneToday = pledges.filter((pledge) => today[pledge.id] === "done").length;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-20">
        {/* Identity statement — always first, always present tense */}
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted">
            {survey?.first_name ? `Morning, ${survey.first_name}.` : "Welcome back."}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            I am <span className="gradient-text">{survey?.future_identity}</span>
          </h1>
        </motion.header>

        <nav className="mt-6 flex gap-1 rounded-xl border border-border bg-surface p-1">
          {(["today", "saved", "settings"] as Tab[]).map((option) => (
            <button
              key={option}
              onClick={() => setTab(option)}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm capitalize transition-colors ${
                option === tab
                  ? "bg-accent/15 font-medium text-accent-light"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </nav>

        {tab === "today" ? (
          <div className="mt-6 space-y-4">
            {/* Streak + week */}
            <Card className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Current streak</p>
                <p className="mt-1 text-4xl font-bold">
                  {streak?.current_streak ?? 0}
                  <span className="ml-2 text-base font-normal text-muted">
                    {(streak?.current_streak ?? 0) === 1 ? "day" : "days"}
                  </span>
                </p>
                {streak?.longest_streak ? (
                  <p className="mt-1 text-xs text-muted">Longest: {streak.longest_streak} days</p>
                ) : null}
              </div>

              <div className="flex gap-1.5">
                {week.map((cell) => (
                  <div key={cell.date.toISOString()} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] uppercase text-muted/60">
                      {format(cell.date, "EEEEE")}
                    </span>
                    <div
                      title={format(cell.date, "MMM d")}
                      className={`h-8 w-8 rounded-lg border ${
                        cell.complete
                          ? "border-accent bg-accent"
                          : cell.partial
                            ? "border-accent/40 bg-accent/20"
                            : "border-border bg-surface-light"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Today's actions */}
            <Card className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Today</h2>
                {pledges.length > 0 ? (
                  <span className="text-sm text-muted">
                    {doneToday} of {pledges.length}
                  </span>
                ) : null}
              </div>

              {pledges.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Nothing committed yet. Content moves the self-image; the pledge is what moves
                    the week.
                  </p>
                  <Link
                    href="/plan"
                    className="inline-block rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                  >
                    Set your action plan
                  </Link>
                </div>
              ) : (
                pledges.map((pledge) => {
                  const status = today[pledge.id];
                  return (
                    <div
                      key={pledge.id}
                      className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                          {ACTION_LABELS[pledge.action_type]}
                        </p>
                        <p className="mt-1 leading-snug">{pledge.action_text}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {(["done", "partial", "skipped"] as CompletionStatus[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => mark(pledge.id, option)}
                            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                              status === option
                                ? option === "done"
                                  ? "border-success bg-success/15 text-success"
                                  : "border-accent/50 bg-accent/10 text-accent-light"
                                : "border-border text-muted hover:text-foreground"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </Card>

            {/* Feed entry */}
            <Link href="/feed" className="block">
              <Card hover className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Your feed is ready</h2>
                  <p className="mt-1 text-sm text-muted">
                    Today&apos;s pieces, chosen for where you are and what time it is.
                  </p>
                </div>
                <span className="text-2xl text-accent">→</span>
              </Card>
            </Link>

            {/* Meditations + credits */}
            <Card className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Meditations</h2>
                <span className="text-sm text-muted">
                  {user?.credits_remaining ?? 0} credits left
                </span>
              </div>

              {savedMeditations.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing saved yet. Save a session from your feed and it lands here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {savedMeditations.map((card) => (
                    <li
                      key={card.content_id}
                      className="flex items-center justify-between rounded-xl border border-border p-3"
                    >
                      <span className="text-sm">{card.title}</span>
                      <span className="text-xs text-muted">
                        {Math.round((card.duration_seconds ?? 0) / 60)} min
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                disabled
                title="Custom meditation creation is coming next"
                className="w-full cursor-not-allowed rounded-xl border border-border px-4 py-2.5 text-sm text-muted opacity-60"
              >
                Create a custom meditation — coming soon
              </button>
            </Card>
          </div>
        ) : null}

        {tab === "saved" ? (
          <div className="mt-6">
            {saved.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">
                  Nothing saved yet. Tap the bookmark on any piece in your feed.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {saved.map((card) => (
                  <Card key={`${card.source}:${card.content_id}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium leading-snug">{card.title}</h3>
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-muted/60">
                        {card.type}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {card.content_data.affirmation ??
                        card.content_data.text ??
                        card.content_data.slides?.[0]?.text}
                    </p>
                    <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs text-accent-light">
                      {card.benefit_tag}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="mt-6">
            <NotificationSettings userId={user?.id ?? ""} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
