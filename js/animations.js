/* ============================================================
   GREEN LIFE FLOWERS — ANIMATIONS CONTROLLER
   Handles: scroll reveal, nav, floating elements, parallax
   ============================================================ */

const Animations = (() => {

  /* ── Intersection Observer for scroll reveals ── */
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        } else {
          entry.target.classList.remove('revealed');
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px',
    });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(el => observer.observe(el));
  }

  /* ── Nav: scroll-based glass effect & hide-on-scroll-down ── */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          // Glass effect
          if (y > 20) nav.classList.add('scrolled');
          else nav.classList.remove('scrolled');

          // Hide on scroll down, show on scroll up
          if (y > lastY + 8 && y > 120) nav.classList.add('hidden');
          else if (y < lastY - 4) nav.classList.remove('hidden');

          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ── Smooth scroll for anchor links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height') || '80');
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── Falling Leaves — soft silhouettes matching the floating bg style ── */
  function initFallingLeaves() {
    // Hide the old canvas
    const canvas = document.getElementById('leafCanvas');
    if (canvas) canvas.style.display = 'none';

    // Container
    const container = document.createElement('div');
    container.id = 'fallingLeavesContainer';
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:899;overflow:hidden;';
    document.body.appendChild(container);

    // Soft silhouette leaf SVGs — matching the muted sage style already on the page
    const leafSVGs = [
      // Teardrop leaf
      `<svg viewBox="0 0 40 58"><path d="M20 2C20 2 4 15 4 31C4 46 12 56 20 56C28 56 36 46 36 31C36 15 20 2 20 2Z" fill="COLOR" opacity="OPACITY"/></svg>`,
      // Wider rounded leaf
      `<svg viewBox="0 0 52 68"><path d="M26 2C26 2 4 20 4 40C4 56 14 66 26 66C38 66 48 56 48 40C48 20 26 2 26 2Z" fill="COLOR" opacity="OPACITY"/></svg>`,
      // Small round leaf
      `<svg viewBox="0 0 24 38"><path d="M12 1C12 1 2 12 2 23C2 33 7 37 12 37C17 37 22 33 22 23C22 12 12 1 12 1Z" fill="COLOR" opacity="OPACITY"/></svg>`,
      // Oval leaf
      `<svg viewBox="0 0 36 50"><ellipse cx="18" cy="25" rx="16" ry="23" fill="COLOR" opacity="OPACITY"/></svg>`,
      // Pointy leaf
      `<svg viewBox="0 0 30 46"><path d="M15 2C15 2 2 16 2 28C2 40 8 44 15 44C22 44 28 40 28 28C28 16 15 2 15 2Z" fill="COLOR" opacity="OPACITY"/></svg>`,
    ];

    // Muted sage/green colors — same palette as floating-bg shapes
    const colors = ['#5A9460', '#3D8C44', '#82BF8A', '#6DB874', '#5A9460', '#82BF8A'];

    const LEAF_COUNT = Math.min(40, Math.max(16, Math.floor(window.innerWidth / 40)));

    for (let i = 0; i < LEAF_COUNT; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const svgTemplate = leafSVGs[Math.floor(Math.random() * leafSVGs.length)];
      const leafOpacity = (0.10 + Math.random() * 0.14).toFixed(2);
      const svg = svgTemplate.replace('COLOR', color).replace('OPACITY', leafOpacity);

      const leaf = document.createElement('div');
      leaf.className = 'falling-leaf';
      leaf.innerHTML = svg;

      const size = 30 + Math.random() * 40;
      const startX = Math.random() * 100;
      const duration = 12;
      const swayDuration = 3 + Math.random() * 4;
      const swayAmount = 50 + Math.random() * 80;
      const startRotate = Math.random() * 360;
      const rotateAmount = (Math.random() - 0.5) * 540;

      // Force this leaf to start at a specific % through the fall
      // i/LEAF_COUNT gives even spread: leaf 0 at 0%, leaf 1 at ~3%, etc.
      const startPercent = i / LEAF_COUNT;
      const negDelay = -(startPercent * duration).toFixed(2);

      leaf.style.cssText = `
        position: absolute;
        top: -80px;
        left: ${startX}%;
        width: ${size}px;
        height: auto;
        opacity: 1;
        animation:
          leafFall ${duration}s ${negDelay}s linear infinite,
          leafSway ${swayDuration}s ${negDelay}s ease-in-out infinite alternate,
          leafSpin ${duration * 0.7}s ${negDelay}s linear infinite;
        --sway: ${swayAmount}px;
        --rotate-start: ${startRotate}deg;
        --rotate-end: ${startRotate + rotateAmount}deg;
      `;

      container.appendChild(leaf);
    }
  }

  /* ── Floating background botanical corner shapes ── */
  function initFloatingBg() {
    const container = document.querySelector('.floating-bg');
    if (!container) return;

    const shapes = [
      `<svg viewBox="0 0 40 58" fill="none"><path d="M20 2C20 2 4 15 4 31C4 46 12 56 20 56C28 56 36 46 36 31C36 15 20 2 20 2Z" fill="#5A9460" opacity="0.12"/><line x1="20" y1="56" x2="20" y2="14" stroke="#82BF8A" stroke-width="1.5" opacity="0.08"/></svg>`,
      `<svg viewBox="0 0 52 68" fill="none"><path d="M26 2C26 2 4 20 4 40C4 56 14 66 26 66C38 66 48 56 48 40C48 20 26 2 26 2Z" fill="#3D8C44" opacity="0.10"/><line x1="26" y1="66" x2="26" y2="20" stroke="#6DB874" stroke-width="2" opacity="0.06"/></svg>`,
      `<svg viewBox="0 0 24 38" fill="none"><path d="M12 1C12 1 2 12 2 23C2 33 7 37 12 37C17 37 22 33 22 23C22 12 12 1 12 1Z" fill="#5A9460" opacity="0.10"/><line x1="12" y1="37" x2="12" y2="10" stroke="#82BF8A" stroke-width="1" opacity="0.06"/></svg>`,
      `<svg viewBox="0 0 20 28" fill="none"><path d="M10 1C10 1 1 9 1 17C1 23 5 27 10 27C15 27 19 23 19 17C19 9 10 1 10 1Z" fill="#6DB874" opacity="0.08"/></svg>`,
      `<svg viewBox="0 0 40 58" fill="none"><path d="M20 2C20 2 4 15 4 31C4 46 12 56 20 56C28 56 36 46 36 31C36 15 20 2 20 2Z" fill="#3D8C44" opacity="0.09"/></svg>`,
      `<svg viewBox="0 0 30 46" fill="none"><path d="M15 2C15 2 2 16 2 28C2 40 8 44 15 44C22 44 28 40 28 28C28 16 15 2 15 2Z" fill="#5A9460" opacity="0.10"/><line x1="15" y1="44" x2="15" y2="15" stroke="#82BF8A" stroke-width="1.2" opacity="0.06"/></svg>`,
    ];

    const positions = [
      { top: '6%',  left: '1%',  size: 90,  rotate: -20 },
      { top: '30%', left: '97%', size: 120, rotate: 18  },
      { top: '62%', left: '0%',  size: 75,  rotate: -35 },
      { top: '80%', left: '96%', size: 60,  rotate: 25  },
      { top: '12%', left: '94%', size: 65,  rotate: 40  },
      { top: '50%', left: '2%',  size: 80,  rotate: -15 },
    ];

    shapes.forEach((svg, i) => {
      const pos = positions[i] || positions[0];
      const el  = document.createElement('div');
      el.className = 'float-el';
      el.style.cssText = `
        top: ${pos.top};
        left: ${pos.left};
        width: ${pos.size}px;
        height: ${pos.size * 1.35}px;
        transform: rotate(${pos.rotate}deg);
      `;
      el.innerHTML = svg;
      container.appendChild(el);
    });
  }

  /* ── Hero image parallax ── */
  function initParallax() {
    const heroImg = document.querySelector('.hero-bg img');
    if (!heroImg) return;

    // Mark as loaded after a tick
    setTimeout(() => heroImg.classList.add('loaded'), 100);

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) {
        heroImg.style.transform = `scale(1.05) translateY(${y * 0.25}px)`;
      }
    }, { passive: true });
  }

  /* ── Mobile nav toggle ── */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-mobile-toggle');
    const links  = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelectorAll('span').forEach((span, i) => {
        if (isOpen) {
          if (i === 0) span.style.transform = 'translateY(6.5px) rotate(45deg)';
          if (i === 1) span.style.opacity = '0';
          if (i === 2) span.style.transform = 'translateY(-6.5px) rotate(-45deg)';
        } else {
          span.style.transform = '';
          span.style.opacity = '';
        }
      });
    });

    // Close on link click
    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('mobile-open');
        toggle.querySelectorAll('span').forEach(s => {
          s.style.transform = '';
          s.style.opacity = '';
        });
      });
    });
  }

  /* ── Category filter animation ── */
  function initCategoryFilter() {
    const catBtns    = document.querySelectorAll('.cat-btn');
    const productGrid = document.getElementById('productsGrid');
    if (!catBtns.length || !productGrid) return;

    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category;

        // Update active state
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter cards
        const cards = productGrid.querySelectorAll('.product-card');
        cards.forEach(card => {
          const cardCat = card.dataset.category;
          const show = cat === 'all' || cardCat === cat;
          if (show) {
            card.classList.remove('filtered-out');
            card.style.display = '';
          } else {
            card.classList.add('filtered-out');
            // After transition, hide from layout
            setTimeout(() => {
              if (card.classList.contains('filtered-out')) {
                card.style.display = 'none';
              }
            }, 360);
          }
        });
      });
    });
  }

  /* ── Page loader ── */
  function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    setTimeout(() => loader.classList.add('hidden'), 600);
  }

  /* ── Page Transition — fade out before navigating ── */
  function initPageTransitions() {
    document.addEventListener('click', e => {
      // Skip if another handler already prevented default (e.g. admin 5-click)
      if (e.defaultPrevented) return;

      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      // Skip anchor links, external links, javascript:, #, empty, new-tab
      if (!href || href.startsWith('#') || href.startsWith('javascript')
          || href.startsWith('http') || link.target === '_blank') return;

      // Skip if modifier key held (open in new tab)
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;

      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 220);
    });
  }

  /* ── Init all ── */
  function init() {
    initNav();
    initSmoothScroll();
    initScrollReveal();
    initFloatingBg();
    // initFallingLeaves(); — disabled
    initParallax();
    initMobileNav();
    initCategoryFilter();
    initPageTransitions();
    hideLoader();
  }

  return { init, initScrollReveal, showToast: null };
})();
