"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window.gtag === "function") {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
            window.gtag("config", "G-XTVL2JMDH8", {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);

    return null;
}

export default function GoogleAnalytics() {
    return (
        <>
            <Script
                strategy="afterInteractive"
                src="https://www.googletagmanager.com/gtag/js?id=G-XTVL2JMDH8"
            />
            <Script
                id="gtag-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-XTVL2JMDH8');
          `,
                }}
            />
            <Suspense fallback={null}>
                <AnalyticsTracker />
            </Suspense>
        </>
    );
}
