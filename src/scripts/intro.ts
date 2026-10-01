// Homepage intro, once per visit. The inline script in index.astro decides before
// first paint and adds `intro` to <html>, so the page starts black.
//
// A line drawing of Lower Manhattan draws in across the East River. Three dots then
// build RAL's Brooklyn Bridge Park buildings in front of it: Quay Tower, One Brooklyn
// Bridge Park and The Landing. Once the hero photo is ready the drawing fades away
// and the dots fly into the periods of "Designer. Developer. Partner."

const NS = 'http://www.w3.org/2000/svg';
const DONE = 'ral:intro-done';
type Pt = [number, number];

// Scene units: x to the right, y up from the Brooklyn shore.
const HORIZON = 2.6; // Manhattan waterline
const TALL = 4.05; // top of Quay Tower's crown
const BOX: Pt = [-1.3, 3.5]; // horizontal span that must stay on screen
const SKY = 0.8; // Manhattan is far away: scale its heights down

// Listed in headline order: Designer -> Quay Tower, Developer -> One Brooklyn Bridge Park, Partner -> The Landing
type Building = { outline: Pt[]; detail: Pt[][]; top: Pt };
const QUAY: Building = {
  outline: [[0, 0], [0, 3.72], [0.14, 3.72], [0.14, 4.05], [0.94, 4.05], [0.94, 3.72], [1, 3.72], [1, 0]],
  // the bronze frame that steps across the facade
  detail: [
    [[0.3, 0], [0.3, 0.95], [0.46, 0.95], [0.46, 1.9], [0.62, 1.9], [0.62, 2.85], [0.78, 2.85], [0.78, 3.72]],
    [[0.14, 3.86], [0.94, 3.86]],
  ],
  top: [0.54, 4.05],
};
const OBBP: Building = {
  outline: [[0.75, 0], [0.75, 1.72], [1, 1.72], [1, 1.9], [1.82, 1.9], [1.82, 2.18], [1.94, 2.18], [1.94, 2.42], [2.16, 2.42], [2.16, 2.18], [2.28, 2.18], [2.28, 1.9], [3.05, 1.9], [3.05, 1.72], [3.3, 1.72], [3.3, 0]],
  // floor bands of the old warehouse
  detail: [[[0.75, 0.58], [3.3, 0.58]], [[0.75, 1.15], [3.3, 1.15]], [[1.82, 1.9], [1.82, 0]], [[2.28, 1.9], [2.28, 0]]],
  top: [2.05, 2.42],
};
const LANDING: Building = {
  outline: [[2.3, 0], [2.3, 1.52], [2.42, 1.52], [2.42, 1.68], [3.32, 1.68], [3.32, 1.52], [3.48, 1.52], [3.48, 0]],
  detail: [[[2.69, 0], [2.69, 1.52]], [[3.09, 0], [3.09, 1.52]]],
  top: [2.87, 1.68],
};
const BUILDINGS = [QUAY, OBBP, LANDING];
const BACK_TO_FRONT = [1, 0, 2];

