/* Vehicles, one-way traffic moving away from the viewer. A car is lofted through stations, not boxed:
 * every station is one cross-section (sill, side, shoulder, belt, roof rail, crown), so its flanks taper
 * and its greenhouse leans in. Panels are coloured by zone; lines trace only the real shut-lines. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;
  const smooth = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b[0]) { let u = (t - a[0]) / (b[0] - a[0]); u = u * u * (3 - 2 * u); return a[1] + (b[1] - a[1]) * u; }
    }
    return keys[keys.length - 1][1];
  };
  const KINDS = {
    sedan: { L: 4.72, HW: 0.91, sill: 0.25,
      deck: [[0, 0.93], [0.025, 0.97], [0.09, 1.0], [0.26, 1.0], [0.64, 1.0], [0.72, 0.985], [0.94, 0.87], [1, 0.72]],
      roof: [[0.14, 1.0], [0.21, 1.14], [0.32, 1.37], [0.38, 1.44], [0.53, 1.45], [0.60, 1.36], [0.72, 1.0]],
      rg: [0.17, 0.36], ws: [0.565, 0.71], side: [0.335, 0.62], pillar: 0.475, wheels: [0.19, 0.8], rw: 0.72 },
    suv: { L: 4.85, HW: 0.97, sill: 0.33,
      deck: [[0, 1.08], [0.02, 1.12], [0.7, 1.16], [0.78, 1.14], [0.95, 1.05], [1, 0.82]],
      roof: [[0.015, 1.12], [0.05, 1.5], [0.11, 1.74], [0.18, 1.78], [0.58, 1.8], [0.64, 1.72], [0.77, 1.15]],
      rg: [0.03, 0.1], ws: [0.62, 0.76], side: [0.105, 0.64], pillar: 0.4, wheels: [0.17, 0.78], rw: 0.76 },
  };
  // New York plates: passenger three letters and four digits, medallion cabs T + three digits + C
  function plateOf(x, z, taxi) { const r = AV.rng(Math.round(z * 37 + x * 11) + 5), d = () => Math.floor(r() * 10), l = () => 'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(r() * 23)]; return taxi ? 'T ' + d() + d() + d() + ' C' : l() + l() + l() + ' ' + d() + d() + d() + d(); }
  function softShadow(K, x, z, hw, L) {
    const ring = (e, y, shade) => { const n = 4, r = 0.2 + e, p = []; const c = [[x + hw + e - r, z + L + e - r, 0], [x - hw - e + r, z + L + e - r, 1], [x - hw - e + r, z - e + r, 2], [x + hw + e - r, z - e + r, 3]]; for (const [cx, cz, q] of c) for (let i = 0; i <= n; i++) { const t = (q + i / n) * Math.PI / 2; p.push([cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]); } K.face(p, 'shadow', { shade }); };
    ring(-0.13, 0.016, 0.6); ring(-0.05, 0.013, 0.86); 
  }
  // A road wheel, in its parts: tread with grooves, shoulder, sidewall, rim lip, barrel, five spokes, hub, nuts, brake disc.
  AV.wheel = function (K, sg, xo, cy, zc, r, wid, lod) {
    const X = d => sg * (xo - d), rim = r * 0.6, s = lod ? 10 : 22;
    K.lathe('x', cy, zc, [[X(wid), rim * 1.02], [X(wid), r * 0.86], [X(wid - 0.03), r], [X(0.035), r], [X(0.004), r * 0.88], [X(-0.006), r * 0.74], [X(0), rim * 1.08]], 'tire', { seg: s, sil: W.D });
    if (lod) { K.plane([X(0.01), 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]).disc(zc, cy, rim, rim, 'hub', { off: 0, seg: 12 }); return; }
    for (const q of [wid * 0.34, wid * 0.56, wid * 0.78]) K.lathe('x', cy, zc, [[X(q), r + 0.002], [X(q + 0.008), r + 0.002]], 'rubber', { seg: s });
    K.lathe('x', cy, zc, [[X(-0.0065), r * 0.8], [X(-0.0066), r * 0.81]], 'rubber', { seg: s, rim: W.H, fade: 0.1 });
    K.lathe('x', cy, zc, [[X(0), rim * 1.08], [X(-0.004), rim * 1.03], [X(0.012), rim * 0.96], [X(0.09), rim * 0.92]], 'hub', { seg: s, rim: W.H, fade: 0.09 });
    K.plane([X(0.15), 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]).disc(zc, cy, rim * 0.96, rim * 0.96, 'arch', { off: 0, seg: s });
    K.lathe('x', cy, zc, [[X(0.12), rim * 0.7], [X(0.12), rim * 0.26]], 'steelD', { seg: s, rim: W.H, fade: 0.1 });
    for (let i = 0; i < 5; i++) {
      const t = (i / 5) * 6.2832 + 0.4, c = Math.cos(t), n = Math.sin(t), wa = 0.042, wb = 0.024, r0 = rim * 0.28, r1 = rim * 0.92;
      const P3 = (rr, q, d) => [X(d), cy + n * rr + c * q, zc + c * rr - n * q];
      K.face([P3(r0, -wa, 0.05), P3(r1, -wb, 0.015), P3(r1, wb, 0.015), P3(r0, wa, 0.05)], 'hub', { ink: W.H, fade: 0.11 });
      K.face([P3(r0, wa, 0.05), P3(r1, wb, 0.015), P3(r1, wb, 0.07), P3(r0, wa, 0.1)], 'steelD');
      K.face([P3(r0, -wa, 0.05), P3(r1, -wb, 0.015), P3(r1, -wb, 0.07), P3(r0, -wa, 0.1)], 'steelD');
    }
    K.lathe('x', cy, zc, [[X(0.06), rim * 0.32], [X(0.04), rim * 0.26], [X(0.032), rim * 0.12], [X(0.03), 0.001]], 'hub', { seg: 12, rim: W.H, fade: 0.1 });
    for (let i = 0; i < 5; i++) { const t = (i / 5) * 6.2832 + 1.028; K.lathe('x', cy + Math.sin(t) * rim * 0.2, zc + Math.cos(t) * rim * 0.2, [[X(0.045), 0.01], [X(0.035), 0.008], [X(0.033), 0.001]], 'steelD', { seg: 6 }); }
  };

  AV.car = function (K, x, z, o) {
    o = o || {};
    K.begin('car@' + x + ',' + z);
    const P = KINDS[o.kind || 'sedan'], L = P.L, HW = P.HW, c = o.col || 'silv', lod = o.lod || 0, isSedan = P === KINDS.sedan;
    const body = c + '.s', top = c + '.t', rear = c + '.f';
    K.push(); K.T(x, 0, z);
    const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const T0 = 0.075, T1 = 0.91;   // between these the flank is a true plane
    const hwAt = t => HW * (0.9 + 0.1 * ss(0, T0, t)) * (1 - 0.07 * ss(T1, 1, t));
    const inRoof = t => t >= P.roof[0][0] && t <= P.roof[P.roof.length - 1][0];
    const FY = P.sill + 0.17;
    // one body section, sill to crown. Bands: 0 rocker, 1 flank, 2 shoulder, 3 greenhouse side, 4 roof edge and crown
    const sec = t => {
      const hw = hwAt(t), dk = smooth(P.deck, t), rf = inRoof(t) ? smooth(P.roof, t) : -1, tp = Math.max(dk, rf), gh = tp - dk, rw = hw * (0.66 + (P.rw - 0.66) * ss(0, 0.12, gh));
      return [[hw - 0.075, P.sill], [hw - 0.03, P.sill + 0.06], [hw, FY], [hw, dk - 0.2], [hw - 0.004, dk - 0.13], [hw - 0.018, dk - 0.06], [hw - 0.05, dk - 0.018], [hw - 0.1, dk + 0.005], [rw, tp - 0.03], [rw - 0.035, tp - 0.01], [rw * 0.72, tp + 0.008], [rw * 0.36, tp + 0.016], [0, tp + 0.018]];
    };
    const BAND = [0, 0, 1, 2, 2, 2, 2, 3, 4, 4, 4, 4];
    const N = lod ? 16 : 44, ts = []; for (let i = 0; i <= N; i++) ts.push(i / N);
    for (const q of [P.rg[0], P.rg[1], P.ws[0], P.ws[1], P.side[0], P.side[1], P.pillar - 0.012, P.pillar + 0.012, T0, T1]) ts.push(q);
    ts.sort((a, b) => a - b);
    const sta = ts.filter((v, i) => i === 0 || v - ts[i - 1] > 1e-3);
    const inR = (t, r) => t >= r[0] - 1e-3 && t <= r[1] + 1e-3;
    const G = sta.map(t => sec(t).map(q => [q[0], q[1], t * L]));
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    // vertex normals, averaged only across cells of one band so that real creases stay crisp
    const nor = (i, j, band) => { let n = [0, 0, 0]; for (const [ci, cj] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) { if (ci < 0 || cj < 0 || ci >= G.length - 1 || cj >= BAND.length || BAND[cj] !== band) continue; const A = G[ci][cj], B = G[ci + 1][cj], C = G[ci + 1][cj + 1], D = G[ci][cj + 1], f = cross([C[0] - A[0], C[1] - A[1], C[2] - A[2]], [D[0] - B[0], D[1] - B[1], D[2] - B[2]]), l0 = Math.hypot(f[0], f[1], f[2]) || 1, sg0 = f[0] * (A[0] + 0.01) + f[1] * (A[1] - 0.5) < 0 ? -1 : 1; n = [n[0] + sg0 * f[0] / l0, n[1] + sg0 * f[1] / l0, n[2] + sg0 * f[2] / l0]; } const l = Math.hypot(n[0], n[1], n[2]) || 1; return n.map(v => v / l); };
    const near = zv => { for (const tw of P.wheels) if (Math.abs(zv - tw * L) < 0.42) return true; return false; };
    const glassy = !lod;
    for (let i = 0; i < sta.length - 1; i++) {
      const t0 = sta[i], t1 = sta[i + 1], tm = (t0 + t1) / 2, planar = t0 >= T0 - 1e-4 && t1 <= T1 + 1e-4;
      for (let j = 0; j < BAND.length; j++) {
        const band = BAND[j], A = G[i][j], B = G[i + 1][j], C = G[i + 1][j + 1], D = G[i][j + 1];
        if (band === 1 && planar) continue;   // the flat flank is one polygon, below, with the wheel openings really cut out
        if (band === 0 && near((A[2] + B[2]) / 2)) continue;
        let col = j === 0 ? 'trim' : body, isGlass = false;
        if (band === 3) { col = top; if (inRoof(tm) && smooth(P.roof, tm) - smooth(P.deck, tm) > 0.02) { if (inR(tm, P.side) && Math.abs(tm - P.pillar) > 0.0121) isGlass = true; else col = body; } }
        if (band === 4) { col = top; if (inR(tm, P.rg) || inR(tm, P.ws)) isGlass = true; }
        const nA = nor(i, j, band), nB = nor(i + 1, j, band), nC = nor(i + 1, j + 1, band), nD = nor(i, j + 1, band);
        for (const sg of [-1, 1]) {
          const m = q => [sg * q[0], q[1], q[2]], pts = [m(A), m(B), m(C), m(D)];
          if (isGlass && glassy) K.glass(pts, 2);
          else K.face(pts, isGlass ? 'cGlass' : col, { normals: [m(nA), m(nB), m(nC), m(nD)] });
        }
      }
    }
    // the flat flank, with the wheel openings actually out of it, and the wells behind them
    const cy = 0.335, RO = 0.395, hwP = hwAt(0.5);
    for (const sg of [-1, 1]) {
      const pts = [], ti = sta.filter(t => t >= T0 - 1e-4 && t <= T1 + 1e-4);
      for (const t of ti) pts.push([t * L, sec(t)[3][1]]);
      pts.push([T1 * L, FY]);
      const a0 = Math.asin(Math.max(-1, Math.min(1, (FY - cy) / RO))), segW = lod ? 8 : 18;
      for (const tw of [P.wheels[1], P.wheels[0]]) { const zc = tw * L; for (let i = 0; i <= segW; i++) { const q = a0 + ((Math.PI - 2 * a0) * i) / segW; pts.push([zc + Math.cos(q) * RO, cy + Math.sin(q) * RO]); } }
      pts.push([T0 * L, FY]);
      K.face(pts.map(q => [sg * hwP, q[1], q[0]]), body, { concave: true });
      for (const tw of P.wheels) {
        const zc = tw * L, xi = sg * (hwP - 0.3);
        for (let i = 0; i < segW; i++) { const q0 = a0 + ((Math.PI - 2 * a0) * i) / segW, q1 = a0 + ((Math.PI - 2 * a0) * (i + 1)) / segW, P0 = [zc + Math.cos(q0) * RO, cy + Math.sin(q0) * RO], P1 = [zc + Math.cos(q1) * RO, cy + Math.sin(q1) * RO]; K.face([[sg * hwP, P0[1], P0[0]], [sg * hwP, P1[1], P1[0]], [xi, P1[1], P1[0]], [xi, P0[1], P0[0]]], 'arch'); K.line([sg * (hwP + 0.003), P0[1], P0[0]], [sg * (hwP + 0.003), P1[1], P1[0]], W.D, { fade: 0.05 }); }
        K.face([[xi, 0.2, zc - RO], [xi, 0.2, zc + RO], [xi, cy + RO, zc + RO], [xi, cy + RO, zc - RO]], 'arch');
        AV.wheel(K, sg, hwP - 0.035, cy, zc, cy, 0.22, lod);
      }
    }
    const s0 = sec(0);
    K.face([[-s0[0][0], P.sill, 0], [s0[0][0], P.sill, 0], [s0[0][0], P.sill, L], [-s0[0][0], P.sill, L]], 'under');
    // what is inside: you can see it through the glass
    if (glassy) {
      const zA = P.rg[0] * L, zB = P.ws[1] * L, hwi = hwP - 0.12, dk = smooth(P.deck, 0.5);
      K.face([[-hwi, dk - 0.12, zA], [hwi, dk - 0.12, zA], [hwi, dk - 0.12, zB], [-hwi, dk - 0.12, zB]], 'seatC', {});
      for (const sg of [-1, 1]) K.face([[sg * hwi, dk - 0.12, zA], [sg * hwi, dk - 0.12, zB], [sg * hwi, dk + 0.02, zB], [sg * hwi, dk + 0.02, zA]], 'seatC', { shade: 1.25 });
      // headliner under the flat of the roof only, and seats sized to the headroom at their own station
      const tR0 = P.roof[3][0], tR1 = P.roof[4][0], rfT = Math.min(smooth(P.roof, tR0), smooth(P.roof, tR1)) - 0.04, rwi = hwP * P.rw - 0.14;
      K.face([[-rwi, rfT, tR0 * L], [rwi, rfT, tR0 * L], [rwi, rfT, tR1 * L], [-rwi, rfT, tR1 * L]], 'roomC', { shade: 0.6 });
      const rows = [[P.pillar + 0.02, [-0.38, 0.38], 0.22], [P.side[0] + 0.03, [-0.42, 0, 0.42], 0.19]];
      for (const [zs, us, wd] of rows) for (const u of us) {
        const z0 = zs * L, a = Math.min(smooth(P.roof, zs), smooth(P.roof, zs + 0.03)) - dk - 0.11, sT = dk + a * 0.58, hB = dk + a * 0.68;
        K.box(u - wd, dk - 0.12, z0, u + wd, sT, z0 + 0.14, 'seatC', { ink: 0 });
        K.lathe('y', u, z0 + 0.06, [[hB, 0.05], [dk + a * 0.82, 0.08], [dk + a * 0.96, 0.06], [dk + a, 0.001]], 'seatC', { seg: 10 });
        K.tube([u, sT, z0 + 0.06], [u, hB, z0 + 0.06], 0.009, 'chrome', { seg: 5 });
      }
      K.box(-hwi, dk - 0.1, P.ws[0] * L - 0.1, hwi, dk + 0.1, (P.ws[1] - 0.05) * L, 'seatC', { ink: 0 });
      K.lathe('z', -0.38, dk + 0.14, [[P.ws[0] * L - 0.14, 0.17], [P.ws[0] * L - 0.13, 0.17], [P.ws[0] * L - 0.13, 0.15], [P.ws[0] * L - 0.14, 0.15]], 'rubber', { seg: 14 });
    }
    const rail = (k, sg, a, b, w, f) => { const pts = sta.filter(t => t >= a - 1e-3 && t <= b + 1e-3); for (let i = 0; i < pts.length - 1; i++) { const p = sec(pts[i])[k], q = sec(pts[i + 1])[k], ox = 0.009, oy = k >= 5 ? 0.009 : 0; K.line([sg * (p[0] + ox), p[1] + oy, pts[i] * L], [sg * (q[0] + ox), q[1] + oy, pts[i + 1] * L], w, { fade: f }); } };
    for (const sg of [-1, 1]) {
      rail(5, sg, 0, 1, W.D, 0.05); rail(2, sg, T0, T1, W.H, 0.08); rail(7, sg, 0, 1, W.D, 0.05);
      rail(8, sg, P.rg[0], P.ws[1], W.D, 0.05);
      const a = sec(P.side[0]), b = sec(P.side[1]);
      K.line([sg * (a[7][0] + 0.008), a[7][1] + 0.008, P.side[0] * L], [sg * (a[8][0] + 0.008), a[8][1] + 0.008, P.side[0] * L], W.D);
      K.line([sg * (b[7][0] + 0.008), b[7][1] + 0.008, P.side[1] * L], [sg * (b[8][0] + 0.008), b[8][1] + 0.008, P.side[1] * L], W.D);
      if (!lod) {
        // chrome window strip, rubbing strip, door gaps, real handles, the filler flap
        { const pts = sta.filter(t => t >= P.side[0] && t <= P.side[1]); for (let i = 0; i < pts.length - 1; i++) { const p = sec(pts[i])[7], q = sec(pts[i + 1])[7]; K.tube([sg * (p[0] + 0.01), p[1] + 0.012, pts[i] * L], [sg * (q[0] + 0.01), q[1] + 0.012, pts[i + 1] * L], 0.009, 'chrome', { seg: 5 }); } }
        const rs = 0.56; K.box(sg > 0 ? hwP : -hwP - 0.012, rs, (P.wheels[0] + 0.1) * L, sg > 0 ? hwP + 0.012 : -hwP, rs + 0.035, (P.wheels[1] - 0.1) * L, 'trim', { ink: W.H, fade: 0.09 });
        const doors = [Math.max(P.pillar - 0.17, P.wheels[0] + 0.1), P.pillar, Math.min(P.pillar + 0.18, P.wheels[1] - 0.1)];
        for (const t of doors) { const s = sec(t); K.line([sg * (hwP + 0.004), FY, t * L], [sg * (hwP + 0.004), s[3][1], t * L], W.H, { fade: 0.09 }); K.line([sg * (hwP + 0.004), s[3][1], t * L], [sg * (s[5][0] + 0.007), s[5][1], t * L], W.H, { fade: 0.09 }); K.line([sg * (s[5][0] + 0.007), s[5][1], t * L], [sg * (s[7][0] + 0.007), s[7][1], t * L], W.H, { fade: 0.09 }); }
        K.line([sg * (hwP + 0.004), FY + 0.02, doors[0] * L], [sg * (hwP + 0.004), FY + 0.02, doors[2] * L], W.H, { fade: 0.09 });
        for (const t of [P.pillar - 0.045, P.pillar + 0.135]) { const y = sec(t)[3][1] - 0.01, zh = t * L; K.tube([sg * (hwP + 0.018), y, zh], [sg * (hwP + 0.018), y, zh + 0.13], 0.012, 'chrome', { seg: 5, caps: true }); for (const e of [0.015, 0.115]) K.tube([sg * hwP, y, zh + e], [sg * (hwP + 0.018), y, zh + e], 0.008, 'chrome', { seg: 4 }); }
        // mirror: a stalk off the door, a painted shell with glass on its face
        const t = P.ws[1] - 0.06, s = sec(t), y = s[7][1] + 0.05, zm = t * L, xo = s[5][0];
        K.tube([sg * (xo - 0.02), y - 0.04, zm + 0.04], [sg * (xo + 0.09), y, zm + 0.04], 0.012, 'trim', { seg: 5 });
        K.box(sg > 0 ? xo + 0.05 : -xo - 0.19, y - 0.045, zm, sg > 0 ? xo + 0.19 : -xo - 0.05, y + 0.055, zm + 0.075, body, { ink: W.H, front: 'cGlassL' });
      }
    }
    // ---- the tail. Its outline is exactly the last body section, and everything on it stays inside that outline
    const hw0 = hwAt(0), dk0 = smooth(P.deck, 0), tail = K.plane([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    const half = s0.map(q => [q[0], q[1]]), outline = half.concat(half.slice(0, -1).reverse().map(q => [-q[0], q[1]]));
    tail.poly(outline, rear, { off: 0, concave: true }); tail.pline(outline, true, W.F, { off: 0.001 });
    const xAt = y => { for (let i = 0; i < half.length - 1; i++) { const p = half[i], q = half[i + 1]; if (y >= p[1] && y <= q[1]) return p[0] + ((q[0] - p[0]) * (y - p[1])) / Math.max(1e-4, q[1] - p[1]); } return hw0; };
    const by0 = P.sill + 0.03, by1 = by0 + (isSedan ? 0.23 : 0.27);
    const lamps = isSedan ? { y0: by1 + 0.06, y1: dk0 - 0.1, w: 0.46 } : { y0: dk0 - 0.32, y1: dk0 - 0.05, w: 0.2 };
    for (const s of [-1, 1]) {
      const m = xAt(lamps.y1) - 0.03, a = s * m, b = s * (m - lamps.w);
      // housing, chrome bezel, then the moulded lens with its own ribs
      tail.rect(a, lamps.y0, b, lamps.y1, 'trim', { off: 0.002 });
      if (!lod) tail.pline([[a, lamps.y0], [b, lamps.y0], [b, lamps.y1], [a, lamps.y1]], true, W.D, { off: 0.0055, lc: 'chromeL', fade: 0.1 });
      tail.rect(a - s * 0.012, lamps.y0 + 0.012, b + s * 0.012, lamps.y1 - 0.012, 'tail', { off: 0.003 });
      if (isSedan) {
        tail.rect(s * (m - lamps.w + 0.012), lamps.y0 + 0.012, s * (m - lamps.w * 0.68), lamps.y1 - 0.012, 'amber', { off: 0.004 });
        tail.rect(s * (m - lamps.w * 0.68), lamps.y0 + 0.012, s * (m - lamps.w * 0.52), lamps.y1 - 0.012, 'lens', { off: 0.004 });
        if (!lod) { for (let q = 1; q < 5; q++) { const yy = lamps.y0 + ((lamps.y1 - lamps.y0) * q) / 5; tail.line(a - s * 0.012, yy, b + s * 0.012, yy, W.H, { off: 0.005, lc: 'trim', fade: 0.1 }); } for (let q = 1; q < 12; q++) { const u = m - (lamps.w * q) / 12; tail.line(s * u, lamps.y0 + 0.012, s * u, lamps.y1 - 0.012, W.H, { off: 0.005, lc: 'tailD', fade: 0.14 }); } }
      } else {
        const my = (lamps.y0 + lamps.y1) / 2; tail.rect(a - s * 0.012, my - 0.02, b + s * 0.012, my + 0.02, 'amber', { off: 0.004 }); tail.rect(a - s * 0.012, my - 0.08, b + s * 0.012, my - 0.04, 'lens', { off: 0.004 });
      }
    }
    const lm = xAt(lamps.y1) - 0.03 - lamps.w - 0.03;
    if (isSedan) {
      tail.rect(-lm, lamps.y1 - 0.1, lm, lamps.y1 - 0.012, 'trim', { off: 0.002 });
      tail.pline([[-lm - lamps.w, dk0 - 0.035], [lm + lamps.w, dk0 - 0.035]], false, W.D, { off: 0.003, fade: 0.06 });
      if (!lod) tail.disc(0, dk0 - 0.06, 0.024, 0.024, 'chrome', { off: 0.004, seg: 10 });
    } else {
      tail.pline([[-lm, by1 + 0.05], [lm, by1 + 0.05], [lm, dk0 - 0.015], [-lm, dk0 - 0.015]], true, W.D, { off: 0.003, fade: 0.06 });
      tail.rect(-0.1, dk0 - 0.13, 0.1, dk0 - 0.1, 'trim', { off: 0.003 });
    }
    // plate in a shallow recess, with its screws and frame
    const py0 = by1 + 0.025, ph = 0.15;
    tail.rect(-0.29, py0 - 0.012, 0.29, py0 + ph + 0.012, 'trim', { off: 0.002 });
    tail.rect(-0.26, py0, 0.26, py0 + ph, 'plateC', { off: 0.003, ink: W.H, fade: 0.1 });
    if (!lod) { AV.type(tail, plateOf(x, z, o.taxi), 0, py0 + 0.035, 0.075, 'navy.f', { font: 'overpass', align: 'center', off: 0.004 }); for (const u of [-0.2, 0.2]) tail.disc(u, py0 + ph - 0.016, 0.006, 0.006, 'chrome', { off: 0.004, seg: 6 }); }
    // bumper: a moulded cover, round in section, wrapping round the corner into the flank
    const xb = hw0, zb = [-0.055, -0.04, 0.0, 0.1, 0.22], xz = q => q < 0 ? xb - 0.05 + (q + 0.055) * 1.1 : Math.min(hwAt(q / L), xb + 0.07) + 0.012 * (1 - q / 0.22);
    const yp = [by0, by0 + 0.03, (by0 + by1) / 2, by1 - 0.02, by1], fp = [0.02, 0, -0.006, 0, 0.02];
    for (let j = 0; j < 4; j++) {
      const cl = j === 0 ? 'trim' : rear, bs = [1, 0.92, 1.0, 1.1][j];
      K.face([[-xz(-0.055), yp[j], -0.055 + fp[j]], [xz(-0.055), yp[j], -0.055 + fp[j]], [xz(-0.055), yp[j + 1], -0.055 + fp[j + 1]], [-xz(-0.055), yp[j + 1], -0.055 + fp[j + 1]]], cl, { shade: bs });
      for (const s of [-1, 1]) for (let i = 0; i < zb.length - 1; i++) {
        const za = zb[i], zc = zb[i + 1], xa = s * xz(za), xc = s * xz(zc);
        K.face([[xa, yp[j], za + (i ? 0 : fp[j])], [xc, yp[j], zc], [xc, yp[j + 1], zc], [xa, yp[j + 1], za + (i ? 0 : fp[j + 1])]], cl, { shade: bs * (i ? 0.94 : 0.98) });
      }
    }
    K.face([[-xz(-0.055), by1, -0.035], [xz(-0.055), by1, -0.035], [xz(-0.055), by1, 0.002], [-xz(-0.055), by1, 0.002]], rear, { shade: 1.08 });
    for (const s of [-1, 1]) for (let i = 0; i < zb.length - 1; i++) K.line([s * xz(zb[i]), by1, zb[i]], [s * xz(zb[i + 1]), by1, zb[i + 1]], W.H, { fade: 0.08 });
    K.line([-xz(-0.055), by1, -0.035], [xz(-0.055), by1, -0.035], W.D, { fade: 0.06 });
    if (!lod) {
      K.line([-xb + 0.05, (by0 + by1) / 2 + 0.03, -0.0625], [xb - 0.05, (by0 + by1) / 2 + 0.03, -0.0625], W.H, { fade: 0.1 });
      K.lathe('z', hw0 * 0.55, by0 - 0.035, [[-0.02, 0.018], [-0.02, 0.03], [0.14, 0.03]], 'chrome', { seg: 10 });
      K.plane([hw0 * 0.55, by0 - 0.035, -0.012], [1, 0, 0], [0, 1, 0], [0, 0, -1]).disc(0, 0, 0.019, 0.019, 'under', { off: 0, seg: 10 });
      const ty = sec(0.3)[12][1]; K.tube([0.4, ty, 0.3 * L], [0.44, ty + 0.5, 0.26 * L], 0.003, 'rubber', { seg: 4, r2: 0.0015 });
    }
    if (o.taxi) {
      const t = 0.46, y = smooth(P.roof, t) + 0.01, h = 0.2;
      for (const u of [-0.28, 0.28]) K.box(u - 0.03, y, t * L - 0.03, u + 0.03, y + 0.035, t * L + 0.05, 'trim', { ink: 0 });
      K.box(-0.4, y + 0.03, t * L - 0.06, 0.4, y + h, t * L + 0.08, 'wht.s', { ink: W.D, front: 'lens', top: 'wht.t', skip: 'b' });
      K.plane([0, y, t * L - 0.061], [1, 0, 0], [0, 1, 0], [0, 0, -1]).text('TAXI', 0, 0.06, 0.1, 'sgnK', { align: 'center', off: 0.003, font: 'alfa', track: 0.06 });
      if (!lod) for (const sg of [-1, 1]) { const pl = K.plane([sg * (hwP + 0.003), 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]); for (let i = 0; i < 18; i++) if (i % 2 === 0) pl.rect(L * 0.36 + i * 0.09, 0.64, L * 0.36 + (i + 1) * 0.09, 0.7, 'trim', { off: 0 }); }
    }
    K.pop();
    K.end();
    softShadow(K, x, z, HW, L);
    const dkm = smooth(P.deck, 0.5), rf = smooth(P.roof, 0.45);
    K.castBox([x - HW, 0.15, z], [x + HW, dkm, z + L]); K.castBox([x - HW * P.rw, dkm, z + P.rg[0] * L + 0.2], [x + HW * P.rw, rf, z + P.ws[1] * L - 0.3]);
  };

  function wheelsBox(K, xc, half, zs, r, wid, lod, dual) {
    for (const zc of zs) for (const sg of [-1, 1]) {
      K.push(); K.T(xc, 0, 0);
      AV.wheel(K, sg, half - 0.01, r, zc, r, wid, lod);
      if (dual && zc === dual) AV.wheel(K, sg, half - 0.01 - wid - 0.02, r, zc, r, wid, 1);
      K.pop();
    }
  }

  // Box delivery truck: roll door at the tail, lettering on its flank
  AV.boxTruck = function (K, x, z, o) {
    o = o || {}; const L = 7.2, BL = 5.2, hw = 1.2, h0 = 1.0, h1 = 3.5, c = o.col || 'boxW', text = o.text || 'CITY FRESH PRODUCE', ac = o.accent || 'boxR';
    K.begin('truck'); K.push(); K.T(x, 0, z);
    K.box(-hw, h0, 0, hw, h1, BL, c, { ink: W.F, side: c, top: c });
    // tail: roll door with ribs and rail
    const t = K.plane([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    t.rect(-hw + 0.1, h0 + 0.1, hw - 0.1, h1 - 0.12, c, { off: 0.003, ink: W.D, shade: 0.94 });
    for (let y = h0 + 0.24; y < h1 - 0.2; y += 0.15) t.line(-hw + 0.1, y, hw - 0.1, y, W.H, { off: 0.005 });
    t.rect(-0.2, h0 + 0.12, 0.2, h0 + 0.2, 'trim', { off: 0.006 });
    // what the back of a real delivery truck carries: the firm's name, a hasp, a phone number, reflective tape
    t.rect(-0.06, h0 + 0.1, 0.06, h0 + 0.42, 'alum', { off: 0.007, ink: W.H });
    if (o.cn) AV.type(t, o.cn, 0, h0 + 1.5, 0.3, ac, { font: 'ming', align: 'center', off: 0.007, track: 0.1 });
    t.text(text, 0, h0 + 1.2, 0.14, 'sgnK', { align: 'center', off: 0.007, font: 'bebas', track: 0.08 });
    t.text('BROOKLYN, N.Y.  (718) 555-0142', 0, h0 + 1.02, 0.06, 'sgnK', { align: 'center', off: 0.007, font: 'overpass', track: 0.03 });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) t.rect(s * (hw - 0.14 - i * 0.22), h0 + 0.02, s * (hw - 0.25 - i * 0.22), h0 + 0.09, i % 2 ? 'sgnW' : 'sgnR', { off: 0.007 });
    t.line(-hw + 0.05, h0, -hw + 0.05, h1, W.D, { off: 0.004 }); t.line(hw - 0.05, h0, hw - 0.05, h1, W.D, { off: 0.004 });
    // flank lettering and stripe, both sides
    for (const sg of [-1, 1]) {
      const fl = K.plane([sg * hw, 0, sg > 0 ? 0 : BL], [0, 0, sg > 0 ? 1 : -1], [0, 1, 0], [sg, 0, 0]);
      fl.rect(0, h0 + 0.2, BL, h0 + 0.42, ac, { off: 0.003 });
      AV.type(fl, o.cn || '', BL / 2, h0 + 1.32, 0.62, ac, { font: 'ming', align: 'center', off: 0.004, track: 0.14 }); fl.text(text, BL / 2, h0 + 0.68, 0.34, 'sgnK', { align: 'center', off: 0.004, font: 'bebas', track: 0.08 });
      for (let i = 1; i < 13; i++) fl.line((BL * i) / 13, h0, (BL * i) / 13, h1, W.H, { off: 0.002, fade: 0.09 });
    }
    // chassis, bumper and lights
    K.box(-hw + 0.1, 0.72, 0.02, hw - 0.1, h0, L - 0.2, 'boxD', { ink: W.D });
    K.box(-hw, 0.52, -0.04, hw, 0.75, 0.04, 'boxD', { ink: W.D });
    for (const s of [-1, 1]) { const pl = K.plane([0, 0, -0.04], [1, 0, 0], [0, 1, 0], [0, 0, -1]); pl.rect(s * (hw - 0.03), 0.58, s * (hw - 0.34), 0.7, 'tail', { off: 0.003, ink: W.H }); }
    t.rect(-0.2, 0.55, 0.2, 0.72, 'plateC', { off: 0.042, ink: W.H });
    // cab, mostly hidden beyond the box
    K.box(-hw + 0.1, 0.72, BL + 0.1, hw - 0.1, 2.75, L, 'wht.s', { ink: W.D });
    for (const sg of [-1, 1]) { const pl = K.plane([sg * (hw - 0.1), 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]); pl.poly([[BL + 0.5, 1.8], [L - 0.3, 1.8], [L - 0.05, 2.55], [BL + 0.5, 2.55]], 'cGlass', { off: 0.003, ink: W.D }); }
    wheelsBox(K, 0, hw, [1.1, L - 1.15], 0.48, 0.24, 0, 1.1);
    // the hardware on the back of a real box truck: under-ride bar, mud flaps, door frame, marker lamps, grab handles
    K.tube([-hw + 0.1, 0.48, -0.08], [hw - 0.1, 0.48, -0.08], 0.05, 'steelD', { seg: 8, sil: W.D, caps: true });
    for (const s of [-0.7, 0.7]) K.box(s - 0.03, 0.48, -0.08, s + 0.03, 1.0, 0.02, 'steelD', { ink: W.H });
    for (const s of [-1, 1]) K.box(s * (hw - 0.3) - 0.27, 0.2, 1.72, s * (hw - 0.3) + 0.27, 0.74, 1.73, 'rubber', { ink: W.H, fade: 0.09 });
    { const t2 = K.plane([0, 0, -0.02], [1, 0, 0], [0, 1, 0], [0, 0, -1]); for (const u of [-hw + 0.03, hw - 0.08]) t2.rect(u, h0 - 0.02, u + 0.05, h1, 'alum', { off: 0.0005, ink: W.H }); t2.rect(-hw, h1 - 0.1, hw, h1, 'alum', { off: 0.0005, ink: W.H }); t2.rect(-hw, h0 - 0.08, hw, h0 + 0.06, 'alum', { off: 0.0005, ink: W.H }); for (let i = 0; i < 5; i++) t2.disc(-0.5 + i * 0.25, h1 - 0.05, 0.022, 0.022, 'amber', { off: 0.002, seg: 8 }); }
    for (const s of [-1, 1]) K.tube([s * (hw - 0.14), 2.3, -0.035], [s * (hw - 0.14), 2.8, -0.035], 0.012, 'chrome', { seg: 5, caps: true });
    K.pop(); K.end();
    softShadow(K, x, z, hw, L);
  };

  // City bus seen from behind
  AV.bus = function (K, x, z) {
    const L = 12.2, hw = 1.28, h0 = 0.32, h1 = 3.08;
    K.begin('bus'); K.push(); K.T(x, 0, z);
    K.box(-hw, h0, 0, hw, h1, L, 'busW', { ink: W.F, side: 'busW' });
    K.box(-hw + 0.06, h1, 2, hw - 0.06, h1 + 0.22, 7, 'busW', { ink: W.D, skip: 'b' });
    const t = K.plane([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    t.rect(-hw + 0.26, 2.0, hw - 0.26, 2.86, 'cGlass', { off: 0.004, ink: W.D });
    t.line(0, 2.0, 0, 2.86, W.D, { off: 0.006 });
    t.rect(-hw, 1.18, hw, 1.56, 'busB', { off: 0.003 });
    t.rect(-hw + 0.3, 0.52, hw - 0.3, 1.1, 'boxD', { off: 0.004, ink: W.D });
    for (let y = 0.58; y < 1.08; y += 0.055) t.line(-hw + 0.32, y, hw - 0.32, y, W.H, { off: 0.006, lc: 'inkL', fade: 0.1 });
    for (const s of [-1, 1]) { t.rect(s * (hw - 0.04), 0.7, s * (hw - 0.24), 1.1, 'tail', { off: 0.006, ink: W.H }); t.rect(s * (hw - 0.04), 1.65, s * (hw - 0.24), 1.86, 'amber', { off: 0.006, ink: W.H }); }
    t.rect(-0.3, 0.36, 0.3, 0.5, 'plateC', { off: 0.006, ink: W.H });
    t.text('M15 SELECT', 0, 2.92, 0.1, 'amber', { align: 'center', off: 0.006, font: 'overpass', track: 0.05 });
    for (const sg of [-1, 1]) {
      const pl = K.plane([sg * hw, 0, 0], [0, 0, 1], [0, 1, 0], [sg, 0, 0]);
      pl.rect(0.2, 1.75, L - 0.3, 2.72, 'cGlass', { off: 0.003, ink: W.D });
      for (let q = 0.2; q < L - 0.3; q += 1.48) pl.line(q, 1.75, q, 2.72, W.F, { off: 0.005, lc: 'inkL', fade: 0.06 });
      pl.line(0.2, 2.25, L - 0.3, 2.25, W.H, { off: 0.005, lc: 'inkL', fade: 0.07 });
      pl.rect(0, 1.18, L, 1.56, 'busB', { off: 0.003 });
      pl.line(0, 0.5, L, 0.5, W.H, { off: 0.003 });
    }
    K.box(-hw + 0.1, 0.1, 0.5, hw - 0.1, h0, L - 0.5, 'under', { ink: 0 });
    wheelsBox(K, 0, hw, [2.6, L - 2.8], 0.48, 0.28, 1);
    K.pop(); K.end();
    softShadow(K, x, z, hw, L);
  };
})();
