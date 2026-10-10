"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 1200;

/**
 * Pledging is deliberate on purpose: a press-and-hold, not a tap. Explicit
 * precommitment is what makes the commitment do any work (Rogers et al., 2015).
 */
export function HoldToCommit({
  onCommit,
  label = "Hold to commit",
  committedLabel = "Committed",
  committed = false,
  disabled = false,
}: {
  onCommit: () => void;
  label?: string;
  committedLabel?: string;
  committed?: boolean;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  // Timed off the animation frame's own clock, so the component stays pure.
  const startedAt = useRef<number | null>(null);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  function tick(now: number) {
    if (!holding.current) return;
    if (startedAt.current === null) startedAt.current = now;

    const next = Math.min(1, (now - startedAt.current) / HOLD_MS);
    setProgress(next);

    if (next >= 1) {
      holding.current = false;
      setProgress(0);
      onCommit();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  }

  function start() {
    if (disabled || committed) return;
    holding.current = true;
    startedAt.current = null;
    frame.current = requestAnimationFrame(tick);
  }

  function stop() {
    holding.current = false;
    startedAt.current = null;
    if (frame.current) cancelAnimationFrame(frame.current);
    setProgress(0);
  }

  if (committed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-sm font-medium text-success">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {committedLabel}
      </span>
    );
  }

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      disabled={disabled}
      className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-medium text-accent-light transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
    >
      <span
        className="absolute inset-y-0 left-0 bg-accent/25 transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
        aria-hidden
      />
      <span className="relative">{progress > 0 ? "Keep holding…" : label}</span>
    </button>
  );
}
