"use client";

import React, { useState } from "react";
import { IJourneyMilestone } from "@/types/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animation/Reveal";
import { Sparkles, Milestone } from "lucide-react";

interface JourneyRoadProps {
  milestones?: IJourneyMilestone[];
}

export function JourneyRoad({ milestones = [] }: JourneyRoadProps) {
  const [activeMilestone, setActiveMilestone] = useState<number>(0);

  if (milestones.length === 0) {
    return (
      <div className="w-full py-16">
        <div className="max-w-xl mx-auto p-12 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 text-center space-y-3">
          <Milestone className="w-8 h-8 text-brand-cyan/60 mx-auto" />
          <h3 className="font-display text-lg font-bold text-typo-white">
            Milestones In Documentation
          </h3>
          <p className="font-sans text-sm text-typo-gray">
            The historical timeline and pre-incubation milestones of the cell are currently being compiled into the official archive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-8 md:py-16">
      {/* Desktop Curved Path Layout */}
      <div className="hidden md:block relative max-w-5xl mx-auto">
        {/* Central Abstract Winding Path SVG */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-32 pointer-events-none z-0">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background guide path */}
            <path
              d="M 50 0 C 15 150, 85 250, 50 400 C 15 550, 85 700, 50 850 L 50 1000"
              stroke="#151B26"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Subtle illuminated inner core line */}
            <path
              d="M 50 0 C 15 150, 85 250, 50 400 C 15 550, 85 700, 50 850 L 50 1000"
              stroke="url(#journey-glow)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="journey-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Alternating Milestone Cards */}
        <div className="relative z-10 space-y-24 py-12">
          {milestones.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center w-full",
                  isEven ? "justify-start pr-[52%]" : "justify-end pl-[52%]"
                )}
                onMouseEnter={() => setActiveMilestone(index)}
              >
                <Reveal
                  variant={isEven ? "slide-left" : "slide-right"}
                  delayMs={index * 80}
                  className="w-full"
                >
                  <div
                    className={cn(
                      "relative p-8 rounded-2xl bg-foundation-dark border transition-all duration-300 group",
                      activeMilestone === index
                        ? "border-brand-cyan/60 shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                        : "border-foundation-slate/80 hover:border-brand-blue/50"
                    )}
                  >
                    {/* Road Connector Dot towards center */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foundation-darkest border-2 transition-all duration-300",
                        activeMilestone === index
                          ? "border-brand-cyan shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-125 bg-brand-cyan"
                          : "border-foundation-slate group-hover:border-brand-blue",
                        isEven ? "-right-8" : "-left-8"
                      )}
                    />

                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-slate/60 text-xs font-sans font-bold text-brand-cyan uppercase tracking-wider border border-foundation-slate">
                        <Sparkles className="w-3 h-3" />
                        {item.year}
                      </span>
                      <span className="text-[11px] font-sans text-typo-gray uppercase tracking-widest">
                        Milestone 0{index + 1}
                      </span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white group-hover:text-brand-cyan transition-colors mb-2">
                      {item.title}
                    </h3>

                    <p className="font-sans text-sm font-medium text-typo-white/90 mb-3">
                      {item.summary}
                    </p>

                    <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-foundation-slate/50 text-[11px] font-sans text-brand-cyan/70">
                      Institutional Milestone • IEDC TKIET
                    </div>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Streamlined Vertical Road */}
      <div className="block md:hidden relative pl-6 border-l-2 border-foundation-slate/80 ml-4 space-y-10 my-6">
        {milestones.map((item, index) => (
          <div key={item.id} className="relative group">
            {/* Glowing Milestone Node */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-foundation-darkest border-2 border-brand-cyan shadow-[0_0_10px_rgba(56,189,248,0.5)]" />

            <div className="p-6 rounded-xl bg-foundation-dark border border-foundation-slate/80 space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded bg-brand-blue/20 text-brand-cyan text-xs font-sans font-bold uppercase tracking-wider">
                {item.year}
              </span>

              <h3 className="font-display text-lg font-bold text-typo-white">
                {item.title}
              </h3>

              <p className="font-sans text-xs text-typo-white font-medium">
                {item.summary}
              </p>

              <p className="font-sans text-xs text-typo-gray leading-relaxed pt-1">
                {item.description}
              </p>

              <div className="pt-2 text-[10px] font-sans text-brand-cyan/70">
                Institutional Milestone • IEDC TKIET
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
