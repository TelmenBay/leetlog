import { createClient } from "@/lib/supabase/server";
import { getUserProblemsWithLogs } from "@/lib/data";
import DashboardClient from "@/components/dashboard-client";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const userProblems = await getUserProblemsWithLogs(user.id);
    return <DashboardClient userProblems={userProblems} />;
  } catch (error) {
    console.error('Dashboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[#1A1A1A]">Error loading dashboard. Please refresh the page.</p>
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      </div>
    );
  }
}
