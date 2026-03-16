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
          // Don't unobserve — keep revealed state
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
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

  /* ── Falling Leaves Canvas Animation ── */
  function initFallingLeaves() {
    const canvas = document.getElementById('leafCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    // Leaf color palette — soft greens
    const leafColors = [
      'rgba(90,148,96,0.45)',
      'rgba(61,140,68,0.35)',
      'rgba(130,191,138,0.40)',
      'rgba(78,145,84,0.30)',
      'rgba(46,107,53,0.38)',
      'rgba(110,175,117,0.32)',
    ];

    // Leaf shapes (simple botanical leaf paths)
    function drawLeaf(ctx, x, y, size, angle, colorIdx) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = leafColors[colorIdx % leafColors.length];
      ctx.strokeStyle = leafColors[(colorIdx + 2) % leafColors.length].replace(/[\d.]+\)$/, '0.25)');
      ctx.lineWidth = 0.5;

      const s = size;
      ctx.beginPath();
      // Teardrop leaf shape
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.7, -s * 0.6, s * 0.6, s * 0.4, 0, s);
      ctx.bezierCurveTo(-s * 0.6, s * 0.4, -s * 0.7, -s * 0.6, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Midrib
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 0.85);
      ctx.strokeStyle = leafColors[(colorIdx + 1) % leafColors.length].replace(/[\d.]+\)$/, '0.18)');
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // Create leaves
    function makeLeaf() {
      return {
        x: Math.random() * W,
        y: -20 - Math.random() * 100,
        size: 6 + Math.random() * 10,
        speedY: 0.4 + Math.random() * 0.7,
        speedX: (Math.random() - 0.5) * 0.6,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.018,
        swayAmp: 12 + Math.random() * 20,
        swayFreq: 0.006 + Math.random() * 0.008,
        swayOffset: Math.random() * Math.PI * 2,
        colorIdx: Math.floor(Math.random() * leafColors.length),
        opacity: 0.35 + Math.random() * 0.45,
        t: Math.random() * 1000,
      };
    }

    const LEAF_COUNT = Math.min(28, Math.floor(W / 45));
    const leaves = Array.from({ length: LEAF_COUNT }, makeLeaf);
    // Spread initial vertical positions so they don't all start at top
    leaves.forEach((leaf, i) => {
      leaf.y = -20 + (i / LEAF_COUNT) * H * 1.2;
    });

    let rafId;
    let paused = false;

    function animate() {
      ctx.clearRect(0, 0, W, H);

      leaves.forEach(leaf => {
        leaf.t += 1;
        leaf.y += leaf.speedY;
        leaf.x += leaf.speedX + Math.sin(leaf.t * leaf.swayFreq + leaf.swayOffset) * 0.35;
        leaf.angle += leaf.angleSpeed;

        // Reset when off screen
        if (leaf.y > H + 30) {
          leaf.y = -20 - Math.random() * 40;
          leaf.x = Math.random() * W;
          leaf.colorIdx = Math.floor(Math.random() * leafColors.length);
          leaf.size = 6 + Math.random() * 10;
          leaf.speedY = 0.4 + Math.random() * 0.7;
        }

        ctx.globalAlpha = leaf.opacity;
        drawLeaf(ctx, leaf.x, leaf.y, leaf.size, leaf.angle, leaf.colorIdx);
      });

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    }

    // Pause when tab is hidden for performance
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused && !rafId) animate();
    });

    // Resize handler
    window.addEventListener('resize', () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    }, { passive: true });

    animate();
  }

  /* ── Floating background botanical corner shapes ── */
  function initFloatingBg() {
    const container = document.querySelector('.floating-bg');
    if (!container) return;

    const shapes = [
      `<svg viewBox="0 0 40 58" fill="none"><path d="M20 2C20 2 4 15 4 31C4 46 12 56 20 56C28 56 36 46 36 31C36 15 20 2 20 2Z" fill="#2E6B35" opacity="0.5"/><line x1="20" y1="56" x2="20" y2="14" stroke="#5A9460" stroke-width="1.5" opacity="0.35"/></svg>`,
      `<svg viewBox="0 0 52 68" fill="none"><path d="M26 2C26 2 4 20 4 40C4 56 14 66 26 66C38 66 48 56 48 40C48 20 26 2 26 2Z" fill="#1A2E1C" opacity="0.4"/><line x1="26" y1="66" x2="26" y2="20" stroke="#4E9455" stroke-width="2" opacity="0.3"/></svg>`,
      `<svg viewBox="0 0 24 38" fill="none"><path d="M12 1C12 1 2 12 2 23C2 33 7 37 12 37C17 37 22 33 22 23C22 12 12 1 12 1Z" fill="#3D8C44" opacity="0.45"/><line x1="12" y1="37" x2="12" y2="10" stroke="#6DB874" stroke-width="1" opacity="0.3"/></svg>`,
      `<svg viewBox="0 0 20 28" fill="none"><path d="M10 1C10 1 1 9 1 17C1 23 5 27 10 27C15 27 19 23 19 17C19 9 10 1 10 1Z" fill="#5A9460" opacity="0.4"/></svg>`,
      `<svg viewBox="0 0 40 58" fill="none"><path d="M20 2C20 2 4 15 4 31C4 46 12 56 20 56C28 56 36 46 36 31C36 15 20 2 20 2Z" fill="#2E6B35" opacity="0.35"/></svg>`,
      `<svg viewBox="0 0 30 46" fill="none"><path d="M15 2C15 2 2 16 2 28C2 40 8 44 15 44C22 44 28 40 28 28C28 16 15 2 15 2Z" fill="#3D8C44" opacity="0.38"/><line x1="15" y1="44" x2="15" y2="15" stroke="#82BF8A" stroke-width="1.2" opacity="0.25"/></svg>`,
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

  /* ── Init all ── */
  function init() {
    initNav();
    initSmoothScroll();
    initScrollReveal();
    initFloatingBg();
    initFallingLeaves();
    initParallax();
    initMobileNav();
    initCategoryFilter();
    hideLoader();
  }

  return { init, initScrollReveal, showToast: null };
})();
