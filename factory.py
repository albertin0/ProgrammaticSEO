#!/usr/bin/env python3
"""
factory.py — Local Allergy-Safe Fitness Data Pipeline
======================================================
Reads cities.csv, fetches Pollen + AQI from Ambee API,
passes data to Gemini Flash with Search Grounding,
and writes SEO-optimized MDX files to /vault/[country]/[state]/[city].mdx

Usage:
  python factory.py            # Full run (requires GEMINI_API_KEY + AMBEE_API_KEY)
  python factory.py --dry-run  # Generate mock MDX without real API calls
  python factory.py --city Austin --state Texas --country us  # Single city
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv
import google.generativeai as genai

# ── Config ──────────────────────────────────────────────────────────
load_dotenv()

GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY", "")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
VAULT_DIR           = Path(__file__).parent / "vault"
CITIES_CSV          = Path(__file__).parent / "cities.csv"
MODEL_NAME          = "gemini-2.0-flash"

# Anti-detection system persona (cynical local marathon runner + PT)
SYSTEM_PROMPT = """
You are a slightly cynical but highly knowledgeable local marathon runner who also happens to have a physical therapy degree.
You write brutally honest, hyper-local workout safety guides for your city.

PERSONA RULES:
- You're NOT a corporate wellness blogger. You're a real human who actually runs these trails.
- You reference specific LOCAL landmarks, streets, or parks by name.
- You have opinions. Share them.

FORBIDDEN PHRASES (never use these):
- "In summary,"
- "Unlocking the potential"
- "In this fast-paced world"
- "It's important to note"
- "Delve into"
- "As an AI"
- "I cannot provide"

CONTENT STRUCTURE:
1. Start with a one-sentence opinion on whether today is a good day to work out outside.
2. Use a "Lungs & Joints Score" (1-10) to rate the day. Include it as <LungsJointsScore score={N} />.
3. Write 2-3 short bullet points inside a <BulletList> component for "Why today is/isn't the day."
4. Reference ONE specific local landmark from the search grounding results (e.g., trails, parks, bridges).
5. Use <AlertBox type="warning"> for moderate hazards, <AlertBox type="danger"> for severe ones, <AlertBox type="info"> for tips.

MDX FORMAT:
- Use ## for sections, ### for sub-sections
- Use standard markdown tables for pollen breakdown
- Custom components: <AlertBox type="warning|danger|info|success">, <BulletList>, <LungsJointsScore score={N} />
- End with a one-line italic attribution: *Data grounded with [local news source] from [date].*
"""

CITY_PROMPT_TEMPLATE = """
City: {city}, {state}, {country}
Today's Date: {today}

Ambee API Data:
{ambee_data}

Your task:
1. Use Google Search grounding to find news from the last 24 hours about workout hazards in {city} 
   (smoke, wildfires, construction, high winds, flooding, extreme heat/cold, events blocking trails).
2. Cross-reference the Ambee pollen/AQI data with what you found.
3. Write a complete MDX article body (NO frontmatter — that will be added separately).
4. The article must be between 350–550 words.
5. Mention at least one specific local landmark or trail by name.
6. Follow the persona and structure rules in your system prompt exactly.

