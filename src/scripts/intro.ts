// Homepage intro, once per visit. The inline script in index.astro decides before
// first paint and adds `intro` to <html>, so the page starts black.
//
// The lines below are traced from the first hero photo (The Landing at dusk). On
// black, the far shore draws in, then three dots trace Quay Tower, One Brooklyn
// Bridge Park and The Landing. When the photo has loaded, the black fades away
// beneath the lines so the drawing lands on the real buildings, the lines dissolve,
// and the dots fly into the periods of "Designer. Developer. Partner."
//
// If the first hero photo changes, the intro skips itself until it is retraced.

const IMAGE = 'dusk-waterfront';
const DONE = 'ral:intro-done';
const NS = 'http://www.w3.org/2000/svg';
type Pt = [number, number];

// All coordinates are pixels in the web master.
const MASTER: Pt = [2800, 2387];
const BACKGROUND: Pt[][] = [
  // far shore: Jersey City and the tip of Lower Manhattan
  [[0, 1276], [495, 1276], [495, 1205], [520, 1205], [520, 1262], [590, 1262], [590, 1211], [614, 1211], [614, 1258], [712, 1258], [712, 1218], [760, 1218], [760, 1145], [804, 1138], [804, 1195], [850, 1195], [850, 1132], [856, 1132], [856, 1105], [856, 1132], [886, 1132], [886, 1191], [918, 1191], [918, 1250], [964, 1250], [964, 1214], [1005, 1214], [1005, 1200], [1030, 1200], [1030, 1084], [1073, 1084], [1073, 1027], [1134, 1027]],
  [[0, 1283], [1134, 1283]], // waterline
  [[1681, 898], [1681, 933]], // One World Trade Center's spire
];

// `path` is what the dot traces; `extra` lines draw in behind it. Listed in headline order.
type Building = { path: Pt[]; extra: Pt[][] };
const QUAY: Building = {
  path: [[1572, 905], [1572, 598], [1522, 587], [1522, 497], [1361, 462], [1182, 539], [1182, 624], [1134, 645], [1134, 1440]],
  extra: [[[1182, 624], [1353, 551], [1522, 587]], [[1353, 551], [1353, 935]], [[1361, 462], [1361, 545]], [[1134, 755], [1199, 755], [1199, 950], [1258, 950]]],
};
const OBBP: Building = {
  path: [[2800, 1065], [2745, 1065], [2745, 1028], [2624, 1028], [2624, 1013], [2565, 1013], [2565, 930], [2376, 930], [2376, 950], [2324, 950], [2324, 865], [2297, 865], [2297, 812], [2272, 812], [2272, 797], [2272, 812], [2245, 812], [2245, 865], [2145, 865], [2145, 965], [2013, 965], [2013, 1009], [1964, 1013], [1964, 1500]],
  extra: [[[1964, 1013], [2203, 992], [2560, 1044]], [[2203, 992], [2203, 1500]]],
};
const LANDING: Building = {
  path: [[1892, 1530], [1892, 1075], [1368, 1040], [1160, 1067], [1160, 1735], [1368, 1810]],
  extra: [[[1368, 1040], [1368, 1810]], [[1258, 1027], [1258, 959], [1410, 933], [1784, 959], [1784, 1022]], [[1410, 933], [1410, 1030]]],
};
const BUILDINGS = [QUAY, OBBP, LANDING];

// Timeline (ms)
const BG: Pt = [300, 2600];
const TRACE_AT = [1100, 2100, 1600]; // Quay, One Brooklyn Bridge Park, The Landing
const TRACE_MS = 3000;
const HOLD = 5700; // earliest reveal
const MAX = 12000; // reveal by now even if the photo is still loading
const REVEAL_MS = 3200;
const SKIP_MS = 700;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out = (x: number) => 1 - Math.pow(1 - x, 3);
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

