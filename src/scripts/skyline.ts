// Homepage hero, once per visit: the periods in "Designer. Developer. Partner."
// leave the headline. The bottom one slides right and draws a ground line, the
// others hop down onto it, and each rises into a line-drawn tower. Then they
// retrace their steps and the headline is exactly as it was.
//
// The real periods stay in the text (screen readers and copy are unaffected);
// they are made transparent while identical SVG copies do the moving.

const KEY = 'ral:skyline';
const NS = 'http://www.w3.org/2000/svg';

// Generic towers as polylines in fractions of their own box: x right, y up from the ground.
// `top` is where the dot comes to rest.
type Tower = { w: number; h: number; lines: number[][][]; top: [number, number] };
const TOWERS: Tower[] = [
  { // setback tower with a spire
    w: 0.62, h: 2.05, top: [0.5, 1],
    lines: [
      [[0, 0], [0, 0.6], [0.14, 0.6], [0.14, 0.8], [0.3, 0.8], [0.3, 0.9], [0.7, 0.9], [0.7, 0.8], [0.86, 0.8], [0.86, 0.6], [1, 0.6], [1, 0]],
      [[0.5, 0.9], [0.5, 1]],
    ],
  },
  { // tall slim tower with a crown band and mast
    w: 0.44, h: 2.75, top: [0.5, 1],
    lines: [[[0, 0], [0, 0.92], [1, 0.92], [1, 0]], [[0, 0.86], [1, 0.86]], [[0.5, 0.92], [0.5, 1]]],
  },
  { // tower with a sloped crown
    w: 0.6, h: 1.55, top: [1, 1],
    lines: [[[0, 0], [0, 0.8], [1, 1], [1, 0]]],
  },
];
const GAP = 0.3; // between towers, in em
const LEAD = 0.55; // between the headline and the first tower, in em

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out = (x: number) => 1 - Math.pow(1 - x, 3);
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

export function skyline(title: HTMLElement) {
  const force = new URLSearchParams(location.search).has('skyline');
  if (!force && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { if (!force && sessionStorage.getItem(KEY)) return; } catch { /* storage blocked: just play */ }

  const dots = Array.from(title.querySelectorAll<HTMLElement>('.hero__dot'));
  if (dots.length < 1 || dots.length > TOWERS.length) return;

  const start = () => {
    if (window.scrollY > innerHeight / 2) return; // visitor is already past the hero
    if (!force && performance.now() > 6000) return; // fonts were slow; a late surprise would distract
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    play(title, dots);
  };
  const ready = () => setTimeout(start, 700);
  const whenVisible = () => {
    if (!document.hidden) return ready();
    document.addEventListener('visibilitychange', function v() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', v);
      ready();
    });
  };
  document.fonts.ready.then(whenVisible);
}

