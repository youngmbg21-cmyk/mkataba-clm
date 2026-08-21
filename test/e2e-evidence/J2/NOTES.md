# J2 — Raising a contract, every way there is — NOTES

Run at 2026-08-21T06:25:44.352Z. Server: http://127.0.0.1:39747. Browser errors observed: 3.

1. [PASS] control: an unregistered contract opens on docs — docs
2. [PASS] property 1: a registered draft lands on Key terms — terms
3. [PASS] property 1: it fires ONCE — the id is deleted on arrival — docs
4. [PASS] property 2: an executed (Signed) contract is excluded — docs
5. [PASS] property 2: a sealed/migrated contract excluded even if status is not literally Signed — docs
6. [PASS] property 2: an UPLOAD (Under Review, not executed) IS included — terms
7. [PASS] property 3: an explicit tab request (_wsTabWant) still wins — docs
8. [PASS] the Home page's "Draft new agreement" trigger (#hero-draft) exists on screen
9. [PASS] the picker opens on a STREAMS screen (not one flat grid) — Procurement & Raw Materials
          2
          Ingredient, commodity and packaging supply into the plants. | Manufacturing & Production
          2
          Co-packing, tolling and plant equipment agreements. | Warehousing & Distribution
          2
          3PL warehousing, cold chain and primary distribution. | Sales & Route-to-Market
          2
          Distributor, modern-trade and e-commerce supply deals. | Marketing & Brand
          1
          Agency, media, activation and sponsorship contracts. | Corporate & Compliance
          3
          NDAs, leases, audit, legal and IT / professional services.
10. [PASS] search sits on the front (streams) screen
11. [PASS] opening a stream shows a back door and its own templates — Raw Material Supply
        Commodity & ingredient supply into the plants. | Packaging Supply
        Bottles, cartons, films and labels.
12. [PASS] wizard: a new contract landed at the top of the register — n=5
13. [PASS] wizard: the new contract carries an OWNER stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
14. [PASS] wizard: it opened the room on Key terms — terms
15. [PASS] wizard: filed under the stream it was picked from (proc) — proc
16. [PASS] a caller beyond createFromTemplate's own definition/export exists in source (js/views/intake.js) — /home/user/mkataba-clm/js/views/intake.js:177:    createFromTemplate(tid);
17. [PASS] an open request offers a "Draft" action to an editor/admin (the intake queue)
18. [PASS] SITE 2 (via Requests -> Draft): createFromTemplate created a contract through a REAL UI path — {"n":6,"owner":{"id":"u_0072f9a0da9441a9","name":"Amina Otieno"},"tab":"terms","template":"RM","intakeRequestId":"REQ-A4267B"}
19. [PASS] SITE 2: the contract carries an owner stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
20. [PASS] SITE 2: it opened the room on Key terms — terms
21. [PASS] SITE 2: the contract is linked back to the request it came from — REQ-A4267B
22. [PASS] a saved ("mine") template is reachable via the picker (found by search) — Acme Counterparty MSA
        Saved from a contract
23. [PASS] picking a saved template opens the essentials form (ce-create)
24. [PASS] library.js: a contract was created from the saved template — Acme Counterparty MSA (Draft)
25. [PASS] library.js: it carries an owner stamp
26. [PASS] library.js: it lands on Key terms — terms
27. [PASS] a distinct "Other" stream card is drawn for the unfiled template — {"id":"__wz_other__","text":"Other\n          1\n          Templates with no value stream on them yet."}
28. [PASS] "Other" is never a real value stream in FOLDERS
29. [PASS] the filed company template is listed inside its own stream (dist) — Master Distribution Standard
        v1 · pre-filled & branded
30. [PASS] the unfiled company template shows up under "Other" — Unfiled Company Standard
        v1 · pre-filled & branded
