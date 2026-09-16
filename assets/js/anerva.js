import { mountRingField } from './ring-field.js';
import { mountDomainLoop, mountRail } from './domain-loop.js';
import { mountPhaseLadder } from './phase-ladder.js';
/* ANERVA — interaction layer.
   No framework, no build step. Everything degrades to readable HTML. */

/* Capture mode: `?y=<px>` skips the opening and settles every reveal, so
   headless screenshots of any section are deterministic. Inert without it. */
const CAPTURE_Y = new URLSearchParams(location.search).get('y');
if (CAPTURE_Y !== null) { try { sessionStorage.setItem('anerva:seen', '1'); } catch {} }

/* ═══════════════════════ reference data ═══════════════════════
   Canonical labels (Phase 08 Appendix A). Descriptions written to the
   non-identity rule ("operating in", never "is") and the non-diagnostic rule. */

const CATEGORIES = [
  { code:'C1', name:'Stress & Internal Pressure',
    quote:'I am carrying too much, I cannot fully switch off, and even ordinary demands feel as if they must be handled immediately.',
    desc:'For when demand keeps arriving faster than recovery does, and pausing stops feeling like something that is allowed.',
    toward:'Stability and recovery under ordinary demand' },
  { code:'C2', name:'Burnout & Low Energy',
    quote:'I can still function, but everything costs more than it used to — and recovery no longer restores me reliably.',
    desc:'For when the work still gets done but everything costs more than it used to, and rest no longer reliably restores.',
    toward:'Resource availability and sustainable re-engagement' },
  { code:'C3', name:'Anxiety & Overwhelm',
    quote:'My mind and body move into alarm faster than I can organise what is actually happening.',
    desc:'For when the system moves into alarm faster than the situation can be organised, and uncertainty becomes hard to hold.',
    toward:'Earlier detection, choice and workable recovery' },
  { code:'C4', name:'Loneliness & Disconnection',
    quote:'I may be surrounded by people and still feel unheld, ungrounded or unable to be fully present with myself or others.',
    desc:'For when connection is available on paper but not felt — to other people, or to yourself.',
    toward:'Connected engagement without loss of self' },
  { code:'C5', name:'Focus, Fatigue & Memory Strain',
    quote:'My capability is present, but attention and mental continuity are unreliable; I lose the thread faster than I should.',
    desc:'For when the capability is intact but attention and mental continuity are unreliable, and the thread goes sooner than it should.',
    toward:'Usable attention and cognitive continuity' },
  { code:'C6', name:'Clarity & Behavioural Control',
    quote:'I understand more than I can consistently act upon; my decisions, impulses or avoidance keep overriding what I know matters.',
    desc:'For when what you understand and what you consistently do keep drifting apart under pressure.',
    toward:'Self-directed decision and action' },
  { code:'C7', name:'High Performance with Dysregulation',
    quote:'I can produce at a high level, but the way I access performance is becoming costly, brittle or unsustainable.',
    desc:'For when the output stays high while the way it is produced becomes costly, brittle, or dependent on constant activation.',
    toward:'Performance that is recoverable and not activation-dependent' },
];

const MODES = [
  { code:'OM1', name:'Reactive Mobilisation', verbs:['Urgency','Confrontation','Escape','Rapid action'],
    desc:'A configuration in which a cue is met with rapid activation and immediate protective action, before there is time to weigh the response.' },
  { code:'OM2', name:'Predictive Vigilance', verbs:['Scanning','Checking','Rehearsal','Reassurance'],
    desc:'A configuration organised around anticipating what might go wrong, so attention stays committed to monitoring rather than to the present demand.' },
  { code:'OM3', name:'Compensatory Overdrive', verbs:['Push','Perform','Postpone recovery'],
    desc:'A configuration in which output is protected by spending more effort, urgency and stimulation than the available resource can sustain.' },
  { code:'OM4', name:'Rigid Control', verbs:['Suppress','Perfect','Control','Prevent'],
    desc:'A configuration that holds things predictable by narrowing what is permitted — in emotion, in behaviour, in standards, in how much uncertainty can be tolerated.' },
  { code:'OM5', name:'Fragmented Reactivity', verbs:['Switch','Scatter','Restart','Lose thread'],
    desc:'A configuration in which competing signals break the continuity of attention, energy and action, so work happens in bursts rather than in threads.' },
  { code:'OM6', name:'Depleted Conservation', verbs:['Slow','Postpone','Minimise','Preserve'],
    desc:'A configuration that lowers output and initiation to protect a resource the system has learned it cannot reliably replace.' },
  { code:'OM7', name:'Protective Disconnection', verbs:['Withdraw','Numb','Detach','Avoid'],
    desc:'A configuration in which engagement steps back — emotionally, relationally or bodily — to keep the cost of contact within what feels survivable.' },
  { code:'OM8', name:'Regulated Engagement', verbs:['Notice','Choose','Act','Recover'], reference:true,
    desc:'The reference configuration: activation, resource and action stay flexible enough for the demand in front of you, and recovery after disruption is workable.',
    note:'A reference mode, not a finish line. It is what a system returns to more often and more easily — not a state it is meant to hold permanently. Regulation is not calmness: anger, urgency, exertion, grief and withdrawal can all be regulated.' },
];