function play(title: HTMLElement, spans: HTMLElement[]) {
  const cs = getComputedStyle(title);
  const em = parseFloat(cs.fontSize);
  const box = title.getBoundingClientRect();

  // Ink box of the period glyph, relative to its origin and baseline
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText('.');
  const inkCx = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
  const inkCy = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  const inkR = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2;

  // Where each period sits (origin x, baseline y), relative to the headline box
  const dots = spans.map((s) => {
    const r = s.getBoundingClientRect();
    const mark = document.createElement('span');
    mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    s.prepend(mark);
    const base = mark.getBoundingClientRect().top - box.top;
    mark.remove();
    const x = r.left - box.left;
    return { x, base, cx: x + inkCx, cy: base - inkCy };
  });

  // Lay the towers out to the right of the widest line, scaled down if the screen is narrow
  const towers = TOWERS.slice(0, dots.length);
  const lineEnd = Math.max(...spans.map((s) => s.getBoundingClientRect().right - box.left));
  const wrap = title.parentElement!;
  const room = wrap.getBoundingClientRect().right - parseFloat(getComputedStyle(wrap).paddingRight) - box.left - lineEnd;
  const need = (LEAD + towers.reduce((a, t) => a + t.w, 0) + GAP * (towers.length - 1)) * em;
  const k = Math.min(1, room / need);
  if (k < 0.6) return; // not enough room for a skyline that reads

  const slider = dots.reduce((a, d) => (d.base > a.base ? d : a)); // the period on the bottom line
  const ground = slider.base + m.actualBoundingBoxDescent;
  let x = lineEnd + LEAD * em * k;
  const plan = towers.map((t, i) => {
    const w = t.w * em * k, h = t.h * em;
    const left = x;
    x += w + GAP * em * k;
    const tx = left + t.top[0] * w;
    return { t, i, w, h, left, tx, rise: t.top[1] * h };
  });

  // Build the overlay
  const sw = Math.max(1, em * 0.016);
  const svg = el('svg', { 'aria-hidden': 'true', class: 'skyline', width: 1, height: 1 });
  svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
  const defs = el('defs');
  svg.append(defs);
  const g = el('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': sw, 'stroke-linejoin': 'miter' });
  svg.append(g);
  const groundLine = el('line', { x1: slider.cx, x2: slider.cx, y1: ground, y2: ground, opacity: 0.75 });
  g.append(groundLine);
  const clips = plan.map((p) => {
    const id = `skyline-clip-${p.i}`;
    const cp = el('clipPath', { id });
    const rect = el('rect', { x: p.left - sw * 2, width: p.w + sw * 4, y: ground, height: 0 });
    cp.append(rect);
    defs.append(cp);
    const d = p.t.lines
      .map((pl) => pl.map(([fx, fy], j) => `${j ? 'L' : 'M'}${(p.left + fx * p.w).toFixed(2)} ${(ground - fy * p.h).toFixed(2)}`).join(''))
      .join('');
    g.append(el('path', { d, 'clip-path': `url(#${id})` }));
    return rect;
  });
  const glyphs = dots.map((d) => {
    const t = el('text', { x: d.x, y: d.base, fill: 'currentColor' });
    t.style.cssText = `font:${ctx.font};letter-spacing:0`;
    t.textContent = '.';
    svg.append(t);
    return t;
  });
  title.prepend(svg);
  title.classList.add('is-skyline');

  // Timeline (ms). Out: slide + hops, rise, hold. Back: lower, hops, slide.
  const SLIDE = [0, 750], HOP = 650, RISE = 900, HOLD = 3150, LOWER = 650;
  const hopAt = (i: number) => 180 + i * 110;
  const riseAt = (i: number) => 850 + i * 110;
  const END = HOLD + LOWER + 300 + HOP + 200;

  // Each dot's position at time t
  const pos = (d: typeof dots[number], p: typeof plan[number], t: number) => {
    const landX = p.tx, landY = ground - inkR;
    let x: number, y: number;
    const back = t >= HOLD;
    if (d === slider) {
      const a = back ? 1 - inOut(seg(t, HOLD + LOWER + 250, HOLD + LOWER + 250 + SLIDE[1])) : inOut(seg(t, SLIDE[0], SLIDE[1]));
      x = d.cx + (landX - d.cx) * a; y = d.cy + (landY - d.cy) * a;
    } else {
      const a = back ? 1 - inOut(seg(t, HOLD + LOWER + 150 + p.i * 90, HOLD + LOWER + 150 + p.i * 90 + HOP)) : inOut(seg(t, hopAt(p.i), hopAt(p.i) + HOP));
      // quadratic arc with a small lift before the drop
      const cx = d.cx + (landX - d.cx) * 0.35, cy = Math.min(d.cy, landY) - 0.45 * em;
      const u = 1 - a;
      x = u * u * d.cx + 2 * u * a * cx + a * a * landX;
      y = u * u * d.cy + 2 * u * a * cy + a * a * landY;
    }
    // vertical travel up the tower
    const up = back ? 1 - inOut(seg(t, HOLD + p.i * 60, HOLD + p.i * 60 + LOWER)) : out(seg(t, riseAt(p.i), riseAt(p.i) + RISE + p.i * 80));
    y -= p.rise * up;
    return { x, y, built: p.rise * up };
  };

  let raf = 0, t0 = 0;
  const done = () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', done);
    svg.remove();
    title.classList.remove('is-skyline');
  };
  addEventListener('resize', done);

  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = now - t0;
    let gx = slider.cx;
    plan.forEach((p, i) => {
      const d = dots[i];
      const s = pos(d, p, t);
      glyphs[i].setAttribute('transform', `translate(${(s.x - d.cx).toFixed(2)} ${(s.y - d.cy).toFixed(2)})`);
      // reveal the outline up to the dot as it climbs
      clips[i].setAttribute('y', (ground - s.built).toFixed(2));
      clips[i].setAttribute('height', s.built ? (s.built + sw * 2).toFixed(2) : '0');
      if (d === slider) gx = s.x;
    });
    groundLine.setAttribute('x2', gx.toFixed(2));
    if (t < END) raf = requestAnimationFrame(frame);
    else done();
  };
  raf = requestAnimationFrame(frame);
}
