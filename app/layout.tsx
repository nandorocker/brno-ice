import type { Metadata } from "next";
import { Space_Grotesk, Baloo_2 } from "next/font/google";
import "./globals.css";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const titleFont = Baloo_2({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-title",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Můžu bruslit na Prýglu?",
  description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
  applicationName: "Prygl Ice Status",
  keywords: [
    "Brno",
    "Brněnská přehrada",
    "Prygl",
    "ice skating",
    "ice thickness",
    "ice status",
    "skating safety",
  ],
  authors: [{ name: "Nando", url: "https://nan.do" }],
  creator: "Nando",
  publisher: "Nando",
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
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Můžu bruslit na Prýglu?",
    description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
    siteName: "Prygl Ice Status",
    locale: "cs_CZ",
    alternateLocale: ["en_US"],
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Prygl ice status",
      },
      {
        url: "/og-square.png",
        width: 512,
        height: 512,
        alt: "Prygl ice status",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Můžu bruslit na Prýglu?",
    description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prygl Ice Status",
    url: siteUrl,
    description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
    inLanguage: ["cs-CZ", "en-US"],
    publisher: {
      "@type": "Person",
      name: "Nando",
      url: "https://nan.do",
    },
  };

  return (
    <html lang="cs">
      <body className={`${bodyFont.variable} ${titleFont.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
