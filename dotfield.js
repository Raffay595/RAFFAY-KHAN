class DotField {
  constructor(container, options = {}) {
    if (!container) return;
    this.container = container;
    this.options = Object.assign({
      dotRadius: 1.5,
      dotSpacing: 14,
      cursorRadius: 500,
      cursorForce: 0.1,
      bulgeOnly: true,
      bulgeStrength: 67,
      glowRadius: 160,
      sparkle: false,
      waveAmplitude: 0,
      gradientFrom: 'rgba(168, 85, 247, 0.35)',
      gradientTo: 'rgba(180, 151, 207, 0.25)',
      glowColor: '#120F17'
    }, options);

    this.canvas = null;
    this.svg = null;
    this.glowEl = null;
    this.ctx = null;
    this.dots = [];
    this.mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    this.size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    this.glowOpacity = 0;
    this.engagement = 0;
    this.frameCount = 0;
    this.rafId = null;
    this.speedInterval = null;
    this.resizeTimer = null;
    this.glowId = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`;

    this.init();
  }

  init() {
    this.container.classList.add('dot-field-container');

    // Create Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    // Create SVG for cursor glow overlay
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.style.inset = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.pointerEvents = 'none';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const radialGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    radialGrad.setAttribute('id', this.glowId);

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', this.options.glowColor);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', 'transparent');

    radialGrad.appendChild(stop1);
    radialGrad.appendChild(stop2);
    defs.appendChild(radialGrad);
    this.svg.appendChild(defs);

    this.glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.glowEl.setAttribute('cx', '-9999');
    this.glowEl.setAttribute('cy', '-9999');
    this.glowEl.setAttribute('r', this.options.glowRadius.toString());
    this.glowEl.setAttribute('fill', `url(#${this.glowId})`);
    this.glowEl.style.opacity = '0';
    this.glowEl.style.willChange = 'opacity';
    this.svg.appendChild(this.glowEl);

    this.container.appendChild(this.svg);

    this.ctx = this.canvas.getContext('2d', { alpha: true });

    // Bind methods
    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.tick = this.tick.bind(this);
    this.updateMouseSpeed = this.updateMouseSpeed.bind(this);

    // Event Listeners
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });

    this.speedInterval = setInterval(this.updateMouseSpeed, 20);

    this.doResize();
    this.rafId = requestAnimationFrame(this.tick);
  }

  resize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.doResize(), 100);
  }

  doResize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.size = {
      w,
      h,
      offsetX: rect.left + window.scrollX,
      offsetY: rect.top + window.scrollY,
    };

    this.buildDots(w, h);
  }

  buildDots(w, h) {
    const p = this.options;
    const step = p.dotRadius + p.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    const dots = new Array(rows * cols);
    let idx = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
    }
    this.dots = dots;
  }

  onMouseMove(e) {
    this.mouse.x = e.pageX - this.size.offsetX;
    this.mouse.y = e.pageY - this.size.offsetY;
  }

  updateMouseSpeed() {
    const m = this.mouse;
    const dx = m.prevX - m.x;
    const dy = m.prevY - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    m.speed += (dist - m.speed) * 0.5;
    if (m.speed < 0.001) m.speed = 0;
    m.prevX = m.x;
    m.prevY = m.y;
  }

  tick() {
    this.frameCount++;
    const dots = this.dots;
    const m = this.mouse;
    const { w, h } = this.size;
    const p = this.options;
    const len = dots.length;
    const t = this.frameCount * 0.02;

    const targetEngagement = Math.min(m.speed / 5, 1);
    this.engagement += (targetEngagement - this.engagement) * 0.06;
    if (this.engagement < 0.001) this.engagement = 0;
    const eng = this.engagement;

    this.glowOpacity += (eng - this.glowOpacity) * 0.08;

    if (this.glowEl) {
      this.glowEl.setAttribute('cx', m.x);
      this.glowEl.setAttribute('cy', m.y);
      this.glowEl.style.opacity = this.glowOpacity;
    }

    this.ctx.clearRect(0, 0, w, h);

    const grad = this.ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, p.gradientFrom);
    grad.addColorStop(1, p.gradientTo);
    this.ctx.fillStyle = grad;

    const cr = p.cursorRadius;
    const crSq = cr * cr;
    const rad = p.dotRadius / 2;
    const isBulge = p.bulgeOnly;

    this.ctx.beginPath();

    const TWO_PI = Math.PI * 2;

    for (let i = 0; i < len; i++) {
      const d = dots[i];
      if (!d) continue;
      const dx = m.x - d.ax;
      const dy = m.y - d.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && eng > 0.01) {
        const dist = Math.sqrt(distSq);
        if (isBulge) {
          const tVal = 1 - dist / cr;
          const push = tVal * tVal * p.bulgeStrength * eng;
          const angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          const angle = Math.atan2(dy, dx);
          const move = (500 / dist) * (m.speed * p.cursorForce);
          d.vx += Math.cos(angle) * -move;
          d.vy += Math.sin(angle) * -move;
        }
      } else if (isBulge) {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      if (!isBulge) {
        d.vx *= 0.9;
        d.vy *= 0.9;
        d.x = d.ax + d.vx;
        d.y = d.ay + d.vy;
        d.sx += (d.x - d.sx) * 0.1;
        d.sy += (d.y - d.sy) * 0.1;
      }

      let drawX = d.sx;
      let drawY = d.sy;
      if (p.waveAmplitude > 0) {
        drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
        drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
      }

      if (p.sparkle) {
        const hash = ((i * 2654435761) ^ (this.frameCount >> 3)) >>> 0;
        if ((hash % 100) < 3) {
          this.ctx.moveTo(drawX + rad * 1.8, drawY);
          this.ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
        } else {
          this.ctx.moveTo(drawX + rad, drawY);
          this.ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      } else {
        this.ctx.moveTo(drawX + rad, drawY);
        this.ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }
    }

    this.ctx.fill();

    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    clearInterval(this.speedInterval);
    clearTimeout(this.resizeTimer);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
    
    // Clean up elements
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }
}

// Make globally available or export if module environment is used
window.DotField = DotField;
