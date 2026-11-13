'use strict';
/* f984 — THE NAME AND THE FIGURE INK, THE DETAIL GREY, ON THE REST OF THE PAGES
   (owner, 9 Nov 2026: "yes, apply it to the rest of the pages after this merges"; f982 did Home, Contracts, Negotiations,
   Approvals, Obligations, Needs you, the contract's facts and the Redlines cards)
   Parties, People, Reads, Requests, Import, Our paper, My notes, Calendar, the Board and Settings: the line under a name,
   what waits, a role, a quote, who and when, a card's small note, a list's foot, a panel's labels and captions and a
   setting's label wear the detail grey; names, figures, money, titles and buttons stay ink. The new look only.
   At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const G = 'color:var\\(--color-neutral-400\\)';
const has = sel => assert.match(CSS, new RegExp('html\\.lg-new ' + sel + '[^{]*\\{' + G), sel);

test('the rest of the pages: the detail grey', () => {
  has(':is\\(\\.cun-sub,\\.cun-sub \\.hati-ref,td\\.cun-wait,\\.cun-st\\.is-none,\\.ikn-q,\\.apn-foot\\)');
  has(':is\\(\\.tpln-l,\\.tpl-hd-sub\\)');
  has('#cal-ag small');
  has(':is\\(\\.hb-cs,\\.hb-bh-s,\\.hb-bh-at,\\.hb-sk-note,\\.hb-sk-then,\\.hb-ag-lv-w\\)');
  has(':is\\(\\.mig-drop-s,\\.mig-opt-l\\)');
  has(':is\\(\\.pd2-ch-cap,\\.pd2-ch-r>i,\\.pd2-ch-door>span,\\.rfp-k,\\.rfp-cap\\)');
  has('#set-page :is\\(\\.stn-sub,\\.stn-pages-h\\)');
  assert.match(CSS, /html\.lg-new \.apn-panel \.apn-pr>b,html\.lg-new \.pd2-ch-r>span\{color:var\(--color-neutral-400\)\}/, 'every list panel\'s labels');
});
