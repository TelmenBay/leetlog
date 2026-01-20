import Image from "next/image";
import GitHubStar from "@/components/github-star";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session  = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F4F0]">
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center">
          <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={140}
            height={140}
            className="object-contain invert"
          />
        </div>

        <div className="flex justify-center items-center">
          <GitHubStar />
        </div>

        <div className="flex gap-3">
          <Link href="/sign-in">
            <button className="text-base font-medium px-5 py-2.5 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#e3e3e3] hover:text-black transition-colors rounded-sm">
              Login
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="text-base font-medium bg-[#1A1A1A] text-white px-5 py-2.5 hover:bg-[#333] transition-colors rounded-sm">
              Sign Up
            </button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-center text-[#1A1A1A] font-medium max-w-4xl leading-tight" style={{ fontFamily: 'var(--font-jost)' }}>
          Log your approaches + time + insights.
        </h1>
      </main>
      <footer className="py-6 px-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#6B6B6B]">
            &copy; {new Date().getFullYear()} LeetLog. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


