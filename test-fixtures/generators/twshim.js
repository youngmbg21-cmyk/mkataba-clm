// Stand-in for the Tailwind Play CDN, which this test environment's egress
// policy blocks (403 on CONNECT). Covers the layout-critical utilities the app
// actually uses so behaviour is testable; it is not a colour-accurate Tailwind.
const fs = require('fs');
const CLASSES = fs.existsSync('/home/user/mkataba-clm/index.html');

function css() {
  const out = [];
  const sp = { '0': '0px', 'px': '1px', '0.5': '2px', '1': '4px', '1.5': '6px', '2': '8px', '2.5': '10px', '3': '12px', '3.5': '14px', '4': '16px', '5': '20px', '6': '24px', '7': '28px', '8': '32px', '10': '40px', '12': '48px', '14': '56px', '16': '64px', '20': '80px', '24': '96px' };
  const esc = s => s.replace(/[.\/\[\]%():]/g, c => '\\' + c);
  for (const [k, v] of Object.entries(sp)) {
    out.push(`.p-${esc(k)}{padding:${v}}.px-${esc(k)}{padding-left:${v};padding-right:${v}}.py-${esc(k)}{padding-top:${v};padding-bottom:${v}}`);
    out.push(`.pt-${esc(k)}{padding-top:${v}}.pb-${esc(k)}{padding-bottom:${v}}.pl-${esc(k)}{padding-left:${v}}.pr-${esc(k)}{padding-right:${v}}`);
    out.push(`.m-${esc(k)}{margin:${v}}.mx-${esc(k)}{margin-left:${v};margin-right:${v}}.my-${esc(k)}{margin-top:${v};margin-bottom:${v}}`);
    out.push(`.mt-${esc(k)}{margin-top:${v}}.mb-${esc(k)}{margin-bottom:${v}}.ml-${esc(k)}{margin-left:${v}}.mr-${esc(k)}{margin-right:${v}}`);
    out.push(`.gap-${esc(k)}{gap:${v}}.gap-x-${esc(k)}{column-gap:${v}}.gap-y-${esc(k)}{row-gap:${v}}`);
    out.push(`.w-${esc(k)}{width:${v}}.h-${esc(k)}{height:${v}}.top-${esc(k)}{top:${v}}.right-${esc(k)}{right:${v}}.bottom-${esc(k)}{bottom:${v}}.left-${esc(k)}{left:${v}}`);
    out.push(`.space-y-${esc(k)}>*+*{margin-top:${v}}.space-x-${esc(k)}>*+*{margin-left:${v}}`);
  }
  out.push(`
.hidden{display:none!important}
.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.inline-flex{display:inline-flex}
.flex{display:flex}.grid{display:grid}.contents{display:contents}.table{display:table}
.flex-col{flex-direction:column}.flex-row{flex-direction:row}.flex-wrap{flex-wrap:wrap}.flex-nowrap{flex-wrap:nowrap}
.items-center{align-items:center}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.items-baseline{align-items:baseline}.items-stretch{align-items:stretch}
.justify-center{justify-content:center}.justify-between{justify-content:space-between}.justify-end{justify-content:flex-end}.justify-start{justify-content:flex-start}
.place-items-center{place-items:center}.self-center{align-self:center}.self-start{align-self:flex-start}
.flex-1{flex:1 1 0%}.flex-auto{flex:1 1 auto}.flex-none{flex:none}.shrink-0{flex-shrink:0}.grow{flex-grow:1}
.w-full{width:100%}.h-full{height:100%}.w-auto{width:auto}.min-w-0{min-width:0}.max-w-full{max-width:100%}
.w-screen{width:100vw}.h-screen{height:100vh}.min-h-screen{min-height:100vh}
.relative{position:relative}.absolute{position:absolute}.fixed{position:fixed}.sticky{position:sticky}.static{position:static}
.overflow-hidden{overflow:hidden}.overflow-auto{overflow:auto}.overflow-y-auto{overflow-y:auto}.overflow-x-auto{overflow-x:auto}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rounded{border-radius:4px}.rounded-sm{border-radius:2px}.rounded-md{border-radius:6px}.rounded-lg{border-radius:8px}.rounded-xl{border-radius:12px}.rounded-2xl{border-radius:16px}.rounded-full{border-radius:9999px}
.border{border-width:1px;border-style:solid}.border-0{border-width:0}.border-2{border-width:2px;border-style:solid}
.border-t{border-top-width:1px;border-top-style:solid}.border-b{border-bottom-width:1px;border-bottom-style:solid}
.border-l{border-left-width:1px;border-left-style:solid}.border-r{border-right-width:1px;border-right-style:solid}
.text-xs{font-size:12px;line-height:16px}.text-sm{font-size:14px;line-height:20px}.text-base{font-size:16px}.text-lg{font-size:18px}.text-xl{font-size:20px}.text-2xl{font-size:24px}.text-3xl{font-size:30px}
.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}.font-normal{font-weight:400}
.font-600{font-weight:600}.font-500{font-weight:500}.font-700{font-weight:700}
.font-mono{font-family:var(--font-mono,ui-monospace,monospace)}.font-display{font-family:var(--font-heading,inherit)}
.uppercase{text-transform:uppercase}.lowercase{text-transform:lowercase}.capitalize{text-transform:capitalize}
.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}
.cursor-pointer{cursor:pointer}.cursor-not-allowed{cursor:not-allowed}
.transition{transition:all .15s ease}.select-none{user-select:none}
.opacity-0{opacity:0}.opacity-50{opacity:.5}.opacity-60{opacity:.6}.opacity-70{opacity:.7}.opacity-100{opacity:1}
.bg-white{background:#fff}.bg-transparent{background:transparent}.bg-black{background:#000}
.text-white{color:#fff}.text-black{color:#000}
.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.grid-cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}.grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}
.ml-auto{margin-left:auto}.mr-auto{margin-right:auto}.mx-auto{margin-left:auto;margin-right:auto}
.whitespace-nowrap{white-space:nowrap}.whitespace-pre-wrap{white-space:pre-wrap}
.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-40{z-index:40}.z-50{z-index:50}
.shadow{box-shadow:0 1px 3px rgba(0,0,0,.1)}.shadow-lg{box-shadow:0 10px 15px rgba(0,0,0,.1)}.shadow-sm{box-shadow:0 1px 2px rgba(0,0,0,.05)}
.underline{text-decoration:underline}.no-underline{text-decoration:none}
.resize-none{resize:none}.appearance-none{appearance:none}
.pointer-events-none{pointer-events:none}
.leading-tight{line-height:1.25}.leading-snug{line-height:1.375}.leading-relaxed{line-height:1.625}
.tracking-wide{letter-spacing:.025em}.tracking-wider{letter-spacing:.05em}
.aspect-square{aspect-ratio:1/1}
.object-contain{object-fit:contain}.object-cover{object-fit:cover}
.list-none{list-style:none}.list-disc{list-style:disc}.list-decimal{list-style:decimal}
.first\\:mt-0:first-child{margin-top:0}
`);
  // arbitrary-value classes actually present in the source
  const src = ['/home/user/mkataba-clm/index.html'].concat(
    fs.readdirSync('/home/user/mkataba-clm/js').filter(f => f.endsWith('.js')).map(f => '/home/user/mkataba-clm/js/' + f),
    fs.readdirSync('/home/user/mkataba-clm/js/views').map(f => '/home/user/mkataba-clm/js/views/' + f)
  ).map(p => fs.readFileSync(p, 'utf8')).join('\n');
  const seen = new Set();
  const arb = /(?:^|[\s"'`])((?:text|w|h|min-w|max-w|min-h|max-h|p|px|py|pt|pb|pl|pr|m|mt|mb|ml|mr|gap|top|left|right|bottom|leading|tracking|basis)-\[[^\]"'`\s]+\])/g;
  let m;
  const prop = { text: 'font-size', w: 'width', h: 'height', 'min-w': 'min-width', 'max-w': 'max-width', 'min-h': 'min-height', 'max-h': 'max-height', p: 'padding', pt: 'padding-top', pb: 'padding-bottom', pl: 'padding-left', pr: 'padding-right', m: 'margin', mt: 'margin-top', mb: 'margin-bottom', ml: 'margin-left', mr: 'margin-right', gap: 'gap', top: 'top', left: 'left', right: 'right', bottom: 'bottom', leading: 'line-height', tracking: 'letter-spacing', basis: 'flex-basis' };
  while ((m = arb.exec(src))) {
    const cls = m[1]; if (seen.has(cls)) continue; seen.add(cls);
    const i = cls.indexOf('-['); const base = cls.slice(0, i); const val = cls.slice(i + 2, -1).replace(/_/g, ' ');
    const e = cls.replace(/[.\/\[\]%():#]/g, c => '\\' + c);
    if (base === 'px') out.push(`.${e}{padding-left:${val};padding-right:${val}}`);
    else if (base === 'py') out.push(`.${e}{padding-top:${val};padding-bottom:${val}}`);
    else if (prop[base]) out.push(`.${e}{${prop[base]}:${val}}`);
  }
  return out.join('\n');
}
module.exports = { css };
