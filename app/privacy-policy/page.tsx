import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy – ColorWay Sports",
  alternates: {
    canonical: "https://www.colorwaysports.com/privacy-policy",
  },
};

// Verbatim from https://help.mediavine.com/privacy-policy-language (Ver 1.1).
// Required by Mediavine for ad-partner compliance. Do not edit the wording.
const MEDIAVINE_PRIVACY_HTML = `<h3>Mediavine Programmatic Advertising (Ver 1.1)</h3><p>The Website works with Mediavine to manage third-party interest-based advertising appearing on the Website. Mediavine serves content and advertisements when you visit the Website, which may use first and third-party cookies. A cookie is a small text file which is sent to your computer or mobile device (referred to in this policy as a “device”) by the web server so that a website can remember some information about your browsing activity on the Website.</p><p>First party cookies are created by the website that you are visiting. A third-party cookie is frequently used in behavioral advertising and analytics and is created by a domain other than the website you are visiting. Third-party cookies, tags, pixels, beacons and other similar technologies (collectively, “Tags”) may be placed on the Website to monitor interaction with advertising content and to target and optimize advertising. Each internet browser has functionality so that you can block both first and third-party cookies and clear your browser’s cache. The "help" feature of the menu bar on most browsers will tell you how to stop accepting new cookies, how to receive notification of new cookies, how to disable existing cookies and how to clear your browser’s cache. For more information about cookies and how to disable them, you can consult the information at <a href="https://www.allaboutcookies.org/manage-cookies/" target="_blank" rel="noreferrer noopener nofollow">All About Cookies</a>.</p><p>Without cookies you may not be able to take full advantage of the Website content and features. Please note that rejecting cookies does not mean that you will no longer see ads when you visit our Site. In the event you opt-out, you will still see non-personalized advertisements on the Website.</p><p>The Website collects the following data using a cookie when serving personalized ads:</p><ul><li>IP Address</li><li>Operating System type</li><li>Operating System version</li><li>Device Type</li><li>Language of the website</li><li>Web browser type</li><li>Email (in hashed form)</li></ul><p>Mediavine Partners (companies listed below with whom Mediavine shares data) may also use this data to link to other end user information the partner has independently collected to deliver targeted advertisements. Mediavine Partners may also separately collect data about end users from other sources, such as advertising IDs or pixels, and link that data to data collected from Mediavine publishers in order to provide interest-based advertising across your online experience, including devices, browsers and apps. This data includes usage data, cookie information, device information, information about interactions between users and advertisements and websites, geolocation data, traffic data, and information about a visitor’s referral source to a particular website. Mediavine Partners may also create unique IDs to create audience segments, which are used to provide targeted advertising.</p><p>If you would like more information about this practice and to know your choices to opt-in or opt-out of this data collection, please visit <a href="https://thenai.org/opt-out/" target="_blank" rel="noreferrer noopener nofollow">National Advertising Initiative opt out page</a>. You may also visit <a href="http://optout.aboutads.info/#/" target="_blank" rel="noreferrer noopener nofollow">Digital Advertising Alliance website</a> and <a href="http://optout.networkadvertising.org/#" target="_blank" rel="noreferrer noopener nofollow">Network Advertising Initiative website</a> to learn more information about interest-based advertising. You may download the AppChoices app at <a href="https://youradchoices.com/appchoices" target="_blank" rel="noreferrer noopener nofollow">Digital Advertising Alliance’s AppChoices app</a> to opt out in connection with mobile apps, or use the platform controls on your mobile device to opt out.</p><p>For specific information about Mediavine Partners, the data each collects and their data collection and privacy policies, please visit <a href="https://www.mediavine.com/ad-partners/" target="_blank" rel="noreferrer noopener nofollow">Mediavine Partners</a>.</p>`;

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
            Last updated: August 19, 2026
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
                <strong>Fanatics:</strong> We participate in the Fanatics affiliate program.
                Links to jerseys and other merchandise may contain affiliate tracking codes.{" "}
                <a
                  href="https://www.fanatics.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Fanatics&apos; Privacy Policy
                </a>
              </li>
              <li>
                <strong>Fubo:</strong> We participate in the Fubo affiliate program. Links to
                streaming subscriptions may contain affiliate tracking codes.{" "}
                <a
                  href="https://legal.fubo.tv/policies/en-US/?name=privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Fubo&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Amazon Associates:</strong> We participate in the Amazon Associates
                Program, an affiliate advertising program. Links to Amazon products may contain
                affiliate tracking codes.
              </li>
              <li>
                <strong>Mediavine:</strong> We use Mediavine to manage the display advertising
                on this site. Mediavine and its advertising partners may use cookies and similar
                technologies to serve and measure ads, including personalized advertising based
                on your browsing. We do not use Google AdSense.{" "}
                <a
                  href="https://www.mediavine.com/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Mediavine&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Your advertising choices:</strong> You can manage your consent
                preferences at any time using the privacy settings link Mediavine provides on
                this site. You can also opt out of personalized advertising industry-wide
                through the{" "}
                <a
                  href="https://optout.aboutads.info/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Digital Advertising Alliance
                </a>{" "}
                or the{" "}
                <a
                  href="https://www.networkadvertising.org/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  Network Advertising Initiative
                </a>.
              </li>
            </ul>
          </section>

          {/*
            Mediavine's required programmatic advertising disclosure, reproduced VERBATIM from
            https://help.mediavine.com/privacy-policy-language and injected as raw HTML so it
            cannot drift. Their doc is explicit that the whole block is required "INCLUDING THE
            SUBJECT LINE WITH THE VERSION NUMBER", so do not reword it, do not drop the
            "(Ver 1.1)" heading, and do not remove any of the NAI / DAA / AppChoices opt-out
            links. If Mediavine publishes a new version, replace this string wholesale and bump
            the version in the heading with it.

            The [&_x] classes only style their markup to match the rest of the page; they do not
            change the text.
          */}
          <section
            className="[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-black [&_h3]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-orange [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: MEDIAVINE_PRIVACY_HTML }}
          />

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
                href="mailto:jake@colorwaysports.com"
                className="text-orange hover:underline"
              >
                jake@colorwaysports.com
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
