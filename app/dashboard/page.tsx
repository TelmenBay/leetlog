import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-6 border-b border-gray-700">
        <div className="flex items-center">
          <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white" style={{ fontFamily: 'var(--font-jost)' }}>
            {session.user?.email || session.user?.name}
          </span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button 
              type="submit"
              className="text-xl border-2 border-white px-6 py-2 text-white hover:bg-white hover:text-black transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-semibold text-white mb-8" style={{ fontFamily: 'var(--font-jost)' }}>
            Dashboard
          </h1>
          
          {/* Dashboard content goes here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Problems Solved</h2>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Total Time</h2>
              <p className="text-3xl font-bold text-white">0h 0m</p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Current Streak</h2>
              <p className="text-3xl font-bold text-white">0 days</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}