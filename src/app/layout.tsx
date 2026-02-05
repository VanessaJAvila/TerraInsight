import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "TerraInsight | EcoPulse AI",
  description: "Intelligent dashboard for ecological impact analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} font-sans bg-charcoal-950 text-charcoal-100 min-h-screen antialiased`}
        style={{ backgroundColor: "#18181b", color: "#eeeef0" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
