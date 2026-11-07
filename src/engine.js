/* Single-VP depth engine.
 * World: x right, y up, z into the scene, metres. One projection for everything:
 *   w = 1 + k*d*z        P = VP + (front(x,y) - VP) / w
 * d = 0 is a flat elevation; the z = 0 plane never moves with VP or depth.
 * Faces carry a palette role; two plates (colour / line) crossfade. Distance only tints toward the sky colour.
 * Lines are capsules with analytic coverage, so a hairline below one pixel simply renders fainter instead of
 * thicker, and every line has its own scale threshold below which it fades away. That is what keeps a dense
 * drawing clean: detail disappears before it can turn into moire. */
(function () {
  const AV = (window.AV = window.AV || {});
  // the sun, low over the left-hand roofs and a little behind the viewer
  const SL = Math.hypot(0.62, 0.72, 0.3); AV.SUN = [-0.62 / SL, 0.72 / SL, -0.3 / SL];
  AV.cfg = { stageW: 1600, stageH: 900, S: 80, ox: 800, oy: 700, k: 0.1, zMin: -1, zMax: 620 };

  const COMMON = `
uniform vec2 uOrigin, uVP, uCanvas, uOff;
uniform float uS, uK, uF, uT0, uTs, uMix;
uniform sampler2D uPal; uniform int uSky;
int roleI(float a){ return int(a+0.5) & 2047; }
vec3 pal(int r){ return mix(texelFetch(uPal, ivec2(r,0), 0).rgb, texelFetch(uPal, ivec2(r,1), 0).rgb, uMix); }
float hazeOf(float w){ return 0.66*smoothstep(1.6, 34.0, w); }`;

  const VS_FACE = `#version 300 es
precision highp float; precision highp sampler2D; precision highp int;
layout(location=0) in vec3 aPos;
layout(location=1) in float aRole;
${COMMON}
out vec3 vCol; out vec3 vP; flat out int vM; out float vHz; out vec3 vN; flat out int vR;
invariant gl_Position;
void main(){
  float w = 1.0 + uK*aPos.z;
  vec2 xy = vec2(uOrigin.x + aPos.x*uS, uOrigin.y - aPos.y*uS);
  vec2 px = uOff + (uVP + (xy - uVP)/w)*uF;
  vec2 ndc = vec2(px.x/uCanvas.x*2.0-1.0, 1.0-px.y/uCanvas.y*2.0);
  float nz = (aPos.z/w - uT0)*uTs - 1.0;
  gl_Position = vec4(ndc*w, nz*w, w);
  int ri = roleI(aRole), en = int(aRole+0.5) >> 11; vR = ri;
  vec3 pn = vec3(0.0);
  if(en > 0){ en -= 1; vec2 q = vec2(float(en>>6), float(en&63))/31.5 - 1.0; float z = 1.0 - abs(q.x) - abs(q.y); if(z < 0.0){ q = vec2((1.0-abs(q.y))*(q.x>=0.0?1.0:-1.0), (1.0-abs(q.x))*(q.y>=0.0?1.0:-1.0)); } pn = vec3(q, z); }
  vN = pn;
  float hz0 = hazeOf(w);
  bool ug = aPos.y < -0.5;
  vCol = ug ? mix(pal(ri), mix(vec3(0.05,0.06,0.06), pal(uSky), uMix), min(1.0, hz0*1.5)) : mix(pal(ri), pal(uSky), hz0);
  vHz = hazeOf(w); vP = aPos; vM = int(texelFetch(uPal, ivec2(ri,0), 0).a*255.0+0.5);
}`;

  // What a shiny surface sees. The street is simple enough to answer exactly: a ray from P along R meets the opposite
  // wall, the sky above that wall's real roofline, or the road. So reflections slide across glass and paint as the eye moves.
  const ENV = `
uniform sampler2D uRoof;
vec3 envUnder(vec3 P, vec3 R){
  // the station: tubes in lines overhead, a dull ceiling, tile to the sides, floor below
  if(R.y > 0.03){ float t = (-6.9 - P.y)/R.y; vec2 h = vec2(P.x + R.x*t, P.z + R.z*t); float ax = abs(h.x);
    float tube = (1.0-smoothstep(0.1, 0.2, abs(ax-5.9)))+(1.0-smoothstep(0.1, 0.2, abs(ax-8.5))); float bays = smoothstep(0.0, 0.1, fract((h.y-2.3)/4.6)-0.11)*(1.0-smoothstep(0.85, 0.95, fract((h.y-2.3)/4.6)));
    if(ax > 9.6) return vec3(0.78, 0.77, 0.7);
    return mix(vec3(0.2, 0.21, 0.2), vec3(1.15, 1.13, 1.02), clamp(tube,0.0,1.0)*bays); }
  if(R.y < -0.03) return vec3(0.3, 0.29, 0.27);
  return vec3(0.46, 0.46, 0.42);
}
vec3 envAt(vec3 P, vec3 R, float detail){
  if(P.y < -0.1) return envUnder(P, R);
  vec3 zen = vec3(0.47, 0.64, 0.82), hor = vec3(0.86, 0.89, 0.88);
  vec3 sky = mix(hor, zen, pow(clamp(R.y, 0.0, 1.0), 0.6));
  float sx = R.x >= 0.0 ? 1.0 : -1.0, rx = max(abs(R.x), 1e-3);
  float t = max(0.0, (10.0 - sx*P.x))/rx;
  float hy = P.y + R.y*t, hz = P.z + R.z*t;
  if(R.y < 0.0){ float tg = (P.y - 0.02)/max(-R.y, 1e-3);
    if(tg < t){ vec2 g = vec2(P.x + R.x*tg, P.z + R.z*tg); float walk = smoothstep(5.95, 6.05, abs(g.x)); return mix(vec3(0.27, 0.27, 0.29), vec3(0.5, 0.48, 0.45), walk); } }
  float roof = hz < 0.0 ? 21.0 : (sx > 0.0 ? texture(uRoof, vec2(hz/640.0, 0.5)).g : texture(uRoof, vec2(hz/640.0, 0.5)).r)*102.0;
  if(hz > 396.0) roof = 40.0;
  if(detail < 0.5) return mix(mix(sx > 0.0 ? vec3(0.5, 0.42, 0.37) : vec3(0.3, 0.29, 0.29), vec3(0.2, 0.22, 0.24), 0.3), sky, smoothstep(-9.0, 9.0, hy - roof));   // paint is a blurred mirror
  if(hy > roof) return sky;
  // the facing wall: sunlit if it is the right-hand side and above the shadow line, otherwise in shade. Windows in a grid.
  vec3 wall = sx > 0.0 ? mix(vec3(0.44, 0.34, 0.29), vec3(0.74, 0.55, 0.43), smoothstep(7.0, 13.0, hy)) : vec3(0.33, 0.30, 0.29);
  float bay = fract(hz/2.45), fl = fract(hy/3.15), win = smoothstep(0.26, 0.3, bay)*(1.0-smoothstep(0.68, 0.72, bay))*smoothstep(0.24, 0.28, fl)*(1.0-smoothstep(0.78, 0.82, fl));
  vec3 c = mix(wall, vec3(0.16, 0.19, 0.22), win*(1.0-smoothstep(1.2, 5.0, fwidth(hz)+fwidth(hy))));
  if(hy < 4.2){ float id = fract(sin(floor(hz/7.6)*91.7)*437.5); vec3 sn = id < 0.33 ? vec3(0.6, 0.2, 0.15) : id < 0.66 ? vec3(0.75, 0.68, 0.45) : vec3(0.18, 0.34, 0.3); c = hy > 3.3 ? sn : vec3(0.2, 0.22, 0.23); }
  return c;
}`;
  // Surfaces. No bitmaps: each material is a few lines of noise in world metres, so it holds at any zoom and stays
  // fixed to the wall as the vanishing point moves. Every detail fades out by pixel footprint before it can shimmer.
  const FS_FACE = `#version 300 es
precision highp float; precision highp int;
in vec3 vCol; in vec3 vP; flat in int vM; in float vHz; in vec3 vN; flat in int vR; uniform float uMix; uniform vec3 uEyeF, uSun; uniform sampler2D uMask, uGnd; out vec4 o;
${ENV}
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ return 0.55*vn(p) + 0.3*vn(p*2.13+7.1) + 0.15*vn(p*4.37+3.3); }
// height of a coursed brick wall: mortar is raked back, each brick stands a little proud or shy of its neighbours
float brickH(vec2 st){ float H = 0.075, L = 0.205, row = floor(st.y/H), u = st.x/L + 0.5*mod(row, 2.0), col = floor(u); float my = abs(fract(st.y/H)-0.5)*2.0, mx = abs(fract(u)-0.5)*2.0; float m = 1.0-max(smoothstep(0.74, 0.92, my), smoothstep(0.9, 0.98, mx)); return m*(0.8 + 0.35*h21(vec2(row, col))); }
float vis(float size, float fp){ return 1.0 - smoothstep(size*0.28, size*1.1, fp); }
float ptL(vec3 P, vec3 N, vec3 lp, float I){ vec3 L = lp - P; float d2 = dot(L, L), d = sqrt(d2)+1e-4; L /= d; return I*(max(dot(N, L), 0.0)*0.85 + 0.15)/(1.0 + 0.42*d2); }
// the two nearest of a row of lamps along the street; the row is as long as the geometry that carries it
float lamps(vec3 P, vec3 N, vec3 first, float sp, float I){ float k = floor((P.z-first.z)/sp); return ptL(P, N, vec3(first.xy, first.z+k*sp), I) + ptL(P, N, vec3(first.xy, first.z+(k+1.0)*sp), I); }
// light from the nearest strip of tube at (x, y), one fixture per structural bay; hang is unused in the well where tubes run across
float tubeL(vec3 P, vec3 N, vec2 xy, float well){
  float zc;
  if(well > 0.5) zc = clamp(P.z, 0.6, 2.8); else { float zb = 2.3 + 4.6*floor((P.z-2.3)/4.6); zc = clamp(P.z, zb+0.5, zb+3.9); }
  vec3 L = vec3(xy, zc) - P; float d2 = dot(L, L), d = sqrt(d2)+1e-4; L /= d;
  return (max(dot(N, L), 0.0)*0.82 + 0.18)*(0.35 + 0.65*max(L.y, 0.0))*(2.6/(1.2 + d2));
}
void main(){
  vec3 c = vCol;
  vec3 n = cross(dFdx(vP), dFdy(vP)), an = abs(n);
  vec3 Nf = normalize(n + vec3(1e-6)); if(dot(Nf, uEyeF - vP) < 0.0) Nf = -Nf;
  vec3 Ns = length(vN) > 0.1 ? normalize(vN) : Nf;
  vec3 Nb = Ns;
  if(vM > 0 && uMix < 0.995){
    bool flatY = an.y > an.x && an.y > an.z, sideX = an.x > an.z;
    vec2 st = flatY ? vP.xz : sideX ? vP.zy : vP.xy;
    float fx = length(vec2(dFdx(st.x), dFdy(st.x))), fy = length(vec2(dFdx(st.y), dFdy(st.y))), fp = max(fx, fy), fm = min(fx, fy);
    float wall = flatY ? 0.0 : 1.0;
    vec3 t = c;
    // a wall only darkens smoothly toward the pavement; stains and shadows are drawn as parts of the building (facade.js)
    float rise = wall*(1.0 - smoothstep(0.1, 2.2, vP.y));
    vec3 ax = flatY ? vec3(1,0,0) : sideX ? vec3(0,0,1) : vec3(1,0,0), ay = flatY ? vec3(0,0,1) : vec3(0,1,0);
    if(vM == 1){            // common brick, running bond, visible only as you come close to it
      float H = 0.075, L = 0.205, row = floor(st.y/H), u = st.x/L + 0.5*mod(row, 2.0), col = floor(u);
      float id = h21(vec2(row, col));
      t *= 1.0 + (id-0.5)*0.055*vis(L, fx)*vis(H, fy);
      { float e = 0.006, h0 = brickH(st), dx = brickH(st+vec2(e,0.0))-h0, dy = brickH(st+vec2(0.0,e))-h0; Nb = normalize(Ns - (ax*dx + ay*dy)*0.5*vis(H*0.7, fp)); }
      float my = abs(fract(st.y/H)-0.5)*2.0, mx = abs(fract(u)-0.5)*2.0;
      float m = max(smoothstep(0.8, 0.92, my)*vis(H*0.55, fy), smoothstep(0.93, 0.98, mx)*vis(L*0.22, fx));
      t = mix(t, vCol*0.62 + vec3(0.17, 0.165, 0.15)*(0.5 + vCol.g), m*0.42);
    } else if(vM == 2){     // dressed stone: only a very fine grain, seen close up
      t *= 1.0 + (vn(st*38.0)-0.5)*0.035*vis(0.03, fp);
      { float e = 0.006, h0 = vn(st*60.0), dx = vn((st+vec2(e,0.0))*60.0)-h0, dy = vn((st+vec2(0.0,e))*60.0)-h0; Nb = normalize(Ns - (ax*dx + ay*dy)*0.14*vis(0.02, fp)); }
    } else if(vM == 12){    // painted iron is smooth; the paint's thickness shows in the drawn mouldings, not here
    } else if(vM == 3){     // asphalt: fine aggregate, worn wheel paths as a soft change of tone
      t *= 1.0 + (h21(floor(st*95.0))-0.5)*0.07*vis(0.016, fp);
      { float e = 0.012, h0 = vn(st*70.0), dx = vn((st+vec2(e,0.0))*70.0)-h0, dy = vn((st+vec2(0.0,e))*70.0)-h0; Nb = normalize(Ns - (ax*dx + ay*dy)*0.7*vis(0.03, fp)); }
      float lane = abs(abs(vP.x)-1.8), track = smoothstep(0.42, 0.72, abs(lane-0.76)); t *= 0.955 + 0.045*track;
      t *= 1.0 - 0.05*smoothstep(4.0, 4.5, abs(vP.x));
      t *= 1.0 - 0.26*smoothstep(5.45, 5.97, abs(vP.x))*step(abs(vP.x), 6.01);   // the gutter
    } else if(vM == 4){     // sidewalk: each flag poured separately, one tone per flag, a little gum
      float id = h21(vec2(floor(st.y/1.5), sign(vP.x)));
      t *= 0.975 + 0.05*id;
      float ax = abs(vP.x); t *= 1.0 - 0.32*smoothstep(9.05, 9.98, ax)*step(ax, 10.6)*step(vP.z, 395.0);   // grime and shade along the foot of the wall
      vec2 ce = st/0.5; vec2 cid = floor(ce); float h = h21(cid+1.7);
      if(h > 0.9){ float d = length(fract(ce)-0.5-(vec2(h21(cid+3.1), h21(cid+5.2))-0.5)*0.6); t *= 1.0 - 0.3*(1.0-smoothstep(0.03, 0.06, d))*vis(0.04, fp); }
    } else if(vM == 5){     // glass: sky above the opposite roofline, the dark street wall below it, nothing busier
      float sl = 15.0 + 9.0*floor(vn(vec2(st.x*0.09, 2.0))*4.0)/3.0;
      float isky = smoothstep(sl-0.3, sl+0.3, vP.y);
      vec3 sk = vec3(0.68, 0.77, 0.81), bd = vec3(0.26, 0.28, 0.3);
      float a = vP.y < 4.2 ? 0.1 + 0.08*smoothstep(1.0, 4.2, vP.y) : 0.34;
      t = mix(t, mix(bd, sk, isky), a);
    } else if(vM == 6){     // painted board: a trace of brush along the grain, seen only close up
      t *= 1.0 + (vn(vec2(st.x*2.6, st.y*85.0))-0.5)*0.04*vis(0.02, fy);
    } else if(vM == 7){     // canvas and paper: weave, close up only
      t *= 1.0 + (vn(st*170.0)-0.5)*0.05*vis(0.012, fp);
    } else if(vM == 15){    // road paint: broken by aggregate showing through, worn along the wheel paths
      float track = 1.0-smoothstep(0.25, 0.7, abs(abs(abs(vP.x)-1.8)-0.76));
      float patchy = smoothstep(0.34, 0.72, vn(st*vec2(2.2, 0.9)+3.0)*0.65 + vn(st*vec2(7.0, 3.0))*0.35)*(0.35+0.65*track);
      float speck = step(0.62 - patchy*0.5, h21(floor(st*140.0)));
      t = mix(t, vec3(0.42, 0.42, 0.44), speck*patchy*0.75*vis(0.012, fp));
    } else if(vM == 17){    // glazed subway tile, running bond: a wide joint you can only see up close, each tile a slightly different firing
      float H = 0.075, Lt = 0.15, row = floor(st.y/H), u = st.x/Lt + 0.5*mod(row, 2.0), id = h21(vec2(row, floor(u)));
      t *= 1.0 + (id-0.5)*0.07*vis(Lt, fx)*vis(H, fy);
      float my = abs(fract(st.y/H)-0.5)*2.0, mx = abs(fract(u)-0.5)*2.0, m = max(smoothstep(0.84, 0.94, my)*vis(H*0.5, fy), smoothstep(0.91, 0.97, mx)*vis(Lt*0.25, fx));
      t = mix(t, vec3(0.5, 0.48, 0.43), m*0.6);
      // each glazed tile bulges a little; its edge catches the tube
      { float e = 0.004; float dy = (abs(fract((st.y+e)/H)-0.5)-abs(fract(st.y/H)-0.5)); Nb = normalize(Ns + ay*dy*7.0*vis(H*0.6, fy)); }
      // dirt: grey up from the skirting; rust weeps down from the slab joints, tied to the bays of the structure
      float above = vP.y - (vP.y > -10.2 ? -10.2 : -14.6); t *= 1.0 - 0.3*(1.0-smoothstep(0.0, 0.55, above));
      float bay = fract((vP.z-2.3)/4.6), weep = (1.0-smoothstep(0.0, 0.03, abs(bay-0.5)-vn(vec2(vP.z*3.0, 1.0))*0.02))*smoothstep(0.2, 0.9, (vP.y > -10.2 ? vP.y+10.2 : vP.y+14.6)/3.3);
      t = mix(t, t*vec3(0.74, 0.62, 0.48), 0.5*weep*vis(0.06, fx));
    } else if(vM == 18){    // terrazzo: marble chips in a cement matrix, ground flat
      float ch = h21(floor(st*62.0)); t *= 1.0 + (ch-0.5)*0.2*vis(0.02, fp); if(ch > 0.9) t = mix(t, vec3(0.3, 0.28, 0.25), 0.55*vis(0.02, fp));
      // metal strips dividing the pours; a dark worn path along the platform; gum
      float dz = abs(fract(vP.z/1.5)-0.5)*1.5, dx = abs(fract(vP.x/1.5)-0.5)*1.5; t = mix(t, vec3(0.52, 0.42, 0.24), (1.0-smoothstep(0.004, 0.012, 0.75-max(dz, dx)))*vis(0.012, fp));
      float ax = abs(vP.x); t *= 1.0 - 0.22*exp(-pow((ax-5.0)/1.1, 2.0))*(0.7+0.5*vn(vec2(vP.z*0.4, ax*1.3)));
      t *= 1.0 - 0.28*(1.0-smoothstep(0.0, 0.5, 9.6-ax));
      { vec2 ce = st/0.55; vec2 cid = floor(ce); float h = h21(cid+1.7); if(h > 0.88){ float d = length(fract(ce)-0.5-(vec2(h21(cid+3.1), h21(cid+5.2))-0.5)*0.6); t *= 1.0 - 0.5*(1.0-smoothstep(0.022, 0.05, d))*vis(0.03, fp); } }
    } else if(vM == 19){    // stainless skin: rolled grain along the car, flutes pressed below the belt, road dirt rising from the sill
      t *= 1.0 + (vn(vec2(st.x*2.5, st.y*190.0))-0.5)*0.025*vis(0.012, fy);
      if(!flatY && vP.y < -13.65){ float fl = sin(st.y*114.2); Nb = normalize(Ns + ay*fl*0.08*vis(0.02, fy)); t *= 1.0 + 0.025*fl*vis(0.02, fy); }
      t *= 1.0 - 0.16*(1.0-smoothstep(-14.8, -13.8, vP.y));
      t *= 1.0 - 0.035*smoothstep(0.45, 0.8, vn(vec2(st.x*0.7, st.y*2.3)));
    } else if(vM == 20){    // thick old enamel over riveted steel: paint scraped back to rust at knee height, darker where hands and bags rub
      float above = vP.y - (vP.y > -10.2 ? -10.2 : -14.6);
      float wear = smoothstep(0.5, 0.74, vn(st*vec2(9.0, 4.5)) + 0.6*(1.0-smoothstep(0.1, 1.0, above))*(vP.y < -7.3 ? 1.0 : 0.0) - 0.28);
      t = mix(t, vec3(0.25, 0.15, 0.1), wear*0.8*vis(0.05, fp));
      t *= 1.0 + (vn(vec2(st.x*1.6, st.y*30.0))-0.5)*0.1*vis(0.03, fy);
      { float e = 0.01, h0 = vn(st*16.0), dx = vn((st+vec2(e,0.0))*16.0)-h0, dy = vn((st+vec2(0.0,e))*16.0)-h0; Nb = normalize(Ns - (ax*dx + ay*dy)*0.45*vis(0.05, fp)); }
    } else if(vM == 21){    // the sewer's brick barrel: courses run round the bore, wet and slimed up to the high-water mark, weeping from the crown
      bool mn = vP.x < 0.2; vec2 ce = mn ? vec2(-3.1, -3.95) : vec2(2.25, -5.0); float Rt = mn ? 2.25 : 1.55, wl = mn ? -5.75 : -5.95;
      float ang = atan(vP.y-ce.y, vP.x-ce.x); vec2 sc = vec2(vP.z, ang*Rt);
      float fz = fwidth(vP.z), fa = length(vec2(dFdx(vP.y), dFdy(vP.y))) + length(vec2(dFdx(vP.x), dFdy(vP.x)));
      float Hb = 0.075, Lb = 0.205, row = floor(sc.y/Hb), ub = sc.x/Lb + 0.5*mod(row, 2.0), id = h21(vec2(row, floor(ub)));
      t *= 1.0 + (id-0.5)*0.22*vis(Lb, fz)*vis(Hb, fa);
      float my = abs(fract(sc.y/Hb)-0.5)*2.0, mx = abs(fract(ub)-0.5)*2.0, mm = max(smoothstep(0.76, 0.9, my)*vis(Hb*0.5, fa), smoothstep(0.9, 0.97, mx)*vis(Lb*0.22, fz));
      t = mix(t, vec3(0.2, 0.19, 0.17), mm*0.7);
      { vec3 tang = vec3(-sin(ang), cos(ang), 0.0); float e = 0.006, h0 = brickH(sc), dz = brickH(sc+vec2(e,0.0))-h0, da = brickH(sc+vec2(0.0,e))-h0; Nb = normalize(Ns - (vec3(0,0,1)*dz + tang*da)*0.6*vis(Hb*0.7, fa)); }
      float wet = 1.0-smoothstep(wl+0.3, wl+1.5+0.5*vn(vec2(vP.z*0.3, 1.0)), vP.y);
      t = mix(t, t*vec3(0.46, 0.56, 0.42)+vec3(0.0, 0.015, 0.0), wet*0.9);
      float seep = smoothstep(0.55, 0.78, vn(vec2(sc.y*0.9+3.0, vP.z*1.3)))*smoothstep(0.1, 0.9, vn(vec2(vP.z*0.2, ang*3.0)));
      t = mix(t, t*vec3(0.5, 0.48, 0.42), seep*0.7); t = mix(t, vec3(0.34, 0.42, 0.34), smoothstep(0.72, 0.84, vn(vec2(sc.y*4.0, vP.z*2.0)))*seep*0.5);
    } else if(vM == 22){    // standing water: nearly black, with a slow surface
      float a = vn(vec2(vP.x*3.0+vP.z*0.4, vP.z*0.9)), b = vn(vec2(vP.x*9.0, vP.z*3.0+a*2.0));
      Nb = normalize(vec3((a-0.5)*0.04+(b-0.5)*0.02*vis(0.2, fp), 1.0, (b-0.5)*0.04*vis(0.2, fp))); Ns = Nb;
      t *= 0.8 + 0.4*a;
    } else if(vM == 23){    // exposed fill: compressed lenses of clay, sand and angular aggregate
      float warp = fbm(st*vec2(0.7, 1.3));
      float beds = fbm(vec2(st.x*0.42, st.y*3.4 + warp*1.4));
      t = mix(t*vec3(0.82,0.84,0.8), t*vec3(1.65,1.48,1.23), beds);
      t *= 0.88 + 0.25*fbm(st*7.0) + (vn(st*52.0)-0.5)*0.18*vis(0.04,fp);
      vec2 q = st*13.0, cell = floor(q), f = fract(q); float chips = 0.0, rim = 0.0, hue = 0.0;
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
        vec2 g=vec2(float(i),float(j)), id=cell+g;
        vec2 d=f-g-vec2(h21(id+2.1),h21(id+8.7));
        float rad=0.12+0.25*h21(id+5.0), dist=length(d*vec2(1.0,1.35));
        float mask=(1.0-smoothstep(rad-0.04,rad,dist))*step(0.42,h21(id));
        chips=max(chips,mask); rim=max(rim,mask*smoothstep(-0.08,0.15,d.y)); hue=max(hue,mask*h21(id+9.0));
      }
      t=mix(t,vec3(0.29,0.265,0.22)*(0.7+0.75*hue),chips*0.7*vis(0.08,fp));
      t+=vec3(0.045,0.04,0.03)*rim*vis(0.08,fp);
      float damp=1.0-smoothstep(-7.0,-0.5,vP.y); t*=1.0-0.17*damp;
    } else if(vM == 24){    // schist section: folded mineral foliation and dark joint faces
      float bend=fbm(st*vec2(0.45,0.9));
      float phase=(st.y+st.x*0.32)*15.0+bend*5.0;
      float vein=pow(0.5+0.5*sin(phase),10.0)*vis(0.12,fp);
      t*=0.84+0.36*fbm(st*2.7);
      t=mix(t,t*1.65+vec3(0.025),vein*0.36);
      t*=1.0-(vn(st*43.0)-0.5)*0.22*vis(0.04,fp);
    } else if(vM == 25){    // sawn structural concrete: cement paste, exposed stone and air pores
      t*=0.88+0.22*fbm(st*11.0);
      vec2 q=st*38.0, id=floor(q), f=fract(q)-0.5;
      float stone=1.0-smoothstep(0.18,0.36,length(f*vec2(1.0,1.4)));
      t=mix(t,t*(0.6+0.85*h21(id+3.0)),stone*0.72*vis(0.035,fp));
      float pore=(1.0-smoothstep(0.04,0.13,length(f)))*step(0.84,h21(id+1.0));
      t*=1.0-0.5*pore*vis(0.018,fp);
    } else if(vM == 26){    // rough exposed terracotta and granular lime mortar
      t*=0.85+0.3*fbm(st*31.0);
      t*=1.0+(vn(st*110.0)-0.5)*0.22*vis(0.02,fp);
    } else if(vM == 27){    // cut metal: fine saw marks through a pitted oxidised wall
      t*=0.88+0.22*vn(st*vec2(160.0,18.0))*vis(0.02,fp);
      t*=1.0-0.22*smoothstep(0.58,0.78,vn(st*63.0))*vis(0.025,fp);
    } else if(vM == 8){     // car paint is handled with the light below
    } else if(vM == 9){     // steel: rolled grain, close up only
      t *= 1.0 + (vn(vec2(st.x*4.0, st.y*140.0))-0.5)*0.05*vis(0.02, fy);
    } else if(vM == 10){    // glazed roof tile: each one its own firing
      float cu = st.x/0.2, row = floor(st.y/0.17); float id = h21(vec2(floor(cu+0.5*mod(row, 2.0)), row));
      t *= 1.0 + (id-0.5)*0.14*vis(0.15, fp);
    } else if(vM == 11){    // lit acrylic: tubes behind it, very soft
      t *= 1.0 + 0.03*cos(st.y*2.0*3.14159/0.32)*vis(0.14, fy);
    }
    t *= 1.0 - 0.13*rise;
    t *= 1.0 - 0.2*wall*(1.0 - smoothstep(0.15, 0.48, vP.y))*step(0.1, vP.y);   // splash line just above the pavement
    c = mix(t, c, uMix);
  }
  // Sunlight. Diffuse with the surface's own relief, ambient from a sky above and a duller street below.
  if(uMix < 0.995 && vP.y > -0.02 && vP.z > 0.02 && vM != 11 && vM != 13 && vM != 14){
    float ndl = dot(Nf, uSun), lit = smoothstep(0.02, 0.14, ndl);
    if(lit > 0.0){
      float s = max(0.0, vP.x + 10.0)/(-uSun.x), yh = vP.y + s*uSun.y, zh = vP.z + s*uSun.z - (vP.x < -9.99 ? 1.0 : 0.0);
      float roof = zh < 0.0 ? 21.0 : texture(uRoof, vec2(zh/640.0, 0.5)).r*102.0;
      lit *= smoothstep(-0.14, 0.14, yh - roof);
      if(vP.x > 8.6 && an.x > an.z && an.x > an.y && vP.z < 170.0 && vP.y < 40.0) lit *= 1.0 - 0.94*texture(uMask, vec2(vP.z/170.0, vP.y/40.0)).r;
      if(an.y > an.x && an.y > an.z && vP.y < 0.25 && abs(vP.x) < 10.0 && vP.z < 170.0) lit *= 1.0 - 0.9*texture(uGnd, vec2((vP.x+10.0)/20.0, vP.z/170.0)).r;
    }
    float diff = clamp(dot(Nb, uSun)/max(ndl, 0.2), 0.0, 1.7);
    float hemi = 0.5 + 0.5*Nb.y;
    vec3 amb = mix(vec3(0.60, 0.59, 0.60), vec3(0.83, 0.86, 0.93), hemi);
    vec3 sun = vec3(1.13, 1.08, 0.98);
    vec3 L = mix(amb, sun*mix(0.9, 1.0, hemi)*(0.35 + 0.65*diff), lit);
    vec3 lt = c*mix(L, vec3(1.0), vHz);
    if(vM == 8 || vM == 16 || vM == 5){
      vec3 V = normalize(uEyeF - vP), RR = reflect(-V, Ns), e = envAt(vP, RR, vM == 5 ? 1.0 : 0.0);
      float nv = clamp(dot(Ns, V), 0.0, 1.0), F = (vM == 16 ? 0.72 : vM == 5 ? 0.06 : 0.07) + (vM == 16 ? 0.28 : 0.92)*pow(1.0-nv, 4.0);
      vec3 sp = vM == 8 ? vec3(pow(max(dot(RR, uSun), 0.0), 90.0))*lit*1.2 : vec3(0.0);
      lt = mix(lt, mix(e, c, vHz*0.8), F*(1.0-vHz)) + sp;
    }
    c = mix(c, lt, 1.0 - uMix);
  }
  // Underground there is no sun. Tubes in the station, bare lamps along the sewers, each lighting the point by distance and by how the surface faces it.
  if(uMix < 0.995 && vP.y < -0.1 && vP.z > 0.02 && vM != 11 && vM != 13 && vM != 14){
    float L; vec3 warm = vec3(1.0, 0.985, 0.93);
    if(vP.y > -6.9 && vP.x > 4.3){ L = 0.56 + 0.4*tubeL(vP, Nb, vec2(5.25, -0.48), 1.0) + 0.5*tubeL(vP, Nb, vec2(8.2, -0.24), 1.0); if(vP.z < 3.3 && vP.y < -2.8) L *= 0.82; }   // the stairwell
    else if(vP.y > -6.9 && vP.x < -6.5 && vP.z > 30.0){ L = 0.72; }     // the long stair on the left
    else if(vP.y > -6.9 && vP.x < -6.5){ L = 0.22 + lamps(vP, Nb, vec3(-8.3, -1.1, 3.9), 6.0, 1.7); }   // steam vault
    else if(vP.y > -6.9 && vP.x > 0.2 && vP.y > -3.0){ L = 0.22 + lamps(vP, Nb, vec3(2.2, -1.0, 3.7), 8.0, 1.3); }   // services gallery
    else if(vP.y > -6.9 && vP.x > 0.2){ L = 0.22 + lamps(vP, Nb, vec3(2.25, -3.85, 5.0), 14.0, 1.6); warm = vec3(1.0, 0.92, 0.74); }   // small sewer
    else if(vP.y > -6.9){   // main sewer: bulbs at the crown, a hot work lamp over the bench
      L = 0.12 + lamps(vP, Nb, vec3(-3.1, -2.0, 6.0), 13.0, 3.0) + ptL(vP, Nb, vec3(-5.0, -3.4, 15.8), 2.4);
      warm = vec3(1.0, 0.9, 0.72);
    } else {
      float px = abs(vP.x), sx = vP.x >= 0.0 ? 1.0 : -1.0;
      L = 0.0;
      if(vP.y > -11.5){ L += 1.5*tubeL(vP, Nb, vec2(sx*5.9, -7.22), 0.0); if(px > 7.3) L += 1.4*tubeL(vP, Nb, vec2(sx*8.5, -7.22), 0.0); }
      if(vP.y < -10.4){ L += 1.5*tubeL(vP, Nb, vec2(sx*5.0, -11.5), 0.0) + 0.5*tubeL(vP, Nb, vec2(-sx*5.0, -11.5), 0.0) + 1.1*tubeL(vP, Nb, vec2(sx*8.5, -10.56), 0.0); }
      L += 0.24 + 0.1*(0.5 - 0.5*Nb.y);
      if(px < 3.3 && vP.y < -14.65) L = max(L, 0.3)*(0.8 + 0.2*smoothstep(0.0, 1.0, (vP.y+15.65)));
      if(vP.y > -7.25 && an.y > an.x && an.y > an.z) L *= 0.75;
      if(px > 9.2 && (abs(vP.y+11.1) < 0.4)) L *= 0.8;
      L = min(L, 1.25);
    }
    vec3 lt = c*mix(vec3(L)*warm, vec3(1.0), vHz);
    if(vM == 17 || vM == 18 || vM == 19 || vM == 16 || vM == 5 || vM == 21 || vM == 22){
      vec3 V = normalize(uEyeF - vP), RR = reflect(-V, vM == 19 ? Ns : Nb), e;
      if(vM == 21 || vM == 22){
        // what wet surfaces see: a dark bore, with each crown bulb a hot streak that slides as the eye moves
        float tp = (-2.0 - vP.y)/max(RR.y, 0.05), hz = vP.z + RR.z*tp, hx = vP.x + RR.x*tp, dz = abs(fract((hz-6.0)/13.0+0.5)-0.5)*13.0;
        e = vec3(0.11, 0.13, 0.11) + vec3(1.2, 1.05, 0.72)*exp(-dz*dz*(vM == 22 ? 0.5 : 0.7))*exp(-(hx+3.1)*(hx+3.1)*(vM == 22 ? 3.0 : 0.8))*step(0.0, RR.y);
      } else e = envUnder(vP, RR);
      if(vM == 19){ e = mix(c*0.72, vec3(0.52,0.53,0.51), 0.22); lt = c*(0.58+0.42*clamp(L,0.0,1.0)); }
      float nv = clamp(dot(Nb, V), 0.0, 1.0), wetS = vM == 21 ? (1.0-smoothstep(-5.6, -4.0, vP.y))*0.4 + 0.06 : 0.0;
      float F = vM == 22 ? 0.1 + 0.9*pow(1.0-nv, 4.0) : vM == 21 ? wetS*(0.3 + 0.7*pow(1.0-nv, 3.0)) : vM == 19 ? 0.025 + 0.055*pow(1.0-nv, 3.0) : vM == 16 ? 0.6 : vM == 5 ? 0.08 + 0.6*pow(1.0-nv, 4.0) : vM == 18 ? 0.015 + 0.08*pow(1.0-nv, 5.0) : 0.03 + 0.34*pow(1.0-nv, 5.0);
      lt = mix(lt, mix(e, c, vHz), F*(1.0-vHz));
    }
    c = mix(c, lt, 1.0 - uMix);
  }
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

  const FS_GLASS = `#version 300 es
precision highp float; precision highp int;
in vec3 vP; in float vHz; flat in int vR; uniform float uMix; uniform vec3 uEyeF; uniform vec3 uSky3; out vec4 o;
${ENV}
void main(){
  vec3 N = normalize(cross(dFdx(vP), dFdy(vP))+vec3(1e-6)), V = normalize(uEyeF - vP); if(dot(N, V) < 0.0) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0), F = 0.06 + 0.94*pow(1.0-nv, 5.0);
  if(vR == 2) F = 0.05 + 0.95*pow(1.0-nv, 4.0);
  if(vR == 3) F = 0.035 + 0.07*pow(1.0-nv, 4.0);
  if(vR == 1) F = 0.09 + 0.91*pow(1.0-nv, 3.5);   // old glass with a film on it
  vec3 e = envAt(vP, reflect(-V, N), vR == 2 ? 0.0 : 1.0);
  if(vR == 3) e = mix(e, vec3(0.24,0.27,0.27), 0.85);
  float ta = vR == 3 ? 0.7 : vR == 2 ? 0.62 : vR == 1 ? 0.18 : 0.2;
  vec3 tint = vR == 3 ? vec3(0.07, 0.09, 0.09) : vR == 2 ? vec3(0.09, 0.11, 0.13) : vec3(0.13, 0.17, 0.17);
  float A = F + ta*(1.0-F);
  vec3 C = (e*F + tint*ta*(1.0-F))/A;
  C = mix(C, vP.y < -0.5 ? vec3(0.05,0.06,0.06) : uSky3, vHz);
  o = vec4(mix(C, vec3(0.83, 0.92, 0.9), uMix), mix(A, 0.16, uMix));
}`;

  // Sky: light and a little warm at the horizon, deepening overhead, with a couple of very soft high clouds
  const VS_SKY = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv = p; gl_Position = vec4(p*2.0-1.0, 1.0, 1.0); }`;
  const FS_SKY = `#version 300 es
precision highp float;
in vec2 vUv; uniform float uHor, uMix; uniform vec3 uPaper, uHz; uniform float uAsp; out vec4 o;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
void main(){
  float t = clamp((vUv.y - uHor)/0.75, 0.0, 1.0);
  vec3 c = mix(uHz, vec3(0.60, 0.74, 0.85), pow(t, 0.8));
  vec2 q = vec2(vUv.x*uAsp*1.6, vUv.y*5.2);
  float cl = 0.55*vn(q) + 0.3*vn(q*2.1+3.0) + 0.15*vn(q*4.3+7.0);
  c = mix(c, vec3(0.95, 0.95, 0.93), 0.5*smoothstep(0.54, 0.76, cl)*smoothstep(0.02, 0.2, t));
  o = vec4(mix(c, uPaper, uMix), 1.0);
}`;

  const VS_LINE = `#version 300 es
precision highp float; precision highp sampler2D; precision highp int;
layout(location=0) in vec3 aA;
layout(location=1) in vec3 aB;
layout(location=2) in vec3 aNA;
layout(location=3) in vec3 aNB;
layout(location=4) in vec4 aW;   // width, mode (1 = silhouette only), role, fade scale
${COMMON}
uniform vec2 uEye; uniform float uBias, uWeight;
out vec3 vD; out vec4 vCol; flat out float vHW; flat out float vLen;
vec2 pxOf(vec3 p, out float w){
  w = 1.0 + uK*p.z;
  vec2 xy = vec2(uOrigin.x + p.x*uS, uOrigin.y - p.y*uS);
  return uOff + (uVP + (xy - uVP)/w)*uF;
}
void main(){
  int v = gl_VertexID;
  float eb = float(v>>1), side = float(v&1)*2.0 - 1.0;
  float wa, wb;
  vec2 pa = pxOf(aA, wa), pb = pxOf(aB, wb);
  float vis = 1.0;
  if(aW.y > 0.5 && aW.y < 1.5){
    vec3 eye = vec3(uEye, -1.0/max(uK, 1e-5));
    vec3 vv = aA - eye;
    if(sign(dot(aNA, vv)) == sign(dot(aNB, vv))) vis = 0.0;
  }
  vec2 d = pb - pa; float len = length(d);
  vec2 dir = len > 1e-4 ? d/len : vec2(1.0, 0.0);
  vec2 perp = vec2(-dir.y, dir.x);
  float s = 2.0/(wa+wb);
  float fade = aW.w <= 0.0 ? 1.0 : smoothstep(aW.w*0.7, aW.w*1.35, s);
  if(aW.y > 1.5) fade *= uMix;   // drawn only on the line plate: the colour plate carries that information as surface
  if(fade <= 0.002) vis = 0.0;
  float hw = 0.5*aW.x*uWeight*uF*clamp(pow(s, 0.45), 0.34, 1.0);
  float pad = hw + 1.2;
  vec3 P = eb > 0.5 ? aB : aA;
  float w = eb > 0.5 ? wb : wa;
  vec2 px = (eb > 0.5 ? pb + dir*pad : pa - dir*pad) + perp*side*pad;
  vec2 ndc = vec2(px.x/uCanvas.x*2.0-1.0, 1.0-px.y/uCanvas.y*2.0);
  float nz = (P.z/w - uT0)*uTs - 1.0 - uBias;
  gl_Position = vis > 0.5 ? vec4(ndc, nz, 1.0) : vec4(3.0,3.0,3.0,1.0);
  vD = vec3((eb > 0.5 ? len + pad : -pad), side*pad, 1.0);
  vHW = hw; vLen = len;
  // distance lifts ink toward the sky, so the far end of the street never clots into black
  float h = hazeOf(0.5*(wa+wb));
  vCol = vec4(mix(pal(int(aW.z+0.5)), aA.y < -0.5 ? mix(vec3(0.05,0.06,0.06), pal(uSky), uMix) : pal(uSky), h), fade*mix(0.5, 1.0, smoothstep(0.05, 0.42, s)));
}`;
  const FS_LINE = `#version 300 es
precision highp float;
in vec3 vD; in vec4 vCol; flat in float vHW; flat in float vLen;
out vec4 o;
void main(){
  float a = vD.x < 0.0 ? length(vD.xy) : vD.x > vLen ? length(vec2(vD.x-vLen, vD.y)) : abs(vD.y);
  float al = vHW < 0.5 ? clamp(0.5 + vHW - a, 0.0, 1.0)*vHW*2.0 : clamp(vHW + 0.5 - a, 0.0, 1.0);   // below a pixel: fainter, never thicker
  al *= vCol.a;
  if(al <= 0.004) discard;
  o = vec4(vCol.rgb, al);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  }

  AV.Engine = class Engine {
    constructor(canvas) {
      const gl = (this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false }));
      if (!gl) throw new Error('需要 WebGL2');
      this.canvas = canvas;
      this.lostAt = null; canvas.addEventListener('webglcontextlost', ev => { ev.preventDefault(); this.lostAt = performance.now(); const f = document.getElementById('fail'); if (f) { f.hidden = false; f.textContent = '显卡中断了绘制，请刷新页面。'; } });
      this.face = program(gl, VS_FACE, FS_FACE);
      this.depthOnly = program(gl, VS_FACE, `#version 300 es
precision highp float; precision highp int;
in vec3 vCol; in vec3 vP; flat in int vM; in float vHz; out vec4 o; void main(){ o = vec4(0.0); }`);
      this.line = program(gl, VS_LINE, FS_LINE);
      this.sky = program(gl, VS_SKY, FS_SKY);
      this.glassP = program(gl, VS_FACE, FS_GLASS);
      this.emptyVAO = gl.createVertexArray();
      this.view = { d: 1, vx: 800, vy: 520, mix: 0, zoom: 1, zc: [800, 450] };
      this.F = 1; this.off = [0, 0]; this.dpr = 1;
      this.opts = { bias: 0.00012, weight: 1, noGlass: false };
    }
    upload(kit) {
      const gl = this.gl;
      const f = kit.faceData();
      this.faceVAO = gl.createVertexArray(); gl.bindVertexArray(this.faceVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
      this.faceCount = f.length / 4;
      const gd = kit.glassData();
      this.glassVAO = gl.createVertexArray(); gl.bindVertexArray(this.glassVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, gd, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
      this.glassCount = gd.length / 4;
      const sourceLines = kit.lineData();
      const count = sourceLines.length/16;
      const limits = new Float64Array(count);
      for (let i=0;i<count;i++) {
        const k=i*16, fade=sourceLines[k+15], sumZ=sourceLines[k+2]+sourceLines[k+5];
        // At this depth the existing shader gives the line exactly zero opacity.
        limits[i]=fade>0 && sumZ>0 ? Math.max(0,(2/(fade*0.7)-2)/(AV.cfg.k*sumZ))*1.001 : Infinity;
      }
      const order=Array.from({length:count},(_,i)=>i).sort((a,b)=>limits[b]-limits[a]);
      const l=new Float32Array(sourceLines.length);
      this.lineLimits=new Float64Array(count);
      order.forEach((index,i)=>{ l.set(sourceLines.subarray(index*16,index*16+16),i*16); this.lineLimits[i]=limits[index]; });
      this.lineVAO = gl.createVertexArray(); gl.bindVertexArray(this.lineVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, l, gl.STATIC_DRAW);
      [[0, 3, 0], [1, 3, 12], [2, 3, 24], [3, 3, 36], [4, 4, 48]].forEach(([i, n, o]) => {
        gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 64, o); gl.vertexAttribDivisor(i, 1);
      });
      this.lineCount = l.length / 16;
      gl.bindVertexArray(null);
      const pal = AV.paletteData();
      this.pal = pal;
      // the left-hand roofline, metre by metre, for the sun test
      const roof = new Uint8Array(1280); (AV.roofL || []).forEach((h, i) => { if (i < 640) roof[i * 2] = Math.min(255, Math.round((h * 255) / 102)); }); (AV.roofR || []).forEach((h, i) => { if (i < 640) roof[i * 2 + 1] = Math.min(255, Math.round((h * 255) / 102)); });
      this.roofTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.roofTex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, 640, 1, 0, gl.RG, gl.UNSIGNED_BYTE, roof);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // shadows of signs, fire escapes and cornices on the sunlit wall: projected along the sun and rasterised once
      const cv = document.createElement('canvas'), MW = 3400, MH = 800; cv.width = MW; cv.height = MH; const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.fillStyle = '#000'; cx.fillRect(0, 0, MW, MH); cx.fillStyle = '#fff'; cx.strokeStyle = '#fff'; cx.lineCap = 'round';
      const D = AV.SUN.map(v => -v), prj = p => { const t = (AV.G.HW - p[0]) / D[0], y = p[1] + t * D[1], z = p[2] + t * D[2]; return [z * (MW / 170), (40 - y) * (MH / 40)]; };
      for (const c of kit.casters || []) { const q = c.pts.map(prj); cx.beginPath(); cx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) cx.lineTo(q[i][0], q[i][1]); if (c.w) { cx.lineWidth = c.w * (MW / 170); cx.stroke(); } else { cx.closePath(); cx.fill(); } }
      this.maskTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.maskTex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // the same casters thrown on the ground
      const cg = document.createElement('canvas'), GW = 800, GH = 4096; cg.width = GW; cg.height = GH; const gx = cg.getContext('2d', { willReadFrequently: true });
      gx.fillStyle = '#000'; gx.fillRect(0, 0, GW, GH); gx.fillStyle = '#fff'; gx.strokeStyle = '#fff'; gx.lineCap = 'round';
      const pg = p => { const t = Math.max(0, p[1] - 0.05) / D[1] * -1, x = p[0] - t * D[0], z = p[2] - t * D[2]; return [(x + 10) * (GW / 20), z * (GH / 170)]; };
      for (const c of kit.casters || []) { const q = c.pts.map(pg); gx.beginPath(); gx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) gx.lineTo(q[i][0], q[i][1]); if (c.w) { gx.lineWidth = Math.max(1, c.w * (GW / 20)); gx.stroke(); } else { gx.closePath(); gx.fill(); } }
      this.gndTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.gndTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.palTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.palTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, pal.n, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pal.px);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    resize() {
      const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const cfg = AV.cfg;
      // Landscape: the stage covers the window. Portrait: street above, station below, the ground line 40% of the way down.
      let F0 = Math.max(c.width / cfg.stageW, Math.min(c.height / cfg.stageH, c.width / cfg.stageW * (c.width > c.height ? 9 : 1)));
      if (c.width / c.height < cfg.stageW / cfg.stageH) F0 = c.width / cfg.stageW;   // taller than the stage: always the full width of the street, wall to wall
      const asp = c.width / c.height, tA = Math.max(0, Math.min(1, (asp - 0.5625) / (cfg.stageW / cfg.stageH - 0.5625)));
      // where the ground line sits: 78% down on a wide screen; on a tall one, low enough that the station floor meets the bottom edge
      // and no bedrock shows below it (never higher than 42%)
      const invY = cfg.oy - (AV.ST.TR - 0.45) * cfg.S, fracTall = Math.max(0.42, 1 - ((invY - cfg.oy) * F0) / c.height);
      const frac = fracTall + (cfg.oy / cfg.stageH - fracTall) * tA;
      let off0 = [(c.width - cfg.stageW * F0) / 2, c.height * frac - cfg.oy * F0];
      this.baseF = F0; this.baseOff = off0.slice();
      this.portrait = asp < 1;
      let z = this.view.zoom || 1;
      const zc = this.view.zc, context = this.view.layerBlend || 0;
      const groundY=cfg.oy, roofY=cfg.oy-(AV.ST.CE+0.3)*cfg.S;
      // Keep a visible street strip and a visible station strip around the entire soil layer.
      const layerFit=0.65*c.height/((roofY-groundY)*F0);
      z += (Math.min(z,layerFit)-z)*context;
      this.F = F0 * z; this.off = off0;
      if (z !== 1) {
        // zoom stays inside what the base view shows: it never reveals what lies beyond the drawing
        const X0 = -off0[0] / F0, X1 = (c.width - off0[0]) / F0, Y0 = -off0[1] / F0, Y1 = (c.height - off0[1]) / F0;
        const lim = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        this.off = [lim(c.width / 2 - zc[0] * this.F, c.width - X1 * this.F, -X0 * this.F), lim(c.height / 2 - zc[1] * this.F, c.height - Y1 * this.F, -Y0 * this.F)];
      }
      if (context>0) {
        // Station region: its floor sits on the bottom edge, so the screen goes to station, soil and street, not to bedrock below.
        const invY=cfg.oy-(AV.ST.TR-0.45)*cfg.S;
        const lower=c.height-invY*this.F, upper=c.height*0.62-groundY*this.F;   // street region: the ground line at 62%, the street fills the rest
        const target=lower+(upper-lower)*(this.view.layerUpper || 0);
        this.off[1]+=(target-this.off[1])*context;
      }
      this.dpr = dpr;
    }
    _common(P) {
      const gl = this.gl, cfg = AV.cfg, v = this.view, u = P.u;
      const K = Math.max(cfg.k * v.d, 1e-5), t = z => z / (1 + K * z), t0 = t(cfg.zMin), t1 = t(cfg.zMax);
      gl.uniform2f(u.uOrigin, cfg.ox, cfg.oy);
      gl.uniform2f(u.uVP, v.vx, v.vy);
      gl.uniform2f(u.uCanvas, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.uOff, this.off[0], this.off[1]);
      gl.uniform1f(u.uS, cfg.S); gl.uniform1f(u.uK, cfg.k * v.d); gl.uniform1f(u.uF, this.F);
      gl.uniform1f(u.uT0, t0); gl.uniform1f(u.uTs, 1.98 / (t1 - t0));
      gl.uniform1f(u.uMix, v.mix || 0);
      gl.uniform1i(u.uPal, 0); gl.uniform1i(u.uSky, this.pal.sky);
      if (u.uRoof) { gl.uniform1i(u.uRoof, 1); if (u.uMask) gl.uniform1i(u.uMask, 2); if (u.uGnd) gl.uniform1i(u.uGnd, 3); if (u.uSun)  gl.uniform3f(u.uSun, AV.SUN[0], AV.SUN[1], AV.SUN[2]); gl.uniform3f(u.uEyeF, (v.vx - cfg.ox) / cfg.S, (cfg.oy - v.vy) / cfg.S, -1 / K); }
    }
    visibleLineCount(depth) {
      let lo=0, hi=this.lineCount;
      while(lo<hi) { const mid=(lo+hi)>>>1; if(this.lineLimits[mid]>depth) lo=mid+1; else hi=mid; }
      return lo;
    }
    render() {
      const gl = this.gl, cfg = AV.cfg, v = this.view;
      this.resize();
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      const m = v.mix || 0, a = this.pal.skyA, b = this.pal.skyB;
      gl.clearColor(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, a[2] + (b[2] - a[2]) * m, 1);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.roofTex);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.gndTex);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.palTex);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      // depth first, so the surface shader only ever runs on what is actually seen
      let P = this.depthOnly; gl.useProgram(P.p); this._common(P);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      gl.bindVertexArray(this.faceVAO);
      gl.colorMask(false, false, false, false);
      gl.drawArrays(gl.TRIANGLES, 0, this.faceCount);
      gl.colorMask(true, true, true, true);
      P = this.face; gl.useProgram(P.p); this._common(P);
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, this.faceCount);
      gl.depthMask(true);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      if (!this.opts.noSky) {   // behind everything: only pixels no surface has claimed
        P = this.sky; gl.useProgram(P.p); gl.depthMask(false);
        gl.uniform1f(P.u.uMix, v.mix || 0); gl.uniform1f(P.u.uAsp, this.canvas.width / this.canvas.height);
        gl.uniform1f(P.u.uHor, 1 - Math.max(0, Math.min(1, (this.off[1] + v.vy * this.F) / this.canvas.height)));
        gl.uniform3f(P.u.uPaper, b[0], b[1], b[2]); gl.uniform3f(P.u.uHz, a[0], a[1], a[2]);
        gl.bindVertexArray(this.emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.depthMask(true);
      }
      if (!this.opts.noGlass && this.glassCount) {
        P = this.glassP; gl.useProgram(P.p); this._common(P); gl.uniform3f(P.u.uSky3, a[0], a[1], a[2]);
        gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE); gl.depthMask(false);
        gl.bindVertexArray(this.glassVAO); gl.drawArrays(gl.TRIANGLES, 0, this.glassCount);
        gl.disable(gl.BLEND); gl.depthMask(true);
      }
      P = this.line; gl.useProgram(P.p); this._common(P);
      gl.uniform2f(P.u.uEye, (v.vx - cfg.ox) / cfg.S, (cfg.oy - v.vy) / cfg.S);
      gl.uniform1f(P.u.uBias, this.opts.bias);
      gl.uniform1f(P.u.uWeight, this.opts.weight);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      gl.bindVertexArray(this.lineVAO);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.visibleLineCount(v.d));
      gl.disable(gl.BLEND); gl.depthMask(true);
      gl.bindVertexArray(null);
    }
    project(p) {
      const cfg = AV.cfg, v = this.view, w = 1 + cfg.k * v.d * p[2];
      const x = cfg.ox + p[0] * cfg.S, y = cfg.oy - p[1] * cfg.S;
      return [v.vx + (x - v.vx) / w, v.vy + (y - v.vy) / w, w];
    }
  };
})();
