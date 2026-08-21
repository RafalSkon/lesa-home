/**
 * LeSa - Home: Contact Form & FAQ Logic
 * Interactive validations, phone masking, feedback toasts, and FAQ accordion
 */

const Contact = {
  init() {
    this.form = document.getElementById('contact-form');
    this.phoneInput = document.getElementById('contact-phone');
    this.toast = document.getElementById('contact-toast');
    this.faqItems = document.querySelectorAll('.faq-item');

    this.bindEvents();
  },

  bindEvents() {
    // Phone auto formatting (e.g. +48 600 100 200)
    if (this.phoneInput) {
      this.phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.startsWith('48')) val = val.substring(2);
        
        let formatted = '';
        if (val.length > 0) formatted += val.substring(0, 3);
        if (val.length > 3) formatted += ' ' + val.substring(3, 6);
        if (val.length > 6) formatted += ' ' + val.substring(6, 9);
        
        e.target.value = formatted;
      });
    }

    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // FAQ Accordion
    this.faqItems.forEach(item => {
      const button = item.querySelector('.faq-button');
      const content = item.querySelector('.faq-content');
      const icon = item.querySelector('.faq-icon');

      if (button && content) {
        button.addEventListener('click', () => {
          const isOpen = !content.classList.contains('hidden');

          // Close all other items
          this.faqItems.forEach(otherItem => {
            const otherContent = otherItem.querySelector('.faq-content');
            const otherIcon = otherItem.querySelector('.faq-icon');
            if (otherContent) otherContent.classList.add('hidden');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          });

          // Toggle current
          if (!isOpen) {
            content.classList.remove('hidden');
            if (icon) icon.style.transform = 'rotate(180deg)';
          } else {
            content.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
          }
        });
      }
    });
  },

  handleSubmit() {
    const name = document.getElementById('contact-name')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const area = document.getElementById('contact-area')?.value.trim();

    if (!name || !phone) {
      alert('Proszę podać imię i numer telefonu, abyśmy mogli się z Tobą skontaktować.');
      return;
    }

    // Show visual loading state on submit button
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Wysyłanie zapytania...
    `;

    setTimeout(() => {
      // Success feedback
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      this.form.reset();
      this.showToast(`Dziękujemy, ${name}! Twoje zapytanie dotyczące podłogówki (${area ? area + ' m²' : 'dom'}) zostało przesłane. Oddzwonimy w ciągu 2 godzin.`);
    }, 900);
  },

  showToast(message) {
    if (!this.toast) return;
    const toastText = document.getElementById('contact-toast-text');
    if (toastText) toastText.textContent = message;

    this.toast.classList.remove('translate-y-24', 'opacity-0');
    this.toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      this.toast.classList.add('translate-y-24', 'opacity-0');
      this.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 6000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Contact.init();
});
