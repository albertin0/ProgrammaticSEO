// Dynamic Weather Widget — no `use cache`, fetches live on every request (PPR dynamic slot)
// This component is wrapped in Suspense in the city page for Partial Pre-Rendering
import { connection } from "next/server";

interface WeatherData {
    temperature: number;
    conditions: string;
    windSpeed: number;
    windDirection: string;
}

function getWindDirectionLabel(dirString: string) {
    // "WIND_DIRECTION_SOUTHWEST" -> "SW", "WIND_DIRECTION_NORTH" -> "N", etc.
    const map: Record<string, string> = {
        "WIND_DIRECTION_NORTH": "N",
        "WIND_DIRECTION_NORTHEAST": "NE",
        "WIND_DIRECTION_EAST": "E",
        "WIND_DIRECTION_SOUTHEAST": "SE",
        "WIND_DIRECTION_SOUTH": "S",
        "WIND_DIRECTION_SOUTHWEST": "SW",
        "WIND_DIRECTION_WEST": "W",
        "WIND_DIRECTION_NORTHWEST": "NW",
    };
    return map[dirString] || dirString.replace("WIND_DIRECTION_", "");
}

function getConditionsLabel(condString: string) {
    // google weather returns a uri like "https://.../v1/mostly_sunny" or "mostly_sunny"
    let label = condString.split("/").pop() || "";
    label = label.replace(/_/g, " ");
    return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        // Deterministic mock if no API key
        const seed = Math.abs(lat * lon);
        return {
            temperature: Math.round((seed % 30) + 10), // 10 to 40 C
            conditions: "Partly Cloudy",
            windSpeed: Math.round((seed % 20) + 5), // 5 to 25 km/h
            windDirection: "NW",
        };
    }

    try {
        const res = await fetch(
            `https://weather.googleapis.com/v1/currentConditions:lookup?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                next: { revalidate: 0 }, // Always fresh, no cache
            }
        );

        if (!res.ok) throw new Error("Google Weather API error");
        const data = await res.json();

        return {
            temperature: data.temperatureChange?.degrees || data.temperature?.degrees || 0,
            conditions: getConditionsLabel(data.icon || ""),
            windSpeed: data.windSpeed?.speed || 0,
            windDirection: getWindDirectionLabel(data.windSpeed?.direction || ""),
        };

    } catch (e) {
        console.error(e);
        return {
            temperature: 0,
            conditions: "Unknown",
            windSpeed: 0,
            windDirection: "N/A"
        };
    }
}

export default async function WeatherWidget({
    lat,
    lon,
    city,
}: {
    lat: number;
    lon: number;
    city: string;
}) {
    await connection(); // Opt out of prerendering proactively
    const data = await fetchWeather(lat, lon);

    // Celsius to Fahrenheit convenience
    const tempF = Math.round((data.temperature * 9) / 5 + 32);

    return (
        <div className="aqi-widget" style={{ marginBottom: "1.5rem" }}>
            <div className="aqi-title">Live Weather — {city}</div>
            <div className="aqi-row">
                <span className="aqi-metric">Conditions</span>
                <span className="aqi-val" style={{ color: "var(--color-primary)" }}>{data.conditions || "Clear"}</span>
            </div>
            <div className="aqi-row">
                <span className="aqi-metric">Temperature</span>
                <span className="aqi-val" style={{ color: "var(--color-text)" }}>
                    {data.temperature}°C <span style={{ color: "var(--color-text-muted)", fontSize: "0.8em" }}>({tempF}°F)</span>
                </span>
            </div>
            <div className="aqi-row">
                <span className="aqi-metric">Wind</span>
                <span className="aqi-val" style={{ color: "var(--color-text)" }}>
                    {data.windSpeed} km/h {data.windDirection}
                </span>
            </div>
        </div>
    );
}