// Manhattan, left to right from x = -6: [width, height, shape]
type Block = [number, number, string?];
const MANHATTAN: Block[] = [
  [0.3, 0.14], [0.22, 0.2], [0.26, 0.16], [0.2, 0.26], [0.24, 0.22], [0.18, 0.32], [0.26, 0.28], [0.2, 0.4],
  [0.22, 0.4, 'peak'], [0.28, 0.3], [0.16, 0.48], [0.24, 0.42], [0.2, 0.58, 'peak'], [0.26, 0.5], [0.18, 0.66],
  [0.22, 0.55], [0.3, 0.72, 'slant'], [0.2, 0.62], [0.24, 0.8], [0.22, 0.68], [0.18, 0.74], [0.18, 0.6],
  [0.32, 1.2, 'wtc'], // One World Trade Center
  [0.2, 0.7], [0.24, 0.86, 'slant'], [0.18, 0.64], [0.26, 0.92], [0.14, 0.98], [0.22, 0.78], [0.2, 0.7],
  [0.28, 0.84, 'peak'], [0.18, 0.58], [0.24, 0.66], [0.2, 0.52], [0.26, 0.45], [0.24, 0.36],
  [0.3, 0.18], [0.4, 0.12], [0.35, 0.2], [0.3, 0.14],
  // Midtown, further away
  [0.3, 0.22], [0.25, 0.3], [0.2, 0.26], [0.3, 0.36], [0.22, 0.3], [0.34, 0.62, 'esb'], [0.26, 0.34], [0.2, 0.42],
  [0.1, 0.78], [0.24, 0.46], [0.3, 0.38], [0.09, 0.82], [0.26, 0.5], [0.2, 0.4], [0.3, 0.32], [0.24, 0.44],
  [0.3, 0.28], [0.26, 0.36], [0.3, 0.24], [0.4, 0.2], [0.5, 0.16], [0.6, 0.12], [0.8, 0.1], [1.2, 0.08],
];
const BRIDGE = { from: 3.0, to: 8.4, towers: [4.1, 6.9], tw: 0.14, th: 0.56, deck: 0.12 };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out = (x: number) => 1 - Math.pow(1 - x, 3);
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
};

// Top outline of Manhattan as [x, y] points, y measured up from the waterline
function skylinePoints(): Pt[] {
  const pts: Pt[] = [[-6, 0]];
  let x = -6;
  for (const [w, raw, shape] of MANHATTAN) {
    const h = raw * SKY, x1 = x + w, cx = x + w / 2;
    if (shape === 'wtc') {
      // chamfered tower tapering to a narrower top, with a spire
      pts.push([x, h * 0.14], [x + w * 0.22, h], [cx, h], [cx, h + 0.42 * SKY], [cx, h], [x1 - w * 0.22, h], [x1, h * 0.14]);
    } else if (shape === 'esb') {
      pts.push([x, h * 0.7], [x + w * 0.15, h * 0.7], [x + w * 0.15, h * 0.84], [x + w * 0.32, h * 0.84], [x + w * 0.32, h],
        [cx, h], [cx, h + 0.14 * SKY], [cx, h], [x1 - w * 0.32, h], [x1 - w * 0.32, h * 0.84], [x1 - w * 0.15, h * 0.84], [x1 - w * 0.15, h * 0.7], [x1, h * 0.7]);
    } else if (shape === 'peak') {
      pts.push([x, h * 0.82], [cx, h], [x1, h * 0.82]);
    } else if (shape === 'slant') {
      pts.push([x, h * 0.86], [x1, h]);
    } else {
      pts.push([x, h], [x1, h]);
    }
    x = x1;
  }
  pts.push([x, 0]);
  return pts;
}

