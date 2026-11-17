"use client";

import { useSurveyStore } from "@/lib/store";
import { Input, Textarea } from "@/components/ui/input";
import { ScienceTooltip } from "@/components/ui/science-tooltip";

export function Step5Implementation() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What will you do?</h2>
        <p className="text-muted mt-1">
          Lasting change comes from identity shifts, not just behavior goals. Let&apos;s define who you&apos;re becoming.
        </p>
      </div>

      <Textarea
        label="Who do you need to BECOME to achieve this goal? Describe that person."
        value={surveyData.future_identity}
        onChange={(e) => updateSurvey({ future_identity: e.target.value })}
        placeholder="Not what you need to DO — who you need to BE. Example: 'I am someone who shows up every day, even when it's hard. I trust my creativity and share my work without apologizing.'"
        rows={3}
        hint="This becomes your identity statement — your personal mantra"
      />

      <Input
        label="What's ONE daily habit that would move you toward this goal?"
        value={surveyData.daily_habit}
        onChange={(e) => updateSurvey({ daily_habit: e.target.value })}
        placeholder="e.g., Write for 30 minutes every morning"
        hint="This becomes the core of your daily pledge"
      />

      <Input
        label="What's the very first step you can take TODAY?"
        value={surveyData.first_step}
        onChange={(e) => updateSurvey({ first_step: e.target.value })}
        placeholder="Make it tiny. e.g., Open a blank document and write one sentence"
        hint="Small enough that there's no excuse not to do it"
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Complete this sentence: &quot;If it is [TIME], then I will [ACTION].&quot;
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={surveyData.if_time}
            onChange={(e) => updateSurvey({ if_time: e.target.value })}
            placeholder="e.g., 7:00 AM"
          />
          <Input
            value={surveyData.then_action}
            onChange={(e) => updateSurvey({ then_action: e.target.value })}
            placeholder="e.g., sit down and write"
          />
        </div>
        <p className="text-xs text-muted">
          If it is <span className="text-accent">{surveyData.if_time || "___"}</span>, then I will{" "}
          <span className="text-accent">{surveyData.then_action || "___"}</span>.
        </p>
      </div>

      <Textarea
        label="What does your ideal daily routine look like when you're living as this person?"
        value={surveyData.ideal_routine}
        onChange={(e) => updateSurvey({ ideal_routine: e.target.value })}
        placeholder="Walk me through a day — morning to night. e.g., I wake up at 6:30, meditate for 10 minutes, then write for an hour before breakfast..."
        rows={4}
        hint="This becomes your daily pledge and your morning nudge"
      />

      <ScienceTooltip
        text="James Clear's research shows lasting change comes from identity shifts, not behavior goals. 'Every action is a vote for the type of person you wish to become.' Peter Gollwitzer's meta-analysis of 94 studies found that specific if-then plans increase goal attainment by a medium-to-large effect size (d=.65)."
        citation="Clear, J. (2018). Atomic Habits. | Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist."
      />
    </div>
  );
}
