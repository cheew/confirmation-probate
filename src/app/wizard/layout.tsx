'use client';

import { WizardProvider, useWizard } from '@/components/wizard/WizardContext';
import ProgressBar from '@/components/wizard/ProgressBar';
import { type ReactNode } from 'react';

function WizardContent({ children }: { children: ReactNode }) {
  const { currentStep } = useWizard();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900 mb-4">
            Scottish Confirmation — C1(2022) Wizard
          </h1>
          <ProgressBar currentStep={currentStep} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

export default function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <WizardProvider>
      <WizardContent>{children}</WizardContent>
    </WizardProvider>
  );
}
