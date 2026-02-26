import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getVaultEntry, getAllVaultSlugs } from "@/lib/vault";
import AirQualityWidget from "@/components/AirQualityWidget";
import AQILoading from "@/components/AQILoading";
import WeatherWidget from "@/components/WeatherWidget";
import WeatherLoading from "@/components/WeatherLoading";
import { AlertBox, BulletList, LungsJointsScore } from "@/components/MdxComponents";
import Link from "next/link";

// PPR: This page uses cacheComponents (Next.js 16).
// Static content (MDX body) is cached; AirQualityWidget in Suspense is dynamic.

interface Props {
    params: Promise<{ country: string; state: string; city: string }>;
}

export async function generateStaticParams() {
    const slugs = await getAllVaultSlugs();
    return slugs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, state, city } = await params;
    const entry = await getVaultEntry(country, state, city);
    if (!entry) return {};

    const { frontmatter: fm } = entry;
    const title = `${fm.city} Workout Safety Guide — Pollen & Air Quality`;
    const description = fm.description;

    const citySchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        author: { "@type": "Person", name: "Local Marathon Runner & PT" },
        dateModified: fm.lastUpdated,
        about: [
            { "@type": "Place", name: fm.city, address: { "@type": "PostalAddress", addressRegion: fm.state, addressCountry: fm.country } },
            { "@type": "MedicalCondition", name: "Seasonal Allergies" },
        ],
    };

    return {
        title,
        description,
        alternates: { canonical: fm.canonicalUrl ?? `https://healthislife.work/workout-safety/${country}/${state}/${city}` },
        openGraph: { title, description, type: "article", publishedTime: fm.lastUpdated },
        other: {
            "application/ld+json": JSON.stringify(citySchema),
        },
    };
}

const MDX_COMPONENTS = {
    AlertBox,
    BulletList,
    LungsJointsScore,
};

export default async function CityPage({ params }: Props) {
    const { country, state, city } = await params;
    const entry = await getVaultEntry(country, state, city);

    if (!entry) notFound();

    const { frontmatter: fm, content } = entry;

    const pollenColor =
        fm.pollenLevel === "Low" ? "var(--color-primary)"
            : fm.pollenLevel === "Moderate" ? "var(--color-warning)"
                : "var(--color-danger)";

    return (
        <>
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="breadcrumb">
                <Link href="/">Home</Link>
                <span className="breadcrumb-sep">›</span>
                <Link href={`/workout-safety/${country}`}>{country.toUpperCase()}</Link>
                <span className="breadcrumb-sep">›</span>
                <Link href={`/workout-safety/${country}/${state}`}>{fm.state}</Link>
                <span className="breadcrumb-sep">›</span>
                <span>{fm.city}</span>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">
                    🗓️ Updated {new Date(fm.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <h1 className="hero-title">
                    <span>{fm.city}</span> Workout Safety
                </h1>
                <p className="hero-sub">{fm.description}</p>

                {/* Score */}
                <div className="score-card">
                    <span className="score-label">🫁 Lungs &amp; Joints Score</span>
                    <span
                        className="score-value"
                        style={{
                            color:
                                (fm.lungsJointsScore ?? 0) >= 7 ? "var(--color-primary)"
                                    : (fm.lungsJointsScore ?? 0) >= 4 ? "var(--color-warning)"
                                        : "var(--color-danger)",
                        }}
                    >
                        {fm.lungsJointsScore ?? "?"}
                        <span className="score-denom">/10</span>
                    </span>
                </div>

                {/* Quick stats */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        🌼 Pollen: <strong style={{ color: pollenColor }}>{fm.pollenLevel}</strong>
                    </span>
                    <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        💨 AQI: <strong style={{ color: fm.aqi <= 50 ? "var(--color-primary)" : fm.aqi <= 100 ? "var(--color-warning)" : "var(--color-danger)" }}>
                            {fm.aqi}
                        </strong>
                    </span>
                    {fm.temperature !== undefined && fm.weatherCondition !== undefined && (
                        <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                            ⛅ Temp: <strong>{fm.temperature}°C ({fm.weatherCondition})</strong>
                        </span>
                    )}
                </div>
            </section>

            {/* Content Grid */}
            <div className="content-grid">
                {/* Main Article — Static / Cached */}
                <article className="article-body">
                    <MDXRemote source={content} components={MDX_COMPONENTS} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
                </article>

                {/* Sidebar */}
                <aside className="sidebar">
                    {/* ── DYNAMIC WEATHER WIDGET (PPR Suspense boundary) ── */}
                    <Suspense fallback={<WeatherLoading />}>
                        <WeatherWidget lat={fm.lat} lon={fm.lon} city={fm.city} />
                    </Suspense>

                    {/* ── DYNAMIC AQI WIDGET (PPR Suspense boundary) ── */}
                    <Suspense fallback={<AQILoading />}>
                        <AirQualityWidget lat={fm.lat} lon={fm.lon} city={fm.city} />
                    </Suspense>

                    {/* Tags */}
                    {fm.tags?.length > 0 && (
                        <div
                            style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                padding: "1rem",
                            }}
                        >
                            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                                Tags
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {fm.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontSize: "0.72rem",
                                            padding: "0.2rem 0.6rem",
                                            borderRadius: "999px",
                                            background: "var(--color-surface-2)",
                                            border: "1px solid var(--color-border)",
                                            color: "var(--color-text-muted)",
                                        }}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
}
