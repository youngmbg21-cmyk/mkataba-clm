// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* Folders follow the FMCG value stream, from raw materials to market. */
const FOLDERS = {
  proc:  { id:'proc',  name:'Procurement & Raw Materials', ic:'leaf',      desc:'Ingredient, commodity and packaging supply into the plants.' },
  mfg:   { id:'mfg',   name:'Manufacturing & Production',  ic:'factory',   desc:'Co-packing, tolling and plant equipment agreements.' },
  dist:  { id:'dist',  name:'Warehousing & Distribution',  ic:'truck',     desc:'3PL warehousing, cold chain and primary distribution.' },
  sales: { id:'sales', name:'Sales & Route-to-Market',     ic:'store',     desc:'Distributor, modern-trade and e-commerce supply deals.' },
  mktg:  { id:'mktg',  name:'Marketing & Brand',           ic:'megaphone', desc:'Agency, media, activation and sponsorship contracts.' },
  corp:  { id:'corp',  name:'Corporate & Compliance',      ic:'briefcase', desc:'NDAs, leases, audit, legal and IT / professional services.' },
};
const TEMPLATES = {
  RM:{ id:'RM', name:'Raw Material Supply Agreement', kind:'Raw Material Supply', ic:'leaf', folder:'proc', valueType:'estimated', blurb:'Commodity & ingredient supply into the plants.' },
  PK:{ id:'PK', name:'Packaging Supply Agreement', kind:'Packaging Supply', ic:'box', folder:'proc', valueType:'estimated', blurb:'Bottles, cartons, films and labels.' },
  CM:{ id:'CM', name:'Contract Manufacturing (Co-Packing)', kind:'Contract Manufacturing', ic:'factory', folder:'mfg', valueType:'estimated', blurb:'Outsourced production & tolling.' },
  EQ:{ id:'EQ', name:'Equipment Lease & Maintenance', kind:'Equipment Lease', ic:'wrench', folder:'mfg', valueType:'fixed', blurb:'Plant machinery lease and servicing.' },
  WH:{ id:'WH', name:'Warehousing & Cold-Chain Agreement', kind:'Warehousing', ic:'box', folder:'dist', valueType:'fixed', blurb:'3PL storage and temperature-controlled space.' },
  FF:{ id:'FF', name:'Freight & Distribution Agreement', kind:'Distribution Logistics', ic:'truck', folder:'dist', valueType:'estimated', blurb:'Primary and last-mile distribution.' },
  DA:{ id:'DA', name:'Distributor Agreement', kind:'Distributor', ic:'cart', folder:'sales', valueType:'estimated', blurb:'Regional route-to-market distributor terms.' },
  RL:{ id:'RL', name:'Retail Listing & Supply Agreement', kind:'Retail Listing', ic:'store', folder:'sales', valueType:'estimated', blurb:'Modern-trade supermarket listing & supply.' },
  MK:{ id:'MK', name:'Marketing & Trade Promotion Services', kind:'Marketing Services', ic:'megaphone', folder:'mktg', valueType:'fixed', blurb:'Agency, media and activation services.' },
  ND:{ id:'ND', name:'Mutual Non-Disclosure Agreement', kind:'NDA', ic:'shield', folder:'corp', valueType:'none', blurb:'Confidentiality for NPD & vendor onboarding.' },
  LE:{ id:'LE', name:'Commercial Property Lease', kind:'Lease', ic:'building', folder:'corp', valueType:'fixed', blurb:'Office, depot and premises leases.' },
  PS:{ id:'PS', name:'Professional Services Agreement', kind:'Professional Services', ic:'briefcase', folder:'corp', valueType:'fixed', blurb:'Audit, legal and advisory retainers.' },
};
Object.assign(window,{FOLDERS,TEMPLATES});
