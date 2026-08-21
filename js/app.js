/**
 * LeSa - Home: Main Application Controller
 * Smooth scroll, mobile navigation drawer, scroll observer animations, and UI helpers
 */

const App = {
  init() {
    this.header = document.getElementById('main-header');
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.mobileMenuClose = document.getElementById('mobile-menu-close');
    this.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    this.floatingContact = document.getElementById('floating-contact');

    this.bindEvents();
    this.setupScrollObserver();
    this.updateCurrentYear();
  },

  bindEvents() {
    // Header shadow on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        this.header?.classList.add('scrolled');
      } else {
        this.header?.classList.remove('scrolled');
      }
    });

    // Mobile Menu Toggle
    if (this.mobileMenuBtn && this.mobileMenu) {
      this.mobileMenuBtn.addEventListener('click', () => this.openMobileMenu());
    }

    if (this.mobileMenuClose) {
      this.mobileMenuClose.addEventListener('click', () => this.closeMobileMenu());
    }

    // Close mobile menu when link clicked
    this.mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    // Close mobile menu on clicking backdrop
    if (this.mobileMenu) {
      this.mobileMenu.addEventListener('click', (e) => {
        if (e.target === this.mobileMenu) this.closeMobileMenu();
      });
    }
  },

  openMobileMenu() {
    if (!this.mobileMenu) return;
    this.mobileMenu.classList.remove('hidden');
    setTimeout(() => {
      this.mobileMenu.classList.remove('opacity-0');
      const drawer = this.mobileMenu.querySelector('.mobile-drawer');
      if (drawer) drawer.classList.remove('translate-x-full');
    }, 10);
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    if (!this.mobileMenu) return;
    const drawer = this.mobileMenu.querySelector('.mobile-drawer');
    if (drawer) drawer.classList.add('translate-x-full');
    this.mobileMenu.classList.add('opacity-0');
    setTimeout(() => {
      this.mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  },

  setupScrollObserver() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(el => observer.observe(el));
    } else {
      // Fallback for older browsers
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  },

  updateCurrentYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
