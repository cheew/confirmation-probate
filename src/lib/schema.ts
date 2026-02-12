import { z } from 'zod';
import { SHERIFFDOMS, ASSET_TYPES, ASSET_COUNTRIES } from './constants';

// === Reusable primitives ===
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const wholePounds = z.number().int().nonnegative();

// === Eligibility screening ===
export const eligibilitySchema = z.object({
  dateOfDeathOnOrAfter2022: z.literal(true),
  domiciledInScotland: z.literal(true),
  grossEstateUnderNRB: z.literal(true),
  hasBusinessInterests: z.literal(false),
  hasAgriculturalLand: z.literal(false),
  hasForeignProperty: z.literal(false),
  hasValidWill: z.boolean(),
  willIsDisputed: z.boolean().optional(),
  hasOngoingLitigation: z.literal(false),
});
export type Eligibility = z.infer<typeof eligibilitySchema>;

// === Address ===
export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(40),
  line2: z.string().max(40).default(''),
  line3: z.string().max(40).default(''),
  line4: z.string().max(40).default(''),
  postcode: z.string().min(1, 'Postcode is required').max(10),
});
export type Address = z.infer<typeof addressSchema>;

// === Deceased ===
export const deceasedSchema = z.object({
  title: z.string().min(1, 'Title is required').max(10),
  firstNames: z.string().min(1, 'First names are required').max(80),
  surname: z.string().min(1, 'Surname is required').max(40),
  address: addressSchema,
  occupation: z.string().min(1, 'Occupation is required (enter "none" if not applicable)').max(40),
  dateOfBirth: isoDateString,
  dateOfDeath: isoDateString,
  placeOfDeath: z.string().min(1, 'Place of death is required').max(40),
  maritalStatus: z.enum(['married', 'single', 'divorced', 'widowed']),
  survivingSpouse: z.boolean(),
  survivingParent: z.boolean(),
  survivingSiblings: z.boolean(),
  numberOfChildren: z.number().int().nonnegative().max(99),
  numberOfGrandchildren: z.number().int().nonnegative().max(999),
  utr: z.string().max(10).default(''),
  niNumber: z.string().max(9).default(''),
});
export type Deceased = z.infer<typeof deceasedSchema>;

// === Executor ===
export const executorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(80),
  relationship: z.string().min(1, 'Relationship is required').max(40),
  gender: z.enum(['male', 'female']),
  address: addressSchema,
  isDeclarant: z.boolean(),
  status: z.enum(['active', 'declined', 'deceased']),
  declinedDate: isoDateString.optional(),
  deceasedDate: isoDateString.optional(),
});
export type Executor = z.infer<typeof executorSchema>;

// === Will details (discriminated union) ===
export const willNominateSchema = z.object({
  hasWill: z.literal(true),
  executorType: z.literal('nominate'),
  willDate: isoDateString,
  hasCodicils: z.boolean(),
  codicilDates: z.array(isoDateString).default([]),
});

export const willDativeSchema = z.object({
  hasWill: z.literal(false),
  executorType: z.literal('dative'),
  sheriffdomOfDecree: z.enum(SHERIFFDOMS),
  dateOfDecree: isoDateString,
});

export const willSchema = z.discriminatedUnion('hasWill', [
  willNominateSchema,
  willDativeSchema,
]);
export type WillDetails = z.infer<typeof willSchema>;

// === Asset ===
export const assetSchema = z.object({
  id: z.string(),
  type: z.enum(ASSET_TYPES),
  country: z.enum(ASSET_COUNTRIES),
  description: z.string().min(1, 'Description is required'),
  fullValue: wholePounds,
  deceasedShareValue: wholePounds,
  jointOwnership: z.boolean(),
  survivorshipClause: z.boolean().default(false),
});
export type Asset = z.infer<typeof assetSchema>;

// === Liability ===
export const liabilitySchema = z.object({
  id: z.string(),
  type: z.enum(['funeral', 'mortgage', 'other_debt']),
  description: z.string().min(1, 'Description is required'),
  amount: wholePounds,
});
export type Liability = z.infer<typeof liabilitySchema>;

// === Top-level case ===
export const caseSchema = z.object({
  version: z.literal(1),
  sheriffdom: z.enum(SHERIFFDOMS),
  deceased: deceasedSchema,
  executors: z.array(executorSchema).min(1).max(4),
  will: willSchema,
  assets: z.array(assetSchema),
  liabilities: z.array(liabilitySchema),
  declarationDate: isoDateString,
  currentStep: z.string().default('eligibility'),
  yourReference: z.string().max(20).default(''),
  hmrcReference: z.string().max(20).default(''),
});
export type Case = z.infer<typeof caseSchema>;
