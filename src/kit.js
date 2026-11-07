/* Drawing kit: faces with a named colour and lines that exist only because a part asked for them.
 * Weights are stage pixels: W.C contour · W.F form · W.D detail · W.H hatching. Each has a scale below which it fades.
 * K.tone tints whatever is drawn next (the shaded side of the street, the sunlit upper floors);
 * o.shade darkens a single plane, as a colourist would flat an underside or a reveal. */
(function () {
  const AV = (window.AV = window.AV || {});
  const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
  const W = (AV.W = { C: 1.25, F: 0.8, D: 0.5, H: 0.34 });
  const fadeOf = w => (w >= W.C ? 0 : w >= W.F ? 0.055 : w >= W.D ? 0.1 : 0.26);

  const PAPER = '#aacfca', BLUE = '#4498c2', YEL = '#e2cc4e', PALE = '#c4e2de', DEEP = '#7fb4b4';
  const base = {};
  const def = (n, a, b) => { base[n] = [hex(a), hex(b || PAPER)]; };
  def('sky', '#d6e0dc', PAPER);
  def('ink', '#231f1d', '#17292c'); def('inkL', '#e8e2d2', '#eaf3ef'); def('inkG', '#5b5650', '#2f5a60');
  // masonry
  def('brickR', '#a05f49'); def('brickD', '#83503f'); def('brickO', '#b87d5f'); def('brickT', '#bc9f7c'); def('brickG', '#8d8578');
  def('cream', '#ddd1b6'); def('iron', '#a3a49c'); def('sage', '#98a38e'); def('ochre', '#c8a96c'); def('lime', '#d1c8b1'); def('brown', '#7b5d4c');
  def('bluegrey', '#8c9aa0'); def('party', '#94705c');
  def('sill', '#d9d1bd'); def('sillD', '#b8ae98');
  def('corn', '#7d7a70'); def('cornL', '#c4bda8'); def('cornD', '#55504a'); def('cornG', '#6d7c70');
  // openings
  def('g1', '#34434d', PALE); def('g2', '#415563', PALE); def('g3', '#2b3840', PALE); def('gSky', '#8fa6ae', '#d6ebe6');
  def('blind', '#d4cbb2', PALE); def('curtain', '#c1a98a', PALE); def('frame', '#e3ddcc'); def('frameD', '#3c3d3c', DEEP); def('frameG', '#4e6a5b', BLUE);
  def('ac', '#cfccc0'); def('reveal', '#6a615a', DEEP);
  def('shop', '#3b4f59', PALE); def('shopIn', '#a38f68', '#e6f0dc'); def('tube', '#2f3f4b', BLUE); def('tubeL', '#f5edcf', '#eaf3ef'); def('shopD', '#20292e', DEEP); def('gate', '#9ba0a0', PALE);
  def('stFrame', '#31343a', DEEP); def('stGreen', '#35594a', BLUE); def('stRed', '#8e3a2f', BLUE); def('stBlack', '#26272a', DEEP); def('stCream', '#d9ccb0');
  def('rail', '#2d2f31', DEEP); def('railU', '#62625e', DEEP);
  def('goodsA', '#a6977a', PALE); def('goodsB', '#8a7c66', PALE); def('goodsC', '#b48e62', PALE); def('goodsD', '#7f8a86', PALE); def('poster', '#d8cfb6', '#e4f0ea'); def('posterR', '#b5604a', BLUE); def('ghost', '#b0917c', '#bcd9d4');
  // signs and awnings
  def('sgnR', '#b5442f', BLUE); def('sgnG', '#2f6a55', BLUE); def('sgnB', '#2f5376', BLUE); def('sgnY', '#deb33a', YEL); def('sgnW', '#ece6d6', '#eaf3ef'); def('sgnK', '#26262a', DEEP); def('sgnO', '#d08236', YEL);
  def('awnR', '#b34a35', BLUE); def('awnG', '#2f7259', BLUE); def('awnB', '#35608a', BLUE); def('awnW', '#e9e3d1'); def('awnY', '#d9ad3b', YEL);
  // ground
  def('road', '#7c7d82'); def('roadP', '#717278', '#a0c8c4'); def('roadS', '#65666c', '#97c1be'); def('lane', '#e4dfcf', '#eaf3ef'); def('yline', '#d7ae3a', YEL);
  def('walk', '#c1bbae'); def('walkD', '#a9a396'); def('curb', '#8d8a82', DEEP); def('curbT', '#cfc9ba'); def('plate', '#6e6f6d', DEEP); def('pit', '#4b4238', DEEP);
  def('earth', '#2c2722', BLUE); def('earthL', '#3a342d', '#3b89b0'); def('slab', '#4c4e52', '#6aa8c4'); def('tile', '#a9b3a6', PALE); def('lit', '#efe6bf', '#eaf3ef'); def('pipe', '#7d858b', PALE); def('pipeO', '#8d5a3c', YEL);
  // street furniture
  def('pole', '#3d4542', DEEP); def('poleG', '#2e5d4a', BLUE); def('hyd', '#b5472f', BLUE); def('usps', '#2e4e7e', BLUE); def('bin', '#55615a', DEEP); def('sigY', '#d9ad3b', YEL); def('sigK', '#1f2124', DEEP); def('lampG', '#f1e8c4', '#eaf3ef'); def('red', '#c8392b', YEL); def('grn', '#46b27d', YEL); def('stack', '#d9722f', YEL);
  def('ply', '#46604f', BLUE); def('plyU', '#55604f', DEEP);
  // vehicles
  const car = (n, s, t, f, bs) => { def(n + '.s', s, bs); def(n + '.t', t, bs); def(n + '.f', f, bs); };
  car('taxi', '#e3b12c', '#efc548', '#dcaa27', YEL); car('coal', '#34373c', '#44474d', '#2e3135', DEEP); car('silv', '#adb0b0', '#c9cbca', '#a3a6a6'); car('wht', '#dedcd2', '#ecebe2', '#d6d3c9');
  car('navy', '#2c3d55', '#3a4d69', '#27364c', BLUE); car('mar', '#6d2a2a', '#843737', '#612525', BLUE); car('grnC', '#41584c', '#527061', '#3a4f44', DEEP);
  def('cGlass', '#28333b', DEEP); def('cGlassL', '#6d8590', PALE); def('trim', '#222427', DEEP); def('chrome', '#c9cbc7'); def('tire', '#1f2023', DEEP); def('hub', '#b6b8b5'); def('arch', '#17181a', DEEP); def('under', '#1b1c1e', DEEP); def('tail', '#a82a24', BLUE); def('amber', '#d9892c', YEL); def('plateC', '#e9e3b8'); def('shadow', '#46474c', '#8fbcb9');
  def('busW', '#dde0dc'); def('busB', '#31619a', BLUE); def('boxW', '#dcd8cc'); def('boxR', '#b0483a', BLUE); def('boxD', '#3a3c3f', DEEP);

  // Chinatown: lacquer, gilt, glazed tile, paper, and what gets stacked on the pavement
  def('alum', '#8c8f8e', DEEP); def('wood', '#6e4f35'); def('woodD', '#463223', DEEP); def('gold', '#d9b04c', YEL); def('goldD', '#7c5d20', DEEP);
  def('lacq', '#a52c23', BLUE); def('lacqD', '#6d1d19', BLUE); def('jade', '#2d7b66', BLUE); def('acry', '#f2e9cb', '#eaf3ef'); def('acryR', '#c9352b', BLUE); def('acryY', '#ecc53c', YEL); def('acryB', '#2b5f93', BLUE); def('acryG', '#1f7c5e', BLUE);
  def('tileG', '#3f7f5f', BLUE); def('tileGD', '#2a5a45', BLUE); def('tileY', '#c79a34', YEL);
  def('roomD', '#14181b', DEEP); def('tailD', '#6d1a16', BLUE); def('roomW', '#d9cfb4', PALE); def('roomF', '#8d8574', PALE); def('roomC', '#cfc8b4', PALE); def('seatC', '#2a2b2e', DEEP); def('rubber', '#1d1e20', DEEP); def('lens', '#e9e4c8', PALE); def('steelD', '#4b4e50', DEEP); def('tileW', '#d9d6c6', PALE); def('stone', '#9a958a'); def('sewerB', '#7a5240'); def('sewerD', '#4c3a2e'); def('rib', '#5a4538', DEEP); def('water', '#2a3a30', DEEP); def('waterC', '#1b2a24', BLUE); def('waterF', '#8ca39a', PALE); def('slime', '#39473a', DEEP); def('hatch', '#2d2f31', DEEP); def('panel', '#7d8a86', PALE); def('railTop', '#8e8c86', PALE); def('roofD', '#5a5a57', PALE); def('colG', '#39493f', DEEP); def('ceilP', '#6e716b', PALE); def('tileS', '#e2ded0', PALE); def('terr', '#a9a498', PALE); def('tactY', '#d2ab2f', YEL); def('pitW', '#3c3d3c', DEEP); def('bedC', '#4b4a48', DEEP); def('ssteel', '#a5aca8', PALE); def('tileF', '#c9c0a8'); def('matD', '#34332f', DEEP); def('tact', '#b5543c', BLUE); def('kerbS', '#6b6d6c', DEEP); def('bikeB', '#2f73b5', BLUE); def('cone', '#e0702a', YEL); def('coneW', '#ece6d6', PALE); def('standG', '#2f5a44', BLUE); def('patchN', '#5a5b60', '#97c1be'); def('bagK', '#23252a', DEEP); def('pot', '#a4623c', YEL); def('leafD', '#3f6a33', BLUE); def('cloB', '#4f7a9e', BLUE); def('cloR', '#b2574e', BLUE); def('cloY', '#d8bd6a', YEL); def('rock', '#3a342d', '#3b89b0'); def('soil', '#2c2722', BLUE); def('bulb', '#ffe9ad', YEL); def('rice', '#d9d0b6', PALE); def('cellar', '#4a3a30', DEEP);
  def('paper', '#ece4c8', '#eaf3ef'); def('papY', '#efcf45', YEL); def('papR', '#cf3b2e', BLUE); def('papP', '#e7a4b0', PALE);
  def('duck', '#8f4d1f', YEL); def('duckD', '#5e2f12', DEEP); def('bun', '#d3a35a', YEL); def('velvet', '#6f2028', BLUE); def('drawer', '#7a5433'); def('drawerD', '#553822', DEEP);
  def('orange', '#d9822b', YEL); def('leaf', '#5c8a3a', BLUE); def('cabb', '#a2bb6d', PALE); def('apple', '#b5392c', BLUE); def('lemon', '#dcc03f', YEL);
  def('crate', '#b49a6a'); def('crateB', '#2f6f9f', BLUE); def('crateR', '#b8392e', BLUE); def('card', '#a98a5e'); def('ice', '#d8e4e4', '#eaf3ef'); def('fish', '#8b979c', PALE);
  def('chromeL', '#d5d7d3', '#eaf3ef'); def('tarp', '#3d6f8f', BLUE); def('tarpR', '#b23c31', BLUE);

  def('trainTrim', '#343f40', '#7fb4b4'); def('trainDoor', '#939c97', '#c4e2de');
  def('cutMortar', '#70695a', '#71a8b3'); def('cutBrick', '#96644c', '#87b8bd');
  def('cutMetal', '#b4b0a0', '#c4e2de'); def('cutRust', '#654332', '#4498c2');

  // procedural surface for each colour: 1 brick, 2 stone, 3 asphalt, 4 concrete, 5 glass, 6 painted timber/board, 7 canvas, 8 car paint, 9 steel, 10 glazed tile, 11 lit acrylic, 12 painted iron
  const MAT = {};
  const mat = (id, ...ns) => ns.forEach(n => { MAT[n] = id; });
  mat(1, 'brickR', 'brickD', 'brickO', 'brickT', 'brickG', 'brown', 'bluegrey', 'party');
  mat(2, 'cream', 'lime', 'sill', 'sillD', 'corn', 'cornL', 'cornD', 'cornG', 'curb', 'curbT', 'slab');
  mat(3, 'road', 'roadP', 'roadS', 'shadow', 'patchN');
  mat(4, 'walk', 'walkD', 'tileF');
  mat(5, 'g1', 'g2', 'g3', 'gSky', 'shop', 'shopD', 'cGlass', 'cGlassL');
  mat(20, 'colG');
  mat(9, 'railTop');
  mat(2, 'roofD');
  mat(6, 'standG', 'drawer', 'drawerD', 'stGreen', 'stRed', 'stBlack', 'stCream', 'sgnR', 'sgnG', 'sgnB', 'sgnY', 'sgnK', 'sgnO', 'frame', 'frameD', 'stFrame', 'wood', 'woodD', 'lacq', 'lacqD', 'jade', 'ply', 'plyU', 'crate', 'card', 'usps', 'bin', 'poleG', 'pole');
  mat(7, 'awnR', 'awnG', 'awnB', 'awnW', 'awnY', 'tarp', 'tarpR', 'blind', 'curtain', 'paper', 'papY', 'papR', 'papP');
  mat(8, 'taxi.s', 'taxi.t', 'taxi.f', 'coal.s', 'coal.t', 'coal.f', 'silv.s', 'silv.t', 'silv.f', 'wht.s', 'wht.t', 'wht.f', 'navy.s', 'navy.t', 'navy.f', 'mar.s', 'mar.t', 'mar.f', 'grnC.s', 'grnC.t', 'grnC.f');
  mat(2, 'stone', 'ceilP', 'bedC');
  mat(9, 'busW', 'busB', 'boxW', 'boxR', 'steelD', 'kerbS', 'gate', 'rail', 'railU', 'alum', 'plate', 'ac', 'pipe', 'boxD');
  mat(10, 'tileG', 'tileGD', 'tileY');
  mat(11, 'acry', 'acryR', 'acryY', 'acryB', 'acryG');
  mat(12, 'iron', 'sage', 'ochre', 'hyd');
  mat(15, 'lane', 'yline');   // road paint, worn through by traffic
  mat(16, 'chrome', 'hub', 'chromeL', 'panel');
  mat(21, 'sewerB');
  mat(22, 'water');
  mat(23, 'soil', 'earth', 'earthL');
  mat(24, 'rock');
  mat(25, 'slab');
  mat(26, 'cutBrick', 'cutMortar');
  mat(27, 'cutMetal', 'cutRust');
  mat(2, 'sewerD', 'slime');
  mat(9, 'rib');
  mat(8, 'bagK');   // polished metal: nothing but reflection
  mat(17, 'tileS');   // glazed wall tile
  mat(18, 'terr');    // polished terrazzo
  mat(19, 'ssteel', 'trainDoor');  // stainless car skin
  mat(13, 'tubeL', 'lampG', 'lit', 'grn', 'red', 'bulb');   // gives its own light
  mat(14, 'shopIn', 'goodsA', 'goodsB', 'goodsC', 'goodsD', 'poster', 'posterR', 'duck', 'duckD', 'bun', 'velvet', 'roomD', 'roomW', 'roomF', 'roomC');   // indoors: the sun never reaches it

  // light is now worked out from the sun in the shader, so the old per-side tints do nothing
  const TONES = { none: [1, 1, 1], shade: [1, 1, 1], sun: [1, 1, 1], dim: [1, 1, 1] };
  const roles = [], index = new Map();
  function roleOf(name, tone, shade) {
    shade = Math.round(shade * 25) / 25;   // a palette of named tones, not one colour per random number
    const key = name + '|' + tone + '|' + shade;
    let r = index.get(key);
    if (r != null) return r;
    const b = base[name];
    if (!b) throw new Error('unknown colour ' + name);
    const t = TONES[tone];
    r = roles.length;
    if (r > 2047) throw new Error('palette over 2047 roles');
    roles.push([b[0].map((v, i) => Math.min(1, v * t[i] * shade)), b[1], MAT[name] || 0]);
    index.set(key, r);
    return r;
  }
  AV.paletteData = () => {
    const n = roles.length, px = new Uint8Array(n * 2 * 4);
    roles.forEach((c, i) => { for (let k = 0; k < 2; k++) { for (let j = 0; j < 3; j++) px[(k * n + i) * 4 + j] = Math.round(c[k][j] * 255); px[(k * n + i) * 4 + 3] = k === 0 ? c[2] : 0; } });
    const sky = roleOf('sky', 'none', 1);
    return { n, px, sky, skyA: base.sky[0], skyB: base.sky[1] };
  };
  roleOf('sky', 'none', 1);

  function newell(p) {
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return [x, y, z];
  }

  // a normal packed into the vertex's role: 6+6 bits octahedral on top of 11 bits of palette index
  function octEnc(n) {
    const L = Math.abs(n[0]) + Math.abs(n[1]) + Math.abs(n[2]) || 1; let x = n[0] / L, y = n[1] / L;
    if (n[2] < 0) { const a = (1 - Math.abs(y)) * (x >= 0 ? 1 : -1), b = (1 - Math.abs(x)) * (y >= 0 ? 1 : -1); x = a; y = b; }
    return Math.round((x + 1) * 31.5) * 64 + Math.round((y + 1) * 31.5) + 1;
  }
  AV.Kit = class Kit {
    constructor() { this.f = []; this.lmap = new Map(); this.l = []; this.r = [1, 0, 0, 0, 1, 0, 0, 0, 1]; this.t = [0, 0, 0]; this.stack = []; this.tris = 0; this.tone = 'none'; this.parts = []; this.open = []; }
    // parts: named extents, used only by the collision audit
    // transparent pane: type 0 shop glass, 1 house window, 2 tinted car glass
    glass(pts, type) { const wp = pts.map(q => this.p(q)), g = (this.g = this.g || []), t = type || 0; for (let i = 1; i < wp.length - 1; i++) for (const q of [wp[0], wp[i], wp[i + 1]]) g.push(q[0], q[1], q[2], t); return this; }
    castBox(a, b) { const c = (this.casters = this.casters || []), [x0, y0, z0] = a, [x1, y1, z1] = b; for (const pts of [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]]) c.push({ pts }); }
    // a round bar from a to b with smooth normals. o.seg, o.r2, o.sil (ink weight), o.caps
    tube(a, b, r, col, o) {
      o = o || {}; const seg = o.seg || 6, r2 = o.r2 == null ? r : o.r2, d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, e = d.map(v => v / L);
      const h = Math.abs(e[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = [e[1] * h[2] - e[2] * h[1], e[2] * h[0] - e[0] * h[2], e[0] * h[1] - e[1] * h[0]], ul = Math.hypot(u[0], u[1], u[2]), U = u.map(v => v / ul), V = [e[1] * U[2] - e[2] * U[1], e[2] * U[0] - e[0] * U[2], e[0] * U[1] - e[1] * U[0]];
      const nor = t => [U[0] * Math.cos(t) + V[0] * Math.sin(t), U[1] * Math.cos(t) + V[1] * Math.sin(t), U[2] * Math.cos(t) + V[2] * Math.sin(t)];
      const pt = (c, rr, t) => { const n = nor(t); return [c[0] + n[0] * rr, c[1] + n[1] * rr, c[2] + n[2] * rr]; };
      for (let i = 0; i < seg; i++) {
        const t0 = (i / seg) * 6.2832, t1 = ((i + 1) / seg) * 6.2832;
        this.face([pt(a, r, t0), pt(a, r, t1), pt(b, r2, t1), pt(b, r2, t0)], col, { normals: [nor(t0), nor(t1), nor(t1), nor(t0)], tone: o.tone });
        if (o.sil) this._sil(this.p(pt(a, r, t0)), this.p(pt(b, r2, t0)), this.n(nor(t0 - 3.1416 / seg)), this.n(nor(t0 + 3.1416 / seg)), o.sil);
      }
      if (o.caps) { this.face(Array.from({ length: seg }, (_, i) => pt(b, r2, (i / seg) * 6.2832)), col, {}); this.face(Array.from({ length: seg }, (_, i) => pt(a, r, (i / seg) * 6.2832)), col, {}); }
      return this;
    }
    // surface of revolution. prof: [[v, r, col?], ...] along the axis. Each band has its own slope, smooth around the axis.
    lathe(axis, c1, c2, prof, col, o) {
      o = o || {}; const seg = o.seg || 16, a0 = o.a0 || 0, a1 = o.a1 == null ? 6.2832 : o.a1;
      const pt = (v, t, rr) => { const u = Math.cos(t) * rr, w = Math.sin(t) * rr; return axis === 'x' ? [v, c1 + u, c2 + w] : axis === 'y' ? [c1 + u, v, c2 + w] : [c1 + u, c2 + w, v]; };
      const nr = (t, nv, nrad) => { const u = Math.cos(t) * nrad, w = Math.sin(t) * nrad; return axis === 'x' ? [nv, u, w] : axis === 'y' ? [u, nv, w] : [u, w, nv]; };
      for (let j = 0; j < prof.length - 1; j++) {
        const [v0, r0] = prof[j], [v1, r1] = prof[j + 1], c = prof[j + 1][2] || col, dv = v1 - v0, dr = r1 - r0, L = Math.hypot(dv, dr) || 1, sgn = o.flip ? -1 : 1, nrad = (sgn * dv) / L * (dv < 0 ? -1 : 1), nax = -(sgn * dr) / L * (dv < 0 ? -1 : 1);
        for (let i = 0; i < seg; i++) {
          const t0 = a0 + ((a1 - a0) * i) / seg, t1 = a0 + ((a1 - a0) * (i + 1)) / seg, n0 = nr(t0, nax, Math.abs(dv) < 1e-5 ? 0 : nrad), n1 = nr(t1, nax, Math.abs(dv) < 1e-5 ? 0 : nrad);
          this.face([pt(v0, t0, r0), pt(v0, t1, r0), pt(v1, t1, r1), pt(v1, t0, r1)], c, { normals: [n0, n1, n1, n0], tone: o.tone });
          if (o.sil && L > 0.03 && Math.abs(dv) > 1e-5) this._sil(this.p(pt(v0, t0, r0)), this.p(pt(v1, t0, r1)), this.n(nr(t0 - 3.1416 / seg, 0, 1)), this.n(nr(t0 + 3.1416 / seg, 0, 1)), o.sil);
        }
        if (o.rim && r1 > 0.004) for (let i = 0; i < seg; i++) { const t0 = a0 + ((a1 - a0) * i) / seg, t1 = a0 + ((a1 - a0) * (i + 1)) / seg; this.line(pt(v1, t0, r1), pt(v1, t1, r1), o.rim, { fade: o.fade == null ? 0.1 : o.fade, lc: o.lc }); }
      }
      return this;
    }
    // things whose shadow falls on the sunlit wall. Points are world space.
    castPoly(pts) { (this.casters = this.casters || []).push({ pts }); }
    castLine(a, b, w) { (this.casters = this.casters || []).push({ pts: [a, b], w: w || 0.04 }); }
    begin(name) { this.open.push({ name, f: this.f.length, l: this.l.length }); return this; }
    end() { const q = this.open.pop(), a = [1e9, 1e9, 1e9], b = [-1e9, -1e9, -1e9]; const eat = (x, y, z) => { if (x < a[0]) a[0] = x; if (y < a[1]) a[1] = y; if (z < a[2]) a[2] = z; if (x > b[0]) b[0] = x; if (y > b[1]) b[1] = y; if (z > b[2]) b[2] = z; }; for (let i = q.f; i < this.f.length; i += 4) eat(this.f[i], this.f[i + 1], this.f[i + 2]); for (let i = q.l; i < this.l.length; i += 16) { eat(this.l[i], this.l[i + 1], this.l[i + 2]); eat(this.l[i + 3], this.l[i + 4], this.l[i + 5]); } this.parts.push({ name: q.name, a, b }); return this; }
    push() { this.stack.push([this.r.slice(), this.t.slice()]); return this; }
    pop() { const s = this.stack.pop(); this.r = s[0]; this.t = s[1]; return this; }
    T(x, y, z) { const r = this.r; this.t = [r[0] * x + r[1] * y + r[2] * z + this.t[0], r[3] * x + r[4] * y + r[5] * z + this.t[1], r[6] * x + r[7] * y + r[8] * z + this.t[2]]; return this; }
    p(q) { const r = this.r, t = this.t; return [r[0] * q[0] + r[1] * q[1] + r[2] * q[2] + t[0], r[3] * q[0] + r[4] * q[1] + r[5] * q[2] + t[1], r[6] * q[0] + r[7] * q[1] + r[8] * q[2] + t[2]]; }
    n(q) { const r = this.r; return [r[0] * q[0] + r[1] * q[1] + r[2] * q[2], r[3] * q[0] + r[4] * q[1] + r[5] * q[2], r[6] * q[0] + r[7] * q[1] + r[8] * q[2]]; }

    face(pts, col, o) {
      o = o || {};
      const wp = pts.map(q => this.p(q));
      const r = roleOf(col, o.tone || this.tone, o.shade == null ? 1 : o.shade);
      const f = this.f;
      const tri = (a, b, c) => { f.push(a[0], a[1], a[2], r, b[0], b[1], b[2], r, c[0], c[1], c[2], r); this.tris++; };
      if (o.normals || o.shades) {
        const ta = i => (o.shades ? roleOf(col, o.tone || this.tone, Math.round(o.shades[i] * 40) / 40) : r) + (o.normals ? octEnc(this.n(o.normals[i])) * 2048 : 0);
        for (let i = 1; i < wp.length - 1; i++) { const A = wp[0], B = wp[i], C = wp[i + 1]; f.push(A[0], A[1], A[2], ta(0), B[0], B[1], B[2], ta(i), C[0], C[1], C[2], ta(i + 1)); this.tris++; }
        if (o.ink) for (let i = 0; i < wp.length; i++) this._seg(wp[i], wp[(i + 1) % wp.length], o.ink, o.lc, o.fade);
        return this;
      }
      if (o.concave || o.holes) {
        const nn = newell(wp), m = nn.map(Math.abs);
        const ax = m[0] > m[1] ? (m[0] > m[2] ? 0 : 2) : (m[1] > m[2] ? 1 : 2);
        const u = (ax + 1) % 3, v = (ax + 2) % 3;
        const all = wp.slice(), hi = [];
        if (o.holes) for (const h of o.holes) { hi.push(all.length); for (const q of h) all.push(this.p(q)); }
        const flat = []; for (const q of all) flat.push(q[u], q[v]);
        const idx = AV.earcut(flat, hi.length ? hi : null);
        for (let i = 0; i < idx.length; i += 3) tri(all[idx[i]], all[idx[i + 1]], all[idx[i + 2]]);
      } else {
        for (let i = 1; i < wp.length - 1; i++) tri(wp[0], wp[i], wp[i + 1]);
      }
      if (o.ink) for (let i = 0; i < wp.length; i++) {
        const w = Array.isArray(o.ink) ? o.ink[i] : o.ink;
        if (w) this._seg(wp[i], wp[(i + 1) % wp.length], w, o.lc, o.fade);
      }
      return this;
    }
    _seg(a, b, w, lc, fade, mode) {
      const ka = Math.round(a[0] * 500) + ',' + Math.round(a[1] * 500) + ',' + Math.round(a[2] * 500), kb = Math.round(b[0] * 500) + ',' + Math.round(b[1] * 500) + ',' + Math.round(b[2] * 500);
      if (ka === kb) return;
      const key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      const hit = this.lmap.get(key);
      const c = roleOf(lc || 'ink', 'none', 1), fd = fade != null ? fade : fadeOf(w);
      if (hit != null) { const l = this.l; if (l[hit + 12] < w) { l[hit + 12] = w; l[hit + 15] = fd; } return; }
      this.lmap.set(key, this.l.length);
      this.l.push(a[0], a[1], a[2], b[0], b[1], b[2], 0, 1, 0, 0, 1, 0, w, mode || 0, c, fd);
    }
    _sil(a, b, na, nb, w) { this.l.push(a[0], a[1], a[2], b[0], b[1], b[2], na[0], na[1], na[2], nb[0], nb[1], nb[2], w, 1, roleOf('ink', 'none', 1), fadeOf(w)); }
    line(a, b, w, o) { o = o || {}; this._seg(this.p(a), this.p(b), w || W.F, o.lc, o.fade, o.lineOnly ? 2 : 0); return this; }
    pline(pts, closed, w, o) { const n = pts.length; for (let i = 0; i < (closed ? n : n - 1); i++) this.line(pts[i], pts[(i + 1) % n], w, o); return this; }

    // axis-aligned box. o.ink weight; o.skip: subset of 't b f k l r'
    box(x0, y0, z0, x1, y1, z1, col, o) {
      o = o || {};
      const ink = o.ink == null ? W.D : o.ink, skip = o.skip || '';
      const fo = (s) => ({ ink, lc: o.lc, fade: o.fade, shade: s, tone: o.tone });
      if (!skip.includes('f')) this.face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], o.front || col, fo(1));
      if (!skip.includes('k')) this.face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], o.front || col, fo(1));
      if (!skip.includes('l')) this.face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], o.side || col, fo(0.86));
      if (!skip.includes('r')) this.face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], o.side || col, fo(0.86));
      if (!skip.includes('t')) this.face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], o.top || col, fo(1.08));
      if (!skip.includes('b')) this.face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], o.side || col, fo(0.7));
      return this;
    }
    // cylinder along an axis from a to b. axis 'x': c1=y c2=z · 'y': c1=x c2=z · 'z': c1=x c2=y
    cyl(axis, a, b, c1, c2, r, col, o) {
      o = o || {};
      const seg = o.seg || 16, sil = o.sil == null ? W.D : o.sil, rim = o.rim == null ? sil : o.rim, r2 = o.r2 == null ? r : o.r2;
      const pt = (v, t, rr) => { const u = Math.cos(t) * rr, w = Math.sin(t) * rr; return axis === 'x' ? [v, c1 + u, c2 + w] : axis === 'y' ? [c1 + u, v, c2 + w] : [c1 + u, c2 + w, v]; };
      const nrm = t => { const u = Math.cos(t), w = Math.sin(t); return axis === 'x' ? [0, u, w] : axis === 'y' ? [u, 0, w] : [u, w, 0]; };
      for (let i = 0; i < seg; i++) {
        const t0 = (i / seg) * Math.PI * 2, t1 = ((i + 1) / seg) * Math.PI * 2;
        this.face([pt(a, t0, r), pt(a, t1, r), pt(b, t1, r2), pt(b, t0, r2)], o.sideCol || col, { normals: [nrm(t0), nrm(t1), nrm(t1), nrm(t0)] });
        if (sil) this._sil(this.p(pt(a, t0, r)), this.p(pt(b, t0, r2)), this.n(nrm(t0 - Math.PI / seg)), this.n(nrm(t0 + Math.PI / seg)), sil);
      }
      const A = [], B = [];
      for (let i = 0; i < seg; i++) { const t = (i / seg) * Math.PI * 2; A.push(pt(a, t, r)); B.push(pt(b, t, r2)); }
      if (!o.noCapA) this.face(A, col, { ink: rim });
      if (!o.noCapB) this.face(B, col, { ink: rim });
      return this;
    }
    // a plane: P(a,b) = origin + a*U + b*V, decals sit `off` along `out`
    plane(origin, U, V, out) {
      const self = this;
      const P3 = (a, b, off) => [origin[0] + U[0] * a + V[0] * b + out[0] * off, origin[1] + U[1] * a + V[1] * b + out[1] * off, origin[2] + U[2] * a + V[2] * b + out[2] * off];
      const pl = {
        P: P3,
        poly(ab, col, o) { o = o || {}; const off = o.off == null ? 0.004 : o.off; self.face(ab.map(q => P3(q[0], q[1], off)), col, Object.assign({}, o, o.holes ? { holes: o.holes.map(h => h.map(q => P3(q[0], q[1], off))) } : null)); return pl; },
        rect(a0, b0, a1, b1, col, o) { return pl.poly([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], col, o); },
        line(a0, b0, a1, b1, w, o) { o = o || {}; const off = o.off == null ? 0.006 : o.off; self.line(P3(a0, b0, off), P3(a1, b1, off), w, o); return pl; },
        pline(ab, closed, w, o) { for (let i = 0; i < ab.length - (closed ? 0 : 1); i++) { const q = ab[i], r = ab[(i + 1) % ab.length]; pl.line(q[0], q[1], r[0], r[1], w, o); } return pl; },
        disc(ca, cb, ra, rb, col, o) { o = o || {}; const seg = o.seg || 20; return pl.poly(Array.from({ length: seg }, (_, i) => { const t = (i / seg) * Math.PI * 2; return [ca + Math.cos(t) * ra, cb + Math.sin(t) * rb]; }), col, o); },
        ring(ca, cb, r, w, o) { o = o || {}; const seg = o.seg || 24; return pl.pline(Array.from({ length: seg }, (_, i) => { const t = (i / seg) * Math.PI * 2; return [ca + Math.cos(t) * r, cb + Math.sin(t) * r]; }), true, w, o); },
        text(str, a0, b0, h, col, o) { AV.type(pl, str, a0, b0, h, col, Object.assign({ font: 'oswald', track: 0.03 }, o)); return pl; },
        side(p, q, off0, off1, col, shade) { self.face([P3(p[0], p[1], off0), P3(q[0], q[1], off0), P3(q[0], q[1], off1), P3(p[0], p[1], off1)], col, { shade }); return pl; },
      };
      return pl;
    }
    glassData() { return new Float32Array(this.g || []); }
    faceData() { return new Float32Array(this.f); }
    lineData() { return new Float32Array(this.l); }
  };

  AV.rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
