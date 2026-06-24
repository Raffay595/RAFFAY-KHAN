/**
 * ProfileCard — Vanilla JS port of the premium 3D Profile Card component
 *
 * Usage: add  data-profile-card  to any element.
 * Optional data attributes:
 *   data-pc-name         — Display name (default: "Javi A. Torres")
 *   data-pc-title        — Job title (default: "Software Engineer")
 *   data-pc-handle       — Username handle without @ (default: "javicodes")
 *   data-pc-status       — User status (default: "Online")
 *   data-pc-contact-text — Button text (default: "Contact")
 *   data-pc-avatar-url   — Main portrait image URL
 *   data-pc-mini-avatar-url — Small avatar image URL (default: same as avatar)
 *   data-pc-inner-gradient  — CSS gradient (default: brand dark gradient)
 *   data-pc-behind-glow-color — Glow color behind card (default: "rgba(255, 86, 55, 0.4)")
 *   data-pc-behind-glow-size  — Size of behind glow (default: "50%")
 */

(function () {
  'use strict';

  const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(255, 86, 55, 0.15) 100%)';
  const DEFAULT_BEHIND_GLOW_COLOR = 'rgba(255, 86, 55, 0.4)';
  const DEFAULT_BEHIND_GLOW_SIZE = '50%';

  const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    DEVICE_BETA_OFFSET: 20,
    ENTER_TRANSITION_MS: 180
  };

  const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
  const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
  const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

  function getOffsets(evt, el) {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function initProfileCard(wrap) {
    if (wrap.dataset.pcInit) return; // prevent double init
    wrap.dataset.pcInit = '1';

    /* Read options */
    const name = wrap.dataset.pcName || 'M Raffay Khan';
    const title = wrap.dataset.pcTitle || 'AI Automation Expert';
    const handle = wrap.dataset.pcHandle || 'raffaykhan';
    const status = wrap.dataset.pcStatus || 'Available';
    const contactText = wrap.dataset.pcContactText || 'Contact Me';
    const avatarUrl = wrap.dataset.pcAvatarUrl || '';
    const miniAvatarUrl = wrap.dataset.pcMiniAvatarUrl || avatarUrl;
    const innerGradient = wrap.dataset.pcInnerGradient || DEFAULT_INNER_GRADIENT;
    const behindGlowColor = wrap.dataset.pcBehindGlowColor || DEFAULT_BEHIND_GLOW_COLOR;
    const behindGlowSize = wrap.dataset.pcBehindGlowSize || DEFAULT_BEHIND_GLOW_SIZE;

    const enableTilt = wrap.dataset.pcEnableTilt !== 'false';
    const enableMobileTilt = wrap.dataset.pcEnableMobileTilt === 'true';
    const mobileTiltSensitivity = parseFloat(wrap.dataset.pcMobileTiltSensitivity || 5);

    /* Apply base styling & vars */
    wrap.classList.add('pc-card-wrapper');
    wrap.style.setProperty('--inner-gradient', innerGradient);
    wrap.style.setProperty('--behind-glow-color', behindGlowColor);
    wrap.style.setProperty('--behind-glow-size', behindGlowSize);

    /* Construct HTML Structure */
    wrap.innerHTML = `
      <div class="pc-behind"></div>
      <div class="pc-card-shell">
        <section class="pc-card">
          <div class="pc-inside">
            <div class="pc-shine"></div>
            <div class="pc-glare"></div>
            <div class="pc-content pc-avatar-content">
              <img class="avatar" src="${avatarUrl}" alt="Portrait" loading="lazy" />
              <div class="pc-quote-container">
                <p class="pc-quote-text">"Efficiency is not just about speed; it's about the intelligence of the system."</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    const shell = wrap.querySelector('.pc-card-shell');
    const avatarImg = wrap.querySelector('.avatar');

    // Handle error or broken images gracefully
    avatarImg.addEventListener('error', () => {
      avatarImg.style.display = 'none';
    });

    /* Tilt Engine configuration */
    if (!enableTilt) return;

    let rafId = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) {
        wrap.style.setProperty(k, v);
      }
    };

    const step = (ts) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    const tiltEngine = {
      setImmediate(x, y) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x, y) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };

    let enterTimer = null;
    let leaveRaf = null;

    shell.addEventListener('pointerenter', (event) => {
      shell.classList.add('active');
      shell.classList.add('entering');
      if (enterTimer) window.clearTimeout(enterTimer);
      enterTimer = window.setTimeout(() => {
        shell.classList.remove('entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    });

    shell.addEventListener('pointermove', (event) => {
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    });

    shell.addEventListener('pointerleave', () => {
      tiltEngine.toCenter();

      const checkSettle = () => {
        const { x, y, tx, ty } = tiltEngine.getCurrent();
        const settled = Math.hypot(tx - x, ty - y) < 0.6;
        if (settled) {
          shell.classList.remove('active');
          leaveRaf = null;
        } else {
          leaveRaf = requestAnimationFrame(checkSettle);
        }
      };
      if (leaveRaf) cancelAnimationFrame(leaveRaf);
      leaveRaf = requestAnimationFrame(checkSettle);
    });

    // Mobile device tiltorientation helper
    function handleDeviceOrientation(event) {
      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
      const y = clamp(
        centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
        0,
        shell.clientHeight
      );

      tiltEngine.setTarget(x, y);
    }

    shell.addEventListener('click', () => {
      if (!enableMobileTilt || window.location.protocol !== 'https:') return;
      const anyMotion = window.DeviceMotionEvent;
      if (anyMotion && typeof anyMotion.requestPermission === 'function') {
        anyMotion
          .requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    });

    /* Initial Animation kickoff */
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
  }

  function initAll() {
    document.querySelectorAll('[data-profile-card]').forEach(initProfileCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
