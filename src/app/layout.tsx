import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Koshora — Clarity for every rupee", template: "%s · Koshora" },
  description: "A premium personal-finance workspace for spending, budgets, goals and explainable cash-flow insights.",
  applicationName: "Koshora",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Koshora — Clarity for every rupee",
    description: "See where your money went, what is changing, and what is likely to happen next.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
