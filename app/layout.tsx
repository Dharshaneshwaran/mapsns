import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { VisitorPresenceProvider } from "@/components/campus/VisitorPresence";
import "./globals.css";
import "./campus-ui.css";
import "./conference-theme.css";
import "./laptop.css";

const conferenceDisplay = localFont({ src: "../public/fonts/Anton-Regular.ttf", variable: "--font-conference", weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: "SNS Campus Navigator",
  description:
    "Interactive campus navigation for SNS College of Engineering",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SNS Campus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${conferenceDisplay.variable}`}
    >
      <body className="h-full w-full overflow-hidden touch-manipulation"><VisitorPresenceProvider>{children}</VisitorPresenceProvider></body>
    </html>
  );
}
