import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard")
  }

  return (
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

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center text-[#1A1A1A] font-medium max-w-4xl leading-tight" style={{ fontFamily: 'var(--font-jost)' }}>
          Log your approaches + time + insights.
        </h1>
      </main>

      <footer className="py-4 sm:py-6 px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <p className="text-xs sm:text-sm text-[#6B6B6B] text-center sm:text-left">
            &copy; {new Date().getFullYear()} LeetLog. All rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6">
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
  );
}
