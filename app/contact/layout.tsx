import type { Metadata } from "next";

// The contact page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Contact – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
