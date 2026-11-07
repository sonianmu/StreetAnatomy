/* Signs, built the way sign shops build them. Five constructions rather than one coloured rectangle:
 * painted board · lit acrylic box · raised channel letters · gilt glass · vinyl banner. Plus projecting blades on steel arms.
 * Lettering always mixes a Chinese face and a Latin face chosen for that shop. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;

  function letter(pl, sp, a0, a1, b0, b1, style, tc) {
    const lift = style === 'backlit' ? 0.007 : 0.003;   // always clear of the face behind it
    const span = a1 - a0, H = b1 - b0, cx = (a0 + a1) / 2, cn = sp.cn, en = sp.en;
    const fc = sp.fc || 'ming', fe = sp.fe || 'oswald', hand = sp.hand;
    const fx = style === 'channel' ? { extrude: { d: 0.05, col: sp.side || 'goldD' }, shadow: { da: 0.016, db: -0.022, col: 'sgnK', off: 0 } }
      : style === 'painted' ? { shadow: { da: 0.012, db: -0.014, col: sp.sc || 'sgnK', off: 0.0012 }, hand: hand == null ? 0.018 : hand }
        : style === 'vinyl' ? {} : {};
    const put = (s, f, cxx, b, h, col, max, extra) => {
      const m = AV.typeFit(s, h, max, Object.assign({ font: f }, extra));
      AV.type(pl, s, cxx, b + (h - m.h) * 0.5, m.h, col, Object.assign({ font: f, align: 'center', sx: m.sx, off: lift }, fx, extra));
    };
    if (cn && en && (sp.layout === 'row' || (span / H > 7 && sp.layout !== 'stack'))) {
      const hc = H * 0.72, wc = Math.min(AV.typeW(cn, hc, { font: fc }), span * 0.58), gap = span * 0.04, wE = span - wc - gap;
      const cnFirst = sp.enFirst ? 0 : 1;
      const c1 = cnFirst ? a0 + wc / 2 : a1 - wc / 2, c2 = cnFirst ? a0 + wc + gap + wE / 2 : a0 + wE / 2;
      put(cn, fc, c1, b0 + H * 0.13, hc, tc, wc, { track: 0.06 });
      put(en, fe, c2, b0 + H * 0.28, H * 0.42, sp.tc2 || tc, wE, { track: 0.03 });
    } else if (cn && en) {
      const hc = H * 0.54, he = H * 0.2;
      put(cn, fc, cx, b0 + H * 0.34, hc, tc, span, { track: 0.1 });
      put(en, fe, cx, b0 + H * 0.06, he, sp.tc2 || tc, span, { track: 0.04 });
    } else if (cn) put(cn, fc, cx, b0 + H * 0.14, H * 0.72, tc, span, { track: 0.12 });
    else if (en) put(en, fe, cx, b0 + H * 0.2, H * 0.6, tc, span, { track: 0.02 });
  }

  // A sign over a shop. u along the wall from a to b, y0..y1, face stands off `f` from the wall.
  AV.fascia = function (w, a, b, y0, y1, f, sp, lod) {
    const K = w.K, style = sp.style || 'painted', col = sp.col || 'stBlack', tc = sp.tc || 'gold';
    const cu = (a + b) / 2, span = b - a, A = -span / 2, B = span / 2;
    if (style === 'backlit') {
      // an aluminium box with an acrylic face slightly inset, seams every sheet, and the fixings showing
      w.box(a, y0, b, y1, 0, f, 'alum', { ink: W.F, us: 0.6 });
      if (lod >= 2) { w.r(a + 0.05, y0 + 0.05, b - 0.05, y1 - 0.05, f + 0.002, col); return; }
      const pl = w.pl(cu, f);
      pl.rect(A + 0.05, y0 + 0.05, B - 0.05, y1 - 0.05, col, { off: 0.002, ink: W.D });
      if (sp.band) { pl.rect(A + 0.05, y0 + 0.05, B - 0.05, y0 + (y1 - y0) * 0.26, sp.band, { off: 0.0028 }); }
      const n = Math.max(1, Math.round(span / 2.4));
      for (let i = 1; i < n; i++) { const q = A + (span * i) / n; pl.line(q, y0 + 0.05, q, y1 - 0.05, W.H, { off: 0.004, fade: 0.14, lc: 'inkG' }); }
      letter(pl, sp, A + 0.16, B - 0.16, y0 + 0.07, y1 - 0.07, style, tc);
      for (let q = A + 0.3; q < B - 0.2; q += 0.9) for (const y of [y0 + 0.024, y1 - 0.024]) pl.disc(q, y, 0.008, 0.008, 'inkG', { off: 0.001, seg: 5 });
      return;
    }
    if (style === 'vinyl') {
      // a printed banner lashed over an older sign board: grommets, cord, creases
      w.box(a, y0, b, y1, 0, f, 'wood', { ink: W.D });
      if (lod >= 2) { w.r(a + 0.06, y0 + 0.06, b - 0.06, y1 - 0.04, f + 0.002, col); return; }
      const pl = w.pl(cu, f);
      const sag = 0.018, m = 8, top = [], bot = [];
      for (let i = 0; i <= m; i++) { const t = i / m, x = A + 0.08 + (span - 0.16) * t; top.push([x, y1 - 0.05 - Math.sin(t * Math.PI) * sag]); bot.push([x, y0 + 0.05 + Math.sin(t * Math.PI) * sag * 0.6]); }
      pl.poly(top.concat(bot.reverse()), col, { off: 0.004, concave: true, ink: W.D });
      const rc = AV.rng(span * 100 | 0);
      for (let i = 0; i < 7; i++) { const x = A + 0.3 + rc() * (span - 0.6), y = y0 + 0.1 + rc() * (y1 - y0 - 0.25); pl.line(x, y, x + 0.14 + rc() * 0.25, y - 0.05 + rc() * 0.1, W.H, { off: 0.0055, fade: 0.16, lc: 'inkG' }); }
      for (let i = 0; i <= 4; i++) { const x = A + 0.12 + ((span - 0.24) * i) / 4; pl.disc(x, y1 - 0.09, 0.016, 0.016, 'alum', { off: 0.0055, seg: 8 }); pl.disc(x, y0 + 0.09, 0.016, 0.016, 'alum', { off: 0.0055, seg: 8 }); }
      letter({ poly: (q, c, o) => pl.poly(q, c, Object.assign({}, o, { off: (o.off || 0) + 0.004 })), line: pl.line, side: pl.side }, sp, A + 0.22, B - 0.22, y0 + 0.13, y1 - 0.14, style, tc);
      return;
    }
    // a timber board with its moulding (painted, gilt and channel letters all start from this)
    w.box(a, y0, b, y1, 0, f, col, { ink: W.F, us: 0.62 });
    if (lod >= 2) return;
    const pl = w.pl(cu, f);
    const ins = 0.07;
    if (style === 'gilt') {
      pl.pline([[A + ins, y0 + ins], [B - ins, y0 + ins], [B - ins, y1 - ins], [A + ins, y1 - ins]], true, W.D, { off: 0.002, lc: tc, fade: 0.07 });
      pl.pline([[A + ins + 0.035, y0 + ins + 0.035], [B - ins - 0.035, y0 + ins + 0.035], [B - ins - 0.035, y1 - ins - 0.035], [A + ins + 0.035, y1 - ins - 0.035]], true, W.H, { off: 0.002, lc: tc, fade: 0.14 });
    } else if (style === 'painted') {
      w.box(a, y0, b, y0 + 0.05, f, f + 0.025, col, { ink: W.H, fs: 0.82 }); w.box(a, y1 - 0.05, b, y1, f, f + 0.025, col, { ink: W.H, fs: 1.1 });
      pl.pline([[A + ins, y0 + ins + 0.02], [B - ins, y0 + ins + 0.02], [B - ins, y1 - ins - 0.02], [A + ins, y1 - ins - 0.02]], true, W.H, { off: 0.002, lc: sp.line || tc, fade: 0.12 });
    }
    letter(pl, sp, A + 0.2, B - 0.2, y0 + 0.1, y1 - 0.1, style, tc);
  };

  // Lettering stuck on the inside of an upper-floor window
  AV.glassLetter = function (w, a, b, y, f, cn, en, col) {
    const pl = w.pl((a + b) / 2, f), span = b - a - 0.16;
    if (cn) { const m = AV.typeFit(cn, 0.22, span, { font: 'kai' }); AV.type(pl, cn, 0, y + 0.2, m.h, col, { font: 'kai', align: 'center', sx: m.sx, off: 0 }); }
    if (en) { const m = AV.typeFit(en, 0.085, span, { font: 'elite' }); AV.type(pl, en, 0, y + 0.06, m.h, col, { font: 'elite', align: 'center', sx: m.sx, off: 0 }); }
  };

  // A projecting double-faced sign, the thing that gives this street its stacked look.
  // Hangs from a steel arm with a tie rod, clear of everything fixed to the wall.
  AV.bladeSign = function (K, s, z, sp) {
    K.begin('blade@' + s + ',' + z);
    const X = AV.G.HW, stand = sp.stand == null ? 0.48 : sp.stand, wid = sp.wid || 0.82, top = sp.top, cn = sp.cn || '', fc = sp.fc || 'hei';
    const vert = sp.h || (cn.length * (sp.lh || 0.62) + 0.26), y0 = top - vert;
    const x0 = s * (X - stand), x1 = s * (X - stand - wid), a = Math.min(x0, x1), b = Math.max(x0, x1), cx = (a + b) / 2, col = sp.col || 'lacq', frame = sp.frame || 'alum';
    if (s > 0) K.castPoly([[x0, y0, z], [x1, y0, z], [x1, top, z], [x0, top, z]]);
    K.tone = s < 0 ? 'shade' : 'dim';
    // arms from the wall, top and bottom, and a tie rod up to the wall
    for (const y of [top - 0.12, y0 + 0.12]) { K.box(Math.min(s * X, x0), y - 0.018, z - 0.018, Math.max(s * X, x0), y + 0.018, z + 0.018, 'rail', { ink: W.H, fade: 0.05 }); }
    K.line([x0, top, z], [s * X, top + 0.8, z], W.D, { fade: 0.05, lc: 'rail' });
    K.line([(x0 + x1) / 2, top, z], [s * X, top + 0.8, z], W.H, { fade: 0.07, lc: 'rail' });
    K.box(a, y0, z - 0.09, b, top, z + 0.09, frame, { ink: W.F, fade: 0.03, front: frame });
    K.tone = 'none';
    const tn = s < 0 ? 'shade' : 'dim';
    const pl = K.plane([cx, 0, z - 0.091], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    pl.rect(a - cx + 0.035, y0 + 0.035, b - cx - 0.035, top - 0.035, col, { off: 0.001, ink: W.H, tone: sp.lit ? 'none' : tn });
    if (sp.border) pl.pline([[a - cx + 0.075, y0 + 0.075], [b - cx - 0.075, y0 + 0.075], [b - cx - 0.075, top - 0.075], [a - cx + 0.075, top - 0.075]], true, W.H, { off: 0.003, lc: sp.border, fade: 0.1 });
    if (z < 130) {
      const h = Math.min(sp.lh ? sp.lh * 0.82 : 0.5, (wid - 0.2) * 1.0);
      AV.type(pl, cn, 0, top - 0.13, h, sp.tc || 'gold', { font: fc, vertical: true, lead: (sp.lh || 0.62) / h, off: 0.003, tone: sp.lit ? 'none' : tn, hand: sp.hand });
      if (sp.en) { const m = AV.typeFit(sp.en, 0.1, wid - 0.16, { font: sp.fe || 'oswald' }); AV.type(pl, sp.en, 0, y0 + 0.07, m.h, sp.tc2 || sp.tc || 'gold', { font: sp.fe || 'oswald', align: 'center', sx: m.sx, off: 0.003, tone: tn }); }
    } else {
      // too far to letter: a stroke of the same colour reads the way distant lettering does
      for (let y = top - 0.25; y > y0 + 0.2; y -= 0.5) pl.rect(-0.2, y - 0.22, 0.2, y, sp.tc || 'gold', { off: 0.003, tone: tn });
    }
    K.end();
  };

  // A board on an upper floor, standing clear of the window trim on two steel brackets
  AV.wallBoard = function (w, a, b, y0, y1, sp, lod) {
    w.K.begin('board@' + a);
    const f = 0.34;
    for (const u of [a + 0.25, b - 0.25]) for (const y of [y0 + 0.1, y1 - 0.1]) w.box(u - 0.02, y - 0.02, u + 0.02, y + 0.02, 0, f, 'rail', { ink: W.H, fade: 0.06 });
    w.K.push();
    AV.fascia(new Standoff(w, f), a, b, y0, y1, 0.05, sp, lod);
    w.K.pop();
    w.K.end();
  };
  class Standoff {
    constructor(w, f) { this.w = w; this.f = f; this.K = w.K; }
    box(u0, y0, u1, y1, a, b, c, o) { this.w.box(u0, y0, u1, y1, a + this.f, b + this.f, c, o); return this; }
    r(u0, y0, u1, y1, f, c, o) { this.w.r(u0, y0, u1, y1, f + this.f, c, o); return this; }
    pl(cu, f) { return this.w.pl(cu, f + this.f); }
  }
})();
