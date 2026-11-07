/* What makes this stretch Chinatown rather than any other downtown block: glazed-tile eaves, a pagoda-roof phone kiosk, and the shop spilling on to the pavement. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;

  // A glazed-tile eave across a front: the roof-line the older association buildings put on their brick
  AV.pagodaEave = function (w, u0, u1, y, lod, lower) {
    const K = w.K, reach = lower ? 0.9 : 1.3, rise = lower ? 0.55 : 0.95, y1 = y + (lower ? 0.2 : 0.3), yT = y1 + rise, span = u1 - u0;
    // brackets and painted beam under it (dougong reduced to its readable essence)
    w.box(u0, y - 0.3, u1, y, 0, 0.22, 'lacq', { ink: W.D, us: 0.55 });
    w.box(u0, y, u1, y1, 0, 0.34, 'jade', { ink: W.D, us: 0.55 });
    if (lod <= 1) {
      const n = Math.round(span / 0.9);
      for (let i = 0; i <= n; i++) { const u = u0 + 0.14 + ((span - 0.28) * i) / n; w.box(u - 0.06, y - 0.28, u + 0.06, y1 - 0.02, 0.22, reach * 0.7, 'lacqD', { ink: W.H, us: 0.5, fade: 0.1 }); }
      for (let u = u0 + 0.3; u < u1 - 0.1; u += 0.6) w.r(u - 0.14, y - 0.24, u + 0.14, y - 0.06, 0.222, 'gold');
    }
    // tile slope with a shallow sag, one strip per bay of the curve
    const seg = 6, curve = t => [t * reach, yT - rise * Math.pow(t, 0.72)];
    for (let i = 0; i < seg; i++) {
      const [f0, y0_] = curve(i / seg), [f1, y1_] = curve((i + 1) / seg);
      K.face([w.P(u0, y0_, f0), w.P(u1, y0_, f0), w.P(u1, y1_, f1), w.P(u0, y1_, f1)], 'tileG', { shade: 1 - i * 0.03 });
      K.face([w.P(u0, y0_ - 0.002, f0), w.P(u1, y0_ - 0.002, f0), w.P(u1, y1_ - 0.002, f1), w.P(u0, y1_ - 0.002, f1)], 'lacqD', { shade: 0.6 });
    }
    // roll tiles running down the slope
    if (lod <= 1) for (let u = u0 + 0.08; u < u1; u += lod === 0 ? 0.2 : 0.4) for (let i = 0; i < seg; i++) {
      const [f0, a] = curve(i / seg), [f1, b] = curve((i + 1) / seg);
      K.line(w.P(u, a + 0.012, f0), w.P(u, b + 0.012, f1), W.H, { lc: 'tileGD', fade: 0.09 });
    }
    // ridge, eaves tiles, upturned corners
    w.box(u0, yT - 0.04, u1, yT + 0.14, -0.1, 0.14, 'tileGD', { ink: W.D });
    const [ef, ey] = curve(1);
    w.box(u0, ey - 0.09, u1, ey + 0.02, ef - 0.03, ef + 0.03, 'tileGD', { ink: W.D, us: 0.6 });
    if (lod <= 1) for (let u = u0 + 0.1; u < u1 - 0.05; u += 0.2) w.r(u - 0.05, ey - 0.13, u + 0.05, ey - 0.09, ef + 0.031, 'tileY');
    for (const [u, s] of [[u0, 1], [u1, -1]]) {
      K.face([w.P(u, ey + 0.02, ef + 0.03), w.P(u + s * 0.34, ey + 0.02, ef + 0.03), w.P(u, ey + 0.4, ef + 0.14)], 'tileY', { ink: W.D });
      K.face([w.P(u, ey + 0.02, ef + 0.03), w.P(u + s * 0.34, ey + 0.02, ef + 0.03), w.P(u, ey + 0.4, ef - 0.2)], 'tileGD', { ink: W.H });
    }
  };

  // Phone kiosk under a little tiled pagoda roof
  AV.phoneKiosk = function (K, s, z) {
    K.begin('kiosk');
    const x = s * (AV.G.RW + 1.05), y = AV.G.CURB, hw = 0.46, hd = 0.42, H = 2.15;
    K.tone = s < 0 ? 'shade' : 'dim';
    for (const [dx, dz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) K.box(x + dx - 0.035, y, z + dz - 0.035, x + dx + 0.035, y + H, z + dz + 0.035, 'lacq', { ink: W.D, fade: 0.05 });
    K.box(x - hw, y + 0.7, z + hd - 0.02, x + hw, y + H, z + hd, 'alum', { ink: W.D });
    K.box(x - 0.17, y + 0.95, z + hd - 0.15, x + 0.17, y + 1.6, z + hd - 0.02, 'pole', { ink: W.D });
    K.box(x - hw - 0.04, y + H, z - hd - 0.04, x + hw + 0.04, y + H + 0.26, z + hd + 0.04, 'jade', { ink: W.D });
    const pl = K.plane([x, 0, z - hd - 0.041], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    AV.type(pl, '電話', -0.2, y + H + 0.05, 0.16, 'gold', { font: 'ming', align: 'center', off: 0.002 });
    pl.text('PHONE', 0.2, y + H + 0.08, 0.1, 'gold', { align: 'center', off: 0.002, font: 'bebas' });
    // hipped tile roof in two curved tiers, corners lifted
    const ring = (e, yy) => [[x - hw - e, yy, z - hd - e], [x + hw + e, yy, z - hd - e], [x + hw + e, yy, z + hd + e], [x - hw - e, yy, z + hd + e]];
    const y0 = y + H + 0.26, tiers = [[0.42, y0 + 0.02], [0.2, y0 + 0.2], [0.03, y0 + 0.5]];
    for (let t = 0; t < 2; t++) {
      const a = ring(tiers[t][0], tiers[t][1]), b = ring(tiers[t + 1][0], tiers[t + 1][1]);
      for (let i = 0; i < 4; i++) K.face([a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]], 'tileG', { shade: i % 2 ? 0.86 : 1, ink: W.H, fade: 0.08 });
    }
    K.face(ring(0.42, y0 + 0.02), 'lacqD', { shade: 0.6 });
    for (const q of ring(0.42, y0 + 0.02)) K.face([q, [q[0] + (q[0] - x) * 0.1, q[1] + 0.2, q[2] + (q[2] - z) * 0.1], [q[0], q[1] + 0.06, q[2] + (q[2] > z ? -0.1 : 0.1)]], 'tileY', { ink: W.H, fade: 0.08 });
    K.cyl('y', y0 + 0.5, y0 + 0.74, x, z, 0.05, 'tileY', { sil: W.H, r2: 0.01, seg: 8, noCapB: true });
    K.tone = 'none';
    K.end();
  };

  // ---- the shop on the pavement
  function crate(K, x, y, z, w, d, h, col, fill, rnd) {
    K.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, col, { ink: W.H, fade: 0.09, skip: 't' });
    const pl = K.plane([x, 0, z - d / 2 - 0.001], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    for (let k = 1; k < 3; k++) pl.line(-w / 2, y + (h * k) / 3, w / 2, y + (h * k) / 3, W.H, { off: 0, fade: 0.14, lc: col === 'crateB' ? 'ink' : 'woodD' });
    if (!fill) return;
    // heap of fruit: discs facing the viewer and a mound seen from over the top
    K.face([[x - w / 2, y + h, z - d / 2], [x + w / 2, y + h, z - d / 2], [x + w / 2, y + h, z + d / 2], [x - w / 2, y + h, z + d / 2]], fill[0], { shade: 0.62 });
    const r = fill[1], topP = K.plane([0, y + h, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]);
    for (let row = 0; row < 3; row++) for (let u = x - w / 2 + r; u < x + w / 2 - r * 0.6; u += r * 1.75) {
      const zz = z - d / 2 + r + (row * (d - 2 * r)) / 2 + (rnd() - 0.5) * 0.02;
      const n = 8, pts = []; for (let i = 0; i < n; i++) { const t = (i / n) * 6.283; pts.push([u + (rnd() - 0.5) * 0.01 + Math.cos(t) * r, y + h + 0.012 + r * (0.8 - row * 0.1) + Math.sin(t) * r * 0.94, zz]); }
      K.face(pts, fill[0], { shade: 0.92 + rnd() * 0.16 });
      K.face(pts.map(q => [q[0] - r * 0.25 + (q[0] - u) * -0.55, q[1] + r * 0.22 + (q[1] - (y + h + 0.012 + r * (0.8 - row * 0.1))) * -0.6, q[2] - 0.001]), fill[0], { shade: 1.18 });
    }
  }
  AV.produceStand = function (K, s, z0, z1, kinds) {
    K.begin('stand@' + z0);
    const G = AV.G, y0 = G.CURB, xw = s * (G.HW - 1.42), rnd = AV.rng(z0 * 7 + 1);
    K.tone = s < 0 ? 'shade' : 'dim';
    // a stepped bench of crates raked toward the walk, in two tiers
    const dep = 0.46, n = Math.max(2, Math.floor((z1 - z0) / 0.62)), stp = (z1 - z0) / n;
    for (let t = 0; t < 2; t++) {
      const x = xw + -s * (t === 0 ? 0.62 : 0.14), h = t === 0 ? 0.62 : 0.94;
      K.box(x - 0.24, y0, z0, x + 0.24, y0 + h - 0.16, z1, 'wood', { ink: W.D, fade: 0.08 });
      // slatted crates stacked under the display: planks along, a post at each crate
      for (let yy = y0 + 0.11; yy < y0 + h - 0.18; yy += 0.11) K.line([x - s * 0.241, yy, z0], [x - s * 0.241, yy, z1], W.H, { lc: 'woodD', fade: 0.09 });
      for (let i = 0; i <= n; i++) { const zz = z0 + i * stp; K.line([x - s * 0.241, y0, zz], [x - s * 0.241, y0 + h - 0.16, zz], W.D, { lc: 'woodD', fade: 0.08 }); }
      for (let i = 0; i < n; i++) { const z = z0 + (i + 0.5) * stp; const fill = kinds[(i * 2 + t) % kinds.length]; crate(K, x, y0 + h - 0.16, z, dep, stp - 0.03, 0.16, rnd() < 0.5 ? 'crate' : 'crateB', fill, rnd); }
    }
    // price cards on sticks
    for (let i = 1; i < n; i += 2) {
      const z = z0 + (i + 0.5) * stp, x = xw + -s * 0.9, y = y0 + 0.82;
      K.line([x, y0 + 0.5, z], [x, y, z], W.H, { fade: 0.1 });
      const pl = K.plane([x, 0, z - 0.002], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      pl.rect(-0.14, y, 0.14, y + 0.17, 'papY', { off: 0, ink: W.H, fade: 0.14 });
      AV.type(pl, ['$1.99', '$2.50', '3/$1', '99¢'.replace('¢', '')][i % 4], 0, y + 0.05, 0.08, 'lacq', { font: 'alfa', align: 'center', off: 0.001 });
    }
    K.tone = 'none';
    K.end();
  };
  AV.fishStall = function (K, s, z0, z1) {
    K.begin('fish@' + z0);
    const G = AV.G, y0 = G.CURB, xw = s * (G.HW - 1.44), rnd = AV.rng(z0 + 91);
    K.tone = s < 0 ? 'shade' : 'dim';
    const a = Math.min(xw - 0.5, xw + 0.5), b = Math.max(xw - 0.5, xw + 0.5);
    K.box(a, y0, z0, b, y0 + 0.74, z1, 'crateB', { ink: W.D, fade: 0.08 });
    K.box(a - 0.03, y0 + 0.74, z0 - 0.03, b + 0.03, y0 + 0.82, z1 + 0.03, 'alum', { ink: W.D, skip: 't' });
    K.face([[a, y0 + 0.822, z0], [b, y0 + 0.822, z0], [b, y0 + 0.822, z1], [a, y0 + 0.822, z1]], 'ice');
    for (let z = z0 + 0.14; z < z1 - 0.14; z += 0.22) for (let u = a + 0.14; u < b - 0.1; u += 0.2) {
      const zz = z + (rnd() - 0.5) * 0.05, L = 0.13 + rnd() * 0.05, W2 = 0.04 + rnd() * 0.012, pts = [], ang = 0.2 + rnd() * 0.5;
      for (let i = 0; i < 10; i++) { const t = (i / 10) * 6.283, p = Math.cos(t) * L, q = Math.sin(t) * W2; pts.push([u + p * Math.cos(ang) - q * Math.sin(ang), y0 + 0.83 + rnd() * 0.004, zz + p * Math.sin(ang) + q * Math.cos(ang)]); }
      K.face(pts, 'fish', { shade: 0.85 + rnd() * 0.3, ink: W.H, fade: 0.14 });
    }
    K.tone = 'none';
    K.end();
  };
  AV.boxes = function (K, s, z, n, o) {
    K.begin('boxes@' + z);
    const x = s * (AV.G.HW - (o && o.off || 1.1)), y0 = AV.G.CURB, rnd = AV.rng(z * 13 + 3);
    K.tone = s < 0 ? 'shade' : 'dim';
    let y = y0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 + rnd() * 0.12, d = 0.42 + rnd() * 0.1, h = 0.3 + rnd() * 0.1, dx = (rnd() - 0.5) * 0.04;
      K.box(x - w / 2 + dx, y, z, x + w / 2 + dx, y + h, z + d, 'card', { ink: W.D, fade: 0.08 });
      const pl = K.plane([x + dx, 0, z - 0.001], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      pl.line(-w / 2, y + h * 0.5, w / 2, y + h * 0.5, W.H, { off: 0, fade: 0.12, lc: 'wood' });
      if (i === 0) AV.type(pl, '鮮果', 0, y + h * 0.2, h * 0.36, 'lacqD', { font: 'hei', align: 'center', off: 0 });
      y += h;
    }
    K.tone = 'none'; K.end();
  };
  // ---- what fills the near edge of the picture. All of it sits low or to the side, so the street still reads through.
  // A green newsstand: louvred roof, hanging papers, magazines racked on the street side, adverts on the end
  AV.newsstand = function (K, s, z0, z1) {
    K.begin('newsstand');
    const y = AV.G.CURB, xr = s * (AV.G.RW + 1.05), xw = s * (AV.G.RW + 2.45), a = Math.min(xr, xw), b = Math.max(xr, xw), H = 2.12, rnd = AV.rng(19);
    K.box(a, y, z0, b, y + 0.16, z1, 'kerbS', { ink: W.D });
    K.box(a, y + 0.16, z0, b, y + H, z1, 'standG', { ink: W.F, skip: 'tb' });
    K.box(a - 0.1, y + H, z0 - 0.1, b + 0.1, y + H + 0.1, z1 + 0.1, 'standG', { ink: W.D, skip: 'b' });
    // a closed hipped roof: four slopes rising from the eave to a flat cap, with no gap anywhere
    { const eY = y + H + 0.1, tY = y + H + 0.26, e = [[a - 0.1, z0 - 0.1], [b + 0.1, z0 - 0.1], [b + 0.1, z1 + 0.1], [a - 0.1, z1 + 0.1]], t = [[a + 0.22, z0 + 0.22], [b - 0.22, z0 + 0.22], [b - 0.22, z1 - 0.22], [a + 0.22, z1 - 0.22]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; K.face([[e[i][0], eY, e[i][1]], [e[j][0], eY, e[j][1]], [t[j][0], tY, t[j][1]], [t[i][0], tY, t[i][1]]], 'standG', { ink: W.D, shade: i % 2 ? 1.02 : 1.1 }); }
      K.face(t.map(q => [q[0], tY, q[1]]), 'standG', { ink: W.D, shade: 1.15 });
      K.box(a + 0.5, tY, z0 + 0.7, a + 0.72, tY + 0.14, z0 + 0.92, 'steelD', { ink: W.H, skip: 'b' }); }
    // road side: open counter, stepped racks of magazines under a lettered fascia
    const roadX = s < 0 ? b : a, side = K.plane([roadX, 0, (z0 + z1) / 2], [0, 0, s < 0 ? 1 : -1], [0, 1, 0], [-s, 0, 0]), L = (z1 - z0) / 2;
    side.rect(-L + 0.08, y + 0.82, L - 0.08, y + H - 0.36, 'under', { off: 0.002, ink: W.D });
    AV.type(side, '報刊 雜誌', -L * 0.45, y + H - 0.28, 0.2, 'gold', { font: 'ming', align: 'center', off: 0.003 });
    side.text('NEWS', L * 0.5, y + H - 0.27, 0.19, 'gold', { align: 'center', off: 0.003, font: 'alfa', track: 0.08 });
    for (const yy of [y + 0.98, y + 1.36]) {
      for (let u = -L + 0.14; u < L - 0.26;) { const w = 0.15 + rnd() * 0.05, h = 0.26 + rnd() * 0.05, c = ['paper', 'papR', 'papY', 'cloB', 'papP', 'coneW'][Math.floor(rnd() * 6)]; side.rect(u, yy, u + w, yy + h, c, { off: 0.0035, ink: W.H, fade: 0.12 }); side.rect(u + 0.02, yy + h * 0.68, u + w - 0.02, yy + h * 0.9, rnd() < 0.5 ? 'sgnK' : 'lacq', { off: 0.004 }); u += w + 0.022; }
      side.rect(-L + 0.08, yy - 0.025, L - 0.08, yy, 'alum', { off: 0.004 });
    }
    // lower counter with stacks of today's papers
    side.rect(-L + 0.02, y + 0.16, L - 0.02, y + 0.82, 'standG', { off: 0.004, ink: W.D, shade: 0.92 });
    for (let u = -L + 0.14; u < L - 0.5; u += 0.48) { side.rect(u, y + 0.82, u + 0.4, y + 0.92, 'paper', { off: 0.01, ink: W.H, fade: 0.12 }); AV.type(side, '日報', u + 0.2, y + 0.84, 0.06, 'sgnK', { font: 'ming', align: 'center', off: 0.012 }); }
    // viewer's end: two framed adverts
    const end = K.plane([(a + b) / 2, 0, z0 - 0.002], [1, 0, 0], [0, 1, 0], [0, 0, -1]), hw = (b - a) / 2;
    end.rect(-hw + 0.1, y + 0.4, hw - 0.1, y + H - 0.32, 'alum', { off: 0.001, ink: W.D });
    end.rect(-hw + 0.15, y + 0.45, hw - 0.15, y + H - 0.37, 'lacq', { off: 0.002 });
    AV.type(end, '春節', 0, y + 1.28, 0.32, 'gold', { font: 'boku', align: 'center', off: 0.003 });
    AV.type(end, '大減價', 0, y + 0.92, 0.22, 'sgnW', { font: 'hei', align: 'center', off: 0.003 });
    end.text('LUNAR NEW YEAR SALE', 0, y + 0.68, 0.07, 'gold', { align: 'center', off: 0.003, font: 'overpass', track: 0.04 });
    K.end();
  };

  // A dock of share bikes in the near parking lane: base rail, kiosk, and bikes standing side-on to the viewer
  // A share bike, in the round: two wheels (tyre, rim, 20 spokes, hub), a step-through frame in real tubes, fork, stem, bars with grips, saddle, cranks, chain guard, basket
  function bike(K, xc, z, s, col) {
    const r = 0.33, X = q => xc + q, ring = (cx, cy, rad, tr, c, seg) => { for (let i = 0; i < seg; i++) { const a = (i / seg) * 6.2832, b = ((i + 1) / seg) * 6.2832; K.tube([X(cx + Math.cos(a) * rad), cy + Math.sin(a) * rad, z], [X(cx + Math.cos(b) * rad), cy + Math.sin(b) * rad, z], tr, c, { seg: 5 }); } };
    const tb = (p, q, t, c) => K.tube([X(p[0]), p[1], z], [X(q[0]), q[1], z], t, c, { seg: 7, sil: W.H });
    const R = [-s * 0.56, r], F = [s * 0.56, r], B = [0.02 * s, 0.32], S = [-s * 0.2, 0.74], H = [s * 0.34, 0.86];
    for (const W0 of [R, F]) { ring(W0[0], W0[1], r - 0.016, 0.02, 'tire', 22); ring(W0[0], W0[1], r - 0.04, 0.008, 'chromeL', 22); K.lathe('z', X(W0[0]), W0[1], [[z - 0.05, 0.016], [z - 0.05, 0.02], [z + 0.05, 0.02], [z + 0.05, 0.016]], 'alum', { seg: 8 }); for (let i = 0; i < 20; i++) { const t = (i / 20) * 6.2832; K.line([X(W0[0]), W0[1], z + (i % 2 ? 0.03 : -0.03)], [X(W0[0] + Math.cos(t) * (r - 0.045)), W0[1] + Math.sin(t) * (r - 0.045), z], W.H, { lc: 'inkG', fade: 0.14 }); } }
    tb(B, S, 0.021, col); tb(B, H, 0.026, col); tb([H[0] - s * 0.04, H[1] - 0.12], [B[0] + s * 0.12, B[1] + 0.14], 0.016, col);
    for (const dz of [-0.05, 0.05]) { K.tube([X(R[0]), R[1], z + dz], [X(B[0]), B[1], z + dz * 0.5], 0.009, col, { seg: 5 }); K.tube([X(R[0]), R[1], z + dz], [X(S[0]), S[1] - 0.02, z + dz * 0.3], 0.007, col, { seg: 5 }); K.tube([X(F[0]), F[1], z + dz], [X(H[0]), H[1] - 0.06, z], 0.012, col, { seg: 5 }); }
    tb(H, [H[0] - s * 0.02, H[1] + 0.2], 0.013, 'alum'); K.tube([X(H[0] - s * 0.02), H[1] + 0.2, z - 0.28], [X(H[0] - s * 0.02), H[1] + 0.2, z + 0.28], 0.011, 'alum', { seg: 6 });
    for (const e of [-1, 1]) K.tube([X(H[0] - s * 0.02), H[1] + 0.2, z + e * 0.2], [X(H[0] - s * 0.02), H[1] + 0.2, z + e * 0.3], 0.016, 'rubber', { seg: 6, caps: true });
    tb(S, [S[0] - s * 0.03, S[1] + 0.13], 0.013, 'alum');
    const sx = X(S[0] - s * 0.03), sy = S[1] + 0.15; K.lathe('x', sy, z, [[sx - s * 0.13, 0.03], [sx - s * 0.05, 0.075], [sx + s * 0.03, 0.05], [sx + s * 0.13, 0.016]], 'rubber', { seg: 8, sil: W.H });
    K.lathe('z', X(B[0]), B[1], [[z - 0.03, 0.001], [z - 0.03, 0.07], [z + 0.03, 0.07], [z + 0.03, 0.001]], 'steelD', { seg: 14, rim: W.H, fade: 0.1 });
    K.tube([X(B[0]), B[1], z - 0.05], [X(B[0] + s * 0.05), B[1] - 0.14, z - 0.06], 0.008, 'alum', { seg: 4 }); K.box(X(B[0] + s * 0.05) - 0.05, B[1] - 0.16, z - 0.09, X(B[0] + s * 0.05) + 0.05, B[1] - 0.14, z - 0.03, 'rubber', { ink: 0 });
    K.tube([X(R[0]), R[1] + 0.03, z - 0.04], [X(B[0]), B[1] + 0.05, z - 0.04], 0.02, col, { seg: 5, r2: 0.04 });
    // front rack and carried basket, open-weave
    const bx0 = X(H[0] + s * 0.03) - 0.16, bx1 = bx0 + 0.32, by = H[1] - 0.06;
    K.box(bx0, by - 0.01, z - 0.14, bx1, by, z + 0.14, 'steelD', { ink: 0 });
    for (const q of [0, 1, 2, 3, 4]) { const u = bx0 + (q * 0.32) / 4; K.line([u, by, z - 0.14], [u, by + 0.16, z - 0.14], W.H, { fade: 0.1 }); K.line([u, by, z + 0.14], [u, by + 0.16, z + 0.14], W.H, { fade: 0.1 }); }
    K.pline([[bx0, by + 0.16, z - 0.14], [bx1, by + 0.16, z - 0.14], [bx1, by + 0.16, z + 0.14], [bx0, by + 0.16, z + 0.14]], true, W.D, { fade: 0.08 });
    K.pline([[bx0, by + 0.08, z - 0.14], [bx1, by + 0.08, z - 0.14], [bx1, by + 0.08, z + 0.14], [bx0, by + 0.08, z + 0.14]], true, W.H, { fade: 0.1 });
    K.castBox([X(-0.7), 0.1, z - 0.05], [X(0.7), 0.95, z + 0.05]);
  }
  AV.bikeDock = function (K, s, z0, z1) {
    K.begin('dock');
    const xc = s * 4.82, n = Math.round((z1 - z0) / 0.62) ;
    K.box(xc - 0.09, 0, z0, xc + 0.09, 0.05, z1, 'alum', { ink: W.D });
    for (let i = 0; i < n; i++) {
      const z = z0 + 0.26 + i * 0.62;
      K.box(xc - 0.07, 0.05, z - 0.05, xc + 0.07, 0.68, z + 0.05, 'alum', { ink: W.H, fade: 0.08 });
      if (i !== 2) bike(K, xc, z - 0.08, -s, 'bikeB');
    }
    // the pay station at the near end of the rail
    const kz = z0 - 0.02; K.box(xc - 0.22, 0, kz - 0.12, xc + 0.22, 1.62, kz + 0.12, 'bikeB', { ink: W.D });
    const pl = K.plane([xc, 0, kz - 0.121], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    pl.rect(-0.17, 1.02, 0.17, 1.52, 'g1', { off: 0.001, ink: W.H }); pl.rect(-0.14, 0.34, 0.14, 0.9, 'paper', { off: 0.001, ink: W.H, fade: 0.1 });
    pl.text('BIKE', 0, 0.7, 0.07, 'bikeB', { align: 'center', off: 0.002, font: 'bebas', track: 0.06 }); for (const y of [0.42, 0.48, 0.54, 0.6]) pl.line(-0.11, y, 0.11, y, W.H, { off: 0.002, fade: 0.12 });
    K.end();
  };
  // Street works: a steam main under repair. Steel road plate, cones, barrels, a lettered barricade and the striped chimney.
  function cone(K, x, z) {
    K.box(x - 0.17, 0, z - 0.17, x + 0.17, 0.03, z + 0.17, 'tire', { ink: W.H, fade: 0.1 });
    K.cyl('y', 0.03, 0.26, x, z, 0.13, 'cone', { sil: W.D, r2: 0.09, seg: 14, noCapA: true, noCapB: true, lit: true });
    K.cyl('y', 0.26, 0.46, x, z, 0.09, 'coneW', { sil: W.D, r2: 0.058, seg: 14, noCapA: true, noCapB: true, rim: 0, lit: true });
    K.cyl('y', 0.46, 0.74, x, z, 0.058, 'cone', { sil: W.D, r2: 0.022, seg: 14, noCapA: true, lit: true });
  }
  function barrel(K, x, z) {
    for (let i = 0; i < 5; i++) { const a = i * 0.21, b = a + 0.21; K.cyl('y', a, b, x, z, 0.3 - i * 0.008, i % 2 ? 'coneW' : 'cone', { sil: W.D, r2: 0.3 - (i + 1) * 0.008, seg: 18, noCapA: true, noCapB: i !== 4, lit: true }); }
    K.box(x - 0.4, 0, z - 0.4, x + 0.4, 0.05, z + 0.4, 'tire', { ink: W.H, fade: 0.1 });
    K.cyl('y', 1.05, 1.2, x, z, 0.03, 'rail', { sil: W.H, seg: 6 }); K.cyl('z', z - 0.06, z, x, 1.27, 0.09, 'sigY', { sil: W.H, seg: 12 });
  }
  AV.workZone = function (K, x0, x1, z0, z1) {
    K.begin('works');
    const rd = K.plane([0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]);
    // cut patch of new asphalt with the plate over the trench
    rd.rect(x0 - 0.35, z0 - 0.3, x1 + 0.35, z1 + 0.3, 'patchN', { off: 0.0065, ink: W.D, fade: 0.05 });
    const a = x0 + 0.05, b = x1 - 0.05, c = z0 + 0.05, d = z1 - 0.05;
    K.face([[a, 0.03, c], [b, 0.03, c], [b, 0.03, d], [a, 0.03, d]], 'plate', { ink: W.F, shade: 1.15 });
    K.face([[a, 0.008, c - 0.03], [b, 0.008, c - 0.03], [b, 0.03, c], [a, 0.03, c]], 'tire');
    for (let u = a + 0.12; u < b; u += 0.22) for (let z = c + 0.12; z < d; z += 0.22) K.line([u - 0.035, 0.032, z - 0.035], [u + 0.035, 0.032, z + 0.035], W.H, { lc: 'inkG', fade: 0.2 });
    for (const [u, z] of [[a + 0.12, c + 0.12], [b - 0.12, c + 0.12], [a + 0.12, d - 0.12], [b - 0.12, d - 0.12]]) K.cyl('y', 0.03, 0.05, u, z, 0.05, 'alum', { sil: W.H, seg: 8, noCapA: true });
    K.end();
    // near edge: a barricade on two trestles
    K.begin('barricade');
    const by = 1.02, bz = z0 - 0.55, bl = x0 + 0.12, br = x1 - 0.1;
    for (const x of [bl + 0.25, br - 0.25]) {
      // folding trestle: two steel legs each way, a spreader, its foot on a rubber pad and a sandbag
      for (const dz of [-0.18, 0.18]) { K.tube([x - 0.26, 0.02, bz + dz], [x, by, bz], 0.018, 'rail', { seg: 5, sil: W.H }); K.tube([x + 0.26, 0.02, bz + dz], [x, by, bz], 0.018, 'rail', { seg: 5, sil: W.H }); }
      K.tube([x - 0.13, by * 0.5, bz + 0.09], [x + 0.13, by * 0.5, bz + 0.09], 0.01, 'rail', { seg: 4 });
      K.box(x - 0.3, 0, bz - 0.22, x + 0.3, 0.035, bz + 0.22, 'rubber', { ink: W.H, fade: 0.1 });
      K.lathe('x', 0.07, bz - 0.02, [[x - 0.18, 0.01], [x - 0.14, 0.05], [x + 0.14, 0.05], [x + 0.18, 0.01]], 'card', { seg: 8, sil: W.H });
    }
    K.box(bl, by - 0.3, bz - 0.02, br, by, bz + 0.02, 'coneW', { ink: W.D });
    const pl = K.plane([(bl + br) / 2, 0, bz - 0.021], [1, 0, 0], [0, 1, 0], [0, 0, -1]), hw = (br - bl) / 2;
    for (let i = 0; i < 2; i++) { const s = i ? 1 : -1, y0 = by - 0.3, y1 = by; for (let k = 0; k < 3; k++) { const q = s * (hw - k * 0.24); pl.poly([[q, y0], [q - s * 0.11, y0], [q - s * 0.25, y1], [q - s * 0.14, y1]], 'cone', { off: 0.001 }); } }
    AV.type(pl, '道路施工', -0.06, by - 0.25, 0.17, 'sgnK', { font: 'hei', align: 'center', off: 0.002, track: 0.06 });
    K.box(bl, by - 0.72, bz - 0.015, br, by - 0.58, bz + 0.015, 'cone', { ink: W.D });
    K.end();
    K.begin('cones');
    [[x0 - 0.25, z0 + 0.25], [x0 - 0.25, z0 + 1.15], [x0 - 0.25, z0 + 2.05], [x0 - 0.25, z1 + 0.25]].forEach(q => cone(K, q[0], q[1]));
    K.end();
    K.begin('barrel'); barrel(K, x1 + 0.34, z0 + 0.2); K.end();
  };

  // Black rubbish bags piled against the kerb: lumpy, tied at the neck, each one its own shape
  AV.trashBags = function (K, s, z, n) {
    K.begin('bags@' + s + ',' + z);
    const x0 = s * (AV.G.RW + 0.62), y0 = AV.G.CURB, rnd = AV.rng(Math.round(z * 17) + n);
    for (let i = 0; i < n; i++) {
      const r = 0.3 + rnd() * 0.08, h = r * (1.5 + rnd() * 0.25), cx = x0 + s * (i % 2 ? 0.46 : 0) + (rnd() - 0.5) * 0.08, cz = z + (i % 3) * 0.56 + rnd() * 0.1, cy = y0 + (i >= 3 ? 0.42 : 0), seg = 16, rows = 8, col = 'bagK';
      const ph = Array.from({ length: seg }, () => 0.9 + rnd() * 0.16);
      const ring = j => { const v = j / rows, ry = Math.sin(v * Math.PI * 0.9 + 0.1) * r; return Array.from({ length: seg }, (_, k) => { const t = (k / seg) * 6.283; return [cx + Math.cos(t) * ry * ph[k], cy + v * h, cz + Math.sin(t) * ry * ph[k]]; }); };
      const nr = (j, k) => { const v = j / rows, t = (k / seg) * 6.283, up = Math.cos(v * Math.PI * 0.9 + 0.1); return [Math.cos(t), up, Math.sin(t)]; };
      for (let j = 0; j < rows; j++) { const a = ring(j), b = ring(j + 1); for (let k = 0; k < seg; k++) { const k1 = (k + 1) % seg; K.face([a[k], a[k1], b[k1], b[k]], col, { normals: [nr(j, k), nr(j, k1), nr(j + 1, k1), nr(j + 1, k)] }); } }
      // knot and a couple of crease lines
      K.cyl('y', cy + h, cy + h + 0.07, cx, cz, 0.018, col, { sil: W.H, r2: 0.05, seg: 6 });
      K.line([cx - r * 0.5, cy + h * 0.25, cz - r * 0.7], [cx - r * 0.1, cy + h * 0.72, cz - r * 0.35], W.H, { lc: 'inkL', fade: 0.14 });
      K.line([cx + r * 0.4, cy + h * 0.2, cz - r * 0.7], [cx + r * 0.15, cy + h * 0.7, cz - r * 0.4], W.H, { lc: 'inkL', fade: 0.14 });
    }
    K.end();
  };
  // Pots on a fire-escape deck and washing over its rail
  AV.escapeLife = function (w, u0, u1, y, depth, rnd, lod) {
    if (rnd() < 0.55) for (let i = 0, n = 1 + Math.floor(rnd() * 3); i < n; i++) {
      const u = u0 + 0.2 + rnd() * (u1 - u0 - 0.4), f = depth - 0.16, c = rnd() < 0.5 ? 'pot' : 'crateR';
      w.box(u - 0.09, y, u + 0.09, y + 0.15, f - 0.08, f + 0.08, c, { ink: W.H, fade: 0.08 });
      const pts = Array.from({ length: 9 }, (_, k) => { const t = (k / 9) * 6.283, r = 0.13 + rnd() * 0.08; return [u + Math.cos(t) * r, y + 0.27 + Math.sin(t) * r]; });
      w.poly(pts, f + 0.081, rnd() < 0.5 ? 'leaf' : 'leafD', { ink: W.H, fade: 0.1 });
    }
    if (rnd() < 0.34) {
      const yr = y + 0.95, f = depth + 0.012; let u = u0 + 0.15 + rnd() * 0.3;
      for (let i = 0, n = 1 + Math.floor(rnd() * 3); i < n && u < u1 - 0.5; i++) {
        const wd = 0.28 + rnd() * 0.34, dr = 0.42 + rnd() * 0.3, c = ['paper', 'cloB', 'cloR', 'awnW', 'cloY'][Math.floor(rnd() * 5)];
        w.poly([[u, yr + 0.01], [u + wd, yr + 0.01], [u + wd - 0.015, yr - dr], [u + wd * 0.5, yr - dr - 0.02], [u + 0.015, yr - dr]], f, c, { ink: W.H, fade: 0.09 });
        u += wd + 0.08 + rnd() * 0.15;
      }
    }
  };

  // Folding A-board on the pavement, hand-lettered
  AV.aBoard = function (K, s, z, cn, en, col) {
    K.begin('aboard@' + z);
    const x = s * (AV.G.RW + 1.55), y0 = AV.G.CURB, w = 0.3, H = 0.95, lean = 0.2;
    K.tone = s < 0 ? 'shade' : 'dim';
    K.face([[x - w, y0, z - lean], [x + w, y0, z - lean], [x + w, y0 + H, z], [x - w, y0 + H, z]], col || 'sgnK', { ink: W.D, fade: 0.08 });
    K.face([[x - w, y0, z + lean], [x + w, y0, z + lean], [x + w, y0 + H, z], [x - w, y0 + H, z]], 'wood', { ink: W.D, fade: 0.08 });
    const dy = H, dz = lean, L = Math.hypot(dy, dz);
    const pl = K.plane([x, y0, z - lean - 0.002], [1, 0, 0], [0, dy / L, dz / L], [0, -dz / L, -dy / L]);
    AV.type(pl, cn, 0, 0.84, 0.17, 'sgnW', { font: 'hand', vertical: true, lead: 1.05, off: 0, hand: 0.04 });
    if (en) { const m = AV.typeFit(en, 0.07, w * 1.7, { font: 'elite' }); AV.type(pl, en, 0, 0.07, m.h, 'papY', { font: 'elite', align: 'center', sx: m.sx, off: 0 }); }
    K.tone = 'none'; K.end();
  };
})();
