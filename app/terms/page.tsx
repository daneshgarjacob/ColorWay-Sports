import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/terms",
  },
};

export default function TermsPage() {
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
            Terms of <span className="text-orange">Service</span>
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
            <h2 className="text-xl font-bold text-black mb-3">Agreement to Terms</h2>
            <p>
              By accessing and using colorwaysports.com (&quot;the Site&quot;), operated by
              ColorWay Sports (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to
              be bound by these Terms of Service. If you do not agree with any part of these
              terms, please do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Use of Content</h2>
            <p className="mb-3">
              All content on this Site, including articles, images, graphics, logos, and design
              elements, is the property of ColorWay Sports or its content creators unless
              otherwise noted. You may:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Share links to our articles on social media and other platforms</li>
              <li>Quote brief excerpts with proper attribution and a link back to the original article</li>
            </ul>
            <p className="mt-3">You may not:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Reproduce, republish, or redistribute our content in full without written permission</li>
              <li>Use our content for commercial purposes without authorization</li>
              <li>Remove any copyright or attribution notices from our content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Image Attribution</h2>
            <p>
              Images used on this Site are sourced from official team media, press releases,
              and other publicly available materials. All images are attributed to their
              respective owners where applicable. Team logos, uniforms, and related branding
              are the intellectual property of their respective teams and leagues. If you
              believe any content infringes on your rights, please contact us and we will
              address it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Affiliate Links and Advertising</h2>
            <p>
              Some links on this Site are affiliate links, meaning we may earn a commission if
              you make a purchase through them. This does not influence our editorial content
              or opinions. We are a participant in the Amazon Services LLC Associates Program
              and other affiliate programs. The Site may also display advertisements through
              third-party ad networks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">User Submissions</h2>
            <p>
              If you submit content to us through our contact form, email, or any other means
              (tips, feedback, photos), you grant ColorWay Sports the right to use that content
              in our coverage. We will provide attribution when appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Disclaimer</h2>
            <p>
              The content on this Site is provided for informational and entertainment purposes
              only. ColorWay Sports is an independent media outlet and is not affiliated with
              any professional sports league, team, or brand unless explicitly stated. Opinions
              expressed in our articles are those of the authors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Limitation of Liability</h2>
            <p>
              ColorWay Sports is not liable for any damages arising from your use of the Site
              or reliance on any information provided. The Site is provided &quot;as is&quot;
              without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Changes to These Terms</h2>
            <p>
              We reserve the right to update these Terms of Service at any time. Changes will
              be posted on this page with an updated revision date. Continued use of the Site
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, reach out at{" "}
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
