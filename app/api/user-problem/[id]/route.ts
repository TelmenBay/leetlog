import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/user-problem/[id]
 * Creates a new Log entry for a UserProblem
 * Also updates UserProblem with latest values (timeSpent, solvedAt, status)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { timeSpent, notes, solution, status } = await request.json();
    
    // Verify the userProblem belongs to the current user
    const userProblem = await prisma.userProblem.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!userProblem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    if (userProblem.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Ensure timeSpent is a number in seconds (handle edge cases)
    const timeSpentSeconds = typeof timeSpent === 'number' ? timeSpent : 0;
    const logStatus = status === 'solved' || status === 'attempted' ? status : (timeSpentSeconds > 0 ? "solved" : "attempted");
    
    // Calculate expiration date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Create a new Log entry
    const log = await prisma.log.create({
      data: {
        userProblemId: id,
        timeSpent: timeSpentSeconds,
        notes: notes || null,
        solution: solution || null,
        status: logStatus,
        expiresAt: expiresAt,
      }
    });

    // Fetch all logs, then filter non-expired ones
    const now = new Date();
    const allLogsForProblem = await prisma.log.findMany({
      where: { 
        userProblemId: id
      },
      select: { timeSpent: true, createdAt: true, status: true, expiresAt: true }
    });
    
    // Filter non-expired logs
    const nonExpiredLogs = allLogsForProblem.filter(log => {
      if (log.expiresAt) {
        return new Date(log.expiresAt) > now;
      }
      // Old logs without expiresAt: calculate expiration (createdAt + 30 days)
      const createdAt = new Date(log.createdAt);
      const calculatedExpiresAt = new Date(createdAt);
      calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
      return calculatedExpiresAt > now;
    });

    // Find the latest best (lowest) timeSpent from non-expired logs with status "solved"
    // "Latest best" means: among non-expired, get the one with best (lowest) timeSpent
    // If there are ties, pick the latest (most recent) one
    const solvedNonExpiredLogs = nonExpiredLogs
      .filter(log => log.status === "solved")
      .sort((a, b) => {
        // First sort by timeSpent (lowest/best first)
        const timeDiff = a.timeSpent - b.timeSpent;
        if (timeDiff !== 0) return timeDiff;
        // If same time, sort by createdAt (latest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    // Get the best timeSpent, and if there are multiple with same time, get the latest one
    const latestBestTimeSpent = solvedNonExpiredLogs.length > 0 
      ? solvedNonExpiredLogs[0].timeSpent 
      : null;
    
    // Get the latest log with status "solved" for solvedAt (including expired)
    const allLogs = await prisma.log.findMany({
      where: { userProblemId: id },
      select: { timeSpent: true, createdAt: true, status: true }
    });
    
    const latestSolvedLog = allLogs
      .filter(log => log.status === "solved")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    // Determine if this is the first solve
    const isFirstSolve = !userProblem.solvedAt && logStatus === "solved";
    
    // Determine overall status - if any log is solved, the problem is solved
    const hasSolvedLog = allLogs.some(log => log.status === "solved");
    
    // Update UserProblem with latest best non-expired timeSpent
    const updated = await prisma.userProblem.update({
      where: { id },
      data: {
        timeSpent: latestBestTimeSpent, // Latest best non-expired time
        solvedAt: isFirstSolve
          ? new Date()
          : (latestSolvedLog ? new Date(latestSolvedLog.createdAt) : userProblem.solvedAt),
        status: hasSolvedLog ? "solved" : "in_progress",
        updatedAt: new Date(),
      },
      include: {
        problem: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Get latest 10 logs
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      log: log,
      userProblem: updated 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}

