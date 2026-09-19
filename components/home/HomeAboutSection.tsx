"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/animation/Reveal";
import { GravityMeshCanvas } from "@/components/ui/GravityMeshCanvas";
import { IedcOrbitalNode } from "@/components/ui/IedcOrbitalNode";
import { ArrowRight } from "lucide-react";

export function HomeAboutSection() {
  return (
    <Section
      id="about-intro"
      spacing="none"
      className="border-t border-slate-800/80 bg-[#080A0F] relative overflow-hidden select-none lg:min-h-[68vh] lg:max-h-[76vh] flex items-center"
      style={{
        paddingTop: "clamp(56px, 6vw, 96px)",
        paddingBottom: "clamp(80px, 9vw, 140px)",
      }}
    >
      {/* Secondary anchor for in-page navigation compatibility */}
      <div id="about" className="absolute -top-24 pointer-events-none" />

      {/* 1. Interactive Technical Gravity Mesh Canvas (Subtle localized bending) */}
      <GravityMeshCanvas gridStep={44} influenceRadius={165} maxDisplacement={13} />

      {/* 2. Soft Ambient Radial Illumination behind left column */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-brand-blue/5 rounded-full blur-[130px] pointer-events-none" />

      {/* 3. Two-Column Editorial Composition (50% / 50%) */}
      <Container size="lg" className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: ~50% Width (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            {/* Eyebrow */}
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-cyan/30 text-brand-cyan text-xs font-bold tracking-[0.25em] uppercase shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                <span>✦</span>
                <span>IEDC / ABOUT</span>
              </div>
            </Reveal>

            {/* Main Heading in Syne */}
            <Reveal variant="fade-up" delayMs={100}>
              <h2 className="font-display font-bold text-[clamp(36px,4.6vw,64px)] tracking-tight text-typo-white leading-[1.08] text-balance">
                Building Ideas.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-cyan/90">
                  Building Impact.
                </span>
              </h2>
            </Reveal>

            {/* Concise Editorial Description in Manrope */}
            <Reveal variant="fade-up" delayMs={200}>
              <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
                IEDC at TKIET brings students, mentors, and opportunities together to turn ideas into meaningful innovation.
              </p>
            </Reveal>

            {/* Minimal Action Link to /about */}
            <Reveal variant="fade-up" delayMs={300}>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#0F1420] hover:bg-slate-800 border border-slate-700/80 hover:border-brand-cyan/50 text-typo-white hover:text-brand-cyan text-xs uppercase font-sans font-semibold tracking-wider transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                >
                  <span>Learn About Our Ecosystem</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-brand-cyan" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: ~50% Width (lg:col-span-6) - Interactive Innovation Field & IEDC Core */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <Reveal variant="fade-in" delayMs={200}>
              <IedcOrbitalNode />
            </Reveal>
          </div>

        </div>
      </Container>
    </Section>
  );
}
