import { createClient } from "@/lib/supabase/server";
import { getUserProblemsWithLogs } from "@/lib/data";
import AnalyticsClient from "@/components/analytics-client";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const userProblems = await getUserProblemsWithLogs(user.id);
    return <AnalyticsClient userProblems={userProblems} />;
  } catch (error) {
    console.error('Analytics error:', error);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[#1A1A1A]">Error loading analytics. Please refresh the page.</p>
      </div>
    );
  }
}
