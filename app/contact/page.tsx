import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="max-w-[800px] mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold text-black mb-6">Contact</h1>
        <p className="text-gray-medium mb-8">
          Have a tip, feedback, or want to collaborate? Get in touch.
        </p>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Name</label>
            <input
              type="text"
              className="w-full border border-border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:border-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-border rounded px-4 py-3 text-sm bg-white focus:outline-none focus:border-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Message</label>
            <textarea
              rows={5}
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
      <Footer />
    </>
  );
}
