'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import HardStopScreen from '@/components/wizard/HardStopScreen';
import { checkEligibility } from '@/lib/ruleEngine';
import { NIL_RATE_BAND } from '@/lib/constants';

interface Question {
  key: string;
  label: string;
  hint?: string;
  showIf?: (answers: Record<string, boolean>) => boolean;
}

const QUESTIONS: Question[] = [
  { key: 'dateOfDeathOnOrAfter2022', label: 'Did the deceased die on or after 1 January 2022?' },
  { key: 'domiciledInScotland', label: 'Was the deceased domiciled in Scotland at the time of death?' },
  { key: 'grossEstateUnderNRB', label: `Is the gross estate value £${NIL_RATE_BAND.toLocaleString()} or less?` },
  { key: 'hasBusinessInterests', label: 'Does the estate include any business interests?', hint: 'Examples: sole trader, partnership, limited company shares.' },
  { key: 'hasAgriculturalLand', label: 'Does the estate include any agricultural land or claim Agricultural Property Relief?' },
  { key: 'hasForeignProperty', label: 'Does the estate include any property or significant assets located outside the UK?' },
  { key: 'hasValidWill', label: 'Was a valid will left?' },
  { key: 'willIsDisputed', label: 'Is anyone disputing the will or challenging its validity?', showIf: (a) => a.hasValidWill === true },
  { key: 'hasOngoingLitigation', label: 'Is the estate involved in any ongoing legal disputes or court proceedings?' },
];

export default function EligibilityPage() {
  const { data, updateData, goNext, resetWizard } = useWizard();
  const [answers, setAnswers] = useState<Record<string, boolean>>(
    data.eligibility || {}
  );
  const [hardStop, setHardStop] = useState<{ message: string } | null>(null);

  const visibleQuestions = QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
  const allAnswered = visibleQuestions.every((q) => answers[q.key] !== undefined);

  const handleAnswer = (key: string, value: boolean) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'hasValidWill' && !value) {
        delete next.willIsDisputed;
      }
      return next;
    });
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
      {visibleQuestions.map((q) => (
        <div key={q.key} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{q.label}</p>
            {q.hint && <p className="text-xs text-gray-500 mt-1">{q.hint}</p>}
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
