"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/progress";
import { useSurveyStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Step1Identity } from "@/components/survey/step-1-identity";
import { Step2Dream } from "@/components/survey/step-2-dream";
import { Step3Gratitude } from "@/components/survey/step-3-gratitude";
import { Step4Obstacles } from "@/components/survey/step-4-obstacles";
import { Step5Implementation } from "@/components/survey/step-5-implementation";
import { Step6Preferences } from "@/components/survey/step-6-preferences";

const stepLabels = [
  "Identity",
  "Dream",
  "Gratitude",
  "Obstacles",
  "Action",
  "Preferences",
];

// Validation per step — returns error message or null
function validateStep(step: number, data: ReturnType<typeof useSurveyStore.getState>): string | null {
  const { surveyData, uploadedPhotos } = data;
  switch (step) {
    case 1:
      if (!surveyData.first_name.trim()) return "Please enter your first name";
      if (uploadedPhotos.length < 3) return "Please upload at least 3 photos";
      if (!surveyData.current_identity.trim()) return "Please describe yourself";
      if (!surveyData.occupation.trim()) return "Please enter your occupation";
      return null;
    case 2:
      if (surveyData.goal_categories.length === 0) return "Please select at least one goal area";
      if (!surveyData.dream_description.trim()) return "Please describe your dream";
      if (!surveyData.dream_scene.trim()) return "Please describe your dream scene";
      if (surveyData.dream_emotions.length === 0) return "Please select at least one emotion";
      return null;
    case 3:
      if (!surveyData.gratitude_personal_1.trim()) return "Please enter at least your first gratitude";
      if (!surveyData.gratitude_personal_2.trim()) return "Please enter your second gratitude";
      if (!surveyData.gratitude_personal_3.trim()) return "Please enter your third gratitude";
      if (!surveyData.gratitude_self.trim()) return "Please enter something you appreciate about yourself";
      return null;
    case 4:
      if (!surveyData.external_obstacle.trim()) return "Please describe your external obstacle";
      if (!surveyData.limiting_belief.trim()) return "Please share your limiting belief";
      return null;
    case 5:
      if (!surveyData.future_identity.trim()) return "Please describe who you need to become";
      if (!surveyData.daily_habit.trim()) return "Please enter your daily habit";
      if (!surveyData.first_step.trim()) return "Please enter your first step";
      if (!surveyData.if_time.trim() || !surveyData.then_action.trim())
        return "Please complete your if-then plan";
      if (!surveyData.ideal_routine.trim()) return "Please describe your ideal routine";
      return null;
    case 6:
      return null; // Preferences have defaults
    default:
      return null;
  }
}

export default function SurveyPage() {
  const router = useRouter();
  const { currentStep, nextStep, prevStep, surveyData } = useSurveyStore();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    const storeState = useSurveyStore.getState();
    const validationError = validateStep(currentStep, storeState);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    nextStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth/login?redirect=/survey");
        return;
      }

      // Photos first — the generation pipeline needs a likeness reference, but a
      // failed upload shouldn't cost the user their answers.
      const storeState = useSurveyStore.getState();
      const photoUrls: string[] = [];
      for (const photo of storeState.uploadedPhotos) {
        const ext = photo.name.split(".").pop();
        const path = `${authUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("user-photos").upload(path, photo);

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Could not save your answers");
      }

      for (let i = 0; i < photoUrls.length; i++) {
        const photoType = i === 0 ? "face_front" : i === 1 ? "face_angle" : "full_body";
        await supabase.from("user_photos").insert({
          user_id: authUser.id,
          photo_url: photoUrls[i],
          photo_type: photoType,
        });
      }

      // Personalized pieces are generated in the background; the action plan is
      // the next thing the user should see.
      fetch("/api/feed/refresh", { method: "POST" }).catch(() => {});

      router.push("/plan");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const steps: Record<number, React.ReactNode> = {
    1: <Step1Identity />,
    2: <Step2Dream />,
    3: <Step3Gratitude />,
    4: <Step4Obstacles />,
    5: <Step5Implementation />,
    6: <Step6Preferences />,
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Progress */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <StepIndicator totalSteps={6} currentStep={currentStep} />
          <p className="text-sm text-muted">
            Step {currentStep} of 6: <span className="text-foreground">{stepLabels[currentStep - 1]}</span>
          </p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-error bg-error/10 p-3 rounded-xl text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              prevStep();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < 6 ? (
            <Button onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              Build my feed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
