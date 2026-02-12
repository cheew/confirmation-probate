'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import { SHERIFFDOMS } from '@/lib/constants';

interface WillData {
  hasWill: boolean | null;
  willDate: string;
  hasCodicils: boolean;
  codicilDates: string[];
  sheriffdomOfDecree: string;
  dateOfDecree: string;
}

const DEFAULT_WILL: WillData = {
  hasWill: null,
  willDate: '',
  hasCodicils: false,
  codicilDates: [],
  sheriffdomOfDecree: '',
  dateOfDecree: '',
};

export default function WillPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [form, setForm] = useState<WillData>(data.will || DEFAULT_WILL);
  const [errors, setErrors] = useState<string[]>([]);

  const update = (field: keyof WillData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addCodicilDate = () => {
    setForm((prev) => ({ ...prev, codicilDates: [...prev.codicilDates, ''] }));
  };

  const updateCodicilDate = (idx: number, value: string) => {
    setForm((prev) => {
      const dates = [...prev.codicilDates];
      dates[idx] = value;
      return { ...prev, codicilDates: dates };
    });
  };

  const removeCodicilDate = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      codicilDates: prev.codicilDates.filter((_, i) => i !== idx),
    }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (form.hasWill === null) {
      errs.push('Please indicate whether the deceased left a will.');
      return errs;
    }
    if (form.hasWill) {
      if (!form.willDate) errs.push('Date of will is required.');
      if (form.hasCodicils && form.codicilDates.some((d) => !d)) {
        errs.push('All codicil dates must be filled in.');
      }
    } else {
      if (!form.sheriffdomOfDecree) errs.push('Sheriffdom of decree is required.');
      if (!form.dateOfDecree) errs.push('Date of decree is required.');
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
    updateData({ will: form });
    goNext();
  };

  return (
    <StepShell
      title="Will Details"
      description="Did the deceased leave a will?"
      onNext={handleNext}
      onPrev={goPrev}
      nextDisabled={form.hasWill === null}
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

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => update('hasWill', true)}
          className={`flex-1 p-4 rounded-lg border-2 text-center ${
            form.hasWill === true
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold">Yes, there is a will</div>
          <div className="text-sm mt-1">Executor Nominate</div>
        </button>
        <button
          type="button"
          onClick={() => update('hasWill', false)}
          className={`flex-1 p-4 rounded-lg border-2 text-center ${
            form.hasWill === false
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold">No will</div>
          <div className="text-sm mt-1">Executor Dative (intestate)</div>
        </button>
      </div>

      {form.hasWill === true && (
        <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Will</label>
            <input
              type="date"
              value={form.willDate}
              onChange={(e) => update('willDate', e.target.value)}
              className="w-48 p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hasCodicils}
              onChange={(e) => {
                update('hasCodicils', e.target.checked);
                if (!e.target.checked) update('codicilDates', []);
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">The will has codicils (amendments)</span>
          </label>

          {form.hasCodicils && (
            <div className="space-y-2 ml-6">
              {form.codicilDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => updateCodicilDate(idx, e.target.value)}
                    className="w-48 p-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeCodicilDate(idx)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCodicilDate}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add codicil date
              </button>
            </div>
          )}
        </div>
      )}

      {form.hasWill === false && (
        <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Since there is no will, the executor must be appointed by the Sheriff Court (Executor
            Dative).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sheriffdom of Decree
            </label>
            <select
              value={form.sheriffdomOfDecree}
              onChange={(e) => update('sheriffdomOfDecree', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">-- Select --</option>
              {SHERIFFDOMS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Decree</label>
            <input
              type="date"
              value={form.dateOfDecree}
              onChange={(e) => update('dateOfDecree', e.target.value)}
              className="w-48 p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}
    </StepShell>
  );
}
