import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://colorwaysports.com"),
  title: "ColorWay Sports – All Things Sports, Besides The Game Itself",
  description:
    "All Things Sports, Besides The Game Itself. Covering uniforms, scorebugs, stadiums, and the visual design of sports.",
  openGraph: {
    title: "ColorWay Sports",
    description:
      "All Things Sports, Besides The Game Itself. Covering uniforms, scorebugs, stadiums, and the visual design of sports.",
    siteName: "ColorWay Sports",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ColorWay Sports",
    description:
      "All Things Sports, Besides The Game Itself. Covering uniforms, scorebugs, stadiums, and the visual design of sports.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="ColorWay Sports" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
