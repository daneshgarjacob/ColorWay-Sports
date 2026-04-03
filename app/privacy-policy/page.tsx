import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-16 animate-fade-in-up">
        {/* Hero section */}
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] font-medium mb-3">
            Legal
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-[-0.02em] mb-4">
            Privacy <span className="text-orange">Policy</span>
          </h1>
          <p className="text-lg text-gray-medium max-w-[600px] mx-auto leading-relaxed">
            Last updated: April 3, 2026
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-[3px] bg-orange mx-auto mb-12 rounded-full" />

        {/* Body */}
        <div className="space-y-8 text-[0.95rem] leading-[1.8] text-foreground">
          <section>
            <h2 className="text-xl font-bold text-black mb-3">Introduction</h2>
            <p>
              ColorWay Sports (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
              colorwaysports.com. This Privacy Policy explains how we collect, use, and protect
              your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Information We Collect</h2>
            <p className="mb-3">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Analytics Data:</strong> We use Google Analytics to collect anonymous
                usage data such as pages visited, time spent on site, browser type, device
                type, and general geographic location. This data is aggregated and does not
                personally identify you.
              </li>
              <li>
                <strong>Email Address:</strong> If you voluntarily subscribe to our newsletter
                through our email signup form, we collect your email address. This is managed
                through Mailchimp.
              </li>
              <li>
                <strong>Contact Form Submissions:</strong> If you reach out through our contact
                form, we receive the information you provide (name, email, and message).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To understand how visitors use our site and improve our content</li>
              <li>To send newsletters and updates to subscribers who have opted in</li>
              <li>To respond to inquiries submitted through our contact form</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Cookies and Tracking Technologies</h2>
            <p>
              Our website uses cookies and similar technologies through Google Analytics to
              collect anonymous usage data. These cookies help us understand traffic patterns
              and improve your experience. You can control cookie settings through your browser
              preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Analytics:</strong> For website traffic analysis.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Mailchimp:</strong> For email newsletter delivery.{" "}
                <a
                  href="https://www.intuit.com/privacy/statement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Mailchimp&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Amazon Associates:</strong> We participate in the Amazon Associates
                Program, an affiliate advertising program. Links to Amazon products may contain
                affiliate tracking codes.
              </li>
              <li>
                <strong>Google AdSense:</strong> We may display ads through Google AdSense,
                which uses cookies to serve ads based on your visits to this and other websites.
                You can opt out of personalized advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Google Ads Settings
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Affiliate Links</h2>
            <p>
              Some links on our site are affiliate links, meaning we may earn a small commission
              if you make a purchase through them. This does not affect the price you pay. We
              only recommend products relevant to our content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Data Security</h2>
            <p>
              We take reasonable measures to protect the information we collect. Our website is
              served over HTTPS to ensure secure data transmission. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Unsubscribe from our newsletter at any time using the link in each email</li>
              <li>Request deletion of any personal information we hold about you</li>
              <li>Opt out of Google Analytics tracking by using the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Children&apos;s Privacy</h2>
            <p>
              Our website is not directed at children under the age of 13. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted
              on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a
                href="mailto:daneshgarjacob@gmail.com"
                className="text-orange hover:underline"
              >
                daneshgarjacob@gmail.com
              </a>{" "}
              or through our{" "}
              <a href="/contact" className="text-orange hover:underline">
                Contact page
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
