import { describe, it, expect } from 'vitest';
import {
  checkEligibility,
  computeConfirmationTotal,
  computeNetValue,
  computeLiabilityTotals,
  isExceptedEstate,
  isDeathDateValid,
} from '../ruleEngine';
import type { Asset, Liability } from '../schema';

describe('checkEligibility', () => {
  const eligible = {
    dateOfDeathOnOrAfter2022: true,
    domiciledInScotland: true,
    grossEstateUnderNRB: true,
    hasBusinessInterests: false,
    hasAgriculturalLand: false,
    hasForeignProperty: false,
    hasValidWill: false,
    hasOngoingLitigation: false,
  };

  it('returns null when all answers pass eligibility', () => {
    expect(checkEligibility(eligible)).toBeNull();
  });

  it('returns null when will exists but is not disputed', () => {
    expect(checkEligibility({ ...eligible, hasValidWill: true, willIsDisputed: false })).toBeNull();
  });

  it('returns hard stop for non-Scottish domicile', () => {
    const result = checkEligibility({ ...eligible, domiciledInScotland: false });
    expect(result).not.toBeNull();
    expect(result!.code).toBe('NON_SCOTTISH_DOMICILE');
  });

  it('returns the first failing check', () => {
    const result = checkEligibility({ ...eligible, dateOfDeathOnOrAfter2022: false, domiciledInScotland: false });
    expect(result!.code).toBe('DEATH_BEFORE_2022');
  });

  it('returns hard stop for business interests', () => {
    const result = checkEligibility({ ...eligible, hasBusinessInterests: true });
    expect(result!.code).toBe('BUSINESS_INTERESTS');
  });

  it('returns hard stop for disputed will', () => {
    const result = checkEligibility({ ...eligible, hasValidWill: true, willIsDisputed: true });
    expect(result!.code).toBe('DISPUTED_WILL');
  });

  it('does not hard stop on disputed will when no will exists', () => {
    expect(checkEligibility({ ...eligible, hasValidWill: false, willIsDisputed: true })).toBeNull();
  });
});

describe('computeConfirmationTotal', () => {
  it('sums scotland + england + NI assets, excludes elsewhere', () => {
    const assets: Asset[] = [
      { id: '1', type: 'bank_account', country: 'scotland', description: '', fullValue: 5000, deceasedShareValue: 5000, jointOwnership: false, survivorshipClause: false },
      { id: '2', type: 'bank_account', country: 'england_wales', description: '', fullValue: 3000, deceasedShareValue: 3000, jointOwnership: false, survivorshipClause: false },
      { id: '3', type: 'other', country: 'elsewhere', description: '', fullValue: 2000, deceasedShareValue: 2000, jointOwnership: false, survivorshipClause: false },
    ];
    expect(computeConfirmationTotal(assets)).toBe(8000);
  });

  it('returns 0 for empty assets', () => {
    expect(computeConfirmationTotal([])).toBe(0);
  });
});

describe('computeNetValue (Box 15 = Box 11 - Box 12 - Box 13 - Box 14)', () => {
  it('computes correctly', () => {
    const gross = 200000;
    const liabilities: Liability[] = [
      { id: '1', type: 'funeral', description: 'Funeral', amount: 5000 },
      { id: '2', type: 'mortgage', description: 'Mortgage', amount: 100000 },
      { id: '3', type: 'other_debt', description: 'Credit card', amount: 2000 },
    ];
    expect(computeNetValue(gross, liabilities)).toBe(93000);
  });

  it('handles zero liabilities', () => {
    expect(computeNetValue(150000, [])).toBe(150000);
  });
});

describe('computeLiabilityTotals', () => {
  it('groups by type correctly', () => {
    const liabilities: Liability[] = [
      { id: '1', type: 'funeral', description: 'A', amount: 5000 },
      { id: '2', type: 'funeral', description: 'B', amount: 1000 },
      { id: '3', type: 'mortgage', description: 'C', amount: 100000 },
      { id: '4', type: 'other_debt', description: 'D', amount: 2000 },
    ];
    const result = computeLiabilityTotals(liabilities);
    expect(result.funeral).toBe(6000);
    expect(result.mortgage).toBe(100000);
    expect(result.otherDebt).toBe(2000);
  });
});

describe('isExceptedEstate', () => {
  it('returns true when gross <= 325000', () => {
    expect(isExceptedEstate(325000, false)).toBe(true);
  });

  it('returns false when gross > 325000 without NRB transfer', () => {
    expect(isExceptedEstate(325001, false)).toBe(false);
  });

  it('returns true when gross <= 650000 with NRB transfer', () => {
    expect(isExceptedEstate(650000, true)).toBe(true);
  });

  it('returns false when gross > 650000 even with NRB transfer', () => {
    expect(isExceptedEstate(650001, true)).toBe(false);
  });
});

describe('isDeathDateValid', () => {
  it('returns true for 2022-01-01', () => {
    expect(isDeathDateValid('2022-01-01')).toBe(true);
  });

  it('returns true for dates after 2022', () => {
    expect(isDeathDateValid('2024-06-15')).toBe(true);
  });

  it('returns false for 2021-12-31', () => {
    expect(isDeathDateValid('2021-12-31')).toBe(false);
  });
});
