import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard-client";
import SignOutButton from "@/components/sign-out-button";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const now = new Date();

  try {
    const userProblemsData = await prisma.userProblem.findMany({
      where: {
        userId: user.id
      },
      include: {
        problem: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const userProblems = userProblemsData.map(userProblem => {
      const logs = userProblem.logs || [];

      const nonExpiredLogs = logs.filter((log) => {
        if (log.expiresAt) {
          return new Date(log.expiresAt) > now;
        }
        const createdAt = new Date(log.createdAt);
        const calculatedExpiresAt = new Date(createdAt);
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
        return calculatedExpiresAt > now;
      }).slice(0, 10);

      return {
        id: userProblem.id,
        status: userProblem.status,
        timeSpent: userProblem.timeSpent,
        solvedAt: userProblem.solvedAt,
        problem: userProblem.problem,
        logs: nonExpiredLogs
      };
    });

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
            <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-6" style={{ fontFamily: 'var(--font-jost)' }}>
              Dashboard
            </h1>

            <DashboardClient userProblems={userProblems} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#F5F4F0]">
        <p className="text-[#1A1A1A]">Error loading dashboard. Please refresh the page.</p>
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      </div>
    );
  }
}
