"use client";

import React from "react";


interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Subtle route change transition.
 * Provides a quiet, instant opacity enter without blocking screens or cinematic delay.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
      {children}
    </div>
  );
}

