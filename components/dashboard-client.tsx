'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogProblemModal from './log-problem-modal';
import ConfirmModal, { shouldSkipConfirmation } from './confirm-modal';
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
    slug: string | null;
    difficulty: string;
    tags: string[];
  };
  logs: Log[];
}

interface DashboardClientProps {
  userProblems: UserProblem[];
}

export default function DashboardClient({ userProblems: initialUserProblems }: DashboardClientProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<UserProblem | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [userProblems, setUserProblems] = useState<UserProblem[]>(initialUserProblems);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    dontAskAgainKey?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const router = useRouter();

  // Sync with server data
  useEffect(() => {
    setUserProblems(initialUserProblems);
  }, [initialUserProblems]);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === userProblems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(userProblems.map(up => up.id)));
    }
  };

  const performDeleteProblems = async () => {
    setDeleting(true);
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/user-problem/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      // Update local state immediately
      setUserProblems(prev => prev.filter(up => !selectedIds.has(up.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      router.refresh();
    } catch (err) {
      setError('Failed to delete problems');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    // Check if user wants to skip confirmation
    if (shouldSkipConfirmation('deleteProblems')) {
      performDeleteProblems();
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Problems',
      message: `Are you sure you want to delete ${selectedIds.size} problem${selectedIds.size > 1 ? 's' : ''}? This will also delete all associated logs.`,
      onConfirm: performDeleteProblems,
      dontAskAgainKey: 'deleteProblems',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-[#1A1A1A]';
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

  const handleDeleteLog = async (logId: string) => {
    const response = await fetch(`/api/log/${logId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete log');
    }

    // Update local state immediately
    setUserProblems(prev => prev.map(up => ({
      ...up,
      logs: up.logs.filter(log => log.id !== logId)
    })));

    // Also update selectedProblem if it's open
    if (selectedProblem) {
      setSelectedProblem(prev => prev ? {
        ...prev,
        logs: prev.logs.filter(log => log.id !== logId)
      } : null);
    }

    router.refresh();
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
              className="block text-[#1A1A1A] mb-1.5 text-sm font-medium"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              Problem URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a LeetCode or NeetCode URL..."
              className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] rounded-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              style={{ fontFamily: 'var(--font-jost)' }}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="text-sm font-medium rounded-sm bg-[#1A1A1A] px-5 py-2.5 text-white hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            {loading ? 'Adding...' : 'New Problem'}
          </button>
        </form>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Select/Delete Controls */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={toggleSelectMode}
          className={`text-sm font-medium px-3 py-1.5 rounded-sm border transition-colors ${
            selectMode
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
              : 'bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
          }`}
          style={{ fontFamily: 'var(--font-jost)' }}
        >
          {selectMode ? 'Cancel' : 'Select'}
        </button>
        {selectMode && (
          <>
            <button
              onClick={selectAll}
              className="text-sm font-medium px-3 py-1.5 rounded-sm border border-[#E5E5E5] bg-white text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              {selectedIds.size === userProblems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
              className="text-sm font-medium px-3 py-1.5 rounded-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          </>
        )}
      </div>
      
      {/* Dashboard content - Spreadsheet style */}
      <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Table Header */}
        <div
          className={`grid gap-0 items-center bg-[#FAFAFA] border-b border-[#E5E5E5] ${
            selectMode
              ? 'grid-cols-[40px_50px_1fr_60px_180px_100px_120px_120px_120px]'
              : 'grid-cols-[50px_1fr_60px_180px_100px_120px_120px_120px]'
          }`}
        >
          {selectMode && (
            <div className="px-3 py-3 border-r border-[#E5E5E5] flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedIds.size === userProblems.length && userProblems.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-[#D4D4D4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
              />
            </div>
          )}
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>#</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Problem</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Link</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Topics</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Difficulty</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Time</span>
          </div>
          <div className="px-3 py-3 border-r border-[#E5E5E5]">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Last Logged</span>
          </div>
          <div className="px-3 py-3">
            <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'var(--font-jost)' }}>Readiness</span>
          </div>
        </div>
        
        {/* Table Rows */}
        {userProblems.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B6B]" style={{ fontFamily: 'var(--font-jost)' }}>
            No problems added yet. Add your first problem to get started!
          </div>
        ) : (
          <div>
            {userProblems.map((userProblem, index) => (
              <div
                key={userProblem.id}
                onClick={() => {
                  if (selectMode) {
                    toggleSelection(userProblem.id);
                  } else {
                    handleLogClick(userProblem);
                  }
                }}
                className={`grid gap-0 items-center border-b border-[#E5E5E5] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${
                  selectMode
                    ? 'grid-cols-[40px_50px_1fr_60px_180px_100px_120px_120px_120px]'
                    : 'grid-cols-[50px_1fr_60px_180px_100px_120px_120px_120px]'
                } ${selectedIds.has(userProblem.id) ? 'bg-blue-50' : ''}`}
              >
                {selectMode && (
                  <div className="px-3 py-3 border-r border-[#E5E5E5] flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(userProblem.id)}
                      onChange={() => toggleSelection(userProblem.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-[#D4D4D4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
                    />
                  </div>
                )}
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <span className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.leetcodeId || index + 1}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <span className="text-[#1A1A1A] text-sm truncate block font-medium" style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.title}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5] flex items-center justify-center">
                  {userProblem.problem.slug ? (
                    <a
                      href={`https://leetcode.com/problems/${userProblem.problem.slug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                      title="Open on LeetCode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-[#9CA3AF]">-</span>
                  )}
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <div className="flex flex-wrap gap-1">
                    {userProblem.problem.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs bg-[#F5F4F0] text-[#6B6B6B] px-2 py-0.5 rounded-sm"
                        style={{ fontFamily: 'var(--font-jost)' }}
                      >
                        {tag}
                      </span>
                    ))}
                    {userProblem.problem.tags.length > 2 && (
                      <span className="text-xs text-[#9CA3AF]" style={{ fontFamily: 'var(--font-jost)' }}>
                        +{userProblem.problem.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <span className={`text-sm font-medium ${getDifficultyColor(userProblem.problem.difficulty)}`} style={{ fontFamily: 'var(--font-jost)' }}>
                    {userProblem.problem.difficulty}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <span className="text-[#1A1A1A] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {formatTime(userProblem.timeSpent)}
                  </span>
                </div>
                <div className="px-3 py-3 border-r border-[#E5E5E5]">
                  <span className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                    {formatDate(userProblem.solvedAt)}
                  </span>
                </div>
                <div className="px-3 py-3">
                  {(() => {
                    const readiness = calculateReadiness(userProblem);
                    if (readiness === '-') {
                      return <span className="text-[#9CA3AF] text-sm">-</span>;
                    }
                    return (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-sm border capitalize ${getReadinessBadge(readiness)}`}
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
          onDeleteLog={handleDeleteLog}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        showDontAskAgain={true}
        dontAskAgainKey={confirmModal.dontAskAgainKey}
      />
    </>
  );
}