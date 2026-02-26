import { getAllVaultSlugs } from "@/lib/vault";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://healthislife.work";
    const slugs = await getAllVaultSlugs();

    // Unique Countries
    const countries = [...new Set(slugs.map((s) => s.country))];
    const countryUrls: MetadataRoute.Sitemap = countries.map((country) => ({
        url: `${baseUrl}/workout-safety/${country}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
    }));

    // Unique States (country/state pairs)
    const states = [...new Set(slugs.map((s) => `${s.country}/${s.state}`))];
    const stateUrls: MetadataRoute.Sitemap = states.map((path) => ({
        url: `${baseUrl}/workout-safety/${path}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
    }));

    const cityUrls: MetadataRoute.Sitemap = slugs.map(({ country, state, city }) => ({
        url: `${baseUrl}/workout-safety/${country}/${state}/${city}`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.6,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        ...countryUrls,
        ...stateUrls,
        ...cityUrls,
    ];
}
