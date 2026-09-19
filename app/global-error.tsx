"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#080A0F] text-white font-sans">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">A critical error occurred</h2>
          <p className="text-sm text-gray-400">
            Please refresh the page or try again in a few moments.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
