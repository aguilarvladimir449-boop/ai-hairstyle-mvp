import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JUST FOR JJ",
  description: "AI hairstyle preview tool by JUST FOR JJ."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
