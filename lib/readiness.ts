import { Log } from '@/lib/generated/prisma/client';

export interface UserProblemWithDetails {
  id: string;
  status: string;
  timeSpent: number | null;
  solvedAt: Date | null;
  problem: {
    id: string;
    leetcodeId: number | null;
    title: string;
    slug: string | null;
    difficulty: string;
    tags: string[];
  };
  logs: Log[];
}

export type Readiness = 'mastered' | 'revisit' | 'weak' | 'rusty' | '-';

export function calculateReadiness(userProblem: UserProblemWithDetails): Readiness {
  const { timeSpent, solvedAt, problem, logs } = userProblem;

  if (!timeSpent || !solvedAt) return '-';

  const now = new Date();
  const nonExpiredLogs = logs?.filter(log => {
    if ('expiresAt' in log && log.expiresAt) {
      const expiresAt = new Date(log.expiresAt as Date);
      return expiresAt > now;
    }
    if (log.createdAt) {
      const createdAt = new Date(log.createdAt);
      const calculatedExpiresAt = new Date(createdAt);
      calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
      return calculatedExpiresAt > now;
    }
    return false;
  }) || [];

  const latestNonExpiredLog = nonExpiredLogs.length > 0
    ? nonExpiredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  if (latestNonExpiredLog && latestNonExpiredLog.status === 'attempted') {
    return 'weak';
  }

  if (nonExpiredLogs.length === 0) {
    return 'weak';
  }

  const difficulty = problem.difficulty.toLowerCase();
  let baseReadiness: Readiness;

  const timeSpentMinutes = timeSpent / 60;

  if (difficulty === 'easy') {
    if (timeSpentMinutes < 10) {
      baseReadiness = 'mastered';
    } else if (timeSpentMinutes <= 20) {
      baseReadiness = 'revisit';
    } else {
      baseReadiness = 'weak';
    }
  } else if (difficulty === 'medium') {
    if (timeSpentMinutes < 25) {
      baseReadiness = 'mastered';
    } else if (timeSpentMinutes <= 40) {
      baseReadiness = 'revisit';
    } else {
      baseReadiness = 'weak';
    }
  } else if (difficulty === 'hard') {
    if (timeSpentMinutes < 45) {
      baseReadiness = 'mastered';
    } else if (timeSpentMinutes <= 75) {
      baseReadiness = 'revisit';
    } else {
      baseReadiness = 'weak';
    }
  } else {
    return '-';
  }

  if (baseReadiness === 'mastered') {
    const solvedDate = new Date(solvedAt);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (solvedDate < oneMonthAgo) {
      return 'rusty';
    }
  }

  return baseReadiness;
}

export function getReadinessBadgeClasses(readiness: string): string {
  switch (readiness.toLowerCase()) {
    case 'mastered':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'revisit':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'weak':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'rusty':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function formatTime(seconds: number | null): string {
  if (!seconds) return '-';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m ${secs}s` : `${hours}h ${secs}s`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}
