'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogProblemModal from './log-problem-modal';
import { Log } from '@/lib/generated/prisma/client';

interface UserProblem {
  id: string;
  status: string;
  timeSpent: number | null;
  solvedAt: Date | null;
  problem: {
    id: string;
    leetcodeId: number | null;
    title: string;
    difficulty: string;
    tags: string[];
  };
  logs: Log[];
}

interface DashboardClientProps {
  userProblems: UserProblem[];
}

export default function DashboardClient({ userProblems }: DashboardClientProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<UserProblem | null>(null);
  const router = useRouter();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const formatTime = (seconds: number | null) => {
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
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateReadiness = (userProblem: UserProblem): string => {
    const { timeSpent, solvedAt, problem, logs } = userProblem;
    
    // If not solved yet, return empty
    if (!timeSpent || !solvedAt) return '-';
    
    // Get the latest non-expired log
    const now = new Date();
    const nonExpiredLogs = logs?.filter(log => {
      // Check if expiresAt exists and if it's in the future
      if ('expiresAt' in log && log.expiresAt) {
        const expiresAt = new Date(log.expiresAt as Date);
        return expiresAt > now;
      }
      // If expiresAt doesn't exist (old logs created before migration), 
      // calculate expiration: createdAt + 30 days
      if (log.createdAt) {
        const createdAt = new Date(log.createdAt);
        const calculatedExpiresAt = new Date(createdAt);
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
        return calculatedExpiresAt > now;
      }
      return false;
    }) || [];
    
    // Check the latest non-expired log status - if attempted, flag as weak
    const latestNonExpiredLog = nonExpiredLogs.length > 0 
      ? nonExpiredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
    
    if (latestNonExpiredLog && latestNonExpiredLog.status === 'attempted') {
      return 'weak';
    }
    
    // If no non-expired logs, return weak (expired)
    if (nonExpiredLogs.length === 0) {
      return 'weak';
    }
    
    const difficulty = problem.difficulty.toLowerCase();
    let baseReadiness: string;

    // Convert timeSpent from seconds to minutes for readiness calculation
    const timeSpentMinutes = timeSpent / 60;

    // Calculate base readiness based on difficulty and time (thresholds in minutes)
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
    
    // Check if mastered and last logged > 1 month ago
    if (baseReadiness === 'mastered') {
      const solvedDate = new Date(solvedAt);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (solvedDate < oneMonthAgo) {
        return 'rusty';
      }
    }
    
    return baseReadiness;
  };

  const getReadinessBadge = (readiness: string) => {
    switch (readiness.toLowerCase()) {
      case 'mastered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'revisit':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'weak':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rusty':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleLogClick = (userProblem: UserProblem) => {
    setSelectedProblem(userProblem);
    setLogModalOpen(true);
  };

  const handleSaveLog = async (timeSpent: number, notes: string, solution: string, status: string) => {
    if (!selectedProblem) return;

    try {
      const response = await fetch(`/api/user-problem/${selectedProblem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeSpent, notes, solution, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to save log');
      }

      router.refresh();
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add problem');
      }

      // Success - clear input and refresh
      setUrl('');
      router.refresh(); // Refresh the dashboard to show new problem
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Problem Form */}
      <div className="mb-5">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="url"
              className="block text-white mb-2 text-sm"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              LeetCode Problem URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-green-400"
              style={{ fontFamily: 'var(--font-jost)' }}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="text-xl rounded-lg bg-gray-900 border border-gray-800 px-6 py-2 text-green-400 hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            {loading ? 'Adding...' : 'New Problem'}
          </button>
        </form>
        {error && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Dashboard content - Spreadsheet style */}
      <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
        {/* Table Header */}
        <div
          className="grid grid-cols-[50px_1fr_180px_100px_120px_120px_120px] gap-0 items-center bg-gray-900 border-b-2 border-gray-700"
        >
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>#</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Problems</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Topics</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Difficulty</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Time</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Last Logged</span>
          </div>
          <div className="px-3 py-3 border-r border-gray-700">
            <span className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>Readiness</span>
          </div>
        </div>
        
        {/* Table Rows */}
        {userProblems.length === 0 ? (
          <div className="text-center py-12 text-gray-400" style={{ fontFamily: 'var(--font-jost)' }}>
            No problems added yet. Add your first problem to get started!
          </div>
        ) : (
          <div>
            {userProblems.map((userProblem, index) => (
              <div
                key={userProblem.id}
                onClick={() => handleLogClick(userProblem)}
                className="grid grid-cols-[50px_1fr_180px_100px_120px_120px_120px] gap-0 items-center border-b border-gray-700 hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <div className="px-3 py-3 border-r border-gray-700">
                  <span className="text-white text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.leetcodeId || index + 1}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  <span className="text-white text-sm truncate block" style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.title}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {userProblem.problem.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                        style={{ fontFamily: 'var(--font-jost)' }}
                      >
                        {tag}
                      </span>
                    ))}
                    {userProblem.problem.tags.length > 2 && (
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-jost)' }}>
                        +{userProblem.problem.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  <span className={`text-sm font-semibold ${getDifficultyColor(userProblem.problem.difficulty)}`} style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.difficulty}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  <span className="text-white text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {formatTime(userProblem.timeSpent)}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  <span className="text-white text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {formatDate(userProblem.solvedAt)}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-gray-700">
                  {(() => {
                    const readiness = calculateReadiness(userProblem);
                    if (readiness === '-') {
                      return <span className="text-gray-400 text-sm">-</span>;
                    }
                    return (
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${getReadinessBadge(readiness)}`}
                        style={{ fontFamily: 'var(--font-jost)' }}
                      >
                        {readiness}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Modal */}
      {selectedProblem && (
        <LogProblemModal
          isOpen={logModalOpen}
          onClose={() => {
            setLogModalOpen(false);
            setSelectedProblem(null);
          }}
          problemTitle={selectedProblem.problem.title}
          logs={selectedProblem.logs}
          onSave={handleSaveLog}
        />
      )}
    </>
  );
}