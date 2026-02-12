'use client';

import { useMemo } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import { buildInventory } from '@/lib/inventoryEngine';
import { buildDeclaration, formatDateForDeclaration } from '@/lib/declarationEngine';
import { computeConfirmationTotal, computeNetValue, validateTotals } from '@/lib/ruleEngine';
import type { Case, Asset, Executor } from '@/lib/schema';

/** Assemble wizard data into a Case object. */
function assembleCase(data: Record<string, unknown>): Case | null {
  try {
    const deceased = data.deceased as Record<string, unknown>;
    const executors = (data.executors as Record<string, unknown>[]).map((e) => ({
      fullName: e.fullName as string,
      relationship: e.relationship as string,
      gender: e.gender as 'male' | 'female',
      address: {
        line1: e.addressLine1 as string,
        line2: (e.addressLine2 as string) || '',
        line3: (e.addressLine3 as string) || '',
        line4: (e.addressLine4 as string) || '',
        postcode: e.postcode as string,
      },
      isDeclarant: e.isDeclarant as boolean,
      status: e.status as 'active' | 'declined' | 'deceased',
      declinedDate: e.declinedDate as string | undefined,
      deceasedDate: e.deceasedDate as string | undefined,
    }));

    const will = data.will as Record<string, unknown>;
    const willData = will.hasWill
      ? {
          hasWill: true as const,
          executorType: 'nominate' as const,
          willDate: will.willDate as string,
          hasCodicils: will.hasCodicils as boolean,
          codicilDates: (will.codicilDates as string[]) || [],
        }
      : {
          hasWill: false as const,
          executorType: 'dative' as const,
          sheriffdomOfDecree: will.sheriffdomOfDecree as typeof import('@/lib/constants').SHERIFFDOMS[number],
          dateOfDecree: will.dateOfDecree as string,
        };

    const assets: Asset[] = (data.assets as Record<string, unknown>[])?.map((a) => ({
      id: a.id as string,
      type: a.type as Asset['type'],
      country: a.country as Asset['country'],
      description: a.description as string,
      fullValue: a.fullValue as number,
      deceasedShareValue: a.deceasedShareValue as number,
      jointOwnership: a.jointOwnership as boolean,
      survivorshipClause: (a.survivorshipClause as boolean) || false,
    })) || [];

    const liabilities = (data.liabilities as Record<string, unknown>[])?.map((l) => ({
      id: l.id as string,
      type: l.type as 'funeral' | 'mortgage' | 'other_debt',
      description: l.description as string,
      amount: l.amount as number,
    })) || [];

    const today = new Date().toISOString().split('T')[0];

    return {
      version: 1,
      sheriffdom: data.sheriffdom as typeof import('@/lib/constants').SHERIFFDOMS[number],
      deceased: {
        title: deceased.title as string,
        firstNames: deceased.firstNames as string,
        surname: deceased.surname as string,
        address: {
          line1: deceased.addressLine1 as string,
          line2: (deceased.addressLine2 as string) || '',
          line3: (deceased.addressLine3 as string) || '',
          line4: (deceased.addressLine4 as string) || '',
          postcode: deceased.postcode as string,
        },
        occupation: deceased.occupation as string,
        dateOfBirth: deceased.dateOfBirth as string,
        dateOfDeath: deceased.dateOfDeath as string,
        placeOfDeath: deceased.placeOfDeath as string,
        maritalStatus: deceased.maritalStatus as 'married' | 'single' | 'divorced' | 'widowed',
        survivingSpouse: (deceased.survivingSpouse as boolean) || false,
        survivingParent: (deceased.survivingParent as boolean) || false,
        survivingSiblings: (deceased.survivingSiblings as boolean) || false,
        numberOfChildren: (deceased.numberOfChildren as number) || 0,
        numberOfGrandchildren: (deceased.numberOfGrandchildren as number) || 0,
        utr: (deceased.utr as string) || '',
        niNumber: (deceased.niNumber as string) || '',
      },
      executors,
      will: willData,
      assets,
      liabilities,
      declarationDate: today,
      currentStep: 'preview',
      yourReference: (data.yourReference as string) || '',
      hmrcReference: (data.hmrcReference as string) || '',
    };
  } catch {
    return null;
  }
}

