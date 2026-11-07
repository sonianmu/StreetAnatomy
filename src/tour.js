/* Deterministic social demo timeline, shared by playback and validation. Moves are quick and land on a hold. */
(function () {
  const AV = (window.AV = window.AV || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // time, depth, VP x/y, drawing, guides, zoom, focus x/y, three-layer framing, upper region.
  const frames = [
    [0.00, 0, 800, 520, 1],
    [0.45, 0, 800, 520, 1],
    [2.10, 1.15, 800, 520, 0],
    [2.30, 1.15, 800, 520, 0],
    [3.70, 1.35, 1576, -380, 0],
    [5.35, 1.4, 24, 640, 0],
    [6.52, 1.1, 560, 1016, 0],
    [7.98, 1.4, 1576, 1900, 0],
    [9.56, 1.3, 24, 1420, 0],
    [10.68, 1.1, 800, 1300, 0],
    [12.00, 1.45, 24, 1930, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [13.24, 0.9, 560, 1320, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [14.48, 1.45, 1040, 1990, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [15.73, 0.95, 1576, 1360, 0, 0, 1.5, 0.34, 0.68, 1, 0],
    [17.35, 1.45, 1576, -380, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [18.72, 0.9, 1120, 640, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [20.09, 1.4, 600, -380, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [21.47, 0.95, 24, 620, 0, 0, 1.5, 0.66, 0.35, 1, 1],
    [22.60, 1.1, 800, 520, 0],
    [23.10, 1.15, 800, 520, 1, 0],
    [23.40, 1.15, 800, 520, 1, 0.72],
    [25.00, 1.35, 24, -380, 1, 0.72],
    [26.74, 1.35, 1576, -380, 1, 0.72],
    [28.59, 1.45, 1576, 1930, 1, 0.72],
    [30.34, 1.45, 24, 1930, 1, 0.72],
    [31.81, 1.1, 800, 520, 1, 0],
    [32.91, 0, 800, 520, 1, 0],
    [33.21, 0, 800, 520, 1, 0],
  ];
  const defaults = [0, 0, 800, 520, 1, 0, 1, 0.5, 0.5, 0, 0];
  const LOOP = frames[frames.length - 1][0];
  const value = (i, j) => frames[i][j] ?? defaults[j];
  // Every switch is a decisive move that lands and holds: the camera spends little time in transit and the
  // viewer gets to look at the result. A move takes 0.4 s + 1 s per 2400 px of viewpoint travel (0.5–1.15 s); the
  // rest of the segment is a hold. Depth-only segments (the opening reveal and the closing fold) use the whole segment.
  const MOVE = frames.slice(0, -1).map((f, i) => {
    const n = frames[i+1], h = n[0]-f[0], dist = Math.hypot(value(i+1,2)-value(i,2), value(i+1,3)-value(i,3));
    const framing = Math.abs(value(i+1,6)-value(i,6)) + Math.abs(value(i+1,9)-value(i,9)) + Math.abs(value(i+1,10)-value(i,10));
    return dist < 1 && framing < 1e-9 ? h : Math.min(h, clamp(0.4 + dist/2400, 0.5, 1.15));
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
    const e = ease((lt-frames[i][0])/MOVE[i]);
    const field = j => value(i,j) + (value(i+1,j)-value(i,j))*e;
    return {d:field(1),vx:field(2),vy:field(3),plate:field(4),guides:field(5),zoom:field(6),focusX:field(7),focusY:field(8),layerBlend:field(9),layerUpper:field(10)};
  }
  AV.tour = {sample,duration:LOOP};
})();
