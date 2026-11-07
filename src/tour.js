/* Deterministic social demo timeline, shared by playback and validation. Moves start on the beat with a hard attack and glide to a stop. */
(function () {
  const AV = (window.AV = window.AV || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // time, depth, VP x/y, drawing, guides, zoom, focus x/y, three-layer framing, upper region.
  // Times are beats of the soundtrack (119.9 BPM, one bar = 2.0019 s): a move starts on its keyframe's beat; a blend arrives on it.
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
  // Two kinds of segment. A "move" changes the viewpoint or the region framing: it starts ON its keyframe's beat with a hard
  // attack and glides to a stop, so the hit you see is the hit you hear. A "blend" changes only depth, colour or guides
  // (the unfold, the fold, the change to line drawing): it eases in and out across its segment and arrives on the beat.
  const isMove = i => { // the segment arriving at keyframe i
    const dist = Math.hypot(value(i,2)-value(i-1,2), value(i,3)-value(i-1,3));
    const framing = Math.abs(value(i,6)-value(i-1,6)) + Math.abs(value(i,9)-value(i-1,9)) + Math.abs(value(i,10)-value(i-1,10));
    return dist >= 1 || framing > 1e-9;
  };
  // move length: one beat, two for long distances or a region zoom; always ends a beat before the next hit
  const MOVE = frames.map((f, i) => {
    if (!i || !isMove(i)) return 0;
    const dist = Math.hypot(value(i,2)-value(i-1,2), value(i,3)-value(i-1,3)), framing = Math.abs(value(i,6)-value(i-1,6)) + Math.abs(value(i,9)-value(i-1,9));
    const beats = framing > 1e-9 || dist > 840 ? 2 : 1, room = i < frames.length-1 ? frames[i+1][0]-f[0] - BEAT : beats*BEAT;
    return Math.max(BEAT, Math.min(beats*BEAT, room));
  });
  const bezier = (X1, Y1, X2, Y2) => {
    const bz = (t, a, b) => 3*a*(1-t)*(1-t)*t + 3*b*(1-t)*t*t + t*t*t;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let k = 0; k < 30; k++) { t = (lo+hi)/2; if (bz(t, X1, X2) < x) lo = t; else hi = t; }
      return bz(t, Y1, Y2);
    };
  };
  const hit = bezier(0.12, 0.7, 0.25, 1);     // moves: most of the travel in the first frames after the beat, then a long glide
  const blend = bezier(0.45, 0, 0.15, 1);     // depth, colour and guides: a soft ease into the beat
  const pose = i => [1,2,3,4,5,6,7,8,9,10].map(j => value(i,j));
  const mix = (a, b, e) => a.map((v, k) => v + (b[k]-v)*e);
  function sample(t) {
    const lt = t >= 0 ? t % LOOP : ((t % LOOP) + LOOP) % LOOP;
    let i = 0;
    while (i < frames.length-1 && lt >= frames[i+1][0]) i++;
    // in [t_i, t_i+1): first finish the move that hit at t_i, then blend toward i+1 if that segment is a blend
    let p = pose(i), after = frames[i][0];
    if (i > 0 && MOVE[i] && lt < frames[i][0] + MOVE[i]) return out(mix(pose(i-1), pose(i), hit((lt-frames[i][0])/MOVE[i])));
    if (i > 0 && MOVE[i]) after += MOVE[i];
    if (i < frames.length-1 && !isMove(i+1)) p = mix(p, pose(i+1), blend((lt-after)/(frames[i+1][0]-after)));
    return out(p);
  }
  const out = q => ({d:q[0],vx:q[1],vy:q[2],plate:q[3],guides:q[4],zoom:q[5],focusX:q[6],focusY:q[7],layerBlend:q[8],layerUpper:q[9]});
  AV.tour = {sample,duration:LOOP};
})();
