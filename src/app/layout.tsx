import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Video Resolver",
  description: "Parse supported video links and download on your own device."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

