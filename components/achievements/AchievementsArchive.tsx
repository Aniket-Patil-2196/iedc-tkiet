"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { IAchievement } from "@/types/content";
import { Award, ChevronDown, ExternalLink, FileCheck, X, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AchievementsArchiveProps {
  achievements: IAchievement[];
}

export function AchievementsArchive({ achievements }: AchievementsArchiveProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<IAchievement | null>(null);

  // Extract unique years for filtering
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(achievements.map((a) => a.year)));
    return years.sort((a, b) => (b.localeCompare(a)));
  }, [achievements]);

  // Filter and sort chronologically (order and year)
  const filteredAchievements = useMemo(() => {
    return achievements
      .filter((a) => (selectedYear === "all" ? true : a.year === selectedYear))
      .sort((a, b) => a.order - b.order);
  }, [achievements, selectedYear]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (achievements.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-foundation-dark border border-foundation-slate flex items-center justify-center mx-auto text-brand-cyan">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-bold text-typo-white">
          Achievements will appear here as they are published.
        </h3>
        <p className="font-sans text-xs sm:text-sm text-typo-gray">
          Verified competition awards, hackathon recognitions, and patent disclosures are currently being archived.
        </p>
      </div>
    );
  }

  // Keyboard accessibility for certificate modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCertificate(null);
      }
    };
    if (activeCertificate) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeCertificate]);

  return (
    <div className="w-full space-y-10">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-foundation-dark/80 border border-foundation-slate">
        <div className="flex items-center gap-2 text-xs font-sans text-typo-gray">
          <Filter className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="uppercase tracking-wider font-semibold">Filter Timeline:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedYear("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
              selectedYear === "all"
                ? "bg-brand-blue text-typo-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "bg-foundation-slate/50 text-typo-gray hover:text-typo-white hover:bg-foundation-slate"
            }`}
          >
            All Years ({achievements.length})
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                selectedYear === year
                  ? "bg-brand-blue text-typo-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "bg-foundation-slate/50 text-typo-gray hover:text-typo-white hover:bg-foundation-slate"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Timeline Archive */}
      <div className="relative border-l border-foundation-slate/70 ml-3 sm:ml-6 pl-6 sm:pl-10 space-y-8">
        {filteredAchievements.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <article
              key={item.id}
              className="relative group transition-all"
            >
              {/* Timeline marker node */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-6 w-3.5 h-3.5 rounded-full bg-foundation-dark border-2 border-brand-cyan group-hover:border-brand-blue group-hover:scale-125 transition-all shadow-[0_0_10px_rgba(56,189,248,0.5)]" />

              {/* Achievement Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-foundation-dark border border-foundation-slate group-hover:border-brand-blue/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Category & Year Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foundation-slate/70 border border-foundation-slate text-xs font-mono text-brand-cyan font-semibold">
                        <Sparkles className="w-3 h-3 text-brand-cyan" />
                        {item.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-foundation-slate/40 text-xs font-mono text-typo-gray">
                        Year {item.year}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white pt-1 group-hover:text-brand-cyan transition-colors">
                      {item.title}
                    </h3>

                    {/* Recipient / Team */}
                    {item.recipientOrTeam && (
                      <p className="text-xs sm:text-sm font-sans text-typo-gray">
                        <span className="text-typo-white/70 font-medium">Conferred Upon / Cadre:</span>{" "}
                        {item.recipientOrTeam}
                      </p>
                    )}

                    {/* Summary */}
                    <p className="font-sans text-sm sm:text-base text-typo-gray leading-relaxed pt-1">
                      {item.shortDescription || item.description}
                    </p>
                  </div>

                  {/* Expand / Details Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    aria-expanded={isExpanded}
                    className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-xs font-sans font-semibold text-typo-white border border-foundation-slate hover:border-brand-blue transition-colors shrink-0"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Citation"}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-cyan transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Expandable Accordion Panel */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-foundation-slate/60 space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Detailed narrative */}
                      <div className="lg:col-span-8 space-y-4">
                        <h4 className="text-xs font-sans uppercase tracking-widest font-semibold text-typo-white">
                          Institutional Citation &amp; Impact
                        </h4>
                        <p className="font-sans text-sm text-typo-gray leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          {item.verifiedLink && (
                            <a
                              href={item.verifiedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-sans text-brand-cyan hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Institutional Registry Verification</span>
                            </a>
                          )}
                          <div className="inline-flex items-center gap-1 text-xs font-sans text-typo-gray/80">
                            <FileCheck className="w-3.5 h-3.5 text-brand-cyan" />
                            <span>Verified Cell Record</span>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Thumbnail Preview */}
                      {item.certificateImage && (
                        <div className="lg:col-span-4">
                          <button
                            type="button"
                            onClick={() => setActiveCertificate(item)}
                            className="group/cert relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-foundation-dark border border-foundation-slate hover:border-brand-blue transition-all cursor-pointer block text-left"
                            aria-label={`View Certificate for ${item.title}`}
                          >
                            <Image
                              src={item.certificateImage}
                              alt={`Certificate: ${item.title}`}
                              fill
                              className="object-cover group-hover/cert:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-foundation-dark/60 opacity-0 group-hover/cert:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                              <span className="px-3 py-1.5 rounded-md bg-brand-blue text-typo-white text-xs font-sans font-semibold shadow-md inline-flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" />
                                Inspect Certificate
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Certificate Modal Lightbox */}
      {activeCertificate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Certificate Details"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-foundation-space/90 backdrop-blur-md"
          onClick={() => setActiveCertificate(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-foundation-dark border border-foundation-slate p-6 sm:p-8 space-y-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-brand-cyan font-semibold">
                  Official Institutional Document
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white pt-1">
                  {activeCertificate.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveCertificate(null)}
                className="w-9 h-9 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-gray hover:text-typo-white flex items-center justify-center transition-colors"
                aria-label="Close certificate preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Certificate Image */}
            <div className="relative w-full aspect-[16/11] rounded-xl overflow-hidden bg-foundation-slate/20 border border-foundation-slate">
              <Image
                src={activeCertificate.certificateImage || "/images/placeholders/certificate-nec.svg"}
                alt={activeCertificate.title}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-sans text-typo-gray">
              <div>
                Recipient: <span className="text-typo-white font-medium">{activeCertificate.recipientOrTeam}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCertificate(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
