import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ProfileLinkBridge from "@/components/ProfileLinkBridge";
import TickerDarkModeToggle from "@/components/TickerDarkModeToggle";
import OfflineRuntime from "@/components/OfflineRuntime";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New Castle Cricket Scorer",
  description: "New Castle Cricket Scorer",
  manifest: "/manifest.webmanifest",
  themeColor: "#050505",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProfileLinkBridge />
        <TickerDarkModeToggle />
        <OfflineRuntime />
        {children}
      </body>
    </html>
  );
}
