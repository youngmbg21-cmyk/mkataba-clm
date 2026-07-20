# Sample contracts — for testing HaTi's upload feature

These 5 PDFs simulate **"their paper"**: contracts a large counterparty would hand to your FMCG company to review and sign. Use them to try the **Upload a received contract** flow.

| File | Scenario | Watch the AI review flag |
|---|---|---|
| `01_Naivas_Supplier_Agreement.pdf` | Supermarket modern-trade listing terms | 75-day payment terms; auto-renewal |
| `02_KCB_Overdraft_Facility_Letter.pdf` | Bank overdraft facility | Repayable on demand; debenture security |
| `03_Britam_Head_Office_Lease.pdf` | Landlord's office lease | Stamp duty; deposit; escalation |
| `04_Givaudan_Flavour_Supply_Terms.pdf` | Multinational ingredient supplier terms | **Foreign governing law (Switzerland)**; liability capped at consignment value |
| `05_Siginon_Warehousing_3PL_Agreement.pdf` | 3PL warehousing & distribution | Liability cap vs stock value; lien on stock |

## How to test

1. In HaTi, click **Upload a received contract** (dashboard right rail, or the sidebar).
2. Attach one of these PDFs, add the counterparty name, pick a folder, set a value.
3. Open it — the PDF previews inline. Run the **AI review** to see the pre-signing checklist.
4. Tick the two verification boxes and **Sign** — the seal is a SHA-256 fingerprint of the file itself.

> These are fictitious documents generated for testing only — not real agreements, and not affiliated with the named companies.