export default function PreviewPage() {
  const { data, updateData, goNext, goPrev } = useWizard();

  const caseData = useMemo(() => assembleCase(data), [data]);

  const inventory = useMemo(
    () => (caseData ? buildInventory(caseData.assets) : null),
    [caseData]
  );

  const declaration = useMemo(
    () =>
      caseData && inventory
        ? buildDeclaration(caseData, inventory.totalPounds)
        : null,
    [caseData, inventory]
  );

  const confirmationTotal = caseData ? computeConfirmationTotal(caseData.assets) : 0;
  const netValue = caseData ? computeNetValue(confirmationTotal, caseData.liabilities) : 0;
  const validationErrors = caseData ? validateTotals(caseData) : [];

  const handleNext = () => {
    if (caseData) {
      updateData({ assembledCase: caseData });
    }
    goNext();
  };

  if (!caseData || !inventory || !declaration) {
    return (
      <StepShell title="Preview" onPrev={goPrev}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          Could not assemble case data. Please go back and complete all previous steps.
        </div>
      </StepShell>
    );
  }

  if (inventory.overflow) {
    return (
      <StepShell title="Preview" onPrev={goPrev}>
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <h3 className="text-lg font-bold text-red-800 mb-2">
            Inventory Overflow — C2 Required
          </h3>
          <p className="text-red-700">
            Your estate requires {inventory.overflowLineCount} inventory lines, but the C1 form
            only has {37} lines. Continuation sheets (C2) are not yet supported in this version.
          </p>
          <p className="text-red-700 mt-2">
            Please reduce the number of assets or consult a solicitor.
          </p>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Preview"
      description="Review all data before generating the PDF."
      onNext={handleNext}
      onPrev={goPrev}
      nextLabel="Continue to Payment"
      nextDisabled={validationErrors.length > 0}
    >
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="font-semibold text-red-800 mb-2">Validation Errors</h4>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Declaration preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">Declaration (Page 2)</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Declaration by:</strong> {declaration.C1_17}</p>
          <p><strong>Deceased:</strong> {declaration.C1_18}</p>
          <p><strong>Domicile:</strong> {declaration.C1_19}</p>
          <p><strong>Paragraph 2:</strong></p>
          <p className="bg-gray-50 p-2 rounded text-xs font-mono whitespace-pre-wrap">
            {declaration.C1_20}
          </p>
        </div>
      </div>

      {/* Inventory preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Inventory (Page 3) — {inventory.lines.length} lines
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 w-10">Item</th>
                <th className="text-left py-1">Description</th>
                <th className="text-right py-1 w-20">Price</th>
                <th className="text-right py-1 w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inventory.lines.map((line) => (
                <tr
                  key={line.lineNumber}
                  className={`border-b border-gray-100 ${
                    line.isHeading ? 'font-bold bg-gray-50' : ''
                  } ${line.isSummaryLine ? 'bg-blue-50' : ''}`}
                >
                  <td className="py-0.5">{line.itemNumber}</td>
                  <td className="py-0.5">{line.description}</td>
                  <td className="py-0.5 text-right">{line.price}</td>
                  <td className="py-0.5 text-right">{line.amount}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-bold">
                <td></td>
                <td className="py-1">TOTAL</td>
                <td></td>
                <td className="py-1 text-right">£{confirmationTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals cross-check */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Totals Cross-Check</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Inventory total = Box 9 = Box 11 = Declaration Para 6: <strong>£{confirmationTotal.toLocaleString()}</strong></p>
          <p>Box 15 (Net value) = Box 11 - Box 12 - Box 13 - Box 14: <strong>£{netValue.toLocaleString()}</strong></p>
        </div>
      </div>

      {/* Docquet reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
        <h4 className="font-semibold mb-2">Important: Docquet Required</h4>
        <p className="mb-2">
          After generating the PDF, you must write the following on the <strong>first page of the original will</strong>:
        </p>
        <div className="bg-white border border-amber-300 rounded p-3 font-mono text-xs">
          At [PLACE] on {formatDateForDeclaration(caseData.declarationDate)}. This is the Will
          referred to in my Declaration of this date relative to the Inventory of the Estate
          of the late {caseData.deceased.firstNames} {caseData.deceased.surname}.
          <br /><br />
          [Your signature]
        </div>
        <p className="mt-2 text-xs">
          The date on the docquet <strong>must match</strong> the declaration date on the form.
        </p>
      </div>
    </StepShell>
  );
}
