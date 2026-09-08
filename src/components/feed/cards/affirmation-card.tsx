"use client";

import type { FeedCard } from "@/types";
import { MediaFrame } from "../media-frame";

export function AffirmationCard({ card }: { card: FeedCard }) {
  const { affirmation, text } = card.content_data;

  return (
    <div className="space-y-3">
      <MediaFrame seed={card.content_id} className="aspect-square">
        <p className="text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {affirmation}
        </p>
      </MediaFrame>
      {text ? <p className="text-sm leading-relaxed text-muted">{text}</p> : null}
    </div>
  );
}
