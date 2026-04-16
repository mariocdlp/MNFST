"use client";

import { useSurveyStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScienceTooltip } from "@/components/ui/science-tooltip";
import type { InnerObstacle } from "@/types";

const obstacleOptions: { value: InnerObstacle; label: string }[] = [
  { value: "fear_of_failure", label: "Fear of failure" },
  { value: "self_doubt", label: "Self-doubt" },
  { value: "procrastination", label: "Procrastination" },
  { value: "lack_of_discipline", label: "Lack of discipline" },
  { value: "fear_of_judgment", label: "Fear of judgment" },
  { value: "perfectionism", label: "Perfectionism" },
  { value: "past_trauma", label: "Past trauma" },
  { value: "overwhelm", label: "Overwhelm" },
  { value: "other", label: "Other (specify)" },
];

export function Step4Obstacles() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What&apos;s in your way?</h2>
        <p className="text-muted mt-1">
          Positive visualization WITHOUT confronting obstacles actually decreases motivation. Let&apos;s be honest about what&apos;s hard.
        </p>
      </div>

      <Select
        label="What's the #1 inner obstacle holding you back?"
        value={surveyData.inner_obstacle}
        onChange={(e) => updateSurvey({ inner_obstacle: e.target.value as InnerObstacle })}
        options={obstacleOptions}
      />

      {surveyData.inner_obstacle === "other" && (
        <Input
          label="Describe your inner obstacle"
          value={surveyData.inner_obstacle_other || ""}
          onChange={(e) => updateSurvey({ inner_obstacle_other: e.target.value })}
          placeholder="What's the main thing holding you back internally?"
        />
      )}

      <Input
        label="What's the #1 external obstacle?"
        value={surveyData.external_obstacle}
        onChange={(e) => updateSurvey({ external_obstacle: e.target.value })}
        placeholder="What real-world challenge stands between you and your goal?"
        hint="e.g., Financial constraints, lack of connections, time pressure"
      />

      <Input
        label="When you think about pursuing this goal, what negative thought comes up most?"
        value={surveyData.limiting_belief}
        onChange={(e) => updateSurvey({ limiting_belief: e.target.value })}
        placeholder="Be honest — e.g., 'I'm not smart enough' or 'People like me don't get that'"
        hint="This is the specific belief your video will help you confront"
      />

      <ScienceTooltip
        text="Psychologist Gabriele Oettingen's 20+ years of research shows that positive visualization WITHOUT confronting obstacles actually decreases motivation. Her WOOP method (Wish, Outcome, Obstacle, Plan) combines dreaming with reality for dramatically better results."
        citation="Oettingen, G. (2012). Future thought and behaviour change. European Review of Social Psychology. | Oettingen, G. (2014). Rethinking Positive Thinking. Current Publishing."
      />
    </div>
  );
}
