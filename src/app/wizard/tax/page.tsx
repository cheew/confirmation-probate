'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';

export default function TaxPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [utr, setUtr] = useState<string>(data.deceased?.utr || '');
  const [niNumber, setNiNumber] = useState<string>(data.deceased?.niNumber || '');

  const grossTotal = (data.assets || [])
    .filter((a: { country: string }) => a.country !== 'elsewhere')
    .reduce((sum: number, a: { deceasedShareValue: number }) => sum + a.deceasedShareValue, 0);

  const totalLiabilities = (data.liabilities || []).reduce(
    (sum: number, l: { amount: number }) => sum + l.amount,
    0
  );
  const netValue = grossTotal - totalLiabilities;

  const handleNext = () => {
    updateData({
      deceased: {
        ...data.deceased,
        utr,
        niNumber,
      },
    });
    goNext();
  };

  return (
    <StepShell
      title="Tax Information"
      description="Review the tax-related information and provide any missing details."
      onNext={handleNext}
      onPrev={goPrev}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">IHT Status</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>IHT400 completed:</strong> No (not required for excepted estates)
          </p>
          <p>
            <strong>Estate qualifies as excepted:</strong>{' '}
            {grossTotal <= 325000 ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Gross value for IHT:</strong> £{grossTotal.toLocaleString()}
          </p>
          <p>
            <strong>Net value for IHT:</strong> £{netValue.toLocaleString()}
          </p>
          <p>
            <strong>Tax payable:</strong> £0
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Deceased&apos;s Tax References</h3>
        <p className="text-xs text-gray-500">
          If unknown, leave blank. The form will show &quot;not known&quot;.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unique Taxpayer Reference (UTR) — 10 digits
          </label>
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="e.g. 1234567890"
            className="w-64 p-2 border border-gray-300 rounded-md text-sm font-mono"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            National Insurance Number — 2 letters, 6 digits, 1 letter
          </label>
          <input
            type="text"
            value={niNumber}
            onChange={(e) => setNiNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))}
            placeholder="e.g. AB123456C"
            className="w-64 p-2 border border-gray-300 rounded-md text-sm font-mono"
            maxLength={9}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">About the Deceased (Review)</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Marital status:</strong>{' '}
            {data.deceased?.maritalStatus
              ? {
                  married: 'Married or in a civil partnership',
                  single: 'Single',
                  divorced: 'Divorced or former civil partner',
                  widowed: 'Widowed or surviving civil partner',
                }[data.deceased.maritalStatus as string] || data.deceased.maritalStatus
              : 'Not set'}
          </p>
          <p>
            <strong>Surviving spouse/civil partner:</strong>{' '}
            {data.deceased?.survivingSpouse ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Surviving parent:</strong> {data.deceased?.survivingParent ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Surviving siblings:</strong>{' '}
            {data.deceased?.survivingSiblings ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Children:</strong> {data.deceased?.numberOfChildren ?? 0}
          </p>
          <p>
            <strong>Grandchildren:</strong> {data.deceased?.numberOfGrandchildren ?? 0}
          </p>
        </div>
      </div>
    </StepShell>
  );
}
