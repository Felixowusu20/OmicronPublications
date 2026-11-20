import type { Metadata, Viewport } from "next";
import { EB_Garamond, Libre_Baskerville, Outfit } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { AosProvider } from "@/components/aos-provider";
import { CookieConsentGate } from "@/components/cookie-consent-gate";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { seoBaseUrl } from "@/lib/seo/scholar";
import "./globals.css";

/**
 * Classic publishing-house body face — bookish, journal-like reading text.
 */
const body = EB_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

/**
 * Traditional display serif for titles — old imprint / letterpress feel.
 */
const display = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

/** Brand lockup face for the Omicron wordmark only. */
const brand = Outfit({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(seoBaseUrl()),
  title: {
    default: "Omicron Publications",
    template: "%s | Omicron Publications",
  },
  description:
    "Peer-reviewed open-access journals in chemistry, biology, physics, and related fields. Submit manuscripts, track peer review, and discover scholarly articles with OID-backed records.",
  applicationName: "Omicron Publications",
  keywords: [
    "Omicron Publications",
    "open access journals",
    "peer review",
    "scholarly publishing",
    "OID",
    "chemistry",
    "biology",
    "physics",
  ],
  authors: [{ name: "Omicron Publications" }],
  openGraph: {
    type: "website",
    siteName: "Omicron Publications",
    title: "Omicron Publications",
    description:
      "Peer-reviewed open-access journals and scholarly articles.",
    url: seoBaseUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Omicron Publications",
    description:
      "Peer-reviewed open-access journals and scholarly articles.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${brand.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AosProvider>
            <SiteHeader />
            <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
            <SiteFooter />
            <CookieConsentGate />
          </AosProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
