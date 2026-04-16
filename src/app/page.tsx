"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const scienceSections = [
  {
    title: "Mental Rehearsal",
    desc: "Vivid visualization produces the same neural changes as physical practice.",
    citation: "Pascual-Leone et al., 1995",
  },
  {
    title: "Mental Contrasting",
    desc: "Combining dreams with obstacle awareness dramatically increases follow-through.",
    citation: "Oettingen, WOOP Method, 2012",
  },
  {
    title: "Identity-Based Habits",
    desc: "Every action is a vote for the type of person you wish to become.",
    citation: "James Clear, Atomic Habits, 2018",
  },
  {
    title: "Implementation Intentions",
    desc: "Specific if-then plans increase goal attainment by 65%.",
    citation: "Gollwitzer, 1999 — meta-analysis, d=.65",
  },
];

const steps = [
  { num: "01", title: "Tell us your dream", desc: "A guided intake captures your goals, identity, and vision in vivid detail." },
  { num: "02", title: "We create your video", desc: "AI generates a personalized 4-minute cinematic experience with you as the main character." },
  { num: "03", title: "Pledge & track", desc: "Commit to daily actions derived from your goals. We remind you and track your streak." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl breathing" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl breathing" style={{ animationDelay: "2.5s" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-sm uppercase tracking-[0.2em] text-accent mb-6"
          >
            Science-backed manifestation
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
          >
            See your future.
            <br />
            <span className="gradient-text">Build it today.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed"
          >
            MNFST creates a personalized AI video where you&apos;re the main character — achieving your dream, confronting obstacles, and stepping into your future identity.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-xl bg-accent hover:bg-accent-dark text-white text-lg font-medium transition-colors glow"
            >
              Create Your Video
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-border text-muted hover:text-foreground hover:border-accent/50 text-lg transition-colors"
            >
              Learn More
            </a>
          </motion.div>

          <motion.p
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-sm text-muted/60"
          >
            3 free videos. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
          >
            How it works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-surface border border-border"
              >
                <span className="text-5xl font-bold text-accent/20">{step.num}</span>
                <h3 className="text-xl font-semibold mt-3">{step.title}</h3>
                <p className="text-muted mt-2 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Science section */}
      <section className="py-24 px-4 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              Built on <span className="gradient-text">real science</span>
            </h2>
            <p className="mt-4 text-muted max-w-2xl mx-auto">
              Every feature traces back to peer-reviewed research. This isn&apos;t generic self-help — it&apos;s a structured protocol.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {scienceSections.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-surface border border-border"
              >
                <h3 className="text-lg font-semibold text-accent">{item.title}</h3>
                <p className="text-muted mt-2">{item.desc}</p>
                <p className="text-xs text-muted/50 mt-3">{item.citation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video protocol section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              Your 4-minute protocol
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">
              Six scientifically structured phases take you from relaxation through visualization to committed action.
            </p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {[
              { phase: "Alpha Induction", time: "0:00", desc: "Binaural beats guide your brain into a receptive alpha state" },
              { phase: "Gratitude Priming", time: "0:35", desc: "Activate your brain's reward circuitry through specific appreciation" },
              { phase: "Dream Realized", time: "1:05", desc: "See yourself achieving your goal — you're the main character" },
              { phase: "Mental Contrasting", time: "2:05", desc: "Honestly confront obstacles to supercharge motivation" },
              { phase: "Identity & Action", time: "2:35", desc: "Declare who you're becoming and watch yourself build habits" },
              { phase: "Integration", time: "3:40", desc: "Anchor your vision and commit to your first step today" },
            ].map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 text-left p-4 rounded-xl hover:bg-surface/50 transition-colors"
              >
                <span className="text-xs text-accent font-mono mt-1 w-10 shrink-0">{phase.time}</span>
                <div>
                  <h4 className="font-semibold">{phase.phase}</h4>
                  <p className="text-sm text-muted mt-0.5">{phase.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to meet your future self?
            </h2>
            <p className="mt-4 text-muted">
              It takes 5 minutes to tell us your dream. We&apos;ll show you the path.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block mt-8 px-8 py-4 rounded-xl bg-accent hover:bg-accent-dark text-white text-lg font-medium transition-colors glow"
            >
              Start Your Journey
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted">MNFST — Science-backed manifestation</span>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
