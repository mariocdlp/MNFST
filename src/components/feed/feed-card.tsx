"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { FeedCard } from "@/types";
import { BenefitTag } from "./benefit-tag";
import { AffirmationCard } from "./cards/affirmation-card";
import { CarouselCard } from "./cards/carousel-card";
import { ImageCard } from "./cards/image-card";
import { MeditationCard } from "./cards/meditation-card";
import { VideoCard } from "./cards/video-card";

export type FeedAction = "viewed" | "saved" | "unsaved" | "completed";

interface FeedCardViewProps {
  card: FeedCard;
  onInteract: (card: FeedCard, action: FeedAction) => void;
}

export function FeedCardView({ card, onInteract }: FeedCardViewProps) {
  const ref = useRef<HTMLElement>(null);
  const reported = useRef(card.viewed);

  // A card counts as seen once it has been half on screen for a second.
  useEffect(() => {
    const node = ref.current;
    if (!node || reported.current) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reported.current) {
          timer = setTimeout(() => {
            reported.current = true;
            onInteract(card, "viewed");
            observer.disconnect();
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [card, onInteract]);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold leading-tight">{card.title}</h2>
          {card.duration_seconds ? (
            <p className="mt-0.5 text-xs text-muted">
              {card.duration_seconds < 60
                ? `${card.duration_seconds} sec`
                : `${Math.round(card.duration_seconds / 60)} min`}
            </p>
          ) : null}
        </div>
        <button
          onClick={() => onInteract(card, card.saved ? "unsaved" : "saved")}
          aria-label={card.saved ? "Remove from saved" : "Save"}
          aria-pressed={card.saved}
          className={`shrink-0 cursor-pointer rounded-lg p-2 transition-colors ${
            card.saved ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={card.saved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </header>

      <CardBody card={card} onInteract={onInteract} />

      <footer className="flex items-end justify-between gap-3">
        <BenefitTag benefit={card.benefit_tag} scienceRef={card.science_ref} />
        {card.source === "generated" ? (
          <span className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-muted/60">
            Made for you
          </span>
        ) : null}
      </footer>
    </motion.article>
  );
}

function CardBody({ card, onInteract }: FeedCardViewProps) {
  switch (card.type) {
    case "affirmation":
      return <AffirmationCard card={card} />;
    case "carousel":
      return <CarouselCard card={card} />;
    case "video":
      return <VideoCard card={card} />;
    case "meditation":
      return <MeditationCard card={card} onComplete={() => onInteract(card, "completed")} />;
    case "image":
    default:
      return <ImageCard card={card} />;
  }
}
