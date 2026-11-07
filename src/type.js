/* Lettering. Real font outlines (src/vendor/fonts.js), triangulated once and placed on any plane.
 * Options: font, align, sx (width scale), track (letter space, em), off, vertical, lead,
 * shadow {da, db, col, off}: a painted or cast offset copy · extrude {d, col}: raised letters with real sides
 * stroke {w, lc}: outline · hand: a small per-letter wobble, as a sign painter's brush gives. */
(function () {
  const AV = (window.AV = window.AV || {});
  function shapes(g) {
    if (g.t) return g.t;
    g.t = [];
    for (const gr of g[1]) {
      const flat = [], holes = []; let n = 0;
      gr.forEach((c, i) => { if (i) holes.push(n); for (const v of c) flat.push(v / 1000); n += c.length / 2; });
      const idx = AV.earcut(flat, holes.length ? holes : null), pts = [];
      for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
      g.t.push({ idx, pts, cs: gr.map(c => { const q = []; for (let i = 0; i < c.length; i += 2) q.push([c[i] / 1000, c[i + 1] / 1000]); return q; }) });
    }
    return g.t;
  }
  const isCJK = ch => ch.charCodeAt(0) >= 0x3400;
  function fontOf(name, ch) {
    const F = AV.FONTS[name];
    if (F && F.g[ch]) return F;
    return isCJK(ch) ? AV.FONTS.kai : AV.FONTS.oswald;
  }
  function advance(name, ch, em, o) {
    if (ch === ' ') return em * (0.3 + (o.track || 0));
    const F = fontOf(name, ch), g = F.g[ch];
    return (g ? g[0] / 1000 + (o.track || 0) : 0.3) * em * (o.sx || 1);
  }
  const emOf = (name, ch, h) => { const F = fontOf(name, ch); return h / F.cap; };
  AV.typeW = function (str, h, o) {
    o = o || {}; const name = o.font || 'oswald'; let t = 0;
    for (const ch of str) t += advance(name, ch, emOf(name, ch === ' ' ? 'A' : ch, h), o);
    return t;
  };
  // fit a line into a width: condense a little first, then shrink
  AV.typeFit = function (str, h, max, o) {
    o = Object.assign({}, o); const w = AV.typeW(str, h, Object.assign({}, o, { sx: 1 }));
    if (w <= max) return { h, sx: o.sx || 1 };
    const sx = Math.max(o.minSx || 0.72, max / w);
    return sx * w <= max ? { h, sx } : { h: h * max / (w * sx), sx };
  };
  function glyphOn(pl, F, g, ca, cb, em, sx, rot, col, off, o) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const T = q => { const x = q[0] * em * sx, y = (q[1] - F.base) * em; return [ca + x * cr - y * sr, cb + x * sr + y * cr]; };
    for (const s of shapes(g)) {
      const P = s.pts.map(T);
      if (o.shadow) { const sh = o.shadow; for (let i = 0; i < s.idx.length; i += 3) pl.poly([P[s.idx[i]], P[s.idx[i + 1]], P[s.idx[i + 2]]].map(q => [q[0] + sh.da, q[1] + sh.db]), sh.col, { off: off - (sh.off == null ? 0.002 : sh.off), tone: o.tone }); }
      const front = off + (o.extrude ? o.extrude.d : 0);
      for (let i = 0; i < s.idx.length; i += 3) pl.poly([P[s.idx[i]], P[s.idx[i + 1]], P[s.idx[i + 2]]], col, { off: front, tone: o.tone });
      if (o.extrude || o.stroke) for (const c of s.cs) {
        const q = c.map(T);
        for (let i = 0; i < q.length; i++) {
          const a = q[i], b = q[(i + 1) % q.length];
          if (o.extrude) pl.side(a, b, off, front, o.extrude.col, 0.8);
          if (o.stroke) pl.line(a[0], a[1], b[0], b[1], o.stroke.w, { off: front + 0.0005, lc: o.stroke.lc, fade: o.stroke.fade });
        }
      }
    }
  }
  AV.type = function (pl, str, a0, b0, h, col, o) {
    o = o || {}; const name = o.font || 'oswald', off = o.off == null ? 0.004 : o.off, sx = o.sx || 1;
    const rnd = o.hand ? AV.rng(o.seed || str.length * 37 + 11) : null, chars = [...str];
    if (o.vertical) {
      const lead = h * (o.lead || 1.14); let b = b0 - h;
      for (const ch of chars) {
        if (ch !== ' ') {
          const F = fontOf(name, ch), g = F.g[ch], em = h / F.cap, gw = (g[0] / 1000) * em * sx;
          const j = rnd ? (rnd() - 0.5) * o.hand : 0;
          glyphOn(pl, F, g, a0 - gw / 2 + j * h, b + (rnd ? (rnd() - 0.5) * o.hand * h : 0), em, sx, rnd ? (rnd() - 0.5) * o.hand : 0, col, off, o);
        }
        b -= lead;
      }
      return chars.length * lead;
    }
    const total = AV.typeW(str, h, o);
    let a = o.align === 'center' ? a0 - total / 2 : o.align === 'right' ? a0 - total : a0;
    for (const ch of chars) {
      if (ch !== ' ') {
        const F = fontOf(name, ch), g = F.g[ch], em = h / F.cap;
        if (g) glyphOn(pl, F, g, a, b0 + (rnd ? (rnd() - 0.5) * o.hand * h : 0), em * (rnd ? 1 + (rnd() - 0.5) * o.hand * 0.6 : 1), sx, rnd ? (rnd() - 0.5) * o.hand : 0, col, off, o);
      }
      a += advance(name, ch, emOf(name, ch === ' ' ? 'A' : ch, h), o);
    }
    return total;
  };
})();
