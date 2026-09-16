/* A realistic Kenyan FMCG book for the review screenshots. */
const iso = d => new Date(d).toISOString().slice(0,10);
const day = n => { const d=new Date(); d.setDate(d.getDate()+n); return iso(d); };
const C = (id,name,cp,folder,value,status,tpl,expiryDays,extra={}) => ({
  id, name, counterparty:cp, folder, value, valueType: value?'estimated':'none',
  status, template:tpl, lastAction:'12 Sep 2026',
  expiry: expiryDays==null?null:day(expiryDays),
  hash:null, signedAt: status==='Signed'? day(-420):null,
  fields:{ value:String(value||'') },
  metadata:{ value, currency:'KES', expiryDate: expiryDays==null?null:day(expiryDays),
    effectiveDate: day(-420), paymentTerms: extra.pay||30, noticePeriodDays: extra.notice||90,
    category: extra.cat||null, renewalType: extra.renew||'auto', governingLaw:'Kenya' },
  comments:[], audit:[{at:new Date().toISOString(),user:'System',action:'Created',detail:'seed'}],
  signatures:[], obligations: extra.obl||[], rounds:[],
  owner:{ id:'u-admin', name:'Amina Otieno' },
});
const ob = (id,desc,dueDays,party,amount,assignee) => ({
  id, desc, due: day(dueDays), party, amount: amount||undefined,
  assignee: assignee||(party==='ours'?'Amina Otieno':undefined),
});
const CONTRACTS = [
  C('MK-101','Refined Sugar Supply','Kabras Sugar Ltd','proc',48000000,'Signed','RM',104,{pay:45,cat:'Raw Material Supply',obl:[
    ob('o1','Quarterly volume report',-6,'theirs'),
    ob('o2','Pay September invoice',12,'ours',4100000),
    ob('o3','Product liability insurance evidence',-2,'theirs'),
  ]}),
  C('MK-102','Raw Milk Collection','Nandi Hills Dairy','proc',36000000,'Under Review','RM',300,{pay:30}),
  C('MK-103','Palm Olein Supply','Bidco Africa','proc',62000000,'Signed','RM',28,{pay:60,cat:'Raw Material Supply',obl:[
    ob('o1','Monthly delivery schedule',9,'theirs'),
  ]}),
  C('MK-104','Carton & Label Supply','Chandaria Industries','proc',18400000,'Signed','PK',240,{pay:45}),
  C('MK-105','PET Preform Supply','Silafrica Kenya','proc',24500000,'Draft','PK',null,{}),
  C('MK-106','Co-Packing — Juice Line','Kevian Kenya','mfg',31000000,'Signed','CM',190,{pay:30,obl:[
    ob('o1','Monthly yield report',20,'theirs'),
  ]}),
  C('MK-107','Filling Line Lease','Krones East Africa','mfg',52000000,'Signed','EQ',520,{pay:30}),
  C('MK-108','Boiler Maintenance','Thermo Systems Ltd','mfg',6800000,'Under Review','EQ',160,{}),
  C('MK-109','Cold Chain Warehousing','Africa Logistics Properties','dist',29500000,'Signed','WH',64,{pay:45,obl:[
    ob('o1','Temperature compliance log',5,'theirs'),
    ob('o2','Quarterly storage fee',26,'ours',7300000),
  ]}),
  C('MK-110','Primary Distribution — Nairobi','Siginon Freight','dist',41000000,'Signed','FF',310,{pay:30,obl:[
    ob('o1','Service credit reconciliation',-11,'theirs',900000),
  ]}),
  C('MK-111','Last-Mile Distribution — Coast','Mombasa Haulage Co','dist',17800000,'Under Review','FF',420,{}),
  C('MK-112','Distributor Agreement — Western','Rift Valley Distributors','sales',54000000,'Signed','DA',86,{pay:21,obl:[
    ob('o1','Quarterly sell-out data',14,'theirs'),
  ]}),
  C('MK-113','Modern Trade Listing','Naivas Supermarkets','sales',85000000,'Signed','RL',45,{pay:60,cat:'Retail Listing',obl:[
    ob('o1','Listing fee — annual',33,'ours',3200000),
    ob('o2','Promotional calendar sign-off',-4,'theirs'),
  ]}),
  C('MK-114','Retail Supply — Quickmart','Quickmart Ltd','sales',63000000,'Under Review','RL',None=null,{pay:60}),
  C('MK-115','E-Commerce Supply','Jumia Kenya','sales',12600000,'Signed','RL',280,{pay:45}),
  C('MK-116','Distributor Agreement — Nyanza','Lake Basin Traders','sales',38000000,'Draft','DA',null,{}),
  C('MK-117','Trade Activation Services','Scanad Kenya','mktg',14500000,'Signed','MK',150,{pay:30}),
  C('MK-118','Media Buying Retainer','Ogilvy Africa','mktg',22000000,'Under Review','MK',365,{pay:30}),
  C('MK-119','Depot Lease — Industrial Area','Tatu City Ltd','corp',9600000,'Signed','LE',700,{pay:30}),
  C('MK-120','External Audit Retainer','PKF Kenya','corp',4800000,'Signed','PS',210,{pay:30}),
  C('MK-121','Mutual NDA — Flavour House','Givaudan East Africa','corp',0,'Signed','ND',430,{}),
  C('MK-122','Mutual NDA — Packaging Trial','Amcor Kenya','corp',0,'Draft','ND',null,{}),
];
module.exports = { CONTRACTS };
