"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedCard } from "@/types";
import { MediaFrame } from "../media-frame";

export function CarouselCard({ card }: { card: FeedCard }) {
  const slides = card.content_data.slides ?? [];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStart = useRef<number | null>(null);

  if (slides.length === 0) return null;

  const go = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  return (
    <div className="space-y-3">
      <div
        className="relative"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        <MediaFrame seed={`${card.content_id}-${index}`} imageUrl={slides[index].image_url}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={index}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.22 }}
              className="text-balance text-lg font-medium leading-relaxed tracking-tight sm:text-xl"
            >
              {slides[index].text}
            </motion.p>
          </AnimatePresence>
        </MediaFrame>

        {index > 0 ? (
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2 text-white/80 backdrop-blur transition-colors hover:text-white"
          >
            <Chevron className="rotate-90" />
          </button>
        ) : null}
        {index < slides.length - 1 ? (
          <button
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-2 text-white/80 backdrop-blur transition-colors hover:text-white"
          >
            <Chevron className="-rotate-90" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, slideIndex) => (
          <button
            key={slideIndex}
            onClick={() => go(slideIndex)}
            aria-label={`Slide ${slideIndex + 1}`}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${
              slideIndex === index ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-muted"
            }`}
          />
        ))}
      </div>

      {card.content_data.prompt ? (
        <p className="text-sm leading-relaxed text-muted">{card.content_data.prompt}</p>
      ) : null}
    </div>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
