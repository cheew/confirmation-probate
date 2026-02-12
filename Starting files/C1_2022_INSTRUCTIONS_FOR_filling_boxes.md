# C1(2022) Confirmation Inventory — Instructions for AI Form-Filling

## Purpose of This Document

This document accompanies two other files:

1. **c1_2022_field_map.json** — A complete machine-readable map of all 262 fillable PDF form fields, their types, validation rules, conditional logic, and guidance.
2. **c1_2022_field_map.xlsx** — A human-readable spreadsheet version of the same data across 4 tabs.

Together, these three files give you everything needed to programmatically fill the HMRC C1(2022) Scottish Confirmation Inventory form from a Node.js wizard. This instruction file explains the *context, gotchas, and domain knowledge* that the field map alone cannot convey.

---

## 1. What This Form Is

The C1(2022) is the Scottish equivalent of a probate application (called **Confirmation** in Scotland). It is submitted to a **Sheriff Court** (not HMRC directly, unless IHT is owed) and serves as the legal authority for executors to collect the deceased's assets.

The form is issued by HM Revenue & Customs and is only for deaths on or after **1 January 2022**. For deaths before 18 March 1986, a different form (A3) is required.

**Key distinction from English probate:** Scottish Confirmation uses different legal terminology and structures. The form requires a formal **Declaration** (page 2), a **docquet** written physically on the will, and an **Inventory** listing every asset by country of registration.

---

## 2. Form Structure Overview

| Page | Content | Public Record? | Key Fields |
|------|---------|---------------|------------|
| 1 | Deceased's details + Executors | Yes | Boxes 1–10 (C1_04 through C1_16_05) |
| 2 | Declaration by executor | Yes | C1_17 through C1_24_08 |
| 3 | Inventory of estate assets | Yes | C1_Item01/Desc01/PR01/AMT01 (37 lines × 4 cols) |
| 4 | Value summary + About the deceased | **No** | Boxes 11–20 (C1_25 through C1_36_09) |
| 5 | About the estate (IHT) | **No** | Boxes 21–26 (C1_37 through C1_44) |

Pages 1–3 plus any continuation sheets (C2) become part of the **public record**. Pages 4–5 are confidential. This matters because institutions (banks, building societies) will receive certified extracts based on pages 1–3.

---

## 3. PDF Field Naming Convention

All fields follow the pattern `C1_XX` or `C1_XX_YY` where:

