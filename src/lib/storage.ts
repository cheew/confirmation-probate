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

/** Export wizard data as a downloadable JSON file. */
export function exportWizardDataToFile(data: Record<string, unknown>): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  a.download = `confirmation-session-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import wizard data from a JSON file. Returns parsed data or null on error. */
export function parseWizardDataFile(file: File): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          resolve(parsed as Record<string, unknown>);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
