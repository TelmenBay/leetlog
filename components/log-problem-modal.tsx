'use client';

import { useState, useEffect } from 'react';
import { Log } from '@/lib/generated/prisma/client';
import ConfirmModal, { shouldSkipConfirmation } from './confirm-modal';

interface LogProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  logs: Log[];
  onSave: (timeSpent: number, notes: string, solution: string, status: string) => Promise<void>;
  onDeleteLog?: (logId: string) => Promise<void>;
}

export default function LogProblemModal({
  isOpen,
  onClose,
  problemTitle,
  logs,
  onSave,
  onDeleteLog
}: LogProblemModalProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [timerMode, setTimerMode] = useState<'timer' | 'manual'>('timer');
  const [manualHours, setManualHours] = useState('0');
  const [manualMinutes, setManualMinutes] = useState('0');
  const [manualSeconds, setManualSeconds] = useState('0');
  const [notes, setNotes] = useState('');
  const [solution, setSolution] = useState('');
  const [status, setStatus] = useState<'solved' | 'attempted'>('solved');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    logId: string | null;
  }>({ isOpen: false, logId: null });
  const [originalTitle, setOriginalTitle] = useState('');

  const performDeleteLog = async (logId: string) => {
    if (!onDeleteLog) return;

    setDeletingLogId(logId);
    setConfirmModal({ isOpen: false, logId: null });

    try {
      await onDeleteLog(logId);
      if (expandedLogId === logId) {
        setExpandedLogId(null);
      }
    } catch (error) {
      console.error('Failed to delete log:', error);
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleDeleteLog = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteLog) return;

    // Check if user wants to skip confirmation
    if (shouldSkipConfirmation('deleteLogs')) {
      performDeleteLog(logId);
      return;
    }

    setConfirmModal({ isOpen: true, logId });
  };

  // Timer logic using timestamps (accurate even when tab is inactive)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let currentStartTime: number | null = null;

    if (isRunning) {
      currentStartTime = Date.now();
      setStartTime(currentStartTime);

      interval = setInterval(() => {
        if (currentStartTime) {
          const elapsed = Math.floor((Date.now() - currentStartTime) / 1000);
          setTime(accumulatedTime + elapsed);
        }
      }, 100); // Update more frequently for smoother display
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, accumulatedTime]);

  // Update browser tab title with timer
  useEffect(() => {
    if (!isOpen) return;

    if (!originalTitle) {
      setOriginalTitle(document.title);
    }

    if (isRunning || time > 0) {
      const h = Math.floor(time / 3600);
      const m = Math.floor((time % 3600) / 60);
      const s = time % 60;
      const timeStr = h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
      document.title = `${isRunning ? '▶' : '❚❚'} ${timeStr} - ${problemTitle}`;
    }

    return () => {
      if (originalTitle) {
        document.title = originalTitle;
      }
    };
  }, [isOpen, isRunning, time, problemTitle, originalTitle]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTime(0);
      setIsRunning(false);
      setStartTime(null);
      setAccumulatedTime(0);
      setTimerMode('timer');
      setManualHours('0');
      setManualMinutes('0');
      setManualSeconds('0');
      setNotes('');
      setSolution('');
      setStatus('solved');
      setActiveTab('new');
      setExpandedLogId(null);
      setOriginalTitle(document.title);
    }
  }, [isOpen]);

  // Format time for display (HH:MM:SS)
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  const formatTimeDisplay = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  // Format seconds to readable string
  const formatTimeSeconds = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return m > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${s}s`;
    }
    if (m > 0) {
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    return `${s}s`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    setStartTime(null);
    setAccumulatedTime(0);
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      // Pausing - save accumulated time
      setAccumulatedTime(time);
      setIsRunning(false);
    } else {
      // Starting
      setIsRunning(true);
    }
  };

  // Calculate time from manual entry
  const getManualTime = () => {
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const s = parseInt(manualSeconds) || 0;
    return h * 3600 + m * 60 + s;
  };

  // Get the effective time (either from timer or manual entry)
  const getEffectiveTime = () => {
    return timerMode === 'timer' ? time : getManualTime();
  };

  const handleSave = async () => {
    const effectiveTime = getEffectiveTime();
    if (effectiveTime === 0 && !notes.trim() && !solution.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(effectiveTime, notes, solution, status);
      onClose();
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (logStatus: string | null) => {
    if (logStatus === 'solved') {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-sm bg-green-100 text-green-700 border border-green-200">Solved</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-sm bg-yellow-100 text-yellow-700 border border-yellow-200">Attempted</span>;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] w-[95vw] h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0">
          <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-jost)' }}>
            {problemTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B6B6B] hover:text-[#1A1A1A] text-2xl w-8 h-8 flex items-center justify-center rounded-sm hover:bg-[#F5F4F0] transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] px-6 shrink-0">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'new'
                ? 'text-[#1A1A1A]'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            New Log
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-[#1A1A1A]'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            History ({logs.length})
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#FAFAFA]">
          {activeTab === 'new' ? (
            <div className="h-full p-6 overflow-y-auto">
              {/* Two Column Layout - Left: Timer/Status/Notes, Right: Code */}
              <div className="grid grid-cols-[500px_1fr] gap-6 h-full">
                {/* Left Column: Timer, Status, and Notes */}
                <div className="flex flex-col gap-5 overflow-y-auto">
                  {/* Timer Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[#1A1A1A] text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
                        Time
                      </label>
                      {/* Mode Toggle */}
                      <div className="flex bg-[#F5F4F0] rounded-sm p-0.5">
                        <button
                          onClick={() => setTimerMode('timer')}
                          className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                            timerMode === 'timer'
                              ? 'bg-white text-[#1A1A1A] shadow-sm'
                              : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                          }`}
                          style={{ fontFamily: 'var(--font-jost)' }}
                        >
                          Timer
                        </button>
                        <button
                          onClick={() => {
                            setTimerMode('manual');
                            setIsRunning(false);
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                            timerMode === 'manual'
                              ? 'bg-white text-[#1A1A1A] shadow-sm'
                              : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                          }`}
                          style={{ fontFamily: 'var(--font-jost)' }}
                        >
                          Manual
                        </button>
                      </div>
                    </div>

                    {timerMode === 'timer' ? (
                      <>
                        {/* Timer Display */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="bg-white border border-[#E5E5E5] rounded-sm p-3 flex items-center justify-center min-w-16">
                            <span className="text-3xl font-mono font-light text-[#1A1A1A] tracking-tight">
                              {formatTimeDisplay(hours)}
                            </span>
                          </div>
                          <span className="text-2xl text-[#6B6B6B] font-light">:</span>
                          <div className="bg-white border border-[#E5E5E5] rounded-sm p-3 flex items-center justify-center min-w-16">
                            <span className="text-3xl font-mono font-light text-[#1A1A1A] tracking-tight">
                              {formatTimeDisplay(minutes)}
                            </span>
                          </div>
                          <span className="text-2xl text-[#6B6B6B] font-light">:</span>
                          <div className="bg-white border border-[#E5E5E5] rounded-sm p-3 flex items-center justify-center min-w-16">
                            <span className="text-3xl font-mono font-light text-[#1A1A1A] tracking-tight">
                              {formatTimeDisplay(seconds)}
                            </span>
                          </div>
                        </div>

                        {/* Timer Controls */}
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleToggleTimer}
                            className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors font-medium rounded-sm flex items-center gap-2 text-sm"
                            style={{ fontFamily: 'var(--font-jost)' }}
                          >
                            {isRunning ? (
                              <>
                                <img src="/pause.svg" alt="Pause" className="w-4 h-4 invert" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <img src="/play.svg" alt="Play" className="w-4 h-4 invert" />
                                <span>Start</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleReset}
                            className="px-4 py-2 border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F4F0] transition-colors rounded-sm flex items-center gap-2 text-sm"
                            style={{ fontFamily: 'var(--font-jost)' }}
                          >
                            <img src="/reset-left-fill.svg" alt="Reset" className="w-4 h-4" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Manual Entry */
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={manualHours}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const num = Math.min(parseInt(raw) || 0, 23);
                              setManualHours(raw === '' ? '0' : String(num));
                            }}
                            className="w-16 bg-white border border-[#E5E5E5] rounded-sm p-3 text-3xl font-mono font-light text-[#1A1A1A] tracking-tight text-center focus:outline-none focus:border-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-[#6B6B6B] mt-1" style={{ fontFamily: 'var(--font-jost)' }}>hours</span>
                        </div>
                        <span className="text-2xl text-[#6B6B6B] font-light mb-5">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={manualMinutes}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const num = Math.min(parseInt(raw) || 0, 59);
                              setManualMinutes(raw === '' ? '0' : String(num));
                            }}
                            className="w-16 bg-white border border-[#E5E5E5] rounded-sm p-3 text-3xl font-mono font-light text-[#1A1A1A] tracking-tight text-center focus:outline-none focus:border-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-[#6B6B6B] mt-1" style={{ fontFamily: 'var(--font-jost)' }}>mins</span>
                        </div>
                        <span className="text-2xl text-[#6B6B6B] font-light mb-5">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={manualSeconds}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              const num = Math.min(parseInt(raw) || 0, 59);
                              setManualSeconds(raw === '' ? '0' : String(num));
                            }}
                            className="w-16 bg-white border border-[#E5E5E5] rounded-sm p-3 text-3xl font-mono font-light text-[#1A1A1A] tracking-tight text-center focus:outline-none focus:border-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-[#6B6B6B] mt-1" style={{ fontFamily: 'var(--font-jost)' }}>secs</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-[#1A1A1A] mb-2 text-sm font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
                      Status
                    </label>
                    <div className="flex flex-col gap-2">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                          status === 'solved'
                            ? 'border-green-500 bg-green-50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="solved"
                          checked={status === 'solved'}
                          onChange={(e) => setStatus(e.target.value as 'solved' | 'attempted')}
                          className="w-4 h-4 text-green-600 bg-white border-[#D4D4D4] focus:ring-green-500"
                        />
                        <div>
                          <span className="text-[#1A1A1A] font-medium text-sm" style={{ fontFamily: 'var(--font-jost)' }}>Solved</span>
                          <p className="text-[#6B6B6B] text-xs">Completed without help</p>
                        </div>
                      </label>
                      <label
                        className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                          status === 'attempted'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="attempted"
                          checked={status === 'attempted'}
                          onChange={(e) => setStatus(e.target.value as 'solved' | 'attempted')}
                          className="w-4 h-4 text-yellow-600 bg-white border-[#D4D4D4] focus:ring-yellow-500"
                        />
                        <div>
                          <span className="text-[#1A1A1A] font-medium text-sm" style={{ fontFamily: 'var(--font-jost)' }}>Attempted</span>
                          <p className="text-[#6B6B6B] text-xs">Needed hints or gave up</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="flex-1 flex flex-col min-h-50">
                    <label
                      htmlFor="notes"
                      className="block text-[#1A1A1A] mb-2 text-sm font-semibold"
                      style={{ fontFamily: 'var(--font-jost)' }}
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add your notes, insights, or approach here..."
                      className="flex-1 w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A1A1A] resize-none text-sm"
                      style={{ fontFamily: 'var(--font-jost)' }}
                    />
                  </div>
                </div>

                {/* Right Column: Solution (Code) - Keep dark for code readability */}
                <div className="flex flex-col h-full">
                  <label
                    htmlFor="solution"
                    className="block text-[#1A1A1A] mb-2 text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-jost)' }}
                  >
                    Solution (Code)
                  </label>
                  <div className="flex-1 relative rounded-sm overflow-hidden border border-[#E5E5E5] bg-[#1A1A1A]">
                    {/* Line numbers gutter */}
                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#111] border-r border-[#333] overflow-hidden pointer-events-none">
                      <div className="py-3 pr-2 text-right">
                        {(solution || ' ').split('\n').map((_, i) => (
                          <div
                            key={i}
                            className="text-[#6B6B6B] text-sm leading-5.25 font-mono select-none"
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    <textarea
                      id="solution"
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Paste your solution code here..."
                      wrap="off"
                      className="w-full h-full pl-12 pr-4 py-3 bg-transparent text-gray-100 placeholder-[#6B6B6B] focus:outline-none resize-none text-sm leading-5.25"
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                        tabSize: 2
                      }}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="h-full p-6 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#6B6B6B]" style={{ fontFamily: 'var(--font-jost)' }}>
                  No logs yet. Create your first log!
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-[#E5E5E5] rounded-sm overflow-hidden bg-white"
                    >
                      {/* Log Header - Always visible */}
                      <div
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusBadge(log.status)}
                          <span className="text-[#1A1A1A] font-medium" style={{ fontFamily: 'var(--font-jost)' }}>
                            {formatTimeSeconds(log.timeSpent)}
                          </span>
                          <span className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {onDeleteLog && (
                            <button
                              onClick={(e) => handleDeleteLog(log.id, e)}
                              disabled={deletingLogId === log.id}
                              className="p-1.5 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete log"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          <svg
                            className={`w-5 h-5 text-[#6B6B6B] transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedLogId === log.id && (
                        <div className="px-4 pb-4 border-t border-[#E5E5E5]">
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* Notes */}
                            <div>
                              <label className="block text-[#6B6B6B] text-xs font-medium mb-2" style={{ fontFamily: 'var(--font-jost)' }}>
                                Notes
                              </label>
                              <div className="bg-[#FAFAFA] rounded-sm p-3 min-h-32 max-h-64 overflow-y-auto border border-[#E5E5E5]">
                                {log.notes ? (
                                  <p className="text-[#1A1A1A] text-sm whitespace-pre-wrap" style={{ fontFamily: 'var(--font-jost)' }}>
                                    {log.notes}
                                  </p>
                                ) : (
                                  <p className="text-[#9CA3AF] text-sm italic">No notes</p>
                                )}
                              </div>
                            </div>

                            {/* Solution - Keep dark for code */}
                            <div>
                              <label className="block text-[#6B6B6B] text-xs font-medium mb-2" style={{ fontFamily: 'var(--font-jost)' }}>
                                Solution
                              </label>
                              <div className="bg-[#1A1A1A] rounded-sm p-3 min-h-32 max-h-64 overflow-auto">
                                {log.solution ? (
                                  <pre className="text-gray-300 text-sm whitespace-pre font-mono">
                                    {log.solution}
                                  </pre>
                                ) : (
                                  <p className="text-[#6B6B6B] text-sm italic">No solution</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Only show on New Log tab */}
        {activeTab === 'new' && (
          <div className="flex gap-3 justify-end p-6 border-t border-[#E5E5E5] shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F4F0] rounded-sm transition-colors"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (getEffectiveTime() === 0 && !notes.trim() && !solution.trim())}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white font-medium hover:bg-[#333] rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-jost)' }}
            >
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        )}

        {/* Confirmation Modal for Log Deletion */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, logId: null })}
          onConfirm={() => confirmModal.logId && performDeleteLog(confirmModal.logId)}
          title="Delete Log"
          message="Are you sure you want to delete this log? This action cannot be undone."
          showDontAskAgain={true}
          dontAskAgainKey="deleteLogs"
        />
      </div>
    </div>
  );
}
