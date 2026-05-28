import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { generateSiteMetadata } from "@/lib/seo-metadata";
import { GoogleAnalytics } from "@/components/google-analytics";

const batonTurbo = localFont({
  variable: "--font-baton-turbo",
  src: [
    {
      path: "./fonts/BatonTurboWeb-Book.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/BatonTurboWeb-BookItalic.woff",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/BatonTurboWeb-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/BatonTurboWeb-RegularItalic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/BatonTurboWeb-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/BatonTurboWeb-MediumItalic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/BatonTurboWeb-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/BatonTurboWeb-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/BatonTurboWeb-Heavy.woff",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/BatonTurboWeb-HeavyItalic.woff",
      weight: "900",
      style: "italic",
    },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${batonTurbo.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
