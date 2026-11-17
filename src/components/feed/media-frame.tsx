"use client";

import Image from "next/image";
import type { ReactNode } from "react";

// Library pieces ship without artwork — the generated ones bring their own. A
// piece with no image renders as a typographic panel with a gradient derived
// from its id, so the feed looks composed rather than half-loaded.
const GRADIENTS = [
  "from-violet-600/30 via-indigo-700/20 to-slate-900",
  "from-amber-500/25 via-orange-700/15 to-slate-900",
  "from-teal-500/25 via-cyan-700/15 to-slate-900",
  "from-rose-500/25 via-purple-700/20 to-slate-900",
  "from-sky-500/25 via-blue-800/20 to-slate-900",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

interface MediaFrameProps {
  seed: string;
  imageUrl?: string;
  alt?: string;
  children?: ReactNode;
  /** Slow drift, for pieces meant to be looked at rather than read. */
  animate?: boolean;
  className?: string;
}

export function MediaFrame({
  seed,
  imageUrl,
  alt = "",
  children,
  animate = false,
  className = "",
}: MediaFrameProps) {
  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${gradientFor(seed)} ${className}`}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className={`object-cover ${animate ? "scale-105 animate-[breathe_12s_ease-in-out_infinite]" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </>
      ) : null}

      {children ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center p-6 text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
