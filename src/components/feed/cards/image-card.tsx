"use client";

import type { FeedCard } from "@/types";
import { MediaFrame } from "../media-frame";

export function ImageCard({ card }: { card: FeedCard }) {
  const { text, image_url, prompt } = card.content_data;

  return (
    <div className="space-y-3">
      <MediaFrame seed={card.content_id} imageUrl={image_url} alt={text ?? card.title}>
        {text ? (
          <p
            className={`text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl ${
              image_url ? "self-end drop-shadow-lg" : ""
            }`}
          >
            {text}
          </p>
        ) : null}
      </MediaFrame>
      {prompt ? <p className="text-sm leading-relaxed text-muted">{prompt}</p> : null}
    </div>
  );
}
