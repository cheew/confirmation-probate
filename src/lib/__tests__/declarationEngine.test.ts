import { describe, it, expect } from 'vitest';
import { buildDeclaration, formatDateForDeclaration } from '../declarationEngine';
import type { Case } from '../schema';

const baseAddress = {
  line1: '10 High Street',
  line2: 'Edinburgh',
  line3: '',
  line4: '',
  postcode: 'EH1 1AA',
};

const baseDeceased = {
  title: 'Mrs',
  firstNames: 'Margaret Anne',
  surname: 'Smith',
  address: { line1: '5 Low Road', line2: 'Edinburgh', line3: '', line4: '', postcode: 'EH2 2BB' },
  occupation: 'Teacher (retired)',
  dateOfBirth: '1940-05-12',
  dateOfDeath: '2023-08-15',
  placeOfDeath: 'Edinburgh',
  maritalStatus: 'widowed' as const,
  survivingSpouse: false,
  survivingParent: false,
  survivingSiblings: true,
  numberOfChildren: 2,
  numberOfGrandchildren: 3,
  utr: '',
  niNumber: '',
};

function makeSingleNominateCase(): Case {
  return {
    version: 1,
    sheriffdom: 'Lothian and Borders',
    deceased: baseDeceased,
    executors: [
      {
        fullName: 'James Smith',
        relationship: 'son',
        gender: 'male',
        address: baseAddress,
        isDeclarant: true,
        status: 'active',
      },
    ],
    will: {
      hasWill: true,
      executorType: 'nominate',
      willDate: '2020-06-15',
      hasCodicils: false,
      codicilDates: [],
    },
    assets: [],
    liabilities: [],
    declarationDate: '2024-01-10',
    currentStep: 'preview',
  };
}

function makeDativeCase(): Case {
  return {
    version: 1,
    sheriffdom: 'Grampian, Highland and Islands',
    deceased: baseDeceased,
    executors: [
      {
        fullName: 'James Smith',
        relationship: 'son',
        gender: 'male',
        address: baseAddress,
        isDeclarant: true,
        status: 'active',
      },
    ],
    will: {
      hasWill: false,
      executorType: 'dative',
      sheriffdomOfDecree: 'Grampian, Highland and Islands',
      dateOfDecree: '2023-11-20',
    },
    assets: [],
    liabilities: [],
    declarationDate: '2024-01-10',
    currentStep: 'preview',
  };
}

function makeMultipleExecutorCase(): Case {
  return {
    version: 1,
    sheriffdom: 'Lothian and Borders',
    deceased: baseDeceased,
    executors: [
      {
        fullName: 'James Smith',
        relationship: 'son',
        gender: 'male',
        address: baseAddress,
        isDeclarant: true,
        status: 'active',
      },
      {
        fullName: 'Mary Brown',
        relationship: 'daughter',
        gender: 'female',
        address: { line1: '20 Queen Street', line2: 'Glasgow', line3: '', line4: '', postcode: 'G1 1AA' },
        isDeclarant: false,
        status: 'active',
      },
    ],
    will: {
      hasWill: true,
      executorType: 'nominate',
      willDate: '2020-06-15',
      hasCodicils: false,
      codicilDates: [],
    },
    assets: [],
    liabilities: [],
    declarationDate: '2024-01-10',
    currentStep: 'preview',
  };
}

describe('formatDateForDeclaration', () => {
  it('formats 2020-06-15 as "15 June 2020"', () => {
    expect(formatDateForDeclaration('2020-06-15')).toBe('15 June 2020');
  });

  it('formats 2023-01-01 as "1 January 2023"', () => {
    expect(formatDateForDeclaration('2023-01-01')).toBe('1 January 2023');
  });
});

describe('buildDeclaration', () => {
  it('produces correct C1_20 for single executor nominate', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).toContain('Executor Nominate of the late');
    expect(decl.C1_20).toContain('Margaret Anne Smith');
    expect(decl.C1_20).toContain('conform to the Will');
    expect(decl.C1_20).toContain('15 June 2020');
    expect(decl.C1_20).toContain('docquetted and signed by me as relative hereto');
  });

  it('produces correct C1_20 for executor dative (intestate)', () => {
    const c = makeDativeCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).toContain('Executor Dative of the late');
    expect(decl.C1_20).toContain('who died intestate');
    expect(decl.C1_20).toContain('as decerned by the Sheriff at');
    expect(decl.C1_20).toContain('Grampian, Highland and Islands');
  });

  it('includes co-executor names for multiple executors', () => {
    const c = makeMultipleExecutorCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).toContain('along with');
    expect(decl.C1_20).toContain('Mary Brown');
  });

  it('strips trailing punctuation from names and addresses', () => {
    const c = makeMultipleExecutorCase();
    c.executors[1].fullName = 'Mary Brown.';
    c.executors[1].address.line1 = 'Queen Street.';
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).not.toContain('Brown.,');
    expect(decl.C1_20).not.toContain('Street.,');
    expect(decl.C1_20).toContain('Mary Brown, residing at Queen Street');
  });

  it('uses "/ am" for single executor', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_21a).toBe('/ am');
  });

  it('uses "/ are" for multiple executors', () => {
    const c = makeMultipleExecutorCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_21a).toBe('/ are');
  });

  it('uses "/ Executor" for male declarant', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_21b).toBe('/ Executor');
  });

  it('uses "/ Executrix" for female declarant', () => {
    const c = makeSingleNominateCase();
    c.executors[0].gender = 'female';
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_21b).toBe('/ Executrix');
  });

  it('names the Sheriffdom in domicile (never just "Scotland")', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_19).toBe('The Sheriffdom of Lothian and Borders in Scotland');
    expect(decl.C1_19).toMatch(/^The Sheriffdom of .+ in Scotland$/);
  });

  it('includes codicils when present', () => {
    const c = makeSingleNominateCase();
    if (c.will.hasWill) {
      c.will.hasCodicils = true;
      c.will.codicilDates = ['2021-03-10'];
    }
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).toContain('and codicil thereto dated 10 March 2021');
  });

  it('handles declined executors', () => {
    const c = makeMultipleExecutorCase();
    c.executors[1].status = 'declined';
    c.executors[1].declinedDate = '2023-12-01';
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_20).toContain('Mary Brown having declined to act as Executrix');
    expect(decl.C1_20).toContain('1 December 2023');
  });

  it('sets C1_22 to "3" for MVP (no C2)', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_22).toBe('3');
  });

  it('sets C1_23 to the confirmation total', () => {
    const c = makeSingleNominateCase();
    const decl = buildDeclaration(c, 150000);
    expect(decl.C1_23).toBe(150000);
  });
});