const LAYERS = [
  { name:'Nervous System Regulation', line:'Whether activation can rise for a real demand and come down again afterwards.' },
  { name:'Bioenergetic Regulation', line:'Whether there is usable energy, and whether rest actually restores it.' },
  { name:'Cognitive–Behavioural Regulation', line:'Whether interpretation, decision and action stay aligned once pressure, emotion or fatigue arrives.' },
  { name:'State Integration', line:'Whether capacity holds together across contexts — work, relationships, solitude, recovery — rather than only in the protected ones.' },
];

const PHASES = [
  { id:'Phase 0', name:'Pre-entry: Safety + Baseline', core:true, premium:true },
  { id:'Phase 1', name:'Map the Pattern', core:true, premium:true },
  { id:'Phase 2', name:'Stabilise the System', core:true, premium:true },
  { id:'Phase 3', name:'Interrupt the Old Response', core:true, premium:true },
  { id:'Phase 4', name:'Install the New Response', note:'bridge and maintenance in Core', core:true, premium:true },
  { id:'Phase 5', name:'Test in Real Life', core:false, premium:true },
  { id:'Phase 6', name:'Stabilise the Identity', core:false, premium:true },
  { id:'Phase M', name:'Adaptive Coherence', core:false, premium:true },
];

const CONTEXTS = ['work','relationship','solitude','health & body','decision','uncertainty','recovery'];

const EVIDENCE = [
  { name:'Unresolved', line:'Information is missing, contradictory, or unsafe to interpret.' },
  { name:'Provisional', line:'One clear example supports the hypothesis, but repeatability is not established.' },
  { name:'Supported', line:'Demonstrated through repeated examples and at least two evidence streams, with contradictions recorded.' },
];

const METHOD = [
  { n:'01', t:'You answer.', b:'A structured questionnaire. Consent first, questions second.' },
  { n:'02', t:'A deterministic sheet scores it.', b:'Fixed weights, fixed arithmetic. The same answers always produce the same result. That is reliability, and reliability is a smaller word than accuracy for a reason.' },
  { n:'03', t:'The architect reviews, confirms or revises.', b:'The scoring sheet proposes a ranked hypothesis. A human turns it into an assignment, or overrules it and records why.' },
  { n:'04', t:'Two conversations reach what the form cannot.', b:'Roughly an hour each, over two weeks. The questionnaire reaches your primary and secondary categories and your dominant mode. Only the conversation reaches the tertiary layers, the adaptive meaning, and the context.' },
  { n:'05', t:'Two documents are issued.', b:'One written for you. One written for the architect. The same record, rendered twice.' },
  { n:'06', t:'If you enrol, the weekly loop begins.', b:'Weekly protocols, daily check-ins, and a review that changes next week’s plan.' },
];

/* ═══════════════════════ helpers ═══════════════════════ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k) n.append(k);
  return n;
};

/* ═══════════════════════ 1 · the opening ═══════════════════════
   Beat 1  the mark opens as a window onto the film
   Beat 2  the window expands until the film is absorbed by the frame
   Beat 3  the chrome and the headline arrive
   Skippable by click, key or scroll. Runs once per session. */
