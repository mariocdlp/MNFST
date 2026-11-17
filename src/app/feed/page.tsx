"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { FeedCardView, type FeedAction } from "@/components/feed/feed-card";
import type { FeedCard, TimeOfDay } from "@/types";

const SLOTS: { id: TimeOfDay; label: string; blurb: string }[] = [
  { id: "morning", label: "Morning", blurb: "Set the self-image before the day sets it for you." },
  { id: "midday", label: "Midday", blurb: "Rehearse it while the day is pushing back." },
  { id: "evening", label: "Evening", blurb: "Close the day as the person you're becoming." },
];

interface FeedResult {
  redirect?: string;
  cards: FeedCard[];
  preview: boolean;
  error?: string;
}

async function fetchFeed(slot: TimeOfDay): Promise<FeedResult> {
  const response = await fetch(`/api/feed?slot=${slot}`);
  const data = await response.json();

  if (response.status === 401) return { redirect: "/auth/login?redirect=/feed", cards: [], preview: false };
  if (response.status === 409 && data.needsSurvey) return { redirect: "/survey", cards: [], preview: false };
  if (!response.ok) {
    return { cards: [], preview: false, error: data.error ?? "Couldn't load your feed." };
  }

  return { cards: data.cards ?? [], preview: Boolean(data.preview) };
}

function currentSlot(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

export default function FeedPage() {
  const router = useRouter();
  const [slot, setSlot] = useState<TimeOfDay>(currentSlot);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");

  const apply = useCallback(
    (result: FeedResult) => {
      if (result.redirect) {
        router.push(result.redirect);
        return;
      }
      setCards(result.cards);
      setPreview(result.preview);
      setError(result.error ?? "");
      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    let active = true;
    fetchFeed(slot).then((result) => {
      if (active) apply(result);
    });
    return () => {
      active = false;
    };
  }, [slot, apply]);

  const interact = useCallback(async (card: FeedCard, action: FeedAction) => {
    // Optimistic — a save that fails silently is better than a feed that stutters.
    setCards((current) =>
      current.map((item) =>
        item.feed_id === card.feed_id && item.feed_id !== null
          ? {
              ...item,
              viewed: action === "viewed" ? true : item.viewed,
              saved: action === "saved" ? true : action === "unsaved" ? false : item.saved,
              completed: action === "completed" ? true : item.completed,
            }
          : item
      )
    );

    if (!card.feed_id) return;

    await fetch("/api/feed/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedId: card.feed_id, action }),
    });
  }, []);

  async function refresh() {
    setRefreshing(true);
    const response = await fetch("/api/feed/refresh", { method: "POST" });
    const data = await response.json();
    setRefreshing(false);

    if (!response.ok) {
      setError(data.error ?? "Couldn't generate new pieces right now.");
      return;
    }
    apply(await fetchFeed(slot));
  }

  const active = SLOTS.find((item) => item.id === slot)!;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-xl px-4 pb-20 pt-20">
        <header className="mb-5">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            {SLOTS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === slot) return;
                  setLoading(true);
                  setSlot(option.id);
                }}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                  option.id === slot
                    ? "bg-accent/15 font-medium text-accent-light"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{active.blurb}</p>
        </header>

        {preview ? (
          <p className="mb-5 rounded-xl border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
            Preview mode — no Supabase credentials found, so this feed is built from a sample
            profile. Add your env vars to see your own.
          </p>
        ) : null}

        {error ? (
          <p className="mb-5 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</p>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={slot}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {cards.map((card) => (
                <FeedCardView
                  key={`${card.source}:${card.content_id}`}
                  card={card}
                  onInteract={interact}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && !preview ? (
          <div className="mt-8 text-center">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
            >
              {refreshing ? "Making today's pieces…" : "Generate today's personalized pieces"}
            </button>
            <p className="mt-2 text-xs text-muted/60">
              Two or three new pieces a day, written from your own answers.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
