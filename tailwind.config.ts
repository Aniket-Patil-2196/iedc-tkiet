import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "col-span-1",
    "col-span-2",
    "col-span-5",
    "col-span-7",
    "col-span-12",
    "md:col-span-1",
    "md:col-span-2",
    "lg:col-span-5",
    "lg:col-span-7",
    "lg:col-span-12",
    "grid-cols-1",
    "md:grid-cols-2",
    "lg:grid-cols-12",
  ],
  theme: {
    extend: {
      colors: {
        foundation: {
          darkest: "#080A0F", // Near Black
          dark: "#0D111A",    // Deep Blue-Black
          slate: "#151B26",   // Dark Slate
        },
        typo: {
          white: "#F5F7FA",   // Soft White
          gray: "#A7AFBE",    // Cool Gray
        },
        brand: {
          blue: "#2563EB",       // IEDC Blue
          cyan: "#38BDF8",       // Electric Cyan
          "blue-dark": "#172554" // Deep Blue
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
        "book-title": [
          "var(--font-book-display)",
          "var(--font-devanagari)",
          "Georgia",
          "serif",
        ],
        "book-body": [
          "var(--font-literary)",
          "var(--font-devanagari)",
          "Times New Roman",
          "serif",
        ],
        "book-handwriting": ["var(--font-handwriting)", "cursive"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)",
        "radial-dark": "radial-gradient(circle at 50% 0%, #151B26 0%, #080A0F 80%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
