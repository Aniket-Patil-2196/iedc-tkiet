import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";

interface GenerateMetadataProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Creates standardized Next.js metadata objects for pages.
 */
export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  path = "",
  image = "/images/og-default.png",
  noIndex = false,
}: GenerateMetadataProps): Metadata {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`;
  const canonicalUrl = `${SITE_CONFIG.url}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: `${SITE_CONFIG.fullName} - ${SITE_CONFIG.institutionShort}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}
