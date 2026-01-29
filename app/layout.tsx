import type { Metadata } from "next";
import { Sora, Unbounded } from "next/font/google";
import "./globals.css";

const bodyFont = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const titleFont = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-title",
});

export const metadata: Metadata = {
  title: "Brno Reservoir Skating Conditions",
  description: "Real-time ice skating status for Brněnská přehrada (Prygl).",
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
