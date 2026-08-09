import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from '@/providers/app-providers';
import { ThemeScript } from '@/lib/theme/theme-script';

export const metadata: Metadata = {
  title: "Tablefolk",
  description: "Your reservations, orders, and dining preferences in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
