import { PDFDocument } from 'pdf-lib';
import type { Case } from './schema';
import {
  loadFieldMap,
  getFieldId,
  getFieldIds,
  inventoryItemFieldId,
  inventoryDescFieldId,
  inventoryPriceFieldId,
  inventoryAmountFieldId,
  INVENTORY_TOTAL_FIELD_ID,
  type FieldMap,
} from './fieldMap';
import {
  computeConfirmationTotal,
  computeLiabilityTotals,
  computeNetValue,
  isExceptedEstate,
} from './ruleEngine';
import { buildInventory } from './inventoryEngine';
import { buildDeclaration } from './declarationEngine';
import { MARITAL_STATUS_VALUES, RADIO_NO, RADIO_YES } from './constants';

// === Helpers (exported for testing) ===

/** Split ISO date "YYYY-MM-DD" into 8 single-character strings [DD, MM, YYYY]. */
export function splitDateToDigits(isoDate: string): string[] {
  const [year, month, day] = isoDate.split('-');
  return [day[0], day[1], month[0], month[1], year[0], year[1], year[2], year[3]];
}

/** Integer pounds to string for PDF currency fields. No £, no commas. */
export function poundsToCurrencyString(pounds: number): string {
  return String(Math.floor(pounds));
}

/** Split a number into zero-padded digit strings. */
export function splitNumberToDigits(num: number, digitCount: number): string[] {
  return String(num).padStart(digitCount, '0').split('');
}

// === Main PDF generation ===

