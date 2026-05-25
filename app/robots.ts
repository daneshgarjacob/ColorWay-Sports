import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        "/_next/static/",
        "/opengraph-image",
        "/*/opengraph-image",
        "/*?dpl=",
      ],
    },
    sitemap: "https://www.colorwaysports.com/sitemap.xml",
  };
}