- `C1_` prefix = form identifier
- Next digits = the logical field group (roughly maps to the form's box numbers but not exactly — see mapping below)
- `_YY` suffix = sub-field index for multi-part fields (e.g. address lines, date digits)

### Important: PDF field IDs do NOT match form box numbers directly

| Form Box # | PDF Field IDs | What It Is |
|-----------|---------------|-----------|
| Header | C1_01_01 to C1_01_05, C1_02, C1_03 | Applicant name/address/refs |
| Box 1 | C1_04 | Title (Mr/Mrs/etc.) |
| Box 2 | C1_05_01, C1_05_02 | First names (2 lines) |
| Box 3 | C1_06 | Surname |
| Box 4 | C1_07_01 to C1_07_05 | Address + postcode |
| Box 5 | C1_08 | Occupation |
| Box 6 | C1_09_01 to C1_09_08 | Date of birth (8 single digits) |
| Box 7 | C1_10_01 to C1_10_08 | Date of death (8 single digits) |
| Box 8 | C1_11 | Place of death |
| Box 9 | C1_12 | Total estate for Confirmation (£) |
| Box 10 | C1_13 to C1_16 (×5 each) | Up to 4 executors |
| Declaration | C1_17 to C1_24_08 | Declaration text + date |
| Inventory | C1_Item01.LineNN, C1_Desc01.LineNN, C1_PR01.LineNN, C1_AMT01.N | 37 rows × 4 columns |
| Box 11 | C1_25 | Gross value |
| Box 12 | C1_26 | Funeral expenses |
| Box 13 | C1_27 | Mortgage/standard security |
| Box 14 | C1_28 | Other debts |
| Box 15 | C1_29 | Net value (CALCULATED — read-only) |
| Box 16 | C1_30 | IHT400 completed? (radio Yes/No) |
| Box 17 | C1_31 | Marital status (radio 4 options) |
| Box 18 | C1_32a, C1_32b, C1_32c | Surviving relatives (checkboxes) |
| Box 19 | C1_33, C1_34 | Children + grandchildren count |
| Box 20 | C1_35_01–10, C1_36_01–09 | UTR (10 digits) + NI number (9 chars) |
| Box 21 | C1_40 | Excepted estate? (radio Yes/No) |
| Box 22 | C1_41 | Transfer nil rate band? (radio Yes/No) |
| Box 23 | C1_37 | Gross value for IHT |
| Box 24 | C1_38 | Net value for IHT |
| Box 25 | C1_39 | Net qualifying value |
| Box 26 | C1_44 | Tax being paid |

---

## 4. Field Types and How to Set Them

### Text fields (`/Tx`)
Set value as a string. Most fields.

### Date fields (DD MM YYYY)
These are **8 individual single-character text boxes** (not a date picker). Your wizard should collect a date and split it:
```
Date: 08/03/1949
C1_09_01 = "0"  // Day tens
C1_09_02 = "8"  // Day units
C1_09_03 = "0"  // Month tens
C1_09_04 = "3"  // Month units
C1_09_05 = "1"  // Year thousands
C1_09_06 = "9"  // Year hundreds
C1_09_07 = "4"  // Year tens
C1_09_08 = "9"  // Year units
```

### Radio buttons (`/Btn` with kids)

**C1_30 (IHT400 completed?):**
- Yes: set value to `/Yes`
- No: set value to `/No`

**C1_31 (Marital status):** This is a radio group with 4 child buttons. The checked values are:
- Married/civil partnership: `/ M` (note the leading space)
- Single: `/ S`
- Divorced/former civil partner: `/ D`
- Widowed/surviving civil partner: `/ W`

**C1_40 and C1_41 (Excepted estate / Transfer NRB):**
- Yes: `/Yes`
- No: `/No`

### Checkboxes (`/Btn` standalone)

**C1_32a (Surviving spouse):** checked = `/ B`, unchecked = `/Off`
**C1_32b (Surviving parent):** checked = `/ P`, unchecked = `/Off`
**C1_32c (Surviving siblings):** checked = `/ B`, unchecked = `/Off`

Note: C1_32a and C1_32c both use `/ B` as checked value — this is correct in the PDF.

### Choice/Dropdown fields (`/Ch`)

**C1_21a:** Options are `"am"` or `"are"` (for "That I am/are..."). Use "am" for single executor, "are" for multiple.

**C1_21b:** Options are `"Executor"` or `"Executrix"`. Use Executor for male declarant, Executrix for female.

### Calculated field

**C1_29 (Net value):** This is auto-calculated: Box 11 − Box 12 − Box 13 − Box 14. It has a read-only flag. Your app should still set it if the PDF calculation doesn't trigger programmatically, as many forum users reported the auto-calc doesn't work in all PDF readers.

### Currency fields
All currency fields (C1_12, C1_23, C1_25–C1_29, C1_37–C1_39, C1_44, and all C1_AMT01.N) should be entered as **numbers only, no £ sign, no commas**. Round down to nearest pound.

---

## 5. CRITICAL: The Inventory (Page 3)

This is the most complex and most frequently rejected part of the form. The inventory is a 37-line table with 4 columns per line:

| Column | Field Pattern | Purpose |
|--------|-------------|---------|
| Item number | `C1_Item01.LineNN` | Sequential numbering (1, 2, 3...) |
| Description | `C1_Desc01.LineNN` | Asset description text |
| Price of shares / full value | `C1_PR01.LineNN` | Used for gross/full values (e.g. full house value before taking half share) |
| £ amount | `C1_AMT01.N` | The value to be confirmed (deceased's share) |

`C1_AMT01_Total` auto-sums the £ column.

### 5.1 Mandatory Inventory Structure

Assets **MUST** be listed under these headings **IN THIS EXACT ORDER**, even if a section has no assets (write NIL):

```
HERITABLE ESTATE IN SCOTLAND
  [Property items with conveyancing descriptions]
  Total heritable estate in Scotland: £X

MOVEABLE ESTATE IN SCOTLAND
  [Bank accounts, shares, household goods, etc.]

ESTATE IN ENGLAND AND WALES
  [Assets here, or NIL]

ESTATE IN NORTHERN IRELAND
  [Assets here, or NIL]

SUMMARY FOR CONFIRMATION
  Estate in Scotland                    £X
  Estate in England and Wales           £X (or NIL)
  Estate in Northern Ireland            £X (or NIL)
  Total for Confirmation                £X

ESTATE ELSEWHERE
  [Foreign assets, or NIL — specify country]
```

**REJECTION REASON #1:** Omitting the country headings. Even if the deceased had no assets in England or Northern Ireland, you MUST include the headings with NIL values. Multiple forum users reported forms bounced solely for this.

### 5.2 How to Use the Columns

The "Price of shares" column (C1_PR01) is used for:
- The **full market value** of a jointly-owned asset (before taking the deceased's share)
- The quoted share price for stocks
- Sub-totals within a category

The "£ amount" column (C1_AMT01) is used for:
- The **deceased's share** of the value (e.g. half of jointly owned property)
- The value to be confirmed

**Important from forum:** The £ amount column auto-sums. If you put sub-totals AND individual amounts in this column, they will double-count. Put sub-totals in the Description column or the Price column instead. The carried forward total at the bottom should equal Box 9 (C1_12).

### 5.3 Property Descriptions (Heritable Estate)

This is **REJECTION REASON #2**. A simple street address is NOT sufficient. You must provide a **conveyancing description**.

**For Land Register properties (post-1981):**
```
Subjects at [FULL ADDRESS] being the subjects registered in the
Land Register of Scotland under Title Number [TITLE NUMBER]
```
The title number can be obtained from Registers of Scotland (ScotLIS) or from the property's title deeds.

**For Register of Sasines properties (pre-1981):**
```
ALL and WHOLE [description from disposition] being the subjects
described in [Search Sheet number] recorded in the General Register
of Sasines for the County of [COUNTY] on [DATE]
```

**For jointly owned property:**
After the description, add:
```
Whereof the deceased's one half pro indiviso share
```
And put the full value in the Price column, the half value in the £ column.

**For property with survivorship clause:**
If the title deed includes "and to the survivor of them", the property normally passes to the survivor WITHOUT needing Confirmation. However, some Sheriff Courts (see section 7) still require it to be included. The safest approach is to include it with a note. The value still needs to be reported on form C5 for IHT purposes.

### 5.4 Bank and Building Society Accounts

List each account separately with:
- Institution name and branch town
- Account type (current, savings, ISA, etc.)
- Account number
- "Balance at date of death including accrued interest"

**REJECTION REASON #3:** Determine the correct country based on the **registered office** of the institution, NOT the branch where the account was opened:

| Institution | Country |
|------------|---------|
| Bank of Scotland | Scotland |
| Royal Bank of Scotland | Scotland |
| Clydesdale Bank | Scotland |
| National Savings & Investments (NS&I) | Scotland (for inventory purposes) |
| Nationwide Building Society | England |
| Halifax | Scotland (part of BoS) |
| Barclays, HSBC, Lloyds, NatWest | England |
| Premium Bonds | Scotland (NS&I) |

Note: NS&I is slightly ambiguous — it's a government body. For Confirmation inventory purposes, moveable estate held by NS&I is typically listed under Scotland. However, some courts may direct otherwise. If in doubt, call HMRC on 0300 123 1072.

### 5.5 Other Common Inventory Items

**Household goods:**
```
Household goods and personal effects, value estimated
by the [Executor/Executrix] at the date of death
```
Use open market (auction/second-hand) value, NOT insurance replacement value.

**Motor vehicles:**
List separately from household goods if of significant value. Include make, model, registration number, and valuation source.

**Stocks and shares:**
Use the stock exchange price on the day after death (or the last trading day if death was on a non-trading day). The value is one quarter up from the lower of the two prices quoted, or halfway between highest and lowest bargain prices.

**Pensions owed:**
Include arrears of pension owed at date of death. Do NOT include pensions that continue to be paid to a surviving spouse directly.

---

## 6. The Declaration (Page 2)

This is the second most rejected section after the inventory.

### 6.1 Field C1_17 — "Declaration by"

This must contain the full name and current address of the executor who will sign the form. Only ONE executor signs (the "Declarant"), even if there are multiple executors.

### 6.2 Field C1_20 — Paragraph 2 ("That I am...")

This is the critical free-text paragraph that describes the executor's authority. The exact wording depends on the scenario.

**Template for Executor Nominate (named in will), single executor:**
```
[FULL NAME], [relationship] and Executor Nominate of the late
[FULL NAME OF DECEASED] conform to the Will of the said deceased
dated [DATE OF WILL] which is produced herewith, docquetted and
signed by me as relative hereto
```

**Template for Executor Nominate with co-executors:**
```
[FULL NAME], [relationship] and Executor Nominate of the late
[FULL NAME OF DECEASED] along with [FULL NAME OF OTHER EXECUTOR(S)],
residing at [THEIR ADDRESS(ES)], conform to the Will of the said
deceased dated [DATE OF WILL] which is produced herewith, docquetted
and signed by me as relative hereto
```

**Template for Executor Dative (no will / not named in will):**
```
[FULL NAME], [relationship] and Executor Dative of the late
[FULL NAME OF DECEASED] qua [relationship] of the said deceased
who died intestate [OR: leaving a Will dated [DATE] but without
appointing any executor] as decerned by the Sheriff at [SHERIFFDOM]
on [DATE OF DECREE]
```

**If any named executor has died:**
Add: "the said [NAME] having since died on [DATE]"

**If any named executor has declined:**
Add: "the said [NAME] having declined to act as [Executor/Executrix] by letter dated [DATE]"

**If the will has codicils:**
Add: "and codicil(s) thereto dated [DATE(S)]"

### 6.3 The Docquet (NOT on the C1 form — goes on the will itself)

This is a handwritten note that must be physically added to the **first page of the original will** (not any cover sheet). It must be signed by the Declarant, dated, and state the place of signing.

**Standard docquet wording:**
```
At [PLACE] on [DATE]. This is the Will referred to in my Declaration
of this date relative to the Inventory of the Estate of the late
[FULL NAME OF DECEASED].

[Signature of Declarant]
```

**REJECTION REASON #4:** Missing place on the docquet. The place can be a town, a court, or even a home address — but it MUST be stated. One forum user had their form returned solely because no place was stated on the docquet.

**REJECTION REASON #5:** The date on the docquet MUST match the date on the Declaration (C1_24_01 to C1_24_08). If your form is returned and needs resubmitting, you must keep the ORIGINAL date on both.

### 6.4 Field C1_19 — Domicile

This requires very specific wording:

- **If domiciled in Scotland:** Write the name of the Sheriffdom: e.g. "the Sheriffdom of Lothian and Borders in Scotland" or "the Sheriffdom of Grampian, Highland and Islands in Scotland"
- **If unsure of Sheriffdom:** Write "Without any fixed or known domicile, except that the same was in Scotland"
- **Do NOT simply write:** "died domiciled in Scotland" — this WILL be rejected
- **If domiciled outside Scotland:** Give the country and state/province

---

## 7. Sheriff Court Variations — A Major Pitfall

**This is possibly the single most important thing to understand.** Different Sheriff Courts apply the rules differently. What is accepted at one court may be rejected at another. The forum documents many cases of conflicting requirements between courts.

### Known court-specific behaviours:

**Edinburgh (Lothian and Borders) — STRICTEST**
- Most pedantic about wording
- Refused to provide help over the phone for "large estates" (over £36,000)
- Requires very precise declaration wording
- Most likely to reject on technical grounds

**Aberdeen (Grampian, Highland and Islands)**
- Generally helpful
- Allowed corrections to be made in person
- Relatively quick turnaround (sometimes 7 days)
- Known to accept property passing by survivorship NOT being included in inventory

**Paisley**
- Successful applications reported
- Moderate strictness

**Jedburgh**
- Known to bounce forms multiple times
- Strict on docquet wording

**Dundee**
- Helpful officials
- Pointed out corrections and even made minor ones themselves
- Fast turnaround (7 days reported)

**Glasgow**
- Relatively accommodating
- Appointments can be booked by phone

### Survivorship property — the inconsistency

This is the most documented inconsistency between courts:
- **The official guidance** (C3(2006) page 7) says property with a survivorship clause passes to the survivor without Confirmation and should NOT be in the inventory
- **Some courts** (reported: one in the Borders area) still require it to be included, with totals adjusted accordingly
- **Other courts** (reported: Aberdeen) correctly accept it being excluded
- **The safest approach for your wizard:** Include a question about survivorship clause and, if present, offer the option to include or exclude, with a warning that the court may have local preferences

---

## 8. Conditional Logic and Skip Rules

### Rule 1: IHT400 Skip
If Box 16 (C1_30) = Yes (IHT400 has been completed):
- **Skip Boxes 17–20** entirely (do not fill C1_31 through C1_36_09)
- Jump to Box 21

### Rule 2: Excepted Estate Path
If Box 21 (C1_40) = Yes (estate is excepted):
- Complete Box 25 (C1_39 — net qualifying value)
- Box 26 (C1_44) should be "0" (no tax to pay)
- Do NOT need to fill IHT400

An estate qualifies as excepted if:
- Gross value for IHT ≤ £325,000 (the nil rate band, 2009–2026), OR
- Gross value ≤ £650,000 AND claiming transfer of unused nil rate band from pre-deceased spouse (Box 22 = Yes), OR
- It qualifies as an exempt excepted estate (gross value ≤ £3,000,000 and most/all passes to spouse/charity)

### Rule 3: Transferable Nil Rate Band
If Box 22 (C1_41) = Yes:
- The spouse/civil partner must have died on or after 13 November 1974
- The current deceased must have died on or after 6 April 2010
- The pre-deceased spouse's nil rate band must not have been fully used
- This effectively doubles the excepted estate limit to £650,000

### Rule 4: Value Calculations
```
Box 15 (C1_29) = Box 11 (C1_25) - Box 12 (C1_26) - Box 13 (C1_27) - Box 14 (C1_28)
```
This is auto-calculated in the PDF but often fails in non-Acrobat readers. Your app should calculate it.

### Rule 5: Value Consistency
```
Box 9 (C1_12) = Inventory total (C1_AMT01_Total)
Box 11 (C1_25) = Box 9 (C1_12)  [unless mortgage was deducted in inventory — then add it back]
Paragraph 6 value (C1_23) = Box 9 (C1_12)
```

---

## 9. Comprehensive List of Rejection Reasons

Based on analysis of 100+ forum posts from people who had their C1 forms returned:

### CRITICAL (will definitely be rejected)

| # | Issue | Affected Fields | Fix |
|---|-------|----------------|-----|
| 1 | Missing country headings in inventory | C1_Desc01 lines | Include ALL headings (Scotland, England & Wales, N. Ireland, Summary, Elsewhere) even if NIL |
| 2 | Insufficient property description | C1_Desc01 lines | Must include conveyancing description with title number or Sasines reference, not just address |
| 3 | Missing place on docquet | Will itself (not PDF) | Must state town/location where docquet was signed |
| 4 | Declaration wording incorrect/incomplete | C1_20 | Must state: executor type (Nominate/Dative), relationship, will details, date of will |
| 5 | Date mismatch between declaration and docquet | C1_24_01–08 | Must be identical dates |
| 6 | Simply saying "domiciled in Scotland" | C1_19 | Must name the Sheriffdom specifically |
| 7 | Values don't add up | C1_12, C1_25, C1_23, C1_AMT01_Total | All must be consistent |
| 8 | Wrong country assignment for financial institutions | C1_Desc01 lines | Use registered office location, not branch |

### HIGH RISK (likely to be rejected at stricter courts)

| # | Issue | Affected Fields | Fix |
|---|-------|----------------|-----|
| 9 | Not stating whether Executor Nominate or Dative | C1_20 | Always specify the type |
| 10 | Using insurance value for household goods | C1_AMT01 lines | Must use open market (auction) value |
| 11 | Including post-death professional fees as debts | C1_28 | Only debts actually owed at date of death |
| 12 | Including foreign debts on C1 | C1_28 | Foreign debts should NOT be on C1 |
| 13 | Not including account numbers for bank accounts | C1_Desc01 lines | Include full account details — the certificates will use your exact wording |
| 14 | Auto-sum doubling from summary totals | C1_AMT01 lines | Put summary totals in Description column, not £ column |
| 15 | Missing "Executor" or "Executrix" designation | C1_21b | Must match the sex of the declarant |

### MODERATE RISK (may cause delays)

| # | Issue | Fix |
|---|-------|-----|
| 16 | Not specifying which ISA provider holds shares | Include provider name and reference in description |
| 17 | Executor's address doesn't match will | Use current address on page 1; note previous address in Declaration |
| 18 | Not stating if deceased was retired | Add "(retired)" after occupation if applicable |
| 19 | Forgetting to say "none" if no occupation | C1_08 must not be left blank |
| 20 | Putting zero in NI/UTR instead of "not known" | Write "not known" if information unavailable |

---

## 10. Fees and Practical Information

- **No additional fee** for resubmission if forms are returned for correction
- Fees are based on the value of the estate for Confirmation
- The court produces specific certificates for each institution — the description in the inventory is copied VERBATIM onto each certificate, so make descriptions recognisable to the receiving institution
- You can request multiple certificates — one per institution/asset that needs to be claimed
- Turnaround varies: 7 days (Dundee, Aberdeen) to several weeks (Edinburgh)

---

## 11. Continuation Sheets (C2)

If the 37 lines on page 3 are insufficient:
- Use form C2 continuation sheets
- Number them C2/1, C2/2, C2/3, etc.
- Update field C1_22 (Paragraph 5) to show the last page number (e.g. "C2/3")
- The C2 fields follow the same pattern but are in a separate PDF

---

## 12. Related Forms

| Form | When Needed |
|------|------------|
| **C5(2006)(2022)** | Return of Estate Information — always required alongside C1 for excepted estates |
| **IHT400** | Formal Inheritance Tax account — required if estate exceeds excepted estate limits |
| **C4(S)(2022)** | Corrective Inventory — for changes to the estate after Confirmation is granted |
| **C2** | Continuation sheets for the inventory if 37 lines are insufficient |
| **IHT422** | Application for IHT reference number (needed if tax is payable) |
| **C5(2006)(OUK)** | If deceased was domiciled outside UK |

---

## 13. Wizard Design Recommendations

Based on the complexity and common errors documented above, your Node.js wizard should:

1. **Collect data in user-friendly sections** — don't mirror the form's layout. Group by: Deceased details → Executors → Will/testament details → Assets → Debts → IHT status.

2. **Auto-generate the Declaration text** (C1_20) based on structured inputs — don't ask users to write legal prose. Collect: executor type (Nominate/Dative), relationship to deceased, will date, codicil dates, other executor names, and build the wording from templates.

3. **Auto-generate the Inventory** from structured asset entries — collect each asset as a structured object (type, description, institution, account number, full value, deceased's share, country) and render them into the 37-line grid in the correct order with correct headings.

4. **Validate country headings** — ensure the generated inventory includes all 5 mandatory headings.

5. **Auto-calculate and cross-validate** all totals: inventory total = Box 9 = Box 11 = Paragraph 6 value.

6. **Split dates automatically** into 8 individual digit fields.

7. **Warn about the docquet** — the wizard cannot fill this (it goes on the physical will), so display clear instructions about what to write, where, and the importance of matching the date.

8. **Include a "Which Sheriff Court?" question** — use the answer to tailor guidance (e.g. warn Edinburgh users about stricter requirements).

9. **Handle the survivorship question** for property — ask whether the title contains survivorship wording and adjust the inventory accordingly, with a note about court variations.

10. **Generate the Inventory Summary** automatically — calculate Estate in Scotland, Estate in England and Wales, Estate in Northern Ireland, Total for Confirmation, and Estate Elsewhere from the categorised asset entries.

---

## 14. Testing Checklist

Before deploying, verify the filled PDF against these checks:

- [ ] All date fields contain single digits (not full dates)
- [ ] Currency fields contain numbers only (no £, no commas)
- [ ] Inventory headings appear in correct order with NIL where appropriate
- [ ] No values in the £ column for summary/sub-total lines (use Description column instead)
- [ ] C1_AMT01_Total matches C1_12 matches C1_23 matches C1_25
- [ ] C1_29 = C1_25 - C1_26 - C1_27 - C1_28
- [ ] Radio buttons use correct values with leading spaces where needed (`/ M`, `/ S`, `/ D`, `/ W`)
- [ ] Checkboxes use correct values (`/ B`, `/ P`, `/Off`)
- [ ] Choice dropdowns use exact option strings (`"am"`, `"are"`, `"Executor"`, `"Executrix"`)
- [ ] Declaration text includes executor type, will date, and correct legal phrasing
- [ ] Domicile field names the Sheriffdom (not just "Scotland")
- [ ] If IHT400 = Yes, Boxes 17-20 are empty
- [ ] If deceased had property, it has a conveyancing description
- [ ] All bank accounts include account numbers and institution names

---

*Document generated from analysis of: C1(2022) PDF form (266 fields), C3(2006)(2022) HMRC guidance notes (20 pages), and MoneySavingExpert forum thread on Grant of Confirmation (100+ posts spanning 2014–2024).*
