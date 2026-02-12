import { NIL_RATE_BAND, TRANSFERABLE_NRB_LIMIT, MIN_DEATH_DATE } from './constants';
import type { Case, Asset, Liability } from './schema';

// === Hard stop ===
export interface HardStop {
  code: string;
  message: string;
}

export function checkEligibility(answers: Record<string, boolean>): HardStop | null {
  // Questions where "Yes" (true) means eligible
  const mustBeTrue: [string, string, string][] = [
    ['dateOfDeathOnOrAfter2022', 'DEATH_BEFORE_2022', 'This form is only for deaths on or after 1 January 2022.'],
    ['domiciledInScotland', 'NON_SCOTTISH_DOMICILE', 'The deceased must have been domiciled in Scotland.'],
    ['grossEstateUnderNRB', 'ESTATE_OVER_THRESHOLD', `Estates over £${NIL_RATE_BAND.toLocaleString()} require professional assistance.`],
  ];

  for (const [key, code, message] of mustBeTrue) {
    if (!answers[key]) return { code, message };
  }

  // Questions where "No" (false) means eligible
  const mustBeFalse: [string, string, string][] = [
    ['hasBusinessInterests', 'BUSINESS_INTERESTS', 'Estates with business interests require a solicitor.'],
    ['hasAgriculturalLand', 'AGRICULTURAL_LAND', 'Agricultural land or agricultural relief cases require a solicitor.'],
    ['hasForeignProperty', 'COMPLEX_FOREIGN', 'Complex foreign property requires a solicitor.'],
    ['hasOngoingLitigation', 'ONGOING_LITIGATION', 'Ongoing litigation involving the estate requires a solicitor.'],
  ];

  for (const [key, code, message] of mustBeFalse) {
    if (answers[key]) return { code, message };
  }

  // Disputed will: only relevant if a valid will exists
  if (answers.hasValidWill && answers.willIsDisputed) {
    return { code: 'DISPUTED_WILL', message: 'Disputed wills require a solicitor.' };
  }

  return null;
}

// === Financial computations ===

/** Sum deceasedShareValue for assets in Scotland, England/Wales, N.Ireland (not 'elsewhere'). */
export function computeConfirmationTotal(assets: Asset[]): number {
  return assets
    .filter((a) => a.country !== 'elsewhere')
    .reduce((sum, a) => sum + a.deceasedShareValue, 0);
}

/** Sum deceasedShareValue grouped by country. */
export function computeCountryTotals(assets: Asset[]): Record<string, number> {
  const totals: Record<string, number> = {
    scotland: 0,
    england_wales: 0,
    northern_ireland: 0,
    elsewhere: 0,
  };
  for (const a of assets) {
    totals[a.country] += a.deceasedShareValue;
  }
  return totals;
}

/** Sum liabilities by type. */
export function computeLiabilityTotals(liabilities: Liability[]): {
  funeral: number;
  mortgage: number;
  otherDebt: number;
} {
  const result = { funeral: 0, mortgage: 0, otherDebt: 0 };
  for (const l of liabilities) {
    switch (l.type) {
      case 'funeral':
        result.funeral += l.amount;
        break;
      case 'mortgage':
        result.mortgage += l.amount;
        break;
      case 'other_debt':
        result.otherDebt += l.amount;
        break;
    }
  }
  return result;
}

/** Box 15 = Box 11 − Box 12 − Box 13 − Box 14. */
export function computeNetValue(grossPounds: number, liabilities: Liability[]): number {
  const { funeral, mortgage, otherDebt } = computeLiabilityTotals(liabilities);
  return grossPounds - funeral - mortgage - otherDebt;
}

/** Whether estate qualifies as excepted (Box 21). */
export function isExceptedEstate(
  grossForIHTPounds: number,
  claimingTransferableNRB: boolean
): boolean {
  const limit = claimingTransferableNRB ? TRANSFERABLE_NRB_LIMIT : NIL_RATE_BAND;
  return grossForIHTPounds <= limit;
}

/** Whether IHT400 = Yes means skip Boxes 17-20. */
export function shouldSkipBoxes17to20(iht400Completed: boolean): boolean {
  return iht400Completed;
}

/** Validate date of death is on or after 1 Jan 2022. */
export function isDeathDateValid(dateOfDeath: string): boolean {
  return dateOfDeath >= MIN_DEATH_DATE;
}

/** Cross-validate all totals. Returns list of error strings (empty = valid). */
export function validateTotals(c: Case): string[] {
  const errors: string[] = [];
  const confirmationTotal = computeConfirmationTotal(c.assets);
  const grossValue = confirmationTotal;
  const netValue = computeNetValue(grossValue, c.liabilities);

  if (confirmationTotal < 0) {
    errors.push('Total estate for confirmation cannot be negative.');
  }
  if (netValue < 0) {
    errors.push('Net value of estate cannot be negative. Check that liabilities do not exceed gross value.');
  }

  return errors;
}
