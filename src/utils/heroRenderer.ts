// WebGL renderer for the home hero painting.
// One plate plus a packed data map (R: depth, near = bright · G: where clouds may drift · B: lake mist)
// is enough for a 2.5D camera move on arrival, drifting clouds, mist and a breathing lantern.

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uImage;
uniform sampler2D uData;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uFocus;
uniform vec2 uShift;
uniform float uZoom;
uniform float uDolly;
uniform float uFocusDepth;
uniform float uTime;
uniform float uFlow;
uniform float uFade;
uniform float uBlur;
uniform vec4 uMeteor;
uniform float uMeteorGlow;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= .5; }
  return v;
}

// Same framing as object-fit: cover with object-position = uFocus.
vec2 cover(vec2 uv) {
  float ca = uResolution.x / uResolution.y, ia = uImageSize.x / uImageSize.y;
  vec2 frac = ca > ia ? vec2(1., ia / ca) : vec2(ca / ia, 1.);
  return (1. - frac) * uFocus + uv * frac;
}

// Cinemagraph drift: two samples half a cycle apart, cross-faded so the loop never jumps.
vec3 drift(vec2 p, float amount) {
  float ph = uTime / 15. + noise(p * vec2(3.2, 5.)) * .6;
  float a = fract(ph), b = fract(ph + .5);
  vec2 dir = vec2(.05, -.0035) * amount;
  vec3 c0 = texture2D(uImage, p - dir * (a - .5)).rgb;
  vec3 c1 = texture2D(uImage, p - dir * (b - .5)).rgb;
  return mix(c0, c1, abs(a - .5) * 2.);
}

