import type { Metadata, Viewport } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/footer/Footer";
import { BrandedLoader } from "@/components/loading/BrandedLoader";
import { Cursor } from "@/components/animation/Cursor";
import { PageTransition } from "@/components/animation/PageTransition";
import { SITE_CONFIG } from "@/lib/constants/site";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} | ${SITE_CONFIG.fullName}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "IEDC",
    "TKIET",
    "Innovation and Entrepreneurship Development Cell",
    "Tatyasaheb Kore Institute of Engineering and Technology",
    "Warananagar",
    "Startup Incubation",
    "Engineering Entrepreneurship",
    "NEC",
    "IIC",
  ],
  authors: [{ name: `${SITE_CONFIG.name}, ${SITE_CONFIG.institutionShort}` }],
  metadataBase: new URL(SITE_CONFIG.url),
};

export const viewport: Viewport = {
  themeColor: "#080A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col bg-foundation-darkest text-typo-white antialiased selection:bg-brand-blue selection:text-typo-white">
        <BrandedLoader />
        <Cursor />
        <Header />
        <main className="flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
