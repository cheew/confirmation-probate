import type { Case } from './schema';
import { caseSchema } from './schema';

const STORAGE_KEY = 'confirmation-probate-case';

export function saveCase(c: Case): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function loadCase(): Case | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return caseSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function clearCase(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Save partial wizard data (before full case is assembled). */
export function saveWizardData(data: Record<string, unknown>): void {
  localStorage.setItem('confirmation-probate-wizard', JSON.stringify(data));
}

export function loadWizardData(): Record<string, unknown> | null {
  const raw = localStorage.getItem('confirmation-probate-wizard');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearWizardData(): void {
  localStorage.removeItem('confirmation-probate-wizard');
}