export function intro(root: HTMLElement, title: HTMLElement) {
  const html = document.documentElement;
  if (!html.classList.contains('intro')) return;
  html.classList.add('intro-js'); // switches off the CSS failsafe
  const scrollWas = html.style.overflow;
  html.style.overflow = 'hidden';

  const vw = innerWidth, vh = innerHeight;
  const s = Math.min((0.66 * vh) / TALL, (0.9 * vw) / (BOX[1] - BOX[0]));
  const ox = vw / 2 - ((BOX[0] + BOX[1]) / 2) * s;
  const gy = vh / 2 + (TALL / 2) * s + 0.02 * vh;
  const X = (u: number) => ox + u * s;
  const Y = (v: number) => gy - v * s;
  const d = (pts: Pt[], lift = 0) => pts.map(([u, v], i) => `${i ? 'L' : 'M'}${X(u).toFixed(1)} ${Y(v + lift).toFixed(1)}`).join('');
  const sw = Math.max(1, s * 0.011);

  // ---- Scene ----
  const svg = el('svg', { width: vw, height: vh, 'aria-hidden': 'true' });
  svg.style.cssText = 'position:absolute;inset:0';
  const defs = el('defs');
  svg.append(defs);
  const g = el('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': sw, 'stroke-linejoin': 'miter' });
  svg.append(g);

  const draw = (pathD: string, opacity: number, width = sw) => {
    const p = el('path', { d: pathD, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, opacity, 'stroke-width': width });
    g.append(p);
    return p;
  };
  const shore = draw(`M0 ${gy.toFixed(1)}H${vw}`, 0.8);
  const horizon = draw(`M0 ${Y(HORIZON).toFixed(1)}H${vw}`, 0.45, sw * 0.8);
  const sky = draw(d(skylinePoints(), HORIZON), 0.6, sw * 0.8);

  // River: a few dashes, wider apart and longer toward the viewer
  const water = el('g', { opacity: 0, 'stroke-width': sw * 0.7 });
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  [2.45, 2.28, 2.05, 1.75, 1.35, 0.85, 0.3].forEach((v, row) => {
    const len = 0.08 + row * 0.05;
    for (let u = -6 + rand() * 0.6; X(u) < vw; u += 0.5 + row * 0.25 + rand() * 0.6) {
      if (X(u + len) > 0) water.append(el('line', { x1: X(u), x2: X(u + len), y1: Y(v), y2: Y(v), opacity: 0.25 }));
    }
  });
  g.append(water);

  // Brooklyn Bridge, in front of Midtown
  const bridge = el('g', { opacity: 0, 'stroke-width': sw * 0.8 });
  const B = BRIDGE, by = (v: number) => HORIZON + v * SKY;
  bridge.append(el('path', { d: d([[B.from, by(B.deck)], [B.to, by(B.deck)]]) }));
  const [t1, t2] = B.towers;
  const cable = (a: Pt, b: Pt, sag: number) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - sag;
    return `M${X(a[0])} ${Y(a[1])}Q${X(mx)} ${Y(2 * my - (a[1] + b[1]) / 2)} ${X(b[0])} ${Y(b[1])}`;
  };
  const top = by(B.th);
  bridge.append(el('path', { d: cable([t1, top], [t2, top], (B.th - B.deck) * SKY * 0.85) + cable([B.from, by(B.deck)], [t1, top], 0.03 * SKY) + cable([t2, top], [B.to, by(B.deck)], 0.03 * SKY) }));
  for (const t of B.towers) {
    const p = el('path', { d: d([[t - B.tw / 2, by(B.deck)], [t - B.tw / 2, by(B.th)], [t + B.tw / 2, by(B.th)], [t + B.tw / 2, by(B.deck)]]) + 'Z' });
    p.style.fill = 'var(--ink)';
    bridge.append(p);
  }
  g.append(bridge);

  // RAL's buildings, revealed from the ground up as their dots climb
  const reveal = BUILDINGS.map(() => el('rect', { x: 0, width: vw, y: gy, height: 0 }));
  BACK_TO_FRONT.forEach((i) => {
    const b = BUILDINGS[i];
    const cp = el('clipPath', { id: `intro-clip-${i}` });
    cp.append(reveal[i]);
    defs.append(cp);
    const bg = el('g', { 'clip-path': `url(#intro-clip-${i})` });
    const body = el('path', { d: d(b.outline) + 'Z' });
    body.style.fill = 'var(--ink)';
    bg.append(body);
    bg.append(el('path', { d: b.detail.map((l) => d(l)).join(''), opacity: 0.4, 'stroke-width': sw * 0.8 }));
    g.append(bg);
  });
  root.append(svg);

  // ---- Dots: their own layer, so they stay visible while the scene fades ----
  const fs = parseFloat(getComputedStyle(title).fontSize);
  let r0 = fs * 0.06; // close to the period's size until fonts are measured
  const dotsSvg = el('svg', { width: vw, height: vh, 'aria-hidden': 'true', fill: 'currentColor' });
  dotsSvg.style.cssText = 'position:fixed;inset:0;z-index:91;pointer-events:none;color:var(--on-dark)';
  const dots = BUILDINGS.map(() => el('circle', { r: 0, cx: -99, cy: -99 }));
  dotsSvg.append(...dots);
  document.body.append(dotsSvg);

  // ---- Readiness: fonts for measuring the periods, the first hero photo for the reveal ----
  const img = document.querySelector<HTMLImageElement>('.hero__slide.is-active img');
  const imgReady = new Promise<void>((res) => {
    if (!img || img.complete) return res();
    img.addEventListener('load', () => res(), { once: true });
    img.addEventListener('error', () => res(), { once: true });
  });
  let ready = false;
  Promise.all([document.fonts.ready, imgReady]).then(() => (ready = true));

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

  // ---- Timeline (ms) ----
  const APPEAR = (i: number) => 1000 + i * 160;
  const RISE: Pt[] = [[1350, 3050], [1500, 2700], [1650, 2750]];
  const HOLD = 3500, MAX = 7500;
  let leaveAt = 0, leaveMs = 1600;
  let from: Pt[] = [], to: { x: number; y: number; r: number }[] = [];

  const leave = (now: number, ms: number) => {
    leaveAt = now; leaveMs = ms;
    // a dot that has not appeared yet leaves from the foot of its building
    from = dots.map((c, i) => (Number(c.getAttribute('cx')) < 0 ? [X(BUILDINGS[i].top[0]), gy] : [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]));
    to = targets();
    if (to.length !== dots.length) to = from.map(([x, y]) => ({ x, y, r: 0 }));
    r0 = Math.max(...dots.map((c) => Number(c.getAttribute('r')))) || r0;
  };

  let raf = 0, t0 = 0, last = 0;
  const finish = () => {
    cancelAnimationFrame(raf);
    ['wheel', 'touchstart', 'keydown', 'pointerdown', 'resize'].forEach((e) => removeEventListener(e, skip));
    root.remove();
    dotsSvg.remove();
    html.classList.remove('intro', 'intro-js');
    html.style.overflow = scrollWas;
    dispatchEvent(new Event(DONE));
  };
  const skip = () => { if (!leaveAt) leave(last, 500); };
  ['wheel', 'touchstart', 'keydown', 'pointerdown', 'resize'].forEach((e) => addEventListener(e, skip, { passive: true }));

  const frame = (now: number) => {
    if (!t0) t0 = now;
    last = now;
    const t = now - t0;

    shore.setAttribute('stroke-dashoffset', String(1 - inOut(seg(t, 0, 900))));
    horizon.setAttribute('stroke-dashoffset', String(1 - inOut(seg(t, 150, 1050))));
    sky.setAttribute('stroke-dashoffset', String(1 - inOut(seg(t, 250, 2200))));
    water.setAttribute('opacity', String(seg(t, 700, 1800)));
    bridge.setAttribute('opacity', String(seg(t, 1100, 2000)));

    BUILDINGS.forEach((b, i) => {
      const climb = inOut(seg(t, RISE[i][0], RISE[i][1])) * b.top[1];
      reveal[i].setAttribute('y', String(Y(climb) - sw));
      reveal[i].setAttribute('height', String(climb > 0 ? climb * s + sw * 2 : 0));
      if (!leaveAt) {
        const r = r0 * out(seg(t, APPEAR(i), APPEAR(i) + 400));
        dots[i].setAttribute('r', r.toFixed(2));
        dots[i].setAttribute('cx', X(b.top[0]).toFixed(1));
        dots[i].setAttribute('cy', (Y(climb) - r).toFixed(1));
      }
    });

    if (!leaveAt && ((t > HOLD && ready) || t > MAX)) leave(now, 1600);
    if (leaveAt) {
      const p = inOut(seg(now, leaveAt, leaveAt + leaveMs));
      root.style.opacity = String(1 - p);
      dots.forEach((c, i) => {
        const [sx, sy] = from[i], e = to[i];
        // arc down and to the left, toward the headline
        const cx = sx + (e.x - sx) * 0.2, cy = sy + (e.y - sy) * 0.85;
        const u = 1 - p;
        c.setAttribute('cx', (u * u * sx + 2 * u * p * cx + p * p * e.x).toFixed(2));
        c.setAttribute('cy', (u * u * sy + 2 * u * p * cy + p * p * e.y).toFixed(2));
        c.setAttribute('r', (r0 + (e.r - r0) * p).toFixed(2));
      });
      if (p >= 1) return finish();
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
