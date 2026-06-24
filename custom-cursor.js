/**
 * CustomCursor – premium dual-element cursor with lerp ring animation.
 *
 * • Inner dot tracks the mouse instantly (translate3d).
 * • Outer ring follows with smooth lerp easing (requestAnimationFrame).
 * • Interactive hover states for links/buttons, text inputs, and mouse-down.
 * • Fades out when the mouse leaves the viewport.
 * • Disabled on touch-only devices.
 * • No dependencies.
 */
(function () {
  'use strict';

  /* ── Bail on touch-only devices ── */
  if (typeof matchMedia !== 'undefined' &&
      matchMedia('(hover: none) and (pointer: coarse)').matches) {
    return;
  }

  /* ── Config ── */
  const LERP_SPEED = 0.15;          // ring easing (lower = more lag)
  const DOT_SIZE   = 8;
  const RING_SIZE  = 48;

  /* ── Selectors that trigger "hovering" state ── */
  const HOVER_SELECTORS = [
    'a', 'button', 'input[type="submit"]', 'input[type="button"]',
    '[role="button"]', '[data-border-glow]', '.nav-link',
    '.gooey-nav-inner a', '[data-profile-card]',
    'select', 'label[for]',
    '.group',                         // Tailwind group cards
  ].join(',');

  /* ── Selectors that trigger "text" state ── */
  const TEXT_SELECTORS = [
    'input[type="text"]', 'input[type="email"]', 'input[type="search"]',
    'input[type="password"]', 'input[type="url"]', 'input[type="tel"]',
    'textarea', '[contenteditable="true"]'
  ].join(',');

  /* ── Create DOM elements ── */
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  /* ── State ── */
  let mouseX    = -100;
  let mouseY    = -100;
  let ringX     = -100;
  let ringY     = -100;
  let visible   = false;
  let hovering  = false;
  let pressing  = false;
  let textMode  = false;
  let rafId     = null;

  /* ── Helpers ── */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function setVisible(v) {
    if (visible === v) return;
    visible = v;
    dot.classList.toggle('is-visible', v);
    ring.classList.toggle('is-visible', v);
    dot.classList.toggle('is-hidden', !v);
    ring.classList.toggle('is-hidden', !v);
  }

  function setHover(h) {
    if (hovering === h) return;
    hovering = h;
    dot.classList.toggle('is-hovering', h);
    ring.classList.toggle('is-hovering', h);
  }

  function setPress(p) {
    if (pressing === p) return;
    pressing = p;
    dot.classList.toggle('is-pressing', p);
    ring.classList.toggle('is-pressing', p);
  }

  function setText(t) {
    if (textMode === t) return;
    textMode = t;
    dot.classList.toggle('is-text', t);
    ring.classList.toggle('is-text', t);
  }

  /* ── rAF render loop ── */
  function render() {
    /* Lerp the ring toward the mouse */
    ringX = lerp(ringX, mouseX, LERP_SPEED);
    ringY = lerp(ringY, mouseY, LERP_SPEED);

    /* Get current sizes for centering (read from CSS via computed style) */
    const dw = dot.offsetWidth;
    const dh = dot.offsetHeight;
    const rw = ring.offsetWidth;
    const rh = ring.offsetHeight;

    /* Position with GPU-accelerated translate3d */
    dot.style.transform  = `translate3d(${mouseX - dw * 0.5}px, ${mouseY - dh * 0.5}px, 0)`;
    ring.style.transform = `translate3d(${ringX - rw * 0.5}px, ${ringY - rh * 0.5}px, 0)`;

    rafId = requestAnimationFrame(render);
  }

  /* ── Event: mouse move ── */
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!visible) setVisible(true);

    /* Check what we're hovering */
    const target = e.target;
    if (target && target.closest) {
      setText(!!target.closest(TEXT_SELECTORS));
      setHover(!textMode && !!target.closest(HOVER_SELECTORS));
    }
  }

  /* ── Event: mouse enter / leave viewport ── */
  function onMouseEnter() {
    setVisible(true);
  }

  function onMouseLeave() {
    setVisible(false);
  }

  /* ── Event: mouse down / up ── */
  function onMouseDown() {
    setPress(true);
  }

  function onMouseUp() {
    setPress(false);
  }

  /* ── Bind events ── */
  document.addEventListener('mousemove',  onMouseMove,  { passive: true });
  document.addEventListener('mouseenter', onMouseEnter);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mousedown',  onMouseDown);
  document.addEventListener('mouseup',    onMouseUp);

  /* ── Start render loop ── */
  rafId = requestAnimationFrame(render);

})();
