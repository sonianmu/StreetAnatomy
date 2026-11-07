/* Ground plane, the cut through the street at the picture plane, and street furniture. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;
  // street 20 m wall to wall: 12 m of road, two 4 m sidewalks. Two crossings: side street, then the avenue that closes the view.
  AV.G = { HW: 10, RW: 6, CURB: 0.15, X: [[72, 90], [170, 188], [268, 286], [366, 396]], END: 396, FAR: 44 };
  AV.G.blocks = [[0, 72], [90, 170], [188, 268], [286, 366]];
  // the opening in the left pavement for the subway stair
  const HOLES = [{ s: -1, x0: 7.62, x1: 9.42, z0: 32, z1: 35.7 }, { s: 1, x0: 6.24, x1: 9.6, z0: 0, z1: 1.6 }];

  function walk(K, side, z0, z1, o) {
    const G = AV.G, X0 = G.RW, X1 = G.HW, y = G.CURB, s = side;
    K.tone = s < 0 ? 'shade' : 'dim';
    const a = s * X0, b = s * X1, under = s * (X1 + 0.5);   // the pavement runs on under the wall line, so a recessed doorway always has a floor
    const H = HOLES.find(h => h.s === s && h.z0 >= z0 && h.z1 <= z1);
    const slab = (p, q) => { if (q > p + 1e-4) K.face([[a, y, p], [under, y, p], [under, y, q], [a, y, q]], 'walk', {}); };
    if (H) { slab(z0, H.z0); K.face([[a, y, H.z0], [s * H.x0, y, H.z0], [s * H.x0, y, H.z1], [a, y, H.z1]], 'walk', {}); K.face([[s * H.x1, y, H.z0], [under, y, H.z0], [under, y, H.z1], [s * H.x1, y, H.z1]], 'walk', {}); slab(H.z1, z1); } else slab(z0, z1);
    // a line across the pavement or along it, broken where the opening is
    const cross = (zz, x0, x1, w, f) => { if (H && zz >= H.z0 && zz <= H.z1) { if (x0 < H.x0) K.line([s * x0, y + 0.003, zz], [s * Math.min(x1, H.x0), y + 0.003, zz], w, f); if (x1 > H.x1) K.line([s * H.x1, y + 0.003, zz], [s * x1, y + 0.003, zz], w, f); } else K.line([s * x0, y + 0.003, zz], [s * x1, y + 0.003, zz], w, f); };
    const along = (xx, p, q, w, f) => { if (H && xx > H.x0 && xx < H.x1 && q > H.z0 && p < H.z1) { if (p < H.z0) K.line([s * xx, y + 0.003, p], [s * xx, y + 0.003, H.z0], w, f); if (q > H.z1) K.line([s * xx, y + 0.003, H.z1], [s * xx, y + 0.003, q], w, f); } else K.line([s * xx, y + 0.003, p], [s * xx, y + 0.003, q], w, f); };
    K.face([[a, 0, z0], [a, 0, z1], [a, y, z1], [a, y, z0]], 'curb', {});
    K.face([[a, y + 0.002, z0], [s * (X0 + 0.24), y + 0.002, z0], [s * (X0 + 0.24), y + 0.002, z1], [a, y + 0.002, z1]], 'curbT', {});
    const step = 12;
    for (let z = z0; z < z1; z += step) {
      const e = Math.min(z + step, z1);
      K.line([a, y + 0.003, z], [a, y + 0.003, e], W.F, { fade: 0.03 }); K.line([a, 0, z], [a, 0, e], W.D, { fade: 0.04 });
      K.line([s * (X0 + 0.24), y + 0.003, z], [s * (X0 + 0.24), y + 0.003, e], W.H, { fade: 0.1 });
      along(X0 + 2.1, z, e, W.H, { fade: 0.08 });
      if (z < 70) for (let q = z; q < e; q += 1.8) { K.line([a, 0, q], [a, y, q], W.H, { fade: 0.12 }); K.line([a, y + 0.003, q], [s * (X0 + 0.24), y + 0.003, q], W.H, { fade: 0.12 }); }
    }
    // the building-line strip: a darker course of stone that takes the pavement up to the wall
    { const bx = s * (X1 - 0.5), zS = H && H.x1 > X1 - 0.5 ? Math.max(z0, H.z1) : z0; K.face([[bx, y + 0.0025, zS], [b, y + 0.0025, zS], [b, y + 0.0025, z1], [bx, y + 0.0025, z1]], 'walkD', { shade: 0.92 });
      for (let z = zS; z < z1; z += 12) K.line([bx, y + 0.004, z], [bx, y + 0.004, Math.min(z + 12, z1)], W.D, { fade: 0.08 });
      for (let z = zS; z < z1; z += 0.9) K.line([bx, y + 0.004, z], [b, y + 0.004, z], W.H, { fade: z < 40 ? 0.14 : 0.1 }); }
    if (z0 < 40) { const rr = AV.rng(s * 31 + 400); for (let i = 0; i < 9; i++) { const q = z0 + Math.floor(rr() * 26) * 1.5; if (H && q + 1.5 > H.z0 - 0.1 && q < H.z1 + 0.1) continue; K.face([[s * (X0 + 0.26), y + 0.0028, q], [s * (X0 + 2.1), y + 0.0028, q], [s * (X0 + 2.1), y + 0.0028, q + 1.5], [s * (X0 + 0.26), y + 0.0028, q + 1.5]], 'walkD', { shade: 1.06 });
        let x = s * (X0 + 0.5 + rr() * 2.6), zz = q + rr() * 1.4; for (let k = 0; k < 4; k++) { const nx = x + (rr() - 0.5) * 0.5, nz = zz + 0.2 + rr() * 0.4; K.line([x, y + 0.004, zz], [nx, y + 0.004, nz], W.H, { lc: 'inkG', fade: 0.16 }); x = nx; zz = nz; } } }
    const flag = 1.5, nz = z1 < 110 ? 1 : 2;
    for (let z = z0; z <= z1; z += flag * nz) cross(z, X0 + 0.24, X1, W.H, { fade: z < 40 ? 0.14 : 0.1 });
    K.tone = 'none';
  }

  AV.ground = function (K) {
    const G = AV.G, y = G.CURB, rnd = AV.rng(1907);
    // road: strips so that haze is per-section, wider at crossings
    for (let z = 0; z < G.END; z += 12) { const e = Math.min(z + 12, G.END); K.face([[-G.RW, 0, z], [G.RW, 0, z], [G.RW, 0, e], [-G.RW, 0, e]], 'road'); }
    for (const [x0, x1] of G.X) for (const c of [-1, 1]) K.face([[c * G.RW, 0, x0], [c * G.FAR, 0, x0], [c * G.FAR, 0, x1], [c * G.RW, 0, x1]], 'road');
    // pavements: both sides, wrapping the corners at the crossings
    for (const s of [-1, 1]) {
      G.blocks.forEach(([b0, b1], i) => {
        walk(K, s, i ? b0 + 3.5 : b0, b1 - 3.5);
        K.tone = s < 0 ? 'shade' : 'dim';
        for (const [a, b] of i ? [[b0, b0 + 3.5], [b1 - 3.5, b1]] : [[b1 - 3.5, b1]]) {
          K.face([[s * G.RW, y, a], [s * G.FAR, y, a], [s * G.FAR, y, b], [s * G.RW, y, b]], 'walk');
          K.line([s * G.RW, y, a], [s * G.RW, y, b], W.D);
          K.face([[s * G.RW, 0, a], [s * G.RW, 0, b], [s * G.RW, y, b], [s * G.RW, y, a]], 'curb');
          K.line([s * G.RW, 0, a], [s * G.RW, 0, b], W.D);
          const edge = a === b0 ? a : b;
          K.face([[s * G.RW, 0, edge], [s * G.FAR, 0, edge], [s * G.FAR, y, edge], [s * G.RW, y, edge]], 'curb');
          K.line([s * G.RW, y, edge], [s * G.FAR, y, edge], W.D); K.line([s * G.RW, 0, edge], [s * G.FAR, 0, edge], W.D);
        }
        K.tone = 'none';
        for (let z = b0 + (i ? 4 : 0); z < b1 - 4; z += 6) K.line([s * 3.6, 0.008, z], [s * 3.6, 0.008, Math.min(z + 6, b1 - 4)], W.D, { lc: 'lane', fade: 0.04 });
      });
      for (const [x0, x1] of G.X) K.face([[s * G.RW, 0.0, x0], [s * G.HW, 0.0, x0], [s * G.HW, 0.0, x1], [s * G.RW, 0.0, x1]], 'road');
    }
    // far sidewalk across the avenue, a raised strip facing the viewer
    K.face([[-G.FAR, y, G.END - 5], [G.FAR, y, G.END - 5], [G.FAR, y, G.END + 0.5], [-G.FAR, y, G.END + 0.5]], 'walk');
    K.face([[-G.FAR, 0, G.END - 5], [G.FAR, 0, G.END - 5], [G.FAR, y, G.END - 5], [-G.FAR, y, G.END - 5]], 'curb', { ink: W.D });
    for (let x = -14; x < 14; x += 1.5) K.line([x, y + 0.002, G.END - 5], [x, y + 0.002, G.END], W.H);

    const rd = K.plane([0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]);
    // the centre lane dash: 3 m on, 6 m off
    const dash = (z0, z1) => { for (let z = z0; z < z1; z += 9) rd.rect(-0.06, z, 0.06, Math.min(z + 3, z1), 'lane', { off: 0.006 }); };
    G.blocks.forEach(([p, q], i) => dash(i ? p + 5 : 5.5, q - 5));
    // crosswalks: long bars, the American ladder; stop bars
    const cross = (zc, x0, x1, dz) => { for (let x = x0 + 0.2; x < x1 - 0.5; x += 1.15) rd.rect(x, zc, x + 0.6, zc + dz, 'lane', { off: 0.006, ink: W.H, fade: 0.05 }); };
    G.X.forEach(([p, q], i) => { cross(p - 3.6, -G.RW, G.RW, 3); if (i < G.X.length - 1) cross(q + 0.6, -G.RW, G.RW, 3); else cross(q - 8.8, -G.RW, G.RW, 3); });
    G.X.forEach(([p]) => rd.rect(-G.RW, p - 5, G.RW, p - 4.6, 'lane', { off: 0.006 }));
    // a crossing right at the near edge of the picture; traffic stops before it, behind the viewer
    cross(0.55, -G.RW, G.RW, 3);
    // lane arrows, one-way
    const arrow = (x, z) => rd.poly([[x - 0.1, z], [x + 0.1, z], [x + 0.1, z + 2.4], [x + 0.36, z + 2.4], [x, z + 3.5], [x - 0.36, z + 2.4], [x - 0.1, z + 2.4]], 'lane', { off: 0.006, concave: true });
    arrow(-1.8, 20); arrow(1.8, 20); arrow(-1.8, 56); arrow(1.8, 56); arrow(-1.8, 120); arrow(1.8, 120); arrow(-1.8, 225); arrow(1.8, 225); arrow(-1.8, 320); arrow(1.8, 320);
    // utility cuts and patches: the road's own drawing
    const patch = (x0, z0, x1, z1, c) => { rd.rect(x0, z0, x1, z1, c || 'roadP', { off: 0.003 }); rd.pline([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], true, W.H, { off: 0.004, fade: 0.07 }); };
    patch(-3.2, 4, -1.2, 19); patch(-3.2, 19, -2.2, 30, 'roadS'); patch(2.3, 8, 3.5, 12); patch(0.6, 24, 3, 28); patch(-3.5, 40, -0.6, 44, 'roadS'); patch(1.2, 34, 2.1, 66); patch(-5, 48, -3.8, 62, 'roadS'); patch(-2.4, 100, -1.1, 134); patch(0.8, 112, 3, 118, 'roadS'); patch(-3, 200, -1, 240); patch(1, 250, 2.4, 262, 'roadS'); patch(4, 10, 5.8, 22, 'roadS');
    // the fine cracks
    for (let i = 0; i < 44; i++) {
      let x = -5.7 + rnd() * 11.4, z = 1 + rnd() * 62;
      const pts = [[x, z]], n = 3 + Math.floor(rnd() * 5);
      for (let k = 0; k < n; k++) { x += (rnd() - 0.5) * 0.22; z += 0.3 + rnd() * 0.9; pts.push([x, z]); }
      rd.pline(pts, false, W.H, { off: 0.005, fade: 0.2, lc: 'inkG' });
    }
    // tactile pads where the near crossing lands on each pavement
    { const pp = K.plane([0, y + 0.004, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]); for (const c of [-1, 1]) { const a = c * (G.RW + 0.26), b = c * (G.RW + 0.92); pp.rect(a, 1.85, b, 3.05, 'tact', { off: 0, ink: W.H, fade: 0.1 }); for (let q = 1.93; q < 3; q += 0.09) for (let u = 0.04; u < 0.64; u += 0.09) pp.disc(a + c * u, q, 0.018, 0.018, 'tact', { off: 0.001, seg: 6, shade: 1.28 }); } }
    // manholes
    const manhole = (x, z, r) => {
      rd.disc(x, z, r, r, 'roadS', { off: 0.004, seg: 26 }); rd.ring(x, z, r, W.D, { off: 0.006, seg: 26, fade: 0.07 });
      rd.ring(x, z, r * 0.82, W.H, { off: 0.006, seg: 26, fade: 0.12 });
      for (let a = -0.7; a <= 0.7; a += 0.23) { const c = Math.sqrt(1 - a * a) * r * 0.78; rd.line(x - c, z + a * r, x + c, z + a * r, W.H, { off: 0.006, fade: 0.16 }); rd.line(x + a * r, z - c, x + a * r, z + c, W.H, { off: 0.006, fade: 0.16 }); }
    };
    [[-3.1, 8, 0.42], [2.2, 13, 0.42], [-0.9, 28, 0.42], [1.8, 46, 0.42], [-2.3, 63, 0.42], [0.8, 106, 0.5], [-2.2, 142, 0.5]].forEach(q => manhole(...q));
    // storm drains at the curb
    for (const [s, z] of [[-1, 15], [1, 42], [-1, 64], [1, 66], [-1, 100], [1, 130]]) { const x = s * (G.RW - 0.25); rd.rect(x - 0.25, z, x + 0.25, z + 0.9, 'plate', { off: 0.005, ink: W.H }); for (let q = 0.1; q < 0.9; q += 0.11) rd.line(x - 0.22, z + q, x + 0.22, z + q, W.H, { off: 0.006, fade: 0.2 }); }
    // parking lane tone: a ribbon of oil where cars stand
  };

  // Street floor pieces that belong to the sidewalk rhythm
  function hatch(K, s, x0, x1, z0, z1) {
    const y = AV.G.CURB + 0.006, pl = K.plane([0, y, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]), xa = s * x0, xb = s * x1;
    K.tone = s < 0 ? 'shade' : 'dim';
    pl.rect(xa, z0, xb, z1, 'plate', { off: 0, ink: W.D });
    K.box(Math.min(xa, xb), y - 0.002, z0 - 0.04, Math.max(xa, xb), y + 0.018, z0, 'kerbS', { ink: W.H, fade: 0.08 }); K.box(Math.min(xa, xb), y - 0.002, z1, Math.max(xa, xb), y + 0.018, z1 + 0.04, 'kerbS', { ink: W.H, fade: 0.08 });
    const m = (z0 + z1) / 2;
    pl.line(xa, m, xb, m, W.D, { off: 0.002 });
    for (let x = Math.min(xa, xb) + 0.06; x < Math.max(xa, xb) - 0.03; x += 0.11) { pl.line(x, z0 + 0.03, x + 0.07, m - 0.03, W.H, { off: 0.002, fade: 0.2, lc: 'inkG' }); pl.line(x, m + 0.03, x + 0.07, z1 - 0.03, W.H, { off: 0.002, fade: 0.2, lc: 'inkG' }); }
    K.tone = 'none';
  }

  function vaultLights(K, s, x0, x1, z0, z1) {
    const y = AV.G.CURB + 0.005, pl = K.plane([0, y, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]), a = s * x0, b = s * x1;
    pl.rect(a, z0, b, z1, 'rail', { off: 0, ink: W.D, shade: 1.1 });
    const st = 0.14, n = Math.min(a, b);
    for (let u = n + st * 0.6; u < Math.max(a, b) - 0.05; u += st) for (let z = z0 + st * 0.6; z < z1 - 0.05; z += st) pl.disc(u, z, 0.042, 0.042, 'gSky', { off: 0.001, seg: 8 });
    for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / Math.round((z1 - z0) / 1.26)) pl.line(a, z, b, z, W.D, { off: 0.002 });
  }

  // ---- the cut through the street at z = 0. Solid things are cut here: road, pavement, the earth with its mains, the station's roof.
  // The station itself is not drawn on this plane: it opens behind it, in depth, and runs to the same vanishing point as the street.
  AV.section = function (K) {
    const G = AV.G, S = AV.ST, X = S.X, B = -60, CE = S.CE;
    const pl = K.plane([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    const rnd = AV.rng(77);
    // earth above the roof, full width; earth beside the walls and under the floor
    const stone = (x, y, r, c, sh) => { const n = 6 + Math.floor(rnd() * 3), pts = []; for (let i = 0; i < n; i++) { const t = (i / n) * 6.283, q = r * (0.72 + rnd() * 0.5); pts.push([x + Math.cos(t) * q, y + Math.sin(t) * q * 0.72]); } pl.poly(pts, c, { off: 0.0006, shade: sh + rnd() * 0.5 }); };
    // made ground and rock, with every void cut out of it: the stairwell on the right, the sewers, the vault, the gallery
    const yL2 = 0.15 - 15 * 0.19 - 8 * 0.19;
    pl.poly([[-X, CE + 0.3], [X, CE + 0.3], [X, 0], [-X, 0]], 'soil', { off: 0, holes: [[[4.4, yL2 - 0.3], [9.75, yL2 - 0.3], [9.75, -0.22], [9.6, -0.22], [9.6, 0], [6.24, 0], [6.24, -0.22], [6, -0.22], [6, -0.46], [4.4, -0.46]]].concat(AV.sewerHoles()) });
    pl.rect(-X, B, -S.W, CE + 0.3, 'rock', { off: 0 }); pl.rect(S.W, B, X, CE + 0.3, 'rock', { off: 0 }); pl.rect(-S.W, B, S.W, S.TR, 'rock', { off: 0 });
    pl.rect(4.4, yL2 - 0.3, 9.75, yL2, 'slab', { off: 0.0015, ink: W.D });
    for (let i = 0; i < 900; i++) { const x = -X * 0.3 + rnd() * X * 0.6, y = -0.55 - rnd() * (-CE - 1); if (x > 4.1 && x < 10.1 && y > yL2 - 0.5) continue; if (AV.inSewerHole(x, y)) continue; stone(x, y, 0.018 + rnd() * 0.06, 'rock', 0.85); }
    AV.sewerCut(pl);
    // Manhattan schist: tilted foliation and a few joints, cut clean. Lines, not noise.
    const fol = (x0, x1, y0, y1) => { for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.7; i++) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), L = 0.4 + rnd() * 1.6; pl.line(x, y, Math.min(x1, x + L), Math.max(y0, Math.min(y1, y - L * 0.32 + (rnd() - 0.5) * 0.08)), W.H, { off: 0.001, lc: 'inkL', fade: 0.04 }); } };
    fol(-X * 0.25, -S.W - 0.45, -34, CE); fol(S.W + 0.45, X * 0.25, -34, CE); fol(-S.W - 0.45, S.W + 0.45, -34, S.TR - 0.6);
    // road structure: asphalt, concrete, gravel
    pl.rect(-G.RW, -0.09, G.RW, 0, 'slab', { off: 0.001, shade: 0.72 });
    pl.rect(-G.RW, -0.3, G.RW, -0.09, 'slab', { off: 0.001, shade: 1.3 });
    pl.rect(-G.RW, -0.44, G.RW, -0.3, 'earthL', { off: 0.001 });
    for (let x = -G.RW + 0.02; x < G.RW; x += 0.03 + rnd() * 0.05) { pl.disc(x, -0.11 - rnd() * 0.17, 0.006 + rnd() * 0.012, 0.005 + rnd() * 0.009, 'rock', { off: 0.002, seg: 5, shade: 1 + rnd() * 1.2 }); pl.disc(x, -0.31 - rnd() * 0.12, 0.012 + rnd() * 0.02, 0.009 + rnd() * 0.012, 'rock', { off: 0.002, seg: 6, shade: 1.1 + rnd() }); }
    pl.line(-G.RW, 0, G.RW, 0, W.C, { off: 0.003 }); for (const y of [-0.09, -0.3, -0.44]) pl.line(-G.RW, y, G.RW, y, W.H, { off: 0.003, lc: 'inkL' });
    for (const s of [-1, 1]) {
      const a = s * G.RW, b = s * G.HW, c = s * X;
      if (s < 0) { pl.rect(a, -0.22, c, G.CURB, 'slab', { off: 0.001, shade: 0.82 }); pl.pline([[a, 0], [a, G.CURB], [b, G.CURB]], false, W.C, { off: 0.003 }); pl.line(a, -0.22, c, -0.22, W.H, { off: 0.003, lc: 'inkL' }); }
      else { pl.rect(6, -0.22, 6.24, G.CURB, 'slab', { off: 0.001, shade: 0.82 }); pl.rect(9.6, -0.22, c, G.CURB, 'slab', { off: 0.001, shade: 0.82 }); pl.pline([[6, 0], [6, G.CURB], [6.24, G.CURB], [6.24, -0.22]], false, W.C, { off: 0.003 }); pl.pline([[9.6, -0.22], [9.6, G.CURB], [b, G.CURB]], false, W.C, { off: 0.003 }); }
      // the street wall's footing going down through the earth
      pl.rect(s * G.HW, CE, s * (G.HW + 0.45), -0.22, 'brickD', { off: 0.002, shade: 0.7 }); pl.pline([[s * G.HW, CE], [s * G.HW, -0.22]], false, W.D, { off: 0.003 }); pl.pline([[s * (G.HW + 0.45), CE], [s * (G.HW + 0.45), -0.22]], false, W.D, { off: 0.003 });
      // the station's wall: thick concrete, cut
      pl.rect(s * S.W, S.TR - 0.45, s * (S.W + 0.45), CE - 0.0, 'slab', { off: 0.002 });
      pl.pline([[s * S.W, S.TR], [s * S.W, CE]], false, W.F, { off: 0.003 }); pl.pline([[s * (S.W + 0.45), S.TR - 0.45], [s * (S.W + 0.45), CE]], false, W.D, { off: 0.003 });
      // gallery floor and platform floor, cut where the picture ends
      pl.rect(s * S.GAL, S.GF - 0.3, s * S.W, S.GF, 'slab', { off: 0.002, shade: 1.1 }); pl.pline([[s * S.GAL, S.GF - 0.3], [s * S.GAL, S.GF], [s * S.W, S.GF]], false, W.F, { off: 0.003 }); pl.line(s * S.GAL, S.GF - 0.3, s * S.W, S.GF - 0.3, W.D, { off: 0.003 });
      pl.rect(s * S.EDGE, S.TR, s * S.W, S.PF, 'slab', { off: 0.002, shade: 1.1 }); pl.pline([[s * S.EDGE, S.TR], [s * S.EDGE, S.PF], [s * S.W, S.PF]], false, W.F, { off: 0.003 });
    }
    // the invert under the tracks
    pl.rect(-S.W, S.TR - 0.45, S.W, S.TR, 'slab', { off: 0.002 }); pl.line(-S.W, S.TR, S.W, S.TR, W.F, { off: 0.003 }); pl.line(-S.W, S.TR - 0.45, S.W, S.TR - 0.45, W.D, { off: 0.003 });
    // the station's roof, cut: jack-arch slab on a steel beam at every column line
    pl.rect(-G.HW - 0.45, CE, G.HW + 0.45, CE + 0.3, 'slab', { off: 0.0015, shade: 1.08 });
    pl.line(-S.W, CE + 0.3, S.W, CE + 0.3, W.D, { off: 0.003 }); pl.line(-S.W, CE, S.W, CE, W.F, { off: 0.003 });
    for (const x of [-4.5, 0, 4.5]) pl.rect(x - 0.14, CE - 0.28, x + 0.14, CE, 'colG', { off: 0.0025, ink: W.D });
    pl.pline([[-X, G.CURB], [-G.RW, G.CURB]], false, W.C, { off: 0.006 });
    pl.pline([[G.RW, G.CURB], [X, G.CURB]], false, W.C, { off: 0.006 });
  };

  // ---- furniture
  // A davit street light: cast base with its access door, tapered octagonal shaft, a curved tube arm, a cobra head with a lens underneath
  function lamp(K, s, z) {
    const x = s * (AV.G.RW + 0.42), y0 = AV.G.CURB, near = z < 90, seg = near ? 12 : 6;
    K.tone = 'none';
    K.begin('lamp' + s + '@' + z);
    K.lathe('y', x, z, [[y0, 0.2], [y0 + 0.05, 0.2], [y0 + 0.08, 0.16], [y0 + 0.62, 0.13], [y0 + 0.68, 0.145], [y0 + 0.72, 0.11], [y0 + 1.0, 0.09], [y0 + 8.3, 0.052]], 'pole', { seg, sil: W.D });
    K.end();
    if (near) {
      K.cyl('y', y0 + 8.3, y0 + 8.36, x, z, 0.06, 'pole', { sil: W.H, seg: 8 });
      const pd = K.plane([x, 0, z - 0.146], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      pd.rect(-0.07, y0 + 0.22, 0.07, y0 + 0.56, 'pole', { off: 0.001, ink: W.H, shade: 1.15 });
      for (let i = 0; i < 8; i++) { const t = (i / 8) * 6.283 + 0.39; K.cyl('y', y0 + 0.05, y0 + 0.07, x + Math.cos(t) * 0.17, z + Math.sin(t) * 0.17, 0.014, 'steelD', { sil: 0, rim: 0, seg: 6 }); }
    }
    const tip = -s, pts = []; for (let i = 0; i <= 9; i++) { const t = i / 9; pts.push([x + tip * 2.3 * t, y0 + 8.2 + 1.0 * Math.sin(t * 1.55) - 0.12 * t * t]); }
    for (let i = 0; i < pts.length - 1; i++) K.tube([pts[i][0], pts[i][1], z], [pts[i + 1][0], pts[i + 1][1], z], 0.042 - 0.002 * i, 'pole', { seg: near ? 8 : 4, sil: W.D });
    if (near) { K.tube([x, y0 + 7.5, z], [x + tip * 0.75, y0 + 8.72, z], 0.016, 'pole', { seg: 5, sil: W.H }); for (let t = 0.3; t < 0.85; t += 0.18) { const u = x + tip * 0.75 * t; K.tube([u, y0 + 7.5 + 1.22 * t, z], [u, y0 + 8.2 + 1.0 * Math.sin((Math.abs(u - x) / 2.3) * 1.55), z], 0.007, 'pole', { seg: 4 }); } }
    const e = pts[pts.length - 1], hx = e[0], hy = e[1] - 0.02;
    const sg = tip < 0 ? -1 : 1, pv = q => hx + sg * q;
    K.lathe('x', hy, z, [[pv(-0.02), 0.04], [pv(0.05), 0.09], [pv(0.2), 0.12], [pv(0.42), 0.115], [pv(0.56), 0.075], [pv(0.62), 0.001]], 'alum', { seg: near ? 12 : 6, sil: W.D });
    K.face([[pv(0.12), hy - 0.095, z - 0.11], [pv(0.5), hy - 0.075, z - 0.08], [pv(0.5), hy - 0.075, z + 0.08], [pv(0.12), hy - 0.095, z + 0.11]], 'lampG', { ink: W.H, fade: 0.08 });
    K.castLine([x, y0, z], [x, y0 + 8.3, z], 0.12); K.castLine([x, y0 + 8.3, z], [hx, hy, z], 0.08);
  }

  function parkingSign(K, s, z, red) {
    const x = s * (AV.G.RW + 0.32), y0 = AV.G.CURB;
    K.tone = s < 0 ? 'shade' : 'dim';
    K.box(x - 0.018, y0, z - 0.018, x + 0.018, y0 + 2.75, z + 0.018, 'pole', { ink: W.H, fade: 0.05 });
    K.tone = 'none';
    const pl = K.plane([x, 0, z - 0.02], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    const cc = red ? 'sgnR' : 'sgnG', tx = (t, y, h, f) => pl.text(t, 0, y, h, cc, { align: 'center', off: 0.002, font: f || 'overpass', track: 0.02 });
    pl.rect(-0.15, 2.32, 0.15, 2.74, 'sgnW', { off: 0, ink: W.D });
    pl.disc(0, 2.71, 0.007, 0.007, 'inkG', { off: 0.001, seg: 6 }); pl.disc(0, 2.35, 0.007, 0.007, 'inkG', { off: 0.001, seg: 6 });
    if (red) { tx('NO', 2.615, 0.062); tx('PARKING', 2.56, 0.034); tx('8AM-6PM', 2.51, 0.028); tx('MON-SAT', 2.47, 0.024); }
    else { pl.ring(0, 2.645, 0.05, W.D, { off: 0.002, lc: cc, seg: 16 }); tx('P', 2.625, 0.04); tx('2 HOUR', 2.54, 0.03); tx('9AM-7PM', 2.49, 0.026); }
    pl.poly([[-0.1, 2.42], [0.06, 2.42], [0.06, 2.395], [0.11, 2.43], [0.06, 2.465], [0.06, 2.44], [-0.1, 2.44]], cc, { off: 0.002, concave: true });
  }

  // A New York hydrant: ground flange with its bolts, ribbed barrel, upper flange, domed bonnet, pentagon operating nut,
  // two hose caps and the big pumper nozzle on the street side, each with its own nut and a chain back to the barrel.
  function hydrant(K, s, z) {
    const x = s * (AV.G.RW + 0.5), y = AV.G.CURB, H = 'hyd';
    K.lathe('y', x, z, [[y, 0.15], [y + 0.03, 0.15], [y + 0.045, 0.105], [y + 0.5, 0.095], [y + 0.51, 0.125], [y + 0.54, 0.125], [y + 0.56, 0.1], [y + 0.64, 0.09], [y + 0.7, 0.055], [y + 0.72, 0.03]], H, { seg: 18, sil: W.D, rim: W.H });
    K.lathe('y', x, z, [[y + 0.72, 0.022], [y + 0.76, 0.022], [y + 0.76, 0.001]], 'steelD', { seg: 5, sil: W.H });
    for (let i = 0; i < 8; i++) { const t = (i / 8) * 6.283; K.lathe('y', x + Math.cos(t) * 0.128, z + Math.sin(t) * 0.128, [[y + 0.03, 0.014], [y + 0.045, 0.014], [y + 0.045, 0.001]], 'steelD', { seg: 6 }); K.lathe('y', x + Math.cos(t + 0.39) * 0.112, z + Math.sin(t + 0.39) * 0.112, [[y + 0.54, 0.01], [y + 0.552, 0.01], [y + 0.552, 0.001]], 'steelD', { seg: 6 }); }
    for (const sg of [-1, 1]) {
      const c = x + sg * 0.09, v = q => c + sg * q;
      K.lathe('x', y + 0.4, z, [[v(0), 0.05], [v(0.02), 0.05], [v(0.03), 0.045], [v(0.075), 0.045], [v(0.08), 0.026], [v(0.1), 0.024], [v(0.1), 0.001]], H, { seg: 12, sil: W.H, rim: W.H, fade: 0.1 });
      K.pline([[v(0.05), y + 0.36, z - 0.045], [v(0.03), y + 0.26, z - 0.075], [sg * 0.01 + c, y + 0.22, z - 0.09]], false, W.H, { fade: 0.1 });
    }
    const zf = q => z - 0.085 - q;
    K.lathe('z', x, y + 0.33, [[zf(0), 0.075], [zf(0.025), 0.075], [zf(0.035), 0.066], [zf(0.09), 0.066], [zf(0.1), 0.03], [zf(0.125), 0.028], [zf(0.125), 0.001]], H, { seg: 14, sil: W.H, rim: W.H, fade: 0.1 });
    K.pline([[x + 0.06, y + 0.3, zf(0.07)], [x + 0.09, y + 0.2, zf(0.05)], [x + 0.095, y + 0.16, zf(0.01)]], false, W.H, { fade: 0.1 });
  }
  function mailbox(K, s, z) {
    const x = s * (AV.G.RW + 0.75), y = AV.G.CURB;
    K.box(x - 0.24, y, z - 0.22, x - 0.17, y + 0.22, z + 0.22, 'usps', { ink: W.H });
    K.box(x + 0.17, y, z - 0.22, x + 0.24, y + 0.22, z + 0.22, 'usps', { ink: W.H });
    K.box(x - 0.25, y + 0.22, z - 0.24, x + 0.25, y + 1.05, z + 0.24, 'usps', { ink: W.D, skip: 't' });
    // rounded top
    const seg = 8, zs = [z - 0.24, z + 0.24], pts = [];
    for (let i = 0; i <= seg; i++) { const t = (i / seg) * Math.PI; pts.push([x + Math.cos(t) * 0.25, y + 1.05 + Math.sin(t) * 0.25]); }
    K.face(pts.map(p => [p[0], p[1], zs[0]]), 'usps', { ink: W.D });
    for (let i = 0; i < seg; i++) K.face([[pts[i][0], pts[i][1], zs[0]], [pts[i + 1][0], pts[i + 1][1], zs[0]], [pts[i + 1][0], pts[i + 1][1], zs[1]], [pts[i][0], pts[i][1], zs[1]]], 'usps', { shade: 1.1 });
    const pl = K.plane([x, 0, z - 0.242], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    pl.rect(-0.16, y + 0.82, 0.16, y + 1.0, 'usps', { off: 0.002, ink: W.D, shade: 0.8 }); pl.rect(-0.13, y + 0.4, 0.13, y + 0.62, 'sgnW', { off: 0.002, ink: W.H });
  }
  function bin(K, s, z) {
    const x = s * (AV.G.RW + 0.62), y = AV.G.CURB;
    K.cyl('y', y, y + 0.92, x, z, 0.23, 'bin', { sil: W.D, r2: 0.28, seg: 14, noCapA: true, noCapB: true });
    K.cyl('y', y + 0.9, y + 0.92, x, z, 0.28, 'under', { sil: 0, rim: W.D, seg: 14, noCapA: true });
    for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.283; if (Math.sin(a) > 0.1) continue; K.line([x + Math.cos(a) * 0.235, y + 0.02, z + Math.sin(a) * 0.235], [x + Math.cos(a) * 0.285, y + 0.9, z + Math.sin(a) * 0.285], W.H, { lc: 'inkL', fade: 0.12 }); }
    for (const t of [0.2, 0.42, 0.64]) { for (let k = 0; k < 14; k++) { const a0 = (k / 14) * 6.283, a1 = ((k + 1) / 14) * 6.283, r = 0.235 + 0.05 * t; K.line([x + Math.cos(a0) * r, y + t, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y + t, z + Math.sin(a1) * r], W.H, { lc: 'inkL', fade: 0.12 }); } }
  }
  function newsBoxes(K, s, z) {
    const x = s * (AV.G.RW + 1.0), y = AV.G.CURB;
    [['sgnB', -0.46, '華埠'], ['sgnR', 0, '新聞'], ['sgnY', 0.46, 'FREE']].forEach(([c, d, tt]) => {
      K.box(x + d - 0.2, y + 0.3, z - 0.19, x + d + 0.2, y + 1.1, z + 0.19, c, { ink: W.D });
      K.line([x + d - 0.17, y, z - 0.17], [x + d - 0.17, y + 0.3, z - 0.17], W.D); K.line([x + d + 0.17, y, z - 0.17], [x + d + 0.17, y + 0.3, z - 0.17], W.D);
      const pl = K.plane([x + d, 0, z - 0.192], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      pl.rect(-0.16, y + 0.62, 0.16, y + 0.98, 'sgnW', { off: 0.002, ink: W.H }); AV.type(pl, tt, 0, y + 0.84, 0.09, 'sgnK', { font: tt === 'FREE' ? 'alfa' : 'ming', align: 'center', off: 0.003 }); for (const q of [0.68, 0.72, 0.76, 0.8]) pl.line(-0.13, y + q, 0.13, y + q, W.H, { off: 0.003, fade: 0.16 });
    });
  }
  function bikeRack(K, s, z) {
    const x = s * (AV.G.RW + 0.9), y = AV.G.CURB;
    for (let i = 0; i < 3; i++) { const zz = z + i * 0.9, pts = []; for (let k = 0; k <= 10; k++) { const t = (k / 10) * Math.PI; pts.push([x + Math.cos(t) * 0.42, y + 0.55 + Math.sin(t) * 0.28, zz]); } K.pline([[x + 0.42, y, zz], ...pts, [x - 0.42, y, zz]], false, W.F, { fade: 0.05 }); }
  }
  function treePit(K, s, z) {
    const x0 = s * (AV.G.RW + 0.5), x1 = s * (AV.G.RW + 1.75), y = AV.G.CURB + 0.004;
    K.tone = s < 0 ? 'shade' : 'dim';
    const pl = K.plane([0, y, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]);
    pl.rect(x0, z, x1, z + 1.7, 'pit', { off: 0, ink: W.D });
    // low iron guard
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1), H = 0.42;
    const rect = [[xa, z], [xb, z], [xb, z + 1.7], [xa, z + 1.7]];
    for (let i = 0; i < 4; i++) { const p = rect[i], q = rect[(i + 1) % 4]; K.line([p[0], y + H, p[1]], [q[0], y + H, q[1]], W.D, { fade: 0.05 }); const n = i % 2 ? 8 : 6; for (let k = 0; k <= n; k++) { const t = k / n, a = p[0] + (q[0] - p[0]) * t, b = p[1] + (q[1] - p[1]) * t; K.line([a, y, b], [a, y + H, b], W.H, { fade: 0.08 }); } }
    K.tone = 'none';
  }
  // The green-painted sidewalk shed: planks overhead, pipe posts, cross-bracing. As New York as anything.
  function shed(K, s, z0, z1) {
    const x0 = s * (AV.G.RW + 0.45), x1 = s * (AV.G.HW - 0.26), y0 = AV.G.CURB, h = 3.05;
    K.tone = s < 0 ? 'shade' : 'dim';
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    K.box(xa, y0 + h, z0, xb, y0 + h + 0.28, z1, 'ply', { ink: W.F, top: 'ply', side: 'ply' });
    // parapet with plywood sheets, seams, and joists overhead
    const kn = Math.max(1, Math.round((z1 - z0) / 2.44));
    for (let i = 0; i <= kn; i++) { const z = z0 + ((z1 - z0) * i) / kn; K.line([x0, y0 + h + 0.3, z], [x0, y0 + h + 1.15, z], W.D, { fade: 0.06 }); K.line([x0, y0 + h, z], [x1, y0 + h, z], W.D, { fade: 0.08 }); }
    K.face([[x0, y0 + h + 0.28, z0], [x0, y0 + h + 0.28, z1], [x0, y0 + h + 1.15, z1], [x0, y0 + h + 1.15, z0]], 'ply', { ink: W.D, shade: 0.88 });
    // bills pasted along the parapet
    { const pp = K.plane([x0, 0, 0], [0, 0, s > 0 ? 1 : -1], [0, 1, 0], [-s, 0, 0]), rb = AV.rng(z0 * 3 + 1), bills = [['演唱會', 'papR', 'sgnW'], ['ROOM', 'paper', 'sgnK'], ['搬屋', 'papY', 'lacq'], ['舞獅', 'paper', 'lacq'], ['SALE', 'papY', 'sgnK']];
      for (let z = z0 + 0.4; z < z1 - 0.7; z += 0.75 + rb() * 1.1) { const a = s > 0 ? z : -z, b = bills[Math.floor(rb() * bills.length)], yy = y0 + h + 0.34 + rb() * 0.06; pp.rect(a, yy, a + 0.58, yy + 0.72, b[1], { off: 0.002, ink: W.H, fade: 0.1 }); AV.type(pp, b[0], a + 0.29, yy + 0.3, 0.16, b[2], { font: b[0] < 'a' ? 'bebas' : 'ming', align: 'center', sx: b[0].length > 2 ? 0.8 : 1, off: 0.003 }); for (const q of [0.12, 0.18, 0.24]) pp.line(a + 0.08, yy + q, a + 0.5, yy + q, W.H, { off: 0.003, fade: 0.14 }); } }
    K.face([[x0, y0 + h + 0.28, z0], [x1, y0 + h + 0.28, z0], [x1, y0 + h + 1.15, z0], [x0, y0 + h + 1.15, z0]], 'ply', { ink: W.D });
    K.face([[x0, y0 + h - 0.005, z0], [x1, y0 + h - 0.005, z0], [x1, y0 + h - 0.005, z1], [x0, y0 + h - 0.005, z1]], 'plyU', { shade: 0.6 });
    for (let z = z0; z < z1; z += 0.3) K.line([x0, y0 + h - 0.008, z], [x1, y0 + h - 0.008, z], W.H, { fade: 0.12 });
    const n = Math.max(1, Math.round((z1 - z0) / 2.44));
    for (let i = 0; i <= n; i++) {
      const z = z0 + ((z1 - z0) * i) / n;
      K.box(x0 - 0.04, y0, z - 0.04, x0 + 0.04, y0 + h, z + 0.04, 'ply', { ink: W.D, skip: 'tb' });
      K.box(x1 - 0.04, y0, z - 0.04, x1 + 0.04, y0 + h, z + 0.04, 'ply', { ink: W.D, skip: 'tb' });
      K.box(x0 - 0.1, y0, z - 0.1, x0 + 0.1, y0 + 0.02, z + 0.1, 'plate', { ink: W.H, skip: 'b' });
      if (i < n) { const e = z0 + ((z1 - z0) * (i + 1)) / n; K.line([x0, y0 + 0.1, z], [x0, y0 + h - 0.1, e], W.F, { fade: 0.05 }); K.line([x0, y0 + h - 0.1, z], [x0, y0 + 0.1, e], W.F, { fade: 0.05 }); K.line([x0, y0 + h - 0.3, z], [x0, y0 + h - 0.3, e], W.D, { fade: 0.06 }); }
    }
    K.tone = 'none';
  }
  // Subway entrance: an opening in the pavement, then a long enclosed flight with two landings, deep through the earth and the station roof, to the gallery.
  function subway(K, s, label) {
    const G = AV.G, S = AV.ST, y0 = G.CURB, h = HOLES[0], xa = -h.x1, xb = -h.x0, z0 = h.z0, z1 = h.z1, n = 56, rise = (y0 - S.GF) / n;
    const r = AV.stairRun(K, (u, y, c) => [c, y, z0 + u], xa, xb, y0, 0.28, rise, n, [14, 28, 42], { wall: true, topMax: y0, topMin: S.CE, mat: 'stone', openTop: y0 });
    // the lintel where the pavement slab takes over from the open sky
    K.face([[xa, y0, z1], [xb, y0, z1], [xb, -0.25, z1], [xa, -0.25, z1]], 'slab', { ink: W.H });
    { const de = K.plane([(xa + xb) / 2, 0, z1 - 0.002], [1, 0, 0], [0, 1, 0], [0, 0, -1]); de.rect(-0.8, -0.24, 0.8, 0.14, 'stGreen', { off: 0, ink: W.H }); de.text('CANAL ST', -0.25, -0.1, 0.13, 'sgnW', { align: 'center', off: 0.001, font: 'overpass', track: 0.08 }); AV.type(de, '堅尼街', 0.45, -0.11, 0.13, 'sgnW', { font: 'hei', align: 'center', off: 0.001 }); }
    const cop = (a, b, c, d) => K.box(a, y0, c, b, y0 + 0.08, d, 'stone', { ink: W.H, fade: 0.09, skip: 'b' });
    cop(xa - 0.12, xa, z0, z1 + 0.12); cop(xb, xb + 0.12, z0, z1 + 0.12); cop(xa, xb, z1, z1 + 0.12);
    const Y = y0 + 0.08, H = 1.05, rail = 'poleG', pz = z1 + 0.06;
    AV.stairRail(K, [[[xa - 0.06, z0], [xa - 0.06, pz]], [[xb + 0.06, z0], [xb + 0.06, pz]], [[xa - 0.06, pz], [xb + 0.06, pz]]], Y);
    K.box(xa - 0.06, Y + H, pz - 0.02, xb + 0.06, Y + H + 0.46, pz + 0.02, rail, { ink: W.D });
    const pl = K.plane([(xa + xb) / 2, 0, pz - 0.021], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    pl.text(label, 0, Y + H + 0.14, 0.17, 'sgnW', { align: 'center', off: 0.002, font: 'overpass', track: 0.06 });
    for (const x of [xa - 0.06, xb + 0.06]) AV.stairGlobe(K, x, z0, Y);
  }
  // Mast-arm signal and corner street-name blades at a crossing
  function signal(K, s, z, name) {
    const x = s * (AV.G.RW + 0.45), y0 = AV.G.CURB, H = 6.4, reach = 6.2;
    K.tone = s < 0 ? 'shade' : 'dim';
    K.cyl('y', y0, y0 + 0.95, x, z, 0.16, 'pole', { sil: W.D, r2: 0.12, seg: 12, noCapA: true });
    K.cyl('y', y0 + 0.95, y0 + H + 0.26, x, z, 0.095, 'pole', { sil: W.D, r2: 0.07, seg: 10, noCapA: true });
    K.tone = 'none';
    const arm = [[x, y0 + H, z], [x - s * reach, y0 + H + 0.32, z]];
    K.tube([x, y0 + H + 0.05, z], [x - s * reach, y0 + H + 0.05, z], 0.07, 'pole', { seg: 10, r2: 0.04, sil: W.D, caps: true }); K.box(x - 0.14, y0 + H - 0.14, z - 0.1, x + 0.14, y0 + H + 0.2, z - 0.09, 'pole', { ink: W.H });
    K.line([x, y0 + H + 0.26, z], [x - s * reach * 0.42, y0 + H + 0.1, z], W.D, { fade: 0.03 });
    // signal heads on the arm and the corner post: three aspects, box and visors
    const head = (hx, hy) => {
      // three cast sections, each with a lens and a tunnel visor, on a louvred backplate, hung from the arm by a clamp
      const w = 0.2, h = 0.5;
      K.box(hx - 0.36, hy - h - 0.15, z + 0.13, hx + 0.36, hy + h + 0.15, z + 0.14, 'sigK', { ink: W.D, fade: 0.03 });
      K.box(hx - w, hy - h, z - 0.14, hx + w, hy + h, z + 0.13, 'sigY', { ink: W.D, fade: 0.025 });
      const pl = K.plane([hx, hy, z - 0.14], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
      for (const dy of [-0.165, 0.165]) pl.line(-w, dy, w, dy, W.D, { off: 0.001, fade: 0.05 });
      [[0.33, 'sigK'], [0, 'sigK'], [-0.33, 'grn']].forEach(([dy, c]) => {
        pl.disc(0, dy, 0.14, 0.14, 'sigK', { off: 0.001, seg: 18 });
        K.lathe('z', hx, hy + dy, [[z - 0.142, 0.115], [z - 0.156, 0.095], [z - 0.16, 0.001]], c, { seg: 14 });
        K.lathe('z', hx, hy + dy, [[z - 0.14, 0.135], [z - 0.36, 0.13]], 'sigK', { seg: 12, a0: -0.25, a1: Math.PI + 0.25, sil: W.H, fade: 0.05 });
      });
      K.tube([hx, hy + h, z], [hx, y0 + H + 0.03, z], 0.03, 'pole', { seg: 6, sil: W.H });
    };
    head(x - s * reach * 0.46, y0 + H - 0.56); head(x - s * reach * 0.94, y0 + H - 0.56); head(x - s * 0.34, y0 + 3.1);
    // street-name blade, the green sign, square to the viewer
    const nx = x - s * 1.35;   // the name blade hangs on the arm, clear of every pole on the street
    K.box(nx - 1.2, y0 + H + 0.12, z - 0.07, nx + 1.2, y0 + H + 0.46, z - 0.05, 'sgnG', { ink: W.D, fade: 0.02 });
    { const pn = K.plane([nx, 0, z - 0.071], [1, 0, 0], [0, 1, 0], [0, 0, -1]); pn.text(name[0], -0.32, y0 + H + 0.2, 0.17, 'sgnW', { align: 'center', off: 0.002, font: 'overpass' }); AV.type(pn, name[1], 0.72, y0 + H + 0.2, 0.17, 'sgnW', { font: 'hei', align: 'center', off: 0.002 }); }
    K.line([nx - 1.16, y0 + H + 0.16, z - 0.074], [nx + 1.16, y0 + H + 0.16, z - 0.074], W.H, { lc: 'inkL', fade: 0.03 });
    // one-way sign
    K.box(x - 0.42, y0 + H - 1.05, z - 0.135, x + 0.42, y0 + H - 0.75, z - 0.105, 'sgnK', { ink: W.D, fade: 0.03 });
    const on = K.plane([x, 0, z - 0.136], [1, 0, 0], [0, 1, 0], [0, 0, -1]);
    const ay = y0 + H - 0.9;
    on.poly([[-0.36, ay - 0.025], [0.14, ay - 0.025], [0.14, ay - 0.08], [0.37, ay], [0.14, ay + 0.08], [0.14, ay + 0.025], [-0.36, ay + 0.025]], 'sgnW', { off: 0.002, concave: true });
  }
  // Steam stack in the street: the orange-and-white striped chimney
  function stack(K, x, z) {
    const r = 0.36, h = 2.8;
    for (let i = 0; i < 5; i++) { const y0 = (i / 5) * h, y1 = ((i + 1) / 5) * h; K.cyl('y', y0, y1, x, z, r, i % 2 ? 'sgnW' : 'stack', { sil: i === 4 ? W.F : W.F, rim: W.D, seg: 20, noCapA: true, noCapB: i !== 4, lit: true }); }
    K.face(Array.from({ length: 20 }, (_, i) => { const t = (i / 20) * 6.283; return [x + Math.cos(t) * r * 0.82, h + 0.002, z + Math.sin(t) * r * 0.82]; }), 'under');
  }

  AV.furniture = function (K) {
    const G = AV.G, P = (name, fn) => { K.begin(name); fn(); K.end(); };
    for (const s of [-1, 1]) {
      G.blocks.forEach(([p, q], i) => {
        for (let z = p + (i ? 14 : s < 0 ? 16 : 25); z < q - 6; z += 28) { if (s > 0 && z > 29 && z < 48) continue; lamp(K, s, z); }
        if (i < 2) for (let z = p + 8 + (s < 0 ? 0 : 5); z < q - 8; z += i ? 20 : 15) { if (s > 0 && z > 29 && z < 48) continue; if (s < 0 && z > 31 && z < 43) continue; P('psign' + s + '@' + z, () => parkingSign(K, s, z, i === 0 && (z % 2) < 1)); }
      });
    }
    P('hydrant', () => hydrant(K, -1, 6.4)); P('hydrant2', () => hydrant(K, 1, 29.6)); P('hydrant3', () => hydrant(K, 1, 100));
    P('mail', () => mailbox(K, 1, 11.2));
    P('bin1', () => bin(K, -1, 26.5)); P('bin2', () => bin(K, -1, 66)); P('bin3', () => bin(K, 1, 67)); P('bin4', () => bin(K, 1, 21.5));
    P('news', () => newsBoxes(K, -1, 8.6)); P('bike', () => bikeRack(K, 1, 50));
    P('subway', () => subway(K, -1, 'SUBWAY'));
    P('shed', () => shed(K, 1, 31, 46));
    P('stack', () => stack(K, -2.3, 53));
    [[-1, 3.4, 4.3], [-1, 18, 19.6], [-1, 49, 50.6], [1, 53, 54.6], [1, 66, 67.6]].forEach(([s, z0, z1]) => hatch(K, s, 8.45, 9.48, z0, z1));
    vaultLights(K, -1, 8.5, 9.42, 7.6, 15); vaultLights(K, 1, 8.5, 9.42, 8.8, 15.2);
    const NAMES = [['PELL ST', '披露街'], ['BAYARD ST', '擺也街'], ['CANAL ST', '堅尼街'], ['CANAL ST', '堅尼街']];
    G.X.forEach(([p, q], i) => { if (i === 3) { P('sig', () => signal(K, -1, p - 3.4, ['MOTT ST', '勿街'])); return; } P('sigA' + i, () => signal(K, -1, p - 3.4, ['MOTT ST', '勿街'])); P('sigB' + i, () => signal(K, 1, q + 0.3, NAMES[i])); });
  };
})();
