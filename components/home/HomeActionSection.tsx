"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/animation/Reveal";
import { Trophy, Users, Globe2, ArrowRight } from "lucide-react";

export function HomeActionSection() {
  const pathways = [
    {
      title: "Verified Milestones",
      tag: "Institutional Recognition",
      description:
        "National Entrepreneurship Challenge honors, state patent awareness drives, and verified student venture records.",
      href: "/achievements",
      cta: "Explore Achievements",
      icon: Trophy,
      accent: "from-amber-500/20 to-brand-blue/10",
      borderHover: "hover:border-amber-400/50",
    },
    {
      title: "Leadership & Team",
      tag: "Student & Faculty Cadres",
      description:
        "Meet the multidisciplinary student leads, departmental coordinators, and faculty advisors directing the cell.",
      href: "/team",
      cta: "Meet Our Team",
      icon: Users,
      accent: "from-brand-blue/20 to-brand-cyan/10",
      borderHover: "hover:border-brand-cyan/50",
    },
    {
      title: "Interactive 3D Gallery",
      tag: "Spatial WebGL Experience",
      description:
        "Step inside our signature Three.js photo globe capturing workshops, hackathons, and physical prototyping sessions.",
      href: "/gallery",
      cta: "Enter 3D Gallery",
      icon: Globe2,
      accent: "from-brand-cyan/20 to-emerald-500/10",
      borderHover: "hover:border-emerald-400/50",
    },
  ];

  return (
    <Section
      id="iedc-in-action"
      spacing="xl"
      className="border-t border-foundation-slate/60 bg-foundation-darkest relative overflow-hidden"
    >
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none" />

      <Container size="lg">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="space-y-2 max-w-2xl">
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                EXPLORE THE CELL
              </div>
            </Reveal>

            <Reveal variant="fade-up" delayMs={100}>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-typo-white">
                IEDC in Action
              </h2>
            </Reveal>

            <Reveal variant="fade-up" delayMs={150}>
              <p className="font-sans text-sm sm:text-base text-typo-gray leading-relaxed">
                Discover the institutional programs, interdisciplinary community, and spatial media archives defining our campus ecosystem.
              </p>
            </Reveal>
          </div>
        </div>

        {/* 3 Pathway Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pathways.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.href} variant="fade-up" delayMs={150 + idx * 100}>
                <Link
                  href={item.href}
                  className={`group relative flex flex-col justify-between h-full p-7 sm:p-8 rounded-3xl bg-foundation-dark border border-foundation-slate/80 ${item.borderHover} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden`}
                >
                  {/* Subtle Top Gradient Aura */}
                  <div
                    className={`absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br ${item.accent} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`}
                  />

                  <div className="space-y-5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center text-brand-cyan group-hover:scale-110 group-hover:border-brand-cyan/60 transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>

                      <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-foundation-slate/40 border border-foundation-slate text-typo-gray">
                        {item.tag}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-typo-white group-hover:text-brand-cyan transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-foundation-slate/60 flex items-center justify-between text-xs font-sans font-medium text-typo-gray group-hover:text-brand-cyan transition-colors relative z-10">
                    <span>{item.cta}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
