/* Page controller: one state (depth, VP, plate, zoom) drives the engine and the guide overlay. */
(function () {
  const AV = (window.AV = window.AV || {});
  const $ = id => document.getElementById(id);
  const stage = $('stage'), glc = $('gl'), gc = $('guides');
  let eng, kit;
  try { kit = AV.buildScene(); eng = new AV.Engine(glc); eng.upload(kit); }
  catch (e) { const f = $('fail'); f.hidden = false; f.textContent = '无法启动：' + e.message + '（需要支持 WebGL2 的浏览器）'; console.error(e); return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOME = [800, 520];
  const S = { d: 0, vx: HOME[0], vy: HOME[1], td: 0, tvx: HOME[0], tvy: HOME[1], mix: 1, tmix: 1, playing: !reduce, guides: false, guideAlpha: 0, layerBlend: 0, layerUpper: 0, zoom: 1, tzoom: 1, zc: [800, 450], tzc: [800, 450], t0: performance.now(), drag: false };
  // the eye may go anywhere the street and the station go: five floors up, or down on to the platform
  const LIM = { x: [24, 1576], y: [-380, 2000] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const { sample, duration: LOOP } = AV.tour;

  const depth = $('depth'), dout = $('depth-out'), play = $('play'), guideBtn = $('guide'), plateBtn = $('plate'), tag = $('tag-title');
  function applyTour(q) {
    S.d = S.td = q.d; S.vx = S.tvx = q.vx; S.vy = S.tvy = q.vy;
    S.mix = S.tmix = q.plate; S.guideAlpha = q.guides; S.guides = q.guides > 0.001;
    S.zoom = S.tzoom = q.zoom; S.layerBlend = q.layerBlend; S.layerUpper = q.layerUpper;
    // Focus is relative to the unzoomed viewport, so a portrait recording and a desktop view target the same corner.
    const focus = eng.baseF ? [(glc.width*q.focusX - eng.baseOff[0])/eng.baseF, (glc.height*q.focusY - eng.baseOff[1])/eng.baseF] : [800, 450];
    S.zc = focus; S.tzc = focus.slice();
    guideBtn.setAttribute('aria-pressed', S.guides);
  }
  function setPlaying(on) {
    S.playing = on; play.setAttribute('aria-pressed', on); play.textContent = on ? '暂停' : '演示';
    if (on) { S.t0 = performance.now(); applyTour(sample(0)); }
    else { S.td = S.d; S.tvx = S.vx; S.tvy = S.vy; S.tmix = S.mix; S.tzoom = S.zoom; S.tzc = S.zc.slice(); }
  }
  function manual() { if (S.playing) setPlaying(false); }
  function syncPlate() { plateBtn.setAttribute('aria-pressed', S.tmix > 0.5); plateBtn.textContent = S.tmix > 0.5 ? '色稿' : '线稿'; }
  setPlaying(S.playing); syncPlate();
  depth.value = S.d * 100;

  depth.addEventListener('input', () => { manual(); S.td = depth.value / 100; });
  play.addEventListener('click', () => { if (S.playing) manual(); else setPlaying(true); });
  guideBtn.addEventListener('click', () => { manual(); S.guides = !S.guides; S.guideAlpha = S.guides ? 1 : 0; guideBtn.setAttribute('aria-pressed', S.guides); });
  plateBtn.addEventListener('click', () => { manual(); S.tmix = S.tmix > 0.5 ? 0 : 1; syncPlate(); });
  const VIEWS = { flat: [0, 800, 520], deep: [1, 800, 520], left: [1, 110, 500], right: [1, 1490, 500], high: [1, 800, -260], low: [1, 800, 680], platform: [1, 800, 1742], mezz: [1, 800, 1388, 2.6, [800, 1147]], sewer: [1, 552, 1040] };
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { manual(); S.layerBlend = 0; S.layerUpper = 0; const v = VIEWS[b.dataset.view]; S.td = v[0]; S.tvx = v[1]; S.tvy = v[2]; S.tzoom = v[3] || 1; S.tzc = v[4] ? v[4].slice() : [800, 450]; }));

  function setClean(on) { document.body.classList.toggle('clean', on); $('clean').setAttribute('aria-pressed', on); }
  function toggleClean() { setClean(!document.body.classList.contains('clean')); }
  $('clean').addEventListener('click', toggleClean);
  // A double click also restores the controls when recording without a keyboard.
  const toStage = ev => { const r = glc.getBoundingClientRect(), dpr = eng.dpr || 1; const px = (ev.clientX - r.left) * dpr, py = (ev.clientY - r.top) * dpr; return [(px - eng.off[0]) / eng.F, (py - eng.off[1]) / eng.F]; };
  stage.addEventListener('pointerdown', ev => { if (document.body.classList.contains('clean') || ev.target.closest('.bar')) return; stage.setPointerCapture(ev.pointerId); S.drag = true; stage.classList.add('drag'); manual(); S.dragStart = { p: toStage(ev), vx: S.tvx, vy: S.tvy }; });
  stage.addEventListener('pointermove', ev => { if (!S.drag) return; const p = toStage(ev), d0 = S.dragStart; S.tvx = clamp(d0.vx + (p[0] - d0.p[0]), LIM.x[0], LIM.x[1]); S.tvy = clamp(d0.vy + (p[1] - d0.p[1]), LIM.y[0], LIM.y[1]); });
  const end = () => { S.drag = false; stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', ev => { ev.preventDefault(); const p = toStage(ev); S.tzoom = clamp(S.tzoom * Math.exp(-ev.deltaY * 0.0015), 1, 6); S.tzc = S.tzoom <= 1.01 ? [800, 450] : p; }, { passive: false });
  stage.addEventListener('dblclick', () => { setClean(false); S.tzoom = 1; S.tzc = [800, 450]; });
  addEventListener('keydown', ev => {
    if (ev.target.tagName === 'INPUT' && ev.key.startsWith('Arrow')) return;
    const k = ev.key; let used = true;
    if (k === ' ' && ev.target.tagName !== 'BUTTON') { if (S.playing) manual(); else setPlaying(true); }
    else if (k === 'ArrowLeft') { manual(); S.tvx = clamp(S.tvx - 30, ...LIM.x); } else if (k === 'ArrowRight') { manual(); S.tvx = clamp(S.tvx + 30, ...LIM.x); }
    else if (k === 'ArrowUp') { manual(); S.tvy = clamp(S.tvy - 24, ...LIM.y); } else if (k === 'ArrowDown') { manual(); S.tvy = clamp(S.tvy + 24, ...LIM.y); }
    else if (k === '+' || k === '=') { manual(); S.td = clamp(S.td + 0.05, 0, 1.6); } else if (k === '-') { manual(); S.td = clamp(S.td - 0.05, 0, 1.6); }
    else if (k === 'h' || k === 'H') toggleClean();
    else if (k === 'Escape') setClean(false);
    else if (k === 'g' || k === 'G') guideBtn.click(); else if (k === 'l' || k === 'L') plateBtn.click();
    else if (k === '0') { manual(); S.td = 1; S.tvx = HOME[0]; S.tvy = HOME[1]; S.tzoom = 1; S.tzc = [800, 450]; }
    else used = false;
    if (used && k !== ' ') ev.preventDefault();
  });

  // overlay: rails generated from the same projection, to prove every depth edge meets at one point
  const gx = gc.getContext('2d');
  function drawGuides() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = gc.clientWidth, h = gc.clientHeight;
    if (gc.width !== Math.round(w * dpr) || gc.height !== Math.round(h * dpr)) { gc.width = Math.round(w * dpr); gc.height = Math.round(h * dpr); }
    gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, gc.width, gc.height);
    if (!S.guides) return;
    gx.globalAlpha = S.guideAlpha;
    const F = eng.F, ox = eng.off[0], oy = eng.off[1], G = AV.G;
    const sp = p => { const q = eng.project(p); return [ox + q[0] * F, oy + q[1] * F]; };
    gx.lineWidth = 1.2 * dpr; gx.strokeStyle = '#e8432d'; gx.fillStyle = '#e8432d'; gx.font = `${11 * dpr}px ui-monospace,Menlo,monospace`;
    const ST = AV.ST, SWm = AV.SW.main, rails = [[SWm.c[0] - SWm.r, SWm.c[1]], [SWm.c[0] + SWm.r, SWm.c[1]], [SWm.c[0], SWm.c[1] + SWm.r], [-ST.W, ST.PF], [ST.W, ST.PF], [-ST.W, ST.CE], [ST.W, ST.CE], [-ST.EDGE, ST.PF], [ST.EDGE, ST.PF], [-G.RW, 0], [G.RW, 0], [-G.HW, 0.15], [G.HW, 0.15], [-G.HW, 4.4], [G.HW, 4.4], [-G.HW, 7.55], [G.HW, 7.55], [-G.HW, 10.7], [G.HW, 10.7], [-G.HW, 20], [G.HW, 20]];
    gx.setLineDash([7 * dpr, 6 * dpr]);
    for (const [x, y] of rails) { const a = sp([x, y, 0]), b = sp([x, y, G.X[0][0]]); gx.beginPath(); gx.moveTo(a[0], a[1]); gx.lineTo(b[0], b[1]); gx.stroke(); }
    gx.setLineDash([]);
    for (const z of [0, 5, 10, 20, 40, 72, 90, 170, 268, 396]) { const p = sp([0, 0, z]); gx.beginPath(); gx.moveTo(p[0] - 12 * dpr, p[1]); gx.lineTo(p[0] + 12 * dpr, p[1]); gx.stroke(); gx.fillText('z ' + z, p[0] + 16 * dpr, p[1] + 4 * dpr); }
    const v = [ox + S.vx * F, oy + S.vy * F];
    gx.lineWidth = 1.6 * dpr; gx.beginPath(); gx.arc(v[0], v[1], 8 * dpr, 0, 6.283); gx.moveTo(v[0] - 16 * dpr, v[1]); gx.lineTo(v[0] + 16 * dpr, v[1]); gx.moveTo(v[0], v[1] - 16 * dpr); gx.lineTo(v[0], v[1] + 16 * dpr); gx.stroke();
    gx.fillText('VP', v[0] + 12 * dpr, v[1] - 10 * dpr);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.playing) { applyTour(sample((now - S.t0) / 1000)); depth.value = S.d * 100; }
    else { const k = 1 - Math.exp(-dt * 8); S.d += (S.td - S.d) * k; S.vx += (S.tvx - S.vx) * k; S.vy += (S.tvy - S.vy) * k; if (document.activeElement !== depth) depth.value = S.d * 100; }
    if (!S.playing) S.mix += (S.tmix - S.mix) * (1 - Math.exp(-dt * 10));
    { const k = 1 - Math.exp(-dt * 8); S.zoom += (S.tzoom - S.zoom) * k; S.zc[0] += (S.tzc[0] - S.zc[0]) * k; S.zc[1] += (S.tzc[1] - S.zc[1]) * k; }
    const v = eng.view; v.layerBlend = S.layerBlend; v.layerUpper = S.layerUpper; v.d = S.d; v.vx = S.vx; v.vy = S.vy; v.zoom = S.zoom; v.zc = S.zc; v.mix = S.mix;
    eng.render(); drawGuides();
    syncPlate();
    dout.textContent = S.d.toFixed(2);
    tag.textContent = S.d < 0.04 ? '正视图' : (S.d < 0.97 || S.d > 1.03) ? '纵深 ' + Math.round(S.d * 100) + '%' : '透视图';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const ld = $('loading'); if (ld) requestAnimationFrame(() => requestAnimationFrame(() => ld.remove()));
  window.NYC = { S, eng, kit, setPlaying, sample, loopDuration: LOOP, setClean };
})();
