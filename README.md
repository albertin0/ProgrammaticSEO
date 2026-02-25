# Local Allergy-Safe Fitness

A high-performance programmatic SEO site that generates hyper-local, daily workout safety guides for 500+ US and Canadian cities. 

Powered by **Next.js 16 (PPR)**, **Ambee APIs** (Pollen/AQI), and **Gemini 2.0 Flash** with live Search Grounding to bypass AI detection and provide genuine local insight.

## Architecture
- **Next.js 16**: App Router using `cacheComponents` (PPR)
- **Data Vault Pattern**: Python script grabs live data and generates static `.mdx` files into `/vault/`.
- **Hybrid Rendering**: The core article is statically cached (fast edge delivery), but the `<AirQualityWidget>` loads live data dynamically inside a Suspense boundary.
- **Automation**: GitHub Actions (`pulse.yml`) runs the Python factory script every 10 minutes to auto-commit fresh guides.

## Local Setup

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in your API keys:
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/)
- `AMBEE_API_KEY`: Get from [Ambee](https://www.getambee.com/)

### 3. Generate Seed Data
You can run the Python pipeline in `--dry-run` mode to safely generate mock `.mdx` content without using API credits:
```bash
python -m pip install -r requirements.txt
python factory.py --dry-run
```
*(Or drop `--dry-run` to fetch live data and Gemini AI content)*

### 4. Run the Dev Server
```bash
npm run dev
npx next build > build_output_gtag.txt 2>&1; Get-Content build_output_gtag.txt
```
Open [http://localhost:3000](http://localhost:3000) or deploy to your domain (target: `healthislife.work`).

## Deployment (Vercel)
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. In Vercel Settings > Git > Deploy Hooks, create a hook named "Pulse Action".
4. Copy the hook URL and add it to your GitHub Repository Secrets as `VERCEL_DEPLOY_HOOK`.
5. Add `GEMINI_API_KEY` and `AMBEE_API_KEY` to GitHub Secrets so the Action can run.
