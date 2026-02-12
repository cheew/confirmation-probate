'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WIZARD_STEPS } from '@/lib/constants';
import { saveWizardData, loadWizardData, clearWizardData } from '@/lib/storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WizardData = Record<string, any>;

interface WizardContextType {
  data: WizardData;
  updateData: (stepData: WizardData) => void;
  currentStep: string;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (slug: string) => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<WizardData>({});
  const [loaded, setLoaded] = useState(false);

  // Determine current step from pathname
  const currentStep = pathname?.split('/').pop() || 'eligibility';

  // Load saved data on mount
  useEffect(() => {
    const saved = loadWizardData();
    if (saved) setData(saved);
    setLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (loaded) {
      saveWizardData(data);
    }
  }, [data, loaded]);

  const updateData = useCallback((stepData: WizardData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const goNext = useCallback(() => {
    const idx = WIZARD_STEPS.findIndex((s) => s.slug === currentStep);
    if (idx < WIZARD_STEPS.length - 1) {
      router.push(`/wizard/${WIZARD_STEPS[idx + 1].slug}`);
    }
  }, [currentStep, router]);

  const goPrev = useCallback(() => {
    const idx = WIZARD_STEPS.findIndex((s) => s.slug === currentStep);
    if (idx > 0) {
      router.push(`/wizard/${WIZARD_STEPS[idx - 1].slug}`);
    }
  }, [currentStep, router]);

  const goToStep = useCallback(
    (slug: string) => {
      router.push(`/wizard/${slug}`);
    },
    [router]
  );

  const resetWizard = useCallback(() => {
    setData({});
    clearWizardData();
    router.push('/wizard/eligibility');
  }, [router]);

  if (!loaded) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <WizardContext.Provider
      value={{ data, updateData, currentStep, goNext, goPrev, goToStep, resetWizard }}
    >
      {children}
    </WizardContext.Provider>
  );
}
