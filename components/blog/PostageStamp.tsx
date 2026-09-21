"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Maximize2, ExternalLink } from "lucide-react";
import { IBlog, IBlogImage } from "@/types/content";
import { ImageLightbox } from "./ImageLightbox";
import { cn } from "@/lib/utils";

interface PostageStampProps {
  blog: IBlog;
  onOpenLightbox?: (img: { src: string; alt: string; caption?: string }) => void;
  className?: string;
  isManuscriptFullPage?: boolean; // If on /blog/[slug], show all images
}

/**
 * Extracts a clean domain string (e.g. "github.com") from a URL.
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Formats date for the postmark cancellation stamp (e.g. "15 JAN 2025").
 */
function formatPostmarkDate(dateVal?: string | Date): string {
  if (!dateVal) return "IEDC TKIET";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "IEDC TKIET";
  return d
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
    .toUpperCase();
}

export function PostageStamp({
  blog,
  onOpenLightbox,
  className,
  isManuscriptFullPage = false,
}: PostageStampProps) {
  const [internalLightbox, setInternalLightbox] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);

  const handleOpen = (img: { src: string; alt: string; caption?: string }) => {
    if (onOpenLightbox) {
      onOpenLightbox(img);
    } else {
      setInternalLightbox(img);
    }
  };

  // Collect images from images array or fallback to coverImage
  const images: IBlogImage[] =
    blog.images && blog.images.length > 0
      ? blog.images
      : blog.coverImage
      ? [{ url: blog.coverImage, alt: blog.title }]
      : [];

  const displayImages = isManuscriptFullPage ? images : images.slice(0, 3);
  const primaryImage = displayImages[0];
  const secondaryImages = displayImages.slice(1);
  const postmarkDate = formatPostmarkDate(blog.publishedAt || blog.publicationDate || blog.createdAt);

  return (
    <div className={cn("space-y-4 w-full select-none", className)}>
      {/* 1. STAMPS STACK CONTAINER */}
      <div className="relative w-full pt-2 pb-1">
        {primaryImage ? (
          <div className="relative">
            {/* Primary Postage Stamp */}
            <div className="relative z-10 postage-stamp-shadow inline-block w-full rotate-[-1.5deg] transition-transform duration-300 hover:rotate-0">
              <div className="postage-stamp-perforated bg-[var(--stamp-paper,#FBF6E9)] p-2.5 sm:p-3">
                <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-[#D8C7A7] bg-[#E8DCBF] group">
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || blog.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    onClick={() =>
                      handleOpen({
                        src: primaryImage.url,
                        alt: primaryImage.alt || blog.title,
                        caption: primaryImage.caption || blog.title,
                      })
                    }
                  />

                  {/* Expand Lightbox Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleOpen({
                        src: primaryImage.url,
                        alt: primaryImage.alt || blog.title,
                        caption: primaryImage.caption || blog.title,
                      })
                    }
                    aria-label="View full figure"
                    className="absolute bottom-2 right-2 p-1.5 rounded bg-black/75 text-white hover:text-brand-cyan backdrop-blur border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Stamps (if 2 or 3 images exist) */}
            {secondaryImages.map((secImg, idx) => {
              const rotation = idx === 0 ? "rotate-[3deg]" : "rotate-[-4deg]";
              const positionClass =
                idx === 0
                  ? "-bottom-3 -right-2 w-28 sm:w-36 z-20"
                  : "-bottom-4 left-2 w-28 sm:w-36 z-20";

              return (
                <div
                  key={idx}
                  className={cn(
                    "absolute postage-stamp-shadow transition-transform duration-300 hover:scale-105",
                    rotation,
                    positionClass
                  )}
                >
                  <div className="postage-stamp-perforated bg-[var(--stamp-paper,#FBF6E9)] p-1.5 sm:p-2">
                    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-[#D8C7A7] bg-[#E8DCBF] group">
                      <Image
                        src={secImg.url}
                        alt={secImg.alt || `Figure ${idx + 2}`}
                        fill
                        unoptimized
                        className="object-cover cursor-pointer"
                        onClick={() =>
                          handleOpen({
                            src: secImg.url,
                            alt: secImg.alt || `Figure ${idx + 2}`,
                            caption: secImg.caption,
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleOpen({
                            src: secImg.url,
                            alt: secImg.alt || `Figure ${idx + 2}`,
                            caption: secImg.caption,
                          })
                        }
                        aria-label={`View figure ${idx + 2}`}
                        className="absolute inset-0 w-full h-full bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Postmark Overlay in Blue-Black Ink (~55% opacity, multiply blend) */}
            <div
              aria-hidden="true"
              style={{ mixBlendMode: "multiply" }}
              className="absolute -top-3 -right-3 z-30 pointer-events-none rotate-[12deg] flex items-center gap-1.5 opacity-55 text-[#1B2333]"
            >
              {/* Circular Postal Stamp */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#1B2333] flex flex-col items-center justify-center p-1 text-center bg-transparent">
                <span className="text-[9px] sm:text-[10px] font-book-handwriting font-bold text-[#1B2333] tracking-wider leading-none">
                  IEDC TKIET
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-[#1B2333] font-semibold tracking-tight leading-tight pt-0.5">
                  {postmarkDate}
                </span>
                <span className="text-[7px] font-mono text-[#1B2333] tracking-widest leading-none pt-0.5">
                  WARANA
                </span>
              </div>

              {/* Wavy Cancellation Lines */}
              <div className="space-y-1 w-8 sm:w-10">
                <div className="h-0.5 bg-[#1B2333] rounded-full" />
                <div className="h-0.5 bg-[#1B2333] rounded-full" />
                <div className="h-0.5 bg-[#1B2333] rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Generated Archival Blueprint Motif when post has 0 images */
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-[#D6C4A5] bg-[#ECE1CA] p-4 flex flex-col justify-between shadow-inner select-none">
            <svg
              className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="15%" cy="25%" r="2" fill="#785532" />
              <circle cx="65%" cy="30%" r="2.5" fill="#4A3418" />
              <circle cx="85%" cy="65%" r="2" fill="#785532" />
              <circle cx="35%" cy="75%" r="1.8" fill="#4A3418" />
              <line
                x1="15%"
                y1="25%"
                x2="65%"
                y2="30%"
                stroke="#785532"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <line
                x1="65%"
                y1="30%"
                x2="85%"
                y2="65%"
                stroke="#785532"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            </svg>
            <div className="text-[10px] font-mono text-[#785532] tracking-wider uppercase font-semibold">
              IEDC ARCHIVE MOTIF
            </div>
            <div className="space-y-1 text-center z-10">
              <span className="font-display font-semibold text-xs sm:text-sm text-[#0F1B44] block line-clamp-2">
                {blog.title}
              </span>
              <span className="text-[10px] font-mono text-[#4B5468] block font-medium">
                {postmarkDate}
              </span>
            </div>
            <div className="text-[9px] font-mono text-[#6E5D46] text-right font-medium tracking-wider">
              TKIET · ARCHIVE
            </div>
          </div>
        )}
      </div>

      {/* 2. CAPTION (in handwriting font) */}
      {primaryImage?.caption && (
        <p className="font-book-handwriting text-xs sm:text-sm text-[#4B5468] italic leading-relaxed pt-0.5">
          {primaryImage.caption}
        </p>
      )}

      {/* 3. SOURCES BLOCK (Museum cardstock label style) */}
      {blog.references && blog.references.length > 0 && (
        <div className="pt-2">
          <div className="p-3 rounded-lg border border-[#DACBB5] bg-[#FAF5EA] shadow-[0_1px_3px_rgba(74,52,24,0.06)] space-y-2">
            <span className="block text-[10px] font-mono tracking-widest text-[#0F1B44] uppercase font-bold">
              SOURCES &amp; REFERENCES
            </span>
            <ul className="space-y-1 text-xs">
              {blog.references.map((ref, idx) => (
                <li key={idx} className="flex items-baseline gap-1.5 leading-tight">
                  <span className="text-[10px] font-mono text-[#4B5468] select-none font-medium">
                    [{idx + 1}]
                  </span>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-sans text-xs text-[#1E40AF] hover:text-[#2563EB] hover:underline transition-colors inline-flex items-center gap-1 group truncate max-w-[280px] sm:max-w-[340px] font-medium"
                  >
                    <span className="truncate">{ref.label}</span>
                    <span className="text-[10px] font-mono text-[#4B5468] shrink-0">
                      ({extractDomain(ref.url)})
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#1E40AF] group-hover:text-[#2563EB] shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Internal Lightbox (if no external onOpenLightbox provided) */}
      {internalLightbox && (
        <ImageLightbox
          src={internalLightbox.src}
          alt={internalLightbox.alt}
          caption={internalLightbox.caption}
          onClose={() => setInternalLightbox(null)}
        />
      )}
    </div>
  );
}
