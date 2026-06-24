/**
 * BorderGlow — Vanilla JS port of the React Bits component
 *
 * Usage: add  data-border-glow  to any element.
 * Optional data attributes:
 *   data-glow-radius   — border-radius in px (default: auto-detected)
 *   data-glow-bg       — card background hex for the border clip (default: #161616)
 *   data-glow-edge     — edge sensitivity 0-100 (default: 30)
 *   data-glow-padding  — outer glow reach in px (default: 40)
 */

(function () {
  'use strict';

  /* ── Brand colours (orange-red palette) ── */
  const BRAND_GLOW_COLOR = '11 100 60';   // HSL for #ff5637
  const BRAND_COLORS     = ['#ff5637', '#ffb4a5', '#ff8169'];

  /* ── Gradient position map (matches original React component) ── */
  const GRAD_POS  = ['80% 55%','69% 34%','8% 6%','41% 38%','86% 85%','82% 18%','51% 4%'];
  const GRAD_KEYS = ['--gradient-one','--gradient-two','--gradient-three','--gradient-four',
                     '--gradient-five','--gradient-six','--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

  /* ── Helpers ── */
  function parseHSL(str) {
    const m = str.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
    return m ? { h: +m[1], s: +m[2], l: +m[3] } : { h: 11, s: 100, l: 60 };
  }

  function buildGlowVars(hslStr, intensity) {
    const { h, s, l } = parseHSL(hslStr);
    const base = `${h}deg ${s}% ${l}%`;
    const ops  = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    ops.forEach((op, i) => {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(op * intensity, 100)}%)`;
    });
    return vars;
  }

  function buildGradientVars(colors) {
    const vars = {};
    GRAD_KEYS.forEach((key, i) => {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      vars[key] = `radial-gradient(at ${GRAD_POS[i]}, ${c} 0px, transparent 50%)`;
    });
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }

  function getCenter(el) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  function edgeProximity(el, x, y) {
    const [cx, cy] = getCenter(el);
    const dx = x - cx, dy = y - cy;
    let kx = Infinity, ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  function cursorAngle(el, x, y) {
    const [cx, cy] = getCenter(el);
    const dx = x - cx, dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg;
  }

  /* ── Detect computed border-radius in px ── */
  function getBorderRadiusPx(el) {
    const r = window.getComputedStyle(el).borderRadius;
    // parse the first value (top-left) — could be "px" or "rem" or "%"
    const val = parseFloat(r) || 0;
    if (r.includes('rem')) return val * 16;
    return val;
  }

  /* ── Core init function ── */
  function initBorderGlow(el) {
    if (el.dataset.glowInit) return;           // prevent double-init
    el.dataset.glowInit = '1';

    /* options from data attributes */
    const edgeSens  = parseFloat(el.dataset.glowEdge    || 30);
    const glowPad   = parseFloat(el.dataset.glowPadding || 40);
    const cardBg    = el.dataset.glowBg                || '#161616';
    const intensity = parseFloat(el.dataset.glowIntensity || 1.0);
    const fillOpacity = parseFloat(el.dataset.glowFillOpacity || 0.35);
    const coneSpread  = parseFloat(el.dataset.glowConeSpread || 25);
    const radius    = el.dataset.glowRadius != null
                        ? parseFloat(el.dataset.glowRadius)
                        : getBorderRadiusPx(el);

    /* Insert the edge-light span (absolutely positioned — no layout impact) */
    if (!el.querySelector(':scope > .edge-light')) {
      const light = document.createElement('span');
      light.className = 'edge-light';
      el.insertBefore(light, el.firstChild);
    }

    /* Mark as border-glow-card */
    el.classList.add('border-glow-card');

    /* Set CSS custom properties */
    const glowVars = buildGlowVars(BRAND_GLOW_COLOR, intensity);
    const gradVars = buildGradientVars(BRAND_COLORS);

    const allVars = {
      '--card-bg':          cardBg,
      '--edge-sensitivity': edgeSens,
      '--border-radius':    `${radius}px`,
      '--glow-padding':     `${glowPad}px`,
      '--cone-spread':      coneSpread,
      '--fill-opacity':     fillOpacity,
      ...glowVars,
      ...gradVars,
    };

    for (const [k, v] of Object.entries(allVars)) {
      el.style.setProperty(k, v);
    }

    /* Pointer tracking */
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      el.style.setProperty('--edge-proximity', (edgeProximity(el, x, y) * 100).toFixed(3));
      el.style.setProperty('--cursor-angle',   `${cursorAngle(el, x, y).toFixed(3)}deg`);
    });
  }

  /* ── Auto-initialise all [data-border-glow] elements ── */
  function initAll() {
    document.querySelectorAll('[data-border-glow]').forEach(initBorderGlow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
