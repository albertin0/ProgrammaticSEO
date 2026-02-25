import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Local Allergy-Safe Fitness",
    default: "Local Allergy-Safe Fitness — Workout Safety by City",
  },
  description:
    "Real-time pollen, air quality, and workout safety scores for 500+ US and Canadian cities. Know before you go.",
  keywords: ["allergy safe workout", "outdoor exercise air quality", "pollen fitness guide"],
  authors: [{ name: "Local Allergy-Safe Fitness" }],
  metadataBase: new URL("https://healthislife.work"),
  openGraph: {
    type: "website",
    siteName: "Local Allergy-Safe Fitness",
    locale: "en_US",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Local Allergy-Safe Fitness",
  description:
    "Hyperlocal workout safety guides powered by real-time pollen and air quality data.",
  url: "https://healthislife.work",
  sameAs: ["https://healthislife.work"],
};

const healthTopicSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Allergy-Safe Outdoor Fitness",
  description:
    "Data-driven outdoor workout safety guides accounting for pollen, AQI, and local environmental hazards.",
  url: "https://healthislife.work",
  about: {
    "@type": "MedicalCondition",
    name: "Allergic Rhinitis",
    alternateName: "Seasonal Allergies",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XTVL2JMDH8"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-XTVL2JMDH8');
        ` }} />
        {/* JSON-LD Schemas */}
        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(healthTopicSchema) }}
        />
      </head>
      <body>
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-inner">
            <Link href="/" className="navbar-logo">
              🌿 AllergyFitness
            </Link>
            <span className="navbar-tagline">Real-time workout safety for your city</span>
          </div>
        </nav>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 Local Allergy-Safe Fitness · Data updated every 10 minutes</p>
          <p style={{ marginTop: "0.35rem" }}>
            Pollen &amp; AQI via Google Maps API · Content grounded by Gemini AI with live search
          </p>
        </footer>
      </body>
    </html>
  );
}
