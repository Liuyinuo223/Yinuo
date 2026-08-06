import type { Metadata } from "next";
import "./globals.css";

const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = process.env.SITE_URL
  ? new URL(process.env.SITE_URL)
  : deploymentHost
    ? new URL(`https://${deploymentHost}`)
    : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: "A Branch of Summer | A Bayberry Rubbing",
  description: "Pick a bayberry and preserve a Jiangnan summer through a virtual rubbing.",
  openGraph: {
    title: "A Branch of Summer | A Bayberry Rubbing",
    description: "Pick a bayberry and preserve a Jiangnan summer through a virtual rubbing.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A Branch of Summer | A Bayberry Rubbing",
    description: "Pick a bayberry and preserve a Jiangnan summer through a virtual rubbing.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
