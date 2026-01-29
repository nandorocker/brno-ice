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

export const metadata: Metadata = {
  title: "Brno Reservoir Skating Conditions",
  description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${bodyFont.variable} ${titleFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
