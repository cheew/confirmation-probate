import { describe, it, expect } from 'vitest';
import { buildInventory } from '../inventoryEngine';
import type { Asset } from '../schema';

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: '1',
    type: 'bank_account',
    country: 'scotland',
    description: 'Bank of Scotland Current Account 12345678',
    fullValue: 5000,
    deceasedShareValue: 5000,
    jointOwnership: false,
    survivorshipClause: false,
    ...overrides,
  };
}

describe('buildInventory', () => {
  it('always includes all 6 mandatory headings even with zero assets', () => {
    const result = buildInventory([]);
    const headings = result.lines.filter((l) => l.isHeading).map((l) => l.description);
    expect(headings).toEqual([
      'HERITABLE ESTATE IN SCOTLAND',
      'MOVEABLE ESTATE IN SCOTLAND',
      'ESTATE IN ENGLAND AND WALES',
      'ESTATE IN NORTHERN IRELAND',
      'SUMMARY FOR CONFIRMATION',
      'ESTATE ELSEWHERE',
    ]);
  });

  it('inserts NIL for empty asset sections (5 non-summary sections)', () => {
    const result = buildInventory([]);
    const nilLines = result.lines.filter(
      (l) => l.description === 'NIL' && !l.isHeading && !l.isSummaryLine
    );
    expect(nilLines.length).toBe(5);
  });

  it('never places subtotals or summary values in the amount column', () => {
    const result = buildInventory([
      makeAsset({ id: '1', country: 'scotland', deceasedShareValue: 5000 }),
    ]);
    const summaryAndSubtotalLines = result.lines.filter(
      (l) => l.isSubtotal || l.isSummaryLine
    );
    for (const line of summaryAndSubtotalLines) {
      expect(line.amount).toBe('');
    }
  });

  it('puts heritable before moveable in Scotland', () => {
    const assets: Asset[] = [
      makeAsset({ id: '1', type: 'bank_account', country: 'scotland', description: 'Bank' }),
      makeAsset({ id: '2', type: 'heritable_property', country: 'scotland', description: 'Property' }),
    ];
    const result = buildInventory(assets);
    const assetLines = result.lines.filter(
      (l) => !l.isHeading && !l.isSubtotal && !l.isSummaryLine && l.description !== 'NIL'
    );
    // Property should appear before bank (heritable section comes first)
    expect(assetLines[0].description).toBe('Property');
    expect(assetLines[1].description).toBe('Bank');
  });

  it('produces totalPounds excluding elsewhere assets', () => {
    const assets: Asset[] = [
      makeAsset({ id: '1', country: 'scotland', deceasedShareValue: 5000 }),
      makeAsset({ id: '2', country: 'elsewhere', deceasedShareValue: 3000 }),
    ];
    const result = buildInventory(assets);
    expect(result.totalPounds).toBe(5000); // Only Scotland, not elsewhere
  });

  it('does not put elsewhere asset values in the amount column', () => {
    const result = buildInventory([
      makeAsset({ id: '1', country: 'elsewhere', deceasedShareValue: 3000, description: 'Foreign bank' }),
    ]);
    const foreignAssetLine = result.lines.find((l) => l.description === 'Foreign bank');
    expect(foreignAssetLine).toBeDefined();
    expect(foreignAssetLine!.amount).toBe('');
  });

  it('sets overflow=true when >37 lines needed', () => {
    const assets: Asset[] = Array.from({ length: 30 }, (_, i) =>
      makeAsset({ id: String(i), description: `Account ${i}`, country: 'scotland' })
    );
    const result = buildInventory(assets);
    expect(result.overflow).toBe(true);
  });

  it('sets overflow=false for a small number of assets', () => {
    const assets: Asset[] = [
      makeAsset({ id: '1', country: 'scotland', deceasedShareValue: 5000 }),
    ];
    const result = buildInventory(assets);
    expect(result.overflow).toBe(false);
  });

  it('uses sequential item numbers across sections', () => {
    const assets: Asset[] = [
      makeAsset({ id: '1', type: 'heritable_property', country: 'scotland', description: 'House' }),
      makeAsset({ id: '2', type: 'bank_account', country: 'scotland', description: 'Bank' }),
      makeAsset({ id: '3', type: 'bank_account', country: 'england_wales', description: 'Barclays' }),
    ];
    const result = buildInventory(assets);
    const numbered = result.lines.filter((l) => l.itemNumber !== '');
    expect(numbered.map((l) => l.itemNumber)).toEqual(['1', '2', '3']);
  });

  it('shows full value in price column for jointly owned assets', () => {
    const result = buildInventory([
      makeAsset({
        id: '1',
        jointOwnership: true,
        fullValue: 200000,
        deceasedShareValue: 100000,
        description: 'Joint property',
      }),
    ]);
    const assetLine = result.lines.find((l) => l.description === 'Joint property');
    expect(assetLine).toBeDefined();
    expect(assetLine!.price).toBe('200000');
    expect(assetLine!.amount).toBe('100000');
  });

  it('does not show price for sole-ownership assets', () => {
    const result = buildInventory([
      makeAsset({ id: '1', jointOwnership: false, description: 'Sole account' }),
    ]);
    const assetLine = result.lines.find((l) => l.description === 'Sole account');
    expect(assetLine!.price).toBe('');
  });
});
