/* Canal Street station, under the street, in the same projection as everything above it.
 * Cross-section: road slab, utilities, a roof of steel and jack arches; a mezzanine gallery along each wall; two side platforms;
 * two tracks between them. Nothing here is a picture: the street stair comes down through the roof to the left gallery,
 * you pass the turnstiles, and a stair takes you to the platform. Every long line runs to the one vanishing point. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;
  const D = (AV.ST = { W: 9.6, CE: -6.9, GF: -10.2, PF: -14.6, TR: -15.65, END: 165, EDGE: 3.3, GAL: 7.4, X: 60, TRACK: 1.7, BR: [0.8, 17], FARE: 3.8, roofHoles: [[7.75, 9.45, 7.4, 11.1], [-9.42, -7.62, 45, 50.1]] });
  const RAIL = (AV.RAIL = { halfGauge: 0.72, head: 0.18 });
  const TRAIN = (AV.TRAIN = { start: 1.2, length: 18.4, spacing: 18.7, wheelRadius: 0.42, bogieInset: 1.8 });
  const STEP = 12, BAY = 4.6;

  // One stair, along any axis. map(u, y, c): u runs down the flight, c across it. lands: step numbers with a 1.2 m landing after them.
  // o.wall: an enclosed shaft: tiled cheeks 2.25 m above the treads and a soffit, top limited by topMax / topMin. Otherwise: an open flight on stringers with rails.
  function stairRun(K, map, c0, c1, y0, run, rise, n, lands, o) {
    o = o || {}; lands = lands || [];
    const prof = [[0, y0]]; let u = 0, y = y0;
    K.tone = 'none';
    for (let i = 0; i < n; i++) {
      const y1 = y - rise, u1 = u + run;
      K.face([map(u, y, c0), map(u, y, c1), map(u, y1, c1), map(u, y1, c0)], o.mat || 'terr', { shade: 0.76 });
      K.face([map(u, y1, c0), map(u, y1, c1), map(u1, y1, c1), map(u1, y1, c0)], o.mat || 'terr', {});
      K.face([map(u, y1 + 0.002, c0), map(u, y1 + 0.002, c1), map(u + 0.045, y1 + 0.002, c1), map(u + 0.045, y1 + 0.002, c0)], 'steelD', {});
      K.line(map(u, y, c0), map(u, y, c1), W.H, { fade: 0.07 });
      prof.push([u, y1], [u1, y1]); u = u1; y = y1;
      if (lands.includes(i + 1)) { const u2 = u + 1.2; K.face([map(u, y, c0), map(u, y, c1), map(u2, y, c1), map(u2, y, c0)], o.mat || 'terr', {}); prof.push([u2, y]); u = u2; }
    }
    // the structural slab under the flight
    const under = prof.map(q => [q[0], q[1] - 0.26]);
    for (let i = 0; i < under.length - 1; i++) { const a = under[i], b = under[i + 1]; if (b[0] - a[0] < 1e-3) continue; K.face([map(a[0], a[1], c0), map(b[0], b[1], c0), map(b[0], b[1], c1), map(a[0], a[1], c1)], 'slab', {}); }
    const side = (c, col, wall) => {
      const low = prof.slice();
      if (!wall) { K.face(low.concat(under.slice().reverse()).map(q => map(q[0], q[1], c)), 'slab', { concave: true, ink: W.H, fade: 0.08 }); return; }
      const top = prof.filter((q, i) => i % 2 === 0 || i === prof.length - 1).map(q => [q[0], Math.max(o.topMin == null ? -99 : o.topMin, Math.min(o.topMax == null ? 99 : o.topMax, q[1] + 2.25))]);
      K.face(low.concat(top.slice().reverse()).map(q => map(q[0], q[1], c)), col, { concave: true, ink: W.H, fade: 0.07 });
      return top;
    };
    let top = null;
    for (const c of [c0, c1]) { const t = o.wall ? side(c, 'tileS', true) : side(c); if (t) top = t; if (o.wall && o.wallOut) { /* cheeks read from both sides */ } }
    if (top) for (let i = 0; i < top.length - 1; i++) {
      const a = top[i], b = top[i + 1]; if (b[0] - a[0] < 1e-3) continue;
      const flush = o.topMin != null && a[1] <= o.topMin + 1e-3 && b[1] <= o.topMin + 1e-3, open = o.openTop != null && a[1] >= o.openTop - 1e-3 && b[1] >= o.openTop - 1e-3;
      if (flush || open) continue;
      K.face([map(a[0], a[1], c0), map(b[0], b[1], c0), map(b[0], b[1], c1), map(a[0], a[1], c1)], 'ceilP', { shade: 1.1 });
      if (i % 4 === 1) { const m = (c0 + c1) / 2; K.face([map(a[0], a[1] - 0.012, m - 0.07), map(b[0], b[1] - 0.012, m - 0.07), map(b[0], b[1] - 0.012, m + 0.07), map(a[0], a[1] - 0.012, m + 0.07)], 'tubeL', {}); }
    }
    // handrails, on brackets from the cheeks or on balusters over the stringers
    for (const c of [c0, c1]) {
      const cc = c + (c === c0 ? 1 : -1) * (o.wall ? 0.05 : 0), rail = prof.filter((q, i) => i % 2 === 0 || i === prof.length - 1);
      for (let i = 0; i < rail.length - 1; i += 1) { const a = rail[i], b = rail[i + 1]; if (b[0] - a[0] < 1e-3) continue; K.tube(map(a[0], a[1] + 0.9, cc), map(b[0], b[1] + 0.9, cc), 0.02, 'chrome', { seg: 6 }); if (!o.wall && i % 2 === 0) K.tube(map(a[0], a[1], cc), map(a[0], a[1] + 0.9, cc), 0.01, 'chrome', { seg: 5 }); }
    }
    return { len: u, y };
  }
  AV.stairRun = stairRun;

  // A stair with mass. Poured concrete: treads with a steel nosing and a proud lip, a sloping soffit, a solid parapet each side with a stone coping and a rail
  // on brackets above it. map(u, y, c): u runs down the flight, c across it. o.parapets: which of c0 / c1 carry a parapet; o.cut: the side sawn by the picture plane.
  function solidStair(K, map, c0, c1, y0, run, rise, n, o) {
    o = o || {}; const T = o.t == null ? 0.16 : o.t, TH = 0.42, H = 0.95, mat = o.mat || 'terr', pts = [[0, y0]];
    let u = 0, y = y0;
    for (let i = 0; i < n; i++) {
      const y1 = y - rise, u1 = u + run;
      K.face([map(u, y, c0), map(u, y, c1), map(u, y1, c1), map(u, y1, c0)], mat, { shade: 0.74 });
      const lip = i ? u - 0.025 : u;
      K.face([map(lip, y1, c0), map(lip, y1, c1), map(u1, y1, c1), map(u1, y1, c0)], mat, {});
      K.face([map(lip, y1 + 0.003, c0), map(lip, y1 + 0.003, c1), map(u + 0.035, y1 + 0.003, c1), map(u + 0.035, y1 + 0.003, c0)], 'steelD', {});
      K.face([map(lip, y1 - 0.03, c0), map(lip, y1 - 0.03, c1), map(lip, y1, c1), map(lip, y1, c0)], 'steelD', {});
      K.line(map(lip, y1, c0), map(lip, y1, c1), W.H, { fade: 0.07 });
      pts.push([u, y1], [u1, y1]); u = u1; y = y1;
    }
    const L = u, yE = y, sl = (u_) => y0 + ((yE - y0) * u_) / L, under = [[0, y0 - TH], [L, yE - TH]];
    const sideOf = c => (c === c0 ? -1 : 1), cs = o.parapets || [c0, c1];
    // soffit, spanning under the parapets too
    const ca = cs.includes(c0) ? c0 - T : c0, cb = cs.includes(c1) ? c1 + T : c1;
    K.face([map(0, y0 - TH, ca), map(0, y0 - TH, cb), map(L, yE - TH, cb), map(L, yE - TH, ca)], 'slab', {});
    K.face([map(L, yE, ca), map(L, yE, cb), map(L, yE - TH, cb), map(L, yE - TH, ca)], 'slab', { ink: W.D, fade: 0.05 });
    for (const c of cs) {
      const out = c + sideOf(c) * T;
      // inner face, steps to coping; outer face, soffit to coping; a bevelled coping on top
      const inner = pts.concat([[L, yE + H], [0, y0 + H]]);
      K.face(inner.map(q => map(q[0], q[1], c)), 'tileS', { concave: true, ink: W.H, fade: 0.07 });
      K.face([map(0, y0 - TH, out), map(L, yE - TH, out), map(L, yE + H, out), map(0, y0 + H, out)], 'tileS', { shade: 0.86, ink: W.D, fade: 0.05 });
      K.face([map(0, y0 + H, c), map(L, yE + H, c), map(L, yE + H, out), map(0, y0 + H, out)], 'stone', { ink: W.H, fade: 0.06 });
      for (const uu of [0, L]) K.face([map(uu, (uu ? yE : y0) - TH, c), map(uu, (uu ? yE : y0) - TH, out), map(uu, (uu ? yE : y0) + H, out), map(uu, (uu ? yE : y0) + H, c)], 'stone', { ink: W.D, fade: 0.05 });
      // the rail stands on the coping, on brackets every 1.2 m
      const cm = c + sideOf(c) * T / 2, rh = 0.14;
      K.tube(map(0, y0 + H + rh, cm), map(L, yE + H + rh, cm), 0.024, 'chrome', { seg: 8, sil: W.H });
      for (let q = 0.1; q < L; q += 1.2) K.tube(map(q, sl(q) + H, cm), map(q, sl(q) + H + rh, cm), 0.012, 'chrome', { seg: 5 });
      // courses of glazed tile along the outside
      for (let d = 0.3; d < H + TH; d += 0.3) K.line(map(0, y0 - TH + d, out + sideOf(c) * 0.001), map(L, yE - TH + d, out + sideOf(c) * 0.001), W.H, { lc: 'inkG', fade: 0.1 });
    }
    if (o.cut != null) {
      // concrete sawn through: a solid figure on the plane, with its section hatch
      const cc = o.cut, fig = pts.concat([[L, yE - TH], [0, y0 - TH]]);
      K.face(fig.map(q => map(q[0], q[1], cc)), 'slab', { concave: true, shade: 1.14 });
      K.pline(fig.map(q => map(q[0], q[1], cc)), true, W.F, { fade: 0 });
      for (let q = 0.06; q < L; q += 0.14) { const yy = sl(q); K.line(map(q, yy - 0.16, cc), map(q + 0.1, yy - 0.38, cc), W.H, { fade: 0, lc: 'inkG' }); }
    }
    return { len: L, y: yE };
  }
  AV.solidStair = solidStair;

  // The sidewalk rail round a stair opening: top rail, mid rail, kick rail, balusters, heavier posts, on a coping curb. Green iron.
  AV.stairRail = function (K, runs, Y) {
    const H = 1.05, rail = 'poleG';
    for (const [p, q] of runs) {
      K.tube([p[0], Y + H, p[1]], [q[0], Y + H, q[1]], 0.026, rail, { seg: 8, sil: W.D });
      K.tube([p[0], Y + H - 0.1, p[1]], [q[0], Y + H - 0.1, q[1]], 0.012, rail, { seg: 5 });
      K.tube([p[0], Y + 0.1, p[1]], [q[0], Y + 0.1, q[1]], 0.012, rail, { seg: 5 });
      const LL = Math.hypot(q[0] - p[0], q[1] - p[1]), m = Math.round(LL / 0.115);
      for (let k = 0; k <= m; k++) { const t = k / m, a = p[0] + (q[0] - p[0]) * t, b = p[1] + (q[1] - p[1]) * t; K.tube([a, Y, b], [a, Y + H - 0.02, b], k % 8 === 0 ? 0.02 : 0.007, rail, { seg: k % 8 === 0 ? 6 : 4 }); }
      K.castLine([p[0], Y + H, p[1]], [q[0], Y + H, q[1]], 0.05);
    }
  };
  AV.stairGlobe = function (K, x, z, Y) {
    const rail = 'poleG';
    K.lathe('y', x, z, [[Y - 0.02, 0.06], [Y + 0.12, 0.045], [Y + 2.3, 0.032]], rail, { seg: 10, sil: W.D });
    K.lathe('y', x, z, [[Y + 2.3, 0.07], [Y + 2.34, 0.07], [Y + 2.34, 0.03]], rail, { seg: 10 });
    const gl = 0.16, cy = Y + 2.5, pf = []; for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + (j / 8) * Math.PI; pf.push([cy + Math.sin(a) * gl, Math.max(0.001, Math.cos(a) * gl)]); }
    K.lathe('y', x, z, pf, 'grn', { seg: 16 });
    K.castLine([x, Y, z], [x, Y + 2.65, z], 0.06);
  };

  // The entrance the cut opens up: from the pavement toward the road, a landing, back toward the wall, a door, then through the roof to the gallery.
  AV.cutEntrance = function (K) {
    const y0 = AV.G.CURB, r = 0.19, run = 0.27, Y = y0, xH = 9.6, nA = 15, nB = 8, yL1 = y0 - nA * r, yL2 = yL1 - nB * r, xA = xH - nA * run, xB = xA + nB * run, zA = 1.6, zD = 1.76, zB = 3.3, xW = 4.4, xE = 9.75, CX0 = 7.75, CX1 = 9.45;
    const yF = yL2, yU = -0.46;
    K.begin('st-cutstair');
    solidStair(K, (u, y, c) => [xH - u, y, c], 0, zA, y0, run, r, nA, { mat: 'stone', parapets: [zA], cut: 0, t: zD - zA });
    solidStair(K, (u, y, c) => [xA + u, y, c], zD, zB, yL1, run, r, nB, { mat: 'stone', parapets: [] });
    // the landing is solid: a block of concrete from the floor up, sawn at the plane
    K.box(xW, yF, 0, xA, yL1, zB, 'slab', { ink: W.D, fade: 0.04, top: 'stone', skip: 'b' });
    { const pl = K.plane([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]); pl.rect(xW, yF, xA, yL1, 'slab', { off: 0.0014, shade: 1.14, ink: W.F }); for (let x = xW + 0.08; x < xA - 0.1; x += 0.16) for (let yy = yF + 0.08; yy < yL1 - 0.1; yy += 0.32) pl.line(x, yy, x + 0.09, yy + 0.2, W.H, { off: 0.002, lc: 'inkG', fade: 0 }); }
    K.face([[xW + 0.03, yL1 + 0.003, 0.03], [xA - 0.03, yL1 + 0.003, 0.03], [xA - 0.03, yL1 + 0.003, zB - 0.03], [xW + 0.03, yL1 + 0.003, zB - 0.03]], 'stone', { shade: 0.84, ink: W.H, fade: 0.06 });
    // the well's floor, and its slab sawn at the plane
    K.face([[xW, yF, 0], [xE, yF, 0], [xE, yF, zB], [xW, yF, zB]], 'stone', { shade: 0.74 });
    for (let q = xA; q < xE; q += 0.6) K.line([q, yF + 0.002, 0], [q, yF + 0.002, zB], W.H, { fade: 0.09 });
    // a rail along the open side of the landing, and round the head of the lower flight
    K.tube([xW + 0.05, yL1 + 1.05, zD], [xA, yL1 + 1.05, zD], 0.024, 'chrome', { seg: 6, sil: W.H });
    for (const q of [0.1, 0.6, 1.1]) K.tube([xW + q, yL1, zD], [xW + q, yL1 + 1.05, zD], 0.014, 'chrome', { seg: 5 });
    const nC = 34, rC = (yL2 - D.GF) / nC;
    stairRun(K, (u, y, c) => [c, y, zB + u], CX0, CX1, yL2, 0.28, rC, nC, [], { wall: true, topMax: yL2 + 2.25, topMin: D.CE });
    // tiled walls, and the back wall with the doorway to the long flight
    const Tw = (pts, shade) => K.face(pts, 'tileS', { shade: shade || 0.86, ink: W.H, fade: 0.07, concave: pts.length > 4 });
    Tw([[xW, yF, 0], [xW, yU, 0], [xW, yU, zB], [xW, yF, zB]]);
    Tw([[xE, yF, 0], [xE, -0.22, 0], [xE, -0.22, zB], [xE, yF, zB]]);
    K.face([[xW, yF, zB], [xE, yF, zB], [xE, -0.22, zB], [6, -0.22, zB], [6, yU, zB], [xW, yU, zB]], 'tileS', { shade: 0.8, concave: true, holes: [[[CX0, yL2, zB], [CX1, yL2, zB], [CX1, yL2 + 2.25, zB], [CX0, yL2 + 2.25, zB]]] });
    K.pline([[CX0, yL2, zB - 0.003], [CX0, yL2 + 2.25, zB - 0.003], [CX1, yL2 + 2.25, zB - 0.003], [CX1, yL2, zB - 0.003]], false, W.D, { fade: 0.07 });
    { const so = K.plane([(CX0 + CX1) / 2, 0, zB - 0.004], [1, 0, 0], [0, 1, 0], [0, 0, -1]); so.rect(-0.85, yL2 + 2.34, 0.85, yL2 + 2.86, 'stGreen', { off: 0, ink: W.H }); so.text('CANAL ST', -0.2, yL2 + 2.51, 0.15, 'sgnW', { align: 'center', off: 0.001, font: 'overpass', track: 0.05 }); AV.type(so, '站', 0.62, yL2 + 2.44, 0.26, 'sgnW', { font: 'hei', align: 'center', off: 0.001 }); }
    // ceilings: the road's and the pavement's slabs, seen from under
    K.face([[xW, yU, 0], [6, yU, 0], [6, yU, zB], [xW, yU, zB]], 'ceilP', {});
    K.face([[6, -0.22, zA], [xE, -0.22, zA], [xE, -0.22, zB], [6, -0.22, zB]], 'ceilP', {});
    K.face([[6, -0.22, 0], [6.24, -0.22, 0], [6.24, -0.22, zA], [6, -0.22, zA]], 'ceilP', {});
    K.face([[6, yU, 0], [6, -0.22, 0], [6, -0.22, zB], [6, yU, zB]], 'slab', {});
    K.face([[9.6, -0.22, 0], [xE, -0.22, 0], [xE, -0.22, zA], [9.6, -0.22, zA]], 'ceilP', {});
    K.face([[9.6, y0, 0], [9.6, y0, zA], [9.6, -0.22, zA], [9.6, -0.22, 0]], 'slab', { ink: W.H });
    K.face([[6.24, y0, zA], [9.6, y0, zA], [9.6, -0.22, zA], [6.24, -0.22, zA]], 'slab', { ink: W.H });
    K.face([[6.24, y0, 0], [6.24, y0, zA], [6.24, -0.22, zA], [6.24, -0.22, 0]], 'slab', { ink: W.H });
    for (const [a, b, zz, yy] of [[4.7, 5.8, 1.65, yU], [7.2, 9.2, 2.5, -0.22]]) { K.face([[a, yy - 0.04, zz - 0.07], [b, yy - 0.04, zz - 0.07], [b, yy - 0.04, zz + 0.07], [a, yy - 0.04, zz + 0.07]], 'tubeL', {}); K.box(a - 0.03, yy - 0.03, zz - 0.11, b + 0.03, yy, zz + 0.11, 'alum', { ink: W.H, skip: 't' }); }
    K.end();
    K.begin('st-cutrail');
    const cop = (a, b, c, d) => K.box(a, Y, c, b, Y + 0.08, d, 'stone', { ink: W.H, fade: 0.09, skip: 'b' });
    cop(6.24, 9.6, zA, zA + 0.12); cop(6.24, 6.36, 0, zA);
    AV.stairRail(K, [[[6.3, zA + 0.06], [9.6, zA + 0.06]], [[6.3, 0.02], [6.3, zA + 0.06]]], Y + 0.08);
    AV.stairGlobe(K, 9.62, zA + 0.06, Y + 0.08);
    K.end();
  };

  // an I-section column in its parts: two flanges, a web, base and cap plates, a line of rivets, the porcelain name plate on every third one
  function column(K, x, z, y0, y1, near, plate) {
    const F = 0.15, T = 0.022, c = 'colG';
    if (!near) { K.box(x - F, y0, z - F, x + F, y1, z + F, c, { ink: W.H, fade: 0.05, skip: 'tb' }); return; }
    K.box(x - F, y0, z - F, x + F, y1, z - F + T, c, { ink: W.D, skip: 'tb', fade: 0.05 });
    K.box(x - F, y0, z + F - T, x + F, y1, z + F, c, { ink: W.D, skip: 'tb', fade: 0.05 });
    K.box(x - 0.012, y0, z - F, x + 0.012, y1, z + F, c, { ink: W.H, skip: 'tb', fade: 0.07 });
    K.box(x - 0.24, y0, z - 0.24, x + 0.24, y0 + 0.05, z + 0.24, 'colG', { ink: W.H, skip: 'b' });
    K.box(x - 0.2, y1 - 0.08, z - 0.2, x + 0.2, y1, z + 0.2, 'colG', { ink: W.H, skip: 't' });
    const pl = K.plane([x, 0, z - F - 0.001], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    for (const u of [-0.11, 0.11]) for (let y = y0 + 0.25; y < y1 - 0.2; y += 0.22) pl.disc(u, y, 0.009, 0.009, 'steelD', { off: 0, seg: 6 });
    if (plate) {
      const y = y0 + 1.72; pl.rect(-0.14, y, 0.14, y + 0.86, 'tileW', { off: 0.001, ink: W.D, shade: 1.1 });
      AV.type(pl, '堅尼街', 0, y + 0.82, 0.15, 'sgnK', { font: 'hei', vertical: true, lead: 1.1, off: 0.002 });
      for (const q of [0.06, 0.8]) pl.disc(0, y + q, 0.012, 0.012, 'steelD', { off: 0.002, seg: 6 });
    }
  }

  function railHeadAndWeb(K, x, z0, z1) {
    K.box(x - 0.07, D.TR + 0.03, z0, x + 0.07, D.TR + 0.05, z1, 'steelD', { ink: 0, skip: 'bfk' });
    K.box(x - 0.01, D.TR + 0.05, z0, x + 0.01, D.TR + 0.14, z1, 'steelD', { ink: 0, skip: 'bfk' });
    K.box(x - 0.035, D.TR + 0.14, z0, x + 0.035, D.TR + RAIL.head, z1, 'steelD', { ink: 0, skip: 'bfk', top: 'railTop' });
    K.line([x - 0.035, D.TR + RAIL.head, z0], [x - 0.035, D.TR + RAIL.head, z1], W.H, { fade: 0.03 }); K.line([x + 0.035, D.TR + RAIL.head, z0], [x + 0.035, D.TR + RAIL.head, z1], W.H, { fade: 0.03 });
  }

  function track(K, xc, side) {
    const b = xc + side * 1.25;
    for (let z = 0; z < D.END; z += STEP) {
      const e = Math.min(z + STEP, D.END);
      railHeadAndWeb(K, xc - RAIL.halfGauge, z, e); railHeadAndWeb(K, xc + RAIL.halfGauge, z, e);
      // third rail on its insulators, under a timber cover board
      K.box(b - 0.04, D.TR + 0.24, z, b + 0.04, D.TR + 0.34, e, 'steelD', { ink: 0, skip: 'bfk' });
      K.box(b - 0.13, D.TR + 0.39, z, b + 0.13, D.TR + 0.42, e, 'wood', { ink: W.H, fade: 0.05, skip: 'fk' });
      // the drip channel between the rails
      K.face([[xc - 0.42, D.TR + 0.004, z], [xc + 0.42, D.TR + 0.004, z], [xc + 0.42, D.TR + 0.004, e], [xc - 0.42, D.TR + 0.004, e]], 'soil', {});
    }
    for (let z = 0.3; z < 70; z += 0.62) { K.box(xc - 1.15, D.TR, z, xc + 1.15, D.TR + 0.03, z + 0.22, 'woodD', { ink: W.H, fade: 0.12, skip: 'b' }); if (z < 26) for (const u of [-0.72, 0.72]) K.box(xc + u - 0.13, D.TR + 0.03, z + 0.02, xc + u + 0.13, D.TR + 0.04, z + 0.2, 'steelD', { ink: 0, skip: 'b' }); }
    for (let z = 2; z < 70; z += 3.1) { K.box(b - 0.05, D.TR, z, b + 0.05, D.TR + 0.24, z + 0.12, 'tile', { ink: 0, skip: 'b' }); K.box(b - 0.02, D.TR + 0.34, z, b + 0.02, D.TR + 0.39, z + 0.04, 'steelD', { ink: 0 }); }
  }

  // A flight between two levels, along the z axis: the solid stair, with steel posts under its soffit
  function flight(K, x0, x1, z0, yTop, yBot) {
    const n = Math.round((yTop - yBot) / 0.19), rise = (yTop - yBot) / n, r = solidStair(K, (u, y, c) => [c, y, z0 + u], x0, x1, yTop, 0.29, rise, n, {});
    for (const t of [0.34, 0.68]) for (const x of [x0 - 0.08, x1 + 0.08]) { const z = z0 + r.len * t, y = yTop + (r.y - yTop) * t - 0.42; K.box(x - 0.05, D.PF, z - 0.05, x + 0.05, y, z + 0.05, 'colG', { ink: W.H, fade: 0.05, skip: 'tb' }); }
    return z0 + r.len;
  }

  // Turnstile, in its parts: a stainless cabinet with a sloped top, door panels and a foot; a card reader with its lit screen; a direction lamp; the hub and its three arms, one always level across the lane.
  function turnstile(K, x, z, dir, sign) {
    const y = D.GF, HL = 0.5, W0 = 0.1, H = 0.92;
    K.box(x - W0 - 0.015, y, z - HL - 0.015, x + W0 + 0.015, y + 0.06, z + HL + 0.015, 'steelD', { ink: W.H, fade: 0.06, skip: 'b' });
    K.box(x - W0, y + 0.06, z - HL, x + W0, y + H - 0.08, z + HL, 'chromeL', { ink: W.D, fade: 0.05, skip: 't' });
    // sloped top in two facets rising toward the hub
    K.face([[x - W0, y + H - 0.08, z - HL], [x + W0, y + H - 0.08, z - HL], [x + W0, y + H, z - 0.1], [x - W0, y + H, z - 0.1]], 'chromeL', { ink: W.D, fade: 0.05 });
    K.face([[x - W0, y + H, z - 0.1], [x + W0, y + H, z - 0.1], [x + W0, y + H, z + 0.3], [x - W0, y + H, z + 0.3]], 'chromeL', { ink: W.H, fade: 0.06 });
    K.face([[x - W0, y + H, z + 0.3], [x + W0, y + H, z + 0.3], [x + W0, y + H - 0.08, z + HL], [x - W0, y + H - 0.08, z + HL]], 'chromeL', { ink: W.H, fade: 0.06 });
    for (const sg of [-1, 1]) { K.face([[x - W0, y + H - 0.08, z - HL], [x - W0, y + H, z - 0.1], [x - W0, y + H - 0.08, z - 0.1]].map(q => [x + sg * W0, q[1], q[2]]), 'chromeL', {}); K.face([[x, y + H - 0.08, z + HL], [x, y + H, z + 0.3], [x, y + H - 0.08, z + 0.3]].map(q => [x + sg * W0, q[1], q[2]]), 'chromeL', {}); K.face([[x + sg * W0, y + H - 0.08, z - 0.1], [x + sg * W0, y + H, z - 0.1], [x + sg * W0, y + H, z + 0.3], [x + sg * W0, y + H - 0.08, z + 0.3]], 'chromeL', {});
      // access door with its lock on each flank
      K.pline([[x + sg * (W0 + 0.002), y + 0.12, z - 0.42], [x + sg * (W0 + 0.002), y + 0.74, z - 0.42], [x + sg * (W0 + 0.002), y + 0.74, z + 0.42], [x + sg * (W0 + 0.002), y + 0.12, z + 0.42]], true, W.H, { fade: 0.09 });
      K.box(sg > 0 ? x + W0 : x - W0 - 0.004, y + 0.42, z + 0.3, sg > 0 ? x + W0 + 0.004 : x - W0, y + 0.47, z + 0.34, 'steelD', { ink: 0 });
    }
    // reader, tilted to the walker, with a black bezel, a lit screen and a swipe slot
    const rz0 = z - 0.38, rz1 = z - 0.14, ry0 = y + H - 0.06, ry1 = ry0 + 0.1;
    K.face([[x - 0.075, ry0 + 0.004, rz0], [x + 0.075, ry0 + 0.004, rz0], [x + 0.075, ry1 + 0.004, rz1], [x - 0.075, ry1 + 0.004, rz1]], 'sigK', { ink: W.H, fade: 0.1 });
    K.face([[x - 0.055, ry0 + 0.03, rz0 + 0.045], [x + 0.055, ry0 + 0.03, rz0 + 0.045], [x + 0.055, ry1 - 0.012, rz1 - 0.05], [x - 0.055, ry1 - 0.012, rz1 - 0.05]], sign ? 'grn' : 'red', {});
    // direction lamp facing whoever comes up to the gate
    { const pl = K.plane([x, 0, z - HL - 0.001], [1, 0, 0], [0, 1, 0], [0, 0, -1]); pl.rect(-0.07, y + 0.62, 0.07, y + 0.76, 'sigK', { off: 0, ink: W.H, fade: 0.1 }); if (sign) pl.poly([[-0.03, y + 0.65], [0.03, y + 0.65], [0.03, y + 0.69], [0.05, y + 0.69], [0, y + 0.74], [-0.05, y + 0.69], [-0.03, y + 0.69]], 'grn', { off: 0.001, concave: true }); else { pl.disc(0, y + 0.69, 0.04, 0.04, 'red', { off: 0.001, seg: 10 }); } }
    // hub on the lane side, three arms 120° apart
    const hx = x + dir * W0, zh = z + 0.02, yh = y + 0.72;
    K.lathe('x', yh, zh, [[hx, 0.07], [hx + dir * 0.03, 0.07], [hx + dir * 0.09, 0.05], [hx + dir * 0.09, 0.001]], 'chrome', { seg: 12, sil: W.H });
    for (let i = 0; i < 3; i++) { const t = (i / 3) * 6.2832 + 0.0, ex = 0.46, ca = Math.cos(t), sa = Math.sin(t); K.tube([hx + dir * 0.07, yh, zh], [hx + dir * (0.07 + ex * ca * ca + 0.04 * Math.abs(sa)), yh + sa * ex * 0.82, zh - Math.abs(sa) * 0.18 * ca], 0.017, 'chrome', { seg: 6, caps: true }); }
  }
  // Full-height exit gate: rotor of horizontal bars turning in a cage, under a hood, with its posts
  function exitGate(K, x, z) {
    const y = D.GF, H = 2.25, R0 = 0.62;
    K.box(x - R0 - 0.05, y + H, z - R0 - 0.05, x + R0 + 0.05, y + H + 0.14, z + R0 + 0.05, 'chromeL', { ink: W.D, fade: 0.05 });
    K.lathe('y', x, z, [[y, 0.05], [y + H, 0.05]], 'steelD', { seg: 10, sil: W.H });
    for (let i = 0; i < 3; i++) { const t = (i / 3) * 6.2832 + 0.5; for (let yy = y + 0.14; yy < y + H - 0.05; yy += 0.14) K.tube([x, yy, z], [x + Math.cos(t) * (R0 - 0.03), yy, z + Math.sin(t) * (R0 - 0.03)], 0.012, 'chromeL', { seg: 4 }); K.tube([x + Math.cos(t) * (R0 - 0.03), y + 0.1, z + Math.sin(t) * (R0 - 0.03)], [x + Math.cos(t) * (R0 - 0.03), y + H - 0.1, z + Math.sin(t) * (R0 - 0.03)], 0.014, 'chromeL', { seg: 5 }); }
    // the curved cage each side, and its comb of fixed bars
    for (const sg of [-1, 1]) {
      for (let k = 0; k <= 7; k++) { const t = -0.75 + (k / 7) * 1.5, px = x + sg * Math.cos(t) * R0, pz = z + Math.sin(t) * R0; K.tube([px, y, pz], [px, y + H, pz], k === 0 || k === 7 ? 0.018 : 0.009, 'chromeL', { seg: 5 }); }
      for (const yy of [y + 0.08, y + H / 2, y + H - 0.04]) for (let k = 0; k < 7; k++) { const a = -0.75 + (k / 7) * 1.5, b = -0.75 + ((k + 1) / 7) * 1.5; K.tube([x + sg * Math.cos(a) * R0, yy, z + Math.sin(a) * R0], [x + sg * Math.cos(b) * R0, yy, z + Math.sin(b) * R0], 0.009, 'chromeL', { seg: 4 }); }
    }
    K.face([[x - 0.3, y + 0.003, z - R0], [x + 0.3, y + 0.003, z - R0], [x + 0.3, y + 0.003, z + R0], [x - 0.3, y + 0.003, z + R0]], 'steelD', {});
  }
  // A ticket machine: stepped cabinet, a touch screen, card slots and a change tray
  function ticketMachine(K, s, z) {
    const y = D.GF, x = s * (D.W - 0.28), hw = 0.42, d = 0.26, inward = -s;
    K.box(x - d, y, z - hw, x + d, y + 1.9, z + hw, 'alum', { ink: W.D, fade: 0.05 });
    K.box(x - d - 0.01, y + 1.7, z - hw - 0.01, x + d + 0.01, y + 1.92, z + hw + 0.01, 'acryY', { ink: W.H });
    const pl = K.plane([x + inward * (d + 0.002), 0, z], [0, 0, s < 0 ? 1 : -1], [0, 1, 0], [inward, 0, 0]);
    pl.rect(-0.28, y + 1.06, 0.28, y + 1.55, 'sigK', { off: 0, ink: W.H }); pl.rect(-0.24, y + 1.1, 0.24, y + 1.5, 'lampG', { off: 0.001, shade: 0.85 }); for (const q of [1.42, 1.34, 1.26, 1.18]) pl.rect(-0.2, y + q, 0.2, y + q + 0.05, q === 1.42 ? 'acryB' : 'sgnW', { off: 0.002 });
    pl.rect(-0.3, y + 0.7, 0.3, y + 0.98, 'steelD', { off: 0, ink: W.H }); for (const u of [-0.2, 0, 0.2]) pl.rect(u - 0.06, y + 0.8, u + 0.06, y + 0.86, 'sigK', { off: 0.001 });
    pl.rect(-0.14, y + 0.2, 0.14, y + 0.42, 'under', { off: 0.001, ink: W.D });
    pl.text('FARE', 0, y + 1.76, 0.1, 'sgnK', { align: 'center', off: 0.012, font: 'overpass', track: 0.06 });
  }
  // The side-gallery line: a row of turnstiles from rail to wall
  function fareLine(K, side, z, booth) {
    const a = D.GAL + 0.05, b = D.W - 0.05, s = side;
    for (let u = a + 0.25; u < b - 0.2; u += 0.82) turnstile(K, s * u, z, -s, true);
    if (booth) tokenBooth(K, s * (D.W - 0.7), z - 2.2, 0.6, 1.3);
  }
  function tokenBooth(K, cx, cz, hw, hd) {
    const xa = cx - hw, xb = cx + hw, z0 = cz - hd, z1 = cz + hd, H = 2.5, y = D.GF;
    K.box(xa, y, z0, xb, y + 0.95, z1, 'stGreen', { ink: W.D, skip: 'b' });
    K.box(xa - 0.03, y + H, z0 - 0.03, xb + 0.03, y + H + 0.2, z1 + 0.03, 'stGreen', { ink: W.D });
    for (const [u, q] of [[xa, z0], [xb, z0], [xa, z1], [xb, z1]]) K.box(u - 0.035, y + 0.95, q - 0.035, u + 0.035, y + H, q + 0.035, 'stGreen', { ink: W.H });
    // the room, and what is on its desk
    K.face([[xa + 0.03, y + 0.95, z1 - 0.02], [xb - 0.03, y + 0.95, z1 - 0.02], [xb - 0.03, y + H, z1 - 0.02], [xa + 0.03, y + H, z1 - 0.02]], 'roomW', {});
    K.face([[xa + 0.03, y + H - 0.02, z0], [xb - 0.03, y + H - 0.02, z0], [xb - 0.03, y + H - 0.02, z1], [xa + 0.03, y + H - 0.02, z1]], 'tubeL', {});
    K.face([[xa + 0.03, y + 0.97, z0 + 0.03], [xb - 0.03, y + 0.97, z0 + 0.03], [xb - 0.03, y + 0.97, z1 - 0.03], [xa + 0.03, y + 0.97, z1 - 0.03]], 'wood', {});
    K.box(cx - 0.17, y + 0.97, z0 + 0.25, cx + 0.17, y + 1.27, z0 + 0.6, 'sigK', { ink: W.H }); K.box(cx - 0.22, y + 0.97, z1 - 0.7, cx + 0.22, y + 1.15, z1 - 0.3, 'seatC', { ink: W.H }); K.box(cx - 0.2, y + 0.97, z0 + 0.8, cx + 0.2, y + 1.0, z0 + 1.05, 'paper', { ink: W.H, fade: 0.1 });
    for (let i = 0; i < 4; i++) K.face([[xa + 0.03 + i * 0.28, y + 1.45, z1 - 0.025], [xa + 0.28 + i * 0.28, y + 1.45, z1 - 0.025], [xa + 0.28 + i * 0.28, y + 1.85, z1 - 0.025], [xa + 0.03 + i * 0.28, y + 1.85, z1 - 0.025]], i % 2 ? 'papY' : 'paper', { ink: W.H, fade: 0.14 });
    // glass all round, with the speak-through and the tray in the front pane
    K.glass([[xa, y + 0.95, z0], [xb, y + 0.95, z0], [xb, y + H, z0], [xa, y + H, z0]], 0);
    for (const x of [xa, xb]) K.glass([[x, y + 0.95, z0], [x, y + 0.95, z1], [x, y + H, z1], [x, y + H, z0]], 0);
    const pl = K.plane([cx, 0, z0 - 0.031], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    pl.text('TOKENS', 0, y + H + 0.05, 0.1, 'sgnW', { align: 'center', off: 0, font: 'overpass', track: 0.08 });
    { const sp = K.plane([cx, 0, z0 - 0.002], [1, 0, 0], [0, 1, 0], [0, 0, -1]); sp.disc(0, y + 1.38, 0.08, 0.08, 'chromeL', { off: 0, seg: 14, ink: W.H }); for (let i = 0; i < 6; i++) sp.disc(Math.cos(i) * 0.04, y + 1.38 + Math.sin(i) * 0.04, 0.007, 0.007, 'sigK', { off: 0.001, seg: 5 }); sp.rect(-0.2, y + 0.95, 0.2, y + 1.03, 'chromeL', { off: 0, ink: W.H }); sp.rect(-0.14, y + 0.3, 0.14, y + 0.72, 'alum', { off: 0.0005, ink: W.H }); }
  }
  // The mezzanine bridge across the tracks, and the fare line that runs across it, square to the viewer
  function bridge(K) {
    const { GAL, GF, BR, FARE, W: HW } = D, z0 = BR[0], z1 = BR[1], y = GF, T = 0.34;
    K.begin('st-bridge');
    K.face([[-GAL, y, z0], [GAL, y, z0], [GAL, y, z1], [-GAL, y, z1]], 'terr', {});
    K.face([[-GAL, y - T, z0], [GAL, y - T, z0], [GAL, y - T, z1], [-GAL, y - T, z1]], 'ceilP', { shade: 0.85 });
    for (const z of [z0, z1]) { K.face([[-GAL, y - T, z], [GAL, y - T, z], [GAL, y, z], [-GAL, y, z]], 'colG', { ink: W.D, fade: 0.03 }); for (const x of [-6, -3, 0, 3, 6]) K.box(x - 0.04, y - T, z - 0.012, x + 0.04, y, z + 0.012, 'steelD', { ink: 0 }); }
    for (let x = -GAL + 0.8; x < GAL; x += 1.2) K.box(x - 0.07, y - T - 0.18, z0, x + 0.07, y - T, z1, 'colG', { ink: W.H, fade: 0.05, skip: 't' });
    for (const x of [-6, -2.5, 2.5, 6]) { K.face([[x - 0.09, y - T - 0.21, z0 + 0.8], [x + 0.09, y - T - 0.21, z0 + 0.8], [x + 0.09, y - T - 0.21, z1 - 0.8], [x - 0.09, y - T - 0.21, z1 - 0.8]], 'tubeL', {}); K.box(x - 0.13, y - T - 0.2, z0 + 0.76, x + 0.13, y - T - 0.18, z1 - 0.76, 'alum', { ink: W.H, skip: 't' }); }
    // handrails, front and back
    for (const z of [z0 + 0.03, z1 - 0.03]) {
      K.tube([-GAL, y + 1.05, z], [GAL, y + 1.05, z], 0.03, 'chrome', { seg: 8, sil: W.H }); K.tube([-GAL, y + 0.55, z], [GAL, y + 0.55, z], 0.012, 'chrome', { seg: 5 }); K.tube([-GAL, y + 0.1, z], [GAL, y + 0.1, z], 0.012, 'chrome', { seg: 5 });
      for (let x = -GAL; x <= GAL + 0.01; x += 0.115) { const heavy = Math.round((x + GAL) / 0.115) % 12 === 0; K.tube([x, y, z], [x, y + 1.05, z], heavy ? 0.02 : 0.006, heavy ? 'chrome' : 'colG', { seg: heavy ? 6 : 4 }); }
    }
    K.end();
    K.begin('st-fare');
    // the floor changes at the line: a strip you cross when you have paid
    K.face([[-HW, y + 0.003, FARE - 0.62], [HW, y + 0.003, FARE - 0.62], [HW, y + 0.003, FARE - 0.5], [-HW, y + 0.003, FARE - 0.5]], 'tactY', {});
    tokenBooth(K, 0, FARE - 0.15, 1.0, 1.55);
    // turnstiles either side of the booth, then an exit gate, then a fence out to the gallery wall
    const row = [-5.8, -5.0, -4.2, -3.4, -2.6, -1.8, 1.8, 2.6, 3.4, 4.2, 5.0, 5.8];
    row.forEach((x, i) => turnstile(K, x, FARE, x < 0 ? 1 : -1, i % 5 !== 3));
    for (const x of [-1.25, 1.25]) { K.box(x - 0.08, y, FARE - 0.5, x + 0.08, y + 0.92, FARE + 0.5, 'chromeL', { ink: W.D, fade: 0.05 }); }
    exitGate(K, 6.75, FARE); exitGate(K, -6.75, FARE);
    for (const s of [-1, 1]) {
      // the gallery behind the fence is the paid side; a service gate with a chain
      for (const yy of [y + 0.08, y + 1.15, y + 2.25]) K.tube([s * 7.4, yy, 14.5], [s * HW, yy, 14.5], 0.018, 'chromeL', { seg: 5 });
      for (let x = 7.4; x <= HW + 0.001; x += 0.11) K.tube([s * x, y, 14.5], [s * x, y + 2.25, 14.5], 0.008, 'chromeL', { seg: 4 });
      // Return corridor: arrivals from the street walk toward the viewer before entering the paid bridge.
      for (const yy of [y + 0.08, y + 1.15, y + 2.25]) K.tube([s * GAL, yy, FARE], [s * GAL, yy, 14.5], 0.018, 'chromeL', { seg: 5 });
      for (let z = FARE; z <= 14.5; z += 0.18) K.tube([s * GAL, y, z], [s * GAL, y + 2.25, z], 0.008, 'chromeL', { seg: 4 });
      // a sign carrier over the lanes: enter on one side of the booth, read from the street side
      const u = s * 3.8, yt = y + 2.3, hw = 2.3;
      K.box(u - hw, yt, FARE - 0.65, u + hw, yt + 0.42, FARE - 0.58, 'sigK', { ink: W.D, fade: 0.04 });
      for (const q of [u - hw + 0.3, u + hw - 0.3]) K.tube([q, yt + 0.42, FARE - 0.62], [q, D.CE, FARE - 0.62], 0.014, 'steelD', { seg: 4 });
      const pl = K.plane([u, 0, FARE - 0.651], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      pl.text('ENTER', -1.05, yt + 0.12, 0.2, 'sgnW', { align: 'center', off: 0, font: 'overpass', track: 0.08 });
      AV.type(pl, '入閘', 0.25, yt + 0.11, 0.2, 'sgnW', { font: 'hei', align: 'center', off: 0, track: 0.12 });
      pl.poly([[1.2, yt + 0.08], [1.2, yt + 0.24], [1.08, yt + 0.24], [1.3, yt + 0.38], [1.52, yt + 0.24], [1.4, yt + 0.24], [1.4, yt + 0.08]], 'grn', { off: 0.001, concave: true });
    }
    K.end();
    K.begin('st-tvm'); for (const z of [1.7, 2.9]) ticketMachine(K, -1, z); ticketMachine(K, 1, 13.6); K.end();
  }

  // A stainless R-type car. Skin with real openings; corrugation below the belt; doors; end bonnet; a lit saloon behind the glass.
  function subwayCar(K, xc, z0, near) {
    const L = TRAIN.length, hw = 1.52, fl = D.PF, belt = fl + 0.95, wt = fl + 1.85, eave = fl + 2.4, roof = fl + 2.72, bot = fl - 0.2, s = 'ssteel';
    const doors = [2.2, 6.5, 10.8, 15.1].map(q => z0 + q), dw = 1.27;
    const wins = []; for (let i = 0; i < 5; i++) wins.push([(i === 0 ? z0 + 0.5 : doors[i - 1] + dw + 0.3), (i === 4 ? z0 + L - 0.5 : doors[i] - 0.3)]);
    for (const sg of [-1, 1]) {
      const x = xc + sg * hw;
      const skin = [[x, bot, z0], [x, bot, z0 + L], [x, eave, z0 + L], [x, eave, z0]];
      const holes = []; for (const [a, b] of wins) holes.push([[x, belt, a], [x, belt, b], [x, wt, b], [x, wt, a]]);
      for (const d of doors) holes.push([[x, fl, d], [x, fl, d + dw], [x, fl + 2.1, d + dw], [x, fl + 2.1, d]]);
      K.face(skin, s, { holes });
      K.line([x, bot, z0], [x, bot, z0 + L], W.D, { fade: 0.04 }); K.line([x, eave, z0], [x, eave, z0 + L], W.D, { fade: 0.04 });
      for (const [a, b] of wins) {
        K.pline([[x, belt, a], [x, belt, b], [x, wt, b], [x, wt, a]], true, W.D, { fade: 0.05 });
        if (near) {
          // tinted sealed glass in a rubber gasket, set back in an aluminium frame
          K.glass([[x - sg * 0.035, belt, a], [x - sg * 0.035, belt, b], [x - sg * 0.035, wt, b], [x - sg * 0.035, wt, a]], 3);
          for (const [p, q, r0, r1] of [[a, b, belt, belt + 0.03], [a, b, wt - 0.03, wt], [a, a + 0.03, belt, wt], [b - 0.03, b, belt, wt]]) K.face([[x - sg * 0.03, r0, p], [x - sg * 0.03, r0, q], [x - sg * 0.03, r1, q], [x - sg * 0.03, r1, p]], 'rubber', {});
          for (const q of [belt, wt]) K.face([[x, q, a], [x, q, b], [x - sg * 0.035, q, b], [x - sg * 0.035, q, a]], 'alum', {});
          for (const q of [a, b]) K.face([[x, belt, q], [x, wt, q], [x - sg * 0.035, wt, q], [x - sg * 0.035, belt, q]], 'alum', {});
          for (const q of [0.33, 0.66]) K.face([[x - sg * 0.034, belt, a + (b - a) * q - 0.018], [x - sg * 0.034, belt, a + (b - a) * q + 0.018], [x - sg * 0.034, wt, a + (b - a) * q + 0.018], [x - sg * 0.034, wt, a + (b - a) * q - 0.018]], 'alum', {});
        } else K.face([[x, belt, a], [x, belt, b], [x, wt, b], [x, wt, a]], 'cGlass', {});
      }
      if (near) for (let y = bot + 0.06; y < belt - 0.02; y += 0.11) K.line([x + sg * 0.002, y, z0], [x + sg * 0.002, y, z0 + L], W.H, { lc: 'inkG', fade: 0.09 });
      if (near) for (let y = wt + 0.05; y < eave; y += 0.14) K.line([x + sg * 0.002, y, z0], [x + sg * 0.002, y, z0 + L], W.H, { lc: 'inkG', fade: 0.09 });
      // doors closed: two leaves, each with its small tinted window, a seam and rubber edges
      for (const d of doors) {
        K.pline([[x, fl, d], [x, fl + 2.1, d], [x, fl + 2.1, d + dw], [x, fl, d + dw]], false, W.D, { fade: 0.05 });
        const pair = [[d, d + dw / 2], [d + dw / 2, d + dw]];
        for (const [a, b] of pair) {
          K.face([[x - sg * 0.01, fl, a], [x - sg * 0.01, fl, b], [x - sg * 0.01, fl + 2.1, b], [x - sg * 0.01, fl + 2.1, a]], s, { ink: W.H, fade: 0.06 });
          if (near) { const m0 = a + 0.1, m1 = b - 0.1; K.face([[x - sg * 0.005, fl + 1.1, m0], [x - sg * 0.005, fl + 1.1, m1], [x - sg * 0.005, fl + 1.9, m1], [x - sg * 0.005, fl + 1.9, m0]], 'cGlass', { ink: W.H }); }
        }
      }
      // underframe boxes between the trucks
      K.box(x - sg * 0.3 - 0.12, bot - 0.42, z0 + 5, x - sg * 0.3 + 0.12, bot, z0 + L - 5, 'under', { ink: W.H, fade: 0.08 });
    }
    // roof in curved strips, with its air-conditioning hoods
    const R = [[hw, eave], [hw - 0.1, eave + 0.15], [hw - 0.32, eave + 0.26], [0.8, roof - 0.02], [0, roof]];
    for (const sg of [-1, 1]) for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1], nA = [sg * (1 - i * 0.2), 0.3 + i * 0.2, 0], nB = [sg * (1 - (i + 1) * 0.22), 0.3 + (i + 1) * 0.22, 0];
      K.face([[xc + sg * a[0], a[1], z0], [xc + sg * a[0], a[1], z0 + L], [xc + sg * b[0], b[1], z0 + L], [xc + sg * b[0], b[1], z0]], 'roofD', { normals: [nA, nA, nB, nB] });
      K.face([[xc + sg * a[0], a[1], z0], [xc + sg * b[0], b[1], z0], [xc, eave, z0]], s, {});
    }
    for (const q of [2.6, 13]) K.box(xc - 0.75, roof - 0.01, z0 + q, xc + 0.75, roof + 0.16, z0 + q + 2.8, 'alum', { ink: W.H, fade: 0.06, skip: 'b' });
    K.line([xc, roof, z0], [xc, roof, z0 + L], W.H, { fade: 0.05 });
    // end: door with its window, side windows, marker lights, route sign, the coupler
    const e = K.plane([xc, 0, z0 - 0.002], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    K.face([[xc - hw, bot, z0], [xc + hw, bot, z0], [xc + hw, eave, z0], [xc - hw, eave, z0]], s, { holes: [[[xc - 0.4, fl + 1.1, z0], [xc + 0.4, fl + 1.1, z0], [xc + 0.4, fl + 1.95, z0], [xc - 0.4, fl + 1.95, z0]], [[xc - 1.3, fl + 1.1, z0], [xc - 0.72, fl + 1.1, z0], [xc - 0.72, fl + 1.9, z0], [xc - 1.3, fl + 1.9, z0]], [[xc + 0.72, fl + 1.1, z0], [xc + 1.3, fl + 1.1, z0], [xc + 1.3, fl + 1.9, z0], [xc + 0.72, fl + 1.9, z0]]] });
    for (const [a, b] of [[-0.4, 0.4], [-1.3, -0.72], [0.72, 1.3]]) {
      const top = Math.abs(a) < 0.5 ? fl + 1.95 : fl + 1.9;
      e.poly([[a-0.045,fl+1.055],[b+0.045,fl+1.055],[b+0.045,top+0.045],[a-0.045,top+0.045]], 'trainTrim', {off:0.0007,holes:[[[a,fl+1.1],[b,fl+1.1],[b,top],[a,top]]]});
    }
    if (near) for (const [a, b] of [[-0.4, 0.4], [-1.3, -0.72], [0.72, 1.3]]) { K.glass([[xc + a, fl + 1.1, z0 + 0.02], [xc + b, fl + 1.1, z0 + 0.02], [xc + b, fl + 1.95, z0 + 0.02], [xc + a, fl + 1.95, z0 + 0.02]], 3); e.pline([[a, fl + 1.1], [b, fl + 1.1], [b, fl + 1.95], [a, fl + 1.95]], true, W.D, { off: 0, fade: 0.05 }); }
    e.rect(-0.46, bot+0.18, 0.46, fl+1.05, 'trainDoor', {off:0.0006});
    e.rect(0.31, fl+0.7, 0.36, fl+0.91, 'trainTrim', {off:0.001});
    e.pline([[-0.48, bot + 0.2], [0.48, bot + 0.2], [0.48, fl + 2.1], [-0.48, fl + 2.1]], true, W.D, { off: 0, fade: 0.05 });
    e.rect(-0.35, fl + 2.1, 0.35, fl + 2.34, 'trainTrim', { off: 0.001, ink: W.H });
    e.text('Q', 0, fl + 2.13, 0.18, 'acryY', { align: 'center', off: 0.002, font: 'overpass' });
    for (const u of [-1.2, 1.2]) { e.disc(u, fl + 0.72, 0.08, 0.08, 'trim', { off: 0.001, seg: 12 }); e.disc(u, fl + 0.72, 0.055, 0.055, 'lens', { off: 0.002, seg: 12 }); }
    for (const u of [-1.2, 1.2]) e.disc(u, fl + 2.15, 0.035, 0.035, 'amber', { off: 0.001, seg: 8 });
    if (near) for (let y = bot + 0.08; y < fl + 0.95; y += 0.11) e.line(-hw, y, -0.5, y, W.H, { off: 0.0005, lc: 'inkG', fade: 0.09 }), e.line(0.5, y, hw, y, W.H, { off: 0.0005, lc: 'inkG', fade: 0.09 });
    K.box(xc - 0.1, bot - 0.2, z0 - 0.32, xc + 0.1, bot + 0.02, z0, 'steelD', { ink: W.H }); K.lathe('z', xc, bot - 0.1, [[z0 - 0.38, 0.14], [z0 - 0.32, 0.14], [z0 - 0.32, 0.08]], 'steelD', { seg: 10 });
    K.box(xc - hw + 0.1, bot - 0.1, z0 + 0.02, xc + hw - 0.1, bot, z0 + 0.1, 'under', { ink: 0 });
    // the saloon you see through the windows
    if (near) {
      const a = xc - hw + 0.04, b = xc + hw - 0.04, n = 6;
      for (let i = 0; i < n; i++) { const p = z0 + (L * i) / n, q = z0 + (L * (i + 1)) / n; K.face([[a, fl, p], [b, fl, p], [b, fl, q], [a, fl, q]], 'roomF', { shade: 0.84 }); K.face([[a, fl + 2.15, p], [b, fl + 2.15, p], [b, fl + 2.15, q], [a, fl + 2.15, q]], 'roomC', {}); for (const u of [xc - 0.42, xc + 0.42]) K.face([[u - 0.06, fl + 2.13, p + 0.1], [u + 0.06, fl + 2.13, p + 0.1], [u + 0.06, fl + 2.13, q - 0.1], [u - 0.06, fl + 2.13, q - 0.1]], 'tubeL', {}); }
      K.face([[a, fl, z0 + L - 0.02], [b, fl, z0 + L - 0.02], [b, fl + 2.15, z0 + L - 0.02], [a, fl + 2.15, z0 + L - 0.02]], 'roomW', {});
      K.face([[a, fl, z0 + 0.04], [b, fl, z0 + 0.04], [b, fl + 2.15, z0 + 0.04], [a, fl + 2.15, z0 + 0.04]], 'roomW', { holes: [[[xc - 0.4, fl + 1.1, z0 + 0.04], [xc + 0.4, fl + 1.1, z0 + 0.04], [xc + 0.4, fl + 1.95, z0 + 0.04], [xc - 0.4, fl + 1.95, z0 + 0.04]], [[xc - 1.3, fl + 1.1, z0 + 0.04], [xc - 0.72, fl + 1.1, z0 + 0.04], [xc - 0.72, fl + 1.9, z0 + 0.04], [xc - 1.3, fl + 1.9, z0 + 0.04]], [[xc + 0.72, fl + 1.1, z0 + 0.04], [xc + 1.3, fl + 1.1, z0 + 0.04], [xc + 1.3, fl + 1.9, z0 + 0.04], [xc + 0.72, fl + 1.9, z0 + 0.04]]] });
      for (const sg of [-1, 1]) for (const [p, q] of wins) {
        const x = xc + sg * (hw - 0.05), xi = x - sg * 0.44, col = sg < 0 ? 'orange' : 'cloB';
        K.face([[x, fl + 0.46, p + 0.05], [x, fl + 0.46, q - 0.05], [xi, fl + 0.46, q - 0.05], [xi, fl + 0.46, p + 0.05]], col, { ink: W.H, fade: 0.1 });
        K.face([[xi, fl + 0.05, p + 0.05], [xi, fl + 0.05, q - 0.05], [xi, fl + 0.46, q - 0.05], [xi, fl + 0.46, p + 0.05]], col, { shade: 0.74 });
        K.face([[x - sg * 0.006, fl + 0.46, p + 0.05], [x - sg * 0.006, fl + 0.46, q - 0.05], [x - sg * 0.006, fl + 0.98, q - 0.05], [x - sg * 0.006, fl + 0.98, p + 0.05]], col, { shade: 0.9 });
        for (let u = p + 0.3; u < q - 0.2; u += 1.3) { K.face([[x - sg * 0.006, fl + 1.95, u], [x - sg * 0.006, fl + 1.95, u + 0.95], [x - sg * 0.006, fl + 2.13, u + 0.95], [x - sg * 0.006, fl + 2.13, u]], u % 2 > 1 ? 'papR' : 'paper', { ink: W.H, fade: 0.14 }); }
      }
      for (const d of doors) for (const q of [d - 0.18, d + dw + 0.18]) for (const u of [xc - 0.55, xc + 0.55]) K.tube([u, fl, q], [u, fl + 2.15, q], 0.018, 'chrome', { seg: 6 });
      for (const u of [xc - 0.42, xc + 0.42]) K.tube([u, fl + 1.95, z0 + 0.5], [u, fl + 1.95, z0 + L - 0.5], 0.016, 'chrome', { seg: 5 });
    }
    // Continuous chassis ties the car body to both bogies, including the leading overhang.
    K.box(xc - 1.18, bot - 0.16, z0 + 0.1, xc + 1.18, bot, z0 + L - 0.1, 'steelD', { ink: W.H, fade: 0.07 });
    // The front apron and coupler support make the mass below the cab visible.
    K.box(xc - 1.1, D.TR + RAIL.head + 0.28, z0 + 0.04, xc + 1.1, bot - 0.05, z0 + 0.19, 'steelD', { ink: W.D });
    K.box(xc - 0.22, bot - 0.24, z0 + 0.15, xc + 0.22, bot - 0.08, z0 + TRAIN.bogieInset, 'under', { ink: W.H });
    // Cast shadow on the track bed; the rails and sleepers remain above it.
    K.face([[xc - 1.24, D.TR + 0.006, z0 + 0.08], [xc + 1.24, D.TR + 0.006, z0 + 0.08], [xc + 1.24, D.TR + 0.006, z0 + L], [xc - 1.24, D.TR + 0.006, z0 + L]], 'under', { shade: 0.75 });
    // trucks: wheelsets on the real rails, a side frame, a brake shoe
    for (const q of [TRAIN.bogieInset, L - TRAIN.bogieInset]) {
      const z = z0 + q;
      for (const dz of [-1.05, 1.05]) { const cy = D.TR + RAIL.head + TRAIN.wheelRadius; for (const sg of [-1, 1]) { K.cyl('x', xc + sg * 0.64, xc + sg * 0.76, cy, z + dz, TRAIN.wheelRadius, near ? 'steelD' : 'under', { sil: W.H, seg: near ? 16 : 8 }); if (near) K.plane([xc + sg * 0.761, 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]).disc(z + dz, cy, 0.12, 0.12, 'alum', { off: 0, seg: 10 }); } K.tube([xc - 0.72, cy, z + dz], [xc + 0.72, cy, z + dz], 0.07, 'steelD', { seg: 8 }); }
      for (const sg of [-1, 1]) K.box(xc + sg * 0.86 - 0.06, D.TR + 0.45, z - 1.4, xc + sg * 0.86 + 0.06, D.TR + 0.75, z + 1.4, 'under', { ink: W.H, fade: 0.07 });
      K.box(xc - 1, D.TR + 0.65, z - 0.3, xc + 1, bot - 0.02, z + 0.3, 'under', { ink: 0 });
    }
  }

  // What gets fixed to a station wall over a century: conduit with its boxes, a fire-hose cabinet, an alarm, a clock, a map frame; on the edge, a rubbing strip and a cable rack down the pit
  function wallFittings(K) {
    const { W: HW, PF, TR, EDGE, GF } = D;
    for (const s of [-1, 1]) {
      const X = s * (HW - 0.04);
      for (const yy of [PF + 2.82, GF + 2.5]) for (let z = 0; z < 96; z += 12) { K.tube([X, yy, z], [X, yy, z + 12], 0.022, 'steelD', { seg: 6 }); K.tube([X, yy + 0.07, z], [X, yy + 0.07, z + 12], 0.014, 'steelD', { seg: 5 }); for (let q = z + 1.5; q < z + 12; q += 3) K.box(X - 0.03, yy - 0.03, q - 0.02, X + 0.03, yy + 0.1, q + 0.02, 'steelD', { ink: 0 }); }
      const wl = K.plane([s * (HW - 0.008), 0, 0], [0, 0, s < 0 ? 1 : -1], [0, 1, 0], [-s, 0, 0]), A = q => (s < 0 ? q : -q);
      for (let z = 8.6; z < 90; z += 19) {
        K.box(s > 0 ? HW - 0.14 : -HW, PF + 0.5, z, s > 0 ? HW : -HW + 0.14, PF + 1.5, z + 0.8, 'lacq', { ink: W.D, fade: 0.06 });
        const c = K.plane([s * (HW - 0.142), 0, 0], [0, 0, s < 0 ? 1 : -1], [0, 1, 0], [-s, 0, 0]);
        if (z < 60) { c.rect(A(z + 0.1), PF + 0.9, A(z + 0.7), PF + 1.4, 'cGlassL', { off: 0.001, ink: W.H }); c.text('FIRE', A(z + 0.4), PF + 0.68, 0.11, 'sgnW', { align: 'center', off: 0.001, font: 'overpass', track: 0.06 }); }
        // junction boxes and a riser up to the conduit
        K.box(X - 0.05, PF + 1.7, z + 1.1, X + 0.05, PF + 2.0, z + 1.35, 'steelD', { ink: W.H, fade: 0.08 }); K.tube([X, PF + 2.0, z + 1.22], [X, PF + 2.82, z + 1.22], 0.014, 'steelD', { seg: 5 });
      }
      // a clock on a bracket and a framed map on each platform
      const cz = 15.5, cx = s * 6.15, cy = PF + 2.5;
      K.tube([s * HW, cy + 0.1, cz], [cx, cy + 0.1, cz], 0.02, 'steelD', { seg: 5 });
      K.lathe('z', cx, cy, [[cz - 0.05, 0.001], [cz - 0.05, 0.2], [cz + 0.05, 0.2], [cz + 0.05, 0.001]], 'sigK', { seg: 22 });
      const ck = K.plane([cx, cy, cz - 0.052], [1, 0, 0], [0, 1, 0], [0, 0, -1]); ck.disc(0, 0, 0.17, 0.17, 'lampG', { off: 0, seg: 22 }); ck.line(0, 0, 0.07, 0.07, W.D, { off: 0.001 }); ck.line(0, 0, -0.02, 0.13, W.D, { off: 0.001 }); for (let i = 0; i < 12; i++) { const t = (i / 12) * 6.283; ck.line(Math.cos(t) * 0.13, Math.sin(t) * 0.13, Math.cos(t) * 0.155, Math.sin(t) * 0.155, W.H, { off: 0.001 }); }
      // the pit wall: a refuge, cable rack, cables, and the edge lip's rubbing strip
      const xe = s * (EDGE + 0.002);
      for (let z = 0; z < 96; z += 12) { for (let k = 0; k < 4; k++) K.tube([xe - s * 0.05, TR + 0.45 + k * 0.12, z], [xe - s * 0.05, TR + 0.45 + k * 0.12, z + 12], 0.025, k % 2 ? 'rubber' : 'seatC', { seg: 5 }); for (let q = z + 1; q < z + 12; q += 2) K.box(s > 0 ? EDGE - 0.1 : -EDGE, TR + 0.4, q - 0.02, s > 0 ? EDGE : -EDGE + 0.1, TR + 0.85, q + 0.02, 'steelD', { ink: 0 }); }
      for (let z = 6; z < 96; z += 18) { const hw = 0.5; K.face([[xe, TR, z - hw], [xe, TR, z + hw], [xe, PF - 0.25, z + hw], [xe, PF - 0.25, z - hw]], 'roomD', { ink: W.D, fade: 0.05 }); }
    }
    // tactile domes on the yellow strip, near the viewer
    for (const s of [-1, 1]) { const pl = K.plane([0, PF + 0.004, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]); for (let z = 0.1; z < 30; z += 0.1) for (let x = EDGE + 0.05; x < EDGE + 0.58; x += 0.1) pl.disc(s * x, z, 0.022, 0.022, 'tactY', { off: 0, seg: 5, shade: 1.2 }); }
    // puddles and rubbish between the rails
    const rnd = AV.rng(66); for (const xc of [-D.TRACK, D.TRACK]) for (let i = 0; i < 40; i++) { const z = 0.5 + rnd() * 30, x = xc + (rnd() - 0.5) * 0.6, r = 0.03 + rnd() * 0.05; K.face(Array.from({ length: 6 }, (_, k) => { const t = (k / 6) * 6.283; return [x + Math.cos(t) * r, TR + 0.008, z + Math.sin(t) * r * 1.5]; }), ['paper', 'sgnR', 'alum', 'card'][Math.floor(rnd() * 4)], { shade: 0.7 }); }
    // a signal head on the pit wall by the tunnel, a trip arm, lit
    for (const s of [-1, 1]) { const z = 150, x = s * (D.EDGE - 0.2); K.box(x - 0.12, D.TR + 0.5, z - 0.08, x + 0.12, D.TR + 1.3, z + 0.08, 'sigK', { ink: W.H }); K.plane([x, 0, z - 0.081], [1, 0, 0], [0, 1, 0], [0, 0, -1]).disc(0, D.TR + 1.05, 0.06, 0.06, s < 0 ? 'grn' : 'red', { off: 0, seg: 10 }); }
  }

  AV.station = function (K) {
    const { W: HW, CE, GF, PF, TR, END, EDGE, GAL, TRACK } = D;
    // the shell, in lengths, so that distance can darken it evenly
    for (let z = 0; z < END; z += STEP) {
      const e = Math.min(z + STEP, END);
      const roofR = (x0, x1, p, q) => { if (q > p) K.face([[x0, CE, p], [x1, CE, p], [x1, CE, q], [x0, CE, q]], 'ceilP', {}); };
      const hole = D.roofHoles.find(h => e > h[2] && z < h[3]);
      if (hole) { const a = Math.max(z, hole[2]), b = Math.min(e, hole[3]); roofR(-HW, HW, z, a); roofR(-HW, hole[0], a, b); roofR(hole[1], HW, a, b); roofR(-HW, HW, b, e); }
      else roofR(-HW, HW, z, e);
      for (const s of [-1, 1]) {
        const x = s * HW, xE = s * EDGE, xG = s * GAL;
        // tiled wall
        K.face([[x, PF, z], [x, PF, e], [x, GF - 0.3, e], [x, GF - 0.3, z]], 'tileS', {});
        K.face([[x, GF, z], [x, GF, e], [x, CE, e], [x, CE, z]], 'tileS', {});
        K.face([[x, GF - 0.3, z], [x, GF - 0.3, e], [x, GF, e], [x, GF, z]], 'slab', {});
        // gallery floor, its edge, its soffit
        K.face([[xG, GF, z], [x, GF, z], [x, GF, e], [xG, GF, e]], 'terr', {});
        K.face([[xG, GF - 0.3, z], [xG, GF - 0.3, e], [xG, GF, e], [xG, GF, z]], 'slab', { ink: W.D, fade: 0.04 });
        K.face([[xG, GF - 0.3, z], [x, GF - 0.3, z], [x, GF - 0.3, e], [xG, GF - 0.3, e]], 'ceilP', { shade: 0.85 });
        // platform floor, tactile strip, edge, pit wall
        K.face([[xE, PF, z], [x, PF, z], [x, PF, e], [xE, PF, e]], 'terr', {});
        K.face([[xE, PF + 0.002, z], [s * (EDGE + 0.6), PF + 0.002, z], [s * (EDGE + 0.6), PF + 0.002, e], [xE, PF + 0.002, e]], 'tactY', {});
        K.face([[xE, TR, z], [xE, TR, e], [xE, PF, e], [xE, PF, z]], 'pitW', {});
        K.line([xE, PF + 0.003, z], [xE, PF + 0.003, e], W.F, { fade: 0.02 }); K.line([s * (EDGE + 0.6), PF + 0.003, z], [s * (EDGE + 0.6), PF + 0.003, e], W.D, { fade: 0.04 });
        K.line([x, PF, z], [x, PF, e], W.D, { fade: 0.03 }); K.line([x, CE, z], [x, CE, e], W.D, { fade: 0.03 }); K.line([x, GF, z], [x, GF, e], W.D, { fade: 0.03 });
        // edge-board along the lip
        K.box(s > 0 ? EDGE - 0.06 : -EDGE, PF - 0.2, z, s > 0 ? EDGE : -EDGE + 0.06, PF, e, 'woodD', { ink: 0, skip: 'bfk', top: 'tactY' });
        // coloured tile band, top and bottom, as the old stations have
        K.face([[x - s * 0.003, PF + 2.5, z], [x - s * 0.003, PF + 2.5, e], [x - s * 0.003, PF + 2.72, e], [x - s * 0.003, PF + 2.72, z]], 'jade', {});
        K.face([[x - s * 0.003, GF + 2.2, z], [x - s * 0.003, GF + 2.2, e], [x - s * 0.003, GF + 2.36, e], [x - s * 0.003, GF + 2.36, z]], 'jade', {});
        K.face([[x - s * 0.003, PF, z], [x - s * 0.003, PF, e], [x - s * 0.003, PF + 0.22, e], [x - s * 0.003, PF + 0.22, z]], 'tile', {});
      }
      K.face([[-EDGE, TR, z], [EDGE, TR, z], [EDGE, TR, e], [-EDGE, TR, e]], 'bedC', {});
      // longitudinal girders, conduit along them
      for (const x of [-4.5, 0, 4.5]) K.box(x - 0.14, CE - 0.28, z, x + 0.14, CE, e, 'colG', { ink: W.H, fade: 0.04, skip: 'tfk' });
    }
    K.face([[-HW, TR - 0.02, END], [HW, TR - 0.02, END], [HW, CE, END], [-HW, CE, END]], 'tile', {});
    // the far end: two tunnel mouths, with signals in them
    const er = K.plane([0, 0, END - 0.01], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    for (const x of [-TRACK, TRACK]) { const pts = [[x - 1.7, TR], [x + 1.7, TR], [x + 1.7, PF + 2.6]]; for (let i = 1; i < 10; i++) { const t = (i / 10) * Math.PI; pts.push([x + Math.cos(t) * 1.7, PF + 2.6 + Math.sin(t) * 1.3]); } pts.push([x - 1.7, PF + 2.6]); er.poly(pts, 'roomD', { off: 0.001, ink: W.D }); er.disc(x + 1.45, PF + 1.5, 0.09, 0.09, 'red', { off: 0.002, seg: 10 }); }
    // cross beams, jack arches, columns, lights, in bays
    for (let i = 0, z = 2.3; z < END; i++, z += BAY) {
      const near = z < 62, far = z >= 100;
      const overL = z > 47 && z < 49, overR = z > 7.2 && z < 11.3; K.box(overL ? -GAL : -HW, CE - 0.28, z - 0.1, overR ? GAL : HW, CE, z + 0.1, 'colG', { ink: W.H, fade: 0.05, skip: 't' });
      // jack arches between the beams: a shallow barrel of brick from flange to flange
      if (near) { const ax0 = i === 1 ? -GAL : z > 43 && z < 49 ? -GAL : -HW, ax1 = i === 1 ? GAL : HW; for (let k = 0; k < 5; k++) { const a = k / 5, b = (k + 1) / 5, ya = CE - 0.27 + 0.22 * Math.sin(a * Math.PI), yb = CE - 0.27 + 0.22 * Math.sin(b * Math.PI), za = z + 0.1 + (BAY - 0.2) * a, zb = z + 0.1 + (BAY - 0.2) * b, na = [0, -1, Math.cos(a * Math.PI) * 0.3], nb = [0, -1, Math.cos(b * Math.PI) * 0.3]; K.face([[ax0, ya, za], [ax1, ya, za], [ax1, yb, zb], [ax0, yb, zb]], 'ceilP', { normals: [na, na, nb, nb] }); } }
            for (const s of [-1, 1]) {
        column(K, s * 4.5, z, PF, CE - 0.28, near, near && i % 3 === 1);
        column(K, s * (GAL + 0.2), z, PF, GF - 0.3, near, false);   // stands under the gallery slab that it carries
        // fluorescent fixtures, on the roof over the platform and under the gallery: a housing and a lit diffuser
        for (const [x, y, c] of [[s * 5.9, CE - 0.32, 'alum'], [s * 8.5, GF - 0.34, 'alum'], [s * 8.5, CE - 0.32, 'alum']]) {
          if (y > GF && Math.abs(x) === 8.5 && (s < 0 ? z + 3.9 > 44 && z + 0.5 < 52 : z + 3.9 > 2 && z + 0.5 < 13)) continue;
          if (y < GF && z + 3.9 > D.BR[0] && z + 0.5 < D.BR[1] && false) continue;
          K.face([[x - 0.1, y - 0.015, z + 0.5], [x + 0.1, y - 0.015, z + 0.5], [x + 0.1, y - 0.015, z + 3.9], [x - 0.1, y - 0.015, z + 3.9]], 'tubeL', {});
          if (!far) { K.box(x - 0.14, y, z + 0.46, x + 0.14, y + 0.03, z + 3.94, c, { ink: W.H, fade: 0.06, skip: 't' }); if (near) K.tube([x, y + 0.03, z + 2.2], [x, y > GF ? CE - 0.05 : y + 0.3, z + 2.2], 0.01, 'steelD', { seg: 4 }); }
        }
      }
    }
    // the platform's own lights: a strip on a steel rail carried from column to column, well below the high roof
    for (const s of [-1, 1]) for (let z = 2.3; z < END; z += BAY) {
      const x = s * 5.0, y = PF + 3.15, near = z < 62;
      K.face([[x - 0.1, y - 0.05, z + 0.5], [x + 0.1, y - 0.05, z + 0.5], [x + 0.1, y - 0.05, z + 3.9], [x - 0.1, y - 0.05, z + 3.9]], 'tubeL', {});
      if (z < 110) { K.box(x - 0.14, y - 0.04, z + 0.46, x + 0.14, y, z + 3.94, 'alum', { ink: W.H, fade: 0.06, skip: 't' }); K.tube([x, y + 0.02, z], [x, y + 0.02, z + BAY], 0.018, 'colG', { seg: near ? 6 : 4 }); }
      if (near) K.tube([s * 4.5, y + 0.02, z], [x, y + 0.02, z], 0.022, 'colG', { seg: 5 });
    }
    // lengths of pipe over the platforms
    for (const s of [-1, 1]) for (let z = 0; z < 72; z += STEP) { K.tube([s * 6.9, CE - 0.4, z], [s * 6.9, CE - 0.4, z + STEP], 0.05, 'pipe', { seg: 8, sil: W.H }); K.tube([s * 7.15, CE - 0.36, z], [s * 7.15, CE - 0.36, z + STEP], 0.022, 'pipeO', { seg: 6 }); for (let q = z + 1.2; q < z + STEP; q += 2.3) K.tube([s * 6.9, CE - 0.34, q], [s * 6.9, CE, q], 0.008, 'steelD', { seg: 4 }); }
    track(K, -TRACK, -1); track(K, TRACK, 1);

    // gallery rails, with the openings where the stairs land
    for (const s of [-1, 1]) {
      const rail = (z0, z1) => {
        K.tube([s * GAL, GF + 1.05, z0], [s * GAL, GF + 1.05, z1], 0.025, 'chrome', { seg: 8, sil: W.H });
        K.tube([s * GAL, GF + 0.52, z0], [s * GAL, GF + 0.52, z1], 0.012, 'chrome', { seg: 5 });
        for (let z = z0; z <= z1 + 0.01; z += z0 < 60 ? 0.14 : 0.42) K.tube([s * GAL, GF, z], [s * GAL, GF + 1.05, z], z0 < 60 ? 0.006 : 0.01, 'colG', { seg: 4 });
      };
      const zF = s < 0 ? 57.5 : 24;   // each side's flight starts on the paid side
      const parts = s < 0 ? [[0.02, D.BR[0]], [D.BR[1], zF], [zF + 1.2, 110], [110, END - 0.1]] : [[0.02, D.BR[0]], [D.BR[1], zF], [zF + 1.2, 110], [110, END - 0.1]];
      for (const [p, q] of parts) if (q - p > 0.1) rail(p, q);
      const a = s > 0 ? 5.62 : -7.26, b = s > 0 ? 7.26 : -5.62, la = s > 0 ? 5.46 : -7.4, lb = s > 0 ? 7.4 : -5.46;
      K.begin('st-land' + s);
      K.box(la, GF - 0.3, zF, lb, GF, zF + 1.2, 'terr', { ink: W.D, side: 'slab', skip: '' });
      K.end(); K.begin('st-flightB' + s); flight(K, a, b, zF + 1.2, GF, PF);
      K.end();
      for (const zz of [zF]) { const xi = s * 5.46, xo = s * GAL; K.tube([xi, GF + 1.05, zz], [xo, GF + 1.05, zz], 0.024, 'chrome', { seg: 6, sil: W.H }); for (let q = 0; q <= 1.001; q += 0.17) { const u = xi + (xo - xi) * q; K.tube([u, GF, zz], [u, GF + 1.05, zz], 0.008, 'colG', { seg: 4 }); } K.tube([xi, GF + 1.05, zz], [xi, GF + 1.05, zz + 1.2], 0.024, 'chrome', { seg: 6 }); }
      for (const q of [zF + 0.1, zF + 1.1]) column(K, s * 5.5, q, PF, GF - 0.3, false, false);
    }
    // fare control. Each stair from the street lands on the unpaid side; through the gates; the flight to the platform is just beyond.
    K.begin('st-fareL'); fareLine(K, -1, 55.8, true); K.end();
    bridge(K);
    wallFittings(K);

    // what stands on a platform: benches, bins, map cases, hanging signs, ads and name tablets on the wall
    const rnd = AV.rng(1904), ADS = [['春節快樂', 'lacq', 'gold', 'boku'], ['CHINATOWN', 'papY', 'sgnK', 'alfa'], ['語言班', 'paper', 'lacq', 'ming'], ['COFFEE', 'stBlack', 'sgnW', 'lobster'], ['旅行社', 'acryB', 'sgnW', 'hei'], ['BROADWAY', 'stRed', 'sgnW', 'abril']];
    for (const s of [-1, 1]) {
      const wl = K.plane([s * (HW - 0.006), 0, 0], [0, 0, s < 0 ? 1 : -1], [0, 1, 0], [-s, 0, 0]), A = q => (s < 0 ? q : -q);
      for (let z = 4, i = 0; z < 100; z += 7, i++) {
        const y0 = PF + 0.75;
        if (i % 2 === 0) {
          // mosaic name tablet: a border of small tesserae, the station's name set in it
          wl.rect(A(z), y0, A(z + 3.4), y0 + 1.25, 'jade', { off: 0.001, ink: W.D, fade: 0.05 });
          wl.rect(A(z + 0.09), y0 + 0.09, A(z + 3.31), y0 + 1.16, 'tileW', { off: 0.002 });
          if (z < 70) { wl.text('CANAL ST', A(z + 1.7), y0 + 0.62, 0.36, 'sgnK', { align: 'center', off: 0.003, font: 'overpass', track: 0.05 }); AV.type(wl, '堅尼街', A(z + 1.7), y0 + 0.2, 0.3, 'jade', { font: 'ming', align: 'center', off: 0.003, track: 0.2 }); }
        } else {
          const ad = ADS[i % ADS.length], hh = 1.3, ww = 2.2; wl.rect(A(z), y0, A(z + ww), y0 + hh, 'alum', { off: 0.001, ink: W.D, fade: 0.05 }); wl.rect(A(z + 0.05), y0 + 0.05, A(z + ww - 0.05), y0 + hh - 0.05, ad[1], { off: 0.002 });
          if (z < 70) { const m = AV.typeFit(ad[0], 0.38, ww - 0.4, { font: ad[3] }); AV.type(wl, ad[0], A(z + ww / 2), y0 + 0.45, m.h, ad[2], { font: ad[3], align: 'center', sx: m.sx, off: 0.003 }); }
        }
      }
      for (let z = 6, i = 0; z < 76; z += BAY * 2, i++) {
        if (s > 0 ? z > 13 && z < 34 : z > 52 && z < 68) continue;
        K.begin('st-bench' + s + '@' + z);
        const x = s * 6.2, y = PF;
        // slatted timber bench on two iron standards
        for (const q of [0.25, 1.75]) K.box(x - 0.24, y, z + q - 0.03, x + 0.24, y + 0.44, z + q + 0.03, 'rail', { ink: W.H, fade: 0.07 });
        for (let k = 0; k < 4; k++) K.box(x - 0.24 + k * 0.12, y + 0.44, z, x - 0.24 + k * 0.12 + 0.1, y + 0.47, z + 2, 'wood', { ink: W.H, fade: 0.09 });
        for (let k = 0; k < 3; k++) K.box(s > 0 ? x + 0.2 : x - 0.24, y + 0.56 + k * 0.13, z, s > 0 ? x + 0.24 : x - 0.2, y + 0.65 + k * 0.13, z + 2, 'wood', { ink: W.H, fade: 0.09 });
        if (i % 2 === 0) { const zb = z + 2.6; K.lathe('y', s * 5.8, zb, [[y, 0.2], [y + 0.85, 0.24], [y + 0.86, 0.26], [y + 0.9, 0.2], [y + 0.9, 0.001]], 'bin', { seg: 12, sil: W.H }); }
        K.end();
      }
      // direction signs carried on a steel beam between the columns, so they read face-on down the platform at head height plus
      for (let k = 2; k < 22; k += 4) {
        const z = 2.3 + 4.6 * k, x = s * 5.95, y1 = PF + 2.95, y0 = y1 - 0.5, hw = 1.25;
        if (s > 0 ? z > 18 && z < 34 : z > 52 && z < 68) continue;
        K.box(s > 0 ? 4.5 : -7.6, PF + 3.14, z - 0.05, s > 0 ? 7.6 : -4.5, PF + 3.26, z + 0.05, 'colG', { ink: W.H, fade: 0.05 });
        for (const u of [-0.75, 0.75]) K.tube([x + u, y1, z], [x + u, PF + 3.14, z], 0.012, 'steelD', { seg: 4 });
        K.box(x - hw, y0, z - 0.04, x + hw, y1, z + 0.04, 'sigK', { ink: W.D, fade: 0.04 });
        if (z < 70) {
          const pl = K.plane([x, 0, z - 0.041], [1, 0, 0], [0, 1, 0], [0, 0, -1]), cn = s < 0 ? '往上城' : '往下城', en = s < 0 ? 'UPTOWN' : 'DOWNTOWN';
          pl.text(en, -0.2, y0 + 0.27, 0.13, 'sgnW', { align: 'center', off: 0.001, font: 'overpass', track: 0.05 });
          AV.type(pl, cn, -0.2, y0 + 0.07, 0.13, 'sgnW', { font: 'hei', align: 'center', off: 0.001 });
          [['acryY', 'Q', 0.8], ['acryY', 'R', 1.06]].forEach(([c, t, u]) => { pl.disc(u, y0 + 0.25, 0.12, 0.12, c, { off: 0.001, seg: 18 }); pl.text(t, u, y0 + 0.19, 0.11, 'sgnK', { align: 'center', off: 0.002, font: 'overpass' }); });
        }
      }
    }
    // The leading cab stands close to the section; every wheel rests on the rail head.
    K.begin('st-train');
    for (let i = 0; i < 5; i++) subwayCar(K, -TRACK, TRAIN.start + i * TRAIN.spacing, i === 0);
    K.end();
  };
})();
