import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNS College 3D Campus",
  description: "Interactive 3D campus map with GPS walking – SNS College of Technology",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SNS Campus",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#06b6d4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
