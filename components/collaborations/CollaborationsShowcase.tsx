"use client";

import React, { useState } from "react";
import { ICollaboration } from "@/types/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animation/Reveal";
import { ExternalLink, Network, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

interface CollaborationsShowcaseProps {
  collaborations?: ICollaboration[];
}

export function CollaborationsShowcase({
  collaborations = [],
}: CollaborationsShowcaseProps) {
  const [activeCollabId, setActiveCollabId] = useState<string>(
    collaborations[0]?.id || ""
  );

  if (collaborations.length === 0) {
    return (
      <div className="w-full py-16">
        <div className="max-w-xl mx-auto p-12 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 text-center space-y-3">
          <Network className="w-8 h-8 text-brand-cyan/60 mx-auto" />
          <h3 className="font-display text-lg font-bold text-typo-white">
            Partnership Network In Coordination
          </h3>
          <p className="font-sans text-sm text-typo-gray">
            Associated organizations, innovation councils, and entrepreneurship initiatives will appear here as collaborations are formally onboarded.
          </p>
        </div>
      </div>
    );
  }

  const selectedCollab =
    collaborations.find((c) => c.id === activeCollabId) || collaborations[0];

  return (
    <div className="w-full space-y-16 py-8">
      {/* Minimal Institutional Showcase (Scalable Array Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Partner Selector Cards */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-brand-cyan block mb-2">
            Recognized Alliances
          </span>

          {collaborations.map((collab, index) => {
            const isSelected = activeCollabId === collab.id;

            return (
              <Reveal key={collab.id} variant="fade-up" delayMs={index * 80}>
                <div
                  tabIndex={0}
                  role="button"
                  onClick={() => setActiveCollabId(collab.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCollabId(collab.id);
                    }
                  }}
                  className={cn(
                    "p-6 sm:p-8 rounded-2xl border transition-all duration-300 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-cyan",
                    isSelected
                      ? "bg-foundation-dark border-brand-cyan/70 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
                      : "bg-foundation-dark/60 border-foundation-slate/80 hover:border-brand-blue/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-foundation-slate/70 border border-brand-blue/40 flex items-center justify-center overflow-hidden">
                      {collab.logoUrl ? (
                        <Image
                          src={collab.logoUrl}
                          alt={collab.partnerName}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <Network className="w-5 h-5 text-brand-cyan" />
                      )}
                    </div>
                    <span className="text-[11px] font-sans text-brand-cyan px-2.5 py-0.5 rounded-full bg-brand-blue/20 border border-brand-blue/30 font-semibold">
                      Associated Organization
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
                    {collab.partnerName}
                  </h3>

                  <p className="font-sans text-xs text-brand-cyan/90 mt-1 uppercase tracking-wider font-semibold">
                    {collab.partnerType}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Right Side: Selected Partner Deep-Dive Spotlight */}
        <div className="lg:col-span-7">
          {selectedCollab && (
            <Reveal variant="fade-in" key={selectedCollab.id}>
              <div className="p-8 sm:p-12 rounded-2xl bg-foundation-dark border border-brand-cyan/40 relative overflow-hidden space-y-8">
                {/* Subtle ambient light corner */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foundation-slate/60 text-xs font-sans font-bold text-brand-cyan uppercase tracking-wider border border-foundation-slate">
                    <Sparkles className="w-3.5 h-3.5" />
                    {selectedCollab.partnerType}
                  </span>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-typo-white leading-tight">
                    {selectedCollab.partnerName}
                  </h2>
                </div>

                <div className="space-y-4 pt-2">
                  <p className="font-sans text-base sm:text-lg text-typo-white/90 leading-relaxed">
                    {selectedCollab.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-foundation-slate/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-sans text-typo-gray">
                    <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                    <span>Selected Collaboration • TKIET</span>
                  </div>

                  {selectedCollab.websiteUrl && (
                    <a
                      href={selectedCollab.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-brand-cyan hover:text-white transition-colors"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
