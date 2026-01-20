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

  
  // Fetch user's problems with related problem data and logs
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
          take: 20, // Get more logs, we'll filter expired ones
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map userProblems and include all non-expired logs
    const userProblems = userProblemsData.map(userProblem => {
      const logs = userProblem.logs || [];

      // Filter non-expired logs
      const nonExpiredLogs = logs.filter((log) => {
        // If expiresAt exists, check if it's in the future
        if (log.expiresAt) {
          return new Date(log.expiresAt) > now;
        }
        // If expiresAt doesn't exist (old logs), calculate: createdAt + 30 days
        const createdAt = new Date(log.createdAt);
        const calculatedExpiresAt = new Date(createdAt);
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
        return calculatedExpiresAt > now;
      }).slice(0, 10); // Take latest 10 non-expired

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
      <div className="flex flex-col min-h-screen">
        {/* Header */}
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

            <DashboardClient userProblems={userProblems} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p className="text-white">Error loading dashboard. Please refresh the page.</p>
      </div>
    );
  }
}