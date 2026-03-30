import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.colorwaysports.com"),
  alternates: {
    canonical: "https://www.colorwaysports.com",
  },
  title: "ColorWay Sports – Every Uniform. Every Logo. Every Detail.",
  description:
    "Every Uniform. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
  openGraph: {
    title: "ColorWay Sports",
    description:
      "Every Uniform. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
    siteName: "ColorWay Sports",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ColorWay Sports",
    description:
      "Every Uniform. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RKP192Y1DM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RKP192Y1DM');
          `}
        </Script>
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
