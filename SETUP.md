# Setting up IDSHIFT — plain English

You need two outside services. Supabase stores accounts and data. fal.ai runs the
AI models. Both have free tiers, though fal charges per generation once you start
making real images and video.

Set aside about 20 minutes. Nothing here can break anything.

---

## Part 1 — Supabase (accounts and database)

**1.** Go to **https://supabase.com** and click *Start your project*. Sign in with
GitHub or an email address.

**2.** Click **New project**.

- Name: `idshift`
- Database Password: click *Generate a password*, then **copy it somewhere safe**
  (a password manager, or a note). You won't need it for the app, but you'll want
  it one day and it is not shown again.
- Region: pick the one closest to you.

Click **Create new project** and wait. It takes about two minutes.

**3.** In the left sidebar click **SQL Editor**, then **New query**.

**4.** Open the file `supabase/setup/all_in_one.sql` from this project. Select all
of it, copy it, paste it into the big empty box, and click **Run** (bottom right,
or Ctrl/Cmd+Enter).

You should see *Success. No rows returned.* If you see a red error instead, just
click **Run** again — this file is built to be safe to run twice.

**5.** Check it worked. Sidebar → **Table Editor**. You should see a list of
tables. Click **content_library** — it should have **40 rows** in it. That's the
content the app serves.

**6.** Now collect three values. Sidebar → **Project Settings** (the gear icon)
→ **API**.

| What to look for | What it looks like |
|---|---|
| Project URL | `https://abcdefgh.supabase.co` |
| `anon` `public` key | a very long string starting `eyJ...` |
| `service_role` key | another long `eyJ...` string, hidden behind *Reveal* |

Copy all three somewhere safe for a moment. **The `service_role` key is a master
key** — it can read and change every user's data. Treat it like a password: never
put it in a chat message, an email, or a screenshot.

Supabase sometimes rearranges this page and may call it *API Keys* instead. If
what you see doesn't match the table above, tell me what the page shows and I'll
point you at the right spot.

**7.** While you're here, make test accounts easier. Sidebar →
**Authentication** → **Sign In / Providers**. *Email* should already be on. Turn
**off** *Confirm email*, so you can make throwaway test accounts without clicking
a confirmation link each time. Turn it back on before real people use the app.

---

## Part 2 — fal.ai (the AI models)

**1.** Go to **https://fal.ai** and sign up.

**2.** Go to **https://fal.ai/dashboard/keys** (or: your account menu, top right
→ *API Keys*).

**3.** Click **Add key**. Leave the scope at its default. **Copy the key now** —
it is shown once and never again.

**4.** fal is pay-as-you-go. Under **Billing**, add a payment method, otherwise
the app will get a "payment required" error the first time it tries to generate
anything. Rough costs: a fraction of a cent per affirmation, a cent or two per
image, more for video.

You can skip Part 2 entirely for now if you want. Without a fal key the app still
works end to end — it fills generated slots with template-built content instead of
calling a model, and marks it internally so nothing fake is ever presented as
AI-generated.

---

## Part 3 — Give me the keys (without pasting them in chat)

In this session's title bar there's a **cloud environment** menu. Open it and
choose **Edit**. Add each of these as a secret / environment variable, using these
exact names:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from step 6 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key |
| `FAL_KEY` | your fal key (skip if you skipped Part 2) |
| `CRON_SECRET` | any long random string — see below |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

For `CRON_SECRET` you can use this, which I generated for you — it is just a
password that stops strangers triggering the scheduled jobs:

```
a0616d9f7d5b33c79eb3cc9f5a7b85bc1d4d6fa93e7dbfcd
```

You do **not** need `RESEND_API_KEY` or `EMAIL_FROM` yet. Those are for the
notification emails, which aren't built.

Then **start a new session** and tell me the keys are in. Secrets are picked up
when a session starts, so this one can't see them.

---

## Part 4 — What I'll do once the keys are in

- Sign up a test account against your real project and confirm the signup gives it
  a profile, a streak record, notification settings and 5 credits.
- Walk the 6-step survey, check the answers land in the database.
- Load all three feed slots and confirm the day's pieces are stored and not
  repeated.
- Make a pledge, complete it, confirm the streak maths.
- If `FAL_KEY` is set: generate one real affirmation and one real image, and show
  you what came back.
- Report anything that breaks, with screenshots.

---

## Part 5 — Putting it online (later)

That's Vercel, and it's a separate job. I'd rather confirm everything works
against your real database first, because a bad deploy is harder to debug than a
bad local run.

---

## Already verified, without any credentials

So you know what's actually been checked rather than assumed:

- `supabase/setup/all_in_one.sql` was run against a real PostgreSQL 16 database
  twice in a row, cleanly, seeding all 40 content pieces both times.
- The credit system was exercised: 5 credits spend down to 0, the sixth attempt
  is refused rather than going negative, and a rejected spend leaves the balance
  untouched instead of quietly eating a credit.
- User isolation was tested by querying as one signed-in user: they see their own
  profile and their own feed and credit history, cannot see another user's,
  cannot write a row owned by someone else, and cannot edit the shared content
  library — while still being able to read all 40 pieces of it.
- The feed table rejects a malformed row and refuses to serve the same piece
  twice in one slot on the same day.

What is still untested is Supabase's own hosted behaviour — real sign-ups, real
sessions, storage uploads — and every actual call to a fal model. That's what
Part 4 is for.
