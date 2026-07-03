import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "超级视频解析",
  description: "解析支持的视频链接，在用户自己的设备上下载或合并。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