Write the MDX content now:
"""

# ── Google Maps APIs ────────────────────────────────────────────────────────

def fetch_google_pollen(lat: float, lon: float) -> dict:
    if not GOOGLE_MAPS_API_KEY:
        return _mock_pollen(lat, lon)
    try:
        r = requests.get(
            f"https://pollen.googleapis.com/v1/forecast:lookup?key={GOOGLE_MAPS_API_KEY}&location.latitude={lat}&location.longitude={lon}&days=1",
            timeout=10,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  ⚠️  Google Pollen API error: {e} — using mock data")
        return _mock_pollen(lat, lon)


def fetch_google_aqi(lat: float, lon: float) -> dict:
    if not GOOGLE_MAPS_API_KEY:
        return _mock_aqi(lat, lon)
    try:
        r = requests.post(
            f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={GOOGLE_MAPS_API_KEY}",
            json={
                "location": {"latitude": lat, "longitude": lon},
                "extraComputations": ["HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION"]
            },
            timeout=10,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  ⚠️  Google AQI API error: {e} — using mock data")
        return _mock_aqi(lat, lon)


def _mock_pollen(lat: float, lon: float) -> dict:
    seed = abs(lat * lon) % 10
    levels = ["None", "Low", "Moderate", "High", "Very High"]
    lvl = levels[int(seed) % 4 + 1]  # skip "None" for mock variety
    return {
        "dailyInfo": [{
            "pollenTypeInfo": [
                {"code": "TREE", "indexInfo": {"category": lvl}},
                {"code": "GRASS", "indexInfo": {"category": lvl}}
            ]
        }]
    }


def _mock_aqi(lat: float, lon: float) -> dict:
    seed = int(abs(lat * lon * 1000) % 150)
    return {
        "indexes": [{"code": "uaqi", "aqi": seed + 10, "category": "Good", "dominantPollutant": "pm25"}],
        "pollutants": [{"code": "pm25", "fullName": "PM2.5"}]
    }


def extract_pollen_summary(pollen_data: dict) -> str:
    try:
        types = pollen_data.get("dailyInfo", [])[0].get("pollenTypeInfo", [])
        levels = {"None": 0, "Low": 1, "Moderate": 2, "High": 3, "Very High": 4}
        worst_level = "Low"
        for t in types:
            cat = t.get("indexInfo", {}).get("category", "Low")
            if levels.get(cat, 0) > levels.get(worst_level, 0):
                worst_level = cat
        return worst_level
    except Exception:
        return "Low"


def extract_aqi_summary(aqi_data: dict) -> tuple[int, str]:
    try:
        indexes = aqi_data.get("indexes", [])
        uaqi = next((i for i in indexes if i.get("code") == "uaqi"), indexes[0] if indexes else {})
        aqi_val = uaqi.get("aqi", 0)
        
        dom_pol_code = uaqi.get("dominantPollutant", "Unknown")
        pollutants = aqi_data.get("pollutants", [])
        dom_pol_name = next((p.get("fullName", dom_pol_code) for p in pollutants if p.get("code") == dom_pol_code), dom_pol_code)
        
        return aqi_val, dom_pol_name
    except Exception:
        return 0, "Unknown"


# ── Gemini ───────────────────────────────────────────────────────────

def generate_mdx_content(city: str, state: str, country: str, ambee_summary: str, dry_run: bool) -> str:
    if dry_run:
        return _mock_mdx_content(city)

    if not GEMINI_API_KEY:
        print("  ⚠️  No GEMINI_API_KEY — using mock MDX content")
        return _mock_mdx_content(city)

    genai.configure(api_key=GEMINI_API_KEY)

    # Enable Search Grounding tool
    search_tool = genai.protos.Tool(
        google_search=genai.protos.GoogleSearch()
    )

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
        tools=[search_tool],
    )

    prompt = CITY_PROMPT_TEMPLATE.format(
        city=city,
        state=state,
        country=country.upper(),
        today=datetime.now(timezone.utc).strftime("%B %d, %Y"),
        ambee_data=ambee_summary, # keeping the variable name for the prompt template
    )

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"  ⚠️  Gemini error: {e} — using mock content")
        return _mock_mdx_content(city)


def _mock_mdx_content(city: str) -> str:
    return f"""## Today in {city} — Dry Run Mode

This content was generated in `--dry-run` mode. Run without `--dry-run` and with valid API keys to get real AI-grounded content.

<LungsJointsScore score={{7}} />

### Why Today Is the Day

<BulletList>
  <li>AQI is in the "Good" range — your lungs are safe.</li>
  <li>Pollen is moderate — take an antihistamine if you're sensitive.</li>
  <li>No major weather events reported in the last 24 hours.</li>
</BulletList>

<AlertBox type="info">
  **Dry Run Mode:** This is placeholder content. Add your `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` to `.env` and run `python factory.py` for live, AI-grounded guides.
</AlertBox>

## Workout Recommendations

Head outside with confidence today. Just keep an eye on the afternoon UV index.

