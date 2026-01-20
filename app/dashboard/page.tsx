import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard-client";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const now = new Date();

  try {
    const userProblemsData = await prisma.userProblem.findMany({
      where: {
        userId: session.user?.id as string
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
              {session.user?.email || session.user?.name}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}>
              <button
                type="submit"
                className="text-sm font-medium border border-[#E5E5E5] px-4 py-2 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-colors rounded-sm"
              >
                Sign Out
              </button>
            </form>
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
    console.error('Error fetching dashboard data:', error);
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#F5F4F0]">
        <p className="text-[#1A1A1A]">Error loading dashboard. Please refresh the page.</p>
      </div>
    );
  }
}