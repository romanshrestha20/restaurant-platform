import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from '@/providers/app-providers';
import { ThemeScript } from '@/lib/theme/theme-script';
import { DEFAULT_BRAND_ID, brandRegistry } from '@/lib/brand';

const brand = brandRegistry[DEFAULT_BRAND_ID];

export const metadata: Metadata = {
  title: brand.name,
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
      data-brand={brand.id}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders brand={brand.id}>{children}</AppProviders>
      </body>
    </html>
  );
}
