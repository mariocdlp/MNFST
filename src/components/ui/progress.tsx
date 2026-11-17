"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  shimmer?: boolean;
}

export function ProgressBar({ value, className = "", showLabel = false, shimmer = false }: ProgressBarProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-surface-light overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${shimmer ? "progress-shimmer" : "bg-accent"}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                backgroundColor: isComplete
                  ? "var(--accent)"
                  : isActive
                  ? "var(--accent-dark)"
                  : "var(--surface-light)",
              }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                border transition-colors
                ${isComplete ? "border-accent text-white" : ""}
                ${isActive ? "border-accent text-white" : ""}
                ${!isComplete && !isActive ? "border-border text-muted" : ""}
              `}
            >
              {isComplete ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </motion.div>
            {step < totalSteps && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors ${
                  isComplete ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
