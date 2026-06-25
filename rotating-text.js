(function () {
  'use strict';

  function initRotatingText() {
    const targets = document.querySelectorAll('[data-rotating-text]');

    targets.forEach(target => {
      const wordsStr = target.getAttribute('data-rotating-text') || '';
      const words = wordsStr.split(',').map(w => w.trim()).filter(Boolean);
      if (words.length === 0) return;

      const interval = parseInt(target.getAttribute('data-interval')) || 2500;
      const stagger = parseFloat(target.getAttribute('data-stagger')) || 0.025;

      // Clear target and prepare container styling
      target.innerHTML = '';
      target.classList.add('rotating-text-container');

      // Create word elements
      const wordElements = words.map((word, wordIndex) => {
        const wordEl = document.createElement('div');
        wordEl.className = 'rotating-text-word';
        if (wordIndex === 0) {
          wordEl.classList.add('is-active');
        }

        // Split into characters (handles multi-byte and emoji characters properly)
        const chars = Array.from(word);
        chars.forEach((char, charIndex) => {
          const charEl = document.createElement('span');
          charEl.className = 'rotating-text-char';
          charEl.textContent = char === ' ' ? '\u00A0' : char; // Handle spaces properly
          charEl.style.setProperty('--delay', `${charIndex * stagger}s`);
          wordEl.appendChild(charEl);
        });

        target.appendChild(wordEl);
        return wordEl;
      });

      let currentIndex = 0;

      // Function to dynamically update container width to prevent layout snapping
      const updateContainerWidth = (el) => {
        const prevVisibility = el.style.visibility;
        const prevPosition = el.style.position;
        
        el.style.visibility = 'visible';
        el.style.position = 'relative';
        
        const width = el.getBoundingClientRect().width;
        
        el.style.visibility = prevVisibility;
        el.style.position = prevPosition;
        
        const style = window.getComputedStyle(target);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        
        target.style.width = `${width + paddingLeft + paddingRight}px`;
      };

      // Set initial width once fonts are fully loaded
      if (document.fonts) {
        document.fonts.ready.then(() => {
          updateContainerWidth(wordElements[0]);
        });
      } else {
        setTimeout(() => updateContainerWidth(wordElements[0]), 100);
      }

      // Handle window resizing
      window.addEventListener('resize', () => {
        updateContainerWidth(wordElements[currentIndex]);
      });

      // Rotation loop
      setInterval(() => {
        const currentWord = wordElements[currentIndex];
        const nextIndex = (currentIndex + 1) % wordElements.length;
        const nextWord = wordElements[nextIndex];

        // 1. Start exit animation on current word
        currentWord.classList.remove('is-active', 'animate-in');
        currentWord.classList.add('animate-out');

        // 2. Start enter animation on next word
        nextWord.classList.remove('animate-out');
        nextWord.classList.add('is-active', 'animate-in');

        // 3. Animate width of the parent container
        updateContainerWidth(nextWord);

        // 4. Clean up classes when animation completes
        const onExitEnd = (e) => {
          if (e.target === currentWord || currentWord.contains(e.target)) {
            currentWord.classList.remove('animate-out');
            currentWord.removeEventListener('animationend', onExitEnd);
          }
        };
        currentWord.addEventListener('animationend', onExitEnd);

        currentIndex = nextIndex;
      }, interval);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotatingText);
  } else {
    initRotatingText();
  }
})();
