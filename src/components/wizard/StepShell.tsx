'use client';

import { type ReactNode } from 'react';

interface StepShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  nextDisabled?: boolean;
  showPrev?: boolean;
}

export default function StepShell({
  title,
  description,
  children,
  onNext,
  onPrev,
  nextLabel = 'Continue',
  prevLabel = 'Back',
  nextDisabled = false,
  showPrev = true,
}: StepShellProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-6">{description}</p>}

      <div className="space-y-6 mb-8">{children}</div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        {showPrev && onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {prevLabel}
          </button>
        ) : (
          <div />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
