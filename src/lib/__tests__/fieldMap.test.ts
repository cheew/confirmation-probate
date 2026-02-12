import { describe, it, expect } from 'vitest';
import {
  inventoryItemFieldId,
  inventoryDescFieldId,
  inventoryPriceFieldId,
  inventoryAmountFieldId,
  INVENTORY_TOTAL_FIELD_ID,
} from '../fieldMap';

describe('inventory field ID builders', () => {
  it('inventoryItemFieldId pads to 2 digits', () => {
    expect(inventoryItemFieldId(1)).toBe('C1_Item01.Line01');
    expect(inventoryItemFieldId(9)).toBe('C1_Item01.Line09');
    expect(inventoryItemFieldId(10)).toBe('C1_Item01.Line10');
    expect(inventoryItemFieldId(37)).toBe('C1_Item01.Line37');
  });

  it('inventoryDescFieldId pads to 2 digits', () => {
    expect(inventoryDescFieldId(1)).toBe('C1_Desc01.Line01');
    expect(inventoryDescFieldId(37)).toBe('C1_Desc01.Line37');
  });

  it('inventoryPriceFieldId pads to 2 digits', () => {
    expect(inventoryPriceFieldId(1)).toBe('C1_PR01.Line01');
    expect(inventoryPriceFieldId(37)).toBe('C1_PR01.Line37');
  });

  it('inventoryAmountFieldId does NOT pad (per field map)', () => {
    expect(inventoryAmountFieldId(1)).toBe('C1_AMT01.1');
    expect(inventoryAmountFieldId(9)).toBe('C1_AMT01.9');
    expect(inventoryAmountFieldId(10)).toBe('C1_AMT01.10');
    expect(inventoryAmountFieldId(37)).toBe('C1_AMT01.37');
  });

  it('INVENTORY_TOTAL_FIELD_ID is correct', () => {
    expect(INVENTORY_TOTAL_FIELD_ID).toBe('C1_AMT01_Total');
  });

  it('throws for out-of-range line numbers', () => {
    expect(() => inventoryItemFieldId(0)).toThrow();
    expect(() => inventoryItemFieldId(38)).toThrow();
    expect(() => inventoryAmountFieldId(-1)).toThrow();
  });
});
