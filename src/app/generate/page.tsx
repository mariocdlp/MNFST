"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { ProgressBar } from "@/components/ui/progress";

const scienceFacts = [
  {
    phase: "Preparing your alpha induction sequence",
    fact: "Binaural beats at 10 Hz can help your brain enter an alpha state — the same state achieved during meditation, associated with creativity and reduced anxiety.",
    citation: "Wahbeh et al., 2007",
  },
  {
    phase: "Building your gratitude sequence",
    fact: "Practicing gratitude for just 5 minutes activates the brain's reward circuitry — the same dopamine and serotonin pathways targeted by many antidepressant medications.",
    citation: "Zahn et al., 2008",
  },
  {
    phase: "Creating your dream scenario",
    fact: "When you vividly imagine performing an action, the same neural pathways activate as when you physically do it. Your brain literally cannot tell the difference.",
    citation: "Pascual-Leone et al., 1995",
  },
  {
    phase: "Rendering your obstacle confrontation",
    fact: "People who only visualize success are LESS likely to achieve their goals. Mental contrasting — imagining obstacles too — increases effort and achievement dramatically.",
    citation: "Oettingen, 2012",
  },
  {
    phase: "Generating your identity & action sequence",
    fact: "Specific if-then plans ('When X happens, I will do Y') increase goal completion rates by 65% compared to motivation alone — across 94 independent studies.",
    citation: "Gollwitzer, 1999 — meta-analysis",
  },
  {
    phase: "Assembling your final video",
    fact: "Every time you repeat a behavior, you're casting a vote for the type of person you wish to become. Identity change is the root of lasting habit change.",
    citation: "James Clear, Atomic Habits, 2018",
  },
];

type VideoStatus = "queued" | "generating" | "completed" | "failed";

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [status, setStatus] = useState<VideoStatus>("queued");
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const progressRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Trigger generation on mount
  useEffect(() => {
    if (!videoId) return;

    fetch("/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }, [videoId]);

  // Smooth progress animation (visual only — doesn't reflect real progress)
  useEffect(() => {
    let p = 0;
    progressRef.current = setInterval(() => {
      // Slow down as we approach 90% — wait for real completion signal
      const remaining = 90 - p;
      const step = Math.max(0.3, remaining * 0.02);
      p = Math.min(p + step, 90);
      setProgress(p);
      setFactIndex(Math.min(Math.floor((p / 90) * scienceFacts.length), scienceFacts.length - 1));
    }, 600);

    return () => { if (progressRef.current !== undefined) clearInterval(progressRef.current); };
  }, []);

  // Poll video status every 5 seconds
  useEffect(() => {
    if (!videoId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/generate?videoId=${videoId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "completed") {
          if (pollingRef.current !== undefined) clearInterval(pollingRef.current);
          if (progressRef.current !== undefined) clearInterval(progressRef.current);
          setProgress(100);
          setTimeout(() => router.push(`/watch/${videoId}`), 1800);
        } else if (data.status === "failed") {
          if (pollingRef.current !== undefined) clearInterval(pollingRef.current);
          if (progressRef.current !== undefined) clearInterval(progressRef.current);
        }
      } catch {
        // Network error — keep trying
      }
    }, 5000);

    return () => { if (pollingRef.current !== undefined) clearInterval(pollingRef.current); };
  }, [videoId, router]);

  const isComplete = status === "completed" || progress >= 100;
  const isFailed = status === "failed";
  const currentFact = scienceFacts[factIndex];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Ambient orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-40 h-40 rounded-full bg-accent/15 blur-3xl mb-8 pointer-events-none"
        />

        <AnimatePresence mode="wait">
          {isFailed ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Generation failed</h2>
              <p className="text-muted text-sm">Something went wrong. Please try again.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-accent hover:text-accent-light text-sm transition-colors cursor-pointer"
              >
                Return to dashboard
              </button>
            </motion.div>
          ) : !isComplete ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-center space-y-8"
            >
              <div>
                <h1 className="text-2xl font-bold">Creating your video</h1>
                <p className="text-muted mt-2">
                  {status === "queued" ? "Starting your generation..." : "This usually takes a few minutes. Stay with us."}
                </p>
              </div>

              <div className="space-y-3">
                <ProgressBar value={progress} shimmer showLabel />
                <p className="text-sm text-accent font-medium">
                  {currentFact.phase}...
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={factIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 rounded-2xl bg-surface border border-border text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-foreground leading-relaxed">{currentFact.fact}</p>
                      <p className="text-xs text-muted/50 mt-2">{currentFact.citation}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2">
                {scienceFacts.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i <= factIndex ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto"
              >
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold">Your video is ready</h2>
              <p className="text-muted">Preparing your immersive experience...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
