'use client';

import { WizardProvider, useWizard } from '@/components/wizard/WizardContext';
import ProgressBar from '@/components/wizard/ProgressBar';
import { useRef, useState, type ReactNode } from 'react';

function WizardContent({ children }: { children: ReactNode }) {
  const { currentStep, exportSession, importSession } = useWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const ok = await importSession(file);
    if (!ok) {
      setImportError('Invalid session file. Please select a valid JSON export.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Scottish Confirmation — C1(2022) Wizard
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportSession}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
              >
                Export Session
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
              >
                Import Session
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
          {importError && (
            <p className="text-sm text-red-600 mb-2">{importError}</p>
          )}
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
