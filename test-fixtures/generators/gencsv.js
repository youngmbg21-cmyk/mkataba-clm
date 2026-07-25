const fs = require('fs');
const OUT = '/home/user/mkataba-clm/test-fixtures';
const w = (n, s, enc) => fs.writeFileSync(OUT + '/' + n, Buffer.from(s, enc || 'utf8'));
const CRLF = String.fromCharCode(13, 10);
const BOM = '﻿';

// 1 — clean manifest matching the batch of ten
const head = 'filename,name,counterparty,type,stream,status,value,currency,effective date,expiry date,signed date';
const rows = [];
for (let i = 1; i <= 10; i++) {
  rows.push('"batch-' + String(i).padStart(2, '0') + '.pdf","Supply Agreement ' + i + '","Counterparty ' + i +
    ' Ltd","Raw Material Supply","Procurement","Executed","' + (500000 * i) + '","KES","2024-01-15","2026-01-14","2024-01-20"');
}
w('manifest-01-clean.csv', head + '\n' + rows.join('\n') + '\n');

// 2 — different column names entirely
w('manifest-02-alt-columns.csv',
  'Doc,Agreement,Vendor,Kind,Department,Stage,Amount,Ccy,Commencement,Termination,Executed\n' +
  '"batch-01.pdf","Sugar supply","Kabras Sugar Ltd","Raw Material Supply","Procurement","Executed","2500000","KES","2024-01-15","2026-01-14","2024-01-20"\n' +
  '"batch-02.pdf","Carton supply","Nampak Kenya","Packaging Supply","Procurement","Executed","1800000","KES","2024-02-01","2026-01-31","2024-02-03"\n');

// 3 — UK-format dates (and one that is only valid as UK)
w('manifest-03-uk-dates.csv', head + '\n' +
  '"batch-01.pdf","Sugar supply","Kabras Sugar Ltd","Raw Material Supply","Procurement","Executed","2500000","KES","15/01/2024","14/01/2026","20/01/2024"\n' +
  '"batch-02.pdf","Carton supply","Nampak Kenya","Packaging Supply","Procurement","Executed","1800000","KES","01/03/2024","28/02/2026","03/03/2024"\n' +
  '"batch-03.pdf","Ambiguous dates","Statpack Ltd","Packaging Supply","Procurement","Executed","900000","KES","03/15/2024","12/31/2026","03/16/2024"\n');

// 4 — CRLF line endings plus a UTF-8 BOM
w('manifest-04-bom-crlf.csv', BOM + [head,
  '"batch-01.pdf","Sugar supply","Kabras Sugar Ltd","Raw Material Supply","Procurement","Executed","2500000","KES","2024-01-15","2026-01-14","2024-01-20"',
  '"batch-02.pdf","Carton supply","Nampak Kenya","Packaging Supply","Procurement","Executed","1800000","KES","2024-02-01","2026-01-31","2024-02-03"'
].join(CRLF) + CRLF);

// 5 — quoted fields containing commas (and an escaped quote)
w('manifest-05-quoted-commas.csv', head + '\n' +
  '"batch-01.pdf","Supply of sugar, syrup, and glucose","Kabras Sugar Ltd, Malava","Raw Material Supply","Procurement","Executed","2,500,000","KES","2024-01-15","2026-01-14","2024-01-20"\n' +
  '"batch-02.pdf","The ""Premium"" carton line","Nampak Kenya, Ltd","Packaging Supply","Procurement","Executed","1800000","KES","2024-02-01","2026-01-31","2024-02-03"\n');

// 6 — rows that match no uploaded file
w('manifest-06-ghost-rows.csv', head + '\n' +
  '"batch-01.pdf","Sugar supply","Kabras Sugar Ltd","Raw Material Supply","Procurement","Executed","2500000","KES","2024-01-15","2026-01-14","2024-01-20"\n' +
  '"never-sent-01.pdf","Lost in the shared drive","Ghost Traders Ltd","Distributor Agreement","Sales","Executed","4000000","KES","2023-06-01","2025-05-31","2023-06-04"\n' +
  '"never-sent-02.pdf","Also missing","Phantom Logistics","Freight","Warehousing","Executed","750000","KES","2023-06-01","2025-05-31","2023-06-04"\n');

// 7 — missing the required columns entirely
w('manifest-07-missing-required.csv',
  'reference,notes,owner\n' +
  '"REF-001","chased the supplier twice","Wanjiku"\n' +
  '"REF-002","waiting on the signed copy","Otieno"\n');

// 8 — Kenyan money notation
w('manifest-08-kenyan-values.csv', head + '\n' +
  '"batch-01.pdf","Sugar supply","Kabras Sugar Ltd","Raw Material Supply","Procurement","Executed","KES 2.5m","KES","2024-01-15","2026-01-14","2024-01-20"\n' +
  '"batch-02.pdf","Carton supply","Nampak Kenya","Packaging Supply","Procurement","Executed","2,500,000/=","KES","2024-02-01","2026-01-31","2024-02-03"\n' +
  '"batch-03.pdf","Freight","Siginon Group","Freight","Warehousing","Executed","Kshs. 750,000/-","KES","2024-02-01","2026-01-31","2024-02-03"\n' +
  '"batch-04.pdf","Lease","Britam","Commercial Lease","Corporate","Executed","1.2 million","KES","2024-02-01","2026-01-31","2024-02-03"\n');

// 9 — header only, no data rows
w('manifest-09-header-only.csv', head + '\n');

console.log('csv fixtures written');
