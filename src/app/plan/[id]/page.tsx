"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ScienceTooltip } from "@/components/ui/science-tooltip";
import type { SurveyData } from "@/types";

export default function ActionPlanPage() {
  const { id: videoId } = useParams();
  const router = useRouter();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [pledges, setPledges] = useState({
    daily_habit: false,
    if_then_plan: false,
    first_step: false,
  });
  const [confirmingPledge, setConfirmingPledge] = useState(false);
  const [pledgeComplete, setPledgeComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: video } = await supabase
        .from("videos")
        .select("*, survey_responses(*)")
        .eq("id", videoId)
        .single();

      if (video?.survey_responses) {
        setSurveyData(video.survey_responses.response_data as SurveyData);
      }
      setLoading(false);
    }
    load();
  }, [videoId]);

  const allPledged = pledges.daily_habit && pledges.if_then_plan && pledges.first_step;

  const handleConfirmPledge = async () => {
    setConfirmingPledge(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !surveyData) return;

      const pledgeItems = [
        { action_type: "daily_habit", action_text: surveyData.daily_habit },
        {
          action_type: "if_then_plan",
          action_text: `If it is ${surveyData.if_time}, then I will ${surveyData.then_action}`,
        },
        { action_type: "first_step", action_text: surveyData.first_step },
      ];

      for (const item of pledgeItems) {
        await supabase.from("action_pledges").insert({
          user_id: user.id,
          video_id: videoId as string,
          action_type: item.action_type,
          action_text: item.action_text,
        });
      }

      setPledgeComplete(true);
    } catch (err) {
      console.error("Pledge error:", err);
    } finally {
      setConfirmingPledge(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Could not load your action plan.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {!pledgeComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold">Your Action Plan</h1>
              <p className="text-muted">
                Vision without action is just a dream. Pledge to these commitments to bridge the gap.
              </p>
            </div>

            {/* Identity Statement */}
            <Card className="text-center py-8">
              <p className="text-xs uppercase tracking-[0.15em] text-accent mb-3">Your Identity Statement</p>
              <p className="text-xl sm:text-2xl font-bold leading-relaxed gradient-text">
                &quot;{surveyData.future_identity}&quot;
              </p>
            </Card>

            {/* Pledge items */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Commitments</h2>

              {/* Daily Habit */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setPledges((p) => ({ ...p, daily_habit: !p.daily_habit }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  pledges.daily_habit
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    pledges.daily_habit ? "border-accent bg-accent" : "border-border"
                  }`}>
                    {pledges.daily_habit && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-accent mb-1">Daily Habit</p>
                    <p className="font-medium">{surveyData.daily_habit}</p>
                    <p className="text-sm text-muted mt-1">I pledge to do this every day</p>
                  </div>
                </div>
              </motion.div>

              {/* If-Then Plan */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setPledges((p) => ({ ...p, if_then_plan: !p.if_then_plan }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  pledges.if_then_plan
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    pledges.if_then_plan ? "border-accent bg-accent" : "border-border"
                  }`}>
                    {pledges.if_then_plan && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-accent mb-1">If-Then Plan</p>
                    <p className="font-medium">
                      If it is <span className="text-accent">{surveyData.if_time}</span>, then I will{" "}
                      <span className="text-accent">{surveyData.then_action}</span>
                    </p>
                    <p className="text-sm text-muted mt-1">No debate. No negotiation.</p>
                  </div>
                </div>
              </motion.div>

              {/* First Step */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setPledges((p) => ({ ...p, first_step: !p.first_step }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  pledges.first_step
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    pledges.first_step ? "border-accent bg-accent" : "border-border"
                  }`}>
                    {pledges.first_step && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-accent mb-1">First Step — Today</p>
                    <p className="font-medium">{surveyData.first_step}</p>
                    <p className="text-sm text-muted mt-1">Not tomorrow. Today.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Confirm pledge */}
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={handleConfirmPledge}
                disabled={!allPledged}
                loading={confirmingPledge}
                className="px-12"
              >
                I Commit to These Actions
              </Button>
              {!allPledged && (
                <p className="text-xs text-muted">Select all three commitments to continue</p>
              )}
            </div>

            <ScienceTooltip
              text="Commitment devices and precommitment strategies increase follow-through (Rogers et al., 2015; Ariely & Wertenbroch, 2002). Public and explicit commitments activate consistency motivation (Cialdini, 2001)."
              citation="Cialdini, R. B. (2001). Influence: Science and Practice."
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto"
            >
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <div>
              <h2 className="text-3xl font-bold">You&apos;re committed</h2>
              <p className="text-muted mt-2 max-w-md mx-auto">
                Your pledges are active. We&apos;ll send you daily reminders and track your progress.
                Every day you show up is a vote for who you&apos;re becoming.
              </p>
            </div>

            <Card className="text-center py-6 max-w-md mx-auto">
              <p className="text-sm text-muted mb-2">Remember:</p>
              <p className="text-lg font-semibold gradient-text">&quot;{surveyData.future_identity}&quot;</p>
            </Card>

            <Button size="lg" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
