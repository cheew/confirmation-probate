'use client';

import { useWizard } from '@/components/wizard/WizardContext';
import StepShell from '@/components/wizard/StepShell';

export default function PaymentPage() {
  const { goNext, goPrev } = useWizard();

  return (
    <StepShell
      title="Payment"
      description="Payment is required to download the completed PDF."
      onNext={goNext}
      onPrev={goPrev}
      nextLabel="Continue to Download"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Payment Coming Soon
        </h3>
        <p className="text-blue-700 text-sm">
          Payment functionality will be added in a future release. For now, click Continue to
          generate and download your PDF.
        </p>
      </div>

      {/* TODO: Integrate payment provider */}
    </StepShell>
  );
}