*Data grounded in dry-run mode — {datetime.now(timezone.utc).strftime("%B %d, %Y")}.*
"""


# ── MDX Writer ───────────────────────────────────────────────────────

def build_frontmatter(
    city: str, state: str, country: str, lat: float, lon: float,
    pollen_level: str, aqi: int, dominant_pollutant: str, lungs_score: int,
) -> str:
    slug_city = re.sub(r"[^a-z0-9]+", "-", city.lower()).strip("-")
    slug_state = re.sub(r"[^a-z0-9]+", "-", state.lower()).strip("-")
    slug_country = country.lower()
    canonical = f"https://healthislife.work/workout-safety/{slug_country}/{slug_state}/{slug_city}"

    tags = [
        "outdoor workout", "air quality", "pollen",
        slug_city.replace("-", " "), slug_state.replace("-", " "),
        slug_country,
    ]

    fm = {
        "title": f"{city}, {state} Workout Safety Guide — Pollen & Air Quality",
        "description": f"Should you work out outside in {city} today? Your local AI-grounded pollen, AQI, and workout hazard score — updated every 10 minutes.",
        "city": city,
        "state": state,
        "country": slug_country,
        "lat": lat,
        "lon": lon,
        "lungsJointsScore": lungs_score,
        "pollenLevel": pollen_level,
        "aqi": aqi,
        "dominantPollutant": dominant_pollutant,
        "lastUpdated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "tags": tags,
        "canonicalUrl": canonical,
    }

    lines = ["---"]
    for k, v in fm.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f'  - "{item}"')
        elif isinstance(v, str):
            lines.append(f'{k}: "{v}"')
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)


def calc_lungs_score(aqi: int, pollen_level: str) -> int:
    pollen_penalty = {"Low": 0, "Moderate": 1, "High": 2, "Very High": 3}.get(pollen_level, 0)
    aqi_penalty = 0 if aqi <= 50 else 1 if aqi <= 100 else 2 if aqi <= 150 else 4
    raw = 10 - pollen_penalty - aqi_penalty
    return max(1, min(10, raw))


def write_mdx(city: str, state: str, country: str, frontmatter: str, content: str):
    slug_city = re.sub(r"[^a-z0-9]+", "-", city.lower()).strip("-")
    slug_state = re.sub(r"[^a-z0-9]+", "-", state.lower()).strip("-")
    slug_country = country.lower()

    out_dir = VAULT_DIR / slug_country / slug_state
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{slug_city}.mdx"

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(frontmatter + "\n\n" + content.strip() + "\n")

    print(f"  ✅ Written: vault/{slug_country}/{slug_state}/{slug_city}.mdx")


# ── Main Pipeline ────────────────────────────────────────────────────

def process_city(row: dict, dry_run: bool):
    city    = row["city"].strip()
    state   = row["state"].strip()
    country = row["country"].strip().lower()
    lat     = float(row["lat"])
    lon     = float(row["lon"])

    print(f"\n🏙️  Processing: {city}, {state}, {country.upper()}")

    # Fetch Google data
    pollen_data = fetch_google_pollen(lat, lon)
    aqi_data    = fetch_google_aqi(lat, lon)

    pollen_level = extract_pollen_summary(pollen_data)
    aqi, dominant_pollutant = extract_aqi_summary(aqi_data)
    lungs_score = calc_lungs_score(aqi, pollen_level)

    ambee_summary = json.dumps({
        "pollen": {"level": pollen_level},
        "air_quality": {"AQI": aqi, "Dominant_Pollutant": dominant_pollutant},
    }, indent=2)

    print(f"  📊 Pollen: {pollen_level} | AQI: {aqi} | Score: {lungs_score}/10")

    # Generate MDX content via Gemini
    content = generate_mdx_content(city, state, country, ambee_summary, dry_run)

    # Build frontmatter
    frontmatter = build_frontmatter(city, state, country, lat, lon, pollen_level, aqi, dominant_pollutant, lungs_score)

    # Write file
    write_mdx(city, state, country, frontmatter, content)

    # Rate limiting — be polite to APIs
    if not dry_run:
        time.sleep(2)


def main():
    parser = argparse.ArgumentParser(description="Local Allergy-Safe Fitness MDX Factory")
    parser.add_argument("--dry-run", action="store_true", help="Skip real API calls, generate mock MDX")
    parser.add_argument("--city", help="Process a single city")
    parser.add_argument("--state", help="State for single-city mode")
    parser.add_argument("--country", default="us", help="Country code for single-city mode")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of cities processed (0 = all)")
    args = parser.parse_args()

    if args.dry_run:
        print("🧪 DRY RUN MODE — No real API calls will be made\n")

    if args.city:
        if not args.state:
            print("❌ --state is required with --city")
            sys.exit(1)
        row = {"city": args.city, "state": args.state, "country": args.country, "lat": "0.0", "lon": "0.0"}
        process_city(row, args.dry_run)
        return

    if not CITIES_CSV.exists():
        print(f"❌ {CITIES_CSV} not found. Creating a sample...")
        sys.exit(1)

    with open(CITIES_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cities = list(reader)

    total = len(cities) if not args.limit else min(args.limit, len(cities))
    print(f"🚀 Processing {total} cities...\n")

    for i, row in enumerate(cities[:total]):
        try:
            process_city(row, args.dry_run)
        except Exception as e:
            print(f"  ❌ Error processing {row.get('city', '?')}: {e}")
            continue

    print(f"\n✨ Done! Generated MDX files in /vault/")


if __name__ == "__main__":
    main()