export async function generatePdf(caseData: Case): Promise<Uint8Array> {
  const [pdfBytes, fieldMap] = await Promise.all([
    fetch('/C1-2022.pdf').then((r) => r.arrayBuffer()),
    loadFieldMap(),
  ]);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // === Safe field setters ===
  function setText(fieldId: string, value: string): void {
    try {
      const field = form.getTextField(fieldId);
      field.setText(value);
    } catch (e) {
      console.warn(`Failed to set text field ${fieldId}:`, e);
    }
  }

  function setRadio(fieldId: string, value: string): void {
    try {
      const field = form.getRadioGroup(fieldId);
      // Try the provided value first
      try {
        field.select(value);
        return;
      } catch {
        // Value didn't match — try reading available options and matching
      }
      const options = field.getOptions();
      // Try case-insensitive match on the value (e.g. "/Yes" vs "/ Yes" vs "Yes")
      const target = value.replace(/^\/\s*/, '').toLowerCase();
      const match = options.find(
        (opt) => opt.replace(/^\/\s*/, '').toLowerCase() === target
      );
      if (match) {
        field.select(match);
      } else {
        console.warn(`Radio ${fieldId}: no matching option for "${value}". Available: ${JSON.stringify(options)}`);
      }
    } catch {
      // Field might be a checkbox instead of a radio group
      try {
        const cb = form.getCheckBox(fieldId);
        const isYes = value === RADIO_YES || value.replace(/^\/\s*/, '').toLowerCase() === 'yes';
        if (isYes) {
          cb.check();
        } else {
          cb.uncheck();
        }
      } catch (e) {
        console.warn(`Failed to set radio/checkbox ${fieldId}:`, e);
      }
    }
  }

  function setCheckbox(fieldId: string, checked: boolean): void {
    try {
      const field = form.getCheckBox(fieldId);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
    } catch (e) {
      console.warn(`Failed to set checkbox ${fieldId}:`, e);
    }
  }

  function setDropdown(fieldId: string, value: string): void {
    try {
      const field = form.getDropdown(fieldId);
      field.select(value);
    } catch (e) {
      console.warn(`Failed to set dropdown ${fieldId}:`, e);
    }
  }

  function setDateDigits(fieldIds: string[], isoDate: string): void {
    const digits = splitDateToDigits(isoDate);
    digits.forEach((d, i) => setText(fieldIds[i], d));
  }

  // === Compute derived values ===
  const confirmationTotal = computeConfirmationTotal(caseData.assets);
  const grossValue = confirmationTotal;
  const liabilityTotals = computeLiabilityTotals(caseData.liabilities);
  const netValue = computeNetValue(grossValue, caseData.liabilities);
  const declaration = buildDeclaration(caseData, confirmationTotal);
  const inventory = buildInventory(caseData.assets);

  // ===== PAGE 1: Header + Deceased + Executors =====

  // Applicant (the declarant)
  const declarant = caseData.executors.find((e) => e.isDeclarant)!;
  const applicantLines = [
    declarant.fullName,
    declarant.address.line1,
    declarant.address.line2,
    declarant.address.line3,
    `${declarant.address.line4} ${declarant.address.postcode}`.trim(),
  ];
  const applicantFieldIds = [
    getFieldId(fieldMap, 'applicant_name_line_1'),
    getFieldId(fieldMap, 'applicant_name_line_2'),
    getFieldId(fieldMap, 'applicant_name_line_3'),
    getFieldId(fieldMap, 'applicant_name_line_4'),
    getFieldId(fieldMap, 'applicant_name_line_5'),
  ];
  applicantLines.forEach((line, i) => {
    if (line) setText(applicantFieldIds[i], line);
  });

  // Your reference (C1_02) and HMRC reference (C1_03)
  if (caseData.yourReference) {
    setText(getFieldId(fieldMap, 'applicant_reference'), caseData.yourReference);
  }
  if (caseData.hmrcReference) {
    setText(getFieldId(fieldMap, 'hmrc_reference'), caseData.hmrcReference);
  }

  // Box 1: Title
  setText(getFieldId(fieldMap, 'deceased_title'), caseData.deceased.title);

  // Box 2: First names (split across 2 fields if needed)
  const firstNameFields = getFieldIds(fieldMap, 'deceased_first_names');
  const firstNames = caseData.deceased.firstNames;
  if (firstNames.length <= 40) {
    setText(firstNameFields[0], firstNames);
  } else {
    const splitIdx = firstNames.lastIndexOf(' ', 40);
    if (splitIdx > 0) {
      setText(firstNameFields[0], firstNames.substring(0, splitIdx));
      setText(firstNameFields[1], firstNames.substring(splitIdx + 1));
    } else {
      setText(firstNameFields[0], firstNames.substring(0, 40));
      setText(firstNameFields[1], firstNames.substring(40));
    }
  }

  // Box 3: Surname
  setText(getFieldId(fieldMap, 'deceased_surname'), caseData.deceased.surname);

  // Box 4: Address
  const addrFields = getFieldIds(fieldMap, 'deceased_address');
  setText(addrFields[0], caseData.deceased.address.line1);
  setText(addrFields[1], caseData.deceased.address.line2);
  setText(addrFields[2], caseData.deceased.address.line3);
  setText(addrFields[3], caseData.deceased.address.line4);
  setText(getFieldId(fieldMap, 'deceased_postcode'), caseData.deceased.address.postcode);

  // Box 5: Occupation
  setText(getFieldId(fieldMap, 'deceased_occupation'), caseData.deceased.occupation);

  // Box 6: Date of birth
  setDateDigits(getFieldIds(fieldMap, 'deceased_date_of_birth'), caseData.deceased.dateOfBirth);

  // Box 7: Date of death
  setDateDigits(getFieldIds(fieldMap, 'deceased_date_of_death'), caseData.deceased.dateOfDeath);

  // Box 8: Place of death
  setText(getFieldId(fieldMap, 'deceased_place_of_death'), caseData.deceased.placeOfDeath);

  // Box 9: Total estate for confirmation
  setText(getFieldId(fieldMap, 'total_estate_for_confirmation'), poundsToCurrencyString(confirmationTotal));

  // Box 10: Executors (up to 4)
  const executorFieldGroups = [
    { nameAddr: getFieldIds(fieldMap, 'executor_1_name_address'), postcode: getFieldId(fieldMap, 'executor_1_postcode') },
    { nameAddr: getFieldIds(fieldMap, 'executor_2_name_address'), postcode: getFieldId(fieldMap, 'executor_2_postcode') },
    { nameAddr: getFieldIds(fieldMap, 'executor_3_name_address'), postcode: getFieldId(fieldMap, 'executor_3_postcode') },
    { nameAddr: getFieldIds(fieldMap, 'executor_4_name_address'), postcode: getFieldId(fieldMap, 'executor_4_postcode') },
  ];

  caseData.executors.forEach((exec, idx) => {
    if (idx >= 4) return;
    const group = executorFieldGroups[idx];
    const lines = [exec.fullName, exec.address.line1, exec.address.line2, exec.address.line3];
    lines.forEach((line, lineIdx) => {
      if (line) setText(group.nameAddr[lineIdx], line);
    });
    setText(group.postcode, exec.address.postcode);
  });

  // ===== PAGE 2: Declaration =====
  setText(getFieldId(fieldMap, 'declaration_by_executor'), declaration.C1_17);
  setText(getFieldId(fieldMap, 'deceased_full_name_declaration'), declaration.C1_18);
  setText(getFieldId(fieldMap, 'deceased_domicile'), declaration.C1_19);
  setText(getFieldId(fieldMap, 'executor_status_and_appointment'), declaration.C1_20);
  setDropdown(getFieldId(fieldMap, 'other_executors_verb'), declaration.C1_21a);
  setDropdown(getFieldId(fieldMap, 'other_executors_gender'), declaration.C1_21b);
  if (declaration.C1_21c) {
    setText(getFieldId(fieldMap, 'other_executors_names'), declaration.C1_21c);
  }
  setText(getFieldId(fieldMap, 'inventory_last_page_number'), declaration.C1_22);
  setText(getFieldId(fieldMap, 'confirmation_value_total'), poundsToCurrencyString(declaration.C1_23));

  // Declaration date
  setDateDigits(getFieldIds(fieldMap, 'declaration_date'), caseData.declarationDate);

  // ===== PAGE 3: Inventory =====
  for (const line of inventory.lines) {
    if (line.itemNumber) {
      setText(inventoryItemFieldId(line.lineNumber), line.itemNumber);
    }
    if (line.description) {
      setText(inventoryDescFieldId(line.lineNumber), line.description);
    }
    if (line.price) {
      setText(inventoryPriceFieldId(line.lineNumber), line.price);
    }
    if (line.amount) {
      setText(inventoryAmountFieldId(line.lineNumber), line.amount);
    }
  }
  // Set total explicitly (auto-calc doesn't work with pdf-lib)
  setText(INVENTORY_TOTAL_FIELD_ID, poundsToCurrencyString(confirmationTotal));

  // ===== PAGE 4: Value of Estate + About the Deceased =====
  // Box 11: Gross value
  setText(getFieldId(fieldMap, 'gross_value_of_estate'), poundsToCurrencyString(grossValue));
  // Box 12: Funeral expenses
  setText(getFieldId(fieldMap, 'less_funeral_expenses'), poundsToCurrencyString(liabilityTotals.funeral));
  // Box 13: Mortgage
  setText(getFieldId(fieldMap, 'less_mortgage_or_security'), poundsToCurrencyString(liabilityTotals.mortgage));
  // Box 14: Other debts
  setText(getFieldId(fieldMap, 'less_other_debts'), poundsToCurrencyString(liabilityTotals.otherDebt));
  // Box 15: Net value (computed — auto-calc often fails in viewers)
  setText(getFieldId(fieldMap, 'net_value_of_estate'), poundsToCurrencyString(netValue));

  // Box 16: IHT400 — always No for MVP (excepted estates only)
  setRadio(getFieldId(fieldMap, 'iht400_completed'), RADIO_NO);

  // Boxes 17-20 (only filled when IHT400 = No)
  // Box 17: Marital status
  setRadio(
    getFieldId(fieldMap, 'marital_status'),
    MARITAL_STATUS_VALUES[caseData.deceased.maritalStatus]
  );

  // Box 18: Surviving relatives
  setCheckbox(getFieldId(fieldMap, 'surviving_spouse'), caseData.deceased.survivingSpouse);
  setCheckbox(getFieldId(fieldMap, 'surviving_parent'), caseData.deceased.survivingParent);
  setCheckbox(getFieldId(fieldMap, 'surviving_siblings'), caseData.deceased.survivingSiblings);

  // Box 19: Children and grandchildren
  const childDigits = splitNumberToDigits(caseData.deceased.numberOfChildren, 2);
  const childFields = getFieldIds(fieldMap, 'number_of_children');
  childDigits.forEach((d, i) => setText(childFields[i], d));

  const gcDigits = splitNumberToDigits(caseData.deceased.numberOfGrandchildren, 3);
  const gcFields = getFieldIds(fieldMap, 'number_of_grandchildren');
  gcDigits.forEach((d, i) => setText(gcFields[i], d));

  // Box 20: UTR and NI number
  if (caseData.deceased.utr) {
    const utrDigits = caseData.deceased.utr.split('');
    const utrFields = getFieldIds(fieldMap, 'utr_unique_taxpayer_reference');
    utrDigits.forEach((d, i) => {
      if (i < utrFields.length) setText(utrFields[i], d);
    });
  }
  if (caseData.deceased.niNumber) {
    const niChars = caseData.deceased.niNumber.split('');
    const niFields = getFieldIds(fieldMap, 'ni_number_national_insurance');
    niChars.forEach((d, i) => {
      if (i < niFields.length) setText(niFields[i], d);
    });
  }

  // ===== PAGE 5: About the Estate =====
  // Box 21: Excepted estate
  const excepted = isExceptedEstate(grossValue, false);
  setRadio(getFieldId(fieldMap, 'excepted_estate'), excepted ? RADIO_YES : RADIO_NO);

  // Box 22: Transferable NRB — No for MVP
  setRadio(getFieldId(fieldMap, 'transferable_nil_rate_band'), RADIO_NO);

  // Box 23: Gross value for IHT
  setText(getFieldId(fieldMap, 'gross_value_for_inheritance_tax'), poundsToCurrencyString(grossValue));

  // Box 24: Net value for IHT
  setText(getFieldId(fieldMap, 'net_value_for_inheritance_tax'), poundsToCurrencyString(netValue));

  // Box 25: Net qualifying value
  setText(getFieldId(fieldMap, 'net_qualifying_value'), poundsToCurrencyString(netValue));

  // Box 26: Tax — always 0 for excepted estates
  setText(getFieldId(fieldMap, 'total_tax_interest_payable'), '0');

  // Flatten to prevent editing
  form.flatten();

  return pdfDoc.save();
}
