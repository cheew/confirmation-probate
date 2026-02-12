// === Types for the c1_2022_field_map.json structure ===

export interface FieldMapField {
  field_id: string;
  field_name: string;
  field_type: string;
  max_length?: number;
  options?: { value: string; label: string }[];
  checked_value?: string;
  unchecked_value?: string;
  calculated?: boolean;
  guidance?: string;
}

export interface FieldMapSection {
  section_id: string;
  section_name: string;
  page: number;
  fields?: FieldMapField[];
  subsections?: { executor_number: number; fields: FieldMapField[] }[];
  inventory_table?: {
    columns: { column_name: string; fields: FieldMapField[] }[];
    total_field: FieldMapField;
  };
}

export interface FieldMap {
  form_metadata: {
    fillable_field_count: number;
    total_pdf_fields_including_containers: number;
  };
  wizard_field_suggestions: Record<string, string | string[]>;
  sections: FieldMapSection[];
}

// === Singleton cache ===
let _cachedMap: FieldMap | null = null;

export async function loadFieldMap(): Promise<FieldMap> {
  if (_cachedMap) return _cachedMap;
  const res = await fetch('/c1_2022_field_map.json');
  if (!res.ok) throw new Error('Failed to load field map');
  const data: FieldMap = await res.json();
  if (data.form_metadata.fillable_field_count !== 262) {
    throw new Error(
      `Field map expects 262 fillable fields, got ${data.form_metadata.fillable_field_count}`
    );
  }
  _cachedMap = data;
  return data;
}

/** For testing: inject a pre-loaded field map */
export function setFieldMapCache(map: FieldMap): void {
  _cachedMap = map;
}

// === Lookup helpers ===

export function getFieldId(map: FieldMap, suggestionKey: string): string {
  const val = map.wizard_field_suggestions[suggestionKey];
  if (!val || Array.isArray(val)) {
    throw new Error(
      `Expected single field ID for key "${suggestionKey}", got ${JSON.stringify(val)}`
    );
  }
  return val;
}

export function getFieldIds(map: FieldMap, suggestionKey: string): string[] {
  const val = map.wizard_field_suggestions[suggestionKey];
  if (!val || !Array.isArray(val)) {
    throw new Error(
      `Expected array of field IDs for key "${suggestionKey}", got ${JSON.stringify(val)}`
    );
  }
  return val;
}

// === Inventory field ID builders ===
// Patterns from the field map:
//   Item/Desc/PR columns: C1_XXX01.LineNN  (NN is zero-padded to 2 digits)
//   Amount column: C1_AMT01.N              (N is NOT zero-padded)

export function inventoryItemFieldId(lineNumber: number): string {
  if (lineNumber < 1 || lineNumber > 37) throw new RangeError(`Line ${lineNumber} out of range 1-37`);
  return `C1_Item01.Line${String(lineNumber).padStart(2, '0')}`;
}

export function inventoryDescFieldId(lineNumber: number): string {
  if (lineNumber < 1 || lineNumber > 37) throw new RangeError(`Line ${lineNumber} out of range 1-37`);
  return `C1_Desc01.Line${String(lineNumber).padStart(2, '0')}`;
}

export function inventoryPriceFieldId(lineNumber: number): string {
  if (lineNumber < 1 || lineNumber > 37) throw new RangeError(`Line ${lineNumber} out of range 1-37`);
  return `C1_PR01.Line${String(lineNumber).padStart(2, '0')}`;
}

export function inventoryAmountFieldId(lineNumber: number): string {
  if (lineNumber < 1 || lineNumber > 37) throw new RangeError(`Line ${lineNumber} out of range 1-37`);
  return `C1_AMT01.${lineNumber}`;
}

export const INVENTORY_TOTAL_FIELD_ID = 'C1_AMT01_Total';
