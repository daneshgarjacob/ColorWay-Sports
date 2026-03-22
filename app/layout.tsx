import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ColorWay Sports – All Things Sports, Besides The Game Itself",
  description:
    "All Things Sports, Besides The Game Itself. Covering uniforms, scorebugs, stadiums, and the visual design of sports.",
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
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
