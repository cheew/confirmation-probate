// === Thresholds (single source of truth — never hardcode elsewhere) ===
export const SMALL_ESTATE_THRESHOLD = 36_000;
export const NIL_RATE_BAND = 325_000;
export const TRANSFERABLE_NRB_LIMIT = 650_000;
export const MIN_DEATH_DATE = '2022-01-01';

// === Sheriffdoms ===
export const SHERIFFDOMS = [
  'Glasgow and Strathkelvin',
  'Grampian, Highland and Islands',
  'Lothian and Borders',
  'North Strathclyde',
  'South Strathclyde, Dumfries and Galloway',
  'Tayside, Central and Fife',
] as const;
export type Sheriffdom = (typeof SHERIFFDOMS)[number];

// === Asset types ===
export const ASSET_TYPES = [
  'heritable_property',
  'bank_account',
  'building_society',
  'shares',
  'household_goods',
  'motor_vehicle',
  'pension',
  'ns_i',
  'premium_bonds',
  'other',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

// === Asset country ===
export const ASSET_COUNTRIES = [
  'scotland',
  'england_wales',
  'northern_ireland',
  'elsewhere',
] as const;
export type AssetCountry = (typeof ASSET_COUNTRIES)[number];

// === Heritable vs moveable ===
export const HERITABLE_TYPES: AssetType[] = ['heritable_property'];

// === Marital status radio values (note leading spaces — from field map) ===
export const MARITAL_STATUS_VALUES = {
  married: '/ M',
  single: '/ S',
  divorced: '/ D',
  widowed: '/ W',
} as const;
export type MaritalStatus = keyof typeof MARITAL_STATUS_VALUES;

// === Checkbox values ===
export const CHECKBOX_ON_B = '/ B';
export const CHECKBOX_ON_P = '/ P';
export const CHECKBOX_OFF = '/Off';

// === Radio values (IHT400, excepted estate, NRB transfer) ===
export const RADIO_YES = '/Yes';
export const RADIO_NO = '/No';

// === Dropdown values for C1_21a and C1_21b ===
export const EXECUTOR_VERB = { single: '/ am', multiple: '/ are' } as const;
export const EXECUTOR_GENDER = { male: '/ Executor', female: '/ Executrix' } as const;

// === Inventory ===
export const INVENTORY_MAX_LINES = 37;

// === Wizard steps ===
export const WIZARD_STEPS = [
  { slug: 'eligibility', label: 'Eligibility' },
  { slug: 'sheriffdom', label: 'Sheriffdom' },
  { slug: 'deceased', label: 'Deceased' },
  { slug: 'executor', label: 'Executor' },
  { slug: 'will', label: 'Will' },
  { slug: 'assets', label: 'Assets' },
  { slug: 'liabilities', label: 'Liabilities' },
  { slug: 'tax', label: 'Tax' },
  { slug: 'preview', label: 'Preview' },
  { slug: 'payment', label: 'Payment' },
  { slug: 'download', label: 'Download' },
] as const;

// === Asset type labels for UI ===
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  heritable_property: 'Heritable Property (Land/Buildings)',
  bank_account: 'Bank Account',
  building_society: 'Building Society Account',
  shares: 'Stocks and Shares',
  household_goods: 'Household Goods and Personal Effects',
  motor_vehicle: 'Motor Vehicle',
  pension: 'Pension Arrears',
  ns_i: 'National Savings & Investments',
  premium_bonds: 'Premium Bonds',
  other: 'Other',
};

// === Country labels for UI ===
export const ASSET_COUNTRY_LABELS: Record<AssetCountry, string> = {
  scotland: 'Scotland',
  england_wales: 'England and Wales',
  northern_ireland: 'Northern Ireland',
  elsewhere: 'Elsewhere (outside UK)',
};
