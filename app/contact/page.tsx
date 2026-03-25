"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ContactForm() {
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "true";

  return (
    <main className="max-w-[800px] mx-auto px-5 py-12">
      <h1 className="text-3xl font-bold text-black mb-6">Contact</h1>
      <p className="text-gray-medium mb-8">
        Have a tip, feedback, or want to collaborate? Get in touch.
      </p>

      {sent && (
        <div className="bg-green-50 border border-green-200 rounded px-5 py-4 mb-8">
          <p className="text-green-800 font-medium">Message sent! We'll get back to you soon.</p>
        </div>
      )}

      <form
        action="https://formsubmit.co/daneshgarjacob@gmail.com"
        method="POST"
        className="space-y-5"
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
          <label className="block text-sm font-medium text-black mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full border border-border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Message
          </label>
          <textarea
            name="message"
            rows={5}
            required
            className="w-full border border-border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:border-orange resize-none"
          />
        </div>
        <button
          type="submit"
          className="bg-orange hover:bg-orange/90 text-white font-semibold text-sm uppercase tracking-wider px-8 py-3 rounded transition-colors"
        >
          Send Message
        </button>
      </form>
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
