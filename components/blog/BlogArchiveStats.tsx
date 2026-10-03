import React from "react";
import { Eye, Timer, BookOpen, Sparkles } from "lucide-react";

export interface BlogArchiveStatsData {
  totalViews: number;
  totalReadTimeSeconds: number;
  articleCount: number;
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString();
}

export function formatReadTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0 min";
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${Math.max(1, totalMinutes)} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} hr${hours !== 1 ? "s" : ""}`;
  return `${hours} hr${hours !== 1 ? "s" : ""} ${mins} min`;
}

/**
 * Vertical stats card matching the "Leave a remark" dark-theme styling.
 * Positioned on the left side of the book in the free margin.
 */
export function BlogArchiveStatsCard({
  totalViews,
  totalReadTimeSeconds,
  articleCount,
}: BlogArchiveStatsData) {
  return (
    <div
      aria-label="Blog Readership Statistics"
      className="group flex flex-col gap-3 p-4 rounded-2xl bg-foundation-dark/80 hover:bg-foundation-dark/95 border border-slate-700/80 hover:border-brand-cyan/60 shadow-2xl backdrop-blur-md min-w-[170px] max-w-[210px] transition-all duration-300"
    >
      {/* Header Badge */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-[10px] font-mono uppercase tracking-widest text-brand-cyan font-bold">
        <Sparkles className="w-3 h-3 text-brand-cyan" />
        <span>READERSHIP</span>
      </div>

      {/* Views Stat */}
      <div className="space-y-0.5">
        <span className="text-[10px] font-mono text-typo-gray uppercase tracking-wider block">
          Total Views
        </span>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-cyan shrink-0" />
          <span className="font-display text-lg font-bold text-typo-white tracking-tight">
            {formatViews(totalViews)}
          </span>
        </div>
      </div>

      {/* Cumulative Time Read Stat */}
      <div className="space-y-0.5 pt-2 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-typo-gray uppercase tracking-wider block">
          Time Read
        </span>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-brand-cyan shrink-0" />
          <span className="font-display text-sm font-bold text-typo-white tracking-tight">
            {formatReadTime(totalReadTimeSeconds)}
          </span>
        </div>
      </div>

      {/* Article Count */}
      {articleCount > 0 && (
        <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-typo-gray flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
          <span>
            {articleCount} {articleCount === 1 ? "article" : "articles"}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact horizontal stats bar for smaller screens or mobile view.
 */
export function BlogArchiveStatsBar({
  totalViews,
  totalReadTimeSeconds,
  articleCount,
}: BlogArchiveStatsData) {
  return (
    <div
      aria-label="Blog Readership Statistics"
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 px-3 rounded-xl bg-foundation-dark/70 border border-slate-800/80 text-[11px] font-mono text-typo-gray select-none"
    >
      <span className="inline-flex items-center gap-1.5">
        <Eye className="w-3 h-3 text-brand-cyan shrink-0" />
        <strong className="text-typo-white font-semibold">{formatViews(totalViews)}</strong> views
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1.5">
        <Timer className="w-3 h-3 text-brand-cyan shrink-0" />
        <strong className="text-typo-white font-semibold">{formatReadTime(totalReadTimeSeconds)}</strong> read
      </span>
      {articleCount > 0 && (
        <>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-brand-cyan shrink-0" />
            <strong className="text-typo-white font-semibold">{articleCount}</strong> posts
          </span>
        </>
      )}
    </div>
  );
}
