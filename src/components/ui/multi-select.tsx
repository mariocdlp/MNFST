"use client";

import { motion } from "framer-motion";

interface MultiSelectProps<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  max?: number;
  error?: string;
}

export function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  max,
  error,
}: MultiSelectProps<T>) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else if (!max || selected.length < max) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggle(opt.value)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? "bg-accent text-white border border-accent"
                    : "bg-surface-light text-muted border border-border hover:border-accent/50 hover:text-foreground"
                }
              `}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      {max && (
        <p className="text-xs text-muted">
          {selected.length}/{max} selected
        </p>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
