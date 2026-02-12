'use client';

import { useState, useCallback } from 'react';
import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';
import { generatePdf } from '@/lib/pdfEngine';
import { formatDateForDeclaration } from '@/lib/declarationEngine';
import type { Case } from '@/lib/schema';

export default function DownloadPage() {
  const { data, goPrev, resetWizard } = useWizard();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const caseData = data.assembledCase as Case | undefined;

  const handleGenerate = useCallback(async () => {
    if (!caseData) {
      setError('Case data not found. Please go back to the Preview step.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const pdfBytes = await generatePdf(caseData);
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `C1-2022-${caseData.deceased.surname}-${caseData.deceased.firstNames.split(' ')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setError(`PDF generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }, [caseData]);

  return (
    <StepShell
      title="Download PDF"
      showPrev={true}
      onPrev={goPrev}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!downloadUrl ? (
        <div className="text-center py-8">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !caseData}
            className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating PDF...' : 'Generate PDF'}
          </button>
          {!caseData && (
            <p className="text-sm text-red-600 mt-2">
              Please complete the Preview step first.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              PDF Generated Successfully
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Your C1(2022) form has been generated and should have downloaded automatically.
            </p>
            <a
              href={downloadUrl}
              download={`C1-2022-${caseData?.deceased.surname}.pdf`}
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Download Again
            </a>
          </div>

          {caseData && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
              <h4 className="font-semibold mb-2">
                Next Steps — You Must Do These Before Submitting
              </h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Print</strong> the generated PDF.
                </li>
                <li>
                  <strong>Write the docquet</strong> on the first page of the original will:
                  <div className="bg-white border border-amber-300 rounded p-3 font-mono text-xs mt-1 ml-4">
                    At [PLACE] on{' '}
                    {formatDateForDeclaration(caseData.declarationDate)}. This is the Will referred
                    to in my Declaration of this date relative to the Inventory of the Estate of the
                    late {caseData.deceased.firstNames} {caseData.deceased.surname}.
                    <br /><br />
                    [Your signature]
                  </div>
                </li>
                <li>
                  <strong>Sign</strong> the declaration on page 2 of the printed form.
                </li>
                <li>
                  <strong>Submit</strong> to the Sheriff Court with:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>The printed C1 form</li>
                    <li>The original will (with docquet)</li>
                    <li>Death certificate</li>
                    <li>Court fee</li>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={resetWizard}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Start a New Case
            </button>
          </div>
        </div>
      )}
    </StepShell>
  );
}
