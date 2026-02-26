import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountrySlugs, getStateSlugs, getStateEntries } from "@/lib/vault";

interface Props {
    params: Promise<{ country: string; state: string }>;
}

export async function generateStaticParams() {
    const countries = await getCountrySlugs();
    const params: { country: string; state: string }[] = [];
    for (const country of countries) {
        const states = await getStateSlugs(country);
        for (const state of states) {
            params.push({ country, state });
        }
    }
    return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, state } = await params;
    const stateName = toTitleCase(state);
    const countryName = country.toUpperCase();
    const title = `${stateName} Workout Safety Guide — Pollen & Air Quality by City`;
    const description = `Compare pollen levels, air quality, and workout safety scores for every major city in ${stateName}, ${countryName}. Updated regularly.`;
    return {
        title,
        description,
        alternates: { canonical: `https://healthislife.work/workout-safety/${country}/${state}` },
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

export default async function StatePage({ params }: Props) {
    const { country, state } = await params;
    const entries = await getStateEntries(country, state);

    if (!entries || entries.length === 0) notFound();

    const stateName = toTitleCase(state);
    const countryName = country.toUpperCase();

    // Summary stats
    const avgScore = entries.reduce((acc, e) => acc + (e.frontmatter.lungsJointsScore ?? 0), 0) / entries.length;
    const avgAqi = Math.round(entries.reduce((acc, e) => acc + (e.frontmatter.aqi ?? 0), 0) / entries.length);

    return (
        <>
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="breadcrumb">
                <Link href="/">Home</Link>
                <span className="breadcrumb-sep">›</span>
                <Link href={`/workout-safety/${country}`}>{countryName}</Link>
                <span className="breadcrumb-sep">›</span>
                <span>{stateName}</span>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">🗺️ State Overview</div>
                <h1 className="hero-title">
                    <span>{stateName}</span> Workout Safety
                </h1>
                <p className="hero-sub">
                    Workout safety scores, pollen levels, and air quality for {entries.length} cities in {stateName}.
                </p>
                {/* State-level summary stats */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        🫁 Avg Score: <strong style={{ color: scoreColor(avgScore) }}>{avgScore.toFixed(1)}/10</strong>
                    </span>
                    <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        💨 Avg AQI: <strong style={{ color: avgAqi <= 50 ? "var(--color-primary)" : avgAqi <= 100 ? "var(--color-warning)" : "var(--color-danger)" }}>{avgAqi}</strong>
                    </span>
                    <span style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        🌆 {entries.length} Cities
                    </span>
                </div>
            </section>

            {/* City Grid */}
            <div className="city-grid">
                {entries.map((entry) => {
                    const fm = entry.frontmatter;
                    const pollenColor =
                        fm.pollenLevel === "Low" ? "var(--color-primary)"
                            : fm.pollenLevel === "Moderate" ? "var(--color-warning)"
                                : "var(--color-danger)";
                    const aqiColor =
                        fm.aqi <= 50 ? "var(--color-primary)"
                            : fm.aqi <= 100 ? "var(--color-warning)"
                                : "var(--color-danger)";
                    return (
                        <Link
                            key={entry.slug.city}
                            href={`/workout-safety/${country}/${state}/${entry.slug.city}`}
                            className="city-card"
                        >
                            <span className="city-card-name">{fm.city}</span>
                            <span className="city-card-meta">{stateName}, {countryName}</span>

                            {/* Lungs & Joints Score pill */}
                            <span className="city-card-score" style={{ color: scoreColor(fm.lungsJointsScore) }}>
                                🫁 {fm.lungsJointsScore ?? "?"}/10
                            </span>

                            {/* Pollen */}
                            <span style={{ fontSize: "0.75rem", color: pollenColor, marginTop: "0.15rem" }}>
                                🌼 Pollen: {fm.pollenLevel}
                            </span>

                            {/* AQI */}
                            <span style={{ fontSize: "0.75rem", color: aqiColor }}>
                                💨 AQI: {fm.aqi}
                            </span>

                            {/* Weather */}
                            {fm.temperature !== undefined && (
                                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                    ⛅ {fm.temperature}°C — {fm.weatherCondition}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
