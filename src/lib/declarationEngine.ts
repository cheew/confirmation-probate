import type { Case, Executor } from './schema';
import { EXECUTOR_VERB, EXECUTOR_GENDER } from './constants';

export interface DeclarationOutput {
  C1_17: string;        // "Declaration by" — declarant name + address
  C1_18: string;        // Deceased full name
  C1_19: string;        // Domicile (Sheriffdom wording)
  C1_20: string;        // Paragraph 2 — executor status & appointment
  C1_21a: string;       // "/ am" or "/ are"
  C1_21b: string;       // "/ Executor" or "/ Executrix"
  C1_21c: string;       // Co-executor names, or ""
  C1_22: string;        // Inventory last page number
  C1_23: number;        // Confirmation value (pounds)
}

function getDeclarant(executors: Executor[]): Executor {
  const d = executors.find((e) => e.isDeclarant);
  if (!d) throw new Error('No declarant executor found');
  return d;
}

/** Strip trailing periods, commas and spaces from a string. */
function stripTrailingPunctuation(s: string): string {
  return s.replace(/[.,\s]+$/, '');
}

function formatAddress(addr: {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  postcode: string;
}): string {
  return [addr.line1, addr.line2, addr.line3, addr.line4, addr.postcode]
    .filter(Boolean)
    .map(stripTrailingPunctuation)
    .filter(Boolean)
    .join(', ');
}

/** Format ISO "YYYY-MM-DD" to "DD Month YYYY" for declaration prose. */
export function formatDateForDeclaration(isoDate: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const [year, month, day] = isoDate.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  const dayNum = parseInt(day, 10);
  return `${dayNum} ${months[monthIdx]} ${year}`;
}

function genderTitle(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'Executrix' : 'Executor';
}

/**
 * Build C1_20: the critical declaration paragraph.
 * Templates used VERBATIM from C1_2022_INSTRUCTIONS section 6.2.
 */
function buildParagraph2(c: Case): string {
  const declarant = getDeclarant(c.executors);
  const deceasedName = `${c.deceased.firstNames} ${c.deceased.surname}`;

  if (c.will.hasWill) {
    // === Executor Nominate path ===
    const activeCoExecutors = c.executors.filter(
      (e) => !e.isDeclarant && e.status === 'active'
    );
    const declinedExecutors = c.executors.filter((e) => e.status === 'declined');
    const deceasedExecutors = c.executors.filter((e) => e.status === 'deceased');

    let text = `${stripTrailingPunctuation(declarant.fullName)}, ${declarant.relationship} and ${genderTitle(declarant.gender)} Nominate of the late ${deceasedName}`;

    // Co-executors
    if (activeCoExecutors.length > 0) {
      const coNames = activeCoExecutors
        .map((e) => `${stripTrailingPunctuation(e.fullName)}, residing at ${formatAddress(e.address)}`)
        .join(', and ');
      text += ` along with ${coNames}`;
    }

    text += ` conform to the Will of the said deceased dated ${formatDateForDeclaration(c.will.willDate)}`;

    // Codicils
    if (c.will.hasCodicils && c.will.codicilDates.length > 0) {
      const codicilDateStr = c.will.codicilDates
        .map((d) => formatDateForDeclaration(d))
        .join(' and ');
      text += ` and codicil${c.will.codicilDates.length > 1 ? 's' : ''} thereto dated ${codicilDateStr}`;
    }

    text += ` which is produced herewith, docquetted and signed by me as relative hereto`;

    // Deceased executor modifier
    for (const dec of deceasedExecutors) {
      text += `, the said ${dec.fullName} having since died`;
      if (dec.deceasedDate) {
        text += ` on ${formatDateForDeclaration(dec.deceasedDate)}`;
      }
    }

    // Declined executor modifier
    for (const decl of declinedExecutors) {
      text += `, the said ${decl.fullName} having declined to act as ${genderTitle(decl.gender)}`;
      if (decl.declinedDate) {
        text += ` by letter dated ${formatDateForDeclaration(decl.declinedDate)}`;
      }
    }

    return text;
  } else {
    // === Executor Dative path ===
    return `${stripTrailingPunctuation(declarant.fullName)}, ${declarant.relationship} and ${genderTitle(declarant.gender)} Dative of the late ${deceasedName} qua ${declarant.relationship} of the said deceased who died intestate as decerned by the Sheriff at ${c.will.sheriffdomOfDecree} on ${formatDateForDeclaration(c.will.dateOfDecree)}`;
  }
}

function buildCoExecutorNames(c: Case): string {
  const coExecutors = c.executors.filter(
    (e) => !e.isDeclarant && e.status === 'active'
  );
  if (coExecutors.length === 0) return '';
  return coExecutors
    .map((e) => `${stripTrailingPunctuation(e.fullName)} (${e.relationship})`)
    .join(' and ');
}

export function buildDeclaration(c: Case, confirmationTotalPounds: number): DeclarationOutput {
  const declarant = getDeclarant(c.executors);
  const activeExecutorCount = c.executors.filter((e) => e.status === 'active').length;

  return {
    C1_17: `${declarant.fullName}\n${formatAddress(declarant.address)}`,
    C1_18: `${c.deceased.firstNames} ${c.deceased.surname}`,
    C1_19: `The Sheriffdom of ${c.sheriffdom} in Scotland`,
    C1_20: buildParagraph2(c),
    C1_21a: activeExecutorCount === 1 ? EXECUTOR_VERB.single : EXECUTOR_VERB.multiple,
    C1_21b: declarant.gender === 'female' ? EXECUTOR_GENDER.female : EXECUTOR_GENDER.male,
    C1_21c: buildCoExecutorNames(c),
    C1_22: '3', // MVP: always page 3 (no C2)
    C1_23: confirmationTotalPounds,
  };
}
