/* ============================================================
   GREEN LIFE FLOWERS — FLASHY HOME ANIMATIONS
   Maximalist botanical luxury — orbs, streaks, shimmer, glow
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. HERO PARALLAX + ZOOM ── */
  function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg img');
    const heroContent = document.querySelector('.hero-content');
    if (!heroBg) return;
    let t = false;
    window.addEventListener('scroll', () => {
      if (!t) { requestAnimationFrame(() => {
        const s = window.scrollY, h = window.innerHeight;
        if (s < h * 1.3) {
          const p = s / h;
          heroBg.style.transform = `scale(${1.04 - p * 0.04}) translateY(${s * 0.18}px)`;
          if (heroContent) {
            heroContent.style.opacity = Math.max(0, 1 - p * 1.5);
            heroContent.style.transform = `translateY(${s * 0.1}px)`;
          }
        }
        t = false;
      }); t = true; }
    });
  }

  /* ── 2. SCROLL PROGRESS BAR with glow ── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#3D8C44,#52A85A,#82BF8A,#52A85A,#3D8C44);background-size:200% 100%;z-index:9999;width:0%;pointer-events:none;box-shadow:0 0 12px rgba(82,168,90,0.6),0 0 4px rgba(82,168,90,0.3);animation:progressShimmer 3s linear infinite;';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        bar.style.width = (p * 100) + '%';
      });
    });
  }

  /* ── 3. FLOATING ORB FIELD — large drifting gradient spheres ── */
  function initOrbField() {
    document.querySelectorAll('.hiw-section, .why-section').forEach(section => {
      const c = document.createElement('div');
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0';

      const orbConfigs = [
        { s: 280, x: 5,  y: 15, d: 20, c: 'rgba(82,168,90,0.08)' },
        { s: 200, x: 80, y: 55, d: 26, c: 'rgba(130,191,138,0.06)' },
        { s: 240, x: 45, y: 75, d: 23, c: 'rgba(90,148,96,0.07)' },
        { s: 160, x: 90, y: 10, d: 18, c: 'rgba(61,140,68,0.08)' },
        { s: 180, x: 20, y: 45, d: 30, c: 'rgba(130,191,138,0.05)' },
        { s: 120, x: 65, y: 30, d: 22, c: 'rgba(82,168,90,0.06)' },
      ];

      orbConfigs.forEach((o, i) => {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;width:${o.s}px;height:${o.s}px;border-radius:50%;background:radial-gradient(circle,${o.c},transparent 70%);top:${o.y}%;left:${o.x}%;animation:orbDrift${i%3} ${o.d}s ease-in-out infinite;filter:blur(1px);`;
        c.appendChild(el);
      });

      section.insertBefore(c, section.firstChild);
    });
  }

  /* ── 4. SPARKLE PARTICLES — twinkling stars scattered in dark sections ── */
  function initSparkles() {
    document.querySelectorAll('.hiw-section, .why-section').forEach(section => {
      const c = document.createElement('div');
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1';

      for (let i = 0; i < 35; i++) {
        const spark = document.createElement('div');
        const size = 1.5 + Math.random() * 3.5;
        const dur = 2 + Math.random() * 4;
        const delay = -Math.random() * dur;
        spark.style.cssText = `
          position:absolute;
          top:${Math.random()*100}%;left:${Math.random()*100}%;
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:rgba(130,191,138,${0.3 + Math.random()*0.5});
          box-shadow:0 0 ${4+Math.random()*6}px rgba(130,191,138,${0.2+Math.random()*0.3});
          animation:sparkle ${dur}s ${delay}s ease-in-out infinite;
        `;
        c.appendChild(spark);
      }
      section.appendChild(c);
    });
  }

  /* ── 5. SHOOTING LIGHT STREAKS — diagonal lines that fly across ── */
  function initLightStreaks() {
    document.querySelectorAll('.hiw-section, .why-section').forEach(section => {
      const c = document.createElement('div');
      c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1';

      for (let i = 0; i < 4; i++) {
        const streak = document.createElement('div');
        const top = 15 + Math.random() * 70;
        const dur = 6 + Math.random() * 8;
        const delay = i * 3 + Math.random() * 4;
        const angle = -25 + Math.random() * 10;
        streak.style.cssText = `
          position:absolute;
          top:${top}%;left:-120px;
          width:120px;height:1px;
          background:linear-gradient(90deg,transparent,rgba(130,191,138,0.35),rgba(130,191,138,0.15),transparent);
          transform:rotate(${angle}deg);
          animation:shootStreak ${dur}s ${delay}s linear infinite;
          filter:blur(0.5px);
        `;
        c.appendChild(streak);
      }
      section.appendChild(c);
    });
  }

  /* ── 6. BREATHING EDGE GLOW — top/bottom borders pulse ── */
  function initBreathingEdges() {
    document.querySelectorAll('.hiw-section, .why-section').forEach(section => {
      ['top', 'bottom'].forEach((pos, i) => {
        const edge = document.createElement('div');
        edge.setAttribute('aria-hidden', 'true');
        edge.style.cssText = `
          position:absolute;${pos}:0;left:0;right:0;height:1px;z-index:2;
          background:linear-gradient(90deg,transparent 5%,rgba(130,191,138,0.15) 20%,rgba(130,191,138,0.4) 50%,rgba(130,191,138,0.15) 80%,transparent 95%);
          animation:edgeBreathe 4s ${i*2}s ease-in-out infinite;
        `;
        section.appendChild(edge);

        // Add a wider soft glow behind the line
        const glow = document.createElement('div');
        glow.setAttribute('aria-hidden', 'true');
        glow.style.cssText = `
          position:absolute;${pos}:-4px;left:10%;right:10%;height:8px;z-index:1;
          background:linear-gradient(90deg,transparent,rgba(130,191,138,0.08) 30%,rgba(130,191,138,0.12) 50%,rgba(130,191,138,0.08) 70%,transparent);
          animation:edgeBreathe 4s ${i*2}s ease-in-out infinite;
          filter:blur(4px);
        `;
        section.appendChild(glow);
      });
    });
  }

  /* ── 7. CARD HOVER GLOW RING ── */
  function initCardGlow() {
    const allCards = document.querySelectorAll('.hiw-step, .why-card');
    allCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0 30px rgba(130,191,138,0.15), 0 8px 32px rgba(0,0,0,0.2), inset 0 0 30px rgba(130,191,138,0.03)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
  }

  /* ── 8. ICON HOVER EFFECTS ── */
  function initIconEffects() {
    document.querySelectorAll('.hiw-step-icon, .why-card-icon').forEach(icon => {
      icon.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease';
      icon.parentElement.closest('.hiw-step, .why-card')?.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.15) rotate(-5deg)';
        icon.style.boxShadow = '0 0 20px rgba(130,191,138,0.3)';
      });
      icon.parentElement.closest('.hiw-step, .why-card')?.addEventListener('mouseleave', () => {
        icon.style.transform = '';
        icon.style.boxShadow = '';
      });
    });
  }

  /* ── 9. ANIMATED GRADIENT SHIMMER on section headers ── */
  function initHeaderShimmer() {
    document.querySelectorAll('.hiw-section .section-header h2, .hiw-section [style*="font-size:clamp"]').forEach(h => {
      h.style.background = 'linear-gradient(90deg, #e8f2e9 0%, #82BF8A 25%, #e8f2e9 50%, #82BF8A 75%, #e8f2e9 100%)';
      h.style.backgroundSize = '200% auto';
      h.style.webkitBackgroundClip = 'text';
      h.style.webkitTextFillColor = 'transparent';
      h.style.backgroundClip = 'text';
      h.style.animation = 'textShimmer 6s linear infinite';
    });
  }

  /* ── 10. MOUSE TRAIL GLOW in dark sections ── */
  function initMouseGlow() {
    document.querySelectorAll('.hiw-section, .why-section').forEach(section => {
      const glow = document.createElement('div');
      glow.setAttribute('aria-hidden', 'true');
      glow.style.cssText = 'position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(130,191,138,0.07),transparent 70%);pointer-events:none;z-index:0;opacity:0;transition:opacity 0.3s ease;filter:blur(2px);transform:translate(-50%,-50%);';
      section.appendChild(glow);

      section.addEventListener('mousemove', (e) => {
        const rect = section.getBoundingClientRect();
        glow.style.left = (e.clientX - rect.left) + 'px';
        glow.style.top = (e.clientY - rect.top) + 'px';
        glow.style.opacity = '1';
      });
      section.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
      });
    });
  }

  /* ── 11. DELIVERY NOTICE EFFECTS ── */
  function initDeliveryEffects() {
    const d = document.querySelector('.hiw-delivery');
    if (!d) return;
    const svg = d.querySelector('svg');
    if (svg) svg.style.animation = 'calendarPulse 3s ease-in-out infinite';
  }

  /* ── 12. FEATURES STRIP COUNTER ANIMATION ── */
  function initFeatureStripGlow() {
    document.querySelectorAll('.feature-icon').forEach((icon, i) => {
      icon.style.animation = `featureGlow 3s ${i * 0.5}s ease-in-out infinite`;
    });
  }

  /* ── 13. CTA SECTION PULSE ── */
  function initCtaPulse() {
    const cta = document.querySelector('.cta-section');
    if (!cta) return;
    const btns = cta.querySelectorAll('.btn-primary');
    btns.forEach(btn => {
      btn.style.animation = 'btnPulse 3s ease-in-out infinite';
    });
  }

  /* ── INJECT ALL KEYFRAMES ── */
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      /* Orb drifting */
      @keyframes orbDrift0 {
        0%,100%{transform:translate(0,0) scale(1)}
        25%{transform:translate(50px,-40px) scale(1.15)}
        50%{transform:translate(-25px,-60px) scale(0.9)}
        75%{transform:translate(35px,-20px) scale(1.08)}
      }
      @keyframes orbDrift1 {
        0%,100%{transform:translate(0,0) scale(1)}
        30%{transform:translate(-45px,30px) scale(1.12)}
        60%{transform:translate(30px,-40px) scale(0.88)}
        80%{transform:translate(-20px,15px) scale(1.05)}
      }
      @keyframes orbDrift2 {
        0%,100%{transform:translate(0,0) scale(1)}
        20%{transform:translate(35px,25px) scale(1.1)}
        50%{transform:translate(-50px,-25px) scale(0.92)}
        80%{transform:translate(25px,-35px) scale(1.15)}
      }

      /* Sparkle twinkle */
      @keyframes sparkle {
        0%,100%{opacity:0;transform:scale(0.3)}
        15%{opacity:1;transform:scale(1.2)}
        30%{opacity:0.8;transform:scale(0.9)}
        50%{opacity:1;transform:scale(1.1)}
        85%{opacity:0;transform:scale(0.5)}
      }

      /* Shooting light streaks */
      @keyframes shootStreak {
        0%{left:-150px;opacity:0}
        5%{opacity:1}
        95%{opacity:1}
        100%{left:calc(100% + 150px);opacity:0}
      }

      /* Edge breathing */
      @keyframes edgeBreathe {
        0%,100%{opacity:0.2}
        50%{opacity:1}
      }

      /* Progress bar shimmer */
      @keyframes progressShimmer {
        0%{background-position:0% center}
        100%{background-position:200% center}
      }

      /* Text shimmer */
      @keyframes textShimmer {
        0%{background-position:0% center}
        100%{background-position:200% center}
      }

      /* Calendar pulse */
      @keyframes calendarPulse {
        0%,100%{transform:scale(1);opacity:1}
        50%{transform:scale(1.1);opacity:0.7}
      }

      /* Feature icon glow */
      @keyframes featureGlow {
        0%,100%{filter:drop-shadow(0 0 0 transparent)}
        50%{filter:drop-shadow(0 0 8px rgba(130,191,138,0.4))}
      }

      /* CTA button pulse */
      @keyframes btnPulse {
        0%,100%{box-shadow:0 4px 20px rgba(46,107,53,0.28)}
        50%{box-shadow:0 4px 30px rgba(82,168,90,0.5),0 0 60px rgba(82,168,90,0.15)}
      }

      /* Why card divider expand on visible */
      .why-card:hover .why-card-divider {
        width:80px !important;
        background:linear-gradient(90deg,rgba(130,191,138,0.7),rgba(130,191,138,0.2),transparent) !important;
      }

      /* Step number color shift on hover */
      .hiw-step:hover .hiw-step-num {
        color:rgba(130,191,138,0.35) !important;
        text-shadow:0 0 40px rgba(130,191,138,0.2);
      }
      .why-card:hover .why-card-num {
        color:rgba(130,191,138,0.18) !important;
        text-shadow:0 0 40px rgba(130,191,138,0.15);
      }

      /* Smooth transitions for all interactive elements */
      .hiw-step-num, .why-card-num {
        transition: color 0.4s ease, text-shadow 0.4s ease !important;
      }
      .why-card-divider {
        transition: width 0.5s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease !important;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── INIT ── */
  function init() {
    injectStyles();
    initHeroParallax();
    initScrollProgress();
    initOrbField();
    initSparkles();
    initLightStreaks();
    initBreathingEdges();
    initCardGlow();
    initIconEffects();
    initHeaderShimmer();
    initMouseGlow();
    initDeliveryEffects();
    initFeatureStripGlow();
    initCtaPulse();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
