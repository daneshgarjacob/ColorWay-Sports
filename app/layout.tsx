import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import EmailCapture from "@/components/EmailCapture";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="ColorWay Sports" />
        <meta name="impact-site-verification" content="d7f27018-e02f-435c-8b26-94ff434d2e4c" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ColorWay Sports",
              "alternateName": "ColorWay",
              "url": "https://www.colorwaysports.com"
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <EmailCapture />
        <CookieConsent />
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
        <Script id="grow-me" strategy="afterInteractive" data-grow-initializer="">
          {`!(function(){window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));var e=document.createElement("script");(e.type="text/javascript"),(e.src="https://faves.grow.me/main.js"),(e.defer=!0),e.setAttribute("data-grow-faves-site-id","U2l0ZTplOGYwYTcxYy0yYzk3LTQ0NGItODFjYS03MzY4ZTViZmFlMTQ=");var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t);})();`}
        </Script>
      </body>
    </html>
  );
}
