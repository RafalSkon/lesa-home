/**
 * LeSa Home - ApiService
 * Central client-side data service with in-browser image compression,
 * automatic environment detection (Server SQLite vs LocalStorage),
 * and offline fallback.
 */

const ApiService = {
  // Determine API base path dynamically based on current page depth
  getBaseUrl() {
    if (window.location.protocol === 'file:') return null;
    if (window.location.pathname.includes('/lesa-cad-v2')) return '../api/';
    return 'api/';
  },

  isServerAvailable: null,

  async checkServer() {
    if (this.isServerAvailable !== null) return this.isServerAvailable;
    const base = this.getBaseUrl();
    if (!base) {
      this.isServerAvailable = false;
      return false;
    }
    try {
      const res = await fetch(base + 'clients.php', { method: 'GET', cache: 'no-cache' });
      // Jeśli serwer zwrócił 401, to znaczy że żyje (jest w sieci), ale nie jesteśmy zalogowani.
      // Więc technicznie serwer JEST dostępny.
      this.isServerAvailable = true;
      return true;
    } catch (e) {
      console.warn('Serwer API niedostępny, przełączanie na tryb lokalny (localStorage).', e);
      this.isServerAvailable = false;
      return false;
    }
  },

  async verifySession() {
    const isOnline = await this.checkServer();
    if (!isOnline) return true; // Offline fallback allow
    
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=check_session', { cache: 'no-store' });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  /* ================= IN-BROWSER IMAGE COMPRESSOR ================= */
  /**
   * Compresses large photos taken by phone cameras (from ~12MB down to ~250KB)
   * in fractions of a second before uploading.
   */
  async compressImage(file, maxWidth = 1600, quality = 0.8) {
    if (!file || !file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file); // fallback to original
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  },

  /* ================= AUTH ================= */
  async register(username, password, role) {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: 'B��d po��czenia z serwerem' };
    }
  },

  async login(username, password) {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: 'B��d po��czenia z serwerem' };
    }
  },

  async getUsers() {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=get_users');
      const json = await res.json();
      return json.success ? json.users : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async updateUser(id, role, status) {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=update_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role, status })
      });
      const json = await res.json();
      return json;
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Błąd połączenia z serwerem' };
    }
  },

  async resetPasswordRequest(username) {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=reset_request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Błąd połączenia z serwerem' };
    }
  },

  async adminResetPassword(id, newPassword) {
    try {
      const res = await fetch(this.getBaseUrl() + 'auth.php?action=admin_reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newPassword })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Błąd połączenia z serwerem' };
    }
  },

  /* ================= CLIENTS (CRM) ================= */
  async getClients() {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'clients.php');
        const json = await res.json();
        if (json.success) {
          // Cache locally for offline use
          localStorage.setItem('lesa_clients', JSON.stringify(json.clients));
          return json.clients;
        }
      } catch (e) {
        console.error('Błąd pobierania klientów z serwera, używam pamięci lokalnej:', e);
      }
    }
    return JSON.parse(localStorage.getItem('lesa_clients') || '[]');
  },

  async saveClient(clientData) {
    // 1. Always save in localStorage for instant response & offline
    let clients = JSON.parse(localStorage.getItem('lesa_clients') || '[]');
    const idx = clients.findIndex(c => c.id === clientData.id);
    if (idx >= 0) {
      clients[idx] = { ...clients[idx], ...clientData };
    } else {
      clients.push(clientData);
    }
    localStorage.setItem('lesa_clients', JSON.stringify(clients));

    // 2. Sync to Server
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'clients.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        });
        const json = await res.json();
        if (json.success && json.client) {
          return json.client;
        }
      } catch (e) {
        console.error('Błąd zapisu klienta na serwerze (zapisano lokalnie):', e);
      }
    }
    return clientData;
  },

  async deleteClient(id) {
    let clients = JSON.parse(localStorage.getItem('lesa_clients') || '[]');
    clients = clients.filter(c => c.id !== id);
    localStorage.setItem('lesa_clients', JSON.stringify(clients));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        await fetch(this.getBaseUrl() + 'clients.php?id=' + encodeURIComponent(id), {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Błąd usuwania klienta na serwerze:', e);
      }
    }
    return true;
  },

  /* ================= PROJECTS ================= */
  async getProjects() {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'projects.php?_t=' + new Date().getTime());
        const json = await res.json();
        if (json.success) {
          localStorage.setItem('lesa_projects', JSON.stringify(json.projects));
          return json.projects;
        }
      } catch (e) {
        console.error('Błąd pobierania projektów z serwera:', e);
      }
    }
    return JSON.parse(localStorage.getItem('lesa_projects') || '[]');
  },

  async saveProject(projectData) {
    let projects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
    const idx = projects.findIndex(p => p.id === projectData.id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...projectData };
    } else {
      projects.push(projectData);
    }
    localStorage.setItem('lesa_projects', JSON.stringify(projects));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'projects.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        });
        const json = await res.json();
        if (json.success && json.project) {
          return json.project;
        }
      } catch (e) {
        console.error('Błąd zapisu projektu na serwerze:', e);
      }
    }
    return projectData;
  },

  async deleteProject(id) {
    let projects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('lesa_projects', JSON.stringify(projects));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        await fetch(this.getBaseUrl() + 'projects.php?id=' + encodeURIComponent(id), {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Błąd usuwania projektu na serwerze:', e);
      }
    }
    return true;
  },

  /* ================= OFFERS ================= */
  async getOffers() {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'offers.php');
        const json = await res.json();
        if (json.success) {
          localStorage.setItem('lesa_saved_offers', JSON.stringify(json.offers));
          return json.offers;
        }
      } catch (e) {
        console.error('Błąd pobierania ofert z serwera:', e);
      }
    }
    return JSON.parse(localStorage.getItem('lesa_saved_offers') || '[]');
  },

  async saveOffer(offerData) {
    let offers = JSON.parse(localStorage.getItem('lesa_saved_offers') || '[]');
    const idx = offers.findIndex(o => o.id === offerData.id || o.number === offerData.number);
    if (idx >= 0) {
      offers[idx] = offerData;
    } else {
      offers.push(offerData);
    }
    localStorage.setItem('lesa_saved_offers', JSON.stringify(offers));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'offers.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offerData)
        });
        const json = await res.json();
        if (json.success && json.offer) {
          return json.offer;
        }
      } catch (e) {
        console.error('Błąd zapisu oferty na serwerze:', e);
      }
    }
    return offerData;
  },

  async deleteOffer(id) {
    let offers = JSON.parse(localStorage.getItem('lesa_saved_offers') || '[]');
    offers = offers.filter(o => o.id !== id);
    localStorage.setItem('lesa_saved_offers', JSON.stringify(offers));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        await fetch(this.getBaseUrl() + 'offers.php?id=' + encodeURIComponent(id), {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Błąd usuwania oferty na serwerze:', e);
      }
    }
    return true;
  },

  /* ================= CONTRACTS ================= */
  async getContracts() {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'contracts.php');
        const json = await res.json();
        if (json.success) {
          localStorage.setItem('lesa_contracts_history', JSON.stringify(json.contracts));
          return json.contracts;
        }
      } catch (e) {
        console.error('Błąd pobierania umów z serwera:', e);
      }
    }
    return JSON.parse(localStorage.getItem('lesa_contracts_history') || '[]');
  },

  async saveContract(contractData) {
    let contracts = JSON.parse(localStorage.getItem('lesa_contracts_history') || '[]');
    contracts.unshift(contractData);
    localStorage.setItem('lesa_contracts_history', JSON.stringify(contracts));

    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        await fetch(this.getBaseUrl() + 'contracts.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractData)
        });
      } catch (e) {
        console.error('Błąd zapisu umowy na serwerze:', e);
      }
    }
    return contractData;
  },

  async getContractorProfile() {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'contracts.php?type=profile');
        const json = await res.json();
        if (json.success && json.profile) {
          localStorage.setItem('lesa_contractor_profile', JSON.stringify(json.profile));
          return json.profile;
        }
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('lesa_contractor_profile') || 'null');
  },

  async saveContractorProfile(profile) {
    localStorage.setItem('lesa_contractor_profile', JSON.stringify(profile));
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        await fetch(this.getBaseUrl() + 'contracts.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isProfile: true, profile: profile })
        });
      } catch (e) {}
    }
  },

  /* ================= FILES (PHOTOS & LeSa-CAD .s1c) ================= */
  async getProjectFiles(projectId) {
    const isOnline = await this.checkServer();
    if (isOnline) {
      try {
        const res = await fetch(this.getBaseUrl() + 'upload.php?projectId=' + encodeURIComponent(projectId));
        const json = await res.json();
        if (json.success) return json.files;
      } catch (e) {
        console.error('Błąd pobierania listy plików:', e);
      }
    }
    // Return empty if offline or file://
    return [];
  },

  /**
   * Upload a photo taken on site by monter (with automatic fast compression)
   */
  async uploadSitePhoto(projectId, fileBlob, fileType = 'photo') {
    // Automatically compress to ~250KB JPEG
    const compressed = await this.compressImage(fileBlob, 1600, 0.8);

    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('projectId', projectId);
    formData.append('fileType', fileType);

    const res = await fetch(this.getBaseUrl() + 'upload.php', {
      method: 'POST',
      body: formData
    });
    return await res.json();
  },

  /**
   * Save LeSa-CAD project state (.s1c string) directly to server storage
   */
  async saveCadProject(projectId, projectName, cadContentString) {
    const isOnline = await this.checkServer();
    if (!isOnline) {
      throw new Error('Serwer niedostępny. Zapisz plik .s1c lokalnie na dysku.');
    }

    const res = await fetch(this.getBaseUrl() + 'upload.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_cad_data',
        projectId: projectId,
        projectName: projectName,
        content: cadContentString
      })
    });
    return await res.json();
  },

  /**
   * Fetch CAD project content from server by URL
   */
  async loadCadProject(fileUrl) {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('Nie udało się pobrać pliku CAD z serwera');
    return await res.text();
  }
};

// Global export for script tags
window.ApiService = ApiService;

// Security: Auto-clear cached data after 30 minutes of inactivity
(function() {
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  const CACHE_KEYS = ['lesa_clients', 'lesa_projects', 'lesa_saved_offers', 'lesa_contracts_history', 'lesa_contractor_profile'];
  
  function updateCacheTimestamp() {
    localStorage.setItem('lesa_cache_ts', Date.now().toString());
  }
  
  function checkCacheExpiry() {
    const ts = parseInt(localStorage.getItem('lesa_cache_ts') || '0');
    if (ts && (Date.now() - ts) > CACHE_TTL_MS) {
      CACHE_KEYS.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('lesa_cache_ts');
    }
  }
  
  // Check on page load
  checkCacheExpiry();
  
  // Update timestamp on user activity
  ['click', 'keydown', 'scroll'].forEach(evt => {
    document.addEventListener(evt, updateCacheTimestamp, { passive: true, once: false });
  });
  
  // Periodic check every 5 minutes
  setInterval(checkCacheExpiry, 5 * 60 * 1000);
})();
