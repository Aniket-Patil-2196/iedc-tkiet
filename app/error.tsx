"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APPLICATION ERROR]", error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] bg-foundation-darkest">
      <Section spacing="lg">
        <Container size="sm" className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-foundation-dark border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-sans tracking-[0.2em] text-red-400 font-bold block">
              500 • Application Error
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-typo-white">
              Something went wrong
            </h1>
            <p className="font-sans text-sm sm:text-base text-typo-gray max-w-md mx-auto leading-relaxed">
              An unexpected error occurred while processing this request. The incident has been recorded.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-typo-white font-sans text-sm font-semibold hover:bg-brand-blue/90 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <Button href="/" variant="secondary" size="md">
              Return Home
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