const OPENING = (() => {
  const hero = $('#hero');
  if (!hero) return { done: Promise.resolve() };

  let seen = false;
  try { seen = sessionStorage.getItem('anerva:seen') === '1'; } catch {}
  // ?nointro skips the opening — used for screenshots and visual regression runs
  if (location.search.includes('nointro')) seen = true;

  if (reduced.matches || seen) {
    hero.dataset.intro = 'done';
    document.body.dataset.opened = 'true';
    return { done: Promise.resolve() };
  }
  try { sessionStorage.setItem('anerva:seen', '1'); } catch {}

  // the opening always begins at the top: the browser restores scroll on reload,
  // which would otherwise run the aperture over a mid-page view.
  try { history.scrollRestoration = 'manual'; } catch {}
  scrollTo(0, 0);
  document.body.style.overflow = 'hidden';
  hero.dataset.intro = 'opening';

  let finished = false;
  let resolve;
  const done = new Promise(r => { resolve = r; });

  const finish = () => {
    if (finished) return;
    finished = true;
    hero.dataset.intro = 'done';
    document.body.dataset.opened = 'true';
    document.body.style.overflow = '';
    removeEventListener('pointerdown', skip);
    removeEventListener('keydown', skip);
    removeEventListener('wheel', skip);
    resolve();
  };
  const skip = () => { hero.dataset.intro = 'running'; setTimeout(finish, 260); };

  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
  addEventListener('wheel', skip, { once: true, passive: true });

  // 0–780ms the window opens · 780–1600 it holds, so the film reads · 1600–3050 it is absorbed
  setTimeout(() => { if (!finished) hero.dataset.intro = 'running'; }, 1600);
  setTimeout(finish, 3050);
  return { done };
})();

/* ═══════════════════════ 2 · the film ═══════════════════════ */
(() => {
  const video = $('#heroVideo'), btn = $('#filmBtn'), bar = $('#filmBar'), msg = $('#filmMsg');
  if (!video) return;
  // In capture mode the poster stands in for the film: a looping <video> never
  // settles, which stalls headless Chrome's virtual clock and yields blank frames.
  if (CAPTURE_Y !== null) return;

  const pickSize = () => {
    const w = innerWidth * (devicePixelRatio > 1.5 ? 1.5 : 1);
    return w <= 760 ? '540' : w <= 1400 ? '720' : '1080';
  };

  let loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    const size = pickSize();
    const canWebm = video.canPlayType('video/webm; codecs="vp9"');
    for (const [type, src] of canWebm
      ? [['video/webm', `assets/film/anerva-hero-${size}.webm`], ['video/mp4', `assets/film/anerva-hero-${size}.mp4`]]
      : [['video/mp4', `assets/film/anerva-hero-${size}.mp4`]]) {
      video.append(el('source', { src, type }));
    }
    video.load();
    // The film opens on a dark frame. Start it where the light is already
    // crossing the face, so the mark-window in the opening reads as luminous.
    video.addEventListener('loadedmetadata', () => {
      if (video.currentTime < 0.1 && Number.isFinite(video.duration)) {
        try { video.currentTime = Math.min(5.9, video.duration - 0.2); } catch {}
      }
    }, { once: true });
  }

  let wants = !reduced.matches, visible = true, token = 0;

  async function sync() {
    const mine = ++token;
    if (!wants || document.hidden || !visible) { video.pause(); return; }
    load();
    try {
      await video.play();
    } catch (err) {
      if (mine !== token || err.name === 'AbortError') return;
      wants = false;
      if (msg && err.name === 'NotAllowedError') msg.textContent = 'Press play';
      paint();
      return;
    }
    // a newer sync() now owns the element — never let a stale call pause it
    if (mine !== token) return;
    if (!wants || document.hidden || !visible) video.pause();
    else if (msg) msg.textContent = '';
  }
  function paint() {
    const playing = !video.paused && !video.ended;
    btn?.setAttribute('aria-pressed', String(playing));
    btn?.setAttribute('aria-label', playing ? 'Pause the background film' : 'Play the background film');
  }

  video.addEventListener('playing', () => { video.dataset.ready = 'true'; paint(); });
  // the opening depends on the film moving inside the mark, so kick it once it can play
  video.addEventListener('loadeddata', () => { if (wants && visible && video.paused) sync(); });
  video.addEventListener('canplay',    () => { if (wants && visible && video.paused) sync(); });
  video.addEventListener('pause', paint);
  video.addEventListener('timeupdate', () => {
    if (bar && video.duration) bar.style.setProperty('--p', (video.currentTime / video.duration * 100) + '%');
  });
  video.addEventListener('error', () => {
    wants = false; loaded = false;
    delete video.dataset.ready;
    if (msg) msg.textContent = 'Film unavailable';
    paint();
  });
  btn?.addEventListener('click', () => { wants = video.paused; sync(); });
  document.addEventListener('visibilitychange', sync);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0 })
    .observe($('#hero'));

  reduced.addEventListener('change', () => { if (reduced.matches) { wants = false; sync(); } });
  sync();
})();

