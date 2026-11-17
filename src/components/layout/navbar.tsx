"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

export function Navbar() {
  const router = useRouter();
  const { user, unreadCount } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { notifications, markNotificationRead } = useAppStore();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().setUser(null);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text tracking-tight">IDSHIFT</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/feed"
                  className="hidden px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground sm:inline"
                >
                  Feed
                </Link>
                {/* Notifications bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl bg-surface border border-border shadow-xl"
                      >
                        <div className="p-3 border-b border-border">
                          <h3 className="text-sm font-semibold">Notifications</h3>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="p-4 text-sm text-muted text-center">No notifications yet</div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                markNotificationRead(n.id);
                                fetch("/api/notifications", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: n.id }),
                                });
                              }}
                              className={`w-full text-left p-3 border-b border-border/50 hover:bg-surface-light transition-colors cursor-pointer ${
                                !n.is_read ? "bg-accent/5" : ""
                              }`}
                            >
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-muted mt-0.5">{n.content}</p>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-muted hidden sm:inline">{user.name || user.email}</span>
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-12 w-48 rounded-xl bg-surface border border-border shadow-xl py-1"
                      >
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-surface-light transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard?tab=settings"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-surface-light transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          Settings
                        </Link>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-light transition-colors cursor-pointer"
                        >
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-dark text-white rounded-xl transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
