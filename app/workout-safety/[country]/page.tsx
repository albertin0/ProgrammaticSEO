import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountrySlugs, getCountryEntries } from "@/lib/vault";

interface Props {
    params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
    const countries = await getCountrySlugs();
    return countries.map((country) => ({ country }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country } = await params;
    const name = country.toUpperCase();
    const title = `${name} Workout Safety Guide — Pollen & Air Quality by State`;
    const description = `Browse pollen levels, air quality, and workout safety scores for every major city in ${name}. Find your city and know before you go.`;
    return {
        title,
        description,
        alternates: { canonical: `https://healthislife.work/workout-safety/${country}` },
    };
}

// ── Helpers ──────────────────────────────────────────────

function toTitleCase(slug: string) {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function scoreColor(score: number | undefined) {
    if (score === undefined || score === null) return "var(--color-text-muted)";
    return score >= 7
        ? "var(--color-primary)"
        : score >= 4
            ? "var(--color-warning)"
            : "var(--color-danger)";
}

// ── Page ─────────────────────────────────────────────────

export default async function CountryPage({ params }: Props) {
    const { country } = await params;
    const stateGroups = await getCountryEntries(country);

    if (!stateGroups || stateGroups.length === 0) notFound();

    const countryName = country.toUpperCase();
    const totalCities = stateGroups.reduce((acc, g) => acc + g.entries.length, 0);

    return (
        <>
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="breadcrumb">
                <Link href="/">Home</Link>
                <span className="breadcrumb-sep">›</span>
                <span>{countryName}</span>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">🌍 Country Overview</div>
                <h1 className="hero-title">
                    <span>{countryName}</span> Workout Safety
                </h1>
                <p className="hero-sub">
                    Pollen, air quality, and workout hazard scores for {totalCities} cities across {stateGroups.length} states in {countryName}.
                </p>
            </section>

            {/* State Groups */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
                {stateGroups.map(({ state, entries }) => (
                    <div key={state} style={{ marginBottom: "2.5rem" }}>
                        {/* State Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
                                {toTitleCase(state)}
                            </h2>
                            <Link
                                href={`/workout-safety/${country}/${state}`}
                                style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    color: "var(--color-accent)",
                                    textDecoration: "none",
                                    padding: "0.2rem 0.6rem",
                                    border: "1px solid var(--color-accent)",
                                    borderRadius: "999px",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                View all →
                            </Link>
                        </div>

                        {/* City Cards */}
                        <div className="city-grid" style={{ padding: 0, margin: 0 }}>
                            {entries.map((entry) => {
                                const fm = entry.frontmatter;
                                const pollenColor =
                                    fm.pollenLevel === "Low" ? "var(--color-primary)"
                                        : fm.pollenLevel === "Moderate" ? "var(--color-warning)"
                                            : "var(--color-danger)";
                                return (
                                    <Link
                                        key={entry.slug.city}
                                        href={`/workout-safety/${country}/${state}/${entry.slug.city}`}
                                        className="city-card"
                                    >
                                        <span className="city-card-name">{fm.city}</span>
                                        <span className="city-card-meta">{fm.state}, {countryName}</span>
                                        <span
                                            className="city-card-score"
                                            style={{
                                                background: "transparent",
                                                color: scoreColor(fm.lungsJointsScore),
                                                padding: 0,
                                                fontWeight: 700,
                                                fontSize: "0.85rem",
                                            }}
                                        >
                                            🫁 {fm.lungsJointsScore ?? "?"}/10
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: pollenColor }}>
                                            🌼 Pollen: {fm.pollenLevel}
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                            💨 AQI: {fm.aqi}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
