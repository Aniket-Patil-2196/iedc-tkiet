"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Mic, Calendar, Building, X } from "lucide-react";
import { Reveal } from "@/components/animation/Reveal";
import { IPreviousSpeaker } from "@/types/content";

interface PreviousSpeakersCarouselProps {
  speakers: IPreviousSpeaker[];
}

export function PreviousSpeakersCarousel({ speakers }: PreviousSpeakersCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalSpeaker, setModalSpeaker] = useState<IPreviousSpeaker | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const count = speakers.length;

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
  }, [count]);

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
  }, [count]);

  // Keyboard navigation when carousel is in view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Empty State
  if (!speakers || count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foundation-slate/60 p-12 text-center text-typo-gray max-w-xl mx-auto">
        <Mic className="w-8 h-8 text-brand-cyan/40 mx-auto mb-3" />
        <h3 className="font-display font-semibold text-lg text-typo-white mb-1">
          Distinguished Voices
        </h3>
        <p className="text-sm">
          Distinguished speaker keynotes and founder mentorship sessions will be announced here as our institutional archives are updated.
        </p>
      </div>
    );
  }

  // Calculate circular modular distance to support wrap-around
  const getOffset = (index: number) => {
    let diff = index - activeIndex;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Centered Eyebrow & Heading matching Reference media_1789748749233.png */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Reveal variant="fade-up">
          <span className="text-xs uppercase font-sans tracking-[0.25em] text-brand-cyan font-bold block">
            INSIGHTS FROM
          </span>
        </Reveal>
        <Reveal variant="fade-up" delayMs={100}>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-typo-white">
            Previous Speakers
          </h2>
        </Reveal>
      </div>

      {/* 3D Perspective Carousel Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-5xl mx-auto h-[440px] sm:h-[490px] md:h-[530px] flex items-center justify-center overflow-hidden select-none [perspective:1200px]"
        tabIndex={0}
        aria-label="Previous speakers carousel"
      >
        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous speaker"
          className="absolute left-2 sm:left-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-foundation-slate/80 bg-foundation-darkest/75 backdrop-blur-md flex items-center justify-center text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/70 hover:scale-105 transition-all shadow-lg focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next speaker"
          className="absolute right-2 sm:right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-foundation-slate/80 bg-foundation-darkest/75 backdrop-blur-md flex items-center justify-center text-typo-gray hover:text-brand-cyan hover:border-brand-cyan/70 hover:scale-105 transition-all shadow-lg focus:outline-none"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Items */}
        <div className="relative w-full h-full flex items-center justify-center">
          {speakers.map((speaker, idx) => {
            const offset = getOffset(idx);
            const isCenter = offset === 0;
            const isNear = Math.abs(offset) <= 2;

            if (!isNear && count > 5) return null;

            // Transform styles based on offset
            let translateX = "0%";
            let scale = 1;
            let rotateY = 0;
            let zIndex = 30;
            let opacity = 1;
            let brightness = 1;

            if (offset === 0) {
              translateX = "0%";
              scale = 1;
              rotateY = 0;
              zIndex = 30;
              opacity = 1;
              brightness = 1;
            } else if (offset === -1) {
              translateX = "-75%";
              scale = 0.88;
              rotateY = 14;
              zIndex = 20;
              opacity = 0.7;
              brightness = 0.65;
            } else if (offset === 1) {
              translateX = "75%";
              scale = 0.88;
              rotateY = -14;
              zIndex = 20;
              opacity = 0.7;
              brightness = 0.65;
            } else if (offset === -2) {
              translateX = "-140%";
              scale = 0.76;
              rotateY = 22;
              zIndex = 10;
              opacity = 0.35;
              brightness = 0.45;
            } else if (offset === 2) {
              translateX = "140%";
              scale = 0.76;
              rotateY = -22;
              zIndex = 10;
              opacity = 0.35;
              brightness = 0.45;
            }

            return (
              <div
                key={speaker.id || idx}
                onClick={() => {
                  if (isCenter) {
                    if (speaker.shortDescription || speaker.eventAssociation) {
                      setModalSpeaker(speaker);
                    }
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                style={{
                  transform: `translateX(${translateX}) scale(${scale}) rotateY(${rotateY}deg)`,
                  zIndex,
                  opacity,
                  filter: `brightness(${brightness})`,
                }}
                className={`absolute top-1/2 -translate-y-1/2 w-[270px] sm:w-[310px] md:w-[340px] aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-500 ease-out cursor-pointer group will-change-transform ${
                  isCenter
                    ? "border-brand-cyan/60 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(56,189,248,0.18)]"
                    : "border-foundation-slate/60 hover:opacity-90"
                }`}
                aria-label={`${speaker.name} - ${speaker.designation}`}
              >
                {/* Full-bleed Photograph with Smooth Internal Hover Zoom */}
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-foundation-dark">
                  <Image
                    src={speaker.photo || `/images/placeholders/speaker-${(idx % 6) + 1}.svg`}
                    alt={speaker.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 270px, 340px"
                    priority={isCenter}
                  />
                </div>

                {/* Cinematic Vignette Overlay (Dark anchored at bottom, light at top) */}
                <div className="absolute inset-0 bg-gradient-to-t from-foundation-darkest via-foundation-darkest/75 to-transparent pointer-events-none" />

                {/* Subtle Brand Cyan Top Accent for Active Card */}
                {isCenter && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-80" />
                )}

                {/* Bottom Content Anchored inside Photograph */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10 flex flex-col justify-end space-y-1 pointer-events-none">
                  <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-typo-white leading-tight group-hover:text-brand-cyan transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {speaker.name}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-typo-gray leading-snug line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] group-hover:text-typo-white transition-colors">
                    {speaker.designation}
                  </p>

                  {speaker.organization && (
                    <span className="text-[11px] font-sans text-brand-cyan/90 font-medium tracking-wide pt-0.5 truncate">
                      {speaker.organization}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {speakers.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to speaker ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                i === activeIndex
                  ? "w-6 bg-brand-cyan shadow-[0_0_10px_#38BDF8]"
                  : "w-2 bg-foundation-slate/80 hover:bg-typo-gray/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Speaker Detail Modal */}
      {modalSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foundation-space/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-foundation-dark border border-foundation-slate p-6 sm:p-8 space-y-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalSpeaker(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-foundation-slate flex items-center justify-center text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-foundation-slate shrink-0 border border-brand-cyan/40">
                <Image
                  src={modalSpeaker.photo}
                  alt={modalSpeaker.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h4 className="font-display font-bold text-xl sm:text-2xl text-typo-white">
                  {modalSpeaker.name}
                </h4>
                <p className="text-xs sm:text-sm text-brand-cyan font-medium">
                  {modalSpeaker.designation}
                </p>
                {modalSpeaker.organization && (
                  <p className="text-xs text-typo-gray flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-typo-gray/60 shrink-0" />
                    <span>{modalSpeaker.organization}</span>
                  </p>
                )}
              </div>
            </div>

            {modalSpeaker.eventAssociation && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-xs font-sans text-typo-white">
                <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Session: {modalSpeaker.eventAssociation}</span>
              </div>
            )}

            {modalSpeaker.shortDescription && (
              <div className="space-y-1.5 text-xs sm:text-sm font-sans text-typo-gray leading-relaxed pt-2 border-t border-foundation-slate/60">
                <span className="text-typo-white font-semibold block text-xs uppercase tracking-wider">
                  Key Insights & Discussion
                </span>
                <p>{modalSpeaker.shortDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
