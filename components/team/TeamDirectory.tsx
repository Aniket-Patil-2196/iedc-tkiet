"use client";

import React from "react";
import { ITeamMember } from "@/types/content";
import { Reveal } from "@/components/animation/Reveal";
import { GraduationCap, ShieldCheck, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { TeamHeroCanvas } from "@/components/team/TeamHeroCanvas";
import { useCardSpotlight } from "@/lib/hooks/useCardSpotlight";
import { SpotlightBorder } from "@/components/events/SpotlightBorder";

interface TeamDirectoryProps {
  members?: ITeamMember[];
}

// ── Full-Bleed Portrait Card (~3:4 Aspect Ratio) ───────────────────────────
interface CrewCardProps {
  member: ITeamMember;
  index: number;
}

function CrewCard({ member, index }: CrewCardProps) {
  const { ref: cardRef } = useCardSpotlight<HTMLDivElement>({
    maxTilt: 0, // Full-bleed card relies on photo zoom & edge glow rather than tilt
  });

  return (
    <Reveal variant="fade-up" delayMs={index * 50}>
      <div
        ref={cardRef}
        className="group relative w-full aspect-[3/4] rounded-2xl bg-foundation-dark border border-foundation-slate/60 overflow-hidden select-none
          transition-all duration-300
          [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:border-brand-cyan/50
          motion-reduce:hover:translate-y-0
          focus-within:ring-2 focus-within:ring-brand-cyan/70"
      >
        {/* 1. Full-Bleed Photo or Clean Dark Background (Zero decoration on card) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0e1422] via-[#090e1a] to-[#040812]">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              fill
              className="object-cover object-center transition-transform duration-500 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105 motion-reduce:group-hover:scale-100"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#0d1424] via-[#090e1a] to-[#050812]" />
          )}
        </div>

        {/* 2. Bottom Dark Gradient Scrim Overlay (fades up from bottom, deepens on desktop hover) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none
            bg-gradient-to-t from-[#040812] via-[#040812]/85 via-[#040812]/40 to-transparent
            transition-all duration-300
            [@media(hover:hover)_and_(pointer:fine)]:group-hover:from-black
            [@media(hover:hover)_and_(pointer:fine)]:group-hover:via-[#040812]/95"
        />

        {/* 3. Spotlight Border: Cursor-following cyan glow (desktop hover only) */}
        <SpotlightBorder
          radiusClass="rounded-2xl"
          spotlightColor="rgba(56, 189, 248, 0.45)"
          size={320}
        />

        {/* 4. Content pinned to bottom over scrim */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 flex flex-col justify-end gap-3 pointer-events-auto">
          <div className="space-y-1">
            <h3 className="font-display text-lg sm:text-xl font-bold text-typo-white tracking-tight leading-snug drop-shadow-md">
              {member.name}
            </h3>
            <p
              className="font-sans text-xs uppercase tracking-[0.14em] text-brand-cyan/95 font-semibold leading-normal drop-shadow-sm"
              style={{ fontVariant: "small-caps" }}
            >
              {member.role}
            </p>
          </div>

          {/* Contact Icons: always visible, >=44px tap targets on mobile */}
          {(member.linkedinUrl || member.email) && (
            <div className="flex items-center gap-2.5 pt-0.5">
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#0d131f]/80 border border-foundation-slate/90 text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/70 hover:bg-brand-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan transition-all duration-200 backdrop-blur-md"
                >
                  <Linkedin className="w-[18px] h-[18px]" />
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  aria-label={`Email ${member.name}`}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#0d131f]/80 border border-foundation-slate/90 text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/70 hover:bg-brand-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan transition-all duration-200 backdrop-blur-md"
                >
                  <Mail className="w-[18px] h-[18px]" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// ── Grid layout: balanced columns based on member count (no odd gaps) ──────
function getGridClass(count: number): string {
  if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto";
  if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto";
  return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
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
      <section className="relative rounded-3xl p-5 sm:p-8 md:p-10 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden">
        <TeamHeroCanvas section="student" variant="wash" />
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
            <div className={`grid gap-6 ${getGridClass(students.length)}`}>
              {students.map((student, index) => (
                <CrewCard key={student.id} member={student} index={index} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 2. Faculty Mentors & Advisory */}
      <section className="relative rounded-3xl p-5 sm:p-8 md:p-10 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden">
        <TeamHeroCanvas section="faculty" variant="wash" />
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
            <div className={`grid gap-6 ${getGridClass(faculty.length)}`}>
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
