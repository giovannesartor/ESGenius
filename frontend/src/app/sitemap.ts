import type { MetadataRoute } from "next";

const BASE_URL = "https://esg360.digital";
const LOCALES = ["pt", "en", "es"] as const;

const PUBLIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/solutions", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/manifesto", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/trust", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/developers", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/register", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of PUBLIC_ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l === "pt" ? "pt-BR" : l === "en" ? "en-US" : "es-ES",
              `${BASE_URL}/${l}${path}`,
            ])
          ),
        },
      });
    }
  }

  return entries;
}
