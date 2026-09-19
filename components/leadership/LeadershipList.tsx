"use client";

import React, { useState } from "react";
import { ILeadershipMessage } from "@/types/content";
import { cn } from "@/lib/utils";
import { Quote, ChevronDown, User, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/animation/Reveal";
import Image from "next/image";

interface LeadershipListProps {
  messages?: ILeadershipMessage[];
}

export function LeadershipList({ messages = [] }: LeadershipListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    messages[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (messages.length === 0) {
    return (
      <div className="w-full py-12">
        <div className="max-w-xl mx-auto p-12 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 text-center space-y-3">
          <ShieldCheck className="w-8 h-8 text-brand-cyan/60 mx-auto" />
          <h3 className="font-display text-lg font-bold text-typo-white">
            Leadership Statements In Review
          </h3>
          <p className="font-sans text-sm text-typo-gray">
            Institutional leadership perspectives and coordinator messages will be published here upon council confirmation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 my-8">
      {messages.map((leader, index) => {
        const isExpanded = expandedId === leader.id;

        return (
          <Reveal key={leader.id} variant="fade-up" delayMs={index * 60}>
            <article
              className={cn(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                isExpanded
                  ? "bg-foundation-dark border-brand-cyan/60 shadow-[0_0_30px_rgba(56,189,248,0.1)]"
                  : "bg-foundation-dark/60 border-foundation-slate/80 hover:border-brand-blue/50"
              )}
            >
              {/* Header Bar / Summary Strip */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleExpand(leader.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(leader.id);
                  }
                }}
                className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-cyan/80 rounded-2xl"
              >
                {/* Portrait Monogram & Role Identity */}
                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-foundation-slate/80 border border-foundation-slate flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-brand-cyan transition-colors">
                    {leader.avatarUrl ? (
                      <Image
                        src={leader.avatarUrl}
                        alt={leader.leaderName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-brand-cyan/70" />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-blue/30 border border-brand-cyan/60 flex items-center justify-center text-[10px] font-bold text-brand-cyan">
                      0{index + 1}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-brand-cyan block mb-1">
                      {leader.leaderName}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
                      {leader.designation}
                    </h3>
                    <p className="font-sans text-xs text-typo-gray mt-0.5">
                      {leader.institution}
                    </p>
                  </div>
                </div>

                {/* Right summary quote & toggle trigger */}
                <div className="flex items-center justify-between md:justify-end gap-4 md:max-w-md">
                  <p className="font-sans text-xs sm:text-sm text-typo-gray line-clamp-2 italic text-left md:text-right hidden sm:block">
                    &ldquo;{leader.message.slice(0, 110)}...&rdquo;
                  </p>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-sans text-brand-cyan hidden md:inline">
                      {isExpanded ? "Collapse" : "Full Message"}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center text-typo-white">
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          isExpanded && "rotate-180 text-brand-cyan"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Full Message Body */}
              {isExpanded && (
                <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-foundation-slate/50 animate-in fade-in duration-200">
                  <div className="max-w-4xl space-y-4 pt-4">
                    <div className="flex items-start gap-3">
                      <Quote className="w-6 h-6 text-brand-cyan shrink-0 mt-1" />
                      <p className="font-sans text-base sm:text-lg text-typo-white leading-relaxed">
                        {leader.message}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center gap-2 text-xs font-sans text-typo-gray">
                      <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                      <span>
                        Verified Institutional Message • TKIET Leadership
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
