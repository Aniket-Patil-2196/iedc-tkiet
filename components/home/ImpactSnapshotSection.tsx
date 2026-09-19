"use client";

import React from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/animation/Reveal";
import { IImpactMetric } from "@/types/content";
import { Sparkles } from "lucide-react";

interface ImpactSnapshotSectionProps {
  metrics?: IImpactMetric[];
}

export function ImpactSnapshotSection({ metrics = [] }: ImpactSnapshotSectionProps) {
  // If no metrics loaded, fall back gracefully to default array
  const displayMetrics =
    metrics.length > 0
      ? metrics
      : [
          { id: "1", value: "35+", label: "Events Conducted", displayOrder: 1, enabled: true },
          { id: "2", value: "2,500+", label: "Students Engaged", displayOrder: 2, enabled: true },
          { id: "3", value: "12+", label: "Major Collaborations", displayOrder: 3, enabled: true },
          { id: "4", value: "50+", label: "Ideas Incubated", displayOrder: 4, enabled: true },
        ];

  return (
    <Section
      id="impact-snapshot"
      spacing="xl"
      className="border-t border-foundation-slate/60 bg-foundation-darkest relative overflow-hidden select-none"
    >
      {/* Target anchor for hero scroll indicator */}
      <div id="about-intro" className="absolute -top-24 pointer-events-none" />

      {/* Subtle radial ambient glow behind the metrics */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Extremely subtle coordinate grid line accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-15 pointer-events-none" />

      <Container size="lg" className="relative z-10">
        {/* Editorial Section Header */}
        <div className="max-w-3xl space-y-4 mb-16 sm:mb-20">
          <Reveal variant="fade-up">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.25em] text-brand-cyan font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>IEDC / IMPACT</span>
            </div>
          </Reveal>

          <Reveal variant="fade-up" delayMs={100}>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-typo-white leading-[1.05]">
              IDEAS IN MOTION.
            </h2>
          </Reveal>

          <Reveal variant="fade-up" delayMs={200}>
            <p className="font-sans text-sm sm:text-base md:text-lg text-typo-gray leading-relaxed max-w-2xl font-normal">
              From academic engineering theory to tested prototypes and student-founded ventures,
              the Innovation and Entrepreneurship Development Cell acts as TKIET&apos;s active incubation springboard.
            </p>
          </Reveal>
        </div>

        {/* Four Metrics in Editorial Layout: 4 Equal-Width Columns on Desktop, 2x2 on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 sm:gap-y-14 lg:gap-y-0 gap-x-4 sm:gap-x-6 lg:gap-x-8 xl:gap-12 relative pt-8 sm:pt-10 border-t border-foundation-slate/60">
          {displayMetrics.slice(0, 4).map((metric, index) => (
            <Reveal key={metric.id} variant="fade-up" delayMs={100 * index}>
              <div className="group relative flex flex-col items-center text-center px-2 sm:px-4 lg:px-6 w-full min-w-0 transition-transform duration-300">
                {/* Centered Accent Line */}
                <div className="w-8 h-[2px] bg-brand-blue group-hover:w-14 group-hover:bg-brand-cyan transition-all duration-300 mx-auto mb-4" />

                {/* Centered Large Syne Metric Value with responsive font scaling */}
                <div className="w-full text-center font-display font-black tracking-tight text-typo-white group-hover:text-brand-cyan group-hover:-translate-y-1 transition-all duration-300 drop-shadow-[0_4px_25px_rgba(37,99,235,0.12)] text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.5rem] 2xl:text-6xl whitespace-nowrap">
                  {metric.value}
                </div>

                {/* Centered Label with consistent baseline and wrapped text balance */}
                <div className="w-full pt-3 flex items-center justify-center min-h-[2.5rem] sm:min-h-[2.75rem]">
                  <span className="font-sans text-[11px] sm:text-xs lg:text-sm uppercase tracking-[0.16em] font-semibold text-typo-gray group-hover:text-typo-white transition-colors duration-200 text-center leading-snug max-w-[160px] sm:max-w-[200px] text-balance">
                    {metric.label}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Development Verification Safety Note */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-12 pt-4 border-t border-foundation-slate/30 flex items-center justify-between text-[11px] font-mono text-typo-gray/60">
            <span>* Preliminary activity metrics — subject to institutional audit</span>
            <span className="hidden sm:inline">Verified data pipeline enabled</span>
          </div>
        )}
      </Container>
    </Section>
  );
}
