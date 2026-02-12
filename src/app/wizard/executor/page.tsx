'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';

interface ExecutorData {
  fullName: string;
  relationship: string;
  gender: 'male' | 'female';
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  postcode: string;
  isDeclarant: boolean;
  status: 'active' | 'declined' | 'deceased';
  declinedDate?: string;
  deceasedDate?: string;
}

const EMPTY_EXECUTOR: ExecutorData = {
  fullName: '',
  relationship: '',
  gender: 'male',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  addressLine4: '',
  postcode: '',
  isDeclarant: true,
  status: 'active',
};

export default function ExecutorPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [executors, setExecutors] = useState<ExecutorData[]>(
    data.executors?.length ? data.executors : [{ ...EMPTY_EXECUTOR }]
  );
  const [errors, setErrors] = useState<string[]>([]);

  const updateExecutor = (idx: number, field: string, value: string | boolean) => {
    setExecutors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // If setting isDeclarant to true, unset all others
      if (field === 'isDeclarant' && value === true) {
        next.forEach((e, i) => {
          if (i !== idx) next[i] = { ...next[i], isDeclarant: false };
        });
      }
      return next;
    });
  };

  const addExecutor = () => {
    if (executors.length < 4) {
      setExecutors((prev) => [...prev, { ...EMPTY_EXECUTOR, isDeclarant: false }]);
    }
  };

  const removeExecutor = (idx: number) => {
    if (executors.length > 1) {
      setExecutors((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        // Ensure at least one declarant
        if (!next.some((e) => e.isDeclarant)) {
          next[0] = { ...next[0], isDeclarant: true };
        }
        return next;
      });
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const declarantCount = executors.filter((e) => e.isDeclarant).length;
    if (declarantCount !== 1) errs.push('Exactly one executor must be the declarant (signer).');
    executors.forEach((e, i) => {
      if (!e.fullName) errs.push(`Executor ${i + 1}: full name is required.`);
      if (!e.relationship) errs.push(`Executor ${i + 1}: relationship is required.`);
      if (!e.addressLine1) errs.push(`Executor ${i + 1}: address is required.`);
      if (!e.postcode) errs.push(`Executor ${i + 1}: postcode is required.`);
    });
    if (!executors.some((e) => e.status === 'active')) {
      errs.push('At least one executor must be active.');
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    updateData({ executors });
    goNext();
  };

  return (
    <StepShell
      title="Executor Details"
      description="Enter the details of all executors. One executor must be the declarant who will sign the form."
      onNext={handleNext}
      onPrev={goPrev}
    >
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {executors.map((exec, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Executor {idx + 1}</h3>
            {executors.length > 1 && (
              <button
                type="button"
                onClick={() => removeExecutor(idx)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={exec.fullName}
                onChange={(e) => updateExecutor(idx, 'fullName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship to Deceased
              </label>
              <input
                type="text"
                value={exec.relationship}
                onChange={(e) => updateExecutor(idx, 'relationship', e.target.value)}
                placeholder="e.g. son, daughter, wife"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                maxLength={40}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={exec.gender}
                onChange={(e) => updateExecutor(idx, 'gender', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="male">Male (Executor)</option>
                <option value="female">Female (Executrix)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            {(['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4'] as const).map(
              (field, i) => (
                <input
                  key={field}
                  type="text"
                  value={exec[field]}
                  onChange={(e) => updateExecutor(idx, field, e.target.value)}
                  placeholder={`Address line ${i + 1}`}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  maxLength={40}
                />
              )
            )}
            <input
              type="text"
              value={exec.postcode}
              onChange={(e) => updateExecutor(idx, 'postcode', e.target.value)}
              placeholder="Postcode"
              className="w-48 p-2 border border-gray-300 rounded-md text-sm"
              maxLength={10}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`status-${idx}`}
                checked={exec.status === 'active'}
                onChange={() => updateExecutor(idx, 'status', 'active')}
                className="border-gray-300"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`status-${idx}`}
                checked={exec.status === 'declined'}
                onChange={() => updateExecutor(idx, 'status', 'declined')}
                className="border-gray-300"
              />
              <span className="text-sm text-gray-700">Declined</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`status-${idx}`}
                checked={exec.status === 'deceased'}
                onChange={() => updateExecutor(idx, 'status', 'deceased')}
                className="border-gray-300"
              />
              <span className="text-sm text-gray-700">Deceased</span>
            </label>
          </div>

          {exec.status === 'declined' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Declined</label>
              <input
                type="date"
                value={exec.declinedDate || ''}
                onChange={(e) => updateExecutor(idx, 'declinedDate', e.target.value)}
                className="w-48 p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          {exec.status === 'deceased' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
              <input
                type="date"
                value={exec.deceasedDate || ''}
                onChange={(e) => updateExecutor(idx, 'deceasedDate', e.target.value)}
                className="w-48 p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exec.isDeclarant}
              onChange={(e) => updateExecutor(idx, 'isDeclarant', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              This executor will sign the declaration (declarant)
            </span>
          </label>
        </div>
      ))}

      {executors.length < 4 && (
        <button
          type="button"
          onClick={addExecutor}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
        >
          + Add Another Executor
        </button>
      )}
    </StepShell>
  );
}
