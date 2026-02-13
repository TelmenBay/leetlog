import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import SignOutButton from "@/components/sign-out-button";
import TabNav from "@/components/tab-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F4F0]">
      <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-[#E5E5E5]">
        <div className="flex items-center">
          <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={100}
            height={100}
            className="object-contain invert"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <TabNav />
          {children}
        </div>
      </main>
    </div>
  );
}
