/* New York building fronts, drawn the way a draughtsman builds an elevation: real shallow relief on one plane.
 * A Wall is a plane with coordinates (u along the frontage, y up, off out toward the street), so the same
 * generators draw the two sides of the street and the buildings that face the viewer at the far end.
 * lod 0: near, every course of brick · lod 1: windows and trim · lod 2: far, a floor reads as one band. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;

  class Wall {
    constructor(K, o, U, out, tdir) { this.K = K; this.o = o; this.U = U; this.out = out; this.tdir = tdir == null ? 1 : tdir; }
    P(u, y, f) { f = f || 0; const o = this.o, U = this.U, N = this.out; return [o[0] + U[0] * u + N[0] * f, y, o[2] + U[2] * u + N[2] * f]; }
    r(u0, y0, u1, y1, f, col, o) { this.K.face([this.P(u0, y0, f), this.P(u1, y0, f), this.P(u1, y1, f), this.P(u0, y1, f)], col, o); return this; }
    poly(ab, f, col, o) { o = o || {}; const a = Object.assign({}, o, { holes: o.holes ? o.holes.map(h => h.map(q => this.P(q[0], q[1], f))) : undefined }); this.K.face(ab.map(q => this.P(q[0], q[1], f)), col, a); return this; }
    l(u0, y0, u1, y1, f, w, o) { this.K.line(this.P(u0, y0, f), this.P(u1, y1, f), w, o); return this; }
    // a projecting block: front at off b, back at off a
    box(u0, y0, u1, y1, a, b, col, o) {
      o = o || {}; const K = this.K, ink = o.ink == null ? W.D : o.ink, t = o.tone;
      K.face([this.P(u0, y0, b), this.P(u1, y0, b), this.P(u1, y1, b), this.P(u0, y1, b)], col, { ink, tone: t, lc: o.lc, fade: o.fade, shade: o.fs });
      K.face([this.P(u0, y0, a), this.P(u1, y0, a), this.P(u1, y0, b), this.P(u0, y0, b)], o.under || col, { ink, tone: t, lc: o.lc, fade: o.fade, shade: o.us == null ? 0.62 : o.us });
      if (!o.noTop) K.face([this.P(u0, y1, a), this.P(u1, y1, a), this.P(u1, y1, b), this.P(u0, y1, b)], col, { ink, tone: t, lc: o.lc, fade: o.fade, shade: 1.08 });
      K.face([this.P(u0, y0, a), this.P(u0, y1, a), this.P(u0, y1, b), this.P(u0, y0, b)], col, { ink, tone: t, lc: o.lc, fade: o.fade, shade: 0.8 });
      K.face([this.P(u1, y0, a), this.P(u1, y1, a), this.P(u1, y1, b), this.P(u1, y0, b)], col, { ink, tone: t, lc: o.lc, fade: o.fade, shade: 0.8 });
      return this;
    }
    text(str, u, y, h, f, col, o) {
      o = Object.assign({ align: 'center', off: 0 }, o);
      const pl = this.K.plane(this.P(u, 0, f), [this.U[0] * this.tdir, 0, this.U[2] * this.tdir], [0, 1, 0], this.out);
      pl.text(str, 0, y, h, col, o); return this;
    }
    // a lettering plane centred at cu: a reads left to right from the street, b is height
    pl(cu, f) { return this.K.plane(this.P(cu, 0, f), [this.U[0] * this.tdir, 0, this.U[2] * this.tdir], [0, 1, 0], this.out); }
    // world z of a point on this wall (for scale decisions)
    zAt(u) { return this.o[2] + this.U[2] * u; }
  }
  AV.Wall = Wall;

  function courses(w, u0, y0, u1, y1, f, rnd, lod, pitch) {
    if (lod > 0 || u1 - u0 < 0.05 || y1 - y0 < 0.05) return;
    pitch = pitch || 0.3;
    const start = Math.ceil(y0 / pitch) * pitch;
    for (let y = start; y < y1 - 0.01; y += pitch) {
      w.l(u0, y, u1, y, f + 0.002, W.H, { lc: 'inkG', lineOnly: true });
      for (let u = u0 + 0.25 + rnd() * 0.5; u < u1 - 0.05; u += 0.55 + rnd() * 0.95) w.l(u, y, u, Math.min(y + pitch, y1), f + 0.002, W.H, { lc: 'inkG', lineOnly: true });
    }
  }

  // Shadow cast on the wall below a ledge: a flat, slightly darker shape, as a colourist would lay it in
  function ledgeShadow(w, u0, u1, y, drop, f, col, sh) { w.r(u0, y - drop, u1, y, f + 0.002, col, { shade: sh || 0.8 }); }
  // Water run off a sill or a ledge: a narrow tapering shape that starts at that ledge and dies out down the wall
  function runoff(w, a, b, y, len, col, rnd) {
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const c = a + (b - a) * (0.1 + rnd() * 0.8), hw = 0.022 + rnd() * 0.035, L = len * (0.5 + rnd() * 0.5), e = (rnd() - 0.5) * 0.02;
      w.poly([[c - hw, y], [c + hw, y], [c + hw * 0.8, y - L * 0.7], [c + e + 0.006, y - L], [c + e - 0.006, y - L], [c - hw * 0.8, y - L * 0.7]], 0.0024, col, { shade: 0.93 + rnd() * 0.03, concave: true });
    }
  }

  // A double-hung window as joiners build it: frame in the reveal, upper sash on the outer track, lower sash on the inner,
  // real panes you see through, a blind hanging behind them, and a dark room behind that. An air conditioner holds the lower sash up.
  function sash(w, u0, y0, u1, y1, o) {
    const rnd = o.rnd, lod = o.lod, d = o.d || 0.14, fc = o.frame || 'frame', K = w.K, rc = o.wall || 'reveal', back = -d - 0.1;
    const h = y1 - y0, wd = u1 - u0, t = 0.045, mid0 = y0 + h * 0.5, hasAC = o.ac && lod <= 1, lift = hasAC ? 0.38 : (rnd() < 0.14 ? 0.12 + rnd() * 0.5 : 0), f0 = -d, fU = -d + 0.012, fL = -d - 0.022;
    w.r(u0, y0, u1, y1, back, 'roomD');
    K.face([w.P(u0, y1, 0), w.P(u1, y1, 0), w.P(u1, y1, back), w.P(u0, y1, back)], rc, { shade: 0.5, ink: W.D });
    K.face([w.P(u0, y0, 0), w.P(u1, y0, 0), w.P(u1, y0, back), w.P(u0, y0, back)], 'sillD', { shade: 0.9, ink: W.D });
    K.face([w.P(u0, y0, 0), w.P(u0, y1, 0), w.P(u0, y1, back), w.P(u0, y0, back)], rc, { shade: 0.74, ink: W.D });
    K.face([w.P(u1, y0, 0), w.P(u1, y1, 0), w.P(u1, y1, back), w.P(u1, y0, back)], rc, { shade: 0.74, ink: W.D });
    // the blind hangs in the room, behind the glass
    const r = rnd();
    if (r < 0.62) {
      const b = mid0 + (y1 - mid0) * (r < 0.28 ? 0 : 0.2 + rnd() * 0.7) - (r < 0.1 ? h * 0.22 : 0), fb = -d - 0.05, col = r < 0.36 ? 'blind' : 'curtain';
      w.r(u0 + t, b, u1 - t, y1 - t, fb, col);
      if (lod === 0) { w.box(u0 + t, b - 0.018, u1 - t, b, fb, fb + 0.012, col, { ink: W.H, fs: 0.8 }); w.l((u0 + u1) / 2, b - 0.09, (u0 + u1) / 2, b - 0.018, fb + 0.006, W.H, { fade: 0.14 }); }
      else w.l(u0 + t, b, u1 - t, b, fb + 0.004, W.D);
    }
    const low0 = y0 + lift, low1 = mid0 + lift + 0.02;
    if (lod >= 2) return;
    // the frame, then each sash: stiles, rails, panes. Top rail narrow, bottom rail deep, as they are.
    const bar = (a, b, c, e, f, thick) => { if (lod === 0) w.box(a, b, c, e, f - thick, f, fc, { ink: W.H, fade: 0.12 }); else w.r(a, b, c, e, f, fc); };
    bar(u0, y1 - 0.03, u1, y1, f0 + 0.02, 0.05); bar(u0, y0, u1, y0 + 0.03, f0 + 0.02, 0.05); bar(u0, y0, u0 + 0.025, y1, f0 + 0.02, 0.05); bar(u1 - 0.025, y0, u1, y1, f0 + 0.02, 0.05);
    const sa = (yb, yt, f, bot, type) => {
      const a = u0 + 0.025, b = u1 - 0.025, s = 0.035, tp = 0.035;
      K.glass([w.P(a + s, yb + bot, f - 0.008), w.P(b - s, yb + bot, f - 0.008), w.P(b - s, yt - tp, f - 0.008), w.P(a + s, yt - tp, f - 0.008)], 1);
      bar(a, yb, a + s, yt, f, 0.016); bar(b - s, yb, b, yt, f, 0.016); bar(a, yt - tp, b, yt, f, 0.016); bar(a, yb, b, yb + bot, f, 0.016);
      if (lod <= 1) w.K.pline([w.P(a + s, yb + bot, f + 0.001), w.P(b - s, yb + bot, f + 0.001), w.P(b - s, yt - tp, f + 0.001), w.P(a + s, yt - tp, f + 0.001)], true, W.H, { fade: 0.11 });
      return [a + s, b - s, yb + bot, yt - tp];
    };
    const up = sa(mid0 - 0.02, y1 - 0.03, fU, 0.03);
    const lo = sa(low0 + 0.03, low1, fL, 0.06);
    if (lod === 0) {   // lift handles and the sash lock on the meeting rail
      for (const q of [0.28, 0.72]) w.box(u0 + wd * q - 0.03, low0 + 0.05, u0 + wd * q + 0.03, low0 + 0.075, fL, fL + 0.015, 'chromeL', { ink: 0 });
      w.box((u0 + u1) / 2 - 0.025, low1 - 0.03, (u0 + u1) / 2 + 0.025, low1 - 0.015, fL, fL + 0.012, 'chromeL', { ink: 0 });
    }
    if (o.lights) { const n = o.lights; for (let i = 1; i < n; i++) { const q = up[0] + ((up[1] - up[0]) * i) / n; w.l(q, up[2], q, up[3], fU + 0.002, W.H, { lc: 'inkL', fade: 0.14 }); } w.l(up[0], (up[2] + up[3]) / 2, up[1], (up[2] + up[3]) / 2, fU + 0.002, W.H, { lc: 'inkL', fade: 0.14 }); }
    if (hasAC) {
      // the unit sits on the sill, half in the room; side curtains fill the opening, a bracket and a rust run below it
      const ay = y0 + 0.02, a0 = u0 + wd * 0.12, a1 = u1 - wd * 0.12, out = 0.28, ah = 0.37;
      w.box(a0, ay, a1, ay + ah, back, out, 'ac', { ink: W.D, us: 0.6 });
      for (const [p, q] of [[u0 + 0.03, a0], [a1, u1 - 0.03]]) { w.r(p, ay, q, ay + ah, fL + 0.002, 'ac', { shade: 0.85 }); if (lod === 0) for (let u = p + 0.025; u < q; u += 0.025) w.l(u, ay, u, ay + ah, fL + 0.003, W.H, { lc: 'inkG', fade: 0.18 }); }
      if (lod === 0) {
        for (let i = 1; i < 11; i++) { const yy = ay + 0.03 + i * 0.022; w.l(a0 + 0.04, yy, a1 - 0.04, yy, out + 0.002, W.H, { fade: 0.13 }); }
        w.r(a0 + 0.04, ay + 0.03, a1 - 0.04, ay + 0.05, out + 0.001, 'steelD');
        for (let f = 0.02; f < out - 0.02; f += 0.03) for (const u of [a0, a1]) w.l(u, ay + 0.06, u, ay + ah - 0.03, f, W.H, { lc: 'inkG', fade: 0.16 });
        for (const u of [a0 + 0.1, a1 - 0.1]) K.tube(w.P(u, y0 - 0.26, 0.002), w.P(u, ay - 0.002, out - 0.04), 0.008, 'steelD', { seg: 4 });
        w.poly([[(a0 + a1) / 2 - 0.05, y0 - 0.16], [(a0 + a1) / 2 + 0.05, y0 - 0.16], [(a0 + a1) / 2 + 0.03, y0 - 0.7], [(a0 + a1) / 2 - 0.03, y0 - 0.7]], 0.0026, o.wall || 'brickD', { shade: 0.8 });
      } else for (let i = 1; i < 5; i++) w.l(a0 + 0.02, ay + i * 0.075, a1 - 0.02, ay + i * 0.075, out + 0.002, W.H, { fade: 0.13 });
    }
  }

  // ---- ground-floor shop, one of the richest pieces of an NYC street
  function storefront(w, u0, u1, H, o) {
    const K = w.K, rnd = o.rnd, lod = o.lod, fc = o.fc || 'stFrame', wall = o.mat.base || 'stCream';
    const span = u1 - u0;
    // fascia + moulding, pilasters
    const Y0 = AV.G.CURB, fy0 = H - (o.signH || 1.02);
    w.box(u0, 0, u0 + 0.34, H, 0, 0.1, wall, { ink: W.F, noTop: true });
    w.box(u1 - 0.34, 0, u1, H, 0, 0.1, wall, { ink: W.F, noTop: true });
    if (lod <= 1) for (const u of [u0, u1 - 0.34]) { w.box(Math.max(u0, u - 0.02), Y0, Math.min(u1, u + 0.36), Y0 + 0.5, 0.1, 0.14, wall, { ink: W.D }); w.box(Math.max(u0, u - 0.02), Y0, Math.min(u1, u + 0.36), Y0 + 0.14, 0.14, 0.17, 'sillD', { ink: W.D, fs: 0.82 }); w.box(Math.max(u0, u - 0.03), fy0 - 0.2, Math.min(u1, u + 0.37), fy0, 0.1, 0.16, wall, { ink: W.D }); for (const q of [0.11, 0.23]) w.l(u + q, Y0 + 0.55, u + q, fy0 - 0.25, 0.102, W.H, { fade: 0.16 }); }
    const a = u0 + 0.34, b = u1 - 0.34;
    AV.fascia(w, a, b, fy0, H - 0.14, 0.1, o.spec || {}, lod);
    w.box(u0, H - 0.14, u1, H, 0, 0.2, wall, { ink: W.F });
    // closed shops wear the roll-down gate that every New Yorker knows
    if (o.gate) {
      K.face([w.P(a, 0, -0.05), w.P(b, 0, -0.05), w.P(b, fy0, -0.05), w.P(a, fy0, -0.05)], 'gate', { ink: W.F });
      w.box(a, Y0, b, Y0 + 0.07, -0.05, -0.015, 'rail', { ink: W.D });   // the bottom bar, padlocked to the pavement
      if (lod === 0) for (const t of [0.28, 0.72]) { const u = a + (b - a) * t; w.box(u - 0.05, Y0, u + 0.05, Y0 + 0.1, -0.015, 0.02, 'pole', { ink: W.H }); }
      if (lod <= 1) for (let y = 0.1; y < fy0 - 0.02; y += lod === 0 ? 0.1 : 0.3) w.l(a, y, b, y, -0.045, W.H, { fade: 0.11 });
      if (lod === 0) {   // what a closed gate always collects: a tag or two, and a paper notice
        const pl = w.pl((a + b) / 2, -0.04), tags = ['REKS', 'ZOOM', 'NOBLE'];
        AV.type(pl, tags[Math.floor(rnd() * 3)], (rnd() - 0.5) * 0.5, 0.6 + rnd() * 0.4, 0.34, rnd() < 0.5 ? 'sgnK' : 'stRed', { font: 'pacifico', align: 'center', off: 0, hand: 0.05 });
        pl.rect(-0.2, 1.75, 0.22, 2.3, 'paper', { off: 0.001, ink: W.H, fade: 0.14 }); AV.type(pl, '招租', 0.01, 2.0, 0.14, 'lacq', { font: 'hand', align: 'center', off: 0.002 }); pl.text('555-0173', 0.01, 1.83, 0.05, 'sgnK', { align: 'center', off: 0.002, font: 'elite' });
      }
      w.box(a, fy0 - 0.3, b, fy0, -0.05, 0.05, 'gate', { ink: W.D, fs: 0.85 });
      return;
    }
    // transom, glass, bulkhead; door recessed at one end
    const d = 0.34, gy0 = 0.82, gy1 = fy0 - 0.5, dw = 1.0, du0 = o.doorAt === 1 ? b - dw - 0.06 : a + 0.06;
    // bulkhead under the glass, broken by the recessed door
    for (const [p, q] of o.doorAt === 1 ? [[a, du0]] : [[du0 + dw, b]]) {
      w.r(p, 0, q, gy0, -0.02, wall); w.l(p, gy0, q, gy0, -0.015, W.F);
      w.box(p, Y0, q, Y0 + 0.13, -0.02, 0.012, 'stFrame', { ink: W.D, fs: 0.9 });   // kick plate where the shop meets the pavement
      if (lod <= 1 && q - p > 0.8) { const n = Math.max(1, Math.round((q - p) / 1.35)); for (let i = 0; i < n; i++) { const x0 = p + ((q - p) * i) / n + 0.09, x1 = p + ((q - p) * (i + 1)) / n - 0.09; w.K.pline([w.P(x0, Y0 + 0.2, -0.016), w.P(x1, Y0 + 0.2, -0.016), w.P(x1, gy0 - 0.08, -0.016), w.P(x0, gy0 - 0.08, -0.016)], true, W.H, { fade: 0.14 }); } }
    }
    w.K.face([w.P(o.doorAt === 1 ? du0 : du0 + dw, 0, -0.02), w.P(o.doorAt === 1 ? du0 : du0 + dw, gy0, -0.02), w.P(o.doorAt === 1 ? du0 : du0 + dw, gy0, -d), w.P(o.doorAt === 1 ? du0 : du0 + dw, 0, -d)], wall, { shade: 0.75, ink: W.D });
    const K0 = K;
    // the jambs of the opening carry on down to the pavement, so nothing beyond the lot shows past the door
    for (const u of [a, b]) K.face([w.P(u, 0, 0), w.P(u, gy0, 0), w.P(u, gy0, -d), w.P(u, 0, -d)], wall, { shade: 0.75 });
    // reveal around the opening
    K0.face([w.P(a, fy0, 0), w.P(b, fy0, 0), w.P(b, fy0, -d), w.P(a, fy0, -d)], 'reveal', { shade: 0.55, ink: W.D });
    K0.face([w.P(a, gy0, 0), w.P(a, fy0, 0), w.P(a, fy0, -d), w.P(a, gy0, -d)], 'reveal', { ink: W.D });
    K0.face([w.P(b, gy0, 0), w.P(b, fy0, 0), w.P(b, fy0, -d), w.P(b, gy0, -d)], 'reveal', { ink: W.D });
    K0.face([w.P(a, gy0, -0.02), w.P(b, gy0, -0.02), w.P(b, gy0, -d), w.P(a, gy0, -d)], 'sillD', { ink: W.D });
    const kindI = o.inside || ['shelves', 'posters', 'rack', 'blind', 'crates'][Math.floor(rnd() * 5)];
    if (lod === 0) shopRoom(w, a, b, gy0, fy0, d, Y0, kindI, rnd);
    else {
    w.r(a, gy0, b, fy0, -d, 'shop');
    w.r(a + 0.05, gy1 - 0.42, b - 0.05, gy1 - 0.02, -d + 0.003, 'shopIn', { shade: 0.9 });
    if (lod <= 1) for (const y of [gy1 - 0.12, gy1 - 0.3]) for (let u = a + 0.18; u < b - 0.9; u += 1.5) w.r(u, y - 0.018, u + 1.2, y + 0.018, -d + 0.005, 'tubeL');
    interior(w, a, b, gy0, gy1 - 0.42, -d, kindI, rnd, lod);
    }
    // mullions and transom bar
    const n = Math.max(2, Math.round((b - a) / 1.35));
    const bar = (u0_, u1_, y0_, y1_) => { w.r(u0_, y0_, u1_, y1_, -d + 0.03, fc, { ink: W.D }); };
    bar(a, b, gy1, gy1 + 0.07);
    for (let i = 0; i <= n; i++) { const u = a + ((b - a) * i) / n; const x0 = Math.max(a, u - 0.035), x1 = Math.min(b, u + 0.035); bar(x0, x1, gy0, fy0); }
    // transom lights
    if (lod <= 1) { const tn = n * 3; for (let i = 1; i < tn; i++) { if (i % 3 === 0) continue; const u = a + ((b - a) * i) / tn; w.l(u, gy1 + 0.07, u, fy0, -d + 0.03, W.D, { fade: 0.11 }); } }
    // door
    if (lod === 0) {
      // a real door: a frame of stiles and rails round a sheet of glass, kick panel below, closer above, a push bar
      const f = -d + 0.05, dy0 = Y0 + 0.035, x0 = du0, x1 = du0 + dw;
      for (const [p, q, g, e] of [[x0, dy0, x0 + 0.08, gy1], [x1 - 0.08, dy0, x1, gy1], [x0, gy1 - 0.08, x1, gy1], [x0, dy0, x1, dy0 + 0.34]]) w.box(p, q, g, e, f - 0.04, f, fc, { ink: W.D });
      K.glass([w.P(x0 + 0.08, dy0 + 0.34, f - 0.02), w.P(x1 - 0.08, dy0 + 0.34, f - 0.02), w.P(x1 - 0.08, gy1 - 0.08, f - 0.02), w.P(x0 + 0.08, gy1 - 0.08, f - 0.02)], 0);
      K.glass([w.P(a, gy0, -d + 0.028), w.P(Math.max(a, du0), gy0, -d + 0.028), w.P(Math.max(a, du0), fy0, -d + 0.028), w.P(a, fy0, -d + 0.028)], 0);
      K.glass([w.P(Math.min(b, du0 + dw), gy0, -d + 0.028), w.P(b, gy0, -d + 0.028), w.P(b, fy0, -d + 0.028), w.P(Math.min(b, du0 + dw), fy0, -d + 0.028)], 0);
      K.glass([w.P(du0, gy1 + 0.07, -d + 0.028), w.P(du0 + dw, gy1 + 0.07, -d + 0.028), w.P(du0 + dw, fy0, -d + 0.028), w.P(du0, fy0, -d + 0.028)], 0);
      w.r(x0 + 0.1, dy0 + 0.06, x1 - 0.1, dy0 + 0.28, f + 0.001, 'alum');
      K.tube(w.P(x0 + 0.12, dy0 + 0.98, f + 0.05), w.P(x1 - 0.12, dy0 + 0.98, f + 0.05), 0.013, 'chrome', { seg: 6, sil: W.H, caps: true });
      for (const u of [x0 + 0.2, x1 - 0.2]) K.tube(w.P(u, dy0 + 0.98, f), w.P(u, dy0 + 0.98, f + 0.05), 0.01, 'chrome', { seg: 5 });
      w.box(x1 - 0.42, gy1 - 0.07, x1 - 0.1, gy1 - 0.015, f, f + 0.05, 'steelD', { ink: W.H });
    } else {
    w.r(du0, 0, du0 + dw, gy1, -d + 0.05, fc, { ink: W.F });
    w.r(du0 + 0.08, 0.38, du0 + dw - 0.08, gy1 - 0.08, -d + 0.054, 'shop', { ink: W.D, shade: 0.9 });
    if (lod <= 1) { w.l(du0 + dw - 0.17, 0.9, du0 + dw - 0.17, 1.28, -d + 0.1, W.F, { lc: 'inkL' }); w.l(du0 + 0.08, 0.2, du0 + dw - 0.08, 0.2, -d + 0.054, W.H); }
    }
    // the sill step in front of the door
    w.box(du0, Y0, du0 + dw, Y0 + 0.035, -d, 0.03, 'sillD', { ink: W.D });
    // the tiled floor of the recessed entry, with a border and the shop's door mat
    { const ey = Y0 + 0.037; K.face([w.P(du0, ey, -d), w.P(du0 + dw, ey, -d), w.P(du0 + dw, ey, 0.028), w.P(du0, ey, 0.028)], 'tileF', {});
      K.face([w.P(du0 + 0.2, ey + 0.002, -d + 0.04), w.P(du0 + dw - 0.2, ey + 0.002, -d + 0.04), w.P(du0 + dw - 0.2, ey + 0.002, -d + 0.26), w.P(du0 + 0.2, ey + 0.002, -d + 0.26)], 'matD', {}); }
    // paper signs taped inside the glass, the shop talking to the street
    if (lod === 0 && o.notes) o.notes.forEach((nt, i) => {
      const nw = nt.w || 0.56, nh = nt.h || 0.62, cu = a + (b - a) * (nt.at == null ? 0.2 + 0.26 * i : nt.at), y = gy0 + (nt.y == null ? 0.42 : nt.y);
      const pl = w.pl(cu, -d + 0.018);
      pl.rect(-nw / 2, y, nw / 2, y + nh, nt.c || 'papY', { off: 0, ink: W.H, fade: 0.14 });
      AV.type(pl, nt.t, 0, y + nh * 0.44, nh * 0.38, nt.tc || 'lacq', { font: nt.f || 'hand', align: 'center', sx: Math.min(1, (nw * 0.84) / AV.typeW(nt.t, nh * 0.38, { font: nt.f || 'hand' })), off: 0.001, hand: 0.03 });
      if (nt.s) AV.type(pl, nt.s, 0, y + nh * 0.12, nh * 0.2, 'sgnK', { font: 'alfa', align: 'center', sx: Math.min(1, (nw * 0.84) / AV.typeW(nt.s, nh * 0.2, { font: 'alfa' })), off: 0.001 });
    });
    // the roll-gate housing and its tracks, on shops that have no awning over them
    if (!o.awn && lod === 0) { w.box(a, fy0 - 0.26, b, fy0, 0, 0.16, 'gate', { ink: W.D, us: 0.6 }); for (const u of [a + 0.02, b - 0.06]) w.box(u, 0.62, u + 0.04, fy0 - 0.26, 0, 0.05, 'gate', { ink: W.H, fade: 0.1 }); }
    // awning
    if (o.awn) awning(w, a + 0.04, b - 0.04, fy0 - 0.02, o.awn, lod, o.awnText);
  }

  // The shop behind the glass is a room: floor, side walls, back wall, a ceiling with its tubes, and fixtures at their true depth,
  // so that everything in it slides as the eye moves. Depth is real here, and it is what makes the window look like a window.
  function shopRoom(w, a, b, gy0, fy0, d, Y0, kind, rnd) {
    const K = w.K, D = -5.2, yC = fy0 + 0.3, n = 5, F = i => -d + ((D + d) * i) / n, sh = i => 1 - (i / n) * 0.34;
    for (let i = 0; i < n; i++) {
      const f0 = F(i), f1 = F(i + 1), s = [sh(i), sh(i), sh(i + 1), sh(i + 1)];
      K.face([w.P(a, Y0, f0), w.P(b, Y0, f0), w.P(b, Y0, f1), w.P(a, Y0, f1)], 'roomF', { shades: s });
      K.face([w.P(a, yC, f0), w.P(b, yC, f0), w.P(b, yC, f1), w.P(a, yC, f1)], 'roomC', { shades: s });
      K.face([w.P(a, Y0, f0), w.P(a, yC, f0), w.P(a, yC, f1), w.P(a, Y0, f1)], 'roomW', { shades: [s[0] * 0.9, s[0] * 0.9, s[3] * 0.9, s[3] * 0.9] });
      K.face([w.P(b, Y0, f0), w.P(b, yC, f0), w.P(b, yC, f1), w.P(b, Y0, f1)], 'roomW', { shades: [s[0] * 0.9, s[0] * 0.9, s[3] * 0.9, s[3] * 0.9] });
    }
    w.r(a, Y0, b, yC, D, 'roomW', { shade: 0.62 });
    // floor tiles running back to the vanishing point; ceiling tubes in rows
    const span = b - a, cols = Math.max(2, Math.round(span / 2.2));
    for (let i = 1; i < Math.round(span / 0.6); i++) { const u = a + (span * i) / Math.round(span / 0.6); w.l(u, Y0 + 0.002, u, Y0 + 0.002, -d, 0, {}); K.line(w.P(u, Y0 + 0.002, -d), w.P(u, Y0 + 0.002, D), W.H, { lc: 'inkG', fade: 0.16 }); }
    for (let f = -d - 0.6; f > D; f -= 0.6) K.line(w.P(a, Y0 + 0.002, f), w.P(b, Y0 + 0.002, f), W.H, { lc: 'inkG', fade: 0.16 });
    for (let c = 0; c < cols; c++) { const u = a + (span * (c + 0.5)) / cols; for (let f = -d - 0.5; f > D + 1.2; f -= 1.6) { K.face([w.P(u - 0.07, yC - 0.012, f), w.P(u + 0.07, yC - 0.012, f), w.P(u + 0.07, yC - 0.012, f - 1.2), w.P(u - 0.07, yC - 0.012, f - 1.2)], 'tubeL', {}); K.pline([w.P(u - 0.09, yC - 0.01, f + 0.02), w.P(u + 0.09, yC - 0.01, f + 0.02), w.P(u + 0.09, yC - 0.01, f - 1.22), w.P(u - 0.09, yC - 0.01, f - 1.22)], true, W.H, { fade: 0.14 }); } }
    // the display platform behind the glass
    if (gy0 > Y0 + 0.2) { const fp = -d - 0.68; K.face([w.P(a, gy0, -d), w.P(b, gy0, -d), w.P(b, gy0, fp), w.P(a, gy0, fp)], 'wood', { ink: W.H, fade: 0.12 }); K.face([w.P(a, Y0, fp), w.P(b, Y0, fp), w.P(b, gy0, fp), w.P(a, gy0, fp)], 'wood', { shade: 0.7 }); }
    // goods on wall shelving that really runs back along both side walls
    const goods = ['goodsA', 'goodsB', 'goodsC', 'goodsD', 'poster', 'posterR'];
    for (const [u, sg] of [[a, 1], [b, -1]]) {
      for (const y of [Y0 + 0.42, Y0 + 0.92, Y0 + 1.42, Y0 + 1.92]) {
        if (y > yC - 0.3) continue;
        const front = u + sg * 0.34, f0 = -d - 1.0, f1 = D + 0.2;
        K.face([w.P(u, y, f0), w.P(front, y, f0), w.P(front, y, f1), w.P(u, y, f1)], 'drawer', { ink: W.H, fade: 0.14 });
        for (let f = f0 - 0.04; f > f1 + 0.1;) { const ln = 0.08 + rnd() * 0.2, h = 0.1 + rnd() * 0.27, x = front - sg * 0.04; K.face([w.P(x, y, f), w.P(x, y + h, f), w.P(x, y + h, f - ln), w.P(x, y, f - ln)], goods[Math.floor(rnd() * 6)], { ink: W.H, fade: 0.2 }); K.face([w.P(x, y + h, f), w.P(x - sg * 0.1, y + h, f), w.P(x - sg * 0.1, y, f), w.P(x, y, f)], goods[Math.floor(rnd() * 4)], { shade: 0.85 }); f -= ln + 0.015 + rnd() * 0.03; }
      }
    }
    // what stands near the window, by trade; the fixture at the back of the room
    const plane = { bbq: -d - 0.35, rack: -d - 1.0, bakery: -d - 0.28, crates: -d - 0.3, posters: -d - 1.4, blind: -d - 0.1, shelves: D + 0.02, herbs: D + 0.02, jewel: D + 0.02 }[kind], f = plane == null ? D + 0.02 : plane;
    if (kind === 'blind') interior(w, a, b, gy0, fy0, f, 'blind', rnd, 0);
    else if (kind === 'shelves' || kind === 'herbs' || kind === 'jewel') interior(w, a + 0.4, b - 0.4, Y0 + 0.2, yC - 0.4, f, kind, rnd, 0);
    else { interior(w, a + 0.05, b - 0.05, gy0, fy0 - 0.05, f, kind, rnd, 0); interior(w, a + 0.4, b - 0.4, Y0 + 0.2, yC - 0.4, D + 0.02, 'shelves', rnd, 0); }
    // a counter down the room
    const cu = a + span * 0.5; w.box(cu - 0.9, Y0, cu + 0.9, Y0 + 0.92, D + 1.9, D + 2.6, 'drawer', { ink: W.H, fade: 0.12, fs: 0.9 });
  }

  // what you can see through the glass: one trade per shop, drawn small and quiet
  function interior(w, a, b, y0, y1, d, kind, rnd, lod) {
    const f = d + 0.004, goods = ['goodsA', 'goodsB', 'goodsC', 'goodsD'];
    if (lod > 1) return;
    if (kind === 'bbq') {           // roast ducks on a rail: the most Chinatown thing in any window
      const yr = y1 - 0.06;
      w.l(a + 0.1, yr, b - 0.1, yr, f + 0.006, W.F, { lc: 'chromeL', fade: 0.14 });
      for (let u = a + 0.34; u < b - 0.4; u += 0.44 + rnd() * 0.22) {
        const bw = 0.15 + rnd() * 0.035, top = yr - 0.06, neck = 0.2 + rnd() * 0.05, ht = 0.42 + rnd() * 0.08, cy = top - neck - ht / 2, col = rnd() < 0.55 ? 'duck' : 'duckD', pts = [];
        w.poly([[u - 0.024, top], [u + 0.024, top], [u + 0.05, top - neck - 0.05], [u - 0.05, top - neck - 0.05]], f + 0.006, col, { ink: W.H, fade: 0.14 });
        for (let i = 0; i < 14; i++) { const t = (i / 14) * Math.PI * 2, wd = bw * (Math.sin(t) < 0 ? 1 : 0.8); pts.push([u + Math.cos(t) * wd, cy + Math.sin(t) * ht / 2]); }
        w.poly(pts, f + 0.0065, col, { ink: W.H, fade: 0.14 });
        w.poly([[u - bw * 0.2, cy - ht * 0.2], [u + bw * 0.4, cy - ht * 0.25], [u + bw * 0.5, cy + ht * 0.14], [u - bw * 0.1, cy + ht * 0.2]], f + 0.007, 'bun', { shade: 0.72 });
        w.l(u, yr, u, top, f + 0.008, W.D, { lc: 'chromeL', fade: 0.16 });
        w.poly([[u - 0.03, cy - ht / 2 + 0.03], [u - 0.012, cy - ht / 2 - 0.09], [u + 0.012, cy - ht / 2 - 0.09], [u + 0.03, cy - ht / 2 + 0.03]], f + 0.006, 'duckD');
      }
      for (let u = a + 0.3; u < b - 0.3; u += 0.46) w.r(u, y0 + 0.02, u + 0.36, y0 + 0.16, f + 0.006, 'sillD', { ink: W.H, fade: 0.14 });
    } else if (kind === 'herbs') {  // the apothecary's wall of little drawers, each with a label
      const dw = 0.3, dh = 0.2, u0 = a + 0.12, u1 = b - 0.12;
      w.r(u0, y0 + 0.02, u1, y1 + 0.3, f + 0.002, 'drawer');
      for (let u = u0; u < u1 - dw * 0.8; u += dw) for (let y = y0 + 0.04; y < y1 + 0.2; y += dh) {
        w.K.pline([w.P(u + 0.012, y, f + 0.004), w.P(u + dw - 0.012, y, f + 0.004), w.P(u + dw - 0.012, y + dh - 0.016, f + 0.004), w.P(u + 0.012, y + dh - 0.016, f + 0.004)], true, W.H, { lc: 'drawerD', fade: 0.14 });
        if (lod === 0) { w.r(u + dw * 0.34, y + dh * 0.5, u + dw * 0.66, y + dh * 0.84, f + 0.005, 'paper'); w.r(u + dw * 0.45, y + dh * 0.2, u + dw * 0.55, y + dh * 0.3, f + 0.005, 'gold'); }
      }
    } else if (kind === 'jewel') {  // red velvet, trays, a lot of small gold
      w.r(a + 0.08, y0 + 0.02, b - 0.08, y1 + 0.2, f + 0.002, 'velvet');
      for (let y = y0 + 0.25; y < y1; y += 0.42) { w.r(a + 0.14, y - 0.03, b - 0.14, y, f + 0.004, 'gold');
        if (lod === 0) for (let u = a + 0.2; u < b - 0.2; u += 0.07 + rnd() * 0.05) { const r = 0.012 + rnd() * 0.018; const yy = y + 0.06 + rnd() * 0.2; w.poly(Array.from({ length: 8 }, (_, k) => [u + Math.cos(k * 0.785) * r, yy + Math.sin(k * 0.785) * r]), f + 0.005, 'gold'); } }
    } else if (kind === 'bakery') { // trays of buns stepped up behind the glass
      for (let y = y0 + 0.14; y < y1; y += 0.44) { w.r(a + 0.1, y - 0.025, b - 0.1, y, f + 0.004, 'alum', { ink: W.H, fade: 0.14 });
        if (lod === 0) for (let u = a + 0.2; u < b - 0.2; u += 0.15 + rnd() * 0.03) { const r = 0.055 + rnd() * 0.012; w.poly(Array.from({ length: 10 }, (_, k) => [u + Math.cos(k * 0.628) * r, y + r * 0.78 + Math.sin(k * 0.628) * r * 0.78]), f + 0.006, 'bun', { ink: W.H, fade: 0.2 }); } }
    } else if (kind === 'shelves') {
      for (let y = y0 + 0.42; y < y1; y += 0.48) {
        w.l(a + 0.08, y, b - 0.08, y, f + 0.002, W.D, { lc: 'inkL', fade: 0.14 });
        if (lod === 0) for (let u = a + 0.12 + rnd() * 0.1; u < b - 0.2;) {
          const kind = rnd(), c = goods[Math.floor(rnd() * 4)];
          if (kind < 0.36) { const n = 2 + Math.floor(rnd() * 3), tw = 0.075, th = 0.09; for (let i = 0; i < n; i++) for (let k = 0; k <= i % 2; k++) { w.r(u + i * tw, y + 0.004 + k * th, u + (i + 1) * tw - 0.006, y + (k + 1) * th, f, c); w.l(u + i * tw, y + (k + 0.62) * th, u + (i + 1) * tw - 0.006, y + (k + 0.62) * th, f + 0.001, W.H, { lc: 'inkL', fade: 0.2 }); } u += n * tw + 0.05; }
          else if (kind < 0.66) { const hh = 0.17 + rnd() * 0.08, r = 0.028; const pts = [[u, y + 0.004], [u + 2 * r, y + 0.004], [u + 2 * r, y + hh * 0.62], [u + r * 1.35, y + hh * 0.8], [u + r * 1.35, y + hh], [u + r * 0.65, y + hh], [u + r * 0.65, y + hh * 0.8], [u, y + hh * 0.62]]; w.poly(pts, f, c, { concave: true }); w.r(u + 0.008, y + 0.04, u + 2 * r - 0.008, y + hh * 0.34, f + 0.001, 'poster'); u += 2 * r + 0.035 + rnd() * 0.02; }
          else { const ww = 0.13 + rnd() * 0.12, hh = 0.12 + rnd() * 0.16; w.r(u, y + 0.004, u + ww, y + hh, f, c, { ink: W.H, fade: 0.22 }); w.r(u + ww * 0.15, y + hh * 0.5, u + ww * 0.85, y + hh * 0.8, f + 0.001, rnd() < 0.5 ? 'posterR' : 'poster'); u += ww + 0.03 + rnd() * 0.06; }
        }
      }
    } else if (kind === 'posters') {
      for (let u = a + 0.4 + rnd() * 0.4; u < b - 0.8; u += 1.0 + rnd() * 1.1) {
        const yy = y0 + 0.5 + rnd() * 0.35, ww = 0.42 + rnd() * 0.2, hh = 0.56 + rnd() * 0.2;
        w.r(u, yy, u + ww, yy + hh, f + 0.008, 'poster', { ink: W.H });
        if (lod === 0) { w.r(u + 0.05, yy + hh * 0.62, u + ww - 0.05, yy + hh - 0.05, f + 0.01, 'posterR'); for (let q = 0.14; q < 0.52; q += 0.1) w.l(u + 0.05, yy + hh * q, u + ww - 0.05, yy + hh * q, f + 0.01, W.H); }
      }
    } else if (kind === 'rack') {
      const yr = y1 - 0.06;
      w.l(a + 0.1, yr, b - 0.1, yr, f + 0.006, W.D, { lc: 'inkL', fade: 0.14 });
      if (lod === 0) for (let u = a + 0.2; u < b - 0.3; u += 0.15 + rnd() * 0.12) { const hh = 0.65 + rnd() * 0.5; w.r(u, yr - hh, u + 0.13, yr - 0.03, f, goods[Math.floor(rnd() * 4)], { ink: W.H }); }
    } else if (kind === 'blind') {
      w.r(a + 0.05, y0 + (y1 - y0) * 0.45, b - 0.05, y1, f + 0.002, 'curtain', { shade: 0.9 });
      for (let u = a + 0.12; u < b - 0.05; u += 0.13) w.l(u, y0 + (y1 - y0) * 0.45, u, y1, f + 0.004, W.H, { fade: 0.2, lc: 'inkG' });
      w.l(a + 0.05, y0 + (y1 - y0) * 0.45, b - 0.05, y0 + (y1 - y0) * 0.45, f + 0.004, W.D);
    } else {
      for (let u = a + 0.25 + rnd() * 0.3; u < b - 0.9; u += 0.75 + rnd() * 0.5) {
        const n = 1 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) { const yy = y0 + 0.02 + i * 0.28; w.r(u, yy, u + 0.56, yy + 0.27, f + 0.004, goods[Math.floor(rnd() * 4)], { ink: W.H }); }
      }
    }
  }

  // A shop awning is canvas laced over a steel pipe frame: wall rail, front rail, rafters. The cloth sags between rafters,
  // hangs a free valance with a scalloped hem, and closes its ends with cut wings. Seen from below you see the frame.
  function awning(w, a, b, y, cols, lod, txt) {
    w.K.begin('awning@' + w.zAt(a).toFixed(1) + ',' + w.out[0]);
    awningB(w, a, b, y, cols, lod, txt);
    w.K.end();
  }
  function awningB(w, a, b, y, cols, lod, txt) {
    const K = w.K, drop = 0.75, reach = 1.25, val = txt ? 0.3 : 0.24, y1 = y - drop, span = b - a, n = Math.max(2, Math.round(span / 0.42)), nr = Math.max(2, Math.round(span / 1.5));
    const slope = [w.out[0] * drop, reach, w.out[2] * drop], sl = Math.hypot(slope[0], slope[1], slope[2]), Nb = [slope[0] / sl, slope[1] / sl, slope[2] / sl];
    const rows = lod === 0 ? 6 : 2, sub = lod === 0 ? 3 : 1;
    const sagAt = (u, q) => { const fr = ((u - a) / span) * nr, e = Math.sin(Math.PI * (fr - Math.floor(fr))); return -0.028 * e * Math.sin(Math.PI * q); };
    const pt = (u, q) => { const s = sagAt(u, q); return w.P(u, y + (y1 - y) * q + s, 0.03 + (reach - 0.03) * q); };
    const nrm = (u, q) => { const fr = ((u - a) / span) * nr, tilt = Math.cos(Math.PI * (fr - Math.floor(fr))) * 0.16 * Math.sin(Math.PI * q) * (nr / span) * 1.5, up = Math.cos(Math.PI * q) * 0.1; return [Nb[0] + w.U[0] * tilt, Nb[1] + up, Nb[2] + w.U[2] * tilt]; };
    for (let i = 0; i < n; i++) {
      const u0 = a + (span * i) / n, u1 = a + (span * (i + 1)) / n, c = cols[i % cols.length];
      for (let k = 0; k < sub; k++) for (let j = 0; j < rows; j++) {
        const p0 = u0 + ((u1 - u0) * k) / sub, p1 = u0 + ((u1 - u0) * (k + 1)) / sub, q0 = j / rows, q1 = (j + 1) / rows;
        K.face([pt(p0, q0), pt(p1, q0), pt(p1, q1), pt(p0, q1)], c, { normals: [nrm(p0, q0), nrm(p1, q0), nrm(p1, q1), nrm(p0, q1)] });
      }
      if (lod <= 1) for (let j = 0; j < rows; j++) K.line(pt(u0, j / rows), pt(u0, (j + 1) / rows), W.H, { fade: 0.11 });
      // valance: free hem with a scallop
      const m = (u0 + u1) / 2, sc = lod === 0 && !txt ? 0.05 : 0, pts = [[u0, y1], [u1, y1], [u1, y1 - val + 0.04]];
      if (sc) for (let q = 1; q < 6; q++) { const t = q / 6; pts.push([u1 + (u0 - u1) * t, y1 - val + 0.04 - Math.sin(t * Math.PI) * sc]); }
      pts.push([u0, y1 - val + 0.04]);
      w.poly(pts, reach + 0.004, c, { shade: 0.92 });
      if (sc) w.K.pline(pts.slice(2).map(q => w.P(q[0], q[1], reach + 0.006)), false, W.H, { fade: 0.11 });
      w.l(u0, y1, u0, y1 - val + 0.04, reach + 0.005, W.H, { fade: 0.12 });
    }
    // the frame
    const r = 0.016, seg = lod === 0 ? 6 : 4;
    K.tube(w.P(a, y1, reach - 0.02), w.P(b, y1, reach - 0.02), r, 'steelD', { seg });
    K.tube(w.P(a, y - 0.02, 0.03), w.P(b, y - 0.02, 0.03), r, 'steelD', { seg });
    for (let i = 0; i <= nr; i++) {
      const u = a + (span * i) / nr;
      K.tube(w.P(u, y - 0.04, 0.03), w.P(u, y1 - 0.02, reach - 0.02), r, 'steelD', { seg });
      if (lod === 0) { K.tube(w.P(u, y - 0.75, 0.02), w.P(u, y + (y1 - y) * 0.55 - 0.03, 0.03 + reach * 0.55), 0.009, 'steelD', { seg: 4 }); w.box(u - 0.04, y - 0.8, u + 0.04, y - 0.7, 0, 0.012, 'steelD', { ink: W.H, fade: 0.12 }); }
    }
    // cut wings at each end
    for (const u of [a, b]) {
      K.face([w.P(u, y, 0.03), w.P(u, y1, reach), w.P(u, y1 - val + 0.04, reach), w.P(u, y1 - 0.02, reach * 0.45)], cols[0], { shade: 0.82, ink: W.D, fade: 0.08 });
    }
    if (txt && lod <= 1) {
      const pl = w.pl((a + b) / 2, reach + 0.006), m = AV.typeFit(txt.t, val * 0.58, span - 0.4, { font: txt.f || 'hei' });
      pl.rect(-span / 2, y1 - val + 0.04, span / 2, y1, txt.bg || cols[0], { off: 0, ink: W.H });
      AV.type(pl, txt.t, 0, y1 - val * 0.8, m.h, txt.c || 'awnW', { font: txt.f || 'hei', align: 'center', sx: m.sx, off: 0.001 });
    }
    K.line(w.P(a, y, 0.03), w.P(b, y, 0.03), W.D); K.line(w.P(a, y1, reach + 0.006), w.P(b, y1, reach + 0.006), W.F);
    K.line(w.P(a, y, 0.03), w.P(a, y1, reach), W.F); K.line(w.P(b, y, 0.03), w.P(b, y1, reach), W.F);
    K.castPoly([w.P(a, y, 0.03), w.P(b, y, 0.03), w.P(b, y1 - val, reach), w.P(a, y1 - val, reach)]);
  }

  // A pressed-metal cornice in true section: frieze, dentils, cove, soffit, corona, cyma crown; scrolled brackets cut to a profile; seams every sheet.
  function fineCornice(w, u0, u1, y, col, o) {
    const K = w.K;
    if (o.wall) ledgeShadow(w, u0, u1, y - 0.08, 0.3, 0, o.wall, 0.86);
    if (w.out[0] < 0 && y < 45) K.castPoly([w.P(u0, y + 0.82, 0.78), w.P(u1, y + 0.82, 0.78), w.P(u1, y + 0.1, 0.42), w.P(u0, y + 0.1, 0.42)]);
    w.r(u0, y, u1, y + 0.6, 0.03, col, { ink: W.D });
    w.box(u0, y - 0.08, u1, y, 0, 0.09, col, { ink: W.D });
    const curve = (f0, y0, f1, y1, conc, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, e = conc > 0 ? t * t : conc < 0 ? Math.sqrt(t) : t; out.push([f0 + (f1 - f0) * t, y0 + (y1 - y0) * e]); } return out; };
    const prof = [].concat(curve(0.03, y + 0.6, 0.2, y + 0.66, -1, 4), [[0.58, y + 0.7], [0.6, y + 0.72], [0.6, y + 0.82]], curve(0.6, y + 0.82, 0.66, y + 0.84, 0, 1), curve(0.66, y + 0.84, 0.8, y + 0.95, 1, 5), [[0.8, y + 0.98], [0, y + 0.98]]);
    for (let i = 0; i < prof.length - 1; i++) {
      const p = prof[i], q = prof[i + 1], df = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(df, dy) || 1, nf = dy / l, ny = -df / l, N = [w.out[0] * nf, ny, w.out[2] * nf];
      K.face([w.P(u0, p[1], p[0]), w.P(u1, p[1], p[0]), w.P(u1, q[1], q[0]), w.P(u0, q[1], q[0])], col, { normals: [N, N, N, N] });
      if (i === 0 || i === 4 || i === 6 || i === 8 || i === prof.length - 3) K.line(w.P(u0, p[1], p[0]), w.P(u1, p[1], p[0]), W.D, { fade: 0.06 });
    }
    // sheet seams over the crown
    for (let u = u0 + 1.22; u < u1 - 0.3; u += 1.22) for (let i = 0; i < prof.length - 2; i++) K.line(w.P(u, prof[i][1], prof[i][0] + 0.001), w.P(u, prof[i + 1][1], prof[i + 1][0] + 0.001), W.H, { fade: 0.14 });
    // ends closed, in section
    for (const u of [u0, u1]) K.face(prof.map(q => w.P(u, q[1], q[0])), col, { concave: true, shade: 0.82, ink: W.H, fade: 0.08 });
    // dentils, as blocks
    for (let u = u0 + 0.05; u < u1 - 0.06; u += 0.145) w.box(u, y + 0.5, u + 0.075, y + 0.6, 0.03, 0.085, col, { ink: W.H, fade: 0.12, us: 0.55 });
    // brackets cut to a scroll profile, extruded, with a recessed panel between each pair
    const nb = Math.max(2, Math.round((u1 - u0) / 0.62)), scroll = [[0.03, 0.08], [0.1, 0.08], [0.14, 0.11], [0.15, 0.17], [0.12, 0.22], [0.16, 0.28], [0.26, 0.36], [0.34, 0.44], [0.42, 0.53], [0.45, 0.6], [0.5, 0.68], [0.5, 0.7], [0.03, 0.7]];
    for (let i = 0; i <= nb; i++) {
      const u = u0 + 0.12 + ((u1 - u0 - 0.24) * i) / nb, hw = 0.07, p = scroll.map(q => [q[0], y + q[1]]);
      for (const e of [u - hw, u + hw]) K.face(p.map(q => w.P(e, q[1], q[0])), col, { concave: true, shade: 0.82, ink: W.H, fade: 0.1 });
      for (let k = 0; k < p.length - 2; k++) { const a = p[k], b = p[k + 1], df = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(df, dy) || 1, nf = dy / l, ny = -df / l, N = [w.out[0] * nf, ny, w.out[2] * nf]; K.face([w.P(u - hw, a[1], a[0]), w.P(u + hw, a[1], a[0]), w.P(u + hw, b[1], b[0]), w.P(u - hw, b[1], b[0])], col, { normals: [N, N, N, N] }); }
      if (i < nb) { const m = u + (u1 - u0 - 0.24) / nb / 2; w.box(m - 0.2, y + 0.16, m + 0.2, y + 0.46, 0.03, 0.05, col, { ink: W.H, fs: 0.93 }); w.r(m - 0.15, y + 0.2, m + 0.15, y + 0.42, 0.0505, col, { shade: 0.88, ink: W.H, fade: 0.12 }); }
    }
  }

  // ---- the projecting bracketed cornice. Most of the character of a tenement lives up here.
  function cornice(w, u0, u1, y, o) {
    const lod = o.lod, col = o.col || 'corn', dark = 'cornD';
    if (o.lod === 0) { fineCornice(w, u0, u1, y, col, o); return; }
    w.r(u0, y, u1, y + 0.6, 0.03, col, { ink: W.D });
    if (w.out[0] < 0 && y < 45) w.K.castPoly([w.P(u0, y + 0.82, 0.78), w.P(u1, y + 0.82, 0.78), w.P(u1, y + 0.1, 0.42), w.P(u0, y + 0.1, 0.42)]);
    if (o.wall) ledgeShadow(w, u0, u1, y - 0.08, 0.34, 0, o.wall, 0.84);
    w.box(u0, y - 0.08, u1, y, 0, 0.09, col, { ink: W.D });
    w.box(u0, y + 0.6, u1, y + 0.82, 0, 0.62, col, { ink: W.F, us: 0.55, under: col });
    w.box(u0, y + 0.82, u1, y + 0.97, 0, 0.78, col, { ink: W.F, us: 0.68 });
    if (lod >= 2) return;
    const n = Math.max(2, Math.round((u1 - u0) / (lod === 0 ? 0.62 : 1.24)));
    for (let i = 0; i <= n; i++) {
      const u = u0 + 0.12 + ((u1 - u0 - 0.24) * i) / n;
      w.box(u - 0.075, y + 0.1, u + 0.075, y + 0.6, 0.03, 0.42, col, { ink: W.D, us: 0.55, fade: 0.1 });
      if (lod === 0 && i < n) { const m = u + (u1 - u0 - 0.24) / n / 2; w.box(m - 0.2, y + 0.2, m + 0.2, y + 0.46, 0.03, 0.06, col, { ink: W.H, fs: 0.92 }); }
    }
    w.l(u0, y + 0.1, u1, y + 0.1, 0.034, W.D);
    if (lod === 0) for (let u = u0 + 0.05; u < u1 - 0.05; u += 0.14) w.l(u, y + 0.6, u, y + 0.52, 0.03, W.H);
  }

  // ---- fire escape: mostly line, as it is in life
  // Built as it is built: angle-iron frame, open bar decking you can see through, struts bolted to the wall,
  // flat-bar rails on square balusters, a stair of two channels with slatted treads rising through a hatch, a counterweighted drop ladder.
  function escapeReal(w, u0, u1, ys, o) {
    const K = w.K, depth = 1.05, rail = 0.98, rnd = o.rnd || (o.rnd = AV.rng(Math.round(u0 * 31 + 7))), I = 'rail', U = 'railU';
    const bar = (a, b, r, c) => K.tube(a, b, r, c || I, { seg: 4 });
    ys.forEach((y, i) => {
      if (o.wall && w.out[0] >= 0) ledgeShadow(w, u0 + 0.12, u1 - 0.12, y - 0.02, 0.36, 0, o.wall, 0.9);
      if (w.out[0] < 0) {
        K.castPoly([w.P(u0, y, 0.02), w.P(u1, y, 0.02), w.P(u1, y, 0.06), w.P(u0, y, 0.06)]); K.castPoly([w.P(u0, y, depth - 0.05), w.P(u1, y, depth - 0.05), w.P(u1, y, depth), w.P(u0, y, depth)]);
        for (let f = 0.1; f < depth; f += 0.11) K.castLine(w.P(u0, y, f), w.P(u1, y, f), 0.03);
        K.castLine(w.P(u0, y + rail, depth), w.P(u1, y + rail, depth), 0.05); K.castLine(w.P(u0, y + rail * 0.5, depth), w.P(u1, y + rail * 0.5, depth), 0.03);
        for (let u = u0; u <= u1 + 0.01; u += 0.22) K.castLine(w.P(u, y, depth), w.P(u, y + rail, depth), 0.018);
        if (i < ys.length - 1) { const y2 = ys[i + 1]; K.castLine(w.P(u1 - 0.22, y, 0.7), w.P(u0 + 0.28, y2, 0.7), 0.05); K.castLine(w.P(u1 - 0.22, y + 0.85, 0.7), w.P(u0 + 0.28, y2 + 0.85, 0.7), 0.03); }
      }
      // frame of the platform
      w.box(u0, y - 0.06, u1, y, 0.02, 0.05, I, { ink: W.H, fade: 0.06 }); w.box(u0, y - 0.06, u1, y, depth - 0.03, depth, I, { ink: W.H, fade: 0.06 });
      w.box(u0, y - 0.06, u0 + 0.03, y, 0.02, depth, I, { ink: W.H, fade: 0.06 }); w.box(u1 - 0.03, y - 0.06, u1, y, 0.02, depth, I, { ink: W.H, fade: 0.06 });
      const hu0 = u0 + 0.2, hu1 = Math.min(u1 - 0.1, u0 + 1.18), hatch = i > 0;
      for (let f = 0.075; f < depth - 0.04; f += 0.055) {
        const inH = hatch && f > 0.24 && f < 0.76, slat = (p, q) => { K.face([w.P(p, y, f), w.P(q, y, f), w.P(q, y, f + 0.03), w.P(p, y, f + 0.03)], U, {}); K.face([w.P(p, y - 0.012, f), w.P(q, y - 0.012, f), w.P(q, y, f), w.P(p, y, f)], I, {}); };
        if (inH) { slat(u0 + 0.03, hu0); slat(hu1, u1 - 0.03); } else slat(u0 + 0.03, u1 - 0.03);
      }
      for (let u = u0 + 0.6; u < u1 - 0.3; u += 0.6) { if (hatch && u > hu0 && u < hu1) continue; w.box(u - 0.012, y - 0.05, u + 0.012, y - 0.012, 0.05, depth - 0.03, I, { ink: 0 }); }
      // struts with their wall plates and bolts
      for (const u of [u0 + 0.1, u1 - 0.1]) { bar(w.P(u, y - 0.72, 0.012), w.P(u, y - 0.05, depth * 0.82), 0.012); w.box(u - 0.05, y - 0.8, u + 0.05, y - 0.62, 0, 0.012, I, { ink: W.H, fade: 0.1 }); for (const q of [0.68, 0.76]) w.box(u - 0.012, y - q - 0.012, u + 0.012, y - q + 0.012, 0.012, 0.024, 'steelD', { ink: 0 }); }
      // rail
      w.box(u0, y + rail - 0.025, u1, y + rail, depth - 0.008, depth + 0.008, I, { ink: W.H, fade: 0.05 });
      w.box(u0, y + rail * 0.5 - 0.012, u1, y + rail * 0.5, depth - 0.006, depth + 0.006, I, { ink: 0 });
      for (const u of [u0, u1]) { w.box(u - 0.008, y + rail - 0.025, u + 0.008, y + rail, 0, depth, I, { ink: W.H, fade: 0.05 }); w.box(u - 0.006, y + rail * 0.5 - 0.012, u + 0.006, y + rail * 0.5, 0, depth, I, { ink: 0 }); bar(w.P(u, y, depth), w.P(u, y + rail, depth), 0.012); }
      for (let u = u0 + 0.11; u < u1 - 0.02; u += 0.11) bar(w.P(u, y, depth), w.P(u, y + rail - 0.02, depth), 0.006);
      for (let f = 0.11; f < depth; f += 0.11) for (const u of [u0, u1]) bar(w.P(u, y, f), w.P(u, y + rail - 0.02, f), 0.006);
      if (AV.escapeLife) AV.escapeLife(w, u0, u1, y, depth, rnd, 0);
      if (i < ys.length - 1) {
        const y2 = ys[i + 1], su0 = u1 - 0.22, su1 = u0 + 0.28, f0 = 0.3, f1 = 0.7, n = Math.round((y2 - y) / 0.2);
        for (const f of [f0, f1]) { bar(w.P(su0, y, f), w.P(su1, y2, f), 0.026); bar(w.P(su0, y + 0.86, f), w.P(su1, y2 + 0.86, f), 0.009); for (let k = 0; k <= 3; k++) { const t = 0.08 + (k / 3) * 0.84, u = su0 + (su1 - su0) * t, yy = y + (y2 - y) * t; bar(w.P(u, yy, f), w.P(u, yy + 0.86, f), 0.007); } }
        const run = (su0 - su1) / n;
        for (let k = 1; k < n; k++) { const t = k / n, u = su0 + (su1 - su0) * t, yy = y + (y2 - y) * t; for (let q = 0; q < 3; q++) { const a = u - run * 0.45 + (q * run * 0.9) / 3, b = a + run * 0.24; K.face([w.P(a, yy, f0), w.P(b, yy, f0), w.P(b, yy, f1), w.P(a, yy, f1)], U, { ink: W.H, fade: 0.1 }); } }
      }
    });
    const y = ys[0], u = u0 + 0.5, f = depth + 0.05;
    bar(w.P(u, y - 1.3, f), w.P(u, y + 0.9, f), 0.012); bar(w.P(u + 0.42, y - 1.3, f), w.P(u + 0.42, y + 0.9, f), 0.012);
    for (let t = y - 1.2; t < y + 0.85; t += 0.3) bar(w.P(u, t, f), w.P(u + 0.42, t, f), 0.008);
    for (const q of [u - 0.03, u + 0.45]) w.box(q - 0.03, y - 0.1, q + 0.03, y + 0.02, depth, f, I, { ink: W.H });
    K.tube(w.P(u + 0.21, y + 0.94, f), w.P(u + 0.21, y + 1.06, f), 0.05, 'steelD', { seg: 8, caps: true });
  }
  function fireEscape(w, u0, u1, ys, o) {
    w.K.begin('escape@' + w.zAt(u0).toFixed(1) + ',' + w.out[0]);
    fireEscapeB(w, u0, u1, ys, o);
    w.K.end();
  }
  function fireEscapeB(w, u0, u1, ys, o) {
    if (o.lod === 0) return escapeReal(w, u0, u1, ys, o);
    const lod = o.lod, K = w.K, depth = 1.05, rail = 0.95;
    for (let i = 0; i < ys.length; i++) {
      const y = ys[i];
      if (w.out[0] >= 0 && o.wall) ledgeShadow(w, u0 + 0.12, u1 - 0.12, y - 0.02, 0.4, 0, o.wall, 0.9);
      if (w.out[0] < 0 && lod <= 1) {
        // what the sun does with iron: the deck, the rail and every baluster drawn again on the brick
        const cast = (a, b, wd) => K.castLine(a, b, wd);
        K.castPoly([w.P(u0, y, 0.02), w.P(u1, y, 0.02), w.P(u1, y, depth), w.P(u0, y, depth)]);
        cast(w.P(u0, y + rail, depth), w.P(u1, y + rail, depth), 0.05); cast(w.P(u0, y + rail * 0.5, depth), w.P(u1, y + rail * 0.5, depth), 0.03);
        for (let u = u0; u <= u1 + 0.01; u += 0.22) cast(w.P(u, y, depth), w.P(u, y + rail, depth), 0.018);
        if (i < ys.length - 1) { const y2 = ys[i + 1]; cast(w.P(u1 - 0.22, y, 0.7), w.P(u0 + 0.28, y2, 0.7), 0.05); cast(w.P(u1 - 0.22, y + 0.85, 0.7), w.P(u0 + 0.28, y2 + 0.85, 0.7), 0.03); }
      }
      if (lod <= 1 && AV.escapeLife) AV.escapeLife(w, u0, u1, y, depth, o.rnd || (o.rnd = AV.rng(Math.round(u0 * 31 + 7))), lod);
      // the slatted deck, with a hatch where the stair comes through from below
      const hu0 = u0 + 0.2, hu1 = Math.min(u1 - 0.1, u0 + 1.18);
      if (i > 0) {
        K.face([w.P(u0, y, 0.02), w.P(u1, y, 0.02), w.P(u1, y, depth), w.P(u0, y, depth)].map(q => q), 'railU', { ink: W.D, lc: 'ink', holes: [[w.P(hu0, y, 0.24), w.P(hu1, y, 0.24), w.P(hu1, y, 0.76), w.P(hu0, y, 0.76)]] });
        K.pline([w.P(hu0, y, 0.24), w.P(hu1, y, 0.24), w.P(hu1, y, 0.76), w.P(hu0, y, 0.76)], true, W.H, { fade: 0.1 });
      } else K.face([w.P(u0, y, 0.02), w.P(u1, y, 0.02), w.P(u1, y, depth), w.P(u0, y, depth)], 'railU', { ink: W.D, lc: 'ink' });
      K.face([w.P(u0, y - 0.06, depth), w.P(u1, y - 0.06, depth), w.P(u1, y, depth), w.P(u0, y, depth)], 'rail', {});
      if (lod <= 1) { for (let f = 0.14; f < depth; f += 0.16) K.line(w.P(u0, y - 0.002, f), w.P(u1, y - 0.002, f), W.H, { lc: 'inkL', fade: 0.14 }); }
      // brackets
      if (lod <= 1) for (const u of [u0 + 0.1, u1 - 0.1]) K.line(w.P(u, y - 0.75, 0.0), w.P(u, y - 0.03, depth * 0.85), W.D, { fade: 0.08 });
      // rails
      const lc = 'ink';
      w.l(u0, y + rail, u1, y + rail, depth, W.F, { lc, fade: 0.04 });
      w.l(u0, y + rail * 0.5, u1, y + rail * 0.5, depth, W.D, { lc, fade: 0.08 });
      for (const u of [u0, u1]) { w.l(u, y, u, y + rail, depth, W.D, { lc, fade: 0.05 }); K.line(w.P(u, y + rail, depth), w.P(u, y + rail, 0), W.D, { lc, fade: 0.05 }); K.line(w.P(u, y + rail * 0.5, depth), w.P(u, y + rail * 0.5, 0), W.D, { lc, fade: 0.08 }); }
      if (lod <= 1) { const step = lod === 0 ? 0.11 : 0.22; for (let u = u0 + step; u < u1 - 0.02; u += step) w.l(u, y + 0.04, u, y + rail, depth, W.H, { lc, fade: 0.1 }); }
      // the stair up to the next platform
      if (i < ys.length - 1) {
        const n = 11, y2 = ys[i + 1], su0 = u1 - 0.22, su1 = u0 + 0.28, f0 = 0.3, f1 = 0.7;
        K.line(w.P(su0, y, f0), w.P(su1, y2, f0), W.D, { lc, fade: 0.05 }); K.line(w.P(su0, y, f1), w.P(su1, y2, f1), W.F, { lc, fade: 0.05 });
        K.line(w.P(su0, y + 0.85, f1), w.P(su1, y2 + 0.85, f1), W.D, { lc, fade: 0.07 });
        if (lod <= 1) for (let k = 1; k < n; k++) { const t = k / n, u = su0 + (su1 - su0) * t, yy = y + (y2 - y) * t; K.line(w.P(u, yy, f0), w.P(u, yy, f1), W.H, { lc, fade: 0.1 }); }
      }
    }
    // counterbalanced drop ladder, parked up at the first platform
    if (lod <= 1) {
      const y = ys[0], u = u0 + 0.5, f = depth + 0.05;
      w.l(u, y - 1.3, u, y + 0.9, f, W.D, { fade: 0.07 }); w.l(u + 0.42, y - 1.3, u + 0.42, y + 0.9, f, W.D, { fade: 0.07 });
      for (let t = y - 1.2; t < y + 0.85; t += 0.3) w.l(u, t, u + 0.42, t, f, W.D, { fade: 0.1 });
    }
  }

  // one window bay inside a brick wall, with its surrounding wall panels
  function wallBay(w, cu0, cu1, y0, y1, win, o) {
    const mat = o.mat, lod = o.lod, rnd = o.rnd, [a, b, c, d] = win;
    w.r(cu0, y0, a, y1, 0, mat.wall); w.r(b, y0, cu1, y1, 0, mat.wall);
    w.r(a, y0, b, c, 0, mat.wall); w.r(a, d, b, y1, 0, mat.wall);
    if (lod === 0) { courses(w, cu0, y0, a, y1, 0, rnd, 0); courses(w, b, y0, cu1, y1, 0, rnd, 0); courses(w, a, y0, b, c, 0, rnd, 0); courses(w, a, d, b, y1, 0, rnd, 0); }
    sash(w, a, c, b, d, { rnd, lod, frame: mat.frame, lights: mat.lights, ac: !o.noAC && rnd() < 0.2, d: mat.d, wall: mat.wall });
    // lintel and sill
    if (mat.hood) {
      // pediment-style window head of the older tenements
      w.box(a - 0.09, d + 0.02, b + 0.09, d + 0.26, 0, 0.06, mat.trim, { ink: W.D });
      w.box(a - 0.15, d + 0.26, b + 0.15, d + 0.36, 0, 0.14, mat.trim, { ink: W.D, us: 0.6 });
      if (lod <= 1) for (const q of [0.14, 0.86]) w.box(a + (b - a) * q - 0.04, d + 0.06, a + (b - a) * q + 0.04, d + 0.26, 0.06, 0.1, mat.trim, { ink: W.H });
    } else {
      w.box(a - 0.07, d + 0.02, b + 0.07, d + 0.22, 0, 0.05, mat.trim, { ink: W.D });
    }
    w.box(a - 0.08, c - 0.1, b + 0.08, c - 0.005, 0, 0.1, mat.trim, { ink: W.D, us: 0.65 });
    if (lod <= 1) {
      ledgeShadow(w, a - 0.08, b + 0.08, c - 0.1, 0.09, 0, mat.wall, 0.8);
      if (rnd() < 0.55) runoff(w, a, b, c - 0.19, Math.min(0.72, c - 0.19 - y0), mat.wall, rnd);
    }
  }

  // ---- lot types. All take a frame, a span and a spec.
  const toneAt = (o, y) => (o.side === 'L' ? 'shade' : o.side === 'R' ? (y >= (o.sunY || 9.2) ? 'sun' : 'dim') : o.side === 'F' ? 'none' : 'none');

  function lodFor(w, u0, u1, o) {
    if (o.lod != null) return o.lod;
    const z = Math.min(w.zAt(u0), w.zAt(u1));
    return z < 34 ? 0 : z < 108 ? 1 : 2;
  }
  // nothing above this height at this depth can ever enter the picture, not even on a tall phone screen
  const seenTo = z => 26 * (1 + AV.cfg.k * z);

  function farBand(w, u0, u1, y0, y1, ww, mat, bays) {
    w.r(u0, y0, u1, y1, 0, mat.wall);
    const bw = (u1 - u0) / bays, cy = (y0 + y1) / 2, half = bw * (mat.wall === 'cream' || ww > 1.2 ? 0.38 : 0.26);
    for (let i = 0; i < bays; i++) { const c = u0 + (i + 0.5) * bw; w.r(c - half, cy - ww, c + half, cy + ww, 0.004, 'g2'); }
    w.l(u0, y0, u1, y0, 0.006, W.H, { fade: 0.03 });
  }

  function storesOf(w, u0, u1, sp, lod, rnd, H, mat) {
    const stores = sp.stores || [{}], tot = stores.reduce((s, q) => s + (q.w || 1), 0);
    let u = u0;
    for (const s of stores) {
      const e = u + ((u1 - u0) * (s.w || 1)) / tot;
      if (lod >= 2) { const c = (s.spec && s.spec.col) || 'stFrame'; w.r(u, 0, e, H, 0, c); w.r(u, 0, e, AV.G.CURB + 0.45, 0.002, 'sillD'); w.r(u + 0.3, 0.75, e - 0.3, H - 1.02, 0.003, 'shop'); w.r(u + 0.3, H - 0.98, e - 0.3, H - 0.2, 0.003, c); }
      else storefront(w, u, e, H, { rnd, lod, mat, spec: s.spec, gate: s.gate, awn: s.awn, awnText: s.awnText, doorAt: s.doorAt, inside: s.inside, notes: s.notes });
      u = e;
    }
  }

  // Old-law tenement: common brick, narrow windows, fire escape, bracketed cornice
  function tenement(w, u0, u1, sp) {
    const lod = lodFor(w, u0, u1, sp), mat = sp.mat, rnd = AV.rng(sp.seed || 7), H = sp.ground || 4.4, fh = sp.fh || 3.15, F = sp.floors;
    const K = w.K, top = H + F * fh, zFar = Math.max(w.zAt(u0), w.zAt(u1));
    K.tone = toneAt(sp, 0);
    if (sp.arcade) {
      // a passage let into the ground floor, so that people can walk round to the head of the subway stair
      const A = sp.arcade, Yg = AV.G.CURB, Hc = 3.0, f = -1.4, a = u0, b = u0 + A;
      K.face([w.P(a, Yg + 0.004, 0), w.P(b, Yg + 0.004, 0), w.P(b, Yg + 0.004, f), w.P(a, Yg + 0.004, f)], 'terr', {});
      K.face([w.P(a, Yg, f), w.P(b, Yg, f), w.P(b, Hc, f), w.P(a, Hc, f)], 'tileS', { ink: W.D, shade: 0.9 });
      K.face([w.P(b, Yg, 0), w.P(b, Hc, 0), w.P(b, Hc, f), w.P(b, Yg, f)], 'tileS', { ink: W.D, shade: 0.8 });
      K.face([w.P(a, Hc, 0), w.P(b, Hc, 0), w.P(b, Hc, f), w.P(a, Hc, f)], 'ceilP', { ink: W.D });
      K.face([w.P(b - 0.5, Hc - 0.01, -0.3), w.P(b - 0.3, Hc - 0.01, -0.3), w.P(b - 0.3, Hc - 0.01, -1.2), w.P(b - 0.5, Hc - 0.01, -1.2)], 'tubeL', {});
      AV.fascia(w, a, b, Hc, H - 0.14, 0.1, { cn: '地鐵', en: 'SUBWAY', style: 'backlit', col: 'stGreen', tc: 'sgnW', fc: 'hei', fe: 'overpass' }, lod);
      w.box(a, H - 0.14, b, H, 0, 0.2, mat.base || 'stCream', { ink: W.F });
    }
    storesOf(w, u0 + (sp.arcade || 0), u1, sp, lod, rnd, H, mat);
    const bays = Math.max(2, Math.round((u1 - u0) / (mat.bay || 2.45))), bw = (u1 - u0) / bays, ww = Math.min(1.08, bw * 0.52);
    for (let f = 0; f < F; f++) {
      const y0 = H + f * fh, y1 = y0 + fh;
      if (y0 > seenTo(zFar)) break;
      K.tone = toneAt(sp, y0);
      if (lod >= 2) { farBand(w, u0, u1, y0, y1, 0.9, mat, bays); continue; }
      for (let i = 0; i < bays; i++) {
        const a0 = u0 + i * bw, a1 = a0 + bw, c = (a0 + a1) / 2;
        wallBay(w, a0, a1, y0, y1, [c - ww / 2, c + ww / 2, y0 + 0.82, y0 + 0.82 + (mat.wh || 1.72)], { mat, lod, rnd, noAC: sp.pagoda && f === 1 });
      }
      if (f > 0 && lod <= 1 && mat.band) w.box(u0, y0 - 0.06, u1, y0 + 0.06, 0, 0.05, mat.trim, { ink: W.D });
      if (lod <= 1 && sp.glass && sp.glass[f]) { const gl = sp.glass[f]; for (let i = 0; i < bays; i++) { const c = u0 + (i + 0.5) * bw; if (gl.bays && !gl.bays.includes(i)) continue; AV.glassLetter(w, c - ww / 2, c + ww / 2, y0 + 1.0, -0.14 + 0.024, gl.cn, gl.en, gl.c || 'gold'); } }
    }
    if (top <= seenTo(zFar)) { K.tone = toneAt(sp, top); if (sp.pagoda) AV.pagodaEave(w, u0, u1, top, lod); else cornice(w, u0, u1, top, { lod, col: mat.corn, wall: mat.wall }); }
    if (sp.pagoda) { K.tone = toneAt(sp, H + 2 * fh); AV.pagodaEave(w, u0, u1, H + 2 * fh - 0.42, lod, true); }
    K.tone = toneAt(sp, 12);
    if (lod <= 1 && sp.escape) {
      const b0 = sp.escape[0], b1 = sp.escape[1], ys = [];
      for (let f = 0; f < F; f++) { const y = H + f * fh + 0.56; if (y < seenTo(zFar)) ys.push(y); }
      fireEscape(w, u0 + b0 * bw + 0.1, u0 + b1 * bw - 0.1, ys, { lod, wall: mat.wall });
    }
    return top;
  }

  // Cast-iron loft: a skeleton of columns and entablatures around huge windows
  function loft(w, u0, u1, sp) {
    const lod = lodFor(w, u0, u1, sp), mat = sp.mat, rnd = AV.rng(sp.seed || 11), H = sp.ground || 4.8, fh = sp.fh || 4.1, F = sp.floors;
    const K = w.K, top = H + F * fh, zFar = Math.max(w.zAt(u0), w.zAt(u1)), wall = mat.wall;
    K.tone = toneAt(sp, 0);
    storesOf(w, u0, u1, sp, lod, rnd, H, mat);
    const bays = Math.max(2, Math.round((u1 - u0) / (mat.bay || 3.1))), bw = (u1 - u0) / bays, cw = 0.36;
    for (let f = 0; f < F; f++) {
      const y0 = H + f * fh, y1 = y0 + fh, ent = 0.72;
      if (y0 > seenTo(zFar)) break;
      K.tone = toneAt(sp, y0);
      if (lod >= 2) { farBand(w, u0, u1, y0, y1, 1.35, mat, bays); continue; }
      const arch = sp.arches && f >= F - sp.arches;
      for (let i = 0; i < bays; i++) {
        const a = u0 + i * bw + cw / 2, b = a + bw - cw, oy0 = y0 + ent + 0.05, oy1 = y1 - 0.08;
        // opening: three lights separated by slim iron mullions, sometimes under a segmental head
        const c = (a + b) / 2, r = (b - a) / 2;
        if (arch) {
          const yS = oy1 - r * 0.42, seg = 10, ring = [[a, oy0], [b, oy0]];
          for (let k = 0; k <= seg; k++) { const t = (k / seg) * Math.PI; ring.push([c + Math.cos(t) * r, yS + Math.sin(t) * r * 0.42]); }
          w.poly([[a, y0 + ent], [b, y0 + ent], [b, y1], [a, y1]], 0, wall, { holes: [ring] });
          w.poly(ring, -0.2, 'g1', { concave: true });
          for (let k = 0; k < ring.length; k++) { const p = ring[k], q = ring[(k + 1) % ring.length]; K.face([w.P(p[0], p[1], 0), w.P(q[0], q[1], 0), w.P(q[0], q[1], -0.2), w.P(p[0], p[1], -0.2)], 'reveal', { shade: 0.7 }); }
          for (let k = 0; k < ring.length; k++) { const p = ring[k], q = ring[(k + 1) % ring.length]; w.l(p[0], p[1], q[0], q[1], 0, W.F); }
          for (let k = 2; k < seg + 2; k++) { const p = ring[k], q = ring[k + 1]; w.l(p[0], p[1], q[0], q[1], -0.18, W.D); }
          for (const t of [1 / 3, 2 / 3]) { const u = a + (b - a) * t; w.r(u - 0.03, oy0, u + 0.03, yS + Math.sqrt(Math.max(0, 1 - ((u - c) / r) ** 2)) * r * 0.42, -0.17, mat.frame || 'frame', { ink: W.H }); }
          w.r(a, yS - 0.03, b, yS + 0.03, -0.17, mat.frame || 'frame', { ink: W.H });
          w.r(a, (oy0 + yS) / 2 - 0.02, b, (oy0 + yS) / 2 + 0.02, -0.17, mat.frame || 'frame', { ink: W.H });
        } else {
          w.r(a, y0 + ent, b, oy0, 0, wall); w.r(a, oy1, b, y1, 0, wall);
          const third = (b - a) / 3;
          for (let k = 0; k < 3; k++) sash(w, a + k * third + (k ? 0.015 : 0), oy0, a + (k + 1) * third - (k < 2 ? 0.015 : 0), oy1, { rnd, lod, frame: mat.frame, d: 0.2, ac: k === 1 && rnd() < 0.08, wall });
        }
      }
      // entablature band across the whole front
      w.box(u0, y0, u1, y0 + ent, 0, 0.14, wall, { ink: W.F, us: 0.66 });
      w.box(u0, y0 + ent - 0.1, u1, y0 + ent, 0.14, 0.26, wall, { ink: W.D, us: 0.6 });
      w.box(u0, y0, u1, y0 + 0.14, 0.14, 0.26, wall, { ink: W.D, us: 0.6 });
      w.r(u0, y0 + ent - 0.32, u1, y0 + ent - 0.1, 0.1422, wall, { shade: 0.88 });
      if (lod === 0) {
        for (let u = u0 + 0.1; u < u1; u += 0.16) w.l(u, y0 + ent - 0.1, u, y0 + ent - 0.2, 0.14, W.H);
        w.l(u0, y0 + 0.3, u1, y0 + 0.3, 0.142, W.H); w.l(u0, y0 + 0.47, u1, y0 + 0.47, 0.142, W.H);
      }
      // columns
      for (let i = 0; i <= bays; i++) {
        const c = u0 + i * bw, x0 = c - cw / 2, x1 = c + cw / 2;
        const edge = i === 0 || i === bays, a = edge && i === 0 ? u0 : x0, b = edge && i === bays ? u1 : x1;
        w.box(a, y0 + ent, b, y1, 0, 0.16, wall, { ink: W.F, noTop: true });
        if (lod <= 1) {
          const ca = Math.max(u0, a - 0.05), cb = Math.min(u1, b + 0.05), da = Math.max(u0, a - 0.09), db = Math.min(u1, b + 0.09);
          w.box(ca, y0 + ent, cb, y0 + ent + 0.24, 0.16, 0.21, wall, { ink: W.D });
          w.box(ca, y1 - 0.26, cb, y1 - 0.14, 0.16, 0.2, wall, { ink: W.D, us: 0.6 });
          w.box(da, y1 - 0.14, db, y1, 0.16, 0.235, wall, { ink: W.D, us: 0.6 });
          w.r(ca, y1 - 0.5, cb, y1 - 0.26, 0.162, wall, { shade: 0.86 });
          for (const t of [0.25, 0.5, 0.75]) { const u = a + (b - a) * t; w.l(u, y0 + ent + 0.28, u, y1 - 0.3, 0.162, W.H, { fade: 0.14 }); }
        }
      }
    }
    if (top <= seenTo(zFar)) { K.tone = toneAt(sp, top); cornice(w, u0, u1, top, { lod, col: mat.corn || wall }); }
    K.tone = toneAt(sp, 12);
    if (lod <= 1 && sp.escape) { const ys = []; for (let f = 0; f < F; f++) { const y = H + f * fh + 0.72; if (y < seenTo(zFar)) ys.push(y); } fireEscape(w, u0 + sp.escape[0] * bw + 0.22, u0 + sp.escape[1] * bw - 0.22, ys, { lod }); }
    return top;
  }

  // Pre-war block: limestone base, tall brick shaft with even windows
  function prewar(w, u0, u1, sp) {
    const lod = lodFor(w, u0, u1, sp), mat = sp.mat, rnd = AV.rng(sp.seed || 3), H = sp.ground || 5, fh = 3.1, F = sp.floors;
    const K = w.K, top = H + F * fh, zFar = Math.max(w.zAt(u0), w.zAt(u1));
    K.tone = toneAt(sp, 0);
    storesOf(w, u0, u1, sp, lod, rnd, H, mat);
    const stone = { wall: mat.base || 'lime', trim: 'sill', frame: 'frameD', d: 0.2 };
    const bays = Math.max(2, Math.round((u1 - u0) / 1.9)), bw = (u1 - u0) / bays, ww = bw * 0.58;
    for (let f = 0; f < F; f++) {
      const y0 = H + f * fh, y1 = y0 + fh;
      if (y0 > seenTo(zFar)) break;
      K.tone = toneAt(sp, y0);
      const m = f < 2 ? stone : mat;
      if (lod >= 2) { farBand(w, u0, u1, y0, y1, 0.85, m, bays); continue; }
      for (let i = 0; i < bays; i++) {
        const a0 = u0 + i * bw, a1 = a0 + bw, c = (a0 + a1) / 2;
        wallBay(w, a0, a1, y0, y1, [c - ww / 2, c + ww / 2, y0 + 0.8, y0 + 2.55], { mat: m, lod, rnd });
      }
      if (f === 1) w.box(u0, y1 - 0.2, u1, y1, 0, 0.22, 'sill', { ink: W.F, us: 0.6 });
      if (lod <= 1 && f < 2) for (let y = y0 + 0.4; y < y1; y += 0.42) w.l(u0, y, u1, y, 0.002, W.H, { fade: 0.15 });
      if (lod <= 1 && sp.glass && sp.glass[f]) { const gl = sp.glass[f]; for (let i = 0; i < bays; i++) { if (gl.bays && !gl.bays.includes(i)) continue; const c = u0 + (i + 0.5) * bw; AV.glassLetter(w, c - ww / 2, c + ww / 2, y0 + 1.0, -(m.d || 0.14) + 0.024, gl.cn, gl.en, gl.c || 'gold'); } }
      if (lod <= 1 && f >= F - 3 && f % 1 === 0) w.box(u0, y1 - 0.15, u1, y1, 0, 0.1, 'sill', { ink: W.D, us: 0.6 });
    }
    return top;
  }

  const TYPES = { tenement, loft, prewar }, GH = { tenement: 4.4, loft: 4.8, prewar: 5 };

  // Bare party wall, the giant side of a taller building rising over a low neighbour, with its old painted sign
  function partyWall(K, sign, z, X, y0, y1, depth, sp, lod) {
    const tn = sign < 0 ? 'shade' : 'dim';
    K.tone = tn;
    const x0 = sign * X, x1 = sign * (X + depth);
    const col = sp.mat.wall === 'cream' || sp.mat.wall === 'iron' || sp.mat.wall === 'sage' || sp.mat.wall === 'ochre' ? 'party' : sp.mat.wall;
    K.face([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], col, { shade: 0.86 });
    K.line([x0, y1, z], [x1, y1, z], W.D); K.line([x1, y0, z], [x1, y1, z], W.D); K.line([x0, y0, z], [x0, y1, z], W.D);
    // coping stones and a clean row of lot-line windows; the rest stays quiet brick
    K.box(Math.min(x0, x1), y1 - 0.3, z - 0.1, Math.max(x0, x1), y1, z + 0.05, 'corn', { ink: W.D, skip: 'b' });
    const pl = K.plane([0, 0, z], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    const a = rndW => sign * (X + rndW);
    if (lod <= 1) for (let y = y0 + 0.9; y < y1 - 0.6; y += 0.9) pl.line(x0, y, x1, y, W.H, { lc: 'inkG', fade: 0.07, off: 0.002 });
    for (let yy = Math.ceil(y0 / 3.1) * 3.1 + 1; yy < y1 - 1.5; yy += 3.1) for (const d of [depth - 3.4, depth - 6.4]) { const u0 = a(d), u1 = a(d + 1.1); pl.rect(u0, yy, u1, yy + 1.6, 'g3', { off: 0.003, ink: W.H, fade: 0.05 }); pl.rect(u0 - 0.05 * sign, yy - 0.08, u1 + 0.05 * sign, yy, 'sillD', { off: 0.004 }); }
    // the old painted sign, fading off the brick
    if (sp.ghost && y1 - y0 > 9) {
      const cx = sign * (X + depth * 0.36), cy = (y0 + y1) / 2 + 1, hw = depth * 0.3, words = sp.ghost, h = Math.min(1.45, (hw * 2 / Math.max(...words.map(q => q.length))) / 0.8);
      pl.pline([[cx - hw, cy - (words.length * h * 1.5) / 2 - 0.3], [cx + hw, cy - (words.length * h * 1.5) / 2 - 0.3], [cx + hw, cy + (words.length * h * 1.5) / 2 + 0.2], [cx - hw, cy + (words.length * h * 1.5) / 2 + 0.2]], true, W.D, { lc: 'ghost', off: 0.003, fade: 0.03 });
      words.forEach((t, i) => pl.text(t, cx, cy + (words.length / 2 - i - 1) * h * 1.5, h, 'ghost', { align: 'center', off: 0.003, spacing: 0.08 }));
    }
  }

  // Timber roof tank on a steel frame: the silhouette that says New York from any distance
  AV.waterTank = function (K, x, y, z, o) {
    o = o || {}; const r = o.r || 1.75, h = o.h || 3.3, leg = o.leg || 2.6;
    K.tone = o.tone || 'none';
    const b = y + leg;
    K.cyl('y', b, b + h, x, z, r, 'brown', { sil: W.D, seg: 20, noCapA: false, noCapB: true, lit: true });
    K.cyl('y', b + h, b + h + 1.05, x, z, r + 0.08, 'cornD', { sil: W.D, r2: 0.06, seg: 20, noCapA: true, noCapB: true });
    // hoops, staves
    for (let i = 0; i <= 5; i++) { const t = b + 0.15 + (i / 5) * (h - 0.3), seg = 20; for (let k = 0; k < seg; k++) { const a0 = (k / seg) * 6.283, a1 = ((k + 1) / seg) * 6.283; K.line([x + Math.cos(a0) * (r + 0.01), t, z + Math.sin(a0) * (r + 0.01)], [x + Math.cos(a1) * (r + 0.01), t, z + Math.sin(a1) * (r + 0.01)], W.H, { fade: 0.045 }); } }
    for (let k = 0; k < 28; k++) { const a = (k / 28) * 6.283; if (Math.sin(a) > 0.1) continue; K.line([x + Math.cos(a) * (r + 0.008), b, z + Math.sin(a) * (r + 0.008)], [x + Math.cos(a) * (r + 0.008), b + h, z + Math.sin(a) * (r + 0.008)], W.H, { fade: 0.055 }); }
    // frame
    const q = r * 0.78;
    for (const [dx, dz] of [[-q, -q], [q, -q], [-q, q], [q, q]]) K.box(x + dx - 0.05, y, z + dz - 0.05, x + dx + 0.05, b, z + dz + 0.05, 'rail', { ink: W.D, fade: 0.03 });
    K.line([x - q, y, z - q], [x + q, b, z - q], W.D, { fade: 0.05 }); K.line([x + q, y, z - q], [x - q, b, z - q], W.D, { fade: 0.05 });
    K.box(x - q - 0.06, b - 0.1, z - q - 0.06, x + q + 0.06, b, z + q + 0.06, 'rail', { ink: W.D, fade: 0.04 });
    K.tone = 'none';
  };

  // Rooftop stair bulkhead
  AV.bulkhead = function (K, x0, x1, y, h, z0, z1, tone) { K.tone = tone || 'none'; K.box(x0, y, z0, x1, y + h, z1, 'brickG', { ink: W.D, skip: 'b', fade: 0.04 }); K.tone = 'none'; };

  // Build a run of lots along one side of the street.  side -1 = left, +1 = right.
  AV.block = function (K, side, z0, lots) {
    const X = AV.G.HW; let z = z0, prevH = null;
    const w = new Wall(K, [side * X, 0, 0], [0, 0, 1], [-side, 0, 0], side < 0 ? 1 : -1);
    for (const lot of lots) {
      const e = z + lot.w;
      const sp = Object.assign({ side: side < 0 ? 'L' : 'R' }, lot);
      const top = TYPES[lot.t](w, z, e, sp);
      { const a = side < 0 ? (AV.roofL = AV.roofL || []) : (AV.roofR = AV.roofR || []); for (let q = Math.floor(z); q < e; q++) a[q] = top + 1; }
      K.tone = 'none'; w.r(z, lodFor(w, z, e, sp) === 0 ? (lot.ground || GH[lot.t]) - 0.1 : -1, e, top + 0.6, -0.38, 'reveal', { shade: 0.5 });
      // party wall where this building stands proud of its nearer neighbour
      const lod = z < 34 ? 0 : z < 108 ? 1 : 2;
      if (lot.boards) for (const bd of lot.boards) { K.tone = sp.side === 'L' ? 'shade' : 'dim'; AV.wallBoard(w, z + bd.a * lot.w, z + bd.b * lot.w, bd.y, bd.y + bd.h, bd, lodFor(w, z, e, sp)); K.tone = 'none'; }
      if (prevH != null && top + 1 > prevH + 0.3) { partyWall(K, side, z, X, prevH, top + 1, 15, sp, lod); }
      // the same when it is lower than the neighbour beyond: that wall faces away, nothing to draw
      if (lot.tank) AV.waterTank(K, side * (X + 3.2), top + 0.9, (z + e) / 2, { tone: side < 0 ? 'shade' : 'sun' });
      prevH = top + 1; z = e;
    }
    K.tone = 'none';
    return z;
  };
  AV.frontRun = function (K, zp, x0, lots, sideName) {
    let x = x0; const w = new Wall(K, [0, 0, zp], [1, 0, 0], [0, 0, -1], 1), tops = [];
    for (const lot of lots) { const sp = Object.assign({ side: sideName || 'F' }, lot); const top = TYPES[lot.t](w, x, x + lot.w, sp); K.tone = 'none'; w.r(x, sp.lod === 0 ? (lot.ground || GH[lot.t]) - 0.1 : -1, x + lot.w, top + 0.6, -0.38, 'reveal', { shade: 0.5 }); tops.push([x, x + lot.w, top]); x += lot.w; }
    K.tone = 'none';
    return tops;
  };
})();
