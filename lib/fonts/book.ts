import { EB_Garamond, Fraunces, Kalam, Noto_Serif_Devanagari } from "next/font/google";

/**
 * Literary book fonts — shared by root layout (CSS variables) and book
 * components (.className applied directly so font-family cannot fall back
 * to inherited Manrope/Syne if a CSS-variable chain breaks).
 */

export const fontBookBody = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-literary",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontBookTitle = Fraunces({
  subsets: ["latin"],
  variable: "--font-book-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const fontDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const fontHandwriting = Kalam({
  subsets: ["devanagari", "latin"],
  variable: "--font-handwriting",
  display: "swap",
  weight: ["400", "700"],
});
