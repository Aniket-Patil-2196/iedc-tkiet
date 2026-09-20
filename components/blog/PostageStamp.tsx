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
              <div className="postage-stamp-perforated bg-[#F1F5F9] p-2.5 sm:p-3">
                <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-[#CBD5E1] bg-slate-900 group">
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
                    className="absolute bottom-2 right-2 p-1.5 rounded bg-black/75 text-brand-cyan hover:text-white backdrop-blur border border-brand-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <div className="postage-stamp-perforated bg-[#F1F5F9] p-1.5 sm:p-2">
                    <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border border-[#CBD5E1] bg-slate-900 group">
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

            {/* Postmark Overlay overlapping top right corner */}
            <div
              aria-hidden="true"
              className="absolute -top-3 -right-3 z-30 pointer-events-none rotate-[12deg] flex items-center gap-1.5 opacity-65"
            >
              {/* Circular Postal Stamp */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-brand-cyan/70 flex flex-col items-center justify-center p-1 text-center bg-slate-950/20 backdrop-blur-[1px]">
                <span className="text-[9px] sm:text-[10px] font-book-handwriting font-bold text-brand-cyan tracking-wider leading-none">
                  IEDC TKIET
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-300 tracking-tight leading-tight pt-0.5">
                  {postmarkDate}
                </span>
                <span className="text-[7px] font-mono text-brand-cyan/80 tracking-widest leading-none pt-0.5">
                  WARANA
                </span>
              </div>

              {/* Wavy Cancellation Lines */}
              <div className="space-y-1 w-8 sm:w-10">
                <div className="h-0.5 bg-brand-cyan/50 rounded-full" />
                <div className="h-0.5 bg-brand-cyan/50 rounded-full" />
                <div className="h-0.5 bg-brand-cyan/50 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Generated Galaxy Fallback Art when post has 0 images */
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/60 bg-gradient-to-br from-[#040814] via-[#091530] to-[#030611] p-4 flex flex-col justify-between shadow-inner">
            <svg
              className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="15%" cy="25%" r="1.5" fill="#38BDF8" />
              <circle cx="65%" cy="30%" r="2" fill="#FFFFFF" />
              <circle cx="85%" cy="65%" r="1.5" fill="#60A5FA" />
              <circle cx="35%" cy="75%" r="1.2" fill="#38BDF8" />
              <line
                x1="15%"
                y1="25%"
                x2="65%"
                y2="30%"
                stroke="#38BDF8"
                strokeWidth="0.5"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <line
                x1="65%"
                y1="30%"
                x2="85%"
                y2="65%"
                stroke="#38BDF8"
                strokeWidth="0.5"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            </svg>
            <div className="text-[10px] font-mono text-brand-cyan/80 tracking-wider uppercase">
              IEDC ARCHIVE MOTIF
            </div>
            <div className="space-y-1 text-center z-10">
              <span className="font-display font-semibold text-xs sm:text-sm text-slate-200 block line-clamp-2">
                {blog.title}
              </span>
              <span className="text-[10px] font-mono text-brand-cyan/70 block">
                {postmarkDate}
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-500 text-right">
              EST. 2014
            </div>
          </div>
        )}
      </div>

      {/* 2. CAPTION (in handwriting font) */}
      {primaryImage?.caption && (
        <p className="font-book-handwriting text-xs sm:text-sm text-slate-300/90 italic leading-relaxed pt-1">
          {primaryImage.caption}
        </p>
      )}

      {/* 3. SOURCES BLOCK (Museum-caption style, omitted if no references) */}
      {blog.references && blog.references.length > 0 && (
        <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
          <span className="block text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-bold">
            SOURCES &amp; REFERENCES
          </span>
          <ul className="space-y-1 text-xs">
            {blog.references.map((ref, idx) => (
              <li key={idx} className="flex items-baseline gap-1.5 leading-tight">
                <span className="text-[10px] font-mono text-slate-500 select-none">
                  [{idx + 1}]
                </span>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-sans text-xs text-slate-300 hover:text-brand-cyan transition-colors inline-flex items-center gap-1 group truncate max-w-[280px] sm:max-w-[340px]"
                >
                  <span className="truncate">{ref.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    ({extractDomain(ref.url)})
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-brand-cyan shrink-0" />
                </a>
              </li>
            ))}
          </ul>
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
