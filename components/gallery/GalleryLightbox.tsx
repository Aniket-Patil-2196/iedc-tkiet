"use client";

import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { IGalleryImage } from "@/types/content";
import { X, ChevronLeft, ChevronRight, Tag, Eye, Image as ImageIcon } from "lucide-react";

interface GalleryLightboxProps {
  image: IGalleryImage | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasMultiple?: boolean;
}

export function GalleryLightbox({
  image,
  onClose,
  onNext,
  onPrev,
  hasMultiple = false,
}: GalleryLightboxProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image?.imageUrl]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && onNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && onPrev) {
        onPrev();
      }
    },
    [onClose, onNext, onPrev]
  );

  useEffect(() => {
    if (!image) return;

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [image, handleKeyDown]);

  if (!image) return null;

  const isInternal = image.imageUrl?.startsWith("/api/images/");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-foundation-space/95 backdrop-blur-lg animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-foundation-dark border border-foundation-slate overflow-hidden shadow-[0_15px_60px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-foundation-slate/70 bg-foundation-dark/90">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse-slow" />
            <span className="text-xs uppercase tracking-widest font-mono text-brand-cyan font-semibold">
              Interactive Archive Showcase
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-foundation-slate/50 hover:bg-foundation-slate text-typo-gray hover:text-typo-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Container */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-foundation-space flex items-center justify-center overflow-hidden">
          {hasError || !image.imageUrl ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-foundation-slate/50 border border-foundation-slate flex items-center justify-center text-brand-cyan">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-sans text-typo-white font-medium">
                Image could not be loaded
              </p>
              <p className="text-xs font-mono text-typo-gray">
                {image.imageUrl || "No URL specified"}
              </p>
            </div>
          ) : (
            <Image
              src={image.imageUrl}
              alt={image.title}
              fill
              unoptimized={isInternal}
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-contain"
              priority
              onError={() => setHasError(true)}
            />
          )}

          {/* Prev / Next controls */}
          {hasMultiple && (
            <>
              {onPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-foundation-slate text-typo-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  aria-label="Previous photograph"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-foundation-slate text-typo-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  aria-label="Next photograph"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Details Footer */}
        <div className="p-6 bg-foundation-dark/95 border-t border-foundation-slate/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
              {image.title}
            </h3>

            {image.tags && image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {image.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 text-xs font-mono text-brand-cyan border border-foundation-slate"
                  >
                    <Tag className="w-3 h-3 text-brand-cyan" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {image.caption && (
            <p className="font-sans text-sm text-typo-gray leading-relaxed max-w-3xl">
              {image.caption}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between text-xs font-sans text-typo-gray border-t border-foundation-slate/40">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-brand-cyan" />
              IEDC TKIET Media Registry
            </span>
            <span className="hidden sm:inline">Use Left/Right arrow keys to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
