import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Restaurant Platform",
  description: "Discover restaurants and browse menus",
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
