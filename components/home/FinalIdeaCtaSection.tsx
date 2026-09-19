"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/animation/Reveal";
import { ArrowRight, Lightbulb, MessageSquare, Sparkles } from "lucide-react";

export function FinalIdeaCtaSection() {
  return (
    <Section
      id="idea-cta"
      spacing="xl"
      className="border-t border-foundation-slate/60 bg-foundation-darkest relative overflow-hidden select-none"
    >
      {/* Subtle Atmospheric Blue/Cyan Ambient Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-brand-blue/10 via-brand-cyan/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <Container size="lg" className="relative z-10">
        {/* Main Editorial Panel */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#0F1420] via-[#0B0F18] to-[#080B12] border border-foundation-slate/80 p-8 sm:p-12 md:p-16 lg:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Faint blueprint coordinate grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />

          {/* Decorative IEDC Abstract Geometric Node in the corner */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full border border-brand-blue/20 pointer-events-none hidden sm:block">
            <div className="absolute inset-4 rounded-full border border-brand-cyan/20 border-dashed" />
            <div className="absolute inset-8 rounded-full border border-foundation-slate/40" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6 sm:space-y-8">
            {/* Eyebrow */}
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue/15 border border-brand-cyan/30 text-brand-cyan text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(56,189,248,0.12)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next Step // Innovation Launchpad</span>
              </div>
            </Reveal>

            {/* Headline in Syne */}
            <Reveal variant="fade-up" delayMs={100}>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-typo-white leading-[1.08] text-balance">
                HAVE AN IDEA?
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-sky-200 to-white">
                  LET&apos;S BUILD IT.
                </span>
              </h2>
            </Reveal>

            {/* Supporting Copy in Manrope */}
            <Reveal variant="fade-up" delayMs={200}>
              <p className="font-sans text-base sm:text-lg md:text-xl text-typo-gray leading-relaxed max-w-2xl font-normal">
                Have an idea worth exploring, a problem worth solving, or a project you want to take further?
                Connect with IEDC and start the conversation.
              </p>
            </Reveal>

            {/* Dual Action Buttons */}
            <Reveal variant="fade-up" delayMs={300}>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Primary Action: Submit Your Idea (routes to verified contact flow) */}
                <Link
                  href="/contact?topic=idea"
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-sans text-sm font-semibold tracking-wide uppercase transition-all duration-200 shadow-lg shadow-brand-blue/25 hover:shadow-brand-cyan/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Lightbulb className="w-4 h-4 text-brand-cyan transition-transform group-hover:scale-110" />
                  <span>Submit Your Idea</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Secondary Action: Contact IEDC Team */}
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-foundation-dark/80 hover:bg-foundation-slate border border-foundation-slate/80 hover:border-brand-cyan/50 text-typo-white hover:text-brand-cyan font-sans text-sm font-semibold tracking-wide uppercase transition-all duration-200 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-typo-gray group-hover:text-brand-cyan transition-colors" />
                  <span>Contact IEDC Team</span>
                </Link>
              </div>
            </Reveal>

          </div>
        </div>
      </Container>
    </Section>
  );
}
