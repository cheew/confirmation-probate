import { describe, it, expect } from 'vitest';
import { splitDateToDigits, poundsToCurrencyString, splitNumberToDigits } from '../pdfEngine';

describe('splitDateToDigits', () => {
  it('splits 1949-03-08 to ["0","8","0","3","1","9","4","9"]', () => {
    expect(splitDateToDigits('1949-03-08')).toEqual(['0', '8', '0', '3', '1', '9', '4', '9']);
  });

  it('splits 2023-12-25 to ["2","5","1","2","2","0","2","3"]', () => {
    expect(splitDateToDigits('2023-12-25')).toEqual(['2', '5', '1', '2', '2', '0', '2', '3']);
  });

  it('splits 2022-01-01 to ["0","1","0","1","2","0","2","2"]', () => {
    expect(splitDateToDigits('2022-01-01')).toEqual(['0', '1', '0', '1', '2', '0', '2', '2']);
  });

  it('always returns 8 strings', () => {
    const result = splitDateToDigits('2000-06-15');
    expect(result).toHaveLength(8);
    result.forEach((d) => expect(d).toHaveLength(1));
  });
});

describe('poundsToCurrencyString', () => {
  it('converts 150000 to "150000"', () => {
    expect(poundsToCurrencyString(150000)).toBe('150000');
  });

  it('handles zero', () => {
    expect(poundsToCurrencyString(0)).toBe('0');
  });

  it('floors down: 150000.99 to "150000"', () => {
    expect(poundsToCurrencyString(150000.99)).toBe('150000');
  });

  it('produces no pound sign or commas', () => {
    const result = poundsToCurrencyString(1234567);
    expect(result).not.toContain('£');
    expect(result).not.toContain(',');
    expect(result).toBe('1234567');
  });
});

describe('splitNumberToDigits', () => {
  it('pads 3 to 2 digits: ["0","3"]', () => {
    expect(splitNumberToDigits(3, 2)).toEqual(['0', '3']);
  });

  it('pads 12 to 3 digits: ["0","1","2"]', () => {
    expect(splitNumberToDigits(12, 3)).toEqual(['0', '1', '2']);
  });

  it('handles 0 with 2 digits: ["0","0"]', () => {
    expect(splitNumberToDigits(0, 2)).toEqual(['0', '0']);
  });

  it('handles 99 with 2 digits: ["9","9"]', () => {
    expect(splitNumberToDigits(99, 2)).toEqual(['9', '9']);
  });

  it('handles 999 with 3 digits: ["9","9","9"]', () => {
    expect(splitNumberToDigits(999, 3)).toEqual(['9', '9', '9']);
  });
});
