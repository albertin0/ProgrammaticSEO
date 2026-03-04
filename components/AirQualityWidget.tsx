// Dynamic AQI Widget — no `use cache`, fetches live on every request (PPR dynamic slot)
// This component is wrapped in Suspense in the city page for Partial Pre-Rendering
import { connection } from "next/server";

interface AQIData {
    aqi: number;
    dominantPollutant: string;
    category: string;
}

function getAQIClass(aqi: number) {
    if (aqi <= 50) return "aqi-val-good";
    if (aqi <= 100) return "aqi-val-moderate";
    return "aqi-val-poor";
}

async function fetchAQI(lat: number, lon: number): Promise<AQIData> {
    try {
        const res = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,ozone`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                next: { revalidate: 0 }, // Always fresh
            }
        );
        if (!res.ok) throw new Error("Open-Meteo Air Quality API error");
        const data = await res.json();

        const current = data.current || {};
        const aqi = current.us_aqi || 0;

        let dominantPollutant = "PM2.5";
        if (current.ozone && current.ozone > current.pm2_5) {
            dominantPollutant = "Ozone";
        }

        let category = "Unknown";
        if (aqi <= 50) category = "Good ✓";
        else if (aqi <= 100) category = "Moderate ⚡";
        else category = "Unhealthy 🚨";

        return {
            aqi: Math.round(aqi),
            dominantPollutant,
            category,
        };
    } catch {
        return { aqi: 0, dominantPollutant: "N/A", category: "Data unavailable" };
    }
}

export default async function AirQualityWidget({
    lat,
    lon,
    city,
}: {
    lat: number;
    lon: number;
    city: string;
}) {
    await connection(); // Opt out of prerendering proactively
    const data = await fetchAQI(lat, lon);
    const cls = getAQIClass(data.aqi);

    return (
        <div className="aqi-widget">
            <div className="aqi-title">Live Air Quality — {city}</div>
            <div className="aqi-row">
                <span className="aqi-metric">AQI Index</span>
                <span className={`aqi-val ${cls}`}>{data.aqi}</span>
            </div>
            <div className="aqi-row">
                <span className="aqi-metric">Dominant Pollutant</span>
                <span className="aqi-val" style={{ textTransform: "capitalize" }}>
                    {data.dominantPollutant}
                </span>
            </div>
            <div className="aqi-row">
                <span className="aqi-metric">Category</span>
                <span className={`aqi-val ${cls}`}>{data.category}</span>
            </div>
            <p
                style={{
                    fontSize: "0.68rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.75rem",
                }}
            >
                ⚡ Live data · Updates on every page load
            </p>
        </div>
    );
}
