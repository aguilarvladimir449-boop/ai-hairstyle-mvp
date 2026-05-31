import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 换发型 MVP",
  description: "上传人像照片，选择或推荐发型，生成真实风格的发型预览。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
