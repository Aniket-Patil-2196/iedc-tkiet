"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Subtle route change transition.
 * Provides a quiet, instant opacity enter without blocking screens or cinematic delay.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="flex-1 flex flex-col animate-in fade-in duration-200"
    >
      {children}
    </div>
  );
}
