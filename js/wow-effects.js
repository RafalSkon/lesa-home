/**
 * LeSa Home — WOW Effects Engine
 * Count-up animations, scroll reveals, tilt effect, FAQ accordion
 */

const WowEffects = {

  init() {
    this.initScrollReveal();
    this.initCountUp();
    this.initTiltEffect();
    this.initFaqAccordion();
    this.initTestimonialsCarousel();
  },

  /* ================= SCROLL REVEAL (AOS-like) ================= */
  initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.revealDelay || '0');
          setTimeout(() => {
            el.classList.add('is-revealed');
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  },

  /* ================= COUNT-UP ANIMATION ================= */
  initCountUp() {
    const counters = document.querySelectorAll('[data-countup]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  },

  animateCounter(el) {
    const target = el.dataset.countup;
    const suffix = el.dataset.countupSuffix || '';
    const prefix = el.dataset.countupPrefix || '';
    const duration = parseInt(el.dataset.countupDuration || '1800');
    
    // Parse numeric value
    const targetNum = parseFloat(target);
    if (isNaN(targetNum)) {
      el.textContent = prefix + target + suffix;
      return;
    }

    const startTime = performance.now();
    const isFloat = target.includes('.');
    
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;
      
      if (isFloat) {
        el.textContent = prefix + current.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.round(current) + suffix;
      }
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    };
    
    requestAnimationFrame(step);
  },

  /* ================= 3D TILT EFFECT ================= */
  initTiltEffect() {
    const tiltElements = document.querySelectorAll('[data-tilt]');
    
    tiltElements.forEach(el => {
      const maxTilt = parseInt(el.dataset.tiltMax || '8');
      const speed = parseInt(el.dataset.tiltSpeed || '400');
      const glare = el.dataset.tiltGlare === 'true';
      
      // Add perspective wrapper styles
      el.style.transformStyle = 'preserve-3d';
      el.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
      
      // Optional glare overlay
      if (glare) {
        const glareEl = document.createElement('div');
        glareEl.className = 'tilt-glare';
        glareEl.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;background:linear-gradient(135deg,rgba(255,255,255,0.25) 0%,transparent 60%);transition:opacity 400ms ease;z-index:5;';
        el.style.position = 'relative';
        el.style.overflow = 'hidden';
        el.appendChild(glareEl);
      }

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        const tiltX = (0.5 - y) * maxTilt;
        const tiltY = (x - 0.5) * maxTilt;
        
        el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        if (glare) {
          const glareEl = el.querySelector('.tilt-glare');
          if (glareEl) {
            glareEl.style.opacity = '1';
            glareEl.style.background = `linear-gradient(${Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI + 90}deg, rgba(255,255,255,0.2) 0%, transparent 60%)`;
          }
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        if (glare) {
          const glareEl = el.querySelector('.tilt-glare');
          if (glareEl) glareEl.style.opacity = '0';
        }
      });
    });
  },

  /* ================= FAQ ACCORDION ================= */
  initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    
    items.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      const content = item.querySelector('.faq-content');
      const icon = item.querySelector('.faq-icon');
      
      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
        
        // Close all others
        items.forEach(other => {
          const otherContent = other.querySelector('.faq-content');
          const otherIcon = other.querySelector('.faq-icon');
          if (otherContent && other !== item) {
            otherContent.style.maxHeight = '0px';
            otherContent.style.opacity = '0';
            other.classList.remove('faq-open');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        });
        
        if (isOpen) {
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          item.classList.remove('faq-open');
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          item.classList.add('faq-open');
          if (icon) icon.style.transform = 'rotate(45deg)';
        }
      });
    });
  },

  /* ================= TESTIMONIALS CAROUSEL ================= */
  initTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    const dotsContainer = document.getElementById('testimonial-dots');
    
    if (!track) return;
    
    const cards = track.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    
    let current = 0;
    const total = cards.length;
    
    // Create dots
    if (dotsContainer) {
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'bg-orange-500 w-6' : 'bg-slate-300'}`;
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });
    }
    
    function goTo(index) {
      current = index;
      track.style.transform = `translateX(-${current * 100}%)`;
      
      // Update dots
      if (dotsContainer) {
        dotsContainer.querySelectorAll('button').forEach((dot, i) => {
          if (i === current) {
            dot.className = 'w-6 h-2 rounded-full bg-orange-500 transition-all duration-300';
          } else {
            dot.className = 'w-2 h-2 rounded-full bg-slate-300 transition-all duration-300';
          }
        });
      }
    }
    
    if (prevBtn) prevBtn.addEventListener('click', () => goTo((current - 1 + total) % total));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo((current + 1) % total));
    
    // Auto-play
    setInterval(() => goTo((current + 1) % total), 6000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  WowEffects.init();
});
