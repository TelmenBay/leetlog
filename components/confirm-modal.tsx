'use client';

import { useState, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showDontAskAgain?: boolean;
  dontAskAgainKey?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  showDontAskAgain = false,
  dontAskAgainKey,
}: ConfirmModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDontAskAgain(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (dontAskAgain && dontAskAgainKey) {
      localStorage.setItem(`skipConfirm_${dontAskAgainKey}`, 'true');
    }
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)] max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5E5]">
          <h3 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-jost)' }}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
            {message}
          </p>

          {showDontAskAgain && (
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-4 h-4 rounded border-[#D4D4D4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
              />
              <span className="text-[#6B6B6B] text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                Don't ask me again
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-5 border-t border-[#E5E5E5]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F4F0] rounded-sm transition-colors text-sm font-medium"
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-sm transition-colors text-sm font-medium"
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function to check if confirmation should be skipped
export function shouldSkipConfirmation(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`skipConfirm_${key}`) === 'true';
}

// Utility function to reset the skip preference
export function resetSkipConfirmation(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`skipConfirm_${key}`);
  }
}
