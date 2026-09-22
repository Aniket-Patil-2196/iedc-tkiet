"use client";

import React, { useState } from "react";
import { ITeamMember } from "@/types/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animation/Reveal";
import { User, GraduationCap, ShieldCheck, Linkedin, Github, Twitter } from "lucide-react";
import Image from "next/image";
import { EventHeroCanvas } from "@/components/events/EventHeroCanvas";

interface TeamDirectoryProps {
  members?: ITeamMember[];
}

export function TeamDirectory({ members = [] }: TeamDirectoryProps) {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeFacultyId, setActiveFacultyId] = useState<string | null>(null);

  const students = members.filter(
    (m) => m.category === "student_lead" || m.category === "core_team"
  );
  const faculty = members.filter(
    (m) => m.category === "faculty_coordinator" || m.category === "advisory"
  );

  return (
    <div className="w-full space-y-24 py-8">
      {/* 1. MANDATORY: Student Team FIRST */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden space-y-10">
        <EventHeroCanvas variant="wash" />
        <div className="relative z-10 space-y-10">
          <div className="border-b border-foundation-slate/60 pb-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-2">
              <GraduationCap className="w-4 h-4" />
              Student Leadership & Cohorts
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
            /* Dynamic Asymmetric Editorial Layout for Students */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {students.map((student, index) => {
              // Dynamic layout balancing:
              // 1 item -> full width centered
              // 2 items -> 6 & 6
              // 3+ items -> alternate 7 & 5
              let colSpan = "md:col-span-6";
              if (students.length === 1) {
                colSpan = "md:col-span-8 md:col-start-3";
              } else if (students.length > 2) {
                const isFeatured = index % 3 === 0;
                colSpan = isFeatured ? "md:col-span-7" : "md:col-span-5";
              }

              const isSelected = activeStudentId === student.id;

              return (
                <div key={student.id} className={colSpan}>
                  <Reveal variant="fade-up" delayMs={index * 80}>
                    <div
                      tabIndex={0}
                      role="button"
                      onClick={() =>
                        setActiveStudentId((prev) =>
                          prev === student.id ? null : student.id
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveStudentId((prev) =>
                            prev === student.id ? null : student.id
                          );
                        }
                      }}
                      className={cn(
                        "group relative p-8 sm:p-10 rounded-2xl bg-foundation-dark border transition-all duration-300 flex flex-col justify-between cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-cyan",
                        students.length > 2 && index % 3 === 0
                          ? "min-h-[380px]"
                          : "min-h-[340px]",
                        isSelected
                          ? "border-brand-cyan/70 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
                          : "border-foundation-slate/80 hover:border-brand-blue/50"
                      )}
                    >
                      {/* Top Monogram / Visual Placeholder */}
                      <div className="flex items-start justify-between">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-foundation-slate/70 border border-foundation-slate flex items-center justify-center overflow-hidden group-hover:border-brand-cyan/60 transition-colors">
                          {student.avatarUrl ? (
                            <Image
                              src={student.avatarUrl}
                              alt={student.name}
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

                        {student.department && (
                          <span className="text-[11px] font-sans text-typo-gray uppercase tracking-widest px-2.5 py-1 rounded bg-foundation-slate/50 border border-foundation-slate">
                            {student.department}
                          </span>
                        )}
                      </div>

                      {/* Member Details */}
                      <div className="space-y-3 mt-6">
                        <span className="text-xs uppercase tracking-wider font-sans text-brand-cyan font-semibold block">
                          {student.role}
                        </span>

                        <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white group-hover:text-brand-cyan transition-colors">
                          {student.name}
                        </h3>

                        {student.bio && (
                          <p
                            className={cn(
                              "font-sans text-xs sm:text-sm text-typo-white/90 leading-relaxed transition-all duration-200",
                              isSelected || "sm:line-clamp-2"
                            )}
                          >
                            {student.bio}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-foundation-slate/50 text-[11px] font-sans text-typo-gray/70 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {student.linkedinUrl && (
                            <a
                              href={student.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-typo-gray hover:text-brand-cyan transition-colors"
                              aria-label={`${student.name} LinkedIn`}
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.githubUrl && (
                            <a
                              href={student.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-typo-gray hover:text-brand-cyan transition-colors"
                              aria-label={`${student.name} GitHub`}
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {student.twitterUrl && (
                            <a
                              href={student.twitterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-typo-gray hover:text-brand-cyan transition-colors"
                              aria-label={`${student.name} Twitter`}
                            >
                              <Twitter className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {!student.linkedinUrl && !student.githubUrl && !student.twitterUrl && (
                            <span className="text-brand-cyan/70">IEDC Student Cohort</span>
                          )}
                        </div>

                        <span className="text-brand-cyan text-[11px] sm:hidden">
                          {isSelected ? "Tap to collapse" : "Tap for details"}
                        </span>
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </section>

      {/* 2. MANDATORY: Faculty Team SECOND */}
      <section className="relative rounded-3xl p-6 sm:p-10 md:p-12 border border-foundation-slate/40 bg-foundation-dark/30 backdrop-blur-sm overflow-hidden space-y-10">
        <EventHeroCanvas variant="wash" />
        <div className="relative z-10 space-y-10">
          <div className="border-b border-foundation-slate/60 pb-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              Institutional Governance & Mentorship
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-typo-white tracking-tight">
              Faculty Mentors & Advisory
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faculty.map((member, index) => {
              const isSelected = activeFacultyId === member.id;

              return (
                <Reveal key={member.id} variant="fade-up" delayMs={index * 100}>
                  <div
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      setActiveFacultyId((prev) =>
                        prev === member.id ? null : member.id
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveFacultyId((prev) =>
                          prev === member.id ? null : member.id
                        );
                      }
                    }}
                    className={cn(
                      "p-8 sm:p-10 rounded-2xl bg-foundation-dark border transition-all duration-300 space-y-5 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-cyan",
                      isSelected
                        ? "border-brand-cyan/70 shadow-[0_0_30px_rgba(56,189,248,0.12)]"
                        : "border-foundation-slate/80 hover:border-brand-blue/50"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-16 h-16 rounded-2xl bg-foundation-slate/70 border border-foundation-slate flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-brand-blue" />
                        )}
                      </div>

                      <div>
                        <span className="text-xs uppercase tracking-wider font-sans text-brand-cyan font-semibold block mb-0.5">
                          {member.role}
                        </span>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
                          {member.name}
                        </h3>
                        {member.department && (
                          <p className="font-sans text-xs text-typo-gray mt-0.5">
                            {member.department}
                          </p>
                        )}
                      </div>
                    </div>

                    {member.bio && (
                      <p className="font-sans text-sm text-typo-gray leading-relaxed pt-2">
                        {member.bio}
                      </p>
                    )}

                    <div className="pt-4 border-t border-foundation-slate/50 text-[11px] font-sans text-brand-cyan/70 flex items-center justify-between">
                      <span>Institutional Mentor • TKIET</span>
                      <div className="flex items-center gap-2.5">
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-typo-gray hover:text-brand-cyan transition-colors"
                            aria-label={`${member.name} LinkedIn`}
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
