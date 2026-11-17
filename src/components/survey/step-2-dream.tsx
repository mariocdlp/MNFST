"use client";

import { useSurveyStore } from "@/lib/store";
import { Textarea } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScienceTooltip } from "@/components/ui/science-tooltip";
import type { GoalCategory, DreamEmotion } from "@/types";

const goalOptions: { value: GoalCategory; label: string }[] = [
  { value: "career_money", label: "Career & Money" },
  { value: "health_fitness", label: "Health & Fitness" },
  { value: "love_relationships", label: "Love & Relationships" },
  { value: "creative_purpose", label: "Creative & Purpose" },
];

const emotionOptions: { value: DreamEmotion; label: string }[] = [
  { value: "joy", label: "Joy" },
  { value: "pride", label: "Pride" },
  { value: "freedom", label: "Freedom" },
  { value: "peace", label: "Peace" },
  { value: "power", label: "Power" },
  { value: "love", label: "Love" },
  { value: "relief", label: "Relief" },
  { value: "excitement", label: "Excitement" },
  { value: "gratitude", label: "Gratitude" },
  { value: "confidence", label: "Confidence" },
];

const timelineOptions = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "3_years", label: "3 years" },
  { value: "5_years", label: "5 years" },
];

export function Step2Dream() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What&apos;s your dream?</h2>
        <p className="text-muted mt-1">The more vivid and specific, the more powerfully your brain responds.</p>
      </div>

      <MultiSelect
        label="What area of life do you most want to transform?"
        options={goalOptions}
        selected={surveyData.goal_categories}
        onChange={(selected) => updateSurvey({ goal_categories: selected })}
        max={3}
      />

      <Textarea
        label="Describe your dream in vivid detail. What does life look like when you've achieved it?"
        value={surveyData.dream_description}
        onChange={(e) => updateSurvey({ dream_description: e.target.value })}
        placeholder="Write as if it already happened. What do you see, hear, feel? Example: I'm running my own design studio with 5 employees. We have a bright loft office downtown. I feel confident presenting to clients and creatively fulfilled every day..."
        rows={5}
      />

      <Input
        label="What does achieving this goal LOOK like? Describe a single scene."
        value={surveyData.dream_scene}
        onChange={(e) => updateSurvey({ dream_scene: e.target.value })}
        placeholder="e.g., I'm standing on stage accepting an award, wearing a navy suit, the crowd is cheering"
        hint="This becomes the primary visual in your dream sequence"
      />

      <MultiSelect
        label="What emotions do you feel when you imagine this?"
        options={emotionOptions}
        selected={surveyData.dream_emotions}
        onChange={(selected) => updateSurvey({ dream_emotions: selected })}
      />

      <Select
        label="When do you want to achieve this?"
        value={surveyData.timeline}
        onChange={(e) => updateSurvey({ timeline: e.target.value as typeof surveyData.timeline })}
        options={timelineOptions}
      />

      <ScienceTooltip
        text="Research by Pascual-Leone et al. (1995) found that vivid mental rehearsal produces the same brain changes as physical practice. The more specific and sensory your description, the more powerfully your brain responds."
        citation="Pascual-Leone, A., et al. (1995). Modulation of muscle responses evoked by transcranial magnetic stimulation during the acquisition of new fine motor skills. Journal of Neurophysiology."
      />
    </div>
  );
}
