"use client";

import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface BlogViewCounterProps {
  slug: string;
  initialViews?: number;
  className?: string;
}

export function BlogViewCounter({
  slug,
  initialViews = 0,
  className = "",
}: BlogViewCounterProps) {
  const [views, setViews] = useState<number>(initialViews);

  useEffect(() => {
    let isMounted = true;

    async function recordView() {
      try {
        const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && typeof data.views === "number") {
            setViews(data.views);
          }
        }
      } catch {
        // Silently preserve initialViews on network error
      }
    }

    recordView();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const formattedViews = views.toLocaleString();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-xs transition-colors ${className}`}
      title={`${formattedViews} verified reads`}
    >
      <Eye className="w-3.5 h-3.5 opacity-80 shrink-0" />
      <span>{formattedViews} {views === 1 ? "view" : "views"}</span>
    </span>
  );
}
