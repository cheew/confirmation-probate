'use client';

import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import { ASSET_TYPES, ASSET_COUNTRIES, ASSET_TYPE_LABELS, ASSET_COUNTRY_LABELS } from '@/lib/constants';

interface AssetData {
  id: string;
  type: string;
  country: string;
  description: string;
  fullValue: number;
  deceasedShareValue: number;
  jointOwnership: boolean;
  survivorshipClause: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function AssetsPage() {
  const { data, updateData, goNext, goPrev } = useWizard();
  const [assets, setAssets] = useState<AssetData[]>(data.assets || []);
  const [editing, setEditing] = useState<AssetData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const total = assets
    .filter((a) => a.country !== 'elsewhere')
    .reduce((sum, a) => sum + a.deceasedShareValue, 0);

  const startAdd = () => {
    setEditing({
      id: generateId(),
      type: '',
      country: 'scotland',
      description: '',
      fullValue: 0,
      deceasedShareValue: 0,
      jointOwnership: false,
      survivorshipClause: false,
    });
    setShowForm(true);
  };

  const startEdit = (asset: AssetData) => {
    setEditing({ ...asset });
    setShowForm(true);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const saveAsset = () => {
    if (!editing) return;
    const errs: string[] = [];
    if (!editing.type) errs.push('Asset type is required.');
    if (!editing.description) errs.push('Description is required.');
    if (editing.deceasedShareValue <= 0) errs.push("Deceased's share value must be greater than 0.");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setAssets((prev) => {
      const existing = prev.findIndex((a) => a.id === editing.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = editing;
        return next;
      }
      return [...prev, editing];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleNext = () => {
    updateData({ assets });
    goNext();
  };

  if (showForm && editing) {
    return (
      <StepShell
        title={assets.some((a) => a.id === editing.id) ? 'Edit Asset' : 'Add Asset'}
        onNext={saveAsset}
        nextLabel="Save Asset"
        onPrev={() => {
          setShowForm(false);
          setEditing(null);
          setErrors([]);
        }}
        prevLabel="Cancel"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
          <select
            value={editing.type}
            onChange={(e) => setEditing({ ...editing, type: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="">-- Select --</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            value={editing.country}
            onChange={(e) => setEditing({ ...editing, country: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            {ASSET_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {ASSET_COUNTRY_LABELS[c]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            For bank accounts, use the country of the institution&apos;s registered office (not
            the branch).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder={
              editing.type === 'heritable_property'
                ? 'Subjects at [ADDRESS] being the subjects registered in the Land Register of Scotland under Title Number [NUMBER]'
                : editing.type === 'bank_account' || editing.type === 'building_society'
                  ? 'Bank of Scotland, Edinburgh, Current Account 12345678, balance at date of death including accrued interest'
                  : editing.type === 'household_goods'
                    ? 'Household goods and personal effects, value estimated by the Executor at the date of death'
                    : ''
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Max 60 characters per line on the form. Long descriptions will be truncated.
          </p>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editing.jointOwnership}
            onChange={(e) => setEditing({ ...editing, jointOwnership: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Jointly owned</span>
        </label>

        {editing.jointOwnership && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Market Value (whole property)
            </label>
            <input
              type="number"
              min={0}
              value={editing.fullValue || ''}
              onChange={(e) => setEditing({ ...editing, fullValue: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g. 200000"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {editing.jointOwnership ? "Deceased's Share Value" : 'Value'}
          </label>
          <input
            type="number"
            min={0}
            value={editing.deceasedShareValue || ''}
            onChange={(e) =>
              setEditing({
                ...editing,
                deceasedShareValue: parseInt(e.target.value) || 0,
                fullValue: editing.jointOwnership
                  ? editing.fullValue
                  : parseInt(e.target.value) || 0,
              })
            }
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g. 100000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Whole pounds only. No pound sign, no commas. Round down.
          </p>
        </div>

        {editing.type === 'heritable_property' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.survivorshipClause}
              onChange={(e) => setEditing({ ...editing, survivorshipClause: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Title includes survivorship clause (&quot;and to the survivor of them&quot;)
            </span>
          </label>
        )}

        {editing.survivorshipClause && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            Property with a survivorship clause may pass to the survivor without Confirmation. Some
            courts still require it to be listed. Including it is the safest approach.
          </div>
        )}
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Asset Inventory"
      description="Add all assets belonging to the estate."
      onNext={handleNext}
      onPrev={goPrev}
    >
      {assets.length === 0 ? (
        <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">No assets added yet.</p>
          <button
            type="button"
            onClick={startAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add First Asset
          </button>
        </div>
      ) : (
        <>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {ASSET_TYPE_LABELS[asset.type as keyof typeof ASSET_TYPE_LABELS] || asset.type}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{asset.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {ASSET_COUNTRY_LABELS[asset.country as keyof typeof ASSET_COUNTRY_LABELS]} |{' '}
                  {asset.jointOwnership ? `Joint (share: £${asset.deceasedShareValue.toLocaleString()})` : `£${asset.deceasedShareValue.toLocaleString()}`}
                </div>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(asset)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={startAdd}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400"
          >
            + Add Another Asset
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
            <strong>Total for Confirmation:</strong> £{total.toLocaleString()}
          </div>
        </>
      )}
    </StepShell>
  );
}
