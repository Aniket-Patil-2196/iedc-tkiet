"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string | null;
  alt: string;
  caption?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, caption, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center bg-foundation-dark/90 border border-foundation-slate/80 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Top bar with close */}
        <div className="w-full flex items-center justify-between px-6 py-3 border-b border-foundation-slate/50 bg-foundation-darkest/60">
          <span className="text-xs uppercase tracking-widest text-brand-cyan font-semibold flex items-center gap-2">
            <ZoomIn className="w-3.5 h-3.5" />
            Image Inspection
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="p-1.5 rounded-lg text-typo-gray hover:text-typo-white hover:bg-foundation-slate/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main image container */}
        <div className="relative w-full h-[60vh] max-h-[600px] bg-black/40 flex items-center justify-center p-4">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain"
            priority
          />
        </div>

        {/* Caption */}
        {caption && (
          <div className="w-full px-6 py-4 bg-foundation-dark/95 border-t border-foundation-slate/40 text-center">
            <p className="text-xs sm:text-sm text-typo-gray font-sans italic">
              {caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
