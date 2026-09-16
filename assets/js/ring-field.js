/* ANERVA — the living field behind the operating-mode ring.
   Eight nodes on a circle is a diagram. What makes it a system is what moves
   between them: per Phase 08 §07 modes alternate, nest and conceal one another,
   so the field draws those relations as travelling light rather than stating them.
   One canvas, one rAF, paused off-screen and under reduced motion. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

/* canonical relations — framework facts, not decoration:
   OM3 → OM6 (overdrive then depletion), OM2 → OM4 (vigilance maintains control),
   OM8 ↔ OM7 (regulated at work, disconnected at home), OM1 → OM5 (mobilise, fragment) */
const RELATIONS = [[2, 5], [1, 3], [7, 6], [0, 4], [3, 1], [5, 2]];

export function mountRingField(ring, modeCount = 8) {
  if (!ring) return;
  const cv = document.createElement('canvas');
  cv.className = 'ring__canvas';
  cv.setAttribute('aria-hidden', 'true');
  ring.prepend(cv);

  const ctx = cv.getContext('2d');
  if (!ctx) { cv.remove(); return; }

  let w = 0, h = 0, raf = 0, t = 0, last = 0, seen = true;

  const orbit = Array.from({ length: 18 }, (_, i) => ({
    a: (i / 18) * Math.PI * 2,
    r: 0.30 + (i % 5) * 0.045,
    s: 0.012 + (i % 7) * 0.0035,
    z: 0.7 + (i % 3) * 0.35,
  }));

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

  // the DOM nodes sit at 38cqi of the ring; this canvas is inset -12%, hence 38/124
  const nodeAt = (i) => {
    const a = (i / modeCount) * Math.PI * 2 - Math.PI / 2;
    const rr = Math.min(w, h) * (38 / 124);
    return [w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr];
  };

  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * (38 / 124);

    // satellites drifting inside the ring
    for (const o of orbit) {
      const a = o.a + t * o.s;
      const rad = R0 * o.r * 2.1;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      const p = 0.5 + 0.5 * Math.sin(t * 0.6 + o.a * 3);
      ctx.beginPath();
      ctx.arc(x, y, 1.1 * o.z, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(142,211,248,' + ((0.10 + p * 0.22) * o.z).toFixed(3) + ')';
      ctx.fill();
    }

    // the relations: a chord fades in, carries a pulse across, fades out
    for (let k = 0; k < RELATIONS.length; k++) {
      const [a, b] = RELATIONS[k];
      const cycle = (t * 0.17 + k / RELATIONS.length) % 1;
      const life = Math.sin(cycle * Math.PI);
      if (life <= 0.01) continue;

      const [x1, y1] = nodeAt(a);
      const [x2, y2] = nodeAt(b);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const bow = 0.34;
      const qx = cx + (mx - cx) * bow, qy = cy + (my - cy) * bow;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(qx, qy, x2, y2);
      ctx.strokeStyle = 'rgba(159,164,218,' + (life * 0.26).toFixed(3) + ')';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      const u = cycle;
      const iu = 1 - u;
      const px = iu * iu * x1 + 2 * iu * u * qx + u * u * x2;
      const py = iu * iu * y1 + 2 * iu * u * qy + u * u * y2;
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(142,211,248,' + (life * 0.85).toFixed(3) + ')';
      ctx.fill();
    }

    // a slow sweep, so the field reads as observed rather than merely animated
    const sa = -Math.PI / 2 + (t * 0.09) % (Math.PI * 2);
    const ex = cx + Math.cos(sa) * R0, ey = cy + Math.sin(sa) * R0;
    const g = ctx.createLinearGradient(cx, cy, ex, ey);
    g.addColorStop(0, 'rgba(142,211,248,0)');
    g.addColorStop(1, 'rgba(142,211,248,.16)');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    t += dt;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function run() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (document.hidden || !seen || REDUCED.matches) { draw(); return; }
    raf = requestAnimationFrame(tick);
  }

  new ResizeObserver(size).observe(ring);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }, { threshold: 0 }).observe(ring);
  document.addEventListener('visibilitychange', run);
  REDUCED.addEventListener('change', run);
  size();
  run();
}
