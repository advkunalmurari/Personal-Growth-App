import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/analytics/", "/review/", "/knowledge/", "/focus/"],
    },
    sitemap: "https://personal-growth-app.vercel.app/sitemap.xml",
  };
}