void main() {
  vec2 screen = cover(vUv);
  vec2 c = cover(vec2(.5));
  vec2 q = c + (screen - c) / uZoom;
  vec2 p = q;
  for (int i = 0; i < 3; i++) {
    float d = texture2D(uData, p).r - uFocusDepth;
    p = c + (q - uShift * d - c) / (1. + uDolly * d);
  }
  vec3 m = texture2D(uData, p).rgb;
  float flow = m.g * uFlow;
  vec3 col = flow > .002 ? drift(p, flow) : texture2D(uImage, p).rgb;

  if (uBlur > .001) {
    vec2 r = uBlur * abs(m.r - uFocusDepth) * 9. / uImageSize;
    col = col * .28
      + (texture2D(uImage, p + vec2(r.x, 0.)).rgb + texture2D(uImage, p - vec2(r.x, 0.)).rgb
      + texture2D(uImage, p + vec2(0., r.y)).rgb + texture2D(uImage, p - vec2(0., r.y)).rgb) * .18;
  }

  float mist = fbm(p * vec2(5.5, 15.) + vec2(uTime * .035, uTime * .004));
  col += vec3(.60, .64, .67) * smoothstep(.45, .92, mist) * m.b * .085 * uFlow;

  vec2 lp = (p - vec2(.9655, .735)) * uImageSize / uImageSize.y;
  float glow = exp(-dot(lp, lp) * 260.);
  float flicker = noise(vec2(uTime * 7.3, 1.7)) * .6 + noise(vec2(uTime * 2.1, 9.2)) * .4 - .5;
  col *= 1. + glow * flicker * .22;

  // Shooting star drawn into the sky itself, so towers, mountains and the moonlit cloud tops sit in front of it.
  if (uMeteorGlow > .001) {
    vec2 rel = p * uImageSize - uMeteor.xy;
    float along = dot(rel, uMeteor.zw);
    float across = abs(rel.x * uMeteor.w - rel.y * uMeteor.z);
    float tail = smoothstep(-160., 0., along) * step(along, 1.5);
    float streak = tail * tail * exp(-across * across / 1.4);
    float head = exp(-dot(rel, rel) / 6.);
    float open = 1. - smoothstep(.015, .07, m.r);
    float veil = 1. - smoothstep(.22, .55, dot(col, vec3(.299, .587, .114))) * .65;
    col += vec3(1., .95, .84) * (streak * .8 + head) * uMeteorGlow * open * veil;
  }

  gl_FragColor = vec4(col * uFade, 1.);
}`;

export const HERO_REST_ZOOM = 1.04;
const INTRO = 3.6;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOut = (value: number, power = 3) => 1 - Math.pow(1 - clamp01(value), power);
const smooth = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

export interface HeroRenderer {
  resize(width: number, height: number, focusX: number, focusY: number): void;
  setPointer(x: number, y: number): void;
  setScroll(progress: number): void;
  play(): void;
  pause(): void;
  dispose(): void;
}

export function createHeroRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement, data: HTMLImageElement, onLost: () => void): HeroRenderer | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const upload = (unit: number, source: HTMLImageElement, isData: boolean) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, isData ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const textures = [upload(0, image, false), upload(1, data, true)];

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    image: uniform('uImage'), data: uniform('uData'), resolution: uniform('uResolution'), imageSize: uniform('uImageSize'),
    focus: uniform('uFocus'), shift: uniform('uShift'), zoom: uniform('uZoom'), dolly: uniform('uDolly'),
    focusDepth: uniform('uFocusDepth'), time: uniform('uTime'), flow: uniform('uFlow'), fade: uniform('uFade'), blur: uniform('uBlur'),
    meteor: uniform('uMeteor'), meteorGlow: uniform('uMeteorGlow'),
  };
  gl.uniform1i(u.image, 0);
  gl.uniform1i(u.data, 1);
  gl.uniform2f(u.imageSize, image.naturalWidth, image.naturalHeight);
  gl.uniform1f(u.focusDepth, .12);

  let elapsed = 0, last = 0, frame = 0, running = false, disposed = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const scroll = { value: 0, target: 0 };
  const width = image.naturalWidth, height = image.naturalHeight;
  const meteor = { active: false, start: 0, duration: 1, x: 0, y: 0, dx: 0, dy: 0, travel: 0, next: INTRO + 3 + Math.random() * 4 };
  const updateMeteor = () => {
    if (!meteor.active && elapsed > meteor.next) {
      const angle = (24 + Math.random() * 14) * Math.PI / 180;
      Object.assign(meteor, {
        active: true, start: elapsed, duration: .95 + Math.random() * .4,
        x: width * (.42 + Math.random() * .5), y: height * (.03 + Math.random() * .13),
        dx: -Math.cos(angle), dy: Math.sin(angle), travel: 380 + Math.random() * 200,
      });
    }
    if (!meteor.active) { gl.uniform1f(u.meteorGlow, 0); return; }
    const k = (elapsed - meteor.start) / meteor.duration;
    if (k >= 1) {
      meteor.active = false;
      meteor.next = elapsed + 6 + Math.random() * 7;
      gl.uniform1f(u.meteorGlow, 0);
      return;
    }
    const reach = meteor.travel * (k * .35 + easeOut(k, 2) * .65);
    gl.uniform4f(u.meteor, meteor.x + meteor.dx * reach, meteor.y + meteor.dy * reach, meteor.dx, meteor.dy);
    gl.uniform1f(u.meteorGlow, Math.sin(Math.PI * k) * .9);
  };

  const draw = () => {
    const arrive = easeOut(elapsed / INTRO);
    const settle = smooth(INTRO * .6, INTRO + 2, elapsed);
    gl.uniform1f(u.zoom, HERO_REST_ZOOM + (1.13 - HERO_REST_ZOOM) * (1 - arrive) + scroll.value * .06);
    gl.uniform1f(u.dolly, .16 * (1 - easeOut(elapsed / (INTRO * .9), 4)) + scroll.value * .07);
    gl.uniform2f(u.shift,
      .016 * (1 - arrive) + pointer.x * .011 + Math.sin(elapsed * .21) * .0018 * settle,
      .022 * (1 - arrive) + pointer.y * .007 + Math.cos(elapsed * .17) * .0012 * settle);
    gl.uniform1f(u.time, elapsed);
    gl.uniform1f(u.flow, smooth(INTRO * .7, INTRO + 1.4, elapsed));
    gl.uniform1f(u.fade, smooth(0, 1.5, elapsed));
    gl.uniform1f(u.blur, 1 - smooth(0, INTRO * .8, elapsed));
    updateMeteor();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, .1);
    last = now;
    elapsed += dt;
    const ease = 1 - Math.exp(-dt * 3.2);
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;
    scroll.value += (scroll.target - scroll.value) * (1 - Math.exp(-dt * 9));
    draw();
    frame = requestAnimationFrame(tick);
  };

  const lost = (event: Event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(frame);
    onLost();
  };
  canvas.addEventListener('webglcontextlost', lost);

  return {
    resize(width, height, focusX, focusY) {
      if (disposed) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.resolution, width, height);
      gl.uniform2f(u.focus, focusX, focusY);
      if (!running) draw();
    },
    setPointer(x, y) { pointer.tx = x; pointer.ty = y; },
    setScroll(progress) { scroll.target = clamp01(progress); },
    play() {
      if (running || disposed) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    },
    pause() {
      running = false;
      cancelAnimationFrame(frame);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener('webglcontextlost', lost);
      textures.forEach(texture => gl.deleteTexture(texture));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // Leaving the home view unmounts the canvas; release the context now instead of waiting for GC.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
