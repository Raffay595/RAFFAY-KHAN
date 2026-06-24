/**
 * CircularGallery – Vanilla JS / OGL UMD
 *
 * Key fix: canvas is portrait 700×900 to match the plane's native
 * aspect ratio (scale formula uses 700/900), so no cover-crop occurs.
 * UV mapping uses vUv directly — full canvas fills the plane exactly.
 *
 * Depends on: ogl.umd.js → window.ogl
 */
(function () {
  'use strict';

  /* ─── OGL accessor ──────────────────────────────────────── */
  function getOGL() {
    return window.ogl || window.OGL || (typeof ogl !== 'undefined' ? ogl : null);
  }

  /* ─── Math utils ────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function debounce(fn, ms) {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }

  /* ─── Colour helpers ────────────────────────────────────── */
  function hexRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* Site design tokens */
  const PRIMARY    = '#ff5637';
  const ACCENT_DIM = '#ffb4a5';
  const ON_SURFACE = '#e5e2e1';

  /* ─── Canvas helpers ────────────────────────────────────── */
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ─── Card canvas renderer ──────────────────────────────── */
  /*
   * PORTRAIT canvas: 700 × 900 px
   * This matches the plane's scale formula (700 wide / 900 tall)
   * so the texture fills the plane with NO cropping at all.
   */
  function createCardCanvas(item) {
    const CW = 700, CH = 900;
    const PAD = 44;

    const canvas = document.createElement('canvas');
    canvas.width  = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');

    /* ── Dark base background ── */
    ctx.fillStyle = '#181717';
    ctx.fillRect(0, 0, CW, CH);

    /* Top-left warm glow */
    const g1 = ctx.createRadialGradient(CW * 0.15, CH * 0.15, 0, CW * 0.15, CH * 0.15, CW * 0.7);
    g1.addColorStop(0,   hexRgba(PRIMARY, 0.18));
    g1.addColorStop(0.6, hexRgba(PRIMARY, 0.05));
    g1.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, CW, CH);

    /* Bottom-right subtle glow */
    const g2 = ctx.createRadialGradient(CW, CH, 0, CW, CH, CW * 0.6);
    g2.addColorStop(0,   hexRgba(ACCENT_DIM, 0.09));
    g2.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, CW, CH);

    /* ── Top primary accent bar ── */
    const bar = ctx.createLinearGradient(0, 0, CW * 0.7, 0);
    bar.addColorStop(0,   PRIMARY);
    bar.addColorStop(0.75, hexRgba(PRIMARY, 0.18));
    bar.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, CW, 3);

    /* ── Section badge ── */
    const BADGE_FONT = 'bold 15px "JetBrains Mono", Courier, monospace';
    ctx.font = BADGE_FONT;
    const bLabel = '// CAMPUS ROLE';
    const bLW    = ctx.measureText(bLabel).width;
    const bPadX  = 16, bH = 34;
    const bW     = bLW + bPadX * 2;
    const bX     = PAD, bY = 40;

    roundRect(ctx, bX, bY, bW, bH, bH / 2);
    ctx.fillStyle = hexRgba(PRIMARY, 0.12);
    ctx.fill();
    ctx.strokeStyle = hexRgba(PRIMARY, 0.38);
    ctx.lineWidth = 1;
    roundRect(ctx, bX, bY, bW, bH, bH / 2);
    ctx.stroke();

    ctx.fillStyle    = PRIMARY;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.fillText(bLabel, bX + bPadX, bY + bH / 2);

    /* Thin divider */
    const divY = bY + bH + 14;
    const divGrad = ctx.createLinearGradient(PAD, 0, CW - PAD, 0);
    divGrad.addColorStop(0,   hexRgba('#ffffff', 0.18));
    divGrad.addColorStop(0.6, hexRgba('#ffffff', 0.04));
    divGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, divY);
    ctx.lineTo(CW - PAD, divY);
    ctx.stroke();

    /* ── Role title ── */
    const TITLE_FONT = 'bold 50px "Hanken Grotesk", "Inter", Arial, sans-serif';
    ctx.font         = TITLE_FONT;
    ctx.textBaseline = 'top';
    const maxTextW   = CW - PAD * 2;
    const titleLines = wrapText(ctx, item.role, maxTextW);
    const titleY     = divY + 22;
    const titleLineH = 62;

    titleLines.forEach((line, i) => {
      /* Gradient: white → primary-dim */
      const tW   = ctx.measureText(line).width;
      const tGrd = ctx.createLinearGradient(PAD, 0, PAD + tW, 0);
      tGrd.addColorStop(0, ON_SURFACE);
      tGrd.addColorStop(1, ACCENT_DIM);
      ctx.fillStyle = tGrd;
      ctx.fillText(line, PAD, titleY + i * titleLineH);
    });

    /* ── Organisation ── */
    const orgY  = titleY + titleLines.length * titleLineH + 22;
    const ORG_FONT = '400 26px "Inter", Arial, sans-serif';
    ctx.font      = ORG_FONT;
    ctx.fillStyle = 'rgba(229,226,225,0.55)';
    const orgLines = wrapText(ctx, item.org, maxTextW);
    orgLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, PAD, orgY + i * 36);
    });

    /* ── Period pill – pinned near bottom ── */
    const PERIOD_FONT = 'bold 22px "JetBrains Mono", Courier, monospace';
    ctx.font = PERIOD_FONT;
    const pH  = 46, pPadX = 22;
    const pW  = ctx.measureText(item.period).width + pPadX * 2;
    const pX  = PAD;
    const pY  = CH - PAD - pH;

    roundRect(ctx, pX, pY, pW, pH, pH / 2);
    ctx.fillStyle = hexRgba(PRIMARY, 0.11);
    ctx.fill();
    ctx.strokeStyle = hexRgba(PRIMARY, 0.48);
    ctx.lineWidth = 1;
    roundRect(ctx, pX, pY, pW, pH, pH / 2);
    ctx.stroke();

    ctx.fillStyle    = hexRgba(PRIMARY, 0.95);
    ctx.textBaseline = 'middle';
    ctx.fillText(item.period, pX + pPadX, pY + pH / 2);

    /* ── Decorative corner squares ── */
    ctx.strokeStyle = hexRgba(PRIMARY, 0.16);
    ctx.lineWidth   = 1;
    ctx.strokeRect(CW - 66, CH - 66, 42, 42);
    ctx.strokeStyle = hexRgba(PRIMARY, 0.08);
    ctx.strokeRect(CW - 57, CH - 57, 24, 24);

    return canvas;
  }

  /* ─── GLSL shaders ───────────────────────────────────────── */
  /*
   * IMPORTANT: uv = vUv directly (no cover/contain calculation).
   * The canvas matches the plane's aspect ratio so the full canvas
   * maps 1:1 onto the plane — zero cropping.
   */
  const VERT = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float uTime;
    uniform float uSpeed;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5)
            * (0.1 + uSpeed * 0.5);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;
    uniform sampler2D tMap;
    uniform float uBorderRadius;
    uniform float uGlow;
    varying vec2 vUv;

    float roundedBoxSDF(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b;
      return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
    }

    void main() {
      /* Direct UV mapping — canvas fills plane 1:1, no cropping */
      vec4 color = texture2D(tMap, vUv);

      /* Rounded corners */
      float d     = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
      float alpha = 1.0 - smoothstep(-0.002, 0.002, d);

      /* Border glow — site primary #ff5637 = rgb(1.0, 0.337, 0.216) */
      float glowD  = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius - 0.010), uBorderRadius);
      float rim    = 1.0 - smoothstep(0.0, 0.020, abs(glowD));
      vec3 glowCol = vec3(1.0, 0.337, 0.216);
      color.rgb    = mix(color.rgb, glowCol, rim * uGlow * 0.80);
      color.rgb   += glowCol * rim * uGlow * 0.40;

      gl_FragColor = vec4(color.rgb, color.a * alpha);
    }
  `;

  /* ─── Media – one card ──────────────────────────────────── */
  class Media {
    constructor({ geometry, gl, item, index, length, scene, screen, viewport, bend, borderRadius }) {
      this.extra        = 0;
      this.gl           = gl;
      this.geometry     = geometry;
      this.item         = item;
      this.index        = index;
      this.length       = length;
      this.scene        = scene;
      this.screen       = screen;
      this.viewport     = viewport;
      this.bend         = bend;
      this.borderRadius = borderRadius;
      this.glowTarget   = 0;
      this.glowCurrent  = 0;
      this._buildShader();
      this._buildMesh();
      this.onResize();
    }

    _buildShader() {
      const { Texture, Program } = getOGL();
      this.cardTexture = new Texture(this.gl, { generateMipmaps: false });

      this.program = new Program(this.gl, {
        depthTest:  false,
        depthWrite: false,
        vertex:     VERT,
        fragment:   FRAG,
        uniforms: {
          tMap:          { value: this.cardTexture },
          uSpeed:        { value: 0 },
          uTime:         { value: 100 * Math.random() },
          uBorderRadius: { value: this.borderRadius },
          uGlow:         { value: 0 }
        },
        transparent: true
      });

      /* Draw canvas once fonts are ready */
      document.fonts.ready.then(() => {
        const c = createCardCanvas(this.item);
        this.cardTexture.image      = c;
        this.cardTexture.needsUpdate = true;
      });
    }

    _buildMesh() {
      const { Mesh } = getOGL();
      this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
      this.plane.setParent(this.scene);
    }

    /* Screen-space AABB hover check */
    checkHover(mx, my) {
      const canvas = this.gl.canvas;
      const cW = canvas.clientWidth  || canvas.width;
      const cH = canvas.clientHeight || canvas.height;
      const hw = (this.plane.scale.x / this.viewport.width)  * cW * 0.5;
      const hh = (this.plane.scale.y / this.viewport.height) * cH * 0.5;
      const cx = ((this.plane.position.x / (this.viewport.width  * 0.5)) *  0.5 + 0.5) * cW;
      const cy = ((-this.plane.position.y / (this.viewport.height * 0.5)) * 0.5 + 0.5) * cH;
      return mx >= cx - hw && mx <= cx + hw && my >= cy - hh && my <= cy + hh;
    }

    update(scroll, direction, mx, my) {
      this.plane.position.x = this.x - scroll.current - this.extra;
      const x = this.plane.position.x;
      const H = this.viewport.width / 2;

      if (this.bend === 0) {
        this.plane.position.y = 0;
        this.plane.rotation.z = 0;
      } else {
        const Babs = Math.abs(this.bend);
        const R    = (H * H + Babs * Babs) / (2 * Babs);
        const eX   = Math.min(Math.abs(x), H);
        const arc  = R - Math.sqrt(R * R - eX * eX);
        if (this.bend > 0) {
          this.plane.position.y = -arc;
          this.plane.rotation.z = -Math.sign(x) * Math.asin(eX / R);
        } else {
          this.plane.position.y =  arc;
          this.plane.rotation.z =  Math.sign(x) * Math.asin(eX / R);
        }
      }

      /* Smooth glow */
      this.glowTarget  = this.checkHover(mx, my) ? 1 : 0;
      this.glowCurrent = lerp(this.glowCurrent, this.glowTarget, 0.09);
      this.program.uniforms.uGlow.value  = this.glowCurrent;
      this.program.uniforms.uTime.value += 0.04;
      this.program.uniforms.uSpeed.value = scroll.current - scroll.last;

      const pOff = this.plane.scale.x / 2;
      const vOff = this.viewport.width / 2;
      this.isBefore = this.plane.position.x + pOff < -vOff;
      this.isAfter  = this.plane.position.x - pOff >  vOff;
      if (direction === 'right' && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false; }
      if (direction === 'left'  && this.isAfter)  { this.extra += this.widthTotal; this.isBefore = this.isAfter = false; }
    }

    onResize({ screen, viewport } = {}) {
      if (screen)   this.screen   = screen;
      if (viewport) this.viewport = viewport;
      this.scale = this.screen.height / 1500;
      /* Keep the 700/900 plane aspect to match the canvas */
      this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
      this.plane.scale.x = (this.viewport.width  * (700 * this.scale)) / this.screen.width;
      this.padding    = 2;
      this.width      = this.plane.scale.x + this.padding;
      this.widthTotal = this.width * this.length;
      this.x          = this.width * this.index;
    }
  }

  /* ─── App ───────────────────────────────────────────────── */
  class App {
    constructor(container, {
      items        = [],
      bend         = 3,
      borderRadius = 0.05,
      scrollSpeed  = 2,
      scrollEase   = 0.05
    } = {}) {
      this.container   = container;
      this.scrollSpeed = scrollSpeed;
      this.scroll      = { ease: scrollEase, current: 0, target: 0, last: 0 };
      this._snapDebounce = debounce(this._snap.bind(this), 200);
      this.mouse = { x: -9999, y: -9999 };

      this._initRenderer();
      this._initCamera();
      this._initScene();
      this.onResize();
      this._initGeometry();
      this._initCards(items, bend, borderRadius);
      this._loop();
      this._listen();
    }

    _initRenderer() {
      const { Renderer } = getOGL();
      this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
      this.gl = this.renderer.gl;
      this.gl.clearColor(0, 0, 0, 0);
      this.container.appendChild(this.gl.canvas);
    }
    _initCamera() {
      const { Camera } = getOGL();
      this.camera = new Camera(this.gl);
      this.camera.fov = 45;
      this.camera.position.z = 20;
    }
    _initScene() {
      const { Transform } = getOGL();
      this.scene = new Transform();
    }
    _initGeometry() {
      const { Plane } = getOGL();
      this.planeGeo = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
    }
    _initCards(items, bend, borderRadius) {
      const doubled = items.concat(items);
      this.medias = doubled.map((item, idx) => new Media({
        geometry:     this.planeGeo,
        gl:           this.gl,
        item,
        index:        idx,
        length:       doubled.length,
        scene:        this.scene,
        screen:       this.screen,
        viewport:     this.viewport,
        bend,
        borderRadius
      }));
    }

    _pointerDown(e) {
      this.isDown = true;
      this.scroll.position = this.scroll.current;
      this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    }
    _pointerMove(e) {
      const rect = this.container.getBoundingClientRect();
      const cx   = e.touches ? e.touches[0].clientX : e.clientX;
      const cy   = e.touches ? e.touches[0].clientY : e.clientY;
      this.mouse.x = cx - rect.left;
      this.mouse.y = cy - rect.top;
      if (!this.isDown) return;
      this.scroll.target = this.scroll.position + (this.startX - cx) * (this.scrollSpeed * 0.025);
    }
    _pointerLeave() { this.mouse.x = -9999; this.mouse.y = -9999; }
    _pointerUp()    { this.isDown = false; this._snap(); }
    _wheel(e) {
      const d = e.deltaY || e.wheelDelta || e.detail;
      this.scroll.target += (d > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
      this._snapDebounce();
    }
    _snap() {
      if (!this.medias || !this.medias[0]) return;
      const w   = this.medias[0].width;
      const idx = Math.round(Math.abs(this.scroll.target) / w);
      const s   = w * idx;
      this.scroll.target = this.scroll.target < 0 ? -s : s;
    }

    onResize() {
      this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
      this.renderer.setSize(this.screen.width, this.screen.height);
      this.camera.perspective({ aspect: this.screen.width / this.screen.height });
      const fov = (this.camera.fov * Math.PI) / 180;
      const vpH = 2 * Math.tan(fov / 2) * this.camera.position.z;
      this.viewport = { width: vpH * this.camera.aspect, height: vpH };
      if (this.medias) this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }));
    }

    _loop() {
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
      const dir = this.scroll.current > this.scroll.last ? 'right' : 'left';
      if (this.medias) this.medias.forEach(m => m.update(this.scroll, dir, this.mouse.x, this.mouse.y));
      this.renderer.render({ scene: this.scene, camera: this.camera });
      this.scroll.last = this.scroll.current;
      this.raf = requestAnimationFrame(this._loop.bind(this));
    }

    _listen() {
      this._onResize  = this.onResize.bind(this);
      this._onDown    = this._pointerDown.bind(this);
      this._onMove    = this._pointerMove.bind(this);
      this._onUp      = this._pointerUp.bind(this);
      this._onWheel   = this._wheel.bind(this);
      this._onLeave   = this._pointerLeave.bind(this);

      window.addEventListener('resize',   this._onResize);
      this.container.addEventListener('wheel',      this._onWheel,  { passive: true });
      this.container.addEventListener('mousedown',  this._onDown);
      this.container.addEventListener('mousemove',  this._onMove);
      this.container.addEventListener('mouseleave', this._onLeave);
      window.addEventListener('mouseup',  this._onUp);
      this.container.addEventListener('touchstart', this._onDown,   { passive: true });
      this.container.addEventListener('touchmove',  this._onMove,   { passive: false });
      this.container.addEventListener('touchend',   this._onUp);
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize',  this._onResize);
      window.removeEventListener('mouseup', this._onUp);
      if (this.renderer?.gl?.canvas?.parentNode)
        this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }

  /* ─── Public API ────────────────────────────────────────── */
  window.CircularGallery = {
    init(container, items, options) {
      const el = typeof container === 'string' ? document.getElementById(container) : container;
      if (!el)       { console.error('CircularGallery: container not found →', container); return null; }
      if (!getOGL()) { console.error('CircularGallery: OGL not loaded (expected window.ogl)');  return null; }
      return new App(el, { items, ...(options || {}) });
    }
  };

})();
