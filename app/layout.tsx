import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display, Hanken_Grotesk } from "next/font/google";
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

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.colorwaysports.com"),
  title: "ColorWay Sports – Every Jersey. Every Logo. Every Detail.",
  description:
    "Every Jersey. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
  openGraph: {
    title: "ColorWay Sports",
    description:
      "Every Jersey. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
    siteName: "ColorWay Sports",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ColorWay Sports",
    description:
      "Every Jersey. Every Logo. Every Detail. Covering uniforms, logos, scorebugs, stadiums, and the visual design of sports.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${hanken.variable}`}>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ColorWay Sports",
              "alternateName": "ColorWay",
              "url": "https://www.colorwaysports.com",
              "logo": "https://www.colorwaysports.com/brand/colorway-logo.jpg"
            })
          }}
        />
        {/* Mediavine ad script, installed verbatim from their dashboard.
            Deliberately a plain tag in <head> rather than next/script: with
            strategy="beforeInteractive" Next emits only a preload link plus a
            __next_s queue entry, so no literal <script src> tag appears in the
            server HTML for Mediavine's verifier to find. Load behaviour is
            equivalent, and this is what their install instructions specify. */}
        <script
          type="text/javascript"
          async
          data-noptimize="1"
          data-cfasync="false"
          src="//scripts.mediavine.com/tags/248fd8c4-77fb-4142-acb9-6610f6e7c3ea.js"
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
