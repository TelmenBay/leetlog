import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for LeetLog - Your personal journal for mastering algorithms. Read our terms and conditions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F4F0]">
      <header className="flex justify-between items-center px-8 py-6 border-b border-[#E5E5E5] bg-white">
        <Link href="/" className="flex items-center">
          <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={100}
            height={100}
            className="object-contain invert"
          />
        </Link>
      </header>

      <main className="flex-1 px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-8" style={{ fontFamily: 'var(--font-jost)' }}>
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none space-y-6 text-[#1A1A1A]" style={{ fontFamily: 'var(--font-jost)' }}>
            <p className="text-[#6B6B6B]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">1. Acceptance of Terms</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                By accessing and using LeetLog, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">2. Description of Service</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                LeetLog is a personal journaling tool designed to help users track their algorithm problem-solving progress. We provide features to log problems, track time spent, and record insights and solutions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">3. User Accounts</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">4. User Content</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                You retain ownership of any content you submit to LeetLog, including notes, solutions, and other data. By using our service, you grant us a license to store and display this content as necessary to provide the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">5. Acceptable Use</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                You agree not to use LeetLog for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">6. Intellectual Property</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                The LeetLog service, including its design, features, and content (excluding user-generated content), is protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">7. Disclaimer of Warranties</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                LeetLog is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">8. Limitation of Liability</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                To the maximum extent permitted by law, LeetLog shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">9. Modifications to Service</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We reserve the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">10. Changes to Terms</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We may revise these Terms of Service at any time. By continuing to use LeetLog after changes become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">11. Contact</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our GitHub repository.
              </p>
            </section>
          </div>

          <div className="mt-12">
            <Link href="/" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 border-t border-[#E5E5E5]">
        <div className="flex justify-center items-center">
          <p className="text-sm text-[#6B6B6B]">
            &copy; {new Date().getFullYear()} LeetLog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
