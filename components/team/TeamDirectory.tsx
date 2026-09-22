"use client";

import React from "react";
import { ITeamMember } from "@/types/content";
import { Reveal } from "@/components/animation/Reveal";
import { GraduationCap, ShieldCheck, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { EventHeroCanvas } from "@/components/events/EventHeroCanvas";
import { useCardSpotlight } from "@/lib/hooks/useCardSpotlight";
import { SpotlightBorder } from "@/components/events/SpotlightBorder";

interface TeamDirectoryProps {
  members?: ITeamMember[];
}

// ── Small decorative constellation accent for members without a photo ──────
function ConstellationFallback() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 80"
      className="w-full h-full text-brand-cyan/40"
      fill="none"
    >
      {/* Stars */}
      <circle cx="40" cy="18" r="3" fill="currentColor" opacity="0.9" />
      <circle cx="20" cy="55" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="60" cy="55" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="36" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="52" cy="36" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="62" r="1.5" fill="currentColor" opacity="0.5" />
      {/* Lines */}
      <line x1="40" y1="18" x2="20" y2="55" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="40" y1="18" x2="60" y2="55" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="20" y1="55" x2="60" y2="55" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="30" y1="36" x2="52" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

// ── Individual Crew Card ───────────────────────────────────────────────────
interface CrewCardProps {
  member: ITeamMember;
  index: number;
}

function CrewCard({ member, index }: CrewCardProps) {
  const { ref: cardRef, prefersReducedMotion } = useCardSpotlight<HTMLDivElement>({
    maxTilt: 4,
    perspective: 800,
  });

  return (
    <Reveal variant="fade-up" delayMs={index * 60}>
      <div
        ref={cardRef}
        className="group relative rounded-2xl bg-[#0c1120] border border-foundation-slate/50 overflow-hidden cursor-default select-none
          [transform-style:preserve-3d]
          transition-[transform,box-shadow] duration-300 ease-out
          focus-within:ring-2 focus-within:ring-brand-cyan/70
          hover:[box-shadow:0_0_28px_rgba(56,189,248,0.10)]
          hover:[transform:translateY(-3px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]
          motion-reduce:hover:[transform:none]
          @media(hover:none):[transform:none]"
        style={{
          willChange: "auto",
          transform: prefersReducedMotion ? "none" : undefined,
        }}
      >
        {/* Spotlight border (desktop hover only, respects prefers-reduced-motion) */}
        <SpotlightBorder radiusClass="rounded-2xl" spotlightColor="rgba(56,189,248,0.35)" size={280} />

        <div className="p-5 flex flex-col items-center gap-4">
          {/* ── Photo Ring ───────────────────────────────────────────────── */}
          <div className="relative mt-2">
            {/* Glow ring — brightens on hover */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full
                ring-2 ring-brand-cyan/30
                group-hover:ring-brand-cyan/80 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]
                group-focus-within:ring-brand-cyan/80 group-focus-within:shadow-[0_0_20px_rgba(56,189,248,0.35)]
                transition-all duration-300 motion-reduce:transition-none
                pointer-events-none z-10"
            />
            {/* Inner photo or constellation fallback */}
            <div className="relative w-24 h-24 rounded-full bg-foundation-slate/60 overflow-hidden ring-1 ring-foundation-slate/80">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
                  fill
                  className="object-cover object-center"
                  sizes="96px"
                />
              ) : (
                <ConstellationFallback />
              )}
            </div>
          </div>

          {/* ── Name & Role ──────────────────────────────────────────────── */}
          <div className="text-center space-y-1">
            <h3 className="font-display text-base sm:text-lg font-bold text-typo-white leading-tight">
              {member.name}
            </h3>
            <p
              className="font-sans text-[11px] uppercase tracking-[0.12em] text-brand-cyan font-semibold leading-snug"
              style={{ fontVariant: "small-caps" }}
            >
              {member.role}
            </p>
          </div>

          {/* ── Contact Icons ─────────────────────────────────────────────── */}
          {(member.linkedinUrl || member.email) && (
            <div className="flex items-center gap-3 pb-1">
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-foundation-slate/50 border border-foundation-slate/70 text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/60 hover:bg-brand-cyan/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  aria-label={`Email ${member.name}`}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-foundation-slate/50 border border-foundation-slate/70 text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/60 hover:bg-brand-cyan/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// ── Grid layout: balanced columns based on member count ───────────────────
function getGridClass(count: number): string {
  if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
  if (count === 2) return "grid-cols-2 max-w-sm mx-auto";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2 sm:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
}

// ── Main Directory Component ───────────────────────────────────────────────
export function TeamDirectory({ members = [] }: TeamDirectoryProps) {
  const students = members.filter(
    (m) => m.category === "student_lead" || m.category === "core_team"
  );
  const faculty = members.filter(
    (m) => m.category === "faculty_coordinator" || m.category === "advisory"
  );

  return (
    <div className="w-full space-y-16 py-8">

      {/* 1. Student Initiative Team */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden">
        <EventHeroCanvas variant="wash" />
        <div className="relative z-10 space-y-10">

          {/* Section header */}
          <div className="border-b border-foundation-slate/60 pb-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-2">
              <GraduationCap className="w-4 h-4" />
              Student Leadership &amp; Cohorts
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-typo-white tracking-tight">
              Student Initiative Team
            </h2>
            <p className="font-sans text-sm sm:text-base text-typo-gray max-w-2xl mt-2 leading-relaxed">
              Engineering innovators and student coordinators driving peer hackathons, prototyping labs, and campus enterprise activities.
            </p>
          </div>

          {students.length === 0 ? (
            <div className="p-12 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 text-center space-y-3">
              <GraduationCap className="w-8 h-8 text-brand-cyan/60 mx-auto" />
              <h3 className="font-display text-lg font-bold text-typo-white">
                Team roster coming soon
              </h3>
              <p className="font-sans text-sm text-typo-gray max-w-md mx-auto">
                The student innovation and coordination committee for the academic session is currently being formalized by the cell.
              </p>
            </div>
          ) : (
            <div className={`grid gap-5 ${getGridClass(students.length)}`}>
              {students.map((student, index) => (
                <CrewCard key={student.id} member={student} index={index} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 2. Faculty Mentors & Advisory */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden">
        <EventHeroCanvas variant="wash" />
        <div className="relative z-10 space-y-10">

          {/* Section header */}
          <div className="border-b border-foundation-slate/60 pb-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              Institutional Governance &amp; Mentorship
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-typo-white tracking-tight">
              Faculty Mentors &amp; Advisory
            </h2>
            <p className="font-sans text-sm sm:text-base text-typo-gray max-w-2xl mt-2 leading-relaxed">
              Experienced academic leadership providing institutional compliance, patent evaluation, and engineering project alignment.
            </p>
          </div>

          {faculty.length === 0 ? (
            <div className="p-12 rounded-2xl bg-foundation-dark/40 border border-foundation-slate/60 text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-brand-cyan/60 mx-auto" />
              <h3 className="font-display text-lg font-bold text-typo-white">
                Team roster coming soon
              </h3>
              <p className="font-sans text-sm text-typo-gray max-w-md mx-auto">
                Institutional faculty coordinators and department mentors will be listed here following academic council appointments.
              </p>
            </div>
          ) : (
            <div className={`grid gap-5 ${getGridClass(faculty.length)}`}>
              {faculty.map((member, index) => (
                <CrewCard key={member.id} member={member} index={index} />
              ))}
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
