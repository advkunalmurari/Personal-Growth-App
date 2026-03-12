import type { Metadata } from "next";
import localFont from "next/font/local";
import * as Sentry from '@sentry/nextjs';
import { CSPostHogProvider } from '@/components/analytics/PostHogProvider'
import PostHogPageView from '@/components/analytics/PostHogPageView'
import ConsentBanner from '@/components/legal/ConsentBanner'
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export function generateMetadata(): Metadata {
  return {
    title: "Life OS - Your Personal Growth Partner",
    description: "Your ultimate personal growth and productivity system.",
    manifest: "/manifest.json",
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CSPostHogProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <PostHogPageView />
          {children}
          <ConsentBanner />
        </body>
      </CSPostHogProvider>
    </html>
  );
}
