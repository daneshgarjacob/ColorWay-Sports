"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ContactForm() {
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "true";

  return (
    <main className="max-w-[800px] mx-auto px-5 py-16 animate-fade-in-up">
      {/* Hero section */}
      <div className="text-center mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A8F98] font-medium mb-3">
          Contact
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-[-0.02em] mb-4">
          Get In <span className="text-orange">Touch</span>
        </h1>
        <p className="text-lg text-gray-medium max-w-[500px] mx-auto leading-relaxed">
          Have a tip, feedback, or want to collaborate? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Divider */}
      <div className="w-12 h-[3px] bg-orange mx-auto mb-10 rounded-full" />

      {sent && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-5 mb-10 text-center">
          <p className="text-green-800 font-semibold text-sm">Message sent! We&apos;ll get back to you soon.</p>
        </div>
      )}

      <form
        action="https://formsubmit.co/daneshgarjacob@gmail.com"
        method="POST"
        className="space-y-6 max-w-[600px] mx-auto"
      >
        {/* Honeypot spam prevention */}
        <input type="text" name="_honey" style={{ display: "none" }} />
        {/* Disable captcha page */}
        <input type="hidden" name="_captcha" value="false" />
        {/* Redirect back to contact page with success param */}
        <input
          type="hidden"
          name="_next"
          value="https://colorwaysports.com/contact?sent=true"
        />
        <input type="hidden" name="_subject" value="New message from ColorWay Sports" />

        <div>
          <label className="block text-[13px] font-semibold text-black mb-2 uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Your name"
            className="w-full border border-border rounded-lg px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/20 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-black mb-2 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            className="w-full border border-border rounded-lg px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/20 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-black mb-2 uppercase tracking-wide">
            Message
          </label>
          <textarea
            name="message"
            rows={6}
            required
            placeholder="What's on your mind?"
            className="w-full border border-border rounded-lg px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/20 transition-colors resize-none"
          />
        </div>
        <div className="text-center pt-2">
          <button
            type="submit"
            className="bg-orange hover:bg-orange/90 text-white font-semibold text-sm uppercase tracking-wider px-10 py-3.5 rounded-lg transition-colors"
          >
            Send Message
          </button>
        </div>
      </form>

      {/* TODO: Add back when contact@colorwaysports.com is set up */}
    </main>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="max-w-[800px] mx-auto px-5 py-12"><p>Loading...</p></main>}>
        <ContactForm />
      </Suspense>
      <Footer />
    </>
  );
}
