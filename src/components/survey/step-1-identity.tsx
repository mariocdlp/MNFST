"use client";

import { useSurveyStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PhotoUpload } from "./photo-upload";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function Step1Identity() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Who are you?</h2>
        <p className="text-muted mt-1">Let&apos;s start with the basics. Every answer shapes what shows up in your feed.</p>
      </div>

      <Input
        label="First name"
        value={surveyData.first_name}
        onChange={(e) => updateSurvey({ first_name: e.target.value })}
        placeholder="Your first name"
        hint="Used throughout your content and meditations"
      />

      <PhotoUpload />

      <Input
        label="How would you describe yourself today in one sentence?"
        value={surveyData.current_identity}
        onChange={(e) => updateSurvey({ current_identity: e.target.value })}
        placeholder="e.g., I'm a hard-working developer trying to find my creative voice"
        maxLength={150}
        hint={`${surveyData.current_identity.length}/150 characters`}
      />

      <Input
        label="What do you do for work or school?"
        value={surveyData.occupation}
        onChange={(e) => updateSurvey({ occupation: e.target.value })}
        placeholder="e.g., Software engineer, college student, freelance writer"
        hint="Helps us set scenes that look like your actual life"
      />

      <Select
        label="Gender"
        value={surveyData.gender}
        onChange={(e) => updateSurvey({ gender: e.target.value as typeof surveyData.gender })}
        options={genderOptions}
      />
    </div>
  );
}
