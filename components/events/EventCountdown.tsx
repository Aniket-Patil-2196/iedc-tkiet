"use client";

import React, { useState, useEffect } from "react";
import { Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  targetUtcIso: string | null;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isHappeningNow: boolean;
}

export function EventCountdown({ targetUtcIso, className }: EventCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    setMounted(true);

    if (!targetUtcIso) return;
    const targetMs = new Date(targetUtcIso).getTime();
    if (isNaN(targetMs)) return;

    const calculate = () => {
      const nowMs = Date.now();
      const diff = targetMs - nowMs;

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isHappeningNow: true,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isHappeningNow: false,
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);

    return () => clearInterval(timer);
  }, [targetUtcIso]);

  if (!targetUtcIso) return null;

  // Hydration-safe placeholder matching the exact box structure
  if (!mounted || !timeRemaining) {
    return (
      <div className={cn("space-y-1.5 select-none", className)}>
        <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-typo-gray flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-brand-cyan" />
          <span>Launch Countdown</span>
        </span>
        <div className="flex items-center gap-2">
          {["Days", "Hours", "Mins", "Secs"].map((label) => (
            <div
              key={label}
              className="flex flex-col items-center bg-foundation-dark/80 border border-foundation-slate/60 px-2.5 sm:px-3 py-1.5 rounded-lg min-w-[50px] sm:min-w-[56px]"
            >
              <span className="font-display font-bold text-base sm:text-lg text-typo-white/30 tabular-nums">
                --
              </span>
              <span className="text-[9px] font-mono tracking-wider text-typo-gray/60 uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // When start time has arrived / passed
  if (timeRemaining.isHappeningNow) {
    return (
      <div className={cn("space-y-1.5 select-none", className)}>
        <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-typo-gray flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-brand-cyan" />
          <span>Status</span>
        </span>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="uppercase tracking-wider">Happening Now</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5 select-none", className)}>
      <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-typo-gray flex items-center gap-1.5">
        <Radio className="w-3 h-3 text-brand-cyan animate-pulse" />
        <span>Countdown to Launch</span>
      </span>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <TimeUnit value={timeRemaining.days} label="Days" />
        <span className="text-brand-cyan font-bold text-sm">:</span>
        <TimeUnit value={timeRemaining.hours} label="Hours" />
        <span className="text-brand-cyan font-bold text-sm">:</span>
        <TimeUnit value={timeRemaining.minutes} label="Mins" />
        <span className="text-brand-cyan font-bold text-sm">:</span>
        <TimeUnit value={timeRemaining.seconds} label="Secs" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-foundation-dark/80 border border-foundation-slate/70 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg min-w-[48px] sm:min-w-[54px] shadow-sm">
      <span className="font-display font-bold text-base sm:text-lg text-typo-white tabular-nums leading-tight">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] sm:text-[9px] font-mono tracking-wider text-typo-gray uppercase mt-0.5">
        {label}
      </span>
    </div>
  );
}
