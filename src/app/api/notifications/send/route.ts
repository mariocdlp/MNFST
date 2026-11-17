// API: send email notifications via Resend.
// Called by the cron routes for morning nudges, evening check-ins and summaries.
// Every nudge leads with identity, not with the task — that framing is the point.
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Lazy-init to avoid build-time env var requirement
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

// Verify this is an internal/cron call using a secret header
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, email, name, data } = await request.json();
  const resend = getResend();

  try {
    switch (type) {
      case "morning_reminder": {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "IDSHIFT <noreply@idshift.app>",
          to: email,
          subject: `Good morning, ${name}. Time to show up.`,
          html: morningReminderTemplate({ name, ...data }),
        });
        break;
      }
      case "evening_checkin": {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "IDSHIFT <noreply@idshift.app>",
          to: email,
          subject: `How did today go, ${name}?`,
          html: eveningCheckinTemplate({ name, ...data }),
        });
        break;
      }
      case "weekly_summary": {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "IDSHIFT <noreply@idshift.app>",
          to: email,
          subject: `Your week in review, ${name}`,
          html: weeklySummaryTemplate({ name, ...data }),
        });
        break;
      }
      case "welcome": {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "IDSHIFT <noreply@idshift.app>",
          to: email,
          subject: `Welcome to IDSHIFT, ${name}`,
          html: welcomeTemplate({ name }),
        });
        break;
      }
      case "content_ready": {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "IDSHIFT <noreply@idshift.app>",
          to: email,
          subject: `New in your feed, ${name}`,
          html: contentReadyTemplate({ name, count: Number(data?.count ?? 1) }),
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

// ─── Email Templates ───────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0a0a0f;
  color: #f0f0f5;
  padding: 40px 20px;
  margin: 0;
`;

const cardStyle = `
  background: #16161f;
  border: 1px solid #2a2a3a;
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  margin: 0 auto;
`;

const accentStyle = `color: #a78bfa; font-weight: 600;`;
const buttonStyle = `
  display: inline-block;
  background: #7c3aed;
  color: white;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  margin-top: 24px;
`;

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://idshift.app";

function morningReminderTemplate({
  name,
  future_identity,
  daily_habit,
  if_time,
  then_action,
}: {
  name: string;
  future_identity: string;
  daily_habit: string;
  if_time: string;
  then_action: string;
}) {
  return `
    <body style="${baseStyle}">
      <div style="${cardStyle}">
        <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #a78bfa; margin: 0 0 20px;">IDSHIFT</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Good morning, ${name}.</h1>
        <p style="color: #8888a0; margin: 0 0 24px;">A reminder of who you are.</p>
        <p style="font-size: 18px; font-style: italic; border-left: 3px solid #a78bfa; padding-left: 16px; margin: 0 0 24px;">
          &ldquo;${future_identity}&rdquo;
        </p>
        <p style="color: #8888a0; margin: 0 0 8px;">Today&rsquo;s commitment:</p>
        <p style="font-weight: 600; margin: 0 0 12px;">${daily_habit}</p>
        <p style="color: #8888a0; font-size: 14px;">
          If it&rsquo;s <span style="${accentStyle}">${if_time}</span>, you <span style="${accentStyle}">${then_action}</span>. No negotiation.
        </p>
        <a href="${appUrl}/dashboard" style="${buttonStyle}">Open Dashboard</a>
        <p style="color: #8888a0; font-size: 12px; margin-top: 24px;">
          You can update your reminder time in Dashboard → Settings.
        </p>
      </div>
    </body>
  `;
}

function eveningCheckinTemplate({
  name,
  pledges,
}: {
  name: string;
  pledges: { id: string; action_text: string }[];
}) {
  const pledgeItems = pledges
    .map(
      (p) => `<li style="margin-bottom: 8px; color: #8888a0;">${p.action_text}</li>`
    )
    .join("");

  return `
    <body style="${baseStyle}">
      <div style="${cardStyle}">
        <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #a78bfa; margin: 0 0 20px;">IDSHIFT</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">How did today go, ${name}?</h1>
        <p style="color: #8888a0; margin: 0 0 24px;">Take a moment to reflect on your commitments.</p>
        <p style="font-weight: 600; margin: 0 0 12px;">Today&rsquo;s pledges:</p>
        <ul style="margin: 0 0 24px; padding-left: 20px;">${pledgeItems}</ul>
        <a href="${appUrl}/dashboard" style="${buttonStyle}">Log Today&rsquo;s Progress</a>
      </div>
    </body>
  `;
}

function weeklySummaryTemplate({
  name,
  daysCompleted,
  currentStreak,
  longestStreak,
  future_identity,
}: {
  name: string;
  daysCompleted: number;
  currentStreak: number;
  longestStreak: number;
  future_identity: string;
}) {
  return `
    <body style="${baseStyle}">
      <div style="${cardStyle}">
        <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #a78bfa; margin: 0 0 20px;">IDSHIFT — Weekly Summary</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 24px;">Your week in review, ${name}</h1>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="text-align: center; padding: 16px; background: rgba(167,139,250,0.1); border-radius: 12px;">
            <div style="font-size: 32px; font-weight: 700; color: #a78bfa;">${daysCompleted}</div>
            <div style="font-size: 12px; color: #8888a0; margin-top: 4px;">days completed</div>
          </div>
          <div style="text-align: center; padding: 16px; background: rgba(167,139,250,0.1); border-radius: 12px;">
            <div style="font-size: 32px; font-weight: 700; color: #a78bfa;">${currentStreak}</div>
            <div style="font-size: 12px; color: #8888a0; margin-top: 4px;">day streak</div>
          </div>
          <div style="text-align: center; padding: 16px; background: rgba(167,139,250,0.1); border-radius: 12px;">
            <div style="font-size: 32px; font-weight: 700; color: #a78bfa;">${longestStreak}</div>
            <div style="font-size: 12px; color: #8888a0; margin-top: 4px;">personal best</div>
          </div>
        </div>
        <p style="color: #8888a0; margin: 0 0 16px;">
          You showed up <strong style="color: #f0f0f5;">${daysCompleted} out of 7 days</strong> this week. Every day you did, you voted for who you&rsquo;re becoming.
        </p>
        <p style="font-size: 16px; font-style: italic; border-left: 3px solid #a78bfa; padding-left: 16px; margin: 0 0 24px;">
          &ldquo;${future_identity}&rdquo;
        </p>
        <a href="${appUrl}/dashboard" style="${buttonStyle}">Keep Going</a>
      </div>
    </body>
  `;
}

function welcomeTemplate({ name }: { name: string }) {
  return `
    <body style="${baseStyle}">
      <div style="${cardStyle}">
        <p style="font-size: 24px; font-weight: 700; color: #a78bfa; margin: 0 0 24px;">IDSHIFT</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">Welcome, ${name}.</h1>
        <p style="color: #8888a0; margin: 0 0 24px; line-height: 1.6;">
          You&rsquo;ve taken the first step. IDSHIFT is a science-backed tool for becoming the person who has already done it — through a personalized daily feed, custom meditations, and commitments you actually keep.
        </p>
        <p style="color: #8888a0; margin: 0 0 24px; line-height: 1.6;">
          You have <strong style="color: #f0f0f5;">5 free meditation credits</strong> waiting. The intake takes about five minutes, and your feed is built the moment you finish it.
        </p>
        <a href="${appUrl}/survey" style="${buttonStyle}">Start Your Survey</a>
      </div>
    </body>
  `;
}

function contentReadyTemplate({ name, count }: { name: string; count: number }) {
  return `
    <body style="${baseStyle}">
      <div style="${cardStyle}">
        <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #a78bfa; margin: 0 0 20px;">IDSHIFT</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">${count} new ${count === 1 ? "piece" : "pieces"}, ${name}.</h1>
        <p style="color: #8888a0; margin: 0 0 24px; line-height: 1.6;">
          Made from your own answers this morning. A couple of minutes is enough — the point is that you see it, not that you finish it.
        </p>
        <a href="${appUrl}/feed" style="${buttonStyle}">Open your feed</a>
      </div>
    </body>
  `;
}
