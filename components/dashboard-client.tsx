'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogProblemModal from './log-problem-modal';
import ConfirmModal, { shouldSkipConfirmation } from './confirm-modal';
import { UserProblemWithDetails, calculateReadiness, getReadinessBadgeClasses, formatTime } from '@/lib/readiness';

interface DashboardClientProps {
  userProblems: UserProblemWithDetails[];
}

export default function DashboardClient({ userProblems: initialUserProblemWithDetailss }: DashboardClientProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<UserProblemWithDetails | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [userProblems, setUserProblemWithDetailss] = useState<UserProblemWithDetails[]>(initialUserProblemWithDetailss);
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
    setUserProblemWithDetailss(initialUserProblemWithDetailss);
  }, [initialUserProblemWithDetailss]);

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
      setUserProblemWithDetailss(prev => prev.filter(up => !selectedIds.has(up.id)));
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

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogClick = (userProblem: UserProblemWithDetails) => {
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
    setUserProblemWithDetailss(prev => prev.map(up => ({
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
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-sm border capitalize ${getReadinessBadgeClasses(readiness)}`}
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