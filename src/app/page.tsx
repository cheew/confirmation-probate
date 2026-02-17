'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadWizardData, clearWizardData, clearCase } from '@/lib/storage';

export default function Home() {
  const [hasSavedData, setHasSavedData] = useState(false);
  const [savedStep, setSavedStep] = useState<string | null>(null);

  useEffect(() => {
    const data = loadWizardData();
    if (data && Object.keys(data).length > 0) {
      setHasSavedData(true);
      setSavedStep((data.currentStep as string) || 'eligibility');
    }
  }, []);

  const handleStartFresh = () => {
    clearWizardData();
    clearCase();
    setHasSavedData(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Scottish Confirmation
        </h1>
        <h2 className="text-lg sm:text-xl text-gray-600 mb-8">
          C1(2022) Form Completion Wizard
        </h2>

        <p className="text-gray-700 mb-8 max-w-lg mx-auto text-sm sm:text-base">
          Complete your Scottish Confirmation application without a solicitor.
          This wizard collects your estate information and generates a fully
          completed C1(2022) PDF ready for submission to the Sheriff Court.
        </p>

        {hasSavedData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">
              You have a saved application
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              You were on the <strong>{savedStep}</strong> step. Would you like to continue or start fresh?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/wizard/${savedStep}`}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Application
              </Link>
              <button
                type="button"
                onClick={handleStartFresh}
                className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left text-sm">
          <h3 className="font-semibold text-gray-900 mb-3">What you will need:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>Death certificate details (date and place of death)</li>
            <li>Details of the deceased (full name, address, date of birth, occupation)</li>
            <li>The will (if there is one) and its date</li>
            <li>Details of all executors</li>
            <li>A list of all estate assets with values at date of death</li>
            <li>Details of any debts owed by the deceased at death</li>
            <li>For property: the title number from the Land Register or Sasines reference</li>
            <li>For bank accounts: the account numbers and balances at date of death</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-sm text-amber-800 text-left">
          <strong>Important:</strong> This service does not provide legal advice. It automates
          structured document completion using deterministic logic. For complex estates
          (over £325,000, business interests, disputed wills), you should consult a solicitor.
        </div>

        {!hasSavedData && (
          <Link
            href="/wizard/eligibility"
            className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Application
          </Link>
        )}

        <p className="text-xs text-gray-500 mt-8">
          For deaths on or after 1 January 2022. Scotland only.
          All data is stored locally in your browser.
        </p>
      </main>
    </div>
  );
}
