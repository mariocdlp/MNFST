"use client";

import { useSurveyStore } from "@/lib/store";
import { motion } from "framer-motion";
import type { VisualMood, VoicePreference, MusicEnergy } from "@/types";

const vibes: { value: VisualMood; name: string; desc: string; colors: string }[] = [
  {
    value: "warm_cinematic",
    name: "Warm & Cinematic",
    desc: "Golden tones, soft light, emotional strings + piano. Aspirational and tender.",
    colors: "from-amber-900/30 to-orange-900/30 border-amber-700/30",
  },
  {
    value: "clean_modern",
    name: "Clean & Modern",
    desc: "Cool tones, crisp edges, electronic/ambient. Professional and focused.",
    colors: "from-blue-900/30 to-cyan-900/30 border-blue-700/30",
  },
  {
    value: "dark_dramatic",
    name: "Dark & Dramatic",
    desc: "Deep contrast, moody lighting, powerful orchestral/bass. Intense and driven.",
    colors: "from-purple-900/30 to-slate-900/30 border-purple-700/30",
  },
];

const voiceOptions: { value: VoicePreference; label: string }[] = [
  { value: "male", label: "Male voice" },
  { value: "female", label: "Female voice" },
  { value: "none", label: "No narration (music + visuals only)" },
];

const musicOptions: { value: MusicEnergy; label: string; desc: string }[] = [
  { value: "calm_ambient", label: "Calm & Ambient", desc: "Peaceful, meditative" },
  { value: "uplifting_emotional", label: "Uplifting & Emotional", desc: "Inspiring, warm" },
  { value: "powerful_driving", label: "Powerful & Driving", desc: "Intense, motivating" },
];

export function Step6Preferences() {
  const { surveyData, updateSurvey } = useSurveyStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Customize your experience</h2>
        <p className="text-muted mt-1">Choose the visual and audio mood for your video.</p>
      </div>

      {/* Visual mood / vibe selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Visual mood</label>
        <div className="space-y-3">
          {vibes.map((vibe) => (
            <motion.button
              key={vibe.value}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => updateSurvey({ visual_mood: vibe.value })}
              className={`
                w-full text-left p-5 rounded-2xl border-2 transition-all cursor-pointer
                bg-gradient-to-r ${vibe.colors}
                ${surveyData.visual_mood === vibe.value
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border hover:border-accent/30"}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{vibe.name}</h3>
                  <p className="text-sm text-muted mt-0.5">{vibe.desc}</p>
                </div>
                {surveyData.visual_mood === vibe.value && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Voice preference */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Narration voice</label>
        <div className="flex flex-wrap gap-2">
          {voiceOptions.map((opt) => (
            <motion.button
              key={opt.value}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => updateSurvey({ voice_pref: opt.value })}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                ${surveyData.voice_pref === opt.value
                  ? "bg-accent text-white border border-accent"
                  : "bg-surface-light text-muted border border-border hover:border-accent/50"}
              `}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Music energy */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">Background music energy</label>
        <div className="space-y-2">
          {musicOptions.map((opt) => (
            <motion.button
              key={opt.value}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => updateSurvey({ music_energy: opt.value })}
              className={`
                w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer
                ${surveyData.music_energy === opt.value
                  ? "bg-accent/10 border-accent text-foreground"
                  : "bg-surface-light border-border text-muted hover:border-accent/30"}
              `}
            >
              <span className="font-medium">{opt.label}</span>
              <span className="text-xs text-muted ml-2">— {opt.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