/* ═══════════════════════ 3 · the signal layer ═══════════════════════ */
(() => {
  const cv = $('#heroSignal'); if (!cv) return;
  const ctx = cv.getContext('2d', { alpha: true }); if (!ctx) return;
  const hero = $('#hero');
  let w = 0, h = 0, raf = 0, t = 0, last = 0, visible = true;
  const ptr = { x: .72, y: .46, tx: .72, ty: .46, on: false };

  function size() {
    const r = hero.getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!raf) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const amp = h * 0.030;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0.00, 'rgba(84,174,231,0)');
    g.addColorStop(0.34, 'rgba(84,174,231,.05)');
    g.addColorStop(0.60, 'rgba(142,211,248,.26)');
    g.addColorStop(0.82, 'rgba(214,166,183,.24)');
    g.addColorStop(1.00, 'rgba(159,164,218,.05)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.75;
    const bend = ptr.on ? (ptr.y - .5) * h * .07 : 0;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      for (let x = 0; x <= w + 6; x += 6) {
        const u = x / w;
        const y = h * (.44 + i * .0135)
          + Math.sin(u * 5.1 + t + i * .16) * amp
          + Math.sin(u * 2.6 - t * .58 + .7) * amp * 1.7
          + Math.exp(-Math.pow((u - ptr.x) * 4.6, 2)) * bend;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    t += dt * .078;
    ptr.x += (ptr.tx - ptr.x) * .04;
    ptr.y += (ptr.ty - ptr.y) * .04;
    draw();
    raf = requestAnimationFrame(tick);
  }
  function run() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (document.hidden || !visible || reduced.matches) { draw(); return; }
    raf = requestAnimationFrame(tick);
  }

  hero.addEventListener('pointermove', e => {
    if (reduced.matches) return;
    const r = hero.getBoundingClientRect();
    ptr.tx = (e.clientX - r.left) / r.width;
    ptr.ty = (e.clientY - r.top) / r.height;
    ptr.on = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.on = false; ptr.tx = .72; ptr.ty = .46; }, { passive: true });

  new ResizeObserver(size).observe(hero);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', run);
  reduced.addEventListener('change', run);
  size(); run();
})();

/* ═══════════════════════ 4 · scroll reveal ═══════════════════════
   Exposed as a function because several sections are rendered from data further
   down this file; anything created later must still be handed to the observer. */
let observeRise = () => {};
(() => {
  const SEL = '.rise, .drawline, .thread__list, .seam';
  if (reduced.matches) {
    observeRise = (root = document) => $$(SEL, root).forEach(n => { n.dataset.in = 'true'; });
    observeRise();
  } else {
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) { e.target.dataset.in = 'true'; io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    observeRise = (root = document) => $$(SEL, root).forEach(n => {
      if (n.dataset.in !== 'true') io.observe(n);
    });
    observeRise();
  }
  // Light bands wipe in slightly earlier, so the sheet has landed before the type reads.
  const bands = $$('.lite, .paper');
  if (!bands.length) return;
  if (reduced.matches) { bands.forEach(n => n.dataset.in = 'true'); return; }
  const bio = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.dataset.in = 'true'; bio.unobserve(e.target); }
  }, { rootMargin: '10% 0px -4% 0px', threshold: 0 });
  bands.forEach(n => bio.observe(n));
})();

/* ═══════════════════════ 4b · the rail ═══════════════════════
   Chapter, elapsed film, hold state, and the honesty telemetry.
   The progress line is filled by film consumed, not by scroll percent. */
