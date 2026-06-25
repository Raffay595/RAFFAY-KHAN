/* ========================================================================
   StaggeredMenu – Vanilla JS (adapted from React Bits)
   Uses GSAP for staggered panel + item entrance animations.
   Visible only on mobile / tablet (≤ 1024 px) via CSS.
   ======================================================================== */

(function () {
  'use strict';

  /* ---- Configuration ---- */
  const CONFIG = {
    position: 'right',
    colors: ['#2a1a14', '#ff5637'],          // stagger-layer colours
    accentColor: '#ff5637',
    menuButtonColor: '#e5e2e1',
    openMenuButtonColor: '#e5e2e1',
    changeMenuColorOnOpen: true,
    displayItemNumbering: false,
    items: [
      { label: 'Home',       ariaLabel: 'Go to top',             link: '#' },
      { label: 'About',      ariaLabel: 'Learn about me',        link: '#about' },
      { label: 'Experience', ariaLabel: 'View my experience',    link: '#experience' },
      { label: 'Services',   ariaLabel: 'View services offered', link: '#services' },
      { label: 'Skills',     ariaLabel: 'View my skills',        link: '#skills' },
      { label: 'Contact',    ariaLabel: 'Get in touch',          link: '#contact' }
    ]
  };

  /* ---- State ---- */
  let isOpen = false;
  let busy = false;

  /* ---- DOM refs (filled in init) ---- */
  let wrapper, panel, prelayersContainer, preLayers;
  let toggleBtn, iconEl, plusH, plusV, textWrap, textInner;

  /* ---- GSAP tweens / timelines ---- */
  let openTl, closeTween, spinTween, textCycleAnim, colorTween;

  /* ================================================================
     BUILD DOM
     ================================================================ */
  function buildDOM() {
    wrapper = document.createElement('div');
    wrapper.className = 'staggered-menu-wrapper';
    wrapper.style.setProperty('--sm-accent', CONFIG.accentColor);
    wrapper.setAttribute('data-position', CONFIG.position);

    /* ---- Pre-layers ---- */
    prelayersContainer = document.createElement('div');
    prelayersContainer.className = 'sm-prelayers';
    prelayersContainer.setAttribute('aria-hidden', 'true');

    let layerColors = CONFIG.colors.slice(0, 4);
    if (layerColors.length >= 3) {
      const mid = Math.floor(layerColors.length / 2);
      layerColors.splice(mid, 1);
    }
    layerColors.forEach(c => {
      const d = document.createElement('div');
      d.className = 'sm-prelayer';
      d.style.background = c;
      prelayersContainer.appendChild(d);
    });
    wrapper.appendChild(prelayersContainer);

    /* ---- Toggle button lives inside the main navbar ---- */
    toggleBtn = document.getElementById('sm-toggle-btn');
    textInner = document.getElementById('sm-toggle-textInner');
    iconEl    = document.getElementById('sm-icon');
    plusH     = document.getElementById('sm-plusH');
    plusV     = document.getElementById('sm-plusV');
    textWrap  = toggleBtn.querySelector('.sm-toggle-textWrap');

    /* ---- Panel ---- */
    panel = document.createElement('aside');
    panel.id = 'sm-panel';
    panel.className = 'sm-panel';
    panel.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'sm-panel-inner';

    const list = document.createElement('ul');
    list.className = 'sm-panel-list';
    list.setAttribute('role', 'list');
    if (CONFIG.displayItemNumbering) list.setAttribute('data-numbering', '');

    CONFIG.items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'sm-panel-itemWrap';
      const a = document.createElement('a');
      a.className = 'sm-panel-item';
      a.href = item.link;
      a.setAttribute('aria-label', item.ariaLabel);
      a.setAttribute('data-index', idx + 1);
      const span = document.createElement('span');
      span.className = 'sm-panel-itemLabel';
      span.textContent = item.label;
      a.appendChild(span);
      li.appendChild(a);
      list.appendChild(li);

      // Close menu on item click
      a.addEventListener('click', () => {
        closeMenu();
      });
    });

    inner.appendChild(list);
    panel.appendChild(inner);
    wrapper.appendChild(panel);

    document.body.appendChild(wrapper);
  }

  /* ---- helpers ---- */
  function setTextLines(lines) {
    textInner.innerHTML = '';
    lines.forEach(l => {
      const s = document.createElement('span');
      s.className = 'sm-toggle-line';
      s.textContent = l;
      textInner.appendChild(s);
    });
  }

  /* ================================================================
     GSAP INIT
     ================================================================ */
  function gsapInit() {
    preLayers = Array.from(prelayersContainer.querySelectorAll('.sm-prelayer'));

    const offscreen = CONFIG.position === 'left' ? -100 : 100;
    gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
    gsap.set(prelayersContainer, { xPercent: 0, opacity: 1 });
    gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
    gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
    gsap.set(iconEl, { rotate: 0, transformOrigin: '50% 50%' });
    gsap.set(textInner, { yPercent: 0 });
    gsap.set(toggleBtn, { color: CONFIG.menuButtonColor });
  }

  /* ================================================================
     OPEN TIMELINE
     ================================================================ */
  function buildOpenTimeline() {
    if (openTl) openTl.kill();
    if (closeTween) { closeTween.kill(); closeTween = null; }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));

    const offscreen = CONFIG.position === 'left' ? -100 : 100;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });

    const tl = gsap.timeline({ paused: true });

    // Pre-layers slide in
    preLayers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: offscreen }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = preLayers.length ? (preLayers.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (preLayers.length ? 0.08 : 0);
    const panelDuration = 0.65;

    // Panel slides in
    tl.fromTo(panel, { xPercent: offscreen }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    // Items entrance
    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(itemEls, {
        yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out',
        stagger: { each: 0.1, from: 'start' }
      }, itemsStart);

      if (numberEls.length) {
        tl.to(numberEls, {
          duration: 0.6, ease: 'power2.out', '--sm-num-opacity': 1,
          stagger: { each: 0.08, from: 'start' }
        }, itemsStart + 0.1);
      }
    }

    openTl = tl;
    return tl;
  }

  function playOpen() {
    if (busy) return;
    busy = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busy = false; });
      tl.play(0);
    } else {
      busy = false;
    }
  }

  /* ================================================================
     CLOSE
     ================================================================ */
  function playClose() {
    if (openTl) { openTl.kill(); openTl = null; }

    const all = [...preLayers, panel];
    if (closeTween) closeTween.kill();

    const offscreen = CONFIG.position === 'left' ? -100 : 100;
    closeTween = gsap.to(all, {
      xPercent: offscreen, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
        busy = false;
      }
    });
  }

  /* ================================================================
     ICON ANIMATION (plus → X)
     ================================================================ */
  function animateIcon(opening) {
    if (spinTween) spinTween.kill();
    if (opening) {
      spinTween = gsap.to(iconEl, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTween = gsap.to(iconEl, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }

  /* ================================================================
     BUTTON COLOUR ANIMATION
     ================================================================ */
  function animateColor(opening) {
    if (colorTween) colorTween.kill();
    if (CONFIG.changeMenuColorOnOpen) {
      const target = opening ? CONFIG.openMenuButtonColor : CONFIG.menuButtonColor;
      colorTween = gsap.to(toggleBtn, { color: target, delay: 0.18, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.set(toggleBtn, { color: CONFIG.menuButtonColor });
    }
  }

  /* ================================================================
     TEXT CYCLING ANIMATION
     ================================================================ */
  function animateText(opening) {
    if (textCycleAnim) textCycleAnim.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel  = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(textInner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnim = gsap.to(textInner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }

  /* ================================================================
     TOGGLE / CLOSE
     ================================================================ */
  function toggleMenu() {
    const target = !isOpen;
    isOpen = target;

    wrapper.setAttribute('data-open', target ? '' : undefined);
    if (!target) wrapper.removeAttribute('data-open');

    panel.setAttribute('aria-hidden', !target);
    toggleBtn.setAttribute('aria-label', target ? 'Close menu' : 'Open menu');
    toggleBtn.setAttribute('aria-expanded', target);

    if (target) {
      playOpen();
      document.body.style.overflow = 'hidden';
    } else {
      playClose();
      document.body.style.overflow = '';
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    wrapper.removeAttribute('data-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-label', 'Open menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
    document.body.style.overflow = '';
  }

  /* ================================================================
     CLICK-AWAY
     ================================================================ */
  function handleClickOutside(e) {
    if (!isOpen) return;
    if (panel.contains(e.target) || toggleBtn.contains(e.target)) return;
    closeMenu();
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    if (typeof gsap === 'undefined') {
      console.warn('[StaggeredMenu] GSAP not found – retrying in 100 ms');
      setTimeout(init, 100);
      return;
    }

    buildDOM();
    gsapInit();

    toggleBtn.addEventListener('click', toggleMenu);
    document.addEventListener('mousedown', handleClickOutside);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
