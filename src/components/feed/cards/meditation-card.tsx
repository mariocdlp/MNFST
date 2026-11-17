"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { FeedCard, MeditationSectionDetail } from "@/types";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

/**
 * A guided session. If narration audio exists it leads; otherwise the same
 * sections run as a timed walkthrough, one instruction at a time.
 */
export function MeditationCard({ card, onComplete }: { card: FeedCard; onComplete?: () => void }) {
  const sections: MeditationSectionDetail[] = card.content_data.sections_detail ?? [];
  const total = sections.reduce((sum, section) => sum + section.seconds, 0);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const completed = useRef(false);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      const next = elapsedRef.current + 1;
      elapsedRef.current = next;
      setElapsed(next);

      if (total > 0 && next >= total && !completed.current) {
        completed.current = true;
        setRunning(false);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [running, total, onComplete]);

  // Which section the clock is in.
  let cursor = 0;
  let activeIndex = 0;
  for (let i = 0; i < sections.length; i++) {
    if (elapsed < cursor + sections[i].seconds) {
      activeIndex = i;
      break;
    }
    cursor += sections[i].seconds;
    activeIndex = i;
  }

  const active = sections[activeIndex];
  const finished = total > 0 && elapsed >= total;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-light/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{card.content_data.text}</p>
        <span className="shrink-0 font-mono text-xs text-muted">
          {formatTime(total || (card.duration_seconds ?? 0))}
        </span>
      </div>

      {card.content_data.audio_url ? (
        <audio src={card.content_data.audio_url} controls className="w-full" preload="none" />
      ) : null}

      {sections.length > 0 ? (
        <>
          <div className="flex gap-1">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`h-1 flex-1 overflow-hidden rounded-full ${
                  index < activeIndex || finished ? "bg-accent" : "bg-border"
                }`}
              >
                {index === activeIndex && !finished ? (
                  <motion.div
                    className="h-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${((elapsed - cursor) / section.seconds) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="min-h-[5.5rem]">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">
              {finished ? "Done" : active.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {finished
                ? "That's the session. Take the one action while it's still close."
                : running
                  ? active.guidance
                  : sections.map((section) => section.label).join(" → ")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning(!running)}
              disabled={finished}
              className="cursor-pointer rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Pause" : elapsed > 0 ? "Resume" : "Begin"}
            </button>
            {elapsed > 0 ? (
              <button
                onClick={() => {
                  setRunning(false);
                  elapsedRef.current = 0;
                  setElapsed(0);
                  completed.current = false;
                }}
                className="cursor-pointer text-sm text-muted transition-colors hover:text-foreground"
              >
                Reset
              </button>
            ) : null}
            <span className="ml-auto font-mono text-xs text-muted">
              {formatTime(Math.min(elapsed, total))}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
