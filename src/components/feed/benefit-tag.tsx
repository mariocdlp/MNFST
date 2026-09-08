"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The benefit is always visible; the citation is one tap away. Science as
 * credibility, not clutter.
 */
export function BenefitTag({ benefit, scienceRef }: { benefit: string; scienceRef: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-light">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {benefit}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="cursor-pointer text-xs text-muted transition-colors hover:text-foreground"
          aria-expanded={open}
        >
          Why this works
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-xs leading-relaxed text-muted"
          >
            <span className="mt-2 block border-l-2 border-border pl-3">{scienceRef}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
