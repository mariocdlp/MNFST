"use client";

import type { FeedCard } from "@/types";
import { MediaFrame } from "../media-frame";

/**
 * When the clip exists, it plays. When it doesn't yet, the piece still works as
 * a visualization: the scene held on screen, in the user's own words, with a
 * slow drift. Mental rehearsal doesn't require footage.
 */
export function VideoCard({ card }: { card: FeedCard }) {
  const { text, video_url, image_url, prompt } = card.content_data;

  if (video_url) {
    return (
      <div className="space-y-3">
        <video
          src={video_url}
          poster={image_url}
          controls
          playsInline
          preload="metadata"
          className="aspect-[4/5] w-full rounded-xl bg-black object-cover"
        />
        {prompt ? <p className="text-sm leading-relaxed text-muted">{prompt}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MediaFrame seed={card.content_id} imageUrl={image_url} alt={card.title} animate>
        <div className="space-y-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">Visualization</span>
          <p className="text-balance text-xl font-medium leading-relaxed tracking-tight sm:text-2xl">
            {text}
          </p>
        </div>
      </MediaFrame>
      {prompt ? <p className="text-sm leading-relaxed text-muted">{prompt}</p> : null}
    </div>
  );
}
