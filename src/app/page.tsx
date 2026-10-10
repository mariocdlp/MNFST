"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const steps = [
  {
    num: "01",
    title: "Tell us who you're becoming",
    desc: "A six-step intake: the life, the scene, what's in the way, and the one habit that changes it.",
  },
  {
    num: "02",
    title: "Open your feed",
    desc: "Images, carousels, meditations and affirmations — chosen for your goals and the time of day, written in your own words.",
  },
  {
    num: "03",
    title: "Commit, and keep the count",
    desc: "Pledge to your daily action, get nudged at your own trigger time, and watch the streak build.",
  },
];

const science = [
  {
    title: "Mental rehearsal",
    desc: "Imagined practice produced the same cortical change as physical practice in a five-day study.",
    citation: "Pascual-Leone et al., 1995",
  },
  {
    title: "Mental contrasting",
    desc: "Positive visualization alone lowers follow-through. Pairing it with the obstacle is what restores it.",
    citation: "Oettingen, 2012",
  },
  {
    title: "Identity-based habits",
    desc: "Behaviour follows self-image. Every action is a vote for the type of person you're becoming.",
    citation: "Clear, 2018",
  },
  {
    title: "Implementation intentions",
    desc: "If-then plans raised goal attainment with a medium-to-large effect across 94 studies.",
    citation: "Gollwitzer, 1999 — d = .65",
  },
];

const benefits = [
  "Rewires self-image",
  "Builds neural pathways",
  "Strengthens daily habits",
  "Activates reward circuitry",
  "Reframes limiting beliefs",
  "Strengthens implementation intentions",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="breathing absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          <div
            className="breathing absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"
            style={{ animationDelay: "2.5s" }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-6 text-sm uppercase tracking-[0.2em] text-accent"
          >
            Science-backed identity shift
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          >
            Become the person
            <br />
            <span className="gradient-text">who already did it.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
          >
            IDSHIFT builds you a daily feed that moves your self-image — and a pledge system that
            turns it into behaviour. Every piece is tagged with what it does for you, and why the
            research says it works.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/auth/signup"
              className="glow rounded-xl bg-accent px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-accent-dark"
            >
              Start your shift
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-border px-8 py-4 text-lg text-muted transition-colors hover:border-accent/50 hover:text-foreground"
            >
              How it works
            </a>
          </motion.div>

          <motion.p
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-sm text-muted/60"
          >
            Free to start. No card required.
          </motion.p>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center text-3xl font-bold sm:text-4xl"
          >
            How it works
          </motion.h2>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="rounded-2xl border border-border bg-surface p-8"
              >
                <span className="text-5xl font-bold text-accent/20">{step.num}</span>
                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface/50 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              Built on <span className="gradient-text">real research</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              This isn&apos;t manifestation. Every feature traces to a published finding, and every
              piece of content tells you which one.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {science.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-semibold text-accent">{item.title}</h3>
                <p className="mt-2 text-muted">{item.desc}</p>
                <p className="mt-3 text-xs text-muted/50">{item.citation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold sm:text-4xl">Every piece tells you what it does</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              No mystique, no method names to memorize. Just the benefit on the card and the
              citation one tap away.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {benefits.map((benefit, index) => (
              <motion.span
                key={benefit}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-full bg-accent/10 px-4 py-2 text-sm text-accent-light"
              >
                {benefit}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Who do you need to become?
            </h2>
            <p className="mt-4 text-muted">
              Five minutes of honest answers, and your feed is waiting.
            </p>
            <Link
              href="/auth/signup"
              className="glow mt-8 inline-block rounded-xl bg-accent px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-accent-dark"
            >
              Begin
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-muted">IDSHIFT — science-backed identity shift</span>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/auth/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/auth/signup" className="transition-colors hover:text-foreground">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