(() => {
  const chapters = [
    { id: 'top',         n: '00', name: 'Hero' },
    { id: 'pattern',     n: '01', name: 'The pattern' },
    { id: 'framework',   n: '02', name: 'The framework' },
    { id: 'method',      n: '03', name: 'The method' },
    { id: 'pathways',    n: '04', name: 'The pathways' },
    { id: 'measurement', n: '05', name: 'What we know' },
    { id: 'founder',     n: '06', name: 'The founder' },
    { id: 'begin',       n: '07', name: 'Begin' },
  ];
  const chEl = $('#railCh'), nameEl = $('#railName'), timeEl = $('#railTime'),
        holdEl = $('#railHold'), progEl = $('#railProg'), topEl = $('#railTop'),
        chipEl = $('#railChip'), nav = $('#nav'), video = $('#heroVideo'), tele = $('#railTele');

  // renumber against the sections that actually exist, so trimming the page
  // never leaves the rail counting chapters that are no longer there
  const nodes = chapters
    .map(c => ({ ...c, el: document.getElementById(c.id) }))
    .filter(c => c.el)
    .map((c, i) => ({ ...c, n: String(i + 1).padStart(2, '0') }));
  let current = -1;

  function frame() {
    // which chapter owns the middle of the viewport
    const mid = innerHeight * 0.42;
    let i = 0;
    for (let k = 0; k < nodes.length; k++) {
      if (nodes[k].el.getBoundingClientRect().top <= mid) i = k;
    }
    if (i !== current) {
      current = i;
      const c = nodes[i];
      if (chEl) chEl.textContent = c.n;
      if (nameEl) nameEl.textContent = c.name;
      if (chipEl) chipEl.textContent = `${c.n} / ${String(nodes.length).padStart(2, "0")}`;
      // the instrument goes quiet for the positioning band
      if (tele) tele.style.opacity = c.id === 'framework' ? '1' : '';
    }

    // film consumed
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      const p = (video.currentTime / video.duration) * 100;
      progEl && (progEl.style.blockSize = p.toFixed(1) + '%');
      timeEl && (timeEl.textContent = `${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`);
      holdEl && holdEl.setAttribute('data-on', String(video.paused));
      holdEl && (holdEl.textContent = video.paused ? 'Hold' : 'Run');
    }

    // page progress on the collapsed rail
    const max = document.documentElement.scrollHeight - innerHeight;
    topEl && topEl.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : '0');

    // is the nav floating over a light band?
    if (nav) {
      const r = nav.getBoundingClientRect();
      const probe = document.elementsFromPoint(r.left + r.width / 2, r.bottom + 10) || [];
      const light = probe.some(n => n.classList && (n.classList.contains('lite') || n.classList.contains('paper')));
      nav.setAttribute('data-over', light ? 'light' : 'dark');
    }
    ticking = false;
  }

  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  video?.addEventListener('timeupdate', request);
  video?.addEventListener('pause', request);
  video?.addEventListener('play', request);
  frame();
})();

