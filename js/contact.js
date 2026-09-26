/**
 * LeSa - Home: Contact Form & FAQ Logic
 * Interactive validations, phone masking, secure file attachments (PDF, DWG, photos),
 * drag & drop handling, backend API integration (oferty@lesa-home.pl), and FAQ accordion.
 */

const Contact = {
  selectedFiles: [],
  maxFiles: 5,
  maxFileSize: 15 * 1024 * 1024, // 15 MB per file
  maxTotalSize: 35 * 1024 * 1024, // 35 MB total
  allowedExtensions: ['pdf', 'dwg', 'jpg', 'jpeg', 'png', 'webp'],

  init() {
    this.form = document.getElementById('contact-form');
    this.phoneInput = document.getElementById('contact-phone');
    this.toast = document.getElementById('contact-toast');
    this.faqItems = document.querySelectorAll('.faq-item');

    this.dropzone = document.getElementById('contact-dropzone');
    this.fileInput = document.getElementById('contact-files');
    this.fileList = document.getElementById('contact-file-list');
    this.fileError = document.getElementById('contact-file-error');
    this.fileErrorMsg = document.getElementById('contact-file-error-msg');

    this.bindEvents();
    this.bindFileUploadEvents();
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

  bindFileUploadEvents() {
    if (!this.dropzone || !this.fileInput) return;

    // Handle drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('border-orange-500', 'bg-orange-50/50', 'ring-2', 'ring-orange-200');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('border-orange-500', 'bg-orange-50/50', 'ring-2', 'ring-orange-200');
      });
    });

    // Handle dropped files
    this.dropzone.addEventListener('drop', (e) => {
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        this.handleFilesAdded(droppedFiles);
      }
    });

    // Handle input selection
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFilesAdded(e.target.files);
        // Reset file input value so selecting the same file again triggers change event
        e.target.value = '';
      }
    });
  },

  handleFilesAdded(files) {
    this.hideFileError();

    const incoming = Array.from(files);

    for (const file of incoming) {
      // Check maximum file count
      if (this.selectedFiles.length >= this.maxFiles) {
        this.showFileError(`Możesz załączyć maksymalnie ${this.maxFiles} plików do wyceny.`);
        break;
      }

      // Check file extension
      const fileName = file.name || '';
      const ext = fileName.split('.').pop().toLowerCase();
      
      // Prevent dangerous double extensions
      if (/\.(php|phtml|phar|cgi|pl|py|sh|bash|exe|bat|cmd|vbs|js|html|htm|svg)(\.|$)/i.test(fileName)) {
        this.showFileError(`Plik "${fileName}" zawiera niedozwolone rozszerzenie ze względów bezpieczeństwa.`);
        continue;
      }

      if (!this.allowedExtensions.includes(ext)) {
        this.showFileError(`Niedozwolony format pliku "${fileName}". Dopuszczalne formaty: PDF, DWG, JPG, PNG, WEBP.`);
        continue;
      }

      // Check single file size
      if (file.size > this.maxFileSize) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        this.showFileError(`Plik "${fileName}" (${sizeMb} MB) przekracza dopuszczalny limit 15 MB.`);
        continue;
      }

      // Check total size
      const currentTotal = this.selectedFiles.reduce((acc, f) => acc + f.size, 0);
      if (currentTotal + file.size > this.maxTotalSize) {
        this.showFileError(`Łączny rozmiar załączników przekracza maksymalny limit 35 MB.`);
        break;
      }

      // Check if file is already added (by name and size)
      const isDuplicate = this.selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (!isDuplicate) {
        this.selectedFiles.push(file);
      }
    }

    this.renderFileList();
  },

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.hideFileError();
    this.renderFileList();
  },

  renderFileList() {
    if (!this.fileList) return;

    if (this.selectedFiles.length === 0) {
      this.fileList.classList.add('hidden');
      this.fileList.innerHTML = '';
      return;
    }

    this.fileList.classList.remove('hidden');

    let html = '';
    this.selectedFiles.forEach((file, idx) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const sizeFormatted = file.size > 1048576 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      // Badge styling per extension
      let badgeBg = 'bg-slate-100 text-slate-700';
      let badgeLabel = ext.toUpperCase();

      if (ext === 'pdf') {
        badgeBg = 'bg-rose-100 text-rose-700 border border-rose-200';
      } else if (ext === 'dwg') {
        badgeBg = 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      }

      html += `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-all">
          <div class="flex items-center gap-2.5 overflow-hidden pr-2">
            <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide shrink-0 ${badgeBg}">
              ${badgeLabel}
            </span>
            <span class="font-medium text-slate-800 truncate" title="${file.name}">
              ${file.name}
            </span>
            <span class="text-slate-400 shrink-0 text-[11px]">
              (${sizeFormatted})
            </span>
          </div>
          <button type="button" onclick="Contact.removeFile(${idx})" class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0" title="Usuń plik">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      `;
    });

    this.fileList.innerHTML = html;
  },

  showFileError(msg) {
    if (!this.fileError || !this.fileErrorMsg) return;
    this.fileErrorMsg.textContent = msg;
    this.fileError.classList.remove('hidden');
  },

  hideFileError() {
    if (!this.fileError) return;
    this.fileError.classList.add('hidden');
  },

  async handleSubmit() {
    const nameInput = document.getElementById('contact-name');
    const phoneInput = document.getElementById('contact-phone');
    const emailInput = document.getElementById('contact-email');
    const areaInput = document.getElementById('contact-area');
    const locationInput = document.getElementById('contact-location');
    const stageInput = document.getElementById('contact-stage');
    const messageInput = document.getElementById('contact-message');
    const consentInput = document.getElementById('contact-consent');
    const websiteInput = document.getElementById('contact-website');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const area = areaInput ? areaInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';
    const stage = stageInput ? stageInput.value : '';
    const message = messageInput ? messageInput.value.trim() : '';
    const honeypot = websiteInput ? websiteInput.value.trim() : '';

    if (!name || name.length < 2) {
      alert('Proszę podać Twoje imię i nazwisko.');
      nameInput && nameInput.focus();
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 6) {
      alert('Proszę podać poprawny numer telefonu do kontaktu.');
      phoneInput && phoneInput.focus();
      return;
    }

    if (consentInput && !consentInput.checked) {
      alert('Aby wysłać zapytanie, prosimy o zaznaczenie zgody na kontakt.');
      consentInput.focus();
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('area', area);
    formData.append('location', location);
    formData.append('stage', stage);
    formData.append('message', message);
    formData.append('company_website', honeypot);

    // Append selected files
    this.selectedFiles.forEach((file) => {
      formData.append('files[]', file);
    });

    // Show visual loading state on submit button
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Przesyłanie zapytania i załączników...
    `;

    try {
      const response = await fetch('api/contact.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        this.form.reset();
        this.selectedFiles = [];
        this.renderFileList();
        this.hideFileError();

        const successMsg = `Dziękujemy, ${name}! Twoje zapytanie dotyczące podłogówki${area ? ' (' + area + ' m²)' : ''} oraz ${result.filesCount || 0} załączników zostało pomyślnie wysłane do naszego zespołu (oferty@lesa-home.pl). Skontaktujemy się z Tobą najszybciej jak to możliwe!`;
        this.showToast(successMsg, true);
      } else {
        const errorMsg = result.error || 'Wystąpił nieoczekiwany błąd podczas wysyłania zapytania. Spróbuj ponownie lub napisz na oferty@lesa-home.pl.';
        alert(errorMsg);
        this.showToast(errorMsg, false);
      }
    } catch (err) {
      console.error('Błąd wysyłania formularza:', err);
      const fallbackMsg = 'Wystąpił problem z połączeniem sieciowym. Jeśli błąd się powtarza, prosimy o bezpośredni kontakt: oferty@lesa-home.pl';
      alert(fallbackMsg);
      this.showToast(fallbackMsg, false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
      submitBtn.innerHTML = originalContent;
    }
  },

  showToast(message, isSuccess = true) {
    if (!this.toast) return;
    const toastText = document.getElementById('contact-toast-text');
    const toastTitle = this.toast.querySelector('h5');
    const toastIcon = this.toast.querySelector('div:first-child');

    if (toastText) toastText.textContent = message;

    if (toastTitle) {
      toastTitle.textContent = isSuccess ? 'Zapytanie przesłane pomyślnie!' : 'Informacja o zapytaniu';
    }

    if (toastIcon) {
      if (isSuccess) {
        toastIcon.className = 'w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-sm';
        toastIcon.textContent = '✓';
      } else {
        toastIcon.className = 'w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold text-sm';
        toastIcon.textContent = '!';
      }
    }

    this.toast.classList.remove('translate-y-24', 'opacity-0');
    this.toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      this.toast.classList.add('translate-y-24', 'opacity-0');
      this.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 7000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Contact.init();
});
