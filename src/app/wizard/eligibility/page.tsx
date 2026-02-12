'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import HardStopScreen from '@/components/wizard/HardStopScreen';
import { checkEligibility } from '@/lib/ruleEngine';
import { NIL_RATE_BAND } from '@/lib/constants';

const QUESTIONS = [
  { key: 'dateOfDeathOnOrAfter2022', label: 'Did the deceased die on or after 1 January 2022?' },
  { key: 'domiciledInScotland', label: 'Was the deceased domiciled in Scotland at the time of death?' },
  { key: 'grossEstateUnderNRB', label: `Is the gross estate value £${NIL_RATE_BAND.toLocaleString()} or less?` },
  { key: 'noBusinessInterests', label: 'Are there no business interests in the estate?' },
  { key: 'noAgriculturalLand', label: 'Is there no agricultural land or agricultural relief involved?' },
  { key: 'noComplexForeignProperty', label: 'Is there no complex foreign property?' },
  { key: 'noDisputedWill', label: 'Is the will undisputed (or is there no will)?' },
  { key: 'noOngoingLitigation', label: 'Is there no ongoing litigation involving the estate?' },
];

export default function EligibilityPage() {
  const { data, updateData, goNext, resetWizard } = useWizard();
  const [answers, setAnswers] = useState<Record<string, boolean>>(
    data.eligibility || {}
  );
  const [hardStop, setHardStop] = useState<{ message: string } | null>(null);

  const allAnswered = QUESTIONS.every((q) => answers[q.key] !== undefined);

  const handleAnswer = (key: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setHardStop(null);
  };

  const handleNext = () => {
    const stop = checkEligibility(answers);
    if (stop) {
      setHardStop(stop);
      return;
    }
    updateData({ eligibility: answers });
    goNext();
  };

  if (hardStop) {
    return <HardStopScreen message={hardStop.message} onStartOver={resetWizard} />;
  }

  return (
    <StepShell
      title="Eligibility Screening"
      description="Please confirm each of the following to determine if you can use this service."
      onNext={handleNext}
      nextDisabled={!allAnswered}
      showPrev={false}
    >
      {QUESTIONS.map((q) => (
        <div key={q.key} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{q.label}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAnswer(q.key, true)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                answers[q.key] === true
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(q.key, false)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                answers[q.key] === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>
        </div>
      ))}
    </StepShell>
  );
}