/* ═══════════════════════ 5 · nav ═══════════════════════ */
(() => {
  const nav = $('#nav');
  const sentinel = $('#top');
  if (nav && sentinel) {
    new IntersectionObserver(([e]) => { nav.dataset.stuck = String(!e.isIntersecting); },
      { rootMargin: '-80px 0px 0px 0px' }).observe(sentinel);
  }
  // scrollspy
  const links = $$('.nav__links a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (secs.length) {
    const spy = new IntersectionObserver(es => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        links.forEach(a => a.setAttribute('aria-current',
          String(a.getAttribute('href') === '#' + e.target.id)));
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => spy.observe(s));
  }
  // menu
  const btn = $('#menuBtn'), menu = $('#menu');
  if (btn && menu) {
    const set = open => {
      btn.setAttribute('aria-expanded', String(open));
      menu.dataset.open = String(open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    btn.addEventListener('click', () => set(menu.dataset.open !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.dataset.open === 'true') { set(false); btn.focus(); } });
  }
})();

/* ═══════════════════════ 6 · categories ═══════════════════════ */
(() => {
  const host = $('#cats'); if (!host) return;
  CATEGORIES.forEach((c, i) => {
    const pid = `cat-p-${c.code}`;
    const btn = el('button', {
      class: 'cat__btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': pid,
      onclick() {
        const open = this.getAttribute('aria-expanded') === 'true';
        $$('.cat__btn', host).forEach(b => b.setAttribute('aria-expanded', 'false'));
        this.setAttribute('aria-expanded', String(!open));
      },
    },
      el('span', { class: 'cat__code mono', text: c.code }),
      el('span', { class: 'cat__name', text: c.name }),
      el('span', { class: 'cat__plus', 'aria-hidden': 'true' }));
    const panel = el('div', { class: 'cat__panel', id: pid },
      el('div', { class: 'cat__panelinner' },
        el('div', { class: 'cat__wrap' },
          el('p', { class: 'cat__quote', text: '“' + c.quote + '”' }),
          el('p', { class: 'cat__desc', text: c.desc }),
          el('p', { class: 'cat__toward' }, el('b', { text: 'Works toward' }), el('span', { text: c.toward })))));
    host.append(el('div', { class: 'cat', style: `--i:${i}` }, btn, panel));
  });
})();

/* ═══════════════════════ 7 · the mode field ═══════════════════════ */
(() => {
  const ring = $('#ring'), card = $('#modecard');
  if (!ring || !card) return;

  let active = 2; // OM3 — a configuration many visitors recognise

  // 8 nodes on a circle: a set, with no first and no last.
  const R = 38;
  MODES.forEach((m, i) => {
    const a = (i / MODES.length) * Math.PI * 2 - Math.PI / 2;
    const node = el('button', {
      class: 'ring__node', type: 'button', 'aria-pressed': 'false',
      'data-ref': m.reference ? 'true' : null,
      style: `--x:${(Math.cos(a) * R).toFixed(2)}cqi;--y:${(Math.sin(a) * R).toFixed(2)}cqi;--n:${i}`,
      title: m.name,
      onclick: () => { active = i; render(); },
    },
      el('span', { class: 'ring__dot', 'aria-hidden': 'true' }),
      el('span', { class: 'ring__code mono', text: m.code }),
      el('span', { class: 'sr-only', text: m.name }));
    ring.append(node);
  });

  mountRingField(ring, MODES.length);

  function render() {
    const m = MODES[active];
    $$('.ring__node', ring).forEach((n, i) => n.setAttribute('aria-pressed', String(i === active)));
    card.replaceChildren(...[
      el('p', { class: 'modecard__code mono', text: m.code }),
      el('h4', { class: 'modecard__name', text: m.name }),
      el('p', { class: 'modecard__desc', text: m.desc }),
      el('div', { class: 'modecard__verbs' }, m.verbs.map(v => el('span', { text: v }))),
      el('p', { class: 'modecard__ctx' },
        el('span', { text: 'A mode is always read against a context — work, relationship, solitude, recovery. The same person may run a different configuration at work and in solitude.' })),
      m.note ? el('p', { class: 'modecard__ref', text: m.note }) : null,
    ].filter(Boolean));
  }
  render();
})();

/* ═══════════════════════ 8 · the formulation instrument ═══════════════════════ */
(() => {
  const dials = $('#dials'), out = $('#readSentence'), count = $('#readCount');
  if (!dials || !out) return;

  const state = { cat: 6, mode: 2, layer: 1, phase: 1 };
  const DIALS = [
    { key: 'cat',   label: 'Entry category', opts: CATEGORIES.map(c => c.name), codes: CATEGORIES.map(c => c.code) },
    { key: 'mode',  label: 'Operating mode', opts: MODES.map(m => m.name),      codes: MODES.map(m => m.code) },
    { key: 'layer', label: 'Bottleneck layer', opts: LAYERS.map(l => l.name),   codes: LAYERS.map(() => '') },
    { key: 'phase', label: 'Phase',          opts: PHASES.map(p => p.name),     codes: PHASES.map(p => p.id) },
  ];

  DIALS.forEach(d => {
    const readout = el('i', { text: d.codes[state[d.key]] || '' });
    const opts = el('div', { class: 'dial__opts' },
      d.opts.map((o, i) => el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(i === state[d.key]), text: o,
        onclick() {
          state[d.key] = i;
          $$('.chip', opts).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
          readout.textContent = d.codes[i] || '';
          render(d.key);
        },
      })));
    dials.append(el('div', { class: 'dial' },
      el('p', { class: 'dial__label' }, el('span', { text: d.label }), readout), opts));
  });

  function render(changed) {
    const c = CATEGORIES[state.cat], m = MODES[state.mode],
          l = LAYERS[state.layer], p = PHASES[state.phase];
    const mk = (t, on) => el('mark', { text: t, 'data-flash': on ? 'true' : null });
    out.replaceChildren(
      el('span', { text: 'A person may enter through ' }), mk(c.name, changed === 'cat'),
      el('span', { text: ', operate in ' }),               mk(m.name, changed === 'mode'),
      el('span', { text: ', show a ' }),                   mk(l.name, changed === 'layer'),
      el('span', { text: ' bottleneck, remain in ' }),     mk(p.id + ' · ' + p.name, changed === 'phase'),
      el('span', { text: ', and still be appropriate for ANA Core. No label in that sentence substitutes for another.' }),
    );
    if (changed && !reduced.matches) {
      setTimeout(() => $$('mark[data-flash]', out).forEach(n => n.removeAttribute('data-flash')), 700);
    }
  }
  render();

  // count up to 2,072 once, when the readout first enters view
  if (count && !reduced.matches) {
    const target = 2072;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        count.textContent = Math.round(target * eased).toLocaleString('en-IN');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .4 });
    io.observe(count);
  }
})();

