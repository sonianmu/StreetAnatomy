/* Deterministic social demo timeline, shared by playback and validation. Moves are quick, hold first and land on the beat. */
(function () {
  const AV = (window.AV = window.AV || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // time, depth, VP x/y, drawing, guides, zoom, focus x/y, three-layer framing, upper region.
  // Times are where the camera lands, on the beat of the soundtrack (119.9 BPM, one bar = 2.0019 s; see BEAT).
  const frames = [
    [0.000, 0, 800, 520, 1],
    [2.002, 0, 800, 520, 1],
    [4.004, 1.15, 800, 520, 0],
    [6.006, 1.35, 1576, -380, 0],
    [8.008, 1.4, 24, 640, 0],
    [10.009, 1.1, 560, 1016, 0],
    [12.011, 1.4, 1576, 1900, 0],
    [14.013, 1.3, 24, 1420, 0],
    [16.015, 1.45, 24, 1930, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [17.016, 0.9, 560, 1320, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [18.017, 1.45, 1040, 1990, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [19.018, 0.95, 1576, 1360, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [21.020, 1.45, 1576, -380, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [22.021, 0.9, 1120, 640, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [23.022, 1.4, 600, -380, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [24.023, 0.95, 24, 620, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [25.024, 1.1, 800, 520, 0],
    [26.025, 1.15, 800, 520, 1, 0],
    [26.525, 1.15, 800, 520, 1, 0.72],
    [28.027, 1.35, 24, -380, 1, 0.72],
    [30.029, 1.35, 1576, -380, 1, 0.72],
    [32.030, 1.45, 1576, 1930, 1, 0.72],
    [34.032, 1.45, 24, 1930, 1, 0.72],
    [36.034, 1.1, 800, 520, 1, 0],
    [38.036, 0, 800, 520, 1, 0],
    [40.038, 0, 800, 520, 1, 0],
  ];
  const defaults = [0, 0, 800, 520, 1, 0, 1, 0.5, 0.5, 0, 0];
  const LOOP = frames[frames.length - 1][0];
  const value = (i, j) => frames[i][j] ?? defaults[j];
  // Every switch is a decisive move that lands and holds: the camera spends little time in transit and the
  // viewer gets to look at the result. A move takes 0.4 s + 1 s per 2400 px of viewpoint travel (0.5–1.15 s); the
  // rest of the segment is a hold. Depth-only segments (the opening reveal and the closing fold) use the whole segment.
  // Each segment holds first and moves last, so every keyframe time is the moment the camera lands. A move lasts one
  // beat, or two for long distances, and always leaves at least a beat of hold; depth-only segments use the whole segment.
  const BEAT = 2.0019/4;
  const MOVE = frames.slice(0, -1).map((f, i) => {
    const n = frames[i+1], h = n[0]-f[0], dist = Math.hypot(value(i+1,2)-value(i,2), value(i+1,3)-value(i,3));
    const framing = Math.abs(value(i+1,6)-value(i,6)) + Math.abs(value(i+1,9)-value(i,9)) + Math.abs(value(i+1,10)-value(i,10));
    if (dist < 1 && framing < 1e-9) return h;
    const beats = framing > 1e-9 || 0.4 + dist/2400 >= 0.75 ? 2 : 1;   // zooming into or between regions always takes two beats
    return Math.max(BEAT, Math.min(beats*BEAT, h - BEAT));
  });
  // cubic-bezier(0.45, 0, 0.15, 1): a short wind-up, a fast middle and a long, soft landing
  const X1 = 0.45, X2 = 0.15, Y1 = 0, Y2 = 1;
  const bz = (t, a, b) => 3*a*(1-t)*(1-t)*t + 3*b*(1-t)*t*t + t*t*t;
  function ease(x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let k = 0; k < 8; k++) { const dx = bz(t, X1, X2) - x, d = 3*X1*(1-t)*(1-t) + 6*(X2-X1)*(1-t)*t + 3*(1-X2)*t*t; if (Math.abs(d) < 1e-6) break; t = clamp(t - dx/d, 0, 1); }
    let lo = 0, hi = 1; for (let k = 0; k < 20 && Math.abs(bz(t, X1, X2) - x) > 1e-7; k++) { t = (lo+hi)/2; if (bz(t, X1, X2) < x) lo = t; else hi = t; }
    return bz(t, Y1, Y2);
  }
  function sample(t) {
    const lt = t >= 0 ? t % LOOP : ((t % LOOP) + LOOP) % LOOP;
    let i = 0;
    while (i < frames.length-2 && lt >= frames[i+1][0]) i++;
    const e = ease((lt-(frames[i+1][0]-MOVE[i]))/MOVE[i]);
    const field = j => value(i,j) + (value(i+1,j)-value(i,j))*e;
    return {d:field(1),vx:field(2),vy:field(3),plate:field(4),guides:field(5),zoom:field(6),focusX:field(7),focusY:field(8),layerBlend:field(9),layerUpper:field(10)};
  }
  AV.tour = {sample,duration:LOOP};
})();
