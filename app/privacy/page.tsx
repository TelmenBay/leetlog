import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | LeetLog",
  description: "Privacy Policy for LeetLog - Your personal journal for mastering algorithms.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <div className="prose prose-gray max-w-none space-y-6 text-[#1A1A1A]" style={{ fontFamily: 'var(--font-jost)' }}>
            <p className="text-[#6B6B6B]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">1. Information We Collect</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, log problems, or contact us. This includes your email address, username, and any problem-solving data you choose to save.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">2. How We Use Your Information</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, including to track your problem-solving progress, personalize your experience, and communicate with you about your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">3. Data Storage and Security</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                Your data is stored securely using industry-standard encryption. We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">4. Third-Party Services</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We may use third-party services for authentication (such as GitHub OAuth) and analytics. These services have their own privacy policies governing the use of your information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">5. Data Retention</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">6. Your Rights</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                You have the right to access, correct, or delete your personal information. You may also export your data or request that we stop processing your information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">7. Changes to This Policy</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">8. Contact Us</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our GitHub repository.
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
