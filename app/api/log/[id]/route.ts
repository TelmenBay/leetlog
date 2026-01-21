import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/log/[id]
 * Deletes a specific log entry
 */
export async function DELETE(
  _request: NextRequest,
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

    // Find the log and verify ownership through userProblem
    const log = await prisma.log.findUnique({
      where: { id },
      include: {
        userProblem: true
      }
    });

    if (!log) {
      return NextResponse.json(
        { error: "Log not found" },
        { status: 404 }
      );
    }

    if (log.userProblem.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const userProblemId = log.userProblemId;

    // Delete the log
    await prisma.log.delete({
      where: { id }
    });

    // Recalculate UserProblem stats after log deletion
    const now = new Date();
    const remainingLogs = await prisma.log.findMany({
      where: { userProblemId },
      select: { timeSpent: true, createdAt: true, status: true, expiresAt: true }
    });

    // Filter non-expired logs
    const nonExpiredLogs = remainingLogs.filter(log => {
      if (log.expiresAt) {
        return new Date(log.expiresAt) > now;
      }
      const createdAt = new Date(log.createdAt);
      const calculatedExpiresAt = new Date(createdAt);
      calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
      return calculatedExpiresAt > now;
    });

    // Find best non-expired solved time
    const solvedNonExpiredLogs = nonExpiredLogs
      .filter(log => log.status === "solved")
      .sort((a, b) => a.timeSpent - b.timeSpent);

    const latestBestTimeSpent = solvedNonExpiredLogs.length > 0
      ? solvedNonExpiredLogs[0].timeSpent
      : null;

    // Determine status
    const hasSolvedLog = remainingLogs.some(log => log.status === "solved");
    const hasAnyLog = remainingLogs.length > 0;

    // Update UserProblem
    await prisma.userProblem.update({
      where: { id: userProblemId },
      data: {
        timeSpent: latestBestTimeSpent,
        status: hasSolvedLog ? "solved" : (hasAnyLog ? "in_progress" : "not_started"),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