31. [PASS] search on the front screen finds a template regardless of which stream it is filed under
32. [PASS] tplLibNewContract opens the essentials form
33. [PASS] templatelib.js: a contract was created from the company template
34. [PASS] templatelib.js: it carries an owner stamp
35. [PASS] templatelib.js: it lands on Key terms — terms
36. [PASS] an "Other" (unfiled) template still lands its contract in a real stream (never literally unfiled) — folder=sales
37. [PASS] a template's picker stream (folder) and its contracts' actual landing stream can DISAGREE — picker=mktg (Marketing & Brand — where the picker files and displays it) | actual=proc (where the resulting contract actually landed)
38. [PASS] a "Create in bulk" trigger exists for the Raw Material Supply built-in
39. [PASS] the bulk CSV parsed clean and enabled "Create drafts"
40. [PASS] templatefields.js: bulk creation produced the contract
41. [PASS] templatefields.js: the bulk-created contract carries an owner stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
42. [PASS] templatefields.js registers roomOpenOnTerms for each bulk-created contract (source)
43. [PASS] the upload pipeline reached the confirm step (up-go present)
44. [PASS] contract.js: the uploaded contract was created
45. [PASS] contract.js: the uploaded contract carries an owner stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
46. [PASS] contract.js: an upload is filed Under Review (not Draft) — Under Review
47. [PASS] contract.js: an upload (not-yet-executed) still lands on Key terms — terms
48. [PASS] migration.js: the register grew after dropping a file — before=10 after=11
49. [PASS] migration.js: default import lands Signed/executed (the importer's own default) — {"n":11,"id":"MK-207","status":"Signed","hash":"MIGRATED","owner":{"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}}
50. [PASS] migration.js: an executed migrated contract carries an owner stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
51. [PASS] migration.js: an EXECUTED migrated contract stays on the Document tab (correctly excluded) — docs
52. [PASS] migration.js: a second import grew the register again — before=11 after=12
53. [PASS] migration.js: an "Under Review" migrated contract is NOT marked executed — {"n":12,"id":"MK-208","status":"Under Review","hash":null,"owner":{"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}}
54. [PASS] migration.js: it carries an owner stamp — {"id":"u_0072f9a0da9441a9","name":"Amina Otieno"}
55. [PASS] migration.js: a freshly migrated (not executed) contract lands on Key terms — terms
56. [PASS] js/family.js creates contracts (state.contracts.unshift(c))
57. [PASS] js/family.js does NOT call roomOpenOnTerms
58. [PASS] js/family.js still calls contractOwnerStamp
59. [PASS] an amendment (nothing registered, per source) lands on the Document tab — docs
60. [PASS] RM: docBody rendered without throwing — ok
61. [PASS] RM: every asked field has somewhere to print (no orphans) — clean
62. [PASS] RM: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
63. [PASS] RM: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
64. [PASS] RM: our party prints through the recital
65. [PASS] RM: with no party set, falls back to the workspace name
66. [PASS] PK: docBody rendered without throwing — ok
67. [PASS] PK: every asked field has somewhere to print (no orphans) — clean
68. [PASS] PK: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
69. [PASS] PK: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
70. [PASS] PK: our party prints through the recital
71. [PASS] PK: with no party set, falls back to the workspace name
72. [PASS] CM: docBody rendered without throwing — ok
73. [PASS] CM: every asked field has somewhere to print (no orphans) — clean
74. [PASS] CM: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
75. [PASS] CM: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
76. [PASS] CM: our party prints through the recital
77. [PASS] CM: with no party set, falls back to the workspace name
78. [PASS] EQ: docBody rendered without throwing — ok
79. [PASS] EQ: every asked field has somewhere to print (no orphans) — clean
80. [PASS] EQ: payment answer prints on the paper (or none is expected) — pay=null (no payment window)
81. [PASS] EQ: term treatment matches DOC_TERM_IN_CLAUSE (clause) — len=3 years
82. [PASS] EQ: our party prints through the recital
83. [PASS] EQ: with no party set, falls back to the workspace name
84. [PASS] WH: docBody rendered without throwing — ok
85. [PASS] WH: every asked field has somewhere to print (no orphans) — clean
86. [PASS] WH: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
87. [PASS] WH: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
88. [PASS] WH: our party prints through the recital
89. [PASS] WH: with no party set, falls back to the workspace name
90. [PASS] FF: docBody rendered without throwing — ok
91. [PASS] FF: every asked field has somewhere to print (no orphans) — clean
92. [PASS] FF: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
93. [PASS] FF: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
94. [PASS] FF: our party prints through the recital
95. [PASS] FF: with no party set, falls back to the workspace name
96. [PASS] DA: docBody rendered without throwing — ok
97. [PASS] DA: every asked field has somewhere to print (no orphans) — clean
98. [PASS] DA: payment answer prints on the paper (or none is expected) — pay=key+default(creditDays)
99. [PASS] DA: term treatment matches DOC_TERM_IN_CLAUSE (clause) — len=3 years
100. [PASS] DA: our party prints through the recital
101. [PASS] DA: with no party set, falls back to the workspace name
102. [PASS] RL: docBody rendered without throwing — ok
103. [PASS] RL: every asked field has somewhere to print (no orphans) — clean
104. [PASS] RL: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
105. [PASS] RL: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
106. [PASS] RL: our party prints through the recital
107. [PASS] RL: with no party set, falls back to the workspace name
108. [PASS] MK: docBody rendered without throwing — ok
109. [PASS] MK: every asked field has somewhere to print (no orphans) — clean
110. [PASS] MK: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
111. [PASS] MK: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
112. [PASS] MK: our party prints through the recital
113. [PASS] MK: with no party set, falls back to the workspace name
114. [PASS] ND: docBody rendered without throwing — ok
115. [PASS] ND: every asked field has somewhere to print (no orphans) — clean
116. [PASS] ND: payment answer prints on the paper (or none is expected) — pay=null (no payment window)
117. [PASS] ND: term treatment matches DOC_TERM_IN_CLAUSE (clause) — len=3 years
118. [PASS] ND: our party prints through the recital
119. [PASS] ND: with no party set, falls back to the workspace name
120. [PASS] LE: docBody rendered without throwing — ok
121. [PASS] LE: every asked field has somewhere to print (no orphans) — clean
122. [PASS] LE: payment answer prints on the paper (or none is expected) — pay=null (no payment window)
123. [PASS] LE: term treatment matches DOC_TERM_IN_CLAUSE (clause) — len=3 years
124. [PASS] LE: our party prints through the recital
125. [PASS] LE: with no party set, falls back to the workspace name
126. [PASS] PS: docBody rendered without throwing — ok
127. [PASS] PS: every asked field has somewhere to print (no orphans) — clean
128. [PASS] PS: payment answer prints on the paper (or none is expected) — pay=key+default(payDays)
129. [PASS] PS: term treatment matches DOC_TERM_IN_CLAUSE (recital) — len=3 years
130. [PASS] PS: our party prints through the recital
131. [PASS] PS: with no party set, falls back to the workspace name
132. [FAIL] no uncaught page errors across the whole run — [console] Failed to load resource: the server responded with a status of 404 (Not Found) | [console] Failed to load resource: the server responded with a status of 502 (Bad Gateway) | [console] Failed to load resource: the server responded with a status of 409 (Conflict)

## Findings

- **[Lying]** js/app.js's own comment on createFromTemplate is stale
  Repro: The function is preceded by "No interface path calls this any more: both routes into a built-in template … go through openWizard()." That was true when written, but js/views/intake.js's Requests door (built later, per CLAUDE.md's W2-2 section) now calls createFromTemplate directly on "Draft" — confirmed live end to end: Requests -> Ask -> an editor presses Draft -> picks a template -> creates a contract that is owned, lands on Key terms, and is linked back to the request via intakeRequestId. The CODE is fine (createFromTemplate still does the right thing — owner stamp, roomOpenOnTerms, audit line); the comment inside js/app.js disagrees with the file that actually calls it. Two surfaces (a source comment and a live feature) say opposite things about the same function.
- **[Lying]** A company template's picker stream and its contracts' actual filing stream can silently disagree
  Repro: Reproduced against a real server: created a template with folder='mktg' (Marketing & Brand — the field js/wizard.js's streams picker groups and displays by, and the field tplLibCreateModal's own "Stream" dropdown writes) and category='procurement' (a separate dropdown on the SAME creation form, business-category only). The wizard picker correctly shows/files this template under Marketing & Brand. But POST /api/templates/:id/contracts (server/server.js, the route every tplLibNewContract press goes through) computes the landing folder as "b.folder && typeof b.folder==='string' ? b.folder : (TPL_CATEGORY_FOLDER[t.category] || 'corp')" — the CLIENT never sends b.folder (tplLibCreate's POST body only carries counterparty/value/dates), so it ALWAYS falls through to TPL_CATEGORY_FOLDER[t.category], landing the contract in "proc" (Procurement) — a different stream from the one the template is filed under and displayed under everywhere else. An admin who deliberately puts a template under one value stream in the Templates page/picker gets every contract from it silently filed under a different one whenever the (separate, easy to leave mismatched) business category disagrees. This is a genuine disagreement between two surfaces reading the "same" fact — not model-level: reproduced with a plain POST /api/templates then POST /api/templates/:id/contracts, i.e. exactly the request the real "Use" button sends.
