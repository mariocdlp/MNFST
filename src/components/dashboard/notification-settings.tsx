"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const EMAIL_TOGGLES = [
  { key: "email_morning_reminder", label: "Morning reminders" },
  { key: "email_evening_checkin", label: "Evening check-ins" },
  { key: "email_weekly_summary", label: "Weekly summary" },
  { key: "email_content_ready", label: "New content ready" },
] as const;

export function NotificationSettings({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState({
    morning_reminder_time: "07:00",
    evening_checkin_time: "20:00",
    email_morning_reminder: true,
    email_evening_checkin: true,
    email_weekly_summary: true,
    email_content_ready: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => {
        if (data) {
          setPrefs((current) => ({
            ...current,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => key in current)
            ),
          }));
        }
      });
  }, [userId]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("notification_preferences").upsert({ user_id: userId, ...prefs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          The morning nudge fires at your if-then time. That specificity is the part that works.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Morning reminder</p>
            <p className="text-xs text-muted">Identity first, then the action</p>
          </div>
          <input
            type="time"
            value={prefs.morning_reminder_time}
            onChange={(event) =>
              setPrefs((current) => ({ ...current, morning_reminder_time: event.target.value }))
            }
            className="rounded-lg border border-border bg-surface-light px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Evening check-in</p>
            <p className="text-xs text-muted">How did today go?</p>
          </div>
          <input
            type="time"
            value={prefs.evening_checkin_time}
            onChange={(event) =>
              setPrefs((current) => ({ ...current, evening_checkin_time: event.target.value }))
            }
            className="rounded-lg border border-border bg-surface-light px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Email</p>
          {EMAIL_TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <button
                onClick={() => setPrefs((current) => ({ ...current, [key]: !current[key] }))}
                aria-pressed={prefs[key]}
                aria-label={label}
                className={`relative h-6 w-10 cursor-pointer rounded-full transition-colors ${
                  prefs[key] ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    prefs[key] ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving} size="sm">
        {saved ? "Saved" : "Save settings"}
      </Button>
    </Card>
  );
}
