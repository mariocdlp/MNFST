"use client";

import { useSurveyStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { ScienceTooltip } from "@/components/ui/science-tooltip";

export function Step3Gratitude() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What are you grateful for?</h2>
        <p className="text-muted mt-1">
          Gratitude before visualization creates a neurochemical foundation of abundance rather than lack.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">
          Name 3 things in your personal life you&apos;re genuinely grateful for right now.
        </p>

        <Input
          value={surveyData.gratitude_personal_1}
          onChange={(e) => updateSurvey({ gratitude_personal_1: e.target.value })}
          placeholder="e.g., My supportive partner who believes in me"
        />

        <Input
          value={surveyData.gratitude_personal_2}
          onChange={(e) => updateSurvey({ gratitude_personal_2: e.target.value })}
          placeholder="e.g., My health and energy to pursue this"
        />

        <Input
          value={surveyData.gratitude_personal_3}
          onChange={(e) => updateSurvey({ gratitude_personal_3: e.target.value })}
          placeholder="e.g., The skills I've built over the last few years"
        />
      </div>

      <Input
        label="Name 1 thing about YOURSELF you appreciate."
        value={surveyData.gratitude_self}
        onChange={(e) => updateSurvey({ gratitude_self: e.target.value })}
        placeholder="e.g., My persistence — I keep going even when it's hard"
        hint="This becomes a self-appreciation anchor in your content"
      />

      <ScienceTooltip
        text="Gratitude activates the brain's reward circuitry — the same dopamine and serotonin pathways targeted by antidepressant medications (Zahn et al., 2008). Practicing gratitude before visualization creates a neurochemical foundation of abundance rather than lack."
        citation="Zahn, R., et al. (2008). The neural basis of human social values. Cerebral Cortex. | Emmons, R. A., & McCullough, M. E. (2003). Counting blessings versus burdens. Journal of Personality and Social Psychology."
      />
    </div>
  );
}
