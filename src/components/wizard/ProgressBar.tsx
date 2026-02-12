'use client';

import { WIZARD_STEPS } from '@/lib/constants';

interface ProgressBarProps {
  currentStep: string;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.slug === currentStep);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.slug} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '\u2713' : idx + 1}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isCurrent ? 'font-semibold text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    idx < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
