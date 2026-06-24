/**
 * GradualBlur – Vanilla JS port of the React Bits component.
 *
 * Creates stacked layers of increasing backdrop-filter blur masked by
 * linear gradients, producing a smooth fade-to-blur effect at the
 * edge of a container.
 *
 * Usage:
 *   GradualBlur.create(parentElement, {
 *     position:    'bottom',   // 'top' | 'bottom' | 'left' | 'right'
 *     strength:    2,          // blur multiplier
 *     height:      '6rem',     // overlay size
 *     divCount:    5,          // number of blur layers
 *     curve:       'bezier',   // 'linear' | 'bezier' | 'ease-in' | 'ease-out'
 *     exponential: true,       // exponential blur progression
 *     opacity:     1,          // layer opacity
 *     zIndex:      1000        // z-index of the overlay
 *   });
 *
 * No dependencies.
 */
(function () {
  'use strict';

  /* ── Curve functions ── */
  var CURVES = {
    linear:      function (p) { return p; },
    bezier:      function (p) { return p * p * (3 - 2 * p); },
    'ease-in':   function (p) { return p * p; },
    'ease-out':  function (p) { return 1 - Math.pow(1 - p, 2); },
    'ease-in-out': function (p) {
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    }
  };

  /* ── Gradient direction ── */
  var DIRECTIONS = {
    top: 'to top', bottom: 'to bottom',
    left: 'to left', right: 'to right'
  };

  /**
   * Build the blur overlay and append it to `parent`.
   * @param {HTMLElement} parent
   * @param {Object}      opts
   * @returns {HTMLElement} the container element
   */
  function create(parent, opts) {
    opts = opts || {};
    var position    = opts.position    || 'bottom';
    var strength    = opts.strength    || 2;
    var height      = opts.height      || '6rem';
    var divCount    = opts.divCount    || 5;
    var curve       = opts.curve       || 'linear';
    var exponential = !!opts.exponential;
    var opacity     = opts.opacity != null ? opts.opacity : 1;
    var zIndex      = opts.zIndex      || 1000;

    var curveFunc = CURVES[curve] || CURVES.linear;
    var direction = DIRECTIONS[position] || 'to bottom';
    var isVertical = position === 'top' || position === 'bottom';

    /* ── Container ── */
    var container = document.createElement('div');
    container.className = 'gradual-blur';
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.zIndex = zIndex;

    if (isVertical) {
      container.style.height = height;
      container.style.width = opts.width || '100%';
      container.style[position] = '0';
      container.style.left = '0';
      container.style.right = '0';
    } else {
      container.style.width = opts.width || height;
      container.style.height = '100%';
      container.style[position] = '0';
      container.style.top = '0';
      container.style.bottom = '0';
    }

    /* ── Inner wrapper ── */
    var inner = document.createElement('div');
    inner.className = 'gradual-blur-inner';
    container.appendChild(inner);

    /* ── Generate blur layers ── */
    var increment = 100 / divCount;

    for (var i = 1; i <= divCount; i++) {
      var progress = curveFunc(i / divCount);

      var blurValue;
      if (exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * strength;
      }

      var p1 = Math.round((increment * i - increment) * 10) / 10;
      var p2 = Math.round(increment * i * 10) / 10;
      var p3 = Math.round((increment * i + increment) * 10) / 10;
      var p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      var gradient = 'transparent ' + p1 + '%, black ' + p2 + '%';
      if (p3 <= 100) gradient += ', black ' + p3 + '%';
      if (p4 <= 100) gradient += ', transparent ' + p4 + '%';

      var maskValue = 'linear-gradient(' + direction + ', ' + gradient + ')';

      var layer = document.createElement('div');
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.maskImage = maskValue;
      layer.style.webkitMaskImage = maskValue;
      layer.style.backdropFilter = 'blur(' + blurValue.toFixed(3) + 'rem)';
      layer.style.webkitBackdropFilter = 'blur(' + blurValue.toFixed(3) + 'rem)';
      layer.style.opacity = opacity;

      inner.appendChild(layer);
    }

    /* ── Append ── */
    // Ensure parent has relative positioning
    var parentPos = window.getComputedStyle(parent).position;
    if (parentPos === 'static' || parentPos === '') {
      parent.style.position = 'relative';
    }

    parent.appendChild(container);
    return container;
  }

  /* ── Public API ── */
  window.GradualBlur = { create: create };

})();
