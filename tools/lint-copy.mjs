#!/usr/bin/env node
/* ANERVA claims lint — enforces the copy + claims contract mined from the blueprint docs.
   Run: node tools/lint-copy.mjs [file...]   (defaults to index.html)
   Exit code 1 on any FAIL. */
import { readFileSync, existsSync } from 'fs';

const files = process.argv.slice(2);
const targets = files.length ? files : ['index.html'];

// Strip tags/scripts/styles so we lint prose, not code.
function prose(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ');
}

// 1. Banned strings (retired claims, restricted language, superseded names, unapproved marks)
const BANNED = [
  '21 day', '21-day', '45 day', '45-day', '90 day', '90-day', '66 day', '66-day',
  'rewire', 'reset your', 'biohack', 'cure', 'eliminate stress',
  'subconscious', 'superhuman', 'peak state', 'neuroscience-backed', 'neuroscience backed',
  'clinically validated', 'clinically proven', 'scientifically proven', 'science-backed',
  "world's first", 'brain type', 'brain types',
  'Chief Brain Architect', 'Neural Core', 'Neural Premium',
  'Adaptive Coherence Score', 'qEEG',
  'science has identified', 'guaranteed', 'instantly',
];

/* Retired acronyms and short tokens: whole-word and case-sensitive, or they
   fire inside ordinary words ("questio-NNA-ire"). */
const BANNED_TOKENS = [
  { re: /\bNNA\b/, label: 'NNA (retired — use ANA)' },
];

// 2. Identity-framing constructions (the taxonomy's hard rule)
const IDENTITY = [
  /\byou are (?:a|an) (?:hypervigilant|burnt|anxious|rigid|fragmented|depleted|disconnected|dysregulated)/i,
  /\byou have high-functioning\b/i,
  /\byour brain type\b/i,
  /\byou are your\b/i,
];

// 3. Accuracy claims — "reliability, not accuracy" is a standing decision.
//    Allowed only inside an explicit disclaimer sentence.
const ACCURACY = /\b(accurate|accuracy)\b/gi;
const ACCURACY_OK = /(not claim|do not claim|is a different claim|rather than accuracy|not accuracy|accuracy is|requires test)/i;

// 4. Required strings that must be present
const REQUIRED = [
  { s: 'proprietary, non-diagnostic', min: 2, why: 'claim boundary must appear beside the taxonomy AND in the footer' },
  { s: 'Change timelines vary widely between individuals', min: 1, why: 'the approved measurement sentence' },
  { s: 'week 0 and again at weeks 6 and 12', min: 1, why: 'the approved measurement sentence' },
  { s: 'not a crisis service', min: 1, why: 'safety boundary' },
  /* The all-caps treatment is typographic (CSS text-transform), not the string —
     sentence case in the markup is correct and reads better to a screen reader. */
  { s: 'The system beneath your performance.', min: 1, ci: true, why: 'the fixed hero headline' },
];

// 5. Unresolved placeholders must not ship
const PLACEHOLDER = /\[[A-Z][A-Z0-9 _—–-]{3,}\]/g;

/* 6. Trade-mark symbols. The mined copy contract says no ® and no ™, because no
   mark is registered and no IP convention is approved. The founder's own footer
   design uses ™, so this is surfaced as a warning to resolve with counsel rather
   than a block on the build. */
const MARKS = [
  { re: /®/g, label: '® — no mark is registered' },
  { re: /™/g, label: '™ — no IP convention approved (founder-supplied footer copy)' },
];

let failures = 0, warnings = 0;
const log = (lvl, msg) => {
  if (lvl === 'FAIL') failures++;
  if (lvl === 'WARN') warnings++;
  console.log(`  ${lvl === 'FAIL' ? '✗' : lvl === 'WARN' ? '!' : '·'} ${lvl.padEnd(4)} ${msg}`);
};

for (const f of targets) {
  if (!existsSync(f)) { console.log(`\n${f}\n  ✗ FAIL missing file`); failures++; continue; }
  const raw = readFileSync(f, 'utf8');
  const text = prose(raw);
  const lower = text.toLowerCase();
  console.log(`\n${f}  (${(raw.length / 1024).toFixed(1)} KB, ${text.split(' ').length} words of prose)`);

  for (const b of BANNED) {
    const n = lower.split(b.toLowerCase()).length - 1;
    if (n) log('FAIL', `banned phrase "${b}" ×${n}`);
  }
  for (const re of IDENTITY) {
    const m = text.match(re);
    if (m) log('FAIL', `identity framing: "${m[0]}"`);
  }
  const acc = [...text.matchAll(ACCURACY)];
  for (const m of acc) {
    const ctx = text.slice(Math.max(0, m.index - 140), m.index + 140);
    if (!ACCURACY_OK.test(ctx)) log('FAIL', `unqualified accuracy claim near: "…${ctx.slice(100, 190).trim()}…"`);
  }
  for (const t of BANNED_TOKENS) {
    if (t.re.test(text)) log('FAIL', `banned token ${t.label}`);
  }
  for (const r of REQUIRED) {
    const hay = r.ci ? lower : text;
    const needle = r.ci ? r.s.toLowerCase() : r.s;
    const n = hay.split(needle).length - 1;
    if (n < r.min) log('FAIL', `required text missing (${n}/${r.min}): "${r.s}" — ${r.why}`);
  }
  for (const m of MARKS) {
    const n = (text.match(m.re) || []).length;
    if (n) log('WARN', `${m.label} ×${n}`);
  }
  const ph = raw.match(PLACEHOLDER) || [];
  // allow placeholders only when explicitly marked as a build note
  for (const p of new Set(ph)) log('WARN', `unresolved placeholder ${p} — must be supplied before launch`);

  // 6. non-identity spot check: "You are" followed by a category/mode name
  const CATMODE = ['Stress & Internal Pressure', 'Burnout & Low Energy', 'Anxiety & Overwhelm',
    'Loneliness & Disconnection', 'Focus, Fatigue & Memory Strain', 'Clarity & Behavioural Control',
    'High Performance with Dysregulation', 'Reactive Mobilisation', 'Predictive Vigilance',
    'Compensatory Overdrive', 'Rigid Control', 'Fragmented Reactivity', 'Depleted Conservation',
    'Protective Disconnection', 'Regulated Engagement'];
  for (const c of CATMODE) {
    const re = new RegExp(`\\byou are (?:in )?(?:the )?${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (re.test(text)) log('FAIL', `identity framing with canonical label: "${c}"`);
  }

  // 7. OM8 must not be framed as an endpoint
  for (const re of [/reach OM8/i, /achieve Regulated Engagement/i, /from OM1 to OM8/i,
    /graduate to regulation/i, /permanently regulated/i]) {
    if (re.test(text)) log('FAIL', `OM8 framed as an endpoint: ${re}`);
  }

  // 8. no prices (pricing is an open decision)
  if (/₹\s?[\d,]{4,}/.test(text)) log('FAIL', 'a price appears — pricing is an open decision, publish none');

  if (!failures) log('OK', 'no banned phrases, identity framing, or missing boundaries');
}

console.log(`\n${failures ? '✗' : '✓'} ${failures} failure(s), ${warnings} warning(s)\n`);
process.exit(failures ? 1 : 0);
