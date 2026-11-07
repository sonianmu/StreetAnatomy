/* Mott Street looking north, Chinatown on a weekday. Four long blocks to Canal. Shop names are invented. */
(function () {
  const AV = (window.AV = window.AV || {});
  const STR = { R: ['awnR', 'awnW'], G: ['awnG', 'awnW'], B: ['awnB', 'awnW'], Y: ['awnY', 'awnW'], r: ['awnR'], g: ['awnG'], b: ['awnB'] };
  const M = {
    redB: { wall: 'brickR', trim: 'sill', frame: 'frame', corn: 'corn', hood: true, lights: 0, band: true },
    darkB: { wall: 'brickD', trim: 'sillD', frame: 'frame', corn: 'cornD', band: false },
    oraB: { wall: 'brickO', trim: 'sill', frame: 'frameD', corn: 'cornL', hood: true, band: true },
    tanB: { wall: 'brickT', trim: 'sill', frame: 'frameD', corn: 'cornL', bay: 2.2, base: 'lime' },
    greyB: { wall: 'brickG', trim: 'sillD', frame: 'frame', corn: 'cornG', bay: 2.2 },
    creamI: { wall: 'cream', frame: 'frameD', corn: 'cream', base: 'cream', d: 0.2 },
    ironI: { wall: 'iron', frame: 'frame', corn: 'iron', base: 'iron', d: 0.2 },
    sageI: { wall: 'sage', frame: 'frame', corn: 'sage', base: 'sage', d: 0.2 },
    ochreI: { wall: 'ochre', frame: 'frameD', corn: 'ochre', base: 'ochre', d: 0.2 },
    limeP: { wall: 'brickT', trim: 'sill', frame: 'frameD', base: 'lime' },
    brownP: { wall: 'brown', trim: 'sillD', frame: 'frame', base: 'lime' },
    blueP: { wall: 'bluegrey', trim: 'sill', frame: 'frame', base: 'lime' },
  };
  // shop: cn, en, then how the sign is made and lettered
  const S = (cn, en, spec, o) => Object.assign({ spec: Object.assign({ cn, en }, spec) }, o, o && o.awn ? { awn: STR[o.awn] } : null);

  const LEFT_A = [
    { t: 'loft', w: 15.2, floors: 5, mat: M.creamI, seed: 21, arches: 1, tank: true,
      stores: [
        S('永興五金', 'WING HING HARDWARE & PAINT', { style: 'gilt', col: 'stGreen', tc: 'gold', fc: 'ming', fe: 'alfa', layout: 'row' }, { w: 1.3, inside: 'shelves', awn: 'G', awnText: { t: 'TOOLS · 工具 · LOCKS · 油漆', f: 'hei' }, notes: [{ t: '特價', s: '$4.99', at: 0.72, y: 0.1 }, { t: '油漆', at: 0.84, y: 0.1, c: 'paper' }] }),
        S('配匙', 'KEYS MADE', { style: 'backlit', col: 'acry', tc: 'acryR', tc2: 'sgnK', fc: 'hei', fe: 'bebas' }, { w: 0.62, doorAt: 1, inside: 'posters' }),
      ] },
    { t: 'tenement', w: 7.6, floors: 5, mat: M.redB, seed: 4, escape: [0.5, 2.5], stores: [S('金源餅家', 'Golden Fount Bakery', { style: 'painted', col: 'lacq', tc: 'gold', tc2: 'sgnW', fc: 'kai', fe: 'lobster', sc: 'lacqD' }, { inside: 'bakery', awn: 'R', notes: [{ t: '蛋撻', s: '3/$2', at: 0.62, y: 0.12 }, { t: '叉燒包', at: 0.8, y: 0.12, c: 'paper' }] })] },
    { t: 'tenement', w: 7.6, floors: 4, mat: M.oraB, seed: 8, escape: [1, 3], tank: true, glass: { 1: { cn: '牙科', en: 'DR LAM DENTIST', bays: [0] } }, stores: [S('新世界洗衣', 'NEW WORLD LAUNDRY', { style: 'backlit', col: 'acryB', tc: 'acry', fc: 'hei', fe: 'oswald', band: 'acry', tc2: 'acryB' }, { doorAt: 1, inside: 'rack' })] },
    { t: 'loft', w: 12.4, floors: 6, mat: M.ironI, seed: 33, arches: 1, escape: [1, 3], stores: [S('華昌布莊', 'Wah Chong Fabrics', { style: 'painted', col: 'stBlack', tc: 'gold', tc2: 'sgnW', fc: 'boku', fe: 'abril', sc: 'goldD' }, { inside: 'rack' }), { gate: true, w: 0.6, spec: { cn: '吉舖招租', en: 'FOR RENT', style: 'vinyl', col: 'paper', tc: 'lacq', tc2: 'sgnK', fc: 'hei', fe: 'bebas' } }] },
    { t: 'prewar', w: 15.2, floors: 13, mat: M.limeP, seed: 5, boards: [{ a: 0.5, b: 0.96, y: 5.14, h: 0.6, cn: '英文補習', en: 'ENGLISH CLASSES 2F', style: 'painted', col: 'sgnB', tc: 'sgnW', fc: 'kai', fe: 'elite', layout: 'row' }], ghost: ['FINE', 'FURNITURE'], glass: { 0: { cn: '律師樓', en: 'ATTORNEY AT LAW', bays: [1, 2, 3] } }, stores: [S('中美藥房', 'SINO-AMERICAN PHARMACY', { style: 'backlit', col: 'acryG', tc: 'acry', fc: 'ming', fe: 'overpass', layout: 'row' }, { doorAt: 1, w: 1, inside: 'shelves' }), S('茶莊', 'Fine Teas', { style: 'channel', col: 'woodD', tc: 'gold', fc: 'boku', fe: 'limelight', side: 'goldD' }, { w: 0.7, awn: 'b', inside: 'shelves' })] },
    { t: 'tenement', w: 14, floors: 6, mat: M.darkB, seed: 12, escape: [2, 4], tank: true, stores: [S('萬利酒舖', 'WINES LIQUORS', { style: 'painted', col: 'stRed', tc: 'sgnW', fc: 'dela', fe: 'bebas', sc: 'lacqD' }, {}), S('皮鞋修理', 'Shoe Repair', { style: 'painted', col: 'stCream', tc: 'sgnK', tc2: 'lacq', fc: 'kai', fe: 'elite', sc: 'sillD' }, { awn: 'g', doorAt: 1, inside: 'posters' })] },
  ];
  const RIGHT_A = [
    { t: 'tenement', w: 7.6, floors: 5, mat: M.oraB, seed: 41, arcade: 1.7, boards: [{ a: 0.06, b: 0.94, y: 4.52, h: 0.62, cn: '批發零售', en: 'WHOLESALE RETAIL', style: 'vinyl', col: 'paper', tc: 'lacq', tc2: 'sgnK', fc: 'hei', fe: 'bebas', layout: 'row' }], stores: [S('大利雜貨', 'TAI LEE GROCERY', { style: 'painted', col: 'sgnY', tc: 'lacq', tc2: 'sgnK', fc: 'dela', fe: 'alfa', sc: 'goldD', hand: 0.012 }, { doorAt: 1, inside: 'crates', awn: 'Y', awnText: { t: 'FRUIT · 水果 · 乾貨', f: 'hei', c: 'sgnK', bg: 'awnY' }, notes: [{ t: '新鮮', s: '$0.99', at: 0.72, y: 0.12 }] })] },
    { t: 'loft', w: 15.2, floors: 6, mat: M.sageI, seed: 42, arches: 2, escape: [3, 5], tank: true, stores: [S('鴻福燒臘', 'Hung Fook BBQ & Congee', { style: 'backlit', col: 'acry', tc: 'acryR', tc2: 'sgnK', fc: 'ming', fe: 'pacifico', layout: 'row', band: 'acryY' }, { inside: 'bbq', notes: [{ t: '燒鴨', s: '$14', at: 0.86, y: 0.12 }, { t: '粥麵', at: 0.74, y: 0.12, c: 'paper' }] })] },
    { t: 'tenement', w: 7.6, floors: 4, mat: M.redB, seed: 43, escape: [1, 3], stores: [S('金寶珠寶', 'GOLD PALACE JEWELRY', { style: 'channel', col: 'stBlack', tc: 'gold', fc: 'ming', fe: 'limelight', side: 'goldD' }, { inside: 'jewel' })] },
    { t: 'prewar', w: 19, floors: 16, mat: M.brownP, seed: 44, ghost: ['FIREPROOF', 'STORAGE'], glass: { 1: { cn: '會計', en: 'TAX · INCOME', bays: [0, 1] } }, stores: [S('聯合書局', 'United Books', { style: 'gilt', col: 'sgnB', tc: 'gold', fc: 'kai', fe: 'abril' }, { w: 0.8 }), S('環球旅行社', 'GLOBAL TRAVEL', { style: 'backlit', col: 'acry', tc: 'acryB', tc2: 'acryR', fc: 'hei', fe: 'oswald' }, { doorAt: 1, inside: 'posters' })] },
    { t: 'tenement', w: 7.6, floors: 5, mat: M.greyB, seed: 45, pagoda: true, stores: [S('中華公所', 'CHINESE ASSOCIATION', { style: 'gilt', col: 'lacq', tc: 'gold', fc: 'ming', fe: 'abril' }, { inside: 'blind' })] },
    { t: 'loft', w: 15, floors: 5, mat: M.ochreI, seed: 46, arches: 1, escape: [2, 4], stores: [S('海記魚行', 'HOI KEE FISH MARKET', { style: 'backlit', col: 'acryR', tc: 'acry', fc: 'dela', fe: 'alfa', layout: 'row' }, { inside: 'crates', notes: [{ t: '活魚', at: 0.8, y: 0.1 }] })] },
  ];
  const far = [['點心', 'lacq', 'gold'], ['茶餐廳', 'acry', 'acryR'], ['理髮', 'stBlack', 'sgnW'], ['雜貨', 'sgnG', 'sgnW'], ['銀行', 'sgnB', 'gold'], ['酒樓', 'acryR', 'acry'], ['花店', 'jade', 'sgnW'], ['裁縫', 'stBlack', 'gold'], ['古董', 'woodD', 'gold'], ['街市', 'sgnY', 'lacq'], ['麵包', 'stCream', 'lacq'], ['手機', 'acryB', 'acry'], ['水果', 'acryG', 'acry']];
  let fi = 0;
  const shop = (en, o) => { const q = far[fi++ % far.length]; return S(q[0], en, { style: q[1].startsWith('acry') ? 'backlit' : 'painted', col: q[1], tc: q[2], fc: ['hei', 'ming', 'kai', 'dela'][fi % 4], fe: ['bebas', 'alfa', 'oswald', 'abril'][fi % 4] }, o); };
  const LEFT_B = [
    { t: 'prewar', w: 18, floors: 18, mat: M.blueP, seed: 51, stores: [shop('DIM SUM')] },
    { t: 'tenement', w: 15, floors: 5, mat: M.redB, seed: 52, escape: [2, 4], tank: true, stores: [S('', 'Pizza', { col: 'sgnR', tc: 'sgnW', fe: 'lobster' }, { awn: 'R' }), shop('COFFEE SHOP')] },
    { t: 'loft', w: 15, floors: 7, mat: M.creamI, seed: 53, arches: 1, escape: [2, 4], stores: [shop('BARBER')] },
    { t: 'tenement', w: 15, floors: 6, mat: M.darkB, seed: 54, tank: true, stores: [shop('GROCERY', { awn: 'G' })] },
    { t: 'prewar', w: 17, floors: 22, mat: M.limeP, seed: 55, stores: [shop('BANK')] },
  ];
  const RIGHT_B = [
    { t: 'tenement', w: 15, floors: 6, mat: M.oraB, seed: 61, escape: [2, 4], tank: true, stores: [shop('RESTAURANT'), shop('FLOWERS', { awn: 'G' })] },
    { t: 'prewar', w: 22, floors: 14, mat: M.brownP, seed: 62, stores: [shop('TAILOR')] },
    { t: 'loft', w: 15, floors: 6, mat: M.ironI, seed: 63, arches: 1, stores: [shop('ANTIQUES')] },
    { t: 'tenement', w: 15, floors: 5, mat: M.greyB, seed: 64, tank: true, stores: [shop('MARKET', { awn: 'Y' })] },
    { t: 'prewar', w: 13, floors: 26, mat: M.blueP, seed: 65, stores: [shop('BAKERY')] },
  ];
  // the far blocks are read as a rhythm of heights and colours, so they repeat the types with new seeds
  const farLots = (seed, pattern) => pattern.map((q, i) => ({ t: q[0], w: q[1], floors: q[2], mat: M[q[3]], seed: seed + i, lod: 2, tank: q[0] === 'tenement' && i % 2 === 0, stores: [shop('SHOP')] }));
  const LEFT_C = farLots(100, [['tenement', 15, 6, 'oraB'], ['loft', 16, 7, 'sageI'], ['prewar', 18, 20, 'brownP'], ['tenement', 15, 5, 'redB'], ['loft', 16, 6, 'ironI']]);
  const RIGHT_C = farLots(120, [['loft', 16, 6, 'ochreI'], ['tenement', 15, 6, 'darkB'], ['tenement', 15, 5, 'oraB'], ['prewar', 18, 24, 'limeP'], ['tenement', 16, 6, 'redB']]);
  const LEFT_D = farLots(140, [['prewar', 20, 16, 'blueP'], ['tenement', 15, 6, 'redB'], ['loft', 15, 7, 'creamI'], ['tenement', 15, 5, 'greyB'], ['prewar', 15, 28, 'brownP']]);
  const RIGHT_D = farLots(160, [['tenement', 15, 5, 'darkB'], ['prewar', 20, 22, 'limeP'], ['loft', 15, 6, 'sageI'], ['tenement', 15, 6, 'oraB'], ['loft', 15, 7, 'ironI']]);

  AV.buildScene = function () {
    const K = new AV.Kit(), G = AV.G;
    AV.section(K);
    AV.sewer(K);
    AV.station(K);
    AV.cutEntrance(K);
    AV.ground(K);
    const LOTS = [[LEFT_A, RIGHT_A], [LEFT_B, RIGHT_B], [LEFT_C, RIGHT_C], [LEFT_D, RIGHT_D]];
    G.blocks.forEach(([p], i) => { AV.block(K, -1, p, LOTS[i][0]); AV.block(K, 1, p, LOTS[i][1]); });
    // the walls that return along each side street, seen through the gap in the block
    G.X.forEach(([, q], i) => {
      if (i === G.X.length - 1) return;
      const lod = i === 0 ? 1 : 2;
      AV.frontRun(K, q, -G.HW - 30, [{ t: 'prewar', w: 30, floors: 18 - i * 2, mat: M.blueP, seed: 71 + i, lod, stores: [shop('BANK')] }], 'L');
      AV.frontRun(K, q, G.HW, [{ t: 'tenement', w: 30, floors: 6, mat: M.oraB, seed: 72 + i, lod, stores: [shop('TAILOR')] }], 'R');
    });

    // far side of Canal Street: the elevation the whole street looks at, and fills the page when flattened
    AV.frontRun(K, G.END, -44, [
      { t: 'prewar', w: 16, floors: 15, mat: M.limeP, seed: 81, lod: 1, stores: [shop('RADIO')] },
      { t: 'tenement', w: 12, floors: 6, mat: M.darkB, seed: 82, lod: 1, stores: [shop('BAKERY')] },
      { t: 'loft', w: 26, floors: 6, mat: M.creamI, seed: 83, lod: 0, ground: 5.4, fh: 4.1, arches: 1, escape: [7, 9],
        stores: [
          S('廣東酒樓', 'Canton Restaurant', { style: 'gilt', col: 'lacq', tc: 'gold', tc2: 'sgnW', fc: 'ming', fe: 'abril', layout: 'row' }, { w: 1, inside: 'bbq', awn: 'R' }),
          S('報刊', 'NEWS', { style: 'backlit', col: 'acry', tc: 'acryR', tc2: 'sgnK', fc: 'hei', fe: 'bebas' }, { w: 0.42, doorAt: 1, inside: 'posters' }),
          S('藥材', 'Herbs & Tea', { style: 'painted', col: 'stGreen', tc: 'gold', tc2: 'sgnW', fc: 'boku', fe: 'lobster' }, { w: 0.74, inside: 'herbs', awn: 'G' }),
        ] },
      { t: 'tenement', w: 12, floors: 7, mat: M.redB, seed: 84, lod: 1, stores: [shop('PIANOS')] },
      { t: 'prewar', w: 22, floors: 12, mat: M.brownP, seed: 85, lod: 1, stores: [shop('TRAVEL')] },
    ], 'F');
    // the side streets run on past the picture: more city behind the last row, and ground beneath it
    K.face([[-460, -0.03, 0], [-10.5, -0.03, 0], [-10.5, -0.03, 400], [-460, -0.03, 400]], 'road'); K.face([[10.5, -0.03, 0], [460, -0.03, 0], [460, -0.03, 400], [10.5, -0.03, 400]], 'road');
    K.face([[-460, -1, 398], [-44, -1, 398], [-44, 26, 398], [-460, 26, 398]], 'bluegrey');
    K.face([[44, -1, 398], [460, -1, 398], [460, 22, 398], [44, 22, 398]], 'brickG');
    const roof = 5.4 + 6 * 4.1 + 1;
    AV.waterTank(K, -1, roof, G.END + 4, { r: 2.1, h: 3.8, leg: 3 });
    AV.waterTank(K, 7.5, roof, G.END + 6, { r: 1.9, h: 3.4, leg: 2.6 });
    AV.bulkhead(K, -7, -3.2, roof, 3.2, G.END + 3, G.END + 6);
    // the downtown towers far beyond, thin planes with a hairline window grid
    const tower = (x0, x1, z, y0, y1, col, step) => {
      K.face([[x0, 0, z], [x1, 0, z], [x1, y1, z], [x0, y1, z]], col, {});
      K.pline([[x0, y0, z], [x0, y1, z], [x1, y1, z], [x1, y0, z]], false, AV.W.D, { fade: 0 });
      const n = Math.round((x1 - x0) / 6); for (let i = 1; i < n; i++) { const x = x0 + ((x1 - x0) * i) / n; K.line([x, y0, z], [x, y1, z], AV.W.H, { fade: 0, lc: 'inkG' }); }
      for (let y = y0 + 6; y < y1; y += step) K.line([x0, y, z], [x1, y, z], AV.W.H, { fade: 0, lc: 'inkG' });
    };
    tower(-70, -20, 560, 60, 300, 'bluegrey', 14);
    tower(-52, -36, 560, 300, 400, 'bluegrey', 14); K.line([-44, 400, 560], [-44, 470, 560], AV.W.F, { fade: 0 });
    tower(8, 62, 590, 60, 240, 'brickG', 14);
    tower(20, 48, 590, 240, 330, 'brickG', 14);
    tower(-130, -74, 610, 40, 190, 'lime', 16);
    tower(70, 140, 615, 40, 180, 'cream', 16);

    // Projecting signs, stacked as you look down the block
    const B = (s, z, top, cn, col, tc, o) => AV.bladeSign(K, s, z, Object.assign({ top, cn, col, tc }, o));
    B(-1, 6.2, 8.9, '永興五金', 'stGreen', 'gold', { fc: 'ming', en: 'HARDWARE', border: 'gold', wid: 0.92, lh: 0.74 });
    B(-1, 22.2, 9.1, '金源餅家', 'lacq', 'gold', { fc: 'kai', border: 'gold', en: 'BAKERY', fe: 'bebas' });
    B(-1, 24.3, 8.3, '洗衣', 'acry', 'acryB', { fc: 'hei', lit: true, lh: 0.7 });
    B(-1, 44.2, 9.6, '中美藥房', 'acryG', 'acry', { fc: 'ming', lit: true, en: 'DRUGS' });
    B(-1, 58.6, 8.6, '酒舖', 'sgnK', 'sgnO', { fc: 'dela', border: 'sgnO', lh: 0.7 });
    B(-1, 68.6, 9.8, '修鞋', 'stCream', 'lacq', { fc: 'hand' });
    B(1, 4.4, 8.8, '大利雜貨', 'sgnY', 'lacq', { fc: 'dela', wid: 0.92, lh: 0.72 });
    B(1, 9.6, 10.0, '鴻福燒臘', 'acry', 'acryR', { fc: 'ming', lit: true, en: 'B.B.Q.', fe: 'alfa', tc2: 'sgnK' });
    B(1, 24.0, 8.2, '珠寶', 'stBlack', 'gold', { fc: 'ming', border: 'gold', lh: 0.72 });
    B(1, 35.0, 9.4, '聯合書局', 'sgnB', 'sgnW', { fc: 'kai', border: 'sgnW' });
    B(1, 47.5, 10.2, '環球旅行社', 'acry', 'acryB', { fc: 'hei', lit: true, en: 'TRAVEL' });
    B(1, 58.8, 8.8, '魚', 'acryR', 'acry', { fc: 'dela', lh: 0.9, wid: 0.8 });
    B(1, 61.4, 9.4, '海記', 'lacq', 'gold', { fc: 'boku', border: 'gold' });
    for (const [s, z, t, cn, col, tc] of [[-1, 96, 9, '點心', 'lacq', 'gold'], [1, 94, 8.6, '旅店', 'acry', 'acryR'], [-1, 112, 9.2, '茶餐廳', 'acry', 'acryR'], [1, 110, 9, '酒樓', 'acryR', 'acry'], [1, 126, 8.6, '花店', 'jade', 'sgnW'], [-1, 136, 8.8, '理髮', 'sgnB', 'sgnW'], [-1, 152, 9.4, '銀行', 'stBlack', 'gold'], [1, 150, 9.2, '裁縫', 'sgnY', 'lacq'], [-1, 196, 9, '', 'lacq', 'gold'], [1, 204, 9.4, '', 'acry', 'acryR'], [-1, 222, 9.4, '', 'jade', 'sgnW'], [1, 236, 8.8, '', 'acryR', 'acry'], [-1, 250, 9, '', 'sgnY', 'lacq'], [1, 305, 9, '', 'lacq', 'gold'], [-1, 310, 9, '', 'acry', 'acryR']]) AV.bladeSign(K, s, z, { top: t, cn, col, tc, h: cn ? undefined : 2.6, lit: col.startsWith('acry') });

    AV.furniture(K);

    // The shops come out on to the pavement
    AV.produceStand(K, 1, 2.1, 7.5, [['orange', 0.052], ['apple', 0.05], ['cabb', 0.07], ['lemon', 0.046]]);
    AV.boxes(K, 1, 7.7, 3);
    AV.fishStall(K, 1, 58, 63);
    AV.boxes(K, 1, 63.6, 2);
    AV.produceStand(K, -1, 100, 106, [['leaf', 0.07], ['orange', 0.052]]);
    AV.phoneKiosk(K, -1, 21.5);
    // near edge of the picture: no more cars, the street's own furniture
    AV.newsstand(K, -1, 4.4, 7.05);
    AV.bikeDock(K, -1, 4.7, 8.4);
    AV.workZone(K, 0.85, 3.2, 1.2, 3.9);
    AV.aBoard(K, -1, 15.6, '蛋撻', 'EGG TART');
    AV.aBoard(K, 1, 16.2, '燒鴨', 'ROAST DUCK', 'lacq');
    AV.boxes(K, -1, 54, 2);
    // bagged rubbish out at the kerb, the most New York thing on any street
    [[-1, 9.6, 5], [-1, 29.4, 7], [1, 8.4, 4], [-1, 47.5, 5], [1, 64.9, 6], [-1, 61.5, 4], [-1, 108, 5], [1, 118, 6], [1, 140, 5], [-1, 146, 5]].forEach(q => AV.trashBags(K, q[0], q[1], q[2]));


    // Vehicles: parked along both curbs on the 7 m module, traffic in the two lanes, all heading away from us
    const PL = -4.72, PR = 4.72, T = 'sedan', U = 'suv';
    const park = [[PL, 9.2, 'navy', U], [PR, 5.2, 'silv', T], [PR, 16, 'mar', T], [PR, 22.6, 'wht', U], [PL, 14.6, 'silv', T], [PL, 20, 'coal', T], [PL, 25.4, 'grnC', U], [PL, 43, 'wht', T], [PR, 44, 'navy', T], [PL, 50, 'mar', T], [PR, 51, 'coal', U], [PR, 58, 'silv', T], [PL, 57, 'silv', U], [PL, 98, 'coal', T], [PR, 100, 'wht', T], [PL, 105, 'navy', U], [PR, 107, 'silv', T], [PL, 119, 'grnC', T], [PR, 121, 'mar', T], [PL, 133, 'silv', T], [PR, 135, 'navy', U], [PL, 148, 'wht', T], [PR, 150, 'coal', T],
      [PL, 196, 'silv', T], [PR, 198, 'navy', T], [PL, 212, 'wht', U], [PR, 214, 'mar', T], [PL, 232, 'coal', T], [PR, 236, 'silv', U], [PL, 250, 'navy', T], [PR, 252, 'wht', T], [PL, 296, 'mar', T], [PR, 300, 'silv', T], [PL, 318, 'silv', U], [PR, 322, 'coal', T], [PL, 340, 'wht', T], [PR, 344, 'navy', T]];
    for (const [x, z, c, k] of park) AV.car(K, x, z, { col: c, kind: k, lod: z > 40 ? 1 : 0 });
    // traffic
    AV.car(K, -1.8, 5.2, { col: 'taxi', taxi: true });
    AV.car(K, 1.8, 13, { col: 'taxi', taxi: true });
    AV.boxTruck(K, -1.8, 13.5, { text: 'CITY FRESH PRODUCE', cn: '鮮果批發' });
    AV.car(K, 1.8, 26, { col: 'coal', kind: U });
    AV.car(K, -1.8, 31, { col: 'taxi', taxi: true });
    AV.bus(K, 1.8, 62);
    for (const [x, z, c, k, t] of [[-1.8, 40, 'silv'], [-1.8, 58, 'taxi', 0, 1], [1.8, 40, 'taxi', 0, 1], [-1.8, 100, 'taxi', 0, 1], [1.8, 112, 'wht'], [-1.8, 126, 'navy', U], [1.8, 140, 'taxi', 0, 1], [-1.8, 155, 'taxi', 0, 1], [1.8, 205, 'coal'], [-1.8, 220, 'taxi', 0, 1], [1.8, 244, 'taxi', 0, 1], [-1.8, 258, 'wht', U], [1.8, 300, 'taxi', 0, 1], [-1.8, 322, 'silv'], [1.8, 350, 'taxi', 0, 1]]) AV.car(K, x, z, { col: c, kind: k || T, taxi: !!t, lod: 1 });
    // Everything standing on the ground gets a contact shadow, so nothing floats
    const FOOT = /^(hydrant|mail|bin|news|bike|kiosk|stand|fish|boxes|aboard|bags|psign|lamp|dock|cones|barrel|barricade)/;
    for (const p of K.parts.slice()) {
      if (!FOOT.test(p.name) || p.a[1] > 0.4 || p.a[2] > 170) continue;
      const onWalk = Math.abs((p.a[0] + p.b[0]) / 2) > AV.G.RW, y = onWalk ? AV.G.CURB + 0.0045 : 0.0375;
      // only things that truly sit flat on the ground darken it, and only right at their foot
      if (/^(bin|newsstand|stand|fish|boxes)/.test(p.name)) { const e = 0.035; K.face([[p.a[0] - e, y, p.a[2] - e], [p.b[0] + e, y, p.a[2] - e], [p.b[0] + e, y, p.b[2] + e], [p.a[0] - e, y, p.b[2] + e]], onWalk ? 'walkD' : 'road', { shade: 0.76 }); }
      if (!/^lamp/.test(p.name)) K.castBox(p.a, p.b);
    }
    return K;
  };
})();
