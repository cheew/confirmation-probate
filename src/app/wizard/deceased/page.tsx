'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';

interface DeceasedData {
  title: string;
  firstNames: string;
  surname: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  postcode: string;
  occupation: string;
  dateOfBirth: string;
  dateOfDeath: string;
  placeOfDeath: string;
  maritalStatus: string;
  survivingSpouse: boolean;
  survivingParent: boolean;
  survivingSiblings: boolean;
  numberOfChildren: number;
  numberOfGrandchildren: number;
}

const DEFAULT_DECEASED: DeceasedData = {
  title: '',
  firstNames: '',
  surname: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  addressLine4: '',
  postcode: '',
  occupation: '',
  dateOfBirth: '',
  dateOfDeath: '',
  placeOfDeath: '',
  maritalStatus: '',
  survivingSpouse: false,
  survivingParent: false,
  survivingSiblings: false,
  numberOfChildren: 0,
  numberOfGrandchildren: 0,
};

export default function DeceasedPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [form, setForm] = useState<DeceasedData>(data.deceased || DEFAULT_DECEASED);
  const [errors, setErrors] = useState<string[]>([]);

  const update = (field: keyof DeceasedData, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.title) errs.push('Title is required');
    if (!form.firstNames) errs.push('First names are required');
    if (!form.surname) errs.push('Surname is required');
    if (!form.addressLine1) errs.push('Address line 1 is required');
    if (!form.postcode) errs.push('Postcode is required');
    if (!form.occupation) errs.push('Occupation is required (enter "none" if not applicable)');
    if (!form.dateOfBirth) errs.push('Date of birth is required');
    if (!form.dateOfDeath) errs.push('Date of death is required');
    if (form.dateOfDeath && form.dateOfDeath < '2022-01-01') {
      errs.push('Date of death must be on or after 1 January 2022');
    }
    if (!form.placeOfDeath) errs.push('Place of death is required');
    if (!form.maritalStatus) errs.push('Marital status is required');
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    updateData({ deceased: form });
    goNext();
  };

  return (
    <StepShell
      title="Deceased's Details"
      description="Enter the details of the person who has died."
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

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Mr, Mrs, Ms..."
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            maxLength={10}
          />
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">First Names</label>
          <input
            type="text"
            value={form.firstNames}
            onChange={(e) => update('firstNames', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            maxLength={80}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
        <input
          type="text"
          value={form.surname}
          onChange={(e) => update('surname', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          maxLength={40}
        />
        <p className="text-xs text-gray-500 mt-1">
          If known by another name, include it: e.g. &quot;Smith otherwise known as Jones&quot;
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Last Known Address</legend>
        {(['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4'] as const).map(
          (field, idx) => (
            <input
              key={field}
              type="text"
              value={form[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={`Address line ${idx + 1}${idx === 0 ? ' (required)' : ''}`}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              maxLength={40}
            />
          )
        )}
        <input
          type="text"
          value={form.postcode}
          onChange={(e) => update('postcode', e.target.value)}
          placeholder="Postcode"
          className="w-48 p-2 border border-gray-300 rounded-md text-sm"
          maxLength={10}
        />
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
        <input
          type="text"
          value={form.occupation}
          onChange={(e) => update('occupation', e.target.value)}
          placeholder='e.g. "Teacher (retired)" or "none"'
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          maxLength={40}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
          <input
            type="date"
            value={form.dateOfDeath}
            onChange={(e) => update('dateOfDeath', e.target.value)}
            min="2022-01-01"
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
        <input
          type="text"
          value={form.placeOfDeath}
          onChange={(e) => update('placeOfDeath', e.target.value)}
          placeholder="City or town"
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          maxLength={40}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Marital Status at Death
        </label>
        <select
          value={form.maritalStatus}
          onChange={(e) => update('maritalStatus', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="">-- Select --</option>
          <option value="married">Married or in a civil partnership</option>
          <option value="single">Single</option>
          <option value="divorced">Divorced or former civil partner</option>
          <option value="widowed">Widowed or surviving civil partner</option>
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700 mb-2">Surviving Relatives</legend>
        {[
          { key: 'survivingSpouse', label: 'Surviving spouse or civil partner' },
          { key: 'survivingParent', label: 'Surviving parent' },
          { key: 'survivingSiblings', label: 'Surviving brothers or sisters' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form[key as keyof DeceasedData] as boolean}
              onChange={(e) => update(key as keyof DeceasedData, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Surviving Children
          </label>
          <input
            type="number"
            min={0}
            max={99}
            value={form.numberOfChildren}
            onChange={(e) => update('numberOfChildren', parseInt(e.target.value) || 0)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Surviving Grandchildren
          </label>
          <input
            type="number"
            min={0}
            max={999}
            value={form.numberOfGrandchildren}
            onChange={(e) => update('numberOfGrandchildren', parseInt(e.target.value) || 0)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    </StepShell>
  );
}
