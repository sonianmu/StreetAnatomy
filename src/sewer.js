/* What lies between the road and the station: not a drawing of pipes on a section, but voids that run away from the cut to the one vanishing point.
 * A 5.8 m brick main sewer with its channel, ledges, iron ribs, mains on hangers, a crossing and a ladder to the manhole, and a nest someone has made in it;
 * a smaller sewer; a steam-and-water vault; a services gallery. Their positions are shared with the lighting in engine.js. */
(function () {
  const AV = (window.AV = window.AV || {});
  const W = AV.W;
  const SW = (AV.SW = {
    main: { c: [-3.1, -3.95], r: 2.25, out: 2.55, water: -5.75, ledge: -5.05, end: 200 },
    sub: { c: [2.25, -5.0], r: 1.55, out: 1.95, water: -5.95, end: 150 },
    vault: { x0: -9.7, x1: -6.95, y0: -6.3, y1: -1.0, wall: 0.25, end: 29 },
    gal: { x0: 0.5, x1: 4.0, y0: -2.75, y1: -0.9, wall: 0.2, end: 60 },
    shaft: { x: -3.1, z0: 7.3, z1: 8.7, hw: 0.5 },
  });
  const P2 = (T, a, r) => [T.c[0] + Math.cos(a) * r, T.c[1] + Math.sin(a) * r];

  function tunnel(K, T, z0, z1, hole) {
    const n = 40, zs = []; for (let z = z0; z < z1;) { zs.push(z); z += z < 40 ? 4 : 16; } zs.push(z1);
    if (hole) { zs.push(hole.z0, hole.z1); zs.sort((a, b) => a - b); }
    for (let k = 0; k < zs.length - 1; k++) {
      const p = zs[k], q = zs[k + 1];
      if (q - p < 1e-3) continue;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28319, b = ((i + 1) / n) * 6.28319, A = P2(T, a, T.r), B = P2(T, b, T.r), nA = [-Math.cos(a), -Math.sin(a), 0], nB = [-Math.cos(b), -Math.sin(b), 0];
        if (hole && p >= hole.z0 - 1e-4 && q <= hole.z1 + 1e-4 && (i === n / 4 - 1 || i === n / 4)) continue;
        K.face([[A[0], A[1], p], [B[0], B[1], p], [B[0], B[1], q], [A[0], A[1], q]], 'sewerB', { normals: [nA, nB, nB, nA] });
      }
    }
    K.face(Array.from({ length: n }, (_, i) => { const q = P2(T, (i / n) * 6.28319, T.r); return [q[0], q[1], z1]; }), 'roomD', {});
  }
  function ribs(K, T, z0, z1, step) {
    const n = 40;
    for (let z = z0; z < z1; z += step) for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28319, b = ((i + 1) / n) * 6.28319; if (Math.sin((a + b) / 2) * T.r + T.c[1] < T.water) continue;
      const A = P2(T, a, T.r - 0.07), B = P2(T, b, T.r - 0.07), A0 = P2(T, a, T.r), B0 = P2(T, b, T.r), nA = [-Math.cos(a), -Math.sin(a), 0], nB = [-Math.cos(b), -Math.sin(b), 0];
      K.face([[A[0], A[1], z], [B[0], B[1], z], [B[0], B[1], z + 0.34], [A[0], A[1], z + 0.34]], 'rib', { normals: [nA, nB, nB, nA] });
      K.face([[A0[0], A0[1], z], [B0[0], B0[1], z], [B[0], B[1], z], [A[0], A[1], z]], 'rib', { shade: 0.8 });
      K.line([A[0], A[1], z], [B[0], B[1], z], W.H, { fade: 0.04 });
      if (z < 60 && i % 2 === 0) for (const dz of [0.07, 0.27]) { const q = P2(T, (a + b) / 2, T.r - 0.085); K.box(q[0] - 0.014, q[1] - 0.014, z + dz - 0.014, q[0] + 0.014, q[1] + 0.014, z + dz + 0.014, 'steelD', { ink: 0 }); }
    }
  }
  function waterOf(K, T, z1) {
    const h = Math.sqrt(T.r * T.r - (T.water - T.c[1]) ** 2), a = T.c[0] - h, b = T.c[0] + h;
    for (let z = 0; z < z1; z += 8) K.face([[a, T.water, z], [b, T.water, z], [b, T.water, Math.min(z + 8, z1)], [a, T.water, Math.min(z + 8, z1)]], 'water', {});
    return [a, b];
  }
  // the water cut by the picture plane: deep green, with a brighter skin
  function waterCut(pl, T) {
    const a0 = Math.PI + Math.asin((T.c[1] - T.water) / T.r), a1 = 2 * Math.PI - Math.asin((T.c[1] - T.water) / T.r), pts = [];
    for (let i = 0; i <= 24; i++) { const a = a0 + ((a1 - a0) * i) / 24; pts.push(P2(T, a, T.r)); }
    pl.poly(pts, 'waterC', { off: 0.0024, concave: true });
    pl.line(pts[0][0], T.water, pts[24][0], T.water, W.D, { off: 0.0036, lc: 'inkL' });
  }
  function ringCut(pl, T) {
    const n = 80, ring = r => Array.from({ length: n }, (_, i) => P2(T, i*2*Math.PI/n, r));
    pl.poly(ring(T.out), 'cutMortar', { off: 0.002, holes: [ring(T.r)] });
    // Two staggered rings of real radial bricks, with recessed mortar between them.
    const courses=2, depth=(T.out-T.r)/courses, count=Math.round(2*Math.PI*T.r/0.23), rnd=AV.rng(Math.round(T.r*100));
    for(let row=0;row<courses;row++) for(let i=0;i<count;i++){
      const a=(i+row*0.5)*2*Math.PI/count+0.008/T.r, b=(i+1+row*0.5)*2*Math.PI/count-0.008/T.r;
      const ri=T.r+row*depth+0.008, ro=T.r+(row+1)*depth-0.008;
      const pts=[P2(T,a,ri),P2(T,(a+b)/2,ri),P2(T,b,ri),P2(T,b,ro),P2(T,(a+b)/2,ro),P2(T,a,ro)];
      pl.poly(pts,'cutBrick',{off:0.003,shade:0.76+rnd()*0.44,concave:true});
    }
    pl.ring(T.c[0],T.c[1],T.r,W.F,{off:0.004,seg:n,lc:'ink'});
    pl.ring(T.c[0],T.c[1],T.r+0.018,W.H,{off:0.0042,seg:n,lc:'inkL',fade:0.06});
    pl.ring(T.c[0],T.c[1],T.out,W.D,{off:0.004,seg:n,lc:'inkG'});
  }
  function hangLamp(K, x, yTop, y, z, cage) {
    K.tube([x, yTop, z], [x, y + 0.14, z], 0.006, 'rubber', { seg: 4 });
    K.lathe('y', x, z, [[y + 0.14, 0.03], [y + 0.1, 0.05], [y + 0.1, 0.09]], 'steelD', { seg: 8 });
    K.lathe('y', x, z, [[y + 0.1, 0.03], [y + 0.04, 0.07], [y - 0.06, 0.065], [y - 0.1, 0.001]], 'lampG', { seg: 10 });
    if (cage) for (let i = 0; i < 6; i++) { const t = (i / 6) * 6.283; K.tube([x + Math.cos(t) * 0.09, y + 0.1, z + Math.sin(t) * 0.09], [x + Math.cos(t) * 0.09, y - 0.12, z + Math.sin(t) * 0.09], 0.003, 'steelD', { seg: 3 }); }
  }
  // a run of main along z: barrel, flange pairs with bolts, a saddle at each support
  function main(K, x, y, r, z0, z1, col, o) {
    o = o || {}; const step = o.step || 6;
    for (let z = z0; z < z1; z += step) {
      const e = Math.min(z + step, z1);
      K.tube([x, y, z], [x, y, e], r, col, { seg: z < 40 ? 16 : 8, sil: W.D });
      if (e >= z1 || z > 60) continue;
      K.lathe('z', x, y, [[e - 0.05, r], [e - 0.05, r + 0.05], [e + 0.05, r + 0.05], [e + 0.05, r]], col, { seg: 16, rim: W.H, fade: 0.05 });
      if (z < 36) for (let i = 0; i < 12; i++) { const t = (i / 12) * 6.283, q = r + 0.028; K.box(x + Math.cos(t) * q - 0.012, y + Math.sin(t) * q - 0.012, e - 0.058, x + Math.cos(t) * q + 0.012, y + Math.sin(t) * q + 0.012, e + 0.058, 'steelD', { ink: 0 }); }
    }
  }
  // a pipe that runs in from the picture plane leaves a hollow cut where it was sawn
  function pipeCut(pl, x, y, r, c, wall) {
    const w=wall||0.03, ri=r-w, seg=64;
    // The bevel, exposed wall and shadowed inner lip are separate concentric surfaces.
    pl.disc(x,y,r,r,c,{off:0.0036,seg});
    const circle=rr=>Array.from({length:seg},(_,i)=>[x+Math.cos(i*2*Math.PI/seg)*rr,y+Math.sin(i*2*Math.PI/seg)*rr]);
    pl.poly(circle(r-0.006),'cutMetal',{off:0.004,holes:[circle(ri)],shade:c==='rib'||c==='pipeO'?0.64:1.0});
    pl.disc(x,y,ri,ri,'cutRust',{off:0.0043,seg,shade:0.7});
    // Offset the deep dark bore upward: the lower inner wall catches light from the opening.
    pl.disc(x,y+w*0.24,ri-w*0.22,ri-w*0.22,'under',{off:0.0046,seg});
    pl.ring(x,y,r,W.D,{off:0.0048,seg,lc:'ink'});
    pl.ring(x,y,r-0.008,W.H,{off:0.0049,seg,lc:'inkL',fade:0.025});
    pl.ring(x,y,ri,W.H,{off:0.0049,seg,lc:'inkG'});
  }
  function wallQuad(K, T, a0, a1, z0, z1, col, o) { const r = T.r - 0.012, A = P2(T, a0, r), B = P2(T, a1, r); K.face([[A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1], [A[0], A[1], z1]], col, o || {}); }

  function ledge(K, T, s, z0, z1) {
    const y = T.ledge, cx = T.c[0], h = Math.sqrt(T.r * T.r - (y - T.c[1]) ** 2), wall = cx + s * (h + 0.02), edge = cx + s * (h - 1.0), rnd = AV.rng(s * 7 + 40);
    const a = Math.min(wall, edge), b = Math.max(wall, edge);
    for (let z = z0; z < z1; z += 12) {
      const e = Math.min(z + 12, z1);
      K.face([[a, y, z], [b, y, z], [b, y, e], [a, y, e]], 'stone', { shade: 0.78 });
      K.face([[edge, y, z], [edge, T.water, z], [edge, T.water, e], [edge, y, e]], 'slime', {});
      K.line([edge, y, z], [edge, y, e], W.D, { fade: 0.03 });
      K.line([edge, T.water + 0.012, z], [edge, T.water + 0.012, e], W.H, { lc: 'inkL', fade: 0.05 });
    }
    K.face([[edge, y, z0], [wall, y, z0], [wall, T.water, z0], [edge, T.water, z0]], 'slab', { shade: 0.72, ink: W.D });
    if (z0 < 1) for (let z = 0.8; z < 70; z += 1.8) K.line([a, y + 0.002, z], [b, y + 0.002, z], W.H, { fade: 0.08 });
    // iron handrail on stanchions, along the water's edge
    const xr = edge - s * -0.06, yt = y + 1.0;
    for (let z = z0 + 0.4; z < Math.min(z1, 100); z += 2.4) { K.tube([xr, y, z], [xr, yt, z], 0.018, 'rail', { seg: 5, sil: W.H }); K.box(xr - 0.05, y, z - 0.05, xr + 0.05, y + 0.012, z + 0.05, 'rail', { ink: 0 }); }
    for (let z = z0; z < Math.min(z1, 100); z += 12) { K.tube([xr, yt, z], [xr, yt, z + 12], 0.018, 'rail', { seg: 5, sil: W.H }); K.tube([xr, y + 0.5, z], [xr, y + 0.5, z + 12], 0.012, 'rail', { seg: 4 }); }
    return { edge, wall };
  }
  function lateral(K, T, s, z, y, r) {
    const cx = T.c[0], h = Math.sqrt(T.r * T.r - (y - T.c[1]) ** 2), w = cx + s * h, end = w - s * 0.34;
    K.lathe('x', y, z, [[w + s * 0.05, r + 0.06], [end, r + 0.06], [end, r], [end + s * 0.04, r - 0.05]], 'rib', { seg: 16, sil: W.H, rim: W.H, fade: 0.05 });
    K.plane([end + s * 0.05, 0, 0], [0, 0, 1], [0, 1, 0], [-s, 0, 0]).disc(z, y, r - 0.04, r - 0.04, 'roomD', { off: 0, seg: 16 });
    // a thread of water from the lip, and the stain it has left below
    const f = cx + s * (h - 0.42);
    K.face([[f, y - r + 0.05, z - 0.04], [f, y - r + 0.05, z + 0.04], [f + s * 0.1, T.water, z + 0.1], [f + s * 0.1, T.water, z - 0.1]], 'waterF', {});
  }
  function shaftAndLadder(K, T, S) {
    const crown = T.c[1] + T.r - 0.05, y1 = -0.52, a = S.x - S.hw, b = S.x + S.hw, z0 = S.z0, z1 = S.z1;
    for (const [p, q] of [[[a, z0], [b, z0]], [[b, z0], [b, z1]], [[b, z1], [a, z1]], [[a, z1], [a, z0]]]) K.face([[p[0], crown, p[1]], [q[0], crown, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]], 'sewerD', { ink: W.H, fade: 0.06 });
    K.face([[a, y1, z0], [b, y1, z0], [b, y1, z1], [a, y1, z1]], 'rail', {});
    K.lathe('y', S.x, (z0 + z1) / 2, [[y1 - 0.002, 0.34], [y1 - 0.003, 0.3]], 'steelD', { seg: 18 });
    // the ladder from the catwalk up to the manhole, on standoffs
    const yb = T.ledge + 0.02;
    for (const u of [-0.22, 0.22]) { K.tube([S.x + u, yb, z0 + 0.08], [S.x + u, y1 - 0.05, z0 + 0.08], 0.018, 'rail', { seg: 6, sil: W.H }); for (let y = crown - 0.3; y > yb; y -= 1.2) K.tube([S.x + u, y, z0 + 0.08], [S.x + u, y, z0 + 0.03 - 0.05], 0.01, 'rail', { seg: 4 }); }
    for (let y = yb + 0.3; y < y1 - 0.1; y += 0.3) K.tube([S.x - 0.22, y, z0 + 0.08], [S.x + 0.22, y, z0 + 0.08], 0.012, 'rail', { seg: 5 });
    // cage hoops round the upper part
    for (let y = yb + 2.2; y < crown; y += 0.75) { const p = []; for (let i = 0; i <= 10; i++) { const t = Math.PI + (i / 10) * Math.PI; p.push([S.x + Math.cos(t) * 0.36, y, z0 + 0.08 + Math.sin(t) * 0.42]); } for (let i = 0; i < 10; i++) K.tube(p[i], p[i + 1], 0.007, 'rail', { seg: 3 }); }
  }
  function catwalk(K, T, z0, z1, ea, eb) {
    const y = T.ledge;
    K.box(ea, y - 0.09, z0, eb, y - 0.03, z0 + 0.05, 'rail', { ink: W.H }); K.box(ea, y - 0.09, z1 - 0.05, eb, y - 0.03, z1, 'rail', { ink: W.H });
    for (let x = ea + 0.02; x < eb - 0.02; x += 0.06) K.face([[x, y, z0], [x + 0.038, y, z0], [x + 0.038, y, z1], [x, y, z1]], 'railU', {});
    for (const z of [z0 + 0.025, z1 - 0.025]) { K.tube([ea, y + 1.0, z], [eb, y + 1.0, z], 0.018, 'rail', { seg: 5, sil: W.H }); K.tube([ea, y + 0.5, z], [eb, y + 0.5, z], 0.012, 'rail', { seg: 4 }); for (let x = ea; x <= eb + 0.01; x += 0.9) K.tube([x, y, z], [x, y + 1.0, z], 0.014, 'rail', { seg: 4 }); }
    // two rusted trestle legs down into the channel
    for (const x of [ea + 1.2, eb - 1.2]) for (const z of [z0 + 0.02, z1 - 0.02]) K.tube([x, y - 0.09, z], [x, T.water - 0.02, z], 0.03, 'rib', { seg: 6 });
  }
  // The nest. No creature is shown. A timber deck over the left of the channel with what someone large and clever has been living off.
  function nest(K, T) {
    const y = T.ledge + 0.04, xw = T.c[0] - 1.85, xe = T.c[0] - 0.25, z0 = 11, z1 = 26, rnd = AV.rng(1962);
    for (let x = xw - 0.0; x < xe; x += 0.24) K.box(x, y - 0.05, z0, x + 0.21, y, z1, 'wood', { ink: W.H, fade: 0.06, skip: 'b', fs: 0.92 });
    for (let z = z0 + 0.6; z < z1; z += 3.4) { K.box(xw, y - 0.17, z - 0.05, xe, y - 0.05, z + 0.05, 'woodD', { ink: W.H, fade: 0.08 }); K.tube([xe - 0.2, y - 0.17, z], [xe - 0.2, T.water - 0.03, z], 0.05, 'woodD', { seg: 6 }); }
    // a heavy bench of doors on drums, with glassware
    const bx0 = xw + 0.5, bx1 = bx0 + 1.05, bz0 = 13.2, bz1 = 18.4, by = y + 0.92;
    K.box(bx0, by - 0.05, bz0, bx1, by, bz1, 'woodD', { ink: W.D, fade: 0.05 });
    for (const z of [bz0 + 0.45, bz1 - 0.45]) K.lathe('y', (bx0 + bx1) / 2, z, [[y, 0.28], [y + 0.04, 0.3], [y + 0.45, 0.29], [y + 0.5, 0.3], [by - 0.05, 0.28], [by - 0.05, 0.001]], 'crateB', { seg: 14, sil: W.H });
    const flask = (x, z, r, h, liq) => { K.lathe('y', x, z, [[by, 0.001], [by, r], [by + h * 0.35, r], [by + h * 0.7, r * 0.3], [by + h, r * 0.26], [by + h, 0.001]], liq, { seg: 12, sil: W.H }); };
    for (let z = bz0 + 0.2; z < bz1 - 0.2;) { const k = rnd(), xx = bx0 + 0.14 + rnd() * 0.76; if (k < 0.34) flask(xx, z, 0.05 + rnd() * 0.04, 0.2 + rnd() * 0.14, rnd() < 0.6 ? 'grn' : 'lemon'); else if (k < 0.62) { K.lathe('y', xx, z, [[by, 0.05], [by + 0.2, 0.05], [by + 0.23, 0.035], [by + 0.25, 0.035]], 'cGlass', { seg: 10 }); } else if (k < 0.8) { K.box(xx - 0.12, by, z - 0.15, xx + 0.12, by + 0.012, z + 0.15, 'paper', { ink: W.H, fade: 0.12 }); } else K.box(xx - 0.11, by, z - 0.09, xx + 0.11, by + 0.16, z + 0.09, 'steelD', { ink: W.H }); z += 0.16 + rnd() * 0.22; }
    // the work lamp over it, hung on a stolen cable from the rib
    hangLamp(K, -5.0, 0, -3.4, 15.8, true); K.tube([-5.0, -3.3, 15.8], [-4.4, -1.7, 15.5], 0.006, 'rubber', { seg: 4 });
    // sheets pinned to the bricks: drawings of something with a tail, and notes
    for (let i = 0; i < 5; i++) { const a = Math.PI + 0.25 + (i % 3) * 0.16, z = 13.4 + i * 0.5 + rnd() * 0.2; wallQuad(K, T, a, a + 0.1, z, z + 0.36, rnd() < 0.3 ? 'papY' : 'paper', { ink: W.H, fade: 0.1, shade: 0.8 + rnd() * 0.2 }); }
    // crates, a drum, a torn mattress heaped with tarpaulin at the far end
    for (const [x, z, n] of [[xw + 0.5, 20.2, 3], [xw + 1.15, 20.0, 2], [xw + 0.45, 21.1, 2]]) { let yy = y; for (let i = 0; i < n; i++) { const h = 0.34; K.box(x - 0.28, yy, z - 0.26, x + 0.28, yy + h, z + 0.26, i % 2 ? 'crate' : 'crateB', { ink: W.H, fade: 0.08 }); yy += h; } }
    const mz0 = 22.2, mz1 = 25.2, mx0 = xw + 0.25, mx1 = xw + 1.85, cols = ['tarpR', 'tarp', 'curtain', 'cellar'];
    K.box(mx0, y, mz0, mx1, y + 0.2, mz1, 'curtain', { ink: W.H, fade: 0.1, shade: 0.72 });
    for (let i = 0; i < 26; i++) { const x = mx0 + rnd() * (mx1 - mx0), z = mz0 + rnd() * (mz1 - mz0), r = 0.3 + rnd() * 0.42, yy = y + 0.2 + rnd() * 0.06, c = cols[Math.floor(rnd() * 4)], pts = Array.from({ length: 7 }, (_, k) => { const t = (k / 7) * 6.283, q = r * (0.7 + rnd() * 0.5); return [x + Math.cos(t) * q, yy + rnd() * 0.12, z + Math.sin(t) * q]; }); K.face(pts, c, { ink: W.H, fade: 0.1, shade: 0.7 + rnd() * 0.3 }); }
    // claw marks, in fours, gouged through the bricks at the height only something big reaches; a broad wet drag along the planks
    const gouge = (a, z, L) => { for (let i = 0; i < 4; i++) { const zz = z + i * 0.13, tilt = 0.32; const A = P2(T, a + i * 0.012, T.r - 0.01), B = P2(T, a - L, T.r - 0.01); K.face([[A[0], A[1], zz - 0.016], [A[0], A[1], zz + 0.016], [B[0], B[1], zz + tilt + 0.004], [B[0], B[1], zz + tilt - 0.004]], 'roomD', {}); } };
    gouge(Math.PI - 0.56, 9.1, 0.3); gouge(Math.PI - 0.2, 27.0, 0.26); gouge(0.5, 13.8, 0.34); gouge(0.06, 21.2, 0.3);
    const drag = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = xw + 1.55 + Math.sin(t * 7) * 0.26; drag.push([x - 0.09 * (1 - t * 0.6), y + 0.004, 18.6 + t * 3.4]); } for (let i = 20; i >= 0; i--) { const t = i / 20, x = xw + 1.55 + Math.sin(t * 7) * 0.26; drag.push([x + 0.09 * (1 - t * 0.6), y + 0.004, 18.6 + t * 3.4]); }
    K.face(drag, 'woodD', { concave: true, shade: 0.6 });
    // the railing someone tore off and bent out of the way
    K.tube([xe - 0.1, y, 26.2], [xe + 0.5, y + 0.7, 26.8], 0.02, 'rail', { seg: 5, sil: W.H }); K.tube([xe + 0.5, y + 0.7, 26.8], [xe + 0.3, y + 1.3, 27.4], 0.02, 'rail', { seg: 5, sil: W.H });
  }

  // The vault for the big mains: three stacked runs on steel racks with a walkway
  function vault(K) {
    const V = SW.vault, x0 = V.x0, x1 = V.x1, y0 = V.y0, y1 = V.y1, end = V.end;
    K.begin('sw-vault');
    K.face([[x0, y0, 0], [x1, y0, 0], [x1, y0, end], [x0, y0, end]], 'bedC', { shade: 1.2 });
    K.face([[x0, y1, 0], [x1, y1, 0], [x1, y1, end], [x0, y1, end]], 'ceilP', {});
    for (const x of [x0, x1]) K.face([[x, y0, 0], [x, y0, end], [x, y1, end], [x, y1, 0]], 'stone', { shade: 0.74 });
    K.face([[x0, y0, end], [x1, y0, end], [x1, y1, end], [x0, y1, end]], 'stone', { shade: 0.64 });
    K.line([x0, y0, 0], [x0, y0, end], W.D, { fade: 0.03 }); K.line([x1, y0, 0], [x1, y0, end], W.D, { fade: 0.03 }); K.line([x0, y1, 0], [x0, y1, end], W.D, { fade: 0.03 }); K.line([x1, y1, 0], [x1, y1, end], W.D, { fade: 0.03 });
    const P = [[x0 + 0.72, -5.7, 0.36, 'alum'], [x0 + 0.72, -3.95, 0.28, 'rib']];
    for (const [x, y, r, c] of P) main(K, x, y, r, 0.01, end, c);
    // lagging bands on the jacketed steam main, and a valve wheel at mid length
    for (let z = 1; z < end; z += 1) K.lathe('z', x0 + 0.72, -5.7, [[z, 0.362], [z + 0.02, 0.362]], 'steelD', { seg: 18 });
    const vz = 14, vx = x0 + 1.34;
    K.lathe('z', x0 + 0.72, -3.95, [[vz - 0.3, 0.28], [vz - 0.25, 0.36], [vz + 0.25, 0.36], [vz + 0.3, 0.28]], 'rib', { seg: 16, rim: W.H, fade: 0.05 });
    K.tube([x0 + 0.72, -3.95, vz], [vx + 0.3, -3.95, vz], 0.035, 'steelD', { seg: 6 });
    { const wx = vx + 0.3, ww = 0.3; for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283, b = ((i + 1) / 18) * 6.283; K.tube([wx, -3.95 + Math.sin(a) * ww, vz + Math.cos(a) * ww], [wx, -3.95 + Math.sin(b) * ww, vz + Math.cos(b) * ww], 0.018, 'lacq', { seg: 5 }); } for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; K.tube([wx, -3.95, vz], [wx, -3.95 + Math.sin(a) * ww, vz + Math.cos(a) * ww], 0.012, 'lacq', { seg: 4 }); } }
    // racks: a post each side, a beam under each main
    for (let z = 2.5; z < end; z += 4) {
      for (const x of [x0 + 0.06, x1 - 0.06]) K.box(x - 0.05, y0, z - 0.05, x + 0.05, y1, z + 0.05, 'colG', { ink: W.H, fade: 0.05, skip: 'tb' });
      for (const [x, y, r] of P) { K.box(x0, y - r - 0.1, z - 0.05, x1, y - r, z + 0.05, 'colG', { ink: W.H, fade: 0.06 }); K.box(x - r * 0.6, y - r - 0.02, z - 0.08, x + r * 0.6, y - r * 0.7, z + 0.08, 'steelD', { ink: 0 }); }
      K.box(x0, y1 - 0.08, z - 0.05, x1, y1, z + 0.05, 'colG', { ink: 0 });
    }
    for (let z = 3.2; z < end; z += 6) { K.face([[-8.3 - 0.07, y1 - 0.02, z], [-8.3 + 0.07, y1 - 0.02, z], [-8.3 + 0.07, y1 - 0.02, z + 1.4], [-8.3 - 0.07, y1 - 0.02, z + 1.4]], 'tubeL', {}); K.box(-8.42, y1 - 0.015, z - 0.04, -8.18, y1, z + 1.44, 'alum', { ink: W.H, skip: 't' }); }
    K.end();
  }
  // Services gallery over the small sewer: gas, water, racks of conduit
  function gallery(K) {
    const G = SW.gal, x0 = G.x0, x1 = G.x1, y0 = G.y0, y1 = G.y1, end = G.end;
    K.begin('sw-gal');
    K.face([[x0, y0, 0], [x1, y0, 0], [x1, y0, end], [x0, y0, end]], 'bedC', { shade: 1.2 });
    K.face([[x0, y1, 0], [x1, y1, 0], [x1, y1, end], [x0, y1, end]], 'ceilP', {});
    for (const x of [x0, x1]) K.face([[x, y0, 0], [x, y0, end], [x, y1, end], [x, y1, 0]], 'stone', { shade: 0.74 });
    K.face([[x0, y0, end], [x1, y0, end], [x1, y1, end], [x0, y1, end]], 'roomD', {});
    for (const [p, q] of [[[x0, y0], [x0, y1]], [[x1, y0], [x1, y1]]]) { K.line([p[0], p[1], 0], [p[0], p[1], end], W.D, { fade: 0.03 }); K.line([q[0], q[1], 0], [q[0], q[1], end], W.D, { fade: 0.03 }); }
    main(K, x0 + 0.5, y0 + 0.42, 0.18, 0.01, end, 'sigY');
    // cable trays on brackets from the far wall, with their cables
    const tx0 = x1 - 1.05, tx1 = x1 - 0.04;
    for (const y of [y0 + 0.7, y0 + 1.3]) {
      K.box(tx0, y - 0.02, 0.01, tx1, y, end, 'alum', { ink: W.H, fade: 0.05 });
      for (let i = 0; i < 5; i++) { const x = tx0 + 0.07 + i * 0.1; K.tube([x, y + 0.03 + (i % 3) * 0.018, 0.01], [x, y + 0.03 + (i % 3) * 0.018, end], 0.022 + (i % 4) * 0.005, i % 3 === 0 ? 'rubber' : i % 3 === 1 ? 'seatC' : 'lacqD', { seg: 5 }); }
      for (let z = 1.5; z < end; z += 3) K.box(x1 - 1.05, y - 0.05, z - 0.03, x1, y - 0.02, z + 0.03, 'colG', { ink: 0 });
    }
    for (let z = 3; z < end; z += 8) { K.face([[2.13, y1 - 0.02, z], [2.27, y1 - 0.02, z], [2.27, y1 - 0.02, z + 1.4], [2.13, y1 - 0.02, z + 1.4]], 'tubeL', {}); K.box(2.02, y1 - 0.015, z - 0.04, 2.38, y1, z + 1.44, 'alum', { ink: W.H, skip: 't' }); }
    K.end();
  }

  AV.sewer = function (K) {
    const T = SW.main, U = SW.sub, S = SW.shaft;
    K.begin('sw-main');
    tunnel(K, T, 0, T.end, { z0: S.z0, z1: S.z1 }); ribs(K, T, 4, 110, 8);
    waterOf(K, T, T.end);
    const L = ledge(K, T, -1, 0, T.end), R = ledge(K, T, 1, 0, T.end);
    catwalk(K, T, S.z0 - 0.1, S.z1 + 0.1, L.edge, R.edge);
    shaftAndLadder(K, T, S);
    // two big mains on strap hangers high on the wall, and a cable tray: they run to the vanishing point with everything else
    main(K, T.c[0] + 1.4, T.c[1] + 1.1, 0.2, 0.01, 170, 'pipeO');
    for (let z = 3; z < 110; z += 6) { for (const [x, y, r] of [[T.c[0] + 1.4, T.c[1] + 1.1, 0.2]]) { const a = Math.atan2(y - T.c[1], x - T.c[0]), w = P2(T, a, T.r - 0.02); K.tube([x, y, z], [w[0], w[1], z], 0.025, 'steelD', { seg: 5 }); K.lathe('z', x, y, [[z - 0.04, r + 0.012], [z + 0.04, r + 0.012]], 'steelD', { seg: 14 }); } }
    for (let z = 2; z < 170; z += 13) hangLamp(K, T.c[0], T.c[1] + T.r - 0.04, -2.0, z + 4, z < 60);
    // side inlets, each dribbling into the channel
    [[-1, 5, -4.3, 0.42], [1, 19, -4.1, 0.55], [-1, 31, -4.2, 0.48], [1, 44, -4.4, 0.42], [-1, 62, -4.2, 0.5], [1, 78, -4.3, 0.46]].forEach(q => lateral(K, T, ...q));
    K.end();
    K.begin('sw-nest'); nest(K, T); K.end();
    vault(K); gallery(K);
  };
  // what the plane z = 0 shows of it all: the brick rings, the concrete frames, the sawn pipe ends, the water
  AV.sewerCut = function (pl) {
    const T = SW.main, U = SW.sub, V = SW.vault, G = SW.gal;
    ringCut(pl, T); waterCut(pl, T);
    for (const s of [-1, 1]) { const y = T.ledge, h = Math.sqrt(T.r * T.r - (y - T.c[1]) ** 2), e = T.c[0] + s * (h - 1.0); pl.line(e, y, T.c[0] + s * h, y, W.F, { off: 0.0036 }); }
    const frame = (a, b, c, d, w) => { pl.poly([[a - w, c - w], [b + w, c - w], [b + w, d + w], [a - w, d + w]], 'slab', { off: 0.002, shade: 1.08, holes: [[[a, c], [b, c], [b, d], [a, d]]] }); pl.pline([[a, c], [b, c], [b, d], [a, d]], true, W.F, { off: 0.0034 }); pl.pline([[a - w, c - w], [b + w, c - w], [b + w, d + w], [a - w, d + w]], true, W.D, { off: 0.0034 }); };
    frame(V.x0, V.x1, V.y0, V.y1, V.wall); frame(G.x0, G.x1, G.y0, G.y1, G.wall);
    // the mains, sawn where the plane passes through them
    for (const [x, y, r, c, w] of [[V.x0 + 0.72, -5.7, 0.36, 'alum', 0.055], [V.x0 + 0.72, -3.95, 0.28, 'rib', 0.035], [G.x0 + 0.5, G.y0 + 0.42, 0.18, 'sigY', 0.025], [T.c[0] + 1.4, T.c[1] + 1.1, 0.2, 'pipeO', 0.03]]) pipeCut(pl, x, y, r, c, w);
  };
  AV.sewerHoles = function () {
    const n = 40, ring = T => Array.from({ length: n }, (_, i) => P2(T, (i / n) * 6.28319, T.out)), V = SW.vault, G = SW.gal, rect = (a, b, c, d, w) => [[a - w, c - w], [b + w, c - w], [b + w, d + w], [a - w, d + w]];
    return [ring(SW.main), rect(V.x0, V.x1, V.y0, V.y1, V.wall), rect(G.x0, G.x1, G.y0, G.y1, G.wall)];
  };
  AV.inSewerHole = function (x, y) {
    const T = SW.main, U = SW.sub, V = SW.vault, G = SW.gal, e = 0.1;
    return Math.hypot(x - T.c[0], y - T.c[1]) < T.out + e || (x > V.x0 - V.wall - e && x < V.x1 + V.wall + e && y > V.y0 - V.wall - e && y < V.y1 + V.wall + e) || (x > G.x0 - G.wall - e && x < G.x1 + G.wall + e && y > G.y0 - G.wall - e && y < G.y1 + G.wall + e);
  };
})();
