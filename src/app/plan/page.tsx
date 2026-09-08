"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { HoldToCommit } from "@/components/ui/hold-to-commit";
import { ACTION_LABELS, ACTION_TYPES, pledgeTextFor } from "@/lib/pledges";
import type { ActionPledge, ActionType, SurveyData } from "@/types";

interface PlanData {
  redirect?: string;
  survey: SurveyData | null;
  pledges: ActionPledge[];
}

async function loadPlan(): Promise<PlanData> {
  const [surveyResponse, pledgeResponse] = await Promise.all([
    fetch("/api/survey"),
    fetch("/api/pledges"),
  ]);

  if (surveyResponse.status === 401) {
    return { redirect: "/auth/login?redirect=/plan", survey: null, pledges: [] };
  }
  if (surveyResponse.status === 404) {
    return { redirect: "/survey", survey: null, pledges: [] };
  }

  const { survey } = await surveyResponse.json();
  const pledges = pledgeResponse.ok ? (await pledgeResponse.json()).pledges : [];

  return { survey: survey?.response_data ?? null, pledges };
}

const RATIONALE: Record<ActionType, string> = {
  daily_habit: "The one thing that, repeated, makes the identity true.",
  if_then_plan: "A time and a trigger. This is the part that makes it automatic.",
  first_step: "Small enough that failing is implausible. Today, not tomorrow.",
};

export default function ActionPlanPage() {
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [pledges, setPledges] = useState<ActionPledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    loadPlan().then((result) => {
      if (!active) return;

      if (result.redirect) {
        router.push(result.redirect);
        return;
      }
      setSurvey(result.survey);
      setPledges(result.pledges);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function commit(actionType: ActionType) {
    setError("");
    const response = await fetch("/api/pledges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Couldn't record that commitment.");
      return;
    }

    const { pledge } = await response.json();
    setPledges((current) => [...current.filter((item) => item.action_type !== actionType), pledge]);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 pt-24">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const pledgedTypes = new Set(pledges.map((pledge) => pledge.action_type));
  const anyPledged = pledgedTypes.size > 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 pb-20 pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Your action plan</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            I am <span className="gradient-text">{survey.future_identity}</span>
          </h1>
          <p className="mt-4 leading-relaxed text-muted">
            {survey.first_name}, this is the shape of it. Content moves the self-image; these three
            move the life. Commit to the ones you mean — you can change them whenever your intake
            changes.
          </p>
        </motion.div>

        {error ? (
          <p className="mt-6 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {ACTION_TYPES.map((actionType, index) => {
            const text = pledgeTextFor(actionType, survey);
            if (!text) return null;

            return (
              <motion.div
                key={actionType}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  {ACTION_LABELS[actionType]}
                </p>
                <p className="mt-2 text-lg font-medium leading-snug">{text}</p>
                <p className="mt-2 text-sm text-muted">{RATIONALE[actionType]}</p>
                <div className="mt-4">
                  <HoldToCommit
                    onCommit={() => commit(actionType)}
                    committed={pledgedTypes.has(actionType)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface-light/30 p-5">
          <p className="text-sm leading-relaxed text-muted">
            Commitments you make out loud get kept more often than the ones you only think about.
            That&apos;s the entire reason this screen asks you to hold the button.
          </p>
          <p className="mt-2 text-xs text-muted/60">
            Precommitment research (Rogers et al., 2015; Ariely &amp; Wertenbroch, 2002)
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/feed"
            className={`flex-1 rounded-xl px-6 py-3.5 text-center font-medium transition-colors ${
              anyPledged
                ? "glow bg-accent text-white hover:bg-accent-dark"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Open your feed
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl border border-border px-6 py-3.5 text-center text-muted transition-colors hover:text-foreground"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
