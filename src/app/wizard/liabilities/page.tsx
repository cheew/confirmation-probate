'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';

interface LiabilityData {
  id: string;
  type: 'funeral' | 'mortgage' | 'other_debt';
  description: string;
  amount: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const SECTIONS: { type: LiabilityData['type']; title: string; help: string }[] = [
  {
    type: 'funeral',
    title: 'Funeral Expenses (Box 12)',
    help: 'Including reasonable mourning expenses and headstone costs.',
  },
  {
    type: 'mortgage',
    title: 'Mortgage / Standard Security (Box 13)',
    help: "Outstanding mortgage on heritable property at date of death. If jointly owned, enter only the deceased's share.",
  },
  {
    type: 'other_debt',
    title: 'Other Debts and Liabilities (Box 14)',
    help: 'Debts owed at death: unpaid bills, credit cards, personal loans. Do NOT include professional fees incurred after death.',
  },
];

export default function LiabilitiesPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [liabilities, setLiabilities] = useState<LiabilityData[]>(data.liabilities || []);

  const addLiability = (type: LiabilityData['type']) => {
    setLiabilities((prev) => [
      ...prev,
      { id: generateId(), type, description: '', amount: 0 },
    ]);
  };

  const updateLiability = (id: string, field: string, value: string | number) => {
    setLiabilities((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLiability = (id: string) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  };

  const getTotal = (type: LiabilityData['type']) =>
    liabilities.filter((l) => l.type === type).reduce((sum, l) => sum + l.amount, 0);

  const grossTotal = (data.assets || [])
    .filter((a: { country: string }) => a.country !== 'elsewhere')
    .reduce((sum: number, a: { deceasedShareValue: number }) => sum + a.deceasedShareValue, 0);

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netValue = grossTotal - totalLiabilities;

  const handleNext = () => {
    updateData({ liabilities });
    goNext();
  };

  return (
    <StepShell
      title="Liabilities"
      description="Enter the debts and expenses to be deducted from the estate."
      onNext={handleNext}
      onPrev={goPrev}
    >
      {SECTIONS.map((section) => (
        <div key={section.type} className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
            <p className="text-xs text-gray-500">{section.help}</p>
          </div>

          {liabilities
            .filter((l) => l.type === section.type)
            .map((l) => (
              <div key={l.id} className="flex gap-3 items-start bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={l.description}
                    onChange={(e) => updateLiability(l.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm mb-2"
                  />
                  <input
                    type="number"
                    min={0}
                    value={l.amount || ''}
                    onChange={(e) =>
                      updateLiability(l.id, 'amount', parseInt(e.target.value) || 0)
                    }
                    placeholder="Amount (£)"
                    className="w-48 p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLiability(l.id)}
                  className="text-sm text-red-600 hover:text-red-800 mt-2"
                >
                  Remove
                </button>
              </div>
            ))}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => addLiability(section.type)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add {section.type === 'funeral' ? 'funeral expense' : section.type === 'mortgage' ? 'mortgage' : 'debt'}
            </button>
            <span className="text-sm text-gray-600">
              Subtotal: £{getTotal(section.type).toLocaleString()}
            </span>
          </div>
        </div>
      ))}

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Gross estate (Box 11):</span>
          <span>£{grossTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Less funeral expenses (Box 12):</span>
          <span>£{getTotal('funeral').toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Less mortgage (Box 13):</span>
          <span>£{getTotal('mortgage').toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Less other debts (Box 14):</span>
          <span>£{getTotal('other_debt').toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
          <span>Net value (Box 15):</span>
          <span className={netValue < 0 ? 'text-red-600' : ''}>
            £{netValue.toLocaleString()}
          </span>
        </div>
      </div>
    </StepShell>
  );
}
