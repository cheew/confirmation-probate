in the wizard/eligibility page there are a number of double negative questions, see below for how to change them, then make sure the logic is correct in the data.

1. Business Interests

Original:
“Are there no business interests in the estate?”

Clear version:
Does the estate include any business interests?

Yes

No

You can optionally clarify:
Examples: sole trader, partnership, limited company shares.

2. Agricultural Land / Agricultural Relief

Original:
“Is there no agricultural land or agricultural relief involved?”

Clear version:
Does the estate include any agricultural land or claim Agricultural Property Relief?

Yes

No

3. Foreign Property

Original:
“Is there no complex foreign property?”

Clear version:
Does the estate include any property or significant assets located outside the UK?

Yes

No

If you want to narrow it:
“outside Scotland” vs “outside the UK” depending on your logic.

4. Disputed Will

Original:
“Is the will undisputed (or is there no will)?”

This one is especially messy because it mixes two concepts.

Split it into two separate logical questions:

Q1: Was a valid will left?

Yes

No

If Yes → show:

Q2: Is anyone disputing the will or challenging its validity?

Yes

No

Much cleaner branching.

5. Ongoing Litigation

Original:
“Is there no ongoing litigation involving the estate?”

Clear version:
Is the estate involved in any ongoing legal disputes or court proceedings?

Yes

No

Text colour issue
All typed text reverts to a very light grey which is unreadable.

Create the ability to import and export a session to return to later. This will allow the data to continue to be stored on the local device.

No question was asked to fill in the following fields 
--Your reference
--HM Revenue and Customs reference (where an IHT400
has been completed)



Declaration Section issues 

The declaration has full stops and comma after some words, see an excerpt, these were not added by the user:

Kirstie Tinnion, Daughter and Executrix Nominate of the late Richard Woodcock along with Jennifer
Woodcock., residing at Melrose Avenue., Bedlington, Northumberland, NE47 5ty conform to the Will of
the said deceased dated 1 February 2022 which is produced herewith, docquetted and signed by me as
relative hereto

The chosen domiciled in dropdown has caused the form to start with a lower case letter :
the Sheriffdom of Grampian, Highland and Islands in Scotland

3. That I have entered or about to enter, upon possession and
management of the deceased’s estate as foresaid along with the said

The above sentance should have the name of the executor/executrix i believe. (check guidance)

About the deceased section

Have you filled in form IHT400 Inheritance Tax account?
Yes If Yes, go to question 26 F
	 No	 If No, go to question 17

The above had yes ticked although it was not selkecte when filling the  Wizard in.
 Please check the logic for question 16. Have you filled in form IHT400 Inheritance Tax Account?
 
 About the deceased question seventeen tell us which of the following applied to the deceased at the time of death There is nothing ticked in these boxes however you asked the question in the form
 
  About the estate Question twenty one for inheritance tax is the estate an accepted estate no or yes there is nothing being added to either of these boxes even though it could be assumed that it was an accepted estate from the logic in the forms
  
  