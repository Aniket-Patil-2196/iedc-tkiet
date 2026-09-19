import { MetadataRoute } from "next";
import { getPublishedEvents, getPublishedBlogs } from "@/lib/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://iedc.tkiet.ac.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/about/journey",
    "/about/leadership",
    "/events",
    "/blog",
    "/team",
    "/collaborations",
    "/achievements",
    "/gallery",
    "/contact",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const [events, blogs] = await Promise.all([
      getPublishedEvents(),
      getPublishedBlogs(),
    ]);

    const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: new Date(event.updatedAt || event.createdAt || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt || blog.publicationDate || Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...eventRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
