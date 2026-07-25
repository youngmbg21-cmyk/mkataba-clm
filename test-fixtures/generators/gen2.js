const fs=require('fs'),path=require('path'),{build}=require('./mkpdf.js');
const OUT='/home/user/mkataba-clm/test-fixtures';
const BODY=fs.readFileSync(path.join(OUT,'plain-contract.txt'),'utf8').split('\n');
const pages=[]; for(let i=0;i<60;i++) pages.push(BODY.concat([`Page marker ${i+1} of 60`]));
let pdf=build({pages,producer:'HaTi fixture (large)'});
// pad past 4 MB with trailing filler after %%EOF (parsers read from startxref)
const need=4*1024*1024+300*1024-pdf.length;
const filler=Buffer.from('\n%'+'A'.repeat(Math.max(0,need)),'latin1');
fs.writeFileSync(path.join(OUT,'oversize-5mb.pdf'),Buffer.concat([pdf,filler]));
console.log((Buffer.concat([pdf,filler]).length/1048576).toFixed(2),'MB');
