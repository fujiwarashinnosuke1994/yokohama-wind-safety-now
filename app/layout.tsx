import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yokohama Wind & Safety Now",
  description: "横浜市中心部の現在風速と強風リスクを見える化する防災・シビックテック OSS",
  applicationName: "Yokohama Wind & Safety Now",
  openGraph: {
    title: "Yokohama Wind & Safety Now",
    description: "横浜市の風速・風向をスマホで確認できる強風リスク見える化ツール",
    type: "website",
    locale: "ja_JP"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
