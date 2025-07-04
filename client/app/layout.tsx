import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, DM_Mono, Alex_Brush, Silkscreen } from "next/font/google";
import "@/assets/css/globals.css";
import { AppProviders } from "@/providers";
import GlobalLayout from "@/components/layouts/GlobalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Livus",
  description: "Livus",
};

const dmMono = DM_Mono({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const alexBrush = Alex_Brush({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-alex-brush",
});

const silkscreen = Silkscreen({
  weight: ["400", "700"], // Both available weights
  subsets: ["latin"],
  variable: "--font-silkscreen", // Custom CSS variable
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${geistSans.variable} ${geistMono.variable} ${alexBrush.variable} ${silkscreen.variable}`}>
      <body
        className={`bg-white text-gray-900 antialiased w-full min-h-screen overflow-x-hidden`}
      >
        <AppProviders>
          <GlobalLayout>{children}</GlobalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
