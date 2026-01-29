import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