export function intro(root: HTMLElement, title: HTMLElement) {
  const html = document.documentElement;
  if (!html.classList.contains('intro')) return;
  html.classList.add('intro-js'); // switches off the CSS failsafe

  const finishEarly = () => {
    root.remove();
    html.classList.remove('intro', 'intro-js');
    dispatchEvent(new Event(DONE));
  };
  const img = document.querySelector<HTMLImageElement>('.hero__slide.is-active img');
  if (!img || !(img.getAttribute('srcset') ?? img.src).includes(IMAGE)) return finishEarly();
  const [iw, ih] = MASTER; // not naturalWidth: that is whichever responsive size the browser picked

  const scrollWas = html.style.overflow;
  html.style.overflow = 'hidden';

  // Map photo pixels to the screen the way the hero shows it (object-fit: cover, centered)
  const box = img.getBoundingClientRect();
  const k = Math.max(box.width / iw, box.height / ih);
  const ox = box.left + (box.width - iw * k) / 2, oy = box.top + (box.height - ih * k) / 2;
  const d = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(ox + x * k).toFixed(1)} ${(oy + y * k).toFixed(1)}`).join('');
  const vw = innerWidth, vh = innerHeight;
  const sw = Math.max(1, Math.min(1.6, k * 2.2));

  // ---- Layers: black backdrop, line drawing, dots ----
  const black = document.createElement('div');
  black.style.cssText = 'position:absolute;inset:0;background:var(--ink)';
  root.style.background = 'none';
  root.append(black);

  const svg = el('svg', { width: vw, height: vh, 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': sw, 'stroke-linejoin': 'miter' });
  svg.style.cssText = 'position:absolute;inset:0';
  root.append(svg);

  const line = (pts: Pt[], opacity: number, width = sw) => {
    const p = el('path', { d: d(pts), opacity, 'stroke-width': width });
    svg.append(p);
    const len = p.getTotalLength();
    p.setAttribute('stroke-dasharray', `${len} ${len}`);
    p.setAttribute('stroke-dashoffset', String(len));
    return { p, len, draw: (f: number) => p.setAttribute('stroke-dashoffset', String(len * (1 - f))) };
  };
  const bg = BACKGROUND.map((pts) => line(pts, 0.55, sw * 0.75));
  const extras = BUILDINGS.map((b) => b.extra.map((pts) => line(pts, 0.6, sw * 0.85)));
  const traces = BUILDINGS.map((b) => line(b.path, 0.95));

  const fs = parseFloat(getComputedStyle(title).fontSize);
  let r0 = Math.max(2.5, fs * 0.06); // close to the period's size until fonts are measured
  const dotsSvg = el('svg', { width: vw, height: vh, 'aria-hidden': 'true', fill: 'currentColor' });
  dotsSvg.style.cssText = 'position:fixed;inset:0;z-index:91;pointer-events:none;color:var(--on-dark)';
  const dots = BUILDINGS.map(() => el('circle', { r: 0, cx: -99, cy: -99 }));
  dotsSvg.append(...dots);
  document.body.append(dotsSvg);

  // ---- Readiness: the photo for the reveal, fonts for measuring the periods ----
  let ready = false;
  const imgReady = img.complete ? Promise.resolve() : new Promise<void>((res) => {
    img.addEventListener('load', () => res(), { once: true });
    img.addEventListener('error', () => res(), { once: true });
  });
  Promise.all([document.fonts.ready, imgReady.then(() => img.decode?.().catch(() => {}))]).then(() => (ready = true));

  // Where each period's ink sits on screen
  const targets = () => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const cs = getComputedStyle(title);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText('.');
    const r = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2;
    return Array.from(title.querySelectorAll<HTMLElement>('.hero__dot')).map((span) => {
      const x = span.getBoundingClientRect().left;
      const mark = document.createElement('span');
      mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      span.prepend(mark);
      const base = mark.getBoundingClientRect().top;
      mark.remove();
      return { x: x + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, y: base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2, r };
    });
  };

  let revealAt = 0, revealMs = REVEAL_MS;
  let from: Pt[] = [], to: { x: number; y: number; r: number }[] = [];
  const reveal = (now: number, ms: number) => {
    revealAt = now; revealMs = ms;
    // a dot that has not appeared yet leaves from the start of its outline
    from = dots.map((c, i) => {
      const cx = Number(c.getAttribute('cx'));
      if (cx > -99) return [cx, Number(c.getAttribute('cy'))];
      const p = traces[i].p.getPointAtLength(0);
      return [p.x, p.y];
    });
    to = targets();
    if (to.length !== dots.length) to = from.map(([x, y]) => ({ x, y, r: 0 }));
    r0 = Math.max(...dots.map((c) => Number(c.getAttribute('r')))) || r0;
  };

  let raf = 0, t0 = 0, last = 0;
  const EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'resize'];
  const skip = () => { if (!revealAt) reveal(last, SKIP_MS); };
  EVENTS.forEach((e) => addEventListener(e, skip, { passive: true }));
  const finish = () => {
    cancelAnimationFrame(raf);
    EVENTS.forEach((e) => removeEventListener(e, skip));
    dotsSvg.remove();
    html.style.overflow = scrollWas;
    finishEarly();
  };

  const frame = (now: number) => {
    if (!t0) t0 = now;
    last = now;
    const t = now - t0;

    bg.forEach((l) => l.draw(inOut(seg(t, BG[0], BG[1]))));
    BUILDINGS.forEach((_, i) => {
      const a = TRACE_AT[i];
      const f = inOut(seg(t, a, a + TRACE_MS));
      traces[i].draw(f);
      extras[i].forEach((l) => l.draw(inOut(seg(t, a + TRACE_MS * 0.55, a + TRACE_MS * 1.15))));
      if (!revealAt) {
        const p = traces[i].p.getPointAtLength(traces[i].len * f);
        dots[i].setAttribute('r', (r0 * out(seg(t, a - 350, a))).toFixed(2));
        dots[i].setAttribute('cx', p.x.toFixed(1));
        dots[i].setAttribute('cy', p.y.toFixed(1));
      }
    });

    if (!revealAt && ((t > HOLD && ready) || t > MAX)) reveal(now, REVEAL_MS);
    if (revealAt) {
      const e = now - revealAt, R = revealMs;
      // black fades first so the drawing sits on the real buildings, then the lines dissolve
      black.style.opacity = String(1 - inOut(seg(e, 0, R * 0.62)));
      svg.style.opacity = String(1 - inOut(seg(e, R * 0.42, R * 0.95)));
      const p = inOut(seg(e, R * 0.35, R));
      dots.forEach((c, i) => {
        const [sx, sy] = from[i], end = to[i];
        const cx = sx + (end.x - sx) * 0.15, cy = sy + (end.y - sy) * 0.9; // gentle arc toward the headline
        const u = 1 - p;
        c.setAttribute('cx', (u * u * sx + 2 * u * p * cx + p * p * end.x).toFixed(2));
        c.setAttribute('cy', (u * u * sy + 2 * u * p * cy + p * p * end.y).toFixed(2));
        c.setAttribute('r', (r0 + (end.r - r0) * p).toFixed(2));
      });
      if (e >= R) return finish();
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

// Lets other homepage scripts wait for the intro (e.g. the hero slideshow)
export const afterIntro = (fn: () => void) => {
  if (document.documentElement.classList.contains('intro')) addEventListener(DONE, fn, { once: true });
  else fn();
};
