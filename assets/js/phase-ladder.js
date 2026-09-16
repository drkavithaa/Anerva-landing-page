/* ANERVA — the phase ladder, made operable.
 *
 * Doctrine this component must not break (Phase 08 §09, PRD §4):
 *  · Every client enters at Phase 0. Always.
 *  · Advancement is competency-gated and requires the architect's explicit
 *    decision after a session — never time-based, never automatic. So nothing
 *    here animates on a clock, and the visitor is never told they can advance.
 *  · 6 and 12 weeks are nominal. No week numbers sit against a phase.
 *  · "Premium must never be manufactured as the expected next sale." Core is
 *    presented as complete in itself, with an explicit end marker.
 *  · The client-facing name and the internal architecture name are two
 *    renderings of one record — the same idea the product is built on.
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const PHASE_DETAIL = {
  'Phase 0': {
    arch: 'Safety & Baseline',
    body: 'Consent, safety screening, and the week-0 measurement that everything later is compared against. No protocols are issued yet.',
  },
  'Phase 1': {
    arch: 'Awareness & Pattern Destabilisation',
    body: 'The formulation is put to work: what the system does under demand, when it does it, and what it costs to keep doing.',
  },
  'Phase 2': {
    arch: 'Bioenergetic & Nervous System Regulation',
    body: 'Work at the layers that decide whether activation can rise for a real demand and come down again afterwards.',
  },
  'Phase 3': {
    arch: 'Cognitive–Behavioural Regulation',
    body: 'Work at the layer where interpretation, decision and action come apart once pressure, emotion or fatigue arrives.',
  },
  'Phase 4': {
    arch: 'Adaptive Installation',
    body: 'A different response is rehearsed until it is available without deliberate effort. In Core, this is where the work bridges into maintenance.',
  },
  'Phase 5': {
    arch: 'Complexity Integration',
    body: 'The response is taken into the contexts that were previously avoided, or survived rather than met.',
  },
  'Phase 6': {
    arch: 'Identity-Level Stabilisation',
    body: 'The work stops being something done deliberately and becomes how the system operates across contexts.',
  },
  'Phase M': {
    arch: 'Maintenance',
    body: 'Lighter, less frequent contact. Support becomes lighter rather than indispensable.',
  },
};

export function mountPhaseLadder(host, PHASES, el) {
  if (!host) return;

  let route = 'core';        // 'core' | 'premium'
  let open = 0;              // index of the expanded phase

  const inRoute = (p) => (route === 'core' ? p.core : p.premium);
  const visible = () => PHASES.filter(inRoute);

  /* ---- route selector ---- */
  const routeBar = el('div', { class: 'ladder__routes', role: 'group', 'aria-label': 'Choose a pathway to see which phases it contains' },
    el('b', { text: 'Show the phases in' }),
  );
  const routeBtns = [
    { key: 'core', label: 'ANA Core', dur: 'six weeks, nominal' },
    { key: 'premium', label: 'ANA Premium', dur: 'twelve weeks, nominal' },
  ].map((r) => {
    const b = el('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(r.key === route),
      text: r.label,
      onclick: () => { route = r.key; open = 0; render(); },
    });
    routeBar.append(b);
    return { ...r, b };
  });

  const readout = el('p', { class: 'ladder__readout mono', 'aria-live': 'polite' });

  /* ---- the rows ---- */
  const list = el('div', { class: 'thread__list ladder__list', id: 'phaseList' });

  /* ---- stepper ---- */
  const prev = el('button', {
    class: 'ladder__nav', type: 'button', 'aria-label': 'Previous phase',
    onclick: () => { step(-1); },
  }, el('span', { text: '←' }));
  const next = el('button', {
    class: 'ladder__nav', type: 'button', 'aria-label': 'Next phase',
    onclick: () => { step(1); },
  }, el('span', { text: '→' }));
  const stepper = el('div', { class: 'ladder__stepper' }, prev, readout, next);

  function step(d) {
    const n = visible().length;
    open = (open + d + n) % n;
    render(true);
  }

  host.replaceChildren(routeBar, list, stepper,
    el('p', { class: 'ladder__note' },
      el('span', { text: 'Choosing a pathway here shows what it contains. It does not select it. ' }),
      el('b', { text: 'Phases advance on the architect’s explicit decision after a session — never on a calendar, and never automatically.' })));

  function render(focusRow) {
    const shown = visible();
    routeBtns.forEach(r => r.b.setAttribute('aria-pressed', String(r.key === route)));
    if (open >= shown.length) open = shown.length - 1;

    const cur = shown[open];
    const meta = PHASE_DETAIL[cur.id] || {};
    readout.textContent = `${open + 1} / ${shown.length} · ${routeBtns.find(r => r.key === route).dur}`;

    list.replaceChildren(...shown.map((p, i) => {
      const d = PHASE_DETAIL[p.id] || {};
      const isOpen = i === open;
      const pid = `ph-${p.id.replace(/\s+/g, '')}`;

      const btn = el('button', {
        class: 'phase__btn', type: 'button',
        'aria-expanded': String(isOpen), 'aria-controls': pid,
        onclick: () => { open = i; render(true); },
        onkeydown: (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); step(1); }
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        },
      },
        el('span', { class: 'phase__id mono', text: p.id }),
        el('span', { class: 'phase__name' },
          el('span', { text: p.name }),
          p.note ? el('small', { text: p.note }) : null),
        el('span', { class: 'phase__in' },
          el('span', { 'data-on': String(p.core), text: 'Core' }),
          el('span', { 'data-on': String(p.premium), text: 'Premium' })));

      const panel = el('div', { class: 'phase__panel', id: pid },
        el('div', { class: 'phase__panelinner' },
          el('div', { class: 'phase__detail' },
            el('p', { class: 'phase__arch' },
              el('b', { text: 'In the architecture' }),
              el('span', { text: d.arch || '' })),
            el('p', { class: 'phase__body', text: d.body || '' }))));

      const row = el('div', {
        class: 'phase',
        'data-premium': String(!p.core),
        'data-open': String(isOpen),
        'data-done': String(i < open),
        style: `--i:${i}`,
      }, btn, panel);

      if (focusRow && isOpen && !REDUCED.matches) {
        requestAnimationFrame(() => btn.focus({ preventScroll: true }));
      }
      return row;
    }));

    // Core is complete in itself — say so where it ends, rather than implying an upgrade.
    if (route === 'core') {
      list.append(el('p', { class: 'ladder__end' },
        'If Core does the work and deeper work is unnecessary, Core is where it ends.'));
    }

    // the thread fills to the open phase — driven by the reader, never by a clock
    const pct = shown.length > 1 ? (open / (shown.length - 1)) * 100 : 100;
    list.style.setProperty('--fill', pct.toFixed(1) + '%');
    void meta;
  }

  render();
}
