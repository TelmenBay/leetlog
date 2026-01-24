import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import LandingSearch from "@/components/landing-search";

export const metadata: Metadata = {
  title: "LeetLog - Your Personal Algorithm Practice Journal",
  description: "Log your LeetCode problems, track time spent, and record insights. Stay consistent with your technical interview prep. Free algorithm practice tracker.",
  openGraph: {
    title: "LeetLog - Your Personal Algorithm Practice Journal",
    description: "Log your LeetCode problems, track time spent, and record insights. Stay consistent with your technical interview prep.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetLog - Your Personal Algorithm Practice Journal",
    description: "Log your LeetCode problems, track time spent, and record insights.",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard")
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leetlog.com';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LeetLog",
    "description": "Your personal journal for mastering algorithms. Log problems, track progress, and stay consistent with your technical interview prep.",
    "url": baseUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Track LeetCode problems",
      "Time tracking",
      "Solution logging",
      "Progress monitoring",
      "Interview prep tracking"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col min-h-screen bg-[#F5F4F0]">
        <header className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center">
          <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={140}
            height={140}
            className="object-contain invert w sm:w"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Link href="/sign-in">
            <button className="text-sm sm:text-base font-medium px-3 sm:px-5 py-2 sm:py-2.5 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#e3e3e3] hover:text-black transition-colors rounded-sm">
              Login
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="text-sm sm:text-base font-medium bg-[#1A1A1A] text-white px-3 sm:px-5 py-2 sm:py-2.5 hover:bg-[#333] transition-colors rounded-sm">
              Sign Up
            </button>
          </Link>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden">
          {/* Background Image - hidden on mobile */}
          <div className="hidden sm:flex absolute inset-0 items-end justify-center pointer-events-none">
            <Image
              src="/landingcomp.svg"
              alt="LeetLog Dashboard Preview"
              width={1200}
              height={800}
              className="w-full max-w-10xl h-auto opacity-90"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-12 sm:pt-20">
            <div className="max-w-4xl text-center px-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] font-medium leading-tight mb-4" style={{ fontFamily: 'var(--font-jost)' }}>
                Track your progress. Build your confidence.
              </h1>
              <p className="text-lg sm:text-xl text-[#6B6B6B] max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-jost)' }}>
                Log your LeetCode solutions, track time spent, and watch yourself improve.
              </p>
              <LandingSearch />
            </div>
          </div>
        </main>

        <footer className="py-4 sm:py-6 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <p className="text-xs sm:text-sm text-[#6B6B6B] text-center sm:text-left">
              &copy; {new Date().getFullYear()} LeetLog. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 items-center">
              <a
                href="https://github.com/TelmenBay/leetlog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <Link href="/privacy" className="text-xs sm:text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs sm:text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
