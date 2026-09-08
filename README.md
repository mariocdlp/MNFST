# IDSHIFT

A science-backed identity shift platform. You describe who you're becoming; IDSHIFT builds a
personalized daily feed that moves your self-image, and a pledge system that turns it into
behaviour.

Not a manifestation app. Every piece of content traces to published research — mental rehearsal,
mental contrasting, identity-based habits, implementation intentions, gratitude neuroscience — and
carries a visible benefit tag plus the citation behind it. The methods themselves stay invisible:
users experience the techniques, they don't get a lecture about them.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4 + Framer Motion
- **Supabase** — auth, Postgres with row-level security, storage. Chosen over Firebase for RLS
  (every table is scoped to `auth.uid()`) and first-class SQL for the content/feed model.
- **fal.ai** — the single integrator for every generative model: text (affirmations, reframes),
  image (flux, with likeness via PuLID), video, and speech.
- **Resend** — transactional email for nudges and summaries.

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in what you have
npm run dev
```

With no Supabase credentials the app still runs: `/feed` renders in **preview mode**, building the
curated library against a sample profile so the content system can be worked on without a project
set up. With no `FAL_KEY`, generation falls back to deterministic template content rather than
calling a model — those pieces are marked `mock: true` in `generation_prompt`.

### Database

Run the migrations in the Supabase SQL editor, in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_idshift_content_feed.sql`

Then create two storage buckets: `user-photos` (private) and `generated-content` (public).

### Seeding the content library

The library's canonical copy is `src/lib/content/library.json` — 40 pieces, version-controlled with
the app so the feed needs no database round trip. To mirror it into `public.content_library`:

```bash
npm run seed:content    # upserts via the service role
npm run seed:sql        # regenerates supabase/seed/content_library.sql
```

## How the feed works

```
survey answers ──> personalization ──> feed algorithm ──> resolved cards
                        │                    │
                   library.json      fal.ai generated pieces
```

- **`src/lib/content/personalize.ts`** resolves `{{variables}}` against the user's survey answers.
  Every variable has a fallback that still reads as a complete, identity-first sentence, so a raw
  token never reaches the screen.
- **`src/lib/content/feed.ts`** is the daily rhythm. Morning primes gratitude then identity then the
  if-then trigger; midday runs rehearsal and reframes; evening reflects, calls gratitude back, and
  winds down. Within each slot, pieces score on goal relevance, method fit, personalization density,
  length preference and intensity pacing, with a per-user-per-day jitter so the feed is stable for a
  day and different tomorrow.
- **`src/app/api/feed/route.ts`** builds a slot once per user per day and stores it, so reopening the
  feed doesn't reshuffle it and "what did I see yesterday" stays answerable. Library pieces served in
  the last 7 days are held back.
- **`src/lib/content/meditation-sections.ts`** expands a meditation's declared sections into a timed,
  personalized walkthrough — the six-section protocol, running as instructions when narration audio
  isn't there yet.

## Content model

Each library piece carries a user-facing **benefit tag** ("Rewires self-image"), a **science ref**
shown behind a "Why this works" tap, internal **method tags** (never rendered), goal categories,
intensity, time-of-day affinity and duration. See `src/types/index.ts`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run seed:content` | Upsert `library.json` into Supabase |
| `npm run seed:sql` | Regenerate the SQL seed file |

## Status

Built: intake survey, content library and tagging, personalization, the feed algorithm and all five
card renderers, fal.ai integration with daily personalized generation, the action plan and pledge
system, streaks and tracking, the dashboard.

Next: custom meditation creation (script → TTS → audio assembly, priced in credits), the full
image/video generation pipeline for library pieces, and the scheduled notification layer.
