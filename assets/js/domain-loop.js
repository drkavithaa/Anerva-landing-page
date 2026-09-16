/* ANERVA — the Four Functional Domains loop.
 *
 * The Figma draws a closed circuit with four labelled domains around a neural
 * core. It is a LOOP, not a ladder and not a funnel: the headline is "a closed
 * feedback loop, not four services", so nothing here may read as a sequence
 * with a start and a finish. The travelling pulse runs continuously and the
 * ring has no visible beginning.
 *
 * Domain names are the canonical four functional layers (Phase 08 §09),
 * carrying the Figma's numbering and its "Bioenergetic Stability" wording.
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const DOMAINS = [
  { n: '1', name: 'Bioenergetic Stability',
    body: 'Whether there is usable energy, and whether rest actually restores it.' },
  { n: '2', name: 'Nervous System Regulation',
    body: 'Whether activation can rise for a real demand and come down again afterwards.' },
  { n: '3', name: 'Cognitive & Behavioural Regulation',
    body: 'Whether interpretation, decision and action stay aligned once pressure, emotion or fatigue arrives.' },
  { n: '4', name: 'State Integration',
    body: 'Whether capacity holds together across contexts — work, relationships, solitude, recovery — rather than only in the protected ones.' },
];

export function mountDomainLoop(stage, read) {
  if (!stage || !read) return;
  const cv = stage.querySelector('#loopCanvas');
  const ctx = cv && cv.getContext('2d');

  let active = 0;

  // four nodes: top, right, bottom, left — a circuit, with no first and no last
  const R = 42; // % of the stage, matching the canvas ring
  DOMAINS.forEach((d, i) => {
    const a = (i / DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
    const btn = document.createElement('button');
    btn.className = 'loop__node';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(i === 0));
    btn.style.cssText = `--x:${(Math.cos(a) * R).toFixed(2)}cqi;--y:${(Math.sin(a) * R).toFixed(2)}cqi`;
    btn.innerHTML = `<i>${d.n}.</i><span></span>`;
    btn.querySelector('span').textContent = d.name;
    btn.addEventListener('click', () => { active = i; render(); });
    stage.append(btn);
  });

  function render() {
    stage.querySelectorAll('.loop__node').forEach((n, i) =>
      n.setAttribute('aria-pressed', String(i === active)));
    const d = DOMAINS[active];
    read.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: `${d.n}. ${d.name}` }),
      Object.assign(document.createElement('p'), { textContent: d.body }),
    );
  }
  render();

  if (!ctx) return;

  let w = 0, h = 0, raf = 0, t = 0, last = 0, seen = true;

  function size() {
    const r = cv.getBoundingClientRect();
    w = r.width; h = r.height;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!raf) draw();
  }

  // a small neural cluster at the core — drawn, not a stock brain
  const CELLS = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 * 3.1;
    const r = 0.16 + ((i * 7) % 11) / 52;
    return { a, r, s: 0.25 + ((i * 5) % 7) / 9 };
  });

  function draw() {
    if (!w || !h) return;
    const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.42;
    ctx.clearRect(0, 0, w, h);

    // the dotted circuit
    ctx.save();
    ctx.setLineDash([1.5, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, R0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(142,211,248,.30)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // inner containment ring
    ctx.beginPath();
    ctx.arc(cx, cy, R0 * 0.74, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(142,211,248,.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // the travelling arc: the loop closing, over and over
    const head = t * 0.5;
    const g = ctx.createLinearGradient(cx - R0, cy - R0, cx + R0, cy + R0);
    g.addColorStop(0, 'rgba(0,119,191,0)');
    g.addColorStop(0.5, 'rgba(142,211,248,.85)');
    g.addColorStop(1, 'rgba(159,164,218,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R0, head, head + Math.PI * 0.62);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // the pulse riding the head of the arc
    const px = cx + Math.cos(head + Math.PI * 0.62) * R0;
    const py = cy + Math.sin(head + Math.PI * 0.62) * R0;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190,230,255,.95)';
    ctx.fill();

    // the core cluster
    const pts = CELLS.map(c => {
      const a = c.a + t * 0.06 * c.s;
      const rr = R0 * c.r;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82, c];
    });
    ctx.lineWidth = 0.7;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
        const dist = Math.hypot(dx, dy);
        if (dist > R0 * 0.26) continue;
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.strokeStyle = `rgba(0,119,191,${(0.30 * (1 - dist / (R0 * 0.26))).toFixed(3)})`;
        ctx.stroke();
      }
    }
    for (const [x, y, c] of pts) {
      const f = 0.5 + 0.5 * Math.sin(t * 1.4 + c.a * 2);
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + f * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,215,255,${(0.35 + f * 0.5).toFixed(3)})`;
      ctx.fill();
    }
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now; t += dt;
    draw();
    raf = requestAnimationFrame(tick);
  }
  function run() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (document.hidden || !seen || REDUCED.matches) { draw(); return; }
    raf = requestAnimationFrame(tick);
  }

  new ResizeObserver(size).observe(stage);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }, { threshold: 0 }).observe(stage);
  document.addEventListener('visibilitychange', run);
  REDUCED.addEventListener('change', run);
  size(); run();
}

/* the horizontal signal rail on the problem section */
export function mountRail(rail, nav) {
  if (!rail) return;
  nav?.forEach(btn => btn.addEventListener('click', () => {
    const card = rail.querySelector('.signal');
    const step = card ? card.getBoundingClientRect().width + 12 : 260;
    rail.scrollBy({ left: step * Number(btn.dataset.rail), behavior: REDUCED.matches ? 'auto' : 'smooth' });
  }));
}
