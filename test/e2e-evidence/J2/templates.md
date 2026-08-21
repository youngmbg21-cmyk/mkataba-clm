# All twelve built-in templates — the walk

| Template | Folder | Form fields asked | Orphan fields (asked, never printed) | Payment answer | Term treatment | Term span (5yr example) | Party prints via recital | Verdict |
|---|---|---|---|---|---|---|---|---|
| RM — Raw Material Supply Agreement | proc | party, counterparty, value, effDate, expiry, material, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| PK — Packaging Supply Agreement | proc | party, counterparty, value, effDate, expiry, packType, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| CM — Contract Manufacturing (Co-Packing) | mfg | party, counterparty, value, effDate, expiry, product, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| EQ — Equipment Lease & Maintenance | mfg | party, counterparty, value, effDate, expiry, equipment | — | null (no payment window) | clause | 3 years | yes | clean |
| WH — Warehousing & Cold-Chain Agreement | dist | party, counterparty, value, effDate, expiry, site, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| FF — Freight & Distribution Agreement | dist | party, counterparty, value, effDate, expiry, region, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| DA — Distributor Agreement | sales | party, counterparty, value, effDate, expiry, territory, creditDays | — | key+default(creditDays) | clause | 3 years | yes | clean |
| RL — Retail Listing & Supply Agreement | sales | party, counterparty, value, effDate, expiry, channel, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| MK — Marketing & Trade Promotion Services | mktg | party, counterparty, value, effDate, expiry, services, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
| ND — Mutual Non-Disclosure Agreement | corp | party, counterparty, effDate, expiry | — | null (no payment window) | clause | 3 years | yes | clean |
| LE — Commercial Property Lease | corp | party, counterparty, value, effDate, expiry, premises | — | null (no payment window) | clause | 3 years | yes | clean |
| PS — Professional Services Agreement | corp | party, counterparty, value, effDate, expiry, services, payDays | — | key+default(payDays) | recital | 3 years | yes | clean |
