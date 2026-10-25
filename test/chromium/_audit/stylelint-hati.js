/* HaTi's own design rules for Stylelint (owner, 24 Oct 2026: "add stylelint
   and build the report"). A measuring instrument, like its neighbours: it
   asserts nothing in CI, it lists what departs from the theme.

   The scales below are the theme's tokens in index.html `:root`
   (--ctl-h-sm 22 · --ctl-h 28 · a chosen tab 30 · --ctl-h-lg 32 · touch 44;
   --radius-sm 8 · --radius 10 · --radius-md 12 · --radius-lg 18;
   --t-figure 10 … --t-display 26). A value off the scale is a shape or a size
   no other part of HaTi wears — the class of fault the owner's screenshots
   show (a pill rounder and bigger than the rest, a scroll bar too thick). */
const stylelint = require('stylelint');

const RADII = new Set([0, 1, 2, 3, 4, 6, 8, 10, 12, 18]);
const FONT_PX = new Set([10, 11, 12, 13, 14, 16, 20, 26]);
const CONTROL_PX = new Set([22, 28, 30, 32, 44]);
const SCROLLBAR_MAX = 8;
const CONTROL_SEL = /(btn|button|pill|chip|tab|tag|badge|seg)\b/i;

const inRoot = decl => { for (let p = decl.parent; p; p = p.parent) if (p.selector && /:root/.test(p.selector)) return true; return false; };
const pxOf = v => { const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(v).trim()); return m ? +m[1] : null; };

const rule = (name, message, walk) => {
  const ruleName = 'hati/' + name;
  const messages = stylelint.utils.ruleMessages(ruleName, { bad: message });
  const fn = on => (root, result) => {
    if (!on) return;
    walk(root, (node, detail) => stylelint.utils.report({ ruleName, result, node, message: messages.bad(detail) }));
  };
  fn.ruleName = ruleName; fn.messages = messages;
  return stylelint.createPlugin(ruleName, fn);
};

const plugins = [
  rule('scrollbar-thick', d => `scroll bar ${d} — thicker than the theme's ${SCROLLBAR_MAX}px`, (root, bad) => {
    root.walkDecls(/^(width|height)$/, decl => {
      if (!/::-webkit-scrollbar(?![-\w])/.test(decl.parent.selector || '')) return;
      const px = pxOf(decl.value); if (px != null && px > SCROLLBAR_MAX) bad(decl, `${decl.prop} ${decl.value}`);
    });
  }),
  rule('radius-off-scale', d => `corner ${d} is off the theme's scale (8 · 10 · 12 · 18, or fully round)`, (root, bad) => {
    root.walkDecls(/^border(-(top|bottom)-(left|right))?-radius$/, decl => {
      if (inRoot(decl)) return;
      for (const part of decl.value.split(/[\s/]+/)) {
        const px = pxOf(part); if (px == null) continue;
        if (px >= 99) continue; /* fully round: a pill or a dot */
        if (!RADII.has(px)) { bad(decl, decl.value); return; }
      }
    });
  }),
  rule('font-off-scale', d => `text size ${d} is off the theme's scale (10 · 11 · 12 · 13 · 14 · 16 · 20 · 26)`, (root, bad) => {
    root.walkDecls('font-size', decl => {
      if (inRoot(decl)) return;
      const px = pxOf(decl.value); if (px != null && !FONT_PX.has(px)) bad(decl, decl.value);
    });
  }),
  rule('control-height-off-scale', d => `a control ${d} tall — off the theme's heights (22 · 28 · 30 · 32 · 44)`, (root, bad) => {
    root.walkDecls(/^(height|min-height)$/, decl => {
      if (inRoot(decl) || !CONTROL_SEL.test(decl.parent.selector || '')) return;
      if (/scrollbar|::(before|after)/.test(decl.parent.selector)) return;
      const px = pxOf(decl.value); if (px != null && px >= 18 && px <= 56 && !CONTROL_PX.has(px)) bad(decl, decl.value);
    });
  }),
];

const config = {
  plugins,
  rules: {
    'hati/scrollbar-thick': true,
    'hati/radius-off-scale': true,
    'hati/font-off-scale': true,
    'hati/control-height-off-scale': true,
    /* plain faults: a rule that silently does nothing */
    'declaration-block-no-duplicate-properties': [true, { ignore: ['consecutive-duplicates-with-different-values'] }],
    'declaration-block-no-shorthand-property-overrides': true,
    'property-no-unknown': [true, { ignoreProperties: ['/^-webkit-/', '/^-moz-/', 'text-wrap', 'field-sizing', 'interpolate-size', 'anchor-name', 'position-anchor'] }],
    'unit-no-unknown': true,
    'color-no-invalid-hex': true,
    'no-invalid-double-slash-comments': true,
    'block-no-empty': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'function-calc-no-unspaced-operator': true,
    'string-no-newline': true,
    'keyframe-declaration-no-important': true,
    /* CLAUDE.md: cascade fights are fixed by scope, never !important */
    'declaration-no-important': true,
  },
};

module.exports = { config, RADII, FONT_PX, CONTROL_PX, SCROLLBAR_MAX };
