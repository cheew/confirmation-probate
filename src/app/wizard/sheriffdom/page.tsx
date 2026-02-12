'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import { SHERIFFDOMS } from '@/lib/constants';

export default function SheriffdomPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [sheriffdom, setSheriffdom] = useState<string>(data.sheriffdom || '');

  const handleNext = () => {
    updateData({ sheriffdom });
    goNext();
  };

  return (
    <StepShell
      title="Sheriffdom Selection"
      description="Select the Sheriffdom where the deceased was domiciled. This determines the court that will process the Confirmation and the domicile wording in the Declaration."
      onNext={handleNext}
      onPrev={goPrev}
      nextDisabled={!sheriffdom}
    >
      <div>
        <label htmlFor="sheriffdom" className="block text-sm font-medium text-gray-700 mb-2">
          Sheriffdom
        </label>
        <select
          id="sheriffdom"
          value={sheriffdom}
          onChange={(e) => setSheriffdom(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900"
        >
          <option value="">-- Select Sheriffdom --</option>
          {SHERIFFDOMS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {sheriffdom === 'Lothian and Borders' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
          <strong>Note:</strong> Edinburgh (Lothian and Borders) is known to be the strictest court
          for Confirmation applications. Pay particular attention to declaration wording and
          property descriptions.
        </div>
      )}
    </StepShell>
  );
}
