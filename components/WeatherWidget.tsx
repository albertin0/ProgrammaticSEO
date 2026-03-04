// Dynamic Weather Widget — no `use cache`, fetches live on every request (PPR dynamic slot)
// This component is wrapped in Suspense in the city page for Partial Pre-Rendering
import { connection } from "next/server";

interface WeatherData {
    temperature: number;
    conditions: string;
    windSpeed: number;
    windDirection: string;
}

function getWindDirectionLabel(degrees: number) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8;
    return directions[index];
}

function getConditionsLabel(code: number) {
    const map: Record<number, string> = {
        0: "Clear",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        77: "Snow Grains",
        80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
        85: "Slight Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorm",
        96: "Thunder Storm (Slight Hail)", 99: "Thunder Storm (Heavy Hail)"
    };
    return map[code] || "Unknown";
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                next: { revalidate: 0 }, // Always fresh, no cache
            }
        );

        if (!res.ok) throw new Error("Open-Meteo Weather API error");
        const data = await res.json();
        const current = data.current || {};

        return {
            temperature: current.temperature_2m || 0,
            conditions: getConditionsLabel(current.weather_code || 0),
            windSpeed: current.wind_speed_10m || 0,
            windDirection: getWindDirectionLabel(current.wind_direction_10m || 0),
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
