document.addEventListener('DOMContentLoaded', () => {

    // --- DotField Canvas Background Initialization ---
    const aboutDotfieldContainer = document.getElementById('about-dotfield');
    if (aboutDotfieldContainer) {
        new DotField(aboutDotfieldContainer, {
            dotRadius: 1.5,
            dotSpacing: 14,
            cursorRadius: 500,
            cursorForce: 0.1,
            bulgeOnly: true,
            bulgeStrength: 67,
            glowRadius: 160,
            sparkle: false,
            waveAmplitude: 0,
            gradientFrom: 'rgba(255, 86, 55, 0.25)', // Primary orange-red matching design
            gradientTo: 'rgba(255, 180, 165, 0.15)',   // Primary-dim matching design
            glowColor: 'rgba(255, 86, 55, 0.12)'     // Soft background glow
        });
    }

    // --- Ballpit Physics Sandbox Initialization ---
    const initBallpit = () => {
        const skillsBallpitContainer = document.getElementById('skills-ballpit');
        if (skillsBallpitContainer && typeof window.createBallpit === 'function') {
            window.createBallpit(skillsBallpitContainer, {
                count: 90,
                gravity: 0.2,
                friction: 0.9975,
                wallBounce: 0.85,
                minSize: 0.3,
                maxSize: 0.65,
                lightIntensity: 120,
                colors: ['#ff5637', '#ffb4a5', '#ff8169', '#353534'], // Harmonized brand colors
                followCursor: true
            });
        } else if (skillsBallpitContainer) {
            setTimeout(initBallpit, 50);
        }
    };
    initBallpit();

    // --- Particles System Initialization ---
    const particlesContainer = document.getElementById('particles-root');
    const initParticles = () => {
        if (particlesContainer && window.ParticlesSystem) {
            new window.ParticlesSystem(particlesContainer, {
                particleColors: ["#ff5637", "#ffb4a5", "#ffffff"],
                particleCount: 1500,
                particleSpread: 15,
                speed: 0.15,
                particleBaseSize: 120,
                moveParticlesOnHover: true,
                alphaParticles: true,
                disableRotation: false
            });
        } else if (particlesContainer) {
            setTimeout(initParticles, 50);
        }
    };
    initParticles();




    // --- Header Background Change on Scroll ---
    const headerNav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            headerNav.classList.add('bg-background/80', 'py-3');
            headerNav.classList.remove('bg-background/10', 'py-4');
        } else {
            headerNav.classList.remove('bg-background/80', 'py-3');
            headerNav.classList.add('bg-background/10', 'py-4');
        }
    });

    // --- Intersection Observer Reveal Animation ---
    // Select elements to reveal
    const revealTargets = [
        'header', 
        'section',
        '.group',
        'form',
        '.glass-card',
        '.divide-y > div'
    ];

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, observerOptions);

    // Apply reveal styling classes and register targets
    revealTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('reveal-item');
            revealObserver.observe(el);
        });
    });

    // --- Scroll Spy: Dynamic Active Navigation Links ---
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-link');

    const spyObserverCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    };

    const spyObserverOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px' // Triggers active state when section reaches middle of viewport
    };

    const spyObserver = new IntersectionObserver(spyObserverCallback, spyObserverOptions);
    sections.forEach(sec => {
        if (sec.id) spyObserver.observe(sec);
    });

    // --- Contact Form Mock Handling ---
    const contactForm = document.getElementById('contact-form');
    const successDialog = document.getElementById('form-success');

    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const name = document.getElementById('form-name').value;
        const email = document.getElementById('form-email').value;
        const message = document.getElementById('form-message').value;

        // Visual loading state on the button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg> Sending Brief...
        `;

        // Simulate API call delay
        setTimeout(() => {
            // Hide the form with a fade animation
            contactForm.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                contactForm.style.display = 'none';
                
                // Show the success dialog
                successDialog.style.display = 'block';
                successDialog.classList.remove('hidden');
                successDialog.classList.add('opacity-100', 'scale-100', 'duration-500');
            }, 300);

            // Log details locally
            console.log("Mock lead generated successfully:", { name, email, message });
        }, 1500);
    });
});
