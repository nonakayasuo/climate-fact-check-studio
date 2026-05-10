import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climate Fact-Check Studio",
  description: "Research prototype for Japanese climate journalism fact-check assistance."
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
