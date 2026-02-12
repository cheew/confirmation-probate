import { INVENTORY_MAX_LINES } from './constants';
import type { Asset } from './schema';

// === Output type: one row in the 37-line inventory table ===
export interface InventoryLine {
  lineNumber: number;       // 1-37
  itemNumber: string;       // "" for headings/subtotals, "1","2",etc. for assets
  description: string;      // Up to 60 chars
  price: string;            // "" or a number string (full value or subtotal)
  amount: string;           // "" or a number string (deceased's share — goes into auto-sum column)
  isHeading: boolean;
  isSubtotal: boolean;
  isSummaryLine: boolean;
}

// === Section definitions (mandatory order per instructions doc section 5.1) ===
const SECTION_HEADINGS = [
  { key: 'heritable_scotland', text: 'HERITABLE ESTATE IN SCOTLAND' },
  { key: 'moveable_scotland', text: 'MOVEABLE ESTATE IN SCOTLAND' },
  { key: 'england_wales', text: 'ESTATE IN ENGLAND AND WALES' },
  { key: 'northern_ireland', text: 'ESTATE IN NORTHERN IRELAND' },
  { key: 'summary', text: 'SUMMARY FOR CONFIRMATION' },
  { key: 'elsewhere', text: 'ESTATE ELSEWHERE' },
] as const;

/** Classify an asset into one of the section keys. */
function classifyAsset(asset: Asset): string {
  if (asset.country === 'scotland') {
    return asset.type === 'heritable_property' ? 'heritable_scotland' : 'moveable_scotland';
  }
  return asset.country; // 'england_wales' | 'northern_ireland' | 'elsewhere'
}

export interface InventoryResult {
  lines: InventoryLine[];
  totalPounds: number;          // Sum of amount column values (confirmation total)
  overflow: boolean;            // True if >37 lines needed
  overflowLineCount: number;    // Total lines that would be needed
}

export function buildInventory(assets: Asset[]): InventoryResult {
  // Step 1: Group assets by section
  const groups: Record<string, Asset[]> = {
    heritable_scotland: [],
    moveable_scotland: [],
    england_wales: [],
    northern_ireland: [],
    elsewhere: [],
  };

  for (const asset of assets) {
    const key = classifyAsset(asset);
    groups[key].push(asset);
  }

  // Step 2: Compute country totals for the summary section
  const scotlandTotal =
    groups.heritable_scotland.reduce((s, a) => s + a.deceasedShareValue, 0) +
    groups.moveable_scotland.reduce((s, a) => s + a.deceasedShareValue, 0);
  const englandTotal = groups.england_wales.reduce((s, a) => s + a.deceasedShareValue, 0);
  const niTotal = groups.northern_ireland.reduce((s, a) => s + a.deceasedShareValue, 0);
  const elsewhereTotal = groups.elsewhere.reduce((s, a) => s + a.deceasedShareValue, 0);
  const confirmationTotal = scotlandTotal + englandTotal + niTotal; // Excludes 'elsewhere'

  // Step 3: Build all lines (may exceed 37)
  const allLines: Omit<InventoryLine, 'lineNumber'>[] = [];
  let runningItemNumber = 1;

  for (const section of SECTION_HEADINGS) {
    // Emit section heading
    allLines.push({
      itemNumber: '',
      description: section.text,
      price: '',
      amount: '',
      isHeading: true,
      isSubtotal: false,
      isSummaryLine: false,
    });

    // SUMMARY FOR CONFIRMATION is special
    if (section.key === 'summary') {
      // Summary subtotals go in PRICE column, NOT amount column (prevents auto-sum double-counting)
      allLines.push({
        itemNumber: '',
        description: 'Estate in Scotland',
        price: scotlandTotal > 0 ? String(scotlandTotal) : 'NIL',
        amount: '',
        isHeading: false,
        isSubtotal: false,
        isSummaryLine: true,
      });
      allLines.push({
        itemNumber: '',
        description: 'Estate in England and Wales',
        price: englandTotal > 0 ? String(englandTotal) : 'NIL',
        amount: '',
        isHeading: false,
        isSubtotal: false,
        isSummaryLine: true,
      });
      allLines.push({
        itemNumber: '',
        description: 'Estate in Northern Ireland',
        price: niTotal > 0 ? String(niTotal) : 'NIL',
        amount: '',
        isHeading: false,
        isSubtotal: false,
        isSummaryLine: true,
      });
      allLines.push({
        itemNumber: '',
        description: 'TOTAL FOR CONFIRMATION',
        price: String(confirmationTotal),
        amount: '',
        isHeading: false,
        isSubtotal: true,
        isSummaryLine: true,
      });
      continue;
    }

    // Normal asset sections
    const sectionAssets = groups[section.key] || [];

    if (sectionAssets.length === 0) {
      // NIL line for empty sections
      allLines.push({
        itemNumber: '',
        description: 'NIL',
        price: '',
        amount: '',
        isHeading: false,
        isSubtotal: false,
        isSummaryLine: false,
      });
    } else {
      for (const asset of sectionAssets) {
        const showPrice = asset.jointOwnership;
        // 'elsewhere' assets: value listed but NOT in the amount (auto-sum) column
        const isElsewhere = section.key === 'elsewhere';

        allLines.push({
          itemNumber: String(runningItemNumber),
          description: asset.description,
          price: showPrice ? String(asset.fullValue) : '',
          amount: isElsewhere ? '' : String(asset.deceasedShareValue),
          isHeading: false,
          isSubtotal: false,
          isSummaryLine: false,
        });
        runningItemNumber++;
      }
    }
  }

  // Step 4: Assign line numbers and check overflow
  const overflow = allLines.length > INVENTORY_MAX_LINES;
  const lines: InventoryLine[] = allLines
    .slice(0, INVENTORY_MAX_LINES)
    .map((line, idx) => ({
      ...line,
      lineNumber: idx + 1,
    }));

  return {
    lines,
    totalPounds: confirmationTotal,
    overflow,
    overflowLineCount: allLines.length,
  };
}
