import Link from "next/link";
import { getAllVaultEntries } from "@/lib/vault";

export default async function HomePage() {
  const entries = await getAllVaultEntries();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🌿 Real-Time · Data-Grounded</div>
        <h1 className="hero-title">
          Is Today a <span>Good Day</span> to Work Out Outside?
        </h1>
        <p className="hero-sub">
          Hyper-local pollen, air quality, and workout hazard scores for 500+
          US &amp; Canadian cities — grounded by live AI search.
        </p>
      </section>

      {/* City Grid */}
      <div className="city-grid">
        {entries.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", gridColumn: "1/-1" }}>
            No city guides yet. Run{" "}
            <code style={{ color: "var(--color-primary)" }}>python factory.py</code>{" "}
            to generate vault MDX files.
          </p>
        ) : (
          entries.map(({ frontmatter: fm, slug }) => (
            <Link
              key={`${slug.country}/${slug.state}/${slug.city}`}
              href={`/workout-safety/${slug.country}/${slug.state}/${slug.city}`}
              className="city-card"
            >
              <span className="city-card-name">{fm.city}</span>
              <span className="city-card-meta">
                {fm.state}, {fm.country.toUpperCase()}
              </span>
              <span className="city-card-score">
                🫁 {fm.lungsJointsScore}/10
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Seed entry CTA */}
      {entries.length <= 1 && (
        <div style={{ textAlign: "center", paddingBottom: "3rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
          <p>
            👉 <Link href="/workout-safety/us/texas/austin" style={{ color: "var(--color-primary)" }}>
              View the Austin, TX demo guide
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
