import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/me",
        "/me/",
        "/saved",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/submit",
        "/api",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
