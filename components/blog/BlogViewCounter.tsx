"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, Timer } from "lucide-react";

interface BlogViewCounterProps {
  slug: string;
  initialViews?: number;
  initialAvgReadTimeSeconds?: number;
  /** Show the avg read-time stat alongside views. Default true. */
  showAvgTime?: boolean;
  className?: string;
}

/**
 * BlogViewCounter
 *
 * Responsibilities:
 * 1. On mount, check sessionStorage for `iedc_viewed_{slug}`.
 *    - If NOT seen this session → POST /api/blogs/[slug]/view, set flag.
 *    - Either way, update displayed view count from API response.
 * 2. Start a high-resolution elapsed-time timer.
 * 3. On page unload (beforeunload / visibilitychange hidden), send elapsed
 *    seconds to POST /api/blogs/[slug]/time via navigator.sendBeacon.
 *    Guarded by sessionStorage flag `iedc_timed_{slug}` so only one reading
 *    per session is recorded.
 */
export function BlogViewCounter({
  slug,
  initialViews = 0,
  initialAvgReadTimeSeconds = 0,
  showAvgTime = true,
  className = "",
}: BlogViewCounterProps) {
  const [views, setViews] = useState<number>(initialViews);
  const [avgReadTime, setAvgReadTime] = useState<number>(initialAvgReadTimeSeconds);
  const startTimeRef = useRef<number>(Date.now());
  const timerSentRef = useRef<boolean>(false);

  // ─── 1. View tracking with sessionStorage dedup ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    const sessionKey = `iedc_viewed_${slug}`;
    const alreadySeen = typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(sessionKey) === "1"
      : false;

    async function recordView() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) {
            if (typeof data.views === "number") {
              setViews(data.views);
            }
            if (typeof data.avgReadTimeSeconds === "number" && data.avgReadTimeSeconds > 0) {
              setAvgReadTime(data.avgReadTimeSeconds);
            }
          }
          // Mark session so we don't double-count on navigation within same tab session
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(sessionKey, "1");
          }
        }
      } catch {
        // Network error — preserve initial view count
      }
    }

    async function fetchViewCount() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/view`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) {
            if (typeof data.views === "number") {
              setViews(data.views);
            }
            if (typeof data.avgReadTimeSeconds === "number" && data.avgReadTimeSeconds > 0) {
              setAvgReadTime(data.avgReadTimeSeconds);
            }
          }
        }
      } catch {
        // Silently ignore
      }
    }

    if (alreadySeen) {
      // Already counted this session — just fetch latest count without incrementing
      fetchViewCount();
    } else {
      recordView();
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ─── 2. Time-spent tracking via sendBeacon on page unload ────────────────
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerSentRef.current = false;

    function sendTimeSpent() {
      if (timerSentRef.current) return;
      const timerSessionKey = `iedc_timed_${slug}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(timerSessionKey) === "1") {
        return; // already sent this session
      }

      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const url = `/api/blogs/${encodeURIComponent(slug)}/time`;
      const body = JSON.stringify({ seconds: elapsedSeconds });

      let sent = false;
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        // sendBeacon is fire-and-forget, works even during unload
        sent = navigator.sendBeacon(url, body);
      }
      if (!sent) {
        // Fallback for environments without sendBeacon support
        try {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        } catch {
          // Silently ignore
        }
      }

      timerSentRef.current = true;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(timerSessionKey, "1");
      }
    }

    // visibilitychange catches tab switching / navigating to another page in SPA
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendTimeSpent();
      }
    }

    window.addEventListener("beforeunload", sendTimeSpent);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", sendTimeSpent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Also fire when component unmounts (SPA navigation)
      sendTimeSpent();
    };
  }, [slug]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    return n.toLocaleString();
  }

  function formatAvgTime(seconds: number): string {
    if (!seconds || seconds < 5) return "";
    if (seconds < 60) return `${seconds}s avg`;
    const mins = Math.round(seconds / 60);
    return `${mins} min avg`;
  }

  const formattedTime = formatAvgTime(avgReadTime);

  return (
    <span
      className={`inline-flex items-center gap-3 font-mono text-[11px] sm:text-xs transition-colors ${className}`}
    >
      {/* View Count */}
      <span
        className="inline-flex items-center gap-1.5"
        title={`${views.toLocaleString()} verified reads`}
      >
        <Eye className="w-3.5 h-3.5 opacity-80 shrink-0" />
        <span>
          {formatViews(views)} {views === 1 ? "view" : "views"}
        </span>
      </span>

      {/* Avg Read Time */}
      {showAvgTime && formattedTime && (
        <span
          className="inline-flex items-center gap-1.5"
          title={`Average time readers spend on this article`}
        >
          <Timer className="w-3.5 h-3.5 opacity-80 shrink-0" />
          <span>{formattedTime}</span>
        </span>
      )}
    </span>
  );
}
