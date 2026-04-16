"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Section markers for the 6-phase protocol (timestamps in seconds)
const sections = [
  { id: "induction", name: "Induction", start: 0, end: 35 },
  { id: "gratitude", name: "Gratitude", start: 35, end: 65 },
  { id: "dream", name: "Dream Realized", start: 65, end: 125 },
  { id: "contrast", name: "Mental Contrasting", start: 125, end: 155 },
  { id: "action", name: "Identity & Action", start: 155, end: 220 },
  { id: "integration", name: "Integration", start: 220, end: 250 },
];

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(250);
  const [hasWatchedOnce, setHasWatchedOnce] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentSection = sections.find(
    (s) => currentTime >= s.start && currentTime < s.end
  );

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setHasWatchedOnce(true);
    setShowEndScreen(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasWatchedOnce) return; // No seeking on first watch
      const time = Number(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [hasWatchedOnce]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current !== undefined) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current !== undefined) clearTimeout(controlsTimeout.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      <div className="relative w-full max-w-5xl aspect-video">
        {/* Video element — placeholder for demo */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration || 250);
            }}
            playsInline
          >
            {/* Video source will be set from the database video URL */}
            <source src="" type="video/mp4" />
          </video>

          {/* Demo placeholder overlay (shown when no real video) */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/5 to-purple-900/10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto breathing">
                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-muted text-sm">Your personalized video will appear here</p>
              <p className="text-muted/50 text-xs">Connect Vertex AI to generate real videos</p>
            </div>
          </div>
        </div>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-between"
            >
              {/* Top bar — section indicator */}
              <div className="p-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentSection && (
                      <span className="text-xs text-accent font-medium px-2 py-1 rounded-lg bg-accent/10">
                        {currentSection.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Center — play button */}
              <div className="flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Bottom bar — progress + controls */}
              <div className="p-4 bg-gradient-to-t from-black/60 to-transparent space-y-3">
                {/* Section dots */}
                <div className="flex justify-center gap-1.5">
                  {sections.map((s) => (
                    <div
                      key={s.id}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        currentSection?.id === s.id ? "bg-accent" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60 font-mono w-10">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <div className="h-1 rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {hasWatchedOnce && (
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    )}
                  </div>
                  <span className="text-xs text-white/60 font-mono w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    {!hasWatchedOnce && "Complete your first watch to unlock controls"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={isFullscreen
                            ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                            : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End screen */}
        <AnimatePresence>
          {showEndScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-6 p-8"
              >
                <h2 className="text-2xl font-bold text-white">Your vision is set</h2>
                <p className="text-white/60 max-w-sm">
                  Now it&apos;s time to turn vision into action. Let&apos;s create your plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => router.push(`/plan/${id}`)}>
                    Create My Action Plan
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEndScreen(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }}
                  >
                    Watch Again
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
