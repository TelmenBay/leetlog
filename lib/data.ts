import { prisma } from '@/lib/prisma';
import { UserProblemWithDetails } from './readiness';

export async function getUserProblemsWithLogs(userId: string): Promise<UserProblemWithDetails[]> {
  const now = new Date();

  const userProblemsData = await prisma.userProblem.findMany({
    where: { userId },
    include: {
      problem: true,
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return userProblemsData.map(userProblem => {
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
      logs: nonExpiredLogs,
    };
  });
}
