import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Green Haven",
  description: "Green Haven restaurant platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
