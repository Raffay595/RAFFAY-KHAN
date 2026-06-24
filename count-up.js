(function () {
  'use strict';

  function animateCount(el) {
    const from = parseFloat(el.getAttribute('data-from') || '0');
    const to = parseFloat(el.getAttribute('data-to') || '0');
    const duration = parseFloat(el.getAttribute('data-duration') || '5') * 1000;
    const delay = parseFloat(el.getAttribute('data-delay') || '0') * 1000;
    const separator = el.getAttribute('data-separator') || '';

    // Calculate decimal places
    const getDecimals = num => {
      const str = num.toString();
      if (str.includes('.')) {
        const dec = str.split('.')[1];
        return dec.length;
      }
      return 0;
    };
    const decimals = Math.max(getDecimals(from), getDecimals(to));

    // Formatter
    const formatValue = val => {
      const options = {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: !!separator
      };
      let formatted = Intl.NumberFormat('en-US', options).format(val);
      if (separator && separator !== ',') {
        formatted = formatted.replace(/,/g, separator);
      }
      return formatted;
    };

    // Easing: smooth easeOutQuart to mimic spring response
    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

    let started = false;

    const run = () => {
      if (started) return;
      started = true;

      // Set initial value text immediately before starting timer
      el.textContent = formatValue(from);

      setTimeout(() => {
        const startTime = performance.now();

        const step = now => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = easeOutQuart(progress);
          const currentVal = from + (to - from) * eased;

          el.textContent = formatValue(currentVal);

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = formatValue(to);
          }
        };

        requestAnimationFrame(step);
      }, delay);
    };

    // Use IntersectionObserver to trigger when in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            run();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
  }

  function init() {
    document.querySelectorAll('[data-count-up]').forEach(animateCount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