/* ═══════════════════════ 9 · static renders ═══════════════════════ */
(() => {
  const mg = $('#methodGrid');
  if (mg) METHOD.forEach((s, i) => mg.append(el('article', { class: 'step rise', style: `--i:${i % 3}` },
    el('p', { class: 'step__n mono', text: s.n }),
    el('h3', { class: 'step__t', text: s.t }),
    el('p', { class: 'step__b', text: s.b }))));

  mountPhaseLadder($('#phases'), PHASES, el);

  const ev = $('#evidence');
  if (ev) EVIDENCE.forEach(e => ev.append(el('div', {},
    el('b', { text: e.name }), el('p', { text: e.line }))));
})();

/* Everything rendered from data above exists now — hand it to the observer. */
observeRise();

/* Capture mode, part two: settle every reveal and hold the requested offset, so a
   screenshot of any section is deterministic. Inert without `?y=`. */
if (CAPTURE_Y !== null) {
  const go = () => {
    $$('.rise, .seam, .lite, .paper, .thread__list').forEach(n => { n.dataset.in = 'true'; });
    document.body.style.overflow = '';
    const hero = $('#hero'); if (hero) hero.dataset.intro = 'done';
    scrollTo(0, Number(CAPTURE_Y));
  };
  go();
  addEventListener('load', go);
  document.fonts?.ready.then(go);
  for (const t of [200, 700, 1500]) setTimeout(go, t);
}

/* ═══════════════════════ 10 · CTAs awaiting a destination ═══════════════════════ */
(() => {
  const note = $('#ctaNote');
  $$('[data-needs-destination]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (!note) return;
    note.textContent = 'The assessment link is not connected in this preview. Supply the questionnaire URL and this button will point to it.';
    note.style.color = 'var(--rose-400)';
    note.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
  }));
})();

/* ═══════════════════════ 11 · smooth in-page nav ═══════════════════════ */
addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.hasAttribute('data-needs-destination')) return;
  const id = a.getAttribute('href');
  if (id === '#' || id === '#begin' && a.hasAttribute('data-needs-destination')) return;
  const t = id.length > 1 && $(id);
  if (!t) return;
  e.preventDefault();
  t.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', id);
});


/* ═══════════════════════ 12 · the Figma sections ═══════════════════════ */
mountDomainLoop($('#loopStage'), $('#loopRead'));
mountRail($('#signalRail'), $$('[data-rail]'));


/* ═══════════════════════ dev · isolate a section for capture ═══════════════════════
   ?only=<section-id> hides every other section so a screenshot of that one
   composites the fixed chrome correctly. Review affordance; harmless in prod. */
(() => {
  const only = new URLSearchParams(location.search).get('only');
  if (!only) return;
  document.querySelectorAll('main > section').forEach(sec => {
    if (sec.id !== only) sec.style.display = 'none';
  });
  document.querySelectorAll('.rise').forEach(n => { n.dataset.in = 'true'; });
  const paper = document.querySelector('.paper');
  if (paper) paper.dataset.in = 'true';
  dispatchEvent(new Event('resize'));
})();
