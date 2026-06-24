/**
 * GooeyNav — Vanilla JS port of the React Bits component
 *
 * Usage: Mark a wrapper element with data-gooey-nav.
 */

(function () {
  'use strict';

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i, t, d, r, count, colors) => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], count - i, count),
      end: getXY(d[1] + noise(7), count - i, count),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  };

  function makeParticles(element, options) {
    const d = options.particleDistances;
    const r = options.particleR;
    const count = options.particleCount;
    const colors = options.colors;
    const timeVariance = options.timeVariance;
    const animationTime = options.animationTime;

    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    for (let i = 0; i < count; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r, count, colors);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            // Do nothing
          }
        }, t);
      }, 30);
    }
  }

  function initGooeyNav(container) {
    if (container.dataset.gooeyInit) return; // prevent double init
    container.dataset.gooeyInit = '1';

    /* Read option attributes */
    const animationTime = parseInt(container.dataset.animationTime || 600);
    const particleCount = parseInt(container.dataset.particleCount || 15);
    const particleR = parseFloat(container.dataset.particleR || 100);
    const timeVariance = parseFloat(container.dataset.timeVariance || 300);

    const rawDistances = container.dataset.particleDistances || '90,10';
    const particleDistances = rawDistances.split(',').map(Number);

    const rawColors = container.dataset.colors || '1,2,3,1,2,3,1,4';
    const colors = rawColors.split(',').map(Number);

    const options = {
      animationTime,
      particleCount,
      particleR,
      timeVariance,
      particleDistances,
      colors
    };

    /* Build the inner wrapper if not present (add gooey-nav-inner class) */
    let inner = container.querySelector('.gooey-nav-inner');
    const ul = container.querySelector('ul');
    if (!ul) return;

    /* Append effect spans into the inner wrapper for correct relative positioning */
    const filterEl = document.createElement('span');
    filterEl.className = 'effect filter';
    if (inner) {
      inner.appendChild(filterEl);
    } else {
      container.appendChild(filterEl);
    }

    const textEl = document.createElement('span');
    textEl.className = 'effect text';
    if (inner) {
      inner.appendChild(textEl);
    } else {
      container.appendChild(textEl);
    }

    let activeIndex = -1;

    function updateIndicator(liEl, triggerParticles = true) {
      if (!liEl) return;

      /* Use inner wrapper for getBoundingClientRect reference */
      const refEl = inner || container;
      const containerRect = refEl.getBoundingClientRect();
      const pos = liEl.getBoundingClientRect();

      const styles = {
        left: `${pos.x - containerRect.x}px`,
        top: `${pos.y - containerRect.y}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`
      };

      Object.assign(filterEl.style, styles);
      Object.assign(textEl.style, styles);
      textEl.innerText = liEl.innerText;

      if (triggerParticles) {
        // Clear old particles
        const oldParticles = filterEl.querySelectorAll('.particle');
        oldParticles.forEach((p) => {
          try { filterEl.removeChild(p); } catch {}
        });

        textEl.classList.remove('active');
        void textEl.offsetWidth; // trigger reflow
        textEl.classList.add('active');

        makeParticles(filterEl, options);
      } else {
        textEl.classList.add('active');
      }
    }

    // Click handler to manually trigger active index changes
    const lis = ul.querySelectorAll('li');
    lis.forEach((li, idx) => {
      const a = li.querySelector('a');
      if (!a) return;

      a.addEventListener('click', (e) => {
        // Remove active class from all lis and as
        lis.forEach((el) => {
          el.classList.remove('active');
          el.querySelector('a')?.classList.remove('active');
        });

        li.classList.add('active');
        a.classList.add('active');
        activeIndex = idx;
        updateIndicator(li, true);
      });
    });

    // Mutation observer to synchronize with scroll spy class changes
    const observer = new MutationObserver(() => {
      // Find currently active link
      let activeIdx = -1;
      lis.forEach((li, idx) => {
        const a = li.querySelector('a');
        if (a && a.classList.contains('active')) {
          activeIdx = idx;
        }
      });

      if (activeIdx !== -1 && activeIdx !== activeIndex) {
        const previousIndex = activeIndex;
        activeIndex = activeIdx;

        // Synchronize active classes on the li element parent
        lis.forEach((li, idx) => {
          if (idx === activeIndex) {
            li.classList.add('active');
          } else {
            li.classList.remove('active');
          }
        });

        // Trigger transition (suppress particles on initial load)
        const triggerParticles = previousIndex !== -1;
        updateIndicator(lis[activeIndex], triggerParticles);
      }
    });

    // Observe active class changes on nav links
    lis.forEach((li) => {
      const a = li.querySelector('a');
      if (a) {
        observer.observe(a, { attributes: true, attributeFilter: ['class'] });
      }
    });

    // ResizeObserver to keep indicator correctly positioned when screen size changes
    const resizeObserver = new ResizeObserver(() => {
      if (activeIndex !== -1 && lis[activeIndex]) {
        updateIndicator(lis[activeIndex], false);
      }
    });
    resizeObserver.observe(container);

    // Initial position
    setTimeout(() => {
      let initialActiveLi = null;
      lis.forEach((li, idx) => {
        const a = li.querySelector('a');
        if (a && a.classList.contains('active')) {
          initialActiveLi = li;
          activeIndex = idx;
          li.classList.add('active');
        }
      });

      if (!initialActiveLi && lis.length > 0) {
        initialActiveLi = lis[0];
        activeIndex = 0;
        lis[0].classList.add('active');
        lis[0].querySelector('a')?.classList.add('active');
      }

      if (initialActiveLi) {
        updateIndicator(initialActiveLi, false);
      }
    }, 50);
  }

  function initAll() {
    document.querySelectorAll('[data-gooey-nav]').forEach(initGooeyNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
