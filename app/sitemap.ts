import { getAllVaultSlugs } from "@/lib/vault";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://healthislife.work";
    const slugs = await getAllVaultSlugs();

    const cityUrls: MetadataRoute.Sitemap = slugs.map(({ country, state, city }) => ({
        url: `${baseUrl}/workout-safety/${country}/${state}/${city}`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        ...cityUrls,
    ];
}
