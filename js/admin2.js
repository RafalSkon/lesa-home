/**
 * LeSa - Home: Admin Hub & CAD Engineering Controller
 * Authentication, Dashboard KPIs, Contracts Registry, CAD Loop Engine, CRM Leads
 */

const PROJECT_COLORS = [
  { name: 'Ceglasty Pomarańcz', hex: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { name: 'Ognista Czerwień',   hex: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { name: 'Malinowa Róża',      hex: '#e11d48', bg: '#fff1f2', border: '#fda4af' },
  { name: 'Ciepły Bursztyn',    hex: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { name: 'Złoty Słoneczny',    hex: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { name: 'Świeża Limonka',     hex: '#65a30d', bg: '#f7fee7', border: '#bef264' },
  { name: 'Soczysta Zieleń',    hex: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { name: 'Głęboki Szmaragd',   hex: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  { name: 'Morski Turkus',      hex: '#0d9488', bg: '#f0fdfa', border: '#5eead4' },
  { name: 'Cyjanowy Ocean',     hex: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { name: 'Lazurowy Błękit',    hex: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc' },
  { name: 'Szafirowy Kobalt',   hex: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { name: 'Nocne Indygo',       hex: '#4f46e5', bg: '#eef2ff', border: '#a5b4fc' },
  { name: 'Królewski Fiolet',   hex: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { name: 'Intensywna Purpura', hex: '#9333ea', bg: '#faf5ff', border: '#d8b4fe' },
  { name: 'Energetyczna Fuksja',hex: '#c026d3', bg: '#fdf4ff', border: '#f0abfc' },
  { name: 'Neonowy Róż',        hex: '#db2777', bg: '#fdf2f8', border: '#f472b6' },
  { name: 'Koralowy Karmin',    hex: '#f43f5e', bg: '#fff1f2', border: '#fb7185' },
  { name: 'Grafitowy Stalowy',  hex: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { name: 'Ciepły Piaskowiec',  hex: '#78716c', bg: '#fafaf9', border: '#d6d3d1' }
];

const AdminApp = {
  activeTab: 'dashboard',
  projectColors: PROJECT_COLORS,
  calendarMonthOffset: 0,
  calendarSelectedDate: null,
  calendarStatusFilter: 'all',
  calendarColorFilter: null,

  getProjectColor(projectOrId) {
    if (!projectOrId) return PROJECT_COLORS[0];
    let colorHex = (typeof projectOrId === 'object') ? projectOrId.color : null;
    if (colorHex) {
      const found = PROJECT_COLORS.find(c => c.hex.toLowerCase() === colorHex.toLowerCase());
      if (found) return found;
      return { name: 'Własny', hex: colorHex, bg: colorHex + '18', border: colorHex + '40' };
    }
    const idStr = (typeof projectOrId === 'object') ? (projectOrId.id || projectOrId.title || '') : String(projectOrId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash = (hash * 31 + idStr.charCodeAt(i)) % PROJECT_COLORS.length;
    return PROJECT_COLORS[Math.abs(hash)];
  },

  // Security: HTML escape function to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  currentTool: 'loop',
  currentColor: '#f97316',
  pipeSpacing: 15,
  cadLoops: [],
  isDrawing: false,

  init() {
    this.checkAuth();
    this.bindAuthEvents();
    this.bindNavigation();
    this.loadContractsData();
    this.loadClientsData();
    this.loadProjectsData();
    this.initCadEngine();
    this.handleUrlParams();
    this.loadUsers();

    // Bind project search
    const projSearch = document.getElementById('filter-projects-search');
    if (projSearch) {
      projSearch.addEventListener('input', (e) => {
        this.renderProjectsList(e.target.value);
      });
    }

    // Listen for cross-tab changes (e.g. from protocols)
    window.addEventListener('storage', (e) => {
      if (e.key === 'lesa_projects') {
        this.loadProjectsData();
      }
    });
  },

  /* ================= AUTHENTICATION ================= */
  async checkAuth() {
    const authScreen = document.getElementById('auth-screen');
    const adminApp = document.getElementById('admin-app');
    
    // Zawsze ukrywamy krÄ™cioĹ‚ek, nawet jak coĹ› wybuchnie po drodze
    const hideSpinner = () => {
      if (authScreen) authScreen.style.display = 'none';
      if (adminApp) adminApp.classList.remove('hidden');
    };

    try {
      if (window.ApiService) {
        const serverAuth = await ApiService.verifySession();
        if (!serverAuth) {
          localStorage.removeItem('lesa_admin_auth');
          sessionStorage.removeItem('lesa_admin_auth');
          window.location.href = 'login.html';
          return;
        }
      } else {
        const isAuth = localStorage.getItem('lesa_admin_auth') || sessionStorage.getItem('lesa_admin_auth');
        if (isAuth !== 'true') {
          window.location.href = 'login.html';
          return;
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
      // Fallback
      const isAuth = localStorage.getItem('lesa_admin_auth') || sessionStorage.getItem('lesa_admin_auth');
      if (isAuth !== 'true') {
        window.location.href = 'login.html';
        return;
      }
    }

    hideSpinner();
  },

  bindAuthEvents() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz siÄ™ wylogowaÄ‡?')) {
          localStorage.removeItem('lesa_admin_auth');
          sessionStorage.removeItem('lesa_admin_auth');
          localStorage.removeItem('lesa_user');
          
          // BezpieczeĹ„stwo: Kasujemy wszystkie zbuforowane dane aplikacji!
          ['lesa_clients', 'lesa_projects', 'lesa_saved_offers', 'lesa_contracts_history', 'lesa_contractor_profile'].forEach(k => localStorage.removeItem(k));
          
          if (window.ApiService) {
            fetch(ApiService.getBaseUrl() + 'auth.php?action=logout').catch(() => {});
          }
          this.checkAuth();
        }
      });
    }
  },

  async approveUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    if (window.ApiService) {
      await ApiService.updateUser(id, user.role, 'approved');
      this.showToast('Konto zostaďż˝o zatwierdzone.');
      this.loadUsers();
    }
  },

  async revokeUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    if (window.ApiService) {
      await ApiService.updateUser(id, user.role, 'pending');
      this.showToast('Konto zostao zablokowane.');
      this.loadUsers();
    }
  },

  /* ================= SETTINGS ================= */
  saveCompanySettings() {
    const profile = {
      name: document.getElementById('set-company-name').value,
      nip: document.getElementById('set-company-nip').value,
      address: document.getElementById('set-company-address').value,
      bank: document.getElementById('set-company-bank').value,
      phone: document.getElementById('set-company-phone').value,
      email: document.getElementById('set-company-email').value
    };

    localStorage.setItem('lesa_contractor_profile', JSON.stringify(profile));
    this.showToast('Ă˘Ĺ›â€¦ Zapisano domyÄąâ€şlne dane firmy dla umÄ‚Ĺ‚w!');
  },

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
    toast.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-orange-500"></span>
      <span>${this.escapeHtml(msg)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);    }, 3500);
  },



  /* ================= NAVIGATION ================= */
  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = e.currentTarget.dataset.tab;
        if(tab) this.switchTab(tab);
      });
    });

    const toggleBtn = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }

    const searchInp = document.getElementById('filter-contracts-search');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this.renderContractsList(e.target.value);
      });
    }

    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => this.saveCompanySettings());
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('bg-slate-800/80', 'text-white');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('bg-slate-800/80', 'text-white');
        btn.classList.add('text-slate-300');
      }
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    const sidebar = document.getElementById('admin-sidebar');
    if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
    }
    
    // Custom triggers per tab
    if (tabId === 'history') {
      this.fetchAuditLogs();
    }
    if (tabId === 'calendar') {
      this.renderAdminCalendar();
    }
  },

  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('tab')) {
      this.switchTab(params.get('tab'));
    } else {
      this.switchTab('dashboard');
    }
  },

  /* ================= USERS ================= */
  users: [],
  async loadUsers() {
    if (window.ApiService) {
      this.users = await ApiService.getUsers();
      this.renderUsersList();
    }
  },


  renderUsersList() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (this.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-slate-500">Brak uĹĽytkownikĂłw.</td></tr>`;
      return;
    }

    this.users.forEach(u => {
      const isPending = u.status === 'pending';
      const isReset = u.status === 'reset_requested';
      let statusHtml = '';
      if (isPending) statusHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Oczekuje</span>`;
      else if (isReset) statusHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Reset hasĹ‚a</span>`;
      else statusHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktywny</span>`;

      tbody.innerHTML += `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${this.escapeHtml(u.username)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            ${statusHtml}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            <select class="border-slate-300 rounded text-xs" onchange="AdminApp.updateUserRole('${this.escapeHtml(u.id)}', this.value)">
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="monter" ${u.role === 'monter' ? 'selected' : ''}>Monter</option>
            </select>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
            ${isPending ? `<button onclick="AdminApp.approveUser('${this.escapeHtml(u.id)}')" class="text-emerald-600 hover:text-emerald-900 mr-3">ZatwierdĹş</button>` : `<button onclick="AdminApp.revokeUser('${this.escapeHtml(u.id)}')" class="text-rose-600 hover:text-rose-900 mr-3">Zablokuj</button>`}
            ${isReset ? `<button onclick="AdminApp.resetUserPassword('${this.escapeHtml(u.id)}')" class="text-blue-600 hover:text-blue-900 font-bold">Nadaj nowe hasĹ‚o</button>` : ''}
          </td>
        </tr>
      `;
    });
  },

  async resetUserPassword(id) {
    const newPass = prompt('Wpisz nowe hasĹ‚o dla tego uĹĽytkownika (przekaĹĽ mu je osobiĹ›cie):');
    if (!newPass) return;
    if (window.ApiService) {
      const res = await ApiService.adminResetPassword(id, newPass);
      if (res.success) {
        this.showToast('HasĹ‚o zostaĹ‚o zmienione.');
        this.loadUsers();
      } else {
        alert(res.error || 'WystÄ…piĹ‚ bĹ‚Ä…d.');
      }
    }
  },

  async updateUserRole(id, role) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    if (window.ApiService) {
      await ApiService.updateUser(id, role, user.status);
      this.showToast('Zmieniono rolďż˝ uďż˝ytkownika.');
      this.loadUsers();
    }
  },

  /* ================= CRM & DATA ================= */
  clients: [],
  projects: [],
  contracts: [],

  async loadClientsData() {
    if (window.ApiService) {
      this.clients = await ApiService.getClients() || [];
      this.renderClientsList();
      this.updateDashboardKPIs();
    }
  },

  renderClientsList(filter = '') {
    const container = document.getElementById('clients-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    let filtered = this.clients;
    if (filter) {
      const term = filter.toLowerCase();
      filtered = this.clients.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.client_name && c.client_name.toLowerCase().includes(term)) ||
        (c.nip && c.nip.toLowerCase().includes(term))
      );
    }
    
    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 text-center p-4">Brak klientĂłw.</p>';
      return;
    }
    
    filtered.forEach(c => {
      const name = c.name || c.client_name || 'Brak nazwy';
      container.innerHTML += `
        <div onclick="AdminApp.viewClient('${c.id}')" class="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <p class="text-sm font-bold text-slate-800 truncate">${this.escapeHtml(name)}</p>
          <p class="text-[10px] text-slate-500">NIP: ${this.escapeHtml(c.nip) || 'Brak'}</p>
        </div>
      `;
    });
  },

  viewClient(id) {
    const client = this.clients.find(c => c.id === id);
    if (!client) return;
    
    const emptyDetails = document.getElementById('client-details-empty');
    const activeDetails = document.getElementById('client-details-active');
    if (emptyDetails) emptyDetails.classList.add('hidden');
    if (activeDetails) activeDetails.classList.remove('hidden');

    const nameEl = document.getElementById('cd-client-name');
    if (nameEl) nameEl.textContent = client.name || client.client_name || 'Brak nazwy';
    
    const nipEl = document.getElementById('cd-nip');
    if (nipEl) nipEl.textContent = 'NIP: ' + (client.nip || 'Brak');
    
    let street = (client.address || '').trim();
    let city = (client.city || '').trim();

    // Jeśli w polu address znajduje się kod pocztowy i miasto (np. "JURIJA GAGARINA 46/9, 87-100 TORUŃ")
    if (street) {
      const match = street.match(/^(.*?)[,\s]+(\d{2}-\d{3}\s+.*)$/i);
      if (match) {
        street = match[1].trim();
        if (!city) {
          city = match[2].trim();
        }
      }
    }

    const cdAddress = document.getElementById('cd-address');
    if (cdAddress) {
      cdAddress.textContent = street || 'Brak adresu ulicy';
    }

    const cdCity = document.getElementById('cd-city');
    if (cdCity) {
      if (city) {
        cdCity.textContent = city;
        cdCity.classList.remove('hidden');
      } else {
        cdCity.textContent = '';
        cdCity.classList.add('hidden');
      }
    }
    
    const phoneEl = document.getElementById('cd-phone');
    if (phoneEl) {
      const phone = (client.phone || '').trim();
      if (phone) {
        phoneEl.innerHTML = `<a href="tel:${phone}" class="text-slate-900 font-semibold hover:text-emerald-600 hover:underline transition-colors">${phone}</a>`;
      } else {
        phoneEl.innerHTML = `<span class="text-slate-400">Brak telefonu <button onclick="AdminApp.editClient()" class="text-xs text-blue-500 hover:text-blue-700 font-bold ml-1 hover:underline">(+ dodaj)</button></span>`;
      }
    }

    const emailEl = document.getElementById('cd-email');
    if (emailEl) {
      const email = (client.email || '').trim();
      if (email) {
        emailEl.innerHTML = `<a href="mailto:${email}" class="text-slate-900 font-semibold hover:text-emerald-600 hover:underline transition-colors">${email}</a>`;
      } else {
        emailEl.innerHTML = `<span class="text-slate-400">Brak e-mail <button onclick="AdminApp.editClient()" class="text-xs text-blue-500 hover:text-blue-700 font-bold ml-1 hover:underline">(+ dodaj)</button></span>`;
      }
    }
    
    // Statystyki i projekty powiązane z tym kontrahentem
    const clientProjects = this.projects.filter(p => (p.client_id === id || p.clientId === id));
    
    const statProjects = document.getElementById('cd-stat-projects');
    if (statProjects) statProjects.textContent = clientProjects.length;

    let totalArea = 0;
    clientProjects.forEach(p => {
      if (p.cadData && p.cadData.area) {
        totalArea += parseFloat(p.cadData.area) || 0;
      }
    });
    const statArea = document.getElementById('cd-stat-area');
    if (statArea) statArea.textContent = Math.round(totalArea) + ' m²';

    const projListEl = document.getElementById('cd-projects-list');
    if (projListEl) {
      if (clientProjects.length === 0) {
        projListEl.innerHTML = '<div class="text-xs text-slate-400 py-4 bg-slate-50 rounded-xl text-center border border-slate-200">Ten kontrahent nie ma jeszcze żadnych projektów.</div>';
      } else {
        projListEl.innerHTML = clientProjects.map(p => {
          const col = this.getProjectColor(p);
          return `
          <div onclick="AdminApp.switchTab('projects'); AdminApp.viewProject('${p.id}');" class="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between transition-colors shadow-xs" style="border-left: 4px solid ${col.hex};">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${col.hex}"></span>
                <span class="font-bold text-slate-800 text-xs">${this.escapeHtml(p.title) || this.escapeHtml(p.projectTitle) || 'Projekt'}</span>
              </div>
              <div class="text-[10px] text-slate-500 pl-4 mt-0.5">${this.escapeHtml(p.address || p.investmentAddress || 'Brak adresu')} ${p.city ? ', ' + this.escapeHtml(p.city) : ''}</div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold ${p.status === 'Zakończony' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${p.status || 'Nowy'}</span>
          </div>
        `;
        }).join('');
      }
    }

    this.currentViewedClientId = id;
  },

  editClient() {
    if (this.currentViewedClientId) {
      this.openClientModal(this.currentViewedClientId);
    }
  },

  async deleteClient() {
    if (!this.currentViewedClientId) return;
    if (confirm('Czy na pewno usunÄ…Ä‡ tego klienta?')) {
      if (window.ApiService) {
        await ApiService.deleteClient(this.currentViewedClientId);
        this.showToast('Klient usuniÄ™ty.');
        
        const emptyDetails = document.getElementById('client-details-empty');
        const activeDetails = document.getElementById('client-details-active');
        if (activeDetails) activeDetails.classList.add('hidden');
        if (emptyDetails) emptyDetails.classList.remove('hidden');
        
        this.currentViewedClientId = null;
        this.loadClientsData();
      }
    }
  },

  async loadProjectsData() {
    if (window.ApiService) {
      this.projects = await ApiService.getProjects() || [];
      this.renderProjectsList();
      this.updateDashboardKPIs();
      if (this.activeTab === 'calendar') {
        this.renderAdminCalendar();
      }
    }
  },

  renderProjectsList(filter = '') {
    const container = document.getElementById('projects-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    let filtered = this.projects;
    if (filter) {
      const term = filter.toLowerCase();
      filtered = this.projects.filter(p => 
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.client_id && p.client_id.toLowerCase().includes(term))
      );
    }
    
    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 text-center p-4">Brak projektów.</p>';
      return;
    }
    
    filtered.forEach(p => {
      const c = this.clients.find(x => x.id === p.client_id);
      const cName = c ? (c.name || c.client_name) : 'Brak klienta';
      const col = this.getProjectColor(p);
      container.innerHTML += `
        <div onclick="AdminApp.viewProject('${p.id}')" class="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-2" style="border-left: 4px solid ${col.hex};">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${col.hex}"></span>
              <p class="text-sm font-bold text-slate-800 truncate">${this.escapeHtml(p.title) || 'Brak nazwy'}</p>
            </div>
            <p class="text-[10px] text-slate-500 truncate pl-4">${this.escapeHtml(cName)}</p>
          </div>
        </div>
      `;
    });
  },

  viewProject(id) {
    const proj = this.projects.find(p => p.id === id);
    if (!proj) return;
    
    const emptyDetails = document.getElementById('project-details-empty');
    const activeDetails = document.getElementById('project-details-active');
    if (emptyDetails) emptyDetails.classList.add('hidden');
    if (activeDetails) activeDetails.classList.remove('hidden');

    const col = this.getProjectColor(proj);
    const titleEl = document.getElementById('pd-project-title');
    if (titleEl) {
      titleEl.innerHTML = `
        <span class="inline-block w-4 h-4 rounded-full shadow-sm mr-2 align-middle" style="background-color: ${col.hex}"></span>
        <span class="align-middle">${this.escapeHtml(proj.title) || 'Brak nazwy'}</span>
      `;
    }
    
    const c = this.clients.find(x => x.id === proj.client_id);
    const linkEl = document.getElementById('pd-client-link');
    if (linkEl) linkEl.textContent = c ? (c.name || c.client_name) : 'Nieznany klient';
    
    const addressEl = document.getElementById('pd-project-address');
    if (addressEl) addressEl.textContent = 'Adres inwestycji: ' + (proj.address || 'Brak') + (proj.city ? ', ' + proj.city : '');
    
    const statusBadge = document.getElementById('pd-project-status-badge');
    if (statusBadge) {
      statusBadge.textContent = 'Status: ' + (proj.status || 'Nowy');
      if (proj.status === 'Do Montażu') {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-700';
      } else if (proj.status === 'Zakończone') {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700';
      } else {
        statusBadge.className = 'px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-700';
      }
    }
    const instBadge = document.getElementById('pd-project-installation-badge');
    const instDate = proj.installationDate || proj.installation_date;
    const instDays = proj.installationDays || proj.installation_days || 1;
    if (instBadge) {
      if (instDate) {
        instBadge.textContent = `📅 Montaż: ${instDate} (${instDays} ${instDays === 1 ? 'dzień' : 'dni'})`;
        instBadge.classList.remove('hidden');
      } else {
        instBadge.classList.add('hidden');
      }
    }
    
    this.currentViewedProjectId = id;
    this.loadProjectPhotos(id);
    this.loadProjectCadData(id);
    this.loadProjectDocs(id);
  },

  async loadProjectDocs(projectId) {
    const listEl = document.getElementById('pd-docs-list');
    if (!listEl) return;
    const proj = this.projects.find(p => p.id === projectId);
    if (!proj) return;
    
    // Dane klienta i projektu do inteligentnego powiązania
    const client = this.clients.find(x => x.id === (proj.client_id || proj.clientId));
    const clientName = (proj.clientName || (client ? (client.name || client.client_name) : '') || '').trim();
    const clientParts = clientName ? clientName.toLowerCase().split(/\s+/).filter(p => p.length >= 3) : [];
    const projTitle = (proj.title || proj.projectTitle || '').trim().toLowerCase();
    const projAddress = (proj.address || proj.investmentAddress || '').trim().toLowerCase();

    // Sprawdzenie lokalnej pamięci podręcznej projektów
    const localProjects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
    const localProj = localProjects.find(p => p.id === projectId) || {};
    
    listEl.innerHTML = '<div class="text-slate-400">Sprawdzanie bazy...</div>';
    try {
       let docsHtml = '';
       let hasDocs = false;
       
       // --- 1. UMOWY ---
       if (window.ApiService) {
           const contracts = await ApiService.getContracts();
           const projContracts = contracts.filter(c => {
               if (c.projectId && (c.projectId === projectId || c.projectId === proj.id)) return true;
               if (c.data && (c.data.projectId === projectId || c.data.projectId === proj.id)) return true;
               if (clientParts.length > 0 && c.clientName) {
                   const cName = c.clientName.toLowerCase();
                   if (clientParts.some(p => cName.includes(p))) return true;
               }
               return false;
           });
           
           if (projContracts.length > 0) {
               hasDocs = true;
               projContracts.forEach(c => {
                   docsHtml += `<div class="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-2 mb-1.5 hover:border-orange-300 transition-colors">
                       <div class="flex items-center gap-2.5">
                           <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                               <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>
                           </div>
                           <div class="flex flex-col">
                              <span class="font-bold text-slate-800 text-xs">Umowa Montażowa</span> 
                              <span class="text-slate-400 text-[10px]">Data zapisu: ${c.savedAt || 'Zapisano w bazie'}</span>
                           </div>
                       </div>
                       <div class="flex items-center gap-1.5 shrink-0">
                           <button onclick="AdminApp.openProjectInTool('umowa')" class="text-[10px] px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-orange-700 font-bold font-mono transition-colors">Otwórz (${c.contractNo || 'UM'})</button>
                           <button onclick="AdminApp.deleteProjectDoc('contract', '${c.id}', '${projectId}')" title="Usuń umowę z bazy" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                           </button>
                       </div>
                   </div>`;
               });
           }
       }

       // --- 2. OFERTY ---
       let offers = [];
       if (window.ApiService && typeof ApiService.getOffers === 'function') {
           offers = await ApiService.getOffers();
       } else {
           offers = JSON.parse(localStorage.getItem('lesa_saved_offers') || '[]');
       }
       const projOffers = offers.filter(o => {
           if (o.projectId && (o.projectId === projectId || o.projectId === proj.id)) return true;
           const offClient = (o.clientName || o.clientInfo || '').toLowerCase();
           const offProject = (o.projectName || '').toLowerCase();
           const offLoc = (o.projectLocation || o.clientContact || '').toLowerCase();
           if (clientParts.length > 0) {
               if (clientParts.some(part => offClient.includes(part) || offProject.includes(part))) return true;
           }
           if (projTitle && projTitle.length >= 4 && (offProject.includes(projTitle) || projTitle.includes(offProject))) return true;
           if (projAddress && projAddress.length >= 5 && (offLoc.includes(projAddress) || projAddress.includes(offLoc))) return true;
           return false;
       });
       if (projOffers.length > 0) {
           hasDocs = true;
           projOffers.forEach(o => {
               const dateStr = o.date || new Date().toISOString().split('T')[0];
               docsHtml += `<div class="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-2 mb-1.5 hover:border-emerald-300 transition-colors">
                   <div class="flex items-center gap-2.5">
                       <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                           <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>
                       </div>
                       <div class="flex flex-col">
                          <span class="font-bold text-slate-800 text-xs">Oferta Handlowa</span> 
                          <span class="text-slate-400 text-[10px]">Data: ${dateStr} &bull; ${o.projectName || 'Oferta'}</span>
                       </div>
                   </div>
                   <div class="flex items-center gap-1.5 shrink-0">
                       <button onclick="AdminApp.openProjectInTool('oferta')" class="text-[10px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 font-bold font-mono transition-colors">Otwórz (${o.number || 'OFE'})</button>
                       <button onclick="AdminApp.deleteProjectDoc('offer', '${o.id}', '${projectId}')" title="Usuń ofertę z bazy" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                           <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                       </button>
                   </div>
               </div>`;
           });
       }

       // --- 3. PROTOKÓŁ SZCZELNOŚCI ---
       const pSzczelnoscSaved = (proj.protocols && proj.protocols.szczelnosc) ||
                               (localProj.protocols && localProj.protocols.szczelnosc) ||
                               localStorage.getItem('lesa_protocol_szczelnosc_' + projectId);
       if (pSzczelnoscSaved) {
           hasDocs = true;
           let d = 'Zapisano w systemie';
           if (proj.protocols && proj.protocols.szczelnoscDate) {
               d = new Date(proj.protocols.szczelnoscDate).toLocaleDateString('pl-PL');
           } else if (localProj.protocols && localProj.protocols.szczelnoscDate) {
               d = new Date(localProj.protocols.szczelnoscDate).toLocaleDateString('pl-PL');
           } else if (typeof pSzczelnoscSaved === 'string') {
               try {
                   const parsed = JSON.parse(pSzczelnoscSaved);
                   if (parsed.savedAt) d = new Date(parsed.savedAt).toLocaleDateString('pl-PL');
                   else if (parsed.data && parsed.data.date) d = parsed.data.date;
               } catch(e) {}
           }
           docsHtml += `<div class="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-2 mb-1.5 hover:border-sky-300 transition-colors">
               <div class="flex items-center gap-2.5">
                   <div class="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                   </div>
                   <div class="flex flex-col">
                      <span class="font-bold text-slate-800 text-xs">Protokół Próby Szczelności</span> 
                      <span class="text-slate-400 text-[10px]">Data: ${d} &bull; Gotowy do druku</span>
                   </div>
               </div>
               <div class="flex items-center gap-1.5 shrink-0">
                   <button onclick="AdminApp.openProjectInTool('szczelnosc')" class="text-[10px] px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-700 font-bold transition-colors">Otwórz &rarr;</button>
                   <button onclick="AdminApp.deleteProjectDoc('szczelnosc', '', '${projectId}')" title="Usuń protokół szczelności" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                       <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                   </button>
               </div>
           </div>`;
       }

       // --- 4. PROTOKÓŁ ODBIORU / KARTA GWARANCYJNA ---
       const pOdbiorSaved = (proj.protocols && proj.protocols.odbior) ||
                            (localProj.protocols && localProj.protocols.odbior) ||
                            localStorage.getItem('lesa_protocol_odbior_' + projectId) ||
                            localStorage.getItem('lesa_protokol_loops_' + projectId);
       if (pOdbiorSaved) {
           hasDocs = true;
           let d = 'Zapisano w systemie';
           if (proj.protocols && proj.protocols.odbiorDate) {
               d = new Date(proj.protocols.odbiorDate).toLocaleDateString('pl-PL');
           } else if (localProj.protocols && localProj.protocols.odbiorDate) {
               d = new Date(localProj.protocols.odbiorDate).toLocaleDateString('pl-PL');
           } else if (typeof pOdbiorSaved === 'string') {
               try {
                   const parsed = JSON.parse(pOdbiorSaved);
                   if (parsed.savedAt) d = new Date(parsed.savedAt).toLocaleDateString('pl-PL');
                   else if (parsed.data && parsed.data.date) d = parsed.data.date;
               } catch(e) {}
           }
           docsHtml += `<div class="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-2 mb-1.5 hover:border-purple-300 transition-colors">
               <div class="flex items-center gap-2.5">
                   <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   </div>
                   <div class="flex flex-col">
                      <span class="font-bold text-slate-800 text-xs">Karta Gwarancyjna / Protokół Odbioru</span> 
                      <span class="text-slate-400 text-[10px]">Data: ${d} &bull; Pętle i rozdzielacze</span>
                   </div>
               </div>
               <div class="flex items-center gap-1.5 shrink-0">
                   <button onclick="AdminApp.openProjectInTool('odbior')" class="text-[10px] px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-bold transition-colors">Otwórz &rarr;</button>
                   <button onclick="AdminApp.deleteProjectDoc('odbior', '', '${projectId}')" title="Usuń protokół odbioru" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                       <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                   </button>
               </div>
           </div>`;
       }

       // --- 5. POZOSTAŁE PLIKI (np. wgrane PDF / DOC) ---
       if (window.ApiService) {
           const files = await ApiService.getProjectFiles(projectId);
           const otherDocs = files.filter(f => {
               const ft = (f.fileType || f.file_type || '').toLowerCase();
               const fn = (f.fileName || f.file_name || '').toLowerCase();
               return !ft.startsWith('photo') && ft !== 'cad' && (fn.endsWith('.pdf') || fn.endsWith('.doc') || fn.endsWith('.docx') || ft === 'protocol' || ft === 'document');
           });
           if (otherDocs.length > 0) {
               hasDocs = true;
               otherDocs.forEach(f => {
                   const url = f.fileUrl || f.file_url;
                   const fn = f.fileName || f.file_name || 'Dokument';
                   docsHtml += `<div class="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-2 mb-1.5 hover:border-blue-300 transition-colors">
                       <div class="flex items-center gap-2.5">
                           <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                               <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>
                           </div>
                           <div class="flex flex-col truncate max-w-[200px]">
                              <span class="font-bold text-slate-800 text-xs truncate" title="${fn}">${fn}</span> 
                              <span class="text-slate-400 text-[10px]">Plik na serwerze</span>
                           </div>
                       </div>
                       <div class="flex items-center gap-1.5 shrink-0">
                           <a href="${url}" target="_blank" class="text-[10px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-bold transition-colors">Pobierz</a>
                           <button onclick="AdminApp.deleteProjectDoc('file', '${f.id}', '${projectId}')" title="Usuń plik z serwera" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                           </button>
                       </div>
                   </div>`;
               });
           }
       }
       
       if (hasDocs) {
           listEl.innerHTML = docsHtml;
       } else {
           listEl.innerHTML = '<div class="text-slate-400 py-2">Brak zapisanych dokumentów dla tego projektu. Użyj przycisków powyżej (Oferta, Umowa, Protokoły), aby wygenerować dokumentację.</div>';
       }
    } catch(e) {
       console.error(e);
       listEl.innerHTML = '<div class="text-red-400 py-2">Błąd podczas ładowania dokumentów.</div>';
    }
  },

  async deleteProjectDoc(type, docId, projectId) {
    let confirmMsg = 'Czy na pewno chcesz usunąć ten dokument?';
    if (type === 'contract') confirmMsg = 'Czy na pewno chcesz trwale usunąć tę umowę z bazy danych?';
    if (type === 'offer') confirmMsg = 'Czy na pewno chcesz trwale usunąć tę ofertę z bazy danych?';
    if (type === 'szczelnosc') confirmMsg = 'Czy na pewno chcesz usunąć zapisany protokół szczelności dla tego projektu?';
    if (type === 'odbior') confirmMsg = 'Czy na pewno chcesz usunąć zapisany protokół odbioru dla tego projektu?';
    if (type === 'file') confirmMsg = 'Czy na pewno chcesz trwale usunąć ten plik z serwera?';

    if (!confirm(confirmMsg)) return;

    try {
      if (type === 'contract') {
        if (window.ApiService && typeof ApiService.deleteContract === 'function') {
          await ApiService.deleteContract(docId);
        } else {
          let contracts = JSON.parse(localStorage.getItem('lesa_contracts_history') || '[]');
          contracts = contracts.filter(c => c.id !== docId);
          localStorage.setItem('lesa_contracts_history', JSON.stringify(contracts));
        }
        if (typeof this.loadContractsData === 'function') this.loadContractsData();
        this.showToast('Pomyślnie usunięto umowę.');
      } else if (type === 'offer') {
        if (window.ApiService && typeof ApiService.deleteOffer === 'function') {
          await ApiService.deleteOffer(docId);
        } else {
          let offers = JSON.parse(localStorage.getItem('lesa_saved_offers') || '[]');
          offers = offers.filter(o => o.id !== docId);
          localStorage.setItem('lesa_saved_offers', JSON.stringify(offers));
        }
        this.showToast('Pomyślnie usunięto ofertę.');
      } else if (type === 'szczelnosc') {
        const proj = this.projects.find(p => p.id === projectId);
        if (proj && proj.protocols) {
          delete proj.protocols.szczelnosc;
          delete proj.protocols.szczelnoscDate;
          delete proj.protocols.szczelnoscData;
          if (window.ApiService) {
            await ApiService.saveProject(proj);
          }
        }
        let localProjects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
        const idx = localProjects.findIndex(p => p.id === projectId);
        if (idx >= 0 && localProjects[idx].protocols) {
          delete localProjects[idx].protocols.szczelnosc;
          delete localProjects[idx].protocols.szczelnoscDate;
          delete localProjects[idx].protocols.szczelnoscData;
          localStorage.setItem('lesa_projects', JSON.stringify(localProjects));
        }
        localStorage.removeItem('lesa_protocol_szczelnosc_' + projectId);
        this.showToast('Pomyślnie usunięto protokół szczelności.');
      } else if (type === 'odbior') {
        const proj = this.projects.find(p => p.id === projectId);
        if (proj && proj.protocols) {
          delete proj.protocols.odbior;
          delete proj.protocols.odbiorDate;
          delete proj.protocols.odbiorData;
          if (window.ApiService) {
            await ApiService.saveProject(proj);
          }
        }
        let localProjects = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
        const idx = localProjects.findIndex(p => p.id === projectId);
        if (idx >= 0 && localProjects[idx].protocols) {
          delete localProjects[idx].protocols.odbior;
          delete localProjects[idx].protocols.odbiorDate;
          delete localProjects[idx].protocols.odbiorData;
          localStorage.setItem('lesa_projects', JSON.stringify(localProjects));
        }
        localStorage.removeItem('lesa_protocol_odbior_' + projectId);
        localStorage.removeItem('lesa_protokol_loops_' + projectId);
        this.showToast('Pomyślnie usunięto protokół odbioru.');
      } else if (type === 'file') {
        if (window.ApiService && typeof ApiService.deleteProjectFile === 'function') {
          await ApiService.deleteProjectFile(docId);
        }
        this.showToast('Pomyślnie usunięto plik z serwera.');
      }

      this.loadProjectDocs(projectId);
    } catch (e) {
      console.error(e);
      this.showToast('Błąd podczas usuwania: ' + e.message);
    }
  },

  loadProjectCadData(projectId) {
    const proj = this.projects.find(p => p.id === projectId);
    const cadList = document.getElementById('pd-cad-files-list');
    if (!cadList) return;
    
    if (proj && proj.cad_file) {
       let html = `<div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold mb-2 flex items-center gap-2">
         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
         Projekt CAD został poprawnie zapisany w bazie!
       </div>`;
       
       if (proj.cadData) {
           const area = proj.cadData.area || 0;
           const loops = proj.cadData.loopsCount || 0;
           const mani = proj.cadData.manifolds || 0;
           html += `<div class="text-slate-700 mt-2">
               <strong>Zapisane parametry:</strong><br>
               Powierzchnia: ${area} m²<br>
               Pętle: ${loops} szt.<br>
               Rozdzielacze: ${mani} szt.
           </div>`;
       }
       cadList.innerHTML = html;
    } else {
       cadList.innerHTML = `Brak wgranego pliku CAD. Zaprojektuj rzut w LeSa-CAD i kliknij "Zapisz na serwerze".`;
    }
  },

  async loadProjectPhotos(projectId) {
    const grid = document.getElementById('pd-photos-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="col-span-full text-center text-xs text-slate-400 py-6"><svg class="animate-spin w-5 h-5 mx-auto mb-2 text-slate-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Wczytywanie zdjęć z serwera...</div>';
    
    if (window.ApiService) {
      try {
        const files = await ApiService.getProjectFiles(projectId);
        const photos = (files || []).filter(f => {
          const type = f.fileType || f.file_type || '';
          const url = f.fileUrl || f.file_url || '';
          return type.startsWith('photo') || url.match(/\.(jpg|jpeg|png|webp)$/i);
        });
        
        if (photos.length === 0) {
          grid.innerHTML = '<div class="col-span-full text-center text-xs text-slate-400 py-6">Brak zdjęć z montażu dla tego projektu. Monter może je dodać telefonem z budowy lub możesz wgrać je przyciskiem powyżej.</div>';
          return;
        }
        
        let html = '';
        photos.forEach(p => {
          const fUrl = p.fileUrl || p.file_url;
          const fName = p.fileName || p.file_name;
          const fType = p.fileType || p.file_type || '';
          const rName = p.roomName || p.room_name;
          
          let badgeText = rName;
          if (!badgeText) {
            if (fType === 'photo_inne') badgeText = 'Inne / Ogólne';
            else if (fType.startsWith('photo_room-')) {
               const roomIdx = fType.replace('photo_room-', '');
               const proj = this.projects.find(x => x.id === projectId);
               let roomNameFallback = `Pomieszczenie ${parseInt(roomIdx) + 1}`;
               if (proj && proj.cadData && proj.cadData.rooms && proj.cadData.rooms[roomIdx]) {
                  roomNameFallback = proj.cadData.rooms[roomIdx].name;
               }
               badgeText = roomNameFallback;
            } else {
               badgeText = 'Zdjęcie';
            }
          }
          
          html += `
            <div class="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
              <a href="${fUrl}" target="_blank" class="block aspect-square w-full bg-slate-100 overflow-hidden relative">
                <img src="${fUrl}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="${fName}" loading="lazy">
                <div class="absolute top-1.5 left-1.5">
                   <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-sm shadow">${badgeText}</span>
                </div>
              </a>
              <div class="p-2 bg-white flex flex-col justify-between flex-1">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] font-mono text-slate-600 truncate font-semibold" title="${fName}">${fName}</span>
                  <button onclick="AdminApp.deleteProjectPhoto('${p.id}', '${projectId}')" title="Usuń zdjęcie" class="text-slate-400 hover:text-red-600 transition-colors p-0.5 rounded">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
                <div class="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                  <span>${p.fileSize || p.file_size ? Math.round((p.fileSize || p.file_size) / 1024) + ' KB' : ''}</span>
                  <a href="${fUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 font-bold hover:underline">Powiększ &rarr;</a>
                </div>
              </div>
            </div>
          `;
        });
        
        grid.innerHTML = html;
        
      } catch (e) {
        console.error(e);
        grid.innerHTML = '<div class="col-span-full text-center text-xs text-red-400 py-4">Błąd podczas ładowania zdjęć.</div>';
      }
    }
  },

  async deleteProjectPhoto(fileId, projectId) {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie z serwera?')) return;
    try {
      if (window.ApiService) {
        await ApiService.deleteProjectFile(fileId);
        this.showToast('Zdjęcie zostało usunięte z serwera');
        this.loadProjectPhotos(projectId);
      }
    } catch (e) {
      console.error(e);
      this.showToast('Błąd podczas usuwania zdjęcia');
    }
  },

  async handleAdminPhotoUpload(event) {
    if (!this.currentViewedProjectId) return;
    const file = event.target.files[0];
    if (!file) return;
    
    if (window.ApiService) {
      try {
        this.showToast('Wysyłanie zdjęcia na serwer...');
        await ApiService.uploadSitePhoto(this.currentViewedProjectId, file, 'photo_inne', 'Panel_Admina');
        this.showToast('Zdjęcie zapisane w katalogu /foto/!');
        this.loadProjectPhotos(this.currentViewedProjectId);
      } catch (e) {
        console.error(e);
        this.showToast('Wystąpił błąd podczas wgrywania.');
      }
    }
    // reset input
    event.target.value = '';
  },

  editProject() {
    if (this.currentViewedProjectId) {
      this.openProjectModal(this.currentViewedProjectId);
    }
  },

  async deleteProject() {
    if (!this.currentViewedProjectId) return;
    if (confirm('Czy na pewno usunÄ…Ä‡ ten projekt?')) {
      if (window.ApiService) {
        // Assume deleteProject exists in ApiService, or implement fallback here if needed
        // Since we are mocking/using similar logic:
        let pList = JSON.parse(localStorage.getItem('lesa_projects') || '[]');
        pList = pList.filter(p => p.id !== this.currentViewedProjectId);
        localStorage.setItem('lesa_projects', JSON.stringify(pList));
        
        if (typeof ApiService.deleteProject === 'function') {
           await ApiService.deleteProject(this.currentViewedProjectId);
        }
        
        this.showToast('Projekt usuniÄ™ty.');
        
        const emptyDetails = document.getElementById('project-details-empty');
        const activeDetails = document.getElementById('project-details-active');
        if (activeDetails) activeDetails.classList.add('hidden');
        if (emptyDetails) emptyDetails.classList.remove('hidden');
        
        this.currentViewedProjectId = null;
        this.loadProjectsData();
      }
    }
  },

  openProjectInTool(tool) {
    if (!this.currentViewedProjectId) return;
    const proj = this.projects.find(p => p.id === this.currentViewedProjectId);
    if (!proj) return;
    
    let url = '';
    if (tool === 'cad') url = 'lesa-cad-v2/index.html?projectId=' + proj.id;
    if (tool === 'oferta') url = 'oferta.html?projectId=' + proj.id;
    if (tool === 'umowa' || tool === 'generator') {
      url = 'generator-umow.html?projectId=' + proj.id;
      try {
        const offers = JSON.parse(sessionStorage.getItem('lesa_saved_offers') || localStorage.getItem('lesa_saved_offers') || '[]');
        const o = offers.find(x => x.projectId === proj.id);
        if (o) {
          let net = o.totalNet || o.total_net || 0;
          if (!net && o.scopeItems && Array.isArray(o.scopeItems)) {
            net = o.scopeItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
          }
          if (net > 0) url += '&price=' + net;
        }
      } catch (e) {}
    }
    if (tool === 'szczelnosc' || tool === 'protokol1') url = 'protokol-szczelnosci.html?projectId=' + proj.id;
    if (tool === 'odbior' || tool === 'protokol2') url = 'protokol-odbioru.html?projectId=' + proj.id;
    
    if (url) { localStorage.setItem('lesa_active_project_id', proj.id); window.open(url, '_blank'); }
  },

  async loadContractsData() {
    if (window.ApiService) {
      this.contracts = await ApiService.getContracts() || [];
      this.renderContractsList();
      this.updateDashboardKPIs();
    }
  },

  renderContractsList(filter = '') {
    const tbody = document.getElementById('contracts-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let filtered = this.contracts;
    if (filter) {
      const term = filter.toLowerCase();
      filtered = this.contracts.filter(c => 
        (c.contract_number && c.contract_number.toLowerCase().includes(term)) || 
        (c.client_name && c.client_name.toLowerCase().includes(term))
      );
    }
    
    filtered.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${this.escapeHtml(c.contract_number)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${this.escapeHtml(c.client_name)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${c.created_at}</td>
        </tr>
      `;
    });
  },

  updateDashboardKPIs() {
    const elContracts = document.getElementById('kpi-contracts-count');
    if (elContracts) elContracts.textContent = this.contracts.length;
    
    const bContracts = document.getElementById('badge-contracts-count');
    if (bContracts) bContracts.textContent = this.contracts.length;
    
    const bClients = document.getElementById('badge-clients-count');
    if (bClients) bClients.textContent = this.clients.length;
    
    const bProjects = document.getElementById('badge-projects-count');
    if (bProjects) bProjects.textContent = this.projects.length;

    const scheduled = (this.projects || []).filter(p => !!(p.installationDate || p.installation_date));
    const bCalendar = document.getElementById('badge-calendar-count');
    if (bCalendar) bCalendar.textContent = scheduled.length;

    this.renderDashboardUpcomingInstallations();
  },

    /* ================= MODALS & FORMS ================= */

  async fetchNipData() {
    const nipInput = document.getElementById('modal-client-nip');
    const nip = nipInput.value.replace(/[^0-9]/g, '');
    if (nip.length !== 10) {
      this.showToast('Wpisz poprawny 10-cyfrowy numer NIP.');
      return;
    }
    
    this.showToast('Szukam w rejestrze VAT...');
    try {
      // Pobieranie dzisiejszej daty w formacie YYYY-MM-DD
      const dzisiaj = new Date().toISOString().split('T')[0];
      // Odpytujemy bezpoĹ›rednio API Ministerstwa FinansĂłw (posiada odblokowane CORS)
      const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${dzisiaj}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.result && data.result.subject) {
          const subject = data.result.subject;
          
          let compName = subject.name || '';
          compName = compName.replace(/SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ/ig, 'sp. z o.o.');
          
          document.getElementById('modal-client-name').value = compName;
        
        const fullAddress = subject.workingAddress || subject.residenceAddress || '';
        let street = fullAddress;
        let city = '';
        
        const match = fullAddress.match(/(.*?),?\s*(\d{2}-\d{3}\s+.*)/);
        if (match) {
          street = match[1].trim();
          city = match[2].trim();
        }

        document.getElementById('modal-client-address').value = street;
        document.getElementById('modal-client-city').value = city;
        this.showToast('Pobrano dane z BiaĹ‚ej Listy VAT!');
      } else {
        this.showToast(data.message || 'Nie znaleziono firmy (moĹĽe nie byÄ‡ podatnikiem VAT).');
      }
    } catch (err) {
      this.showToast('BĹ‚Ä…d sieci (SprawdĹş konsolÄ™ przeglÄ…darki).');
      console.error('BĹ‚Ä…d NIP API:', err);
    }
  },

  openClientModal(id = null) {
    document.getElementById('client-modal').classList.remove('hidden');
    if (id) {
      const client = this.clients.find(c => c.id === id);
      if (client) {
        document.getElementById('client-modal-title').textContent = 'Edytuj Kontrahenta';
        document.getElementById('modal-client-id').value = client.id;
        document.getElementById('modal-client-name').value = client.name || client.client_name || '';
        document.getElementById('modal-client-nip').value = client.nip || '';
        document.getElementById('modal-client-phone').value = client.phone || '';
        document.getElementById('modal-client-email').value = client.email || '';
        document.getElementById('modal-client-address').value = client.address || '';
        document.getElementById('modal-client-city').value = client.city || '';
      }
    } else {
      document.getElementById('client-modal-title').textContent = 'Nowy Kontrahent';
      document.getElementById('modal-client-id').value = '';
      document.getElementById('modal-client-name').value = '';
      document.getElementById('modal-client-nip').value = '';
      document.getElementById('modal-client-phone').value = '';
      document.getElementById('modal-client-email').value = '';
      document.getElementById('modal-client-address').value = '';
      document.getElementById('modal-client-city').value = '';
    }
  },

  closeClientModal() {
    document.getElementById('client-modal').classList.add('hidden');
  },

  async saveClientModal() {
    const data = {
      id: document.getElementById('modal-client-id').value || 'c_' + Date.now(),
      name: document.getElementById('modal-client-name').value,
      nip: document.getElementById('modal-client-nip').value,
      phone: document.getElementById('modal-client-phone').value,
      email: document.getElementById('modal-client-email').value,
      address: document.getElementById('modal-client-address').value,
      city: document.getElementById('modal-client-city').value,
    };
    if (!data.name) {
      this.showToast('Nazwa klienta jest wymagana.');
      return;
    }
    if (window.ApiService) {
      await ApiService.saveClient(data);
      this.closeClientModal();
      this.showToast('Zapisano kontrahenta.');
      this.loadClientsData();
      if (typeof this.renderClientsList === 'function') this.renderClientsList();
      if (this.currentViewedClientId === data.id) {
        this.viewClient(data.id);
      }
    }
  },

  renderProjectColorSwatches(selectedHex) {
    const container = document.getElementById('modal-project-color-swatches');
    const input = document.getElementById('modal-project-color');
    if (!container) return;
    if (input) input.value = selectedHex;

    container.innerHTML = this.projectColors.map(c => {
      const isSel = c.hex.toLowerCase() === (selectedHex || '').toLowerCase();
      return `
        <button type="button" onclick="AdminApp.selectProjectColor('${c.hex}')" class="w-7 h-7 rounded-lg transition-transform flex items-center justify-center shadow-sm relative ${isSel ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'}" style="background-color: ${c.hex}">
          ${isSel ? '<svg class="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
        </button>
      `;
    }).join('');
  },

  selectProjectColor(hex) {
    this.renderProjectColorSwatches(hex);
  },

  openProjectModal(id = null, preselectedClientId = null) {
    document.getElementById('project-modal').classList.remove('hidden');
    this.populateClientDropdown();
    
    if (id) {
      const proj = this.projects.find(p => p.id === id);
      if (proj) {
        document.getElementById('project-modal-title').textContent = 'Edytuj Projekt';
        document.getElementById('modal-project-id').value = proj.id;
        document.getElementById('modal-project-client-id').value = proj.client_id || proj.clientId || '';
        document.getElementById('modal-project-title').value = proj.title || proj.projectTitle || '';
        document.getElementById('modal-project-address').value = proj.address || proj.investmentAddress || '';
        document.getElementById('modal-project-city').value = proj.city || proj.investmentCity || '';
        
        const dateInput = document.getElementById('modal-project-installation-date');
        if (dateInput) dateInput.value = proj.installationDate || proj.installation_date || '';
        
        const daysInput = document.getElementById('modal-project-installation-days');
        if (daysInput) daysInput.value = proj.installationDays || proj.installation_days || 1;

        if (document.getElementById('modal-project-status')) {
          document.getElementById('modal-project-status').value = proj.status || 'Nowy';
        }
        this.updateClientDropdownText(proj.client_id || proj.clientId);

        const curColor = proj.color || this.getProjectColor(proj).hex;
        this.renderProjectColorSwatches(curColor);
      }
    } else {
      document.getElementById('project-modal-title').textContent = 'Nowy Projekt';
      document.getElementById('modal-project-id').value = '';
      const cId = preselectedClientId || '';
      document.getElementById('modal-project-client-id').value = cId;
      document.getElementById('modal-project-title').value = '';
      document.getElementById('modal-project-address').value = '';
      document.getElementById('modal-project-city').value = '';
      
      const dateInput = document.getElementById('modal-project-installation-date');
      if (dateInput) dateInput.value = '';
      
      const daysInput = document.getElementById('modal-project-installation-days');
      if (daysInput) daysInput.value = 1;

      if (document.getElementById('modal-project-status')) {
        document.getElementById('modal-project-status').value = 'Nowy';
      }
      this.updateClientDropdownText(cId);

      const randColor = this.projectColors[Math.floor(Math.random() * this.projectColors.length)].hex;
      this.renderProjectColorSwatches(randColor);
    }
  },
  
  openProjectModalForClient() {
    this.openProjectModal(null, this.currentViewedClientId);
  },

  closeProjectModal() {
    document.getElementById('project-modal').classList.add('hidden');
    const menu = document.getElementById('client-dropdown-menu');
    if (menu) menu.classList.add('hidden');
  },

  toggleClientDropdown() {
    const menu = document.getElementById('client-dropdown-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  populateClientDropdown() {
    const ul = document.getElementById('client-dropdown-ul');
    if (!ul) return;
    ul.innerHTML = '';
    this.clients.forEach(c => {
      const li = document.createElement('li');
      li.className = 'px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 cursor-pointer rounded-lg';
      li.textContent = c.name || c.client_name;
      li.onclick = () => {
        document.getElementById('modal-project-client-id').value = c.id;
        this.updateClientDropdownText(c.id);
        this.toggleClientDropdown();
      };
      ul.appendChild(li);
    });
  },

  updateClientDropdownText(clientId) {
    const span = document.getElementById('client-dropdown-text');
    if (!span) return;
    if (!clientId) {
      span.textContent = '-- Wybierz klienta z listy --';
      return;
    }
    const c = this.clients.find(x => x.id === clientId);
    span.textContent = c ? (c.name || c.client_name) : '-- Wybierz klienta z listy --';
  },

  async saveProjectModal() {
    const instDate = document.getElementById('modal-project-installation-date')?.value || '';
    const instDays = parseInt(document.getElementById('modal-project-installation-days')?.value || '1', 10) || 1;
    const pColor = document.getElementById('modal-project-color')?.value || '';

    const data = {
      id: document.getElementById('modal-project-id').value || 'p_' + Date.now(),
      client_id: document.getElementById('modal-project-client-id').value,
      title: document.getElementById('modal-project-title').value,
      address: document.getElementById('modal-project-address').value,
      city: document.getElementById('modal-project-city').value,
      color: pColor,
      installation_date: instDate,
      installationDate: instDate,
      installation_days: instDays,
      installationDays: instDays,
      status: document.getElementById('modal-project-status') ? document.getElementById('modal-project-status').value : 'Nowy'
    };
    if (!data.title || !data.client_id) {
      this.showToast('Wybierz klienta i podaj nazwę projektu.');
      return;
    }
    if (window.ApiService) {
      await ApiService.saveProject(data);
      this.closeProjectModal();
      this.showToast('Zapisano projekt.');
      await this.loadProjectsData();
      if (typeof this.renderProjectsList === 'function') this.renderProjectsList();
      if (this.currentViewedProjectId === data.id) {
        this.viewProject(data.id);
      }
      if (this.activeTab === 'calendar') {
        this.renderAdminCalendar();
      }
    }
  },

  /* ================= ADMIN MONTER CALENDAR & COLOR CODING ================= */
  changeCalendarMonth(delta) {
    this.calendarMonthOffset += delta;
    this.renderAdminCalendar();
  },

  resetCalendarMonth() {
    this.calendarMonthOffset = 0;
    this.calendarSelectedDate = null;
    this.renderAdminCalendar();
  },

  selectCalendarDate(dateStr) {
    if (this.calendarSelectedDate === dateStr) {
      this.calendarSelectedDate = null;
    } else {
      this.calendarSelectedDate = dateStr;
    }
    this.renderAdminCalendar();
  },

  showAllCalendarTasks() {
    this.calendarSelectedDate = null;
    const filterEl = document.getElementById('admin-cal-status-filter');
    if (filterEl) filterEl.value = 'all';
    this.calendarStatusFilter = 'all';
    this.renderAdminCalendar();
  },

  onCalendarFilterChange() {
    const sel = document.getElementById('admin-cal-status-filter');
    if (sel) this.calendarStatusFilter = sel.value;
    this.renderAdminCalendar();
  },

  renderAdminCalendar() {
    const grid = document.getElementById('admin-calendar-grid');
    const title = document.getElementById('admin-cal-month-title');
    if (!grid) return;

    // Normalizacja projektów z datami montażu
    const allProjects = (this.projects || []).map(p => {
      const col = this.getProjectColor(p);
      return {
        ...p,
        installationDate: p.installationDate || p.installation_date || '',
        installationDays: parseInt(p.installationDays || p.installation_days || 1, 10) || 1,
        colorInfo: col
      };
    });

    // Filtrowanie zadań wg statusu
    let tasks = allProjects.filter(p => {
      if (!p.installationDate) return false;
      
      const st = (p.status || '').toLowerCase().trim();
      if (this.calendarStatusFilter === 'montaz') {
        if (!st.includes('monta') && !st.includes('realizac') && st !== 'do montażu') return false;
      } else if (this.calendarStatusFilter === 'zakonczone') {
        if (!st.includes('zakończ') && !st.includes('odebr')) return false;
      } else if (this.calendarStatusFilter === 'wycena') {
        if (!st.includes('wycen') && !st.includes('nowy') && !st.includes('ofert')) return false;
      }

      return true;
    });

    // Budowanie mapy dni -> lista projektów
    const tasksMap = {};
    allProjects.forEach(task => {
      if (!task.installationDate) return;
      const parts = task.installationDate.split('-').map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return;

      const start = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      const days = task.installationDays || 1;
      for (let i = 0; i < days; i++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + i);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (!tasksMap[dateStr]) tasksMap[dateStr] = [];
        tasksMap[dateStr].push(task);
      }
    });

    const dzisiaj = new Date();
    const todayStr = `${dzisiaj.getFullYear()}-${String(dzisiaj.getMonth() + 1).padStart(2, '0')}-${String(dzisiaj.getDate()).padStart(2, '0')}`;
    const nazwyMiesiecy = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

    const monthDate = new Date(dzisiaj.getFullYear(), dzisiaj.getMonth() + this.calendarMonthOffset, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    if (title) {
      title.textContent = `${nazwyMiesiecy[month]} ${year}`;
    }

    let startDay = monthDate.getDay() - 1;
    if (startDay === -1) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let gridHtml = '';
    for (let i = 0; i < startDay; i++) {
      gridHtml += '<div class="p-2 opacity-0 pointer-events-none"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasksMap[dateStr] || [];
      const hasTasks = dayTasks.length > 0;
      const isToday = (dateStr === todayStr);
      const isSelected = (this.calendarSelectedDate === dateStr);

      let btnClass = "w-full min-h-[46px] p-1 flex flex-col items-center justify-between rounded-xl font-bold transition-all relative text-xs border ";
      if (isSelected) {
        btnClass += "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-offset-2 ring-amber-400 scale-105 z-10";
      } else if (isToday) {
        btnClass += "bg-amber-50/70 text-amber-900 border-amber-300 font-extrabold hover:bg-amber-100/70";
      } else if (hasTasks) {
        btnClass += "bg-white text-slate-800 border-slate-200 hover:border-amber-400 hover:shadow-sm";
      } else {
        btnClass += "bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80";
      }

      let dotsHtml = '';
      if (hasTasks) {
        dotsHtml = '<div class="flex items-center justify-center gap-0.5 mt-0.5 flex-wrap max-w-full px-0.5">';
        const visibleDots = dayTasks.slice(0, 4);
        visibleDots.forEach(t => {
          dotsHtml += `<span class="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style="background-color: ${isSelected ? '#ffffff' : t.colorInfo.hex}" title="${this.escapeHtml(t.title || 'Projekt')}"></span>`;
        });
        if (dayTasks.length > 4) {
          dotsHtml += `<span class="text-[8px] leading-none ${isSelected ? 'text-white' : 'text-slate-500'} font-bold">+${dayTasks.length - 4}</span>`;
        }
        dotsHtml += '</div>';
      }

      gridHtml += `
        <div>
          <button type="button" onclick="AdminApp.selectCalendarDate('${dateStr}')" class="${btnClass}" title="${hasTasks ? dayTasks.length + ' zlecenia' : dateStr}">
            <span>${d}</span>
            ${dotsHtml}
          </button>
        </div>
      `;
    }
    grid.innerHTML = gridHtml;

    let displayedTasks = tasks;
    let headerText = 'Wszystkie zaplanowane zlecenia';
    let subText = `Łącznie w bazie: ${tasks.length} zaplanowanych prac montażowych.`;
    const isFiltered = !!(this.calendarSelectedDate || this.calendarStatusFilter !== 'all');

    if (this.calendarSelectedDate) {
      displayedTasks = tasksMap[this.calendarSelectedDate] || [];
      headerText = `Zlecenia w dniu: ${this.calendarSelectedDate}`;
      subText = `Zaplanowano ${displayedTasks.length} ${displayedTasks.length === 1 ? 'pracę' : 'prac'} na ten dzień.`;
    }

    const headerEl = document.getElementById('admin-cal-tasks-header');
    const subEl = document.getElementById('admin-cal-tasks-sub');
    const btnAll = document.getElementById('admin-cal-btn-all');
    if (headerEl) headerEl.innerHTML = `<span class="truncate">${this.escapeHtml(headerText)}</span>`;
    if (subEl) subEl.textContent = subText;
    if (btnAll) {
      if (isFiltered) btnAll.classList.remove('hidden');
      else btnAll.classList.add('hidden');
    }

    this.renderAdminCalendarTasksList(displayedTasks, isFiltered);
  },

  renderAdminCalendarTasksList(tasks, isFiltered) {
    const listContainer = document.getElementById('admin-cal-tasks-list');
    if (!listContainer) return;

    if (!tasks || tasks.length === 0) {
      listContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p class="text-sm font-bold text-slate-600">Brak zaplanowanych zleceń</p>
          <p class="text-xs text-slate-400 mt-1">${isFiltered ? 'Dla wybranych kryteriów filtrowania nie znaleziono żadnych prac.' : 'Żaden projekt nie ma jeszcze wyznaczonej daty montażu.'}</p>
          ${isFiltered ? '<button onclick="AdminApp.showAllCalendarTasks()" class="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm">Pokaż wszystkie</button>' : ''}
        </div>
      `;
      return;
    }

    const uniqueTasks = [];
    const seenIds = new Set();
    tasks.forEach(t => {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        uniqueTasks.push(t);
      }
    });

    listContainer.innerHTML = uniqueTasks.map(t => {
      const client = (this.clients || []).find(c => c.id === (t.client_id || t.clientId));
      const clientName = client ? (client.name || client.client_name) : (t.clientName || 'Brak danych inwestora');
      const col = t.colorInfo || this.getProjectColor(t);
      const days = t.installationDays || 1;
      const daysLabel = days > 1 ? `${days} dni` : '1 dzień';
      const address = (t.address || t.investmentAddress || '') + (t.city || t.investmentCity ? ', ' + (t.city || t.investmentCity) : '');
      const loops = t.cadData?.loopsCount || 0;

      let statusBadge = '';
      if (t.status === 'Do Montażu' || t.status === 'W trakcie') {
        statusBadge = '<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700">Do Montażu</span>';
      } else if (t.status === 'Zakończone') {
        statusBadge = '<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700">Zakończone</span>';
      } else {
        statusBadge = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">${this.escapeHtml(t.status || 'Nowy')}</span>`;
      }

      return `
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group" style="border-left: 5px solid ${col.hex};">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono">
                📅 ${t.installationDate || 'Termin nieustalony'} (${daysLabel})
              </span>
              ${statusBadge}
              ${loops > 0 ? `<span class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Pętle: ${loops}</span>` : ''}
            </div>
            
            <h4 class="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-2 cursor-pointer" onclick="AdminApp.switchTab('projects'); AdminApp.viewProject('${t.id}')">
              <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" style="background-color: ${col.hex}"></span>
              <span>${this.escapeHtml(t.title || 'Bez nazwy')}</span>
              <svg class="w-3.5 h-3.5 text-slate-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </h4>
            <p class="text-xs text-slate-500 mt-0.5 pl-5">Inwestor: <strong class="text-slate-700">${this.escapeHtml(clientName)}</strong></p>
            ${address ? `<p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1 pl-5"><svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="truncate">${this.escapeHtml(address)}</span></p>` : ''}
          </div>

          <div class="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button onclick="AdminApp.openProjectModal('${t.id}')" class="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Zmień termin / Kolor
            </button>
            <div class="flex items-center gap-1">
              <button onclick="AdminApp.switchTab('projects'); AdminApp.viewProject('${t.id}')" class="px-2.5 py-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors">
                Karta projektu &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderDashboardUpcomingInstallations() {
    const container = document.getElementById('dashboard-upcoming-installations');
    if (!container) return;

    const scheduled = (this.projects || [])
      .filter(p => !!(p.installationDate || p.installation_date))
      .map(p => ({
        ...p,
        installationDate: p.installationDate || p.installation_date,
        installationDays: parseInt(p.installationDays || p.installation_days || 1, 10) || 1,
        colorInfo: this.getProjectColor(p)
      }))
      .sort((a, b) => (a.installationDate || '').localeCompare(b.installationDate || ''));

    if (scheduled.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p class="text-xs font-medium">Brak zaplanowanych montaży na najbliższy czas.</p>
          <button onclick="AdminApp.switchTab('calendar')" class="mt-2 text-xs text-amber-600 hover:underline font-bold">Zaplanuj termin w Kalendarzu &rarr;</button>
        </div>
      `;
      return;
    }

    const upcoming = scheduled.slice(0, 6);
    container.innerHTML = upcoming.map(t => {
      const client = (this.clients || []).find(c => c.id === (t.client_id || t.clientId));
      const clientName = client ? (client.name || client.client_name) : 'Inwestor';
      const col = t.colorInfo;
      const days = t.installationDays > 1 ? `${t.installationDays} dni` : '1 dzień';

      return `
        <div onclick="AdminApp.switchTab('calendar'); AdminApp.selectCalendarDate('${t.installationDate}')" class="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all cursor-pointer flex flex-col justify-between" style="border-left: 4px solid ${col.hex};">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-white border border-slate-200 text-slate-700">📅 ${t.installationDate}</span>
              <span class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${col.hex}"></span>
            </div>
            <p class="text-xs font-bold text-slate-900 truncate">${this.escapeHtml(t.title || 'Zlecenie')}</p>
            <p class="text-[11px] text-slate-500 truncate">${this.escapeHtml(clientName)} &bull; ${days}</p>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Status: <strong class="text-slate-600">${this.escapeHtml(t.status || 'Nowy')}</strong></span>
            <span class="text-amber-600 font-bold hover:underline">Szczegóły &rarr;</span>
          </div>
        </div>
      `;
    }).join('');
  },

  initCadEngine() {
    // placeholder
  },

  async fetchAuditLogs() {
    const tbody = document.getElementById('audit-logs-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Pobieranie danych z bazy...</td></tr>';
    
    try {
      const res = await fetch('api/audit.php');
      if (!res.ok) throw new Error("Brak dostÄ™pu lub bĹ‚Ä…d serwera");
      
      const data = await res.json();
      if (!data.success || !data.logs) {
         tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-400">Brak uprawnieĹ„.</td></tr>';
         return;
      }
      
      if (data.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">Brak historii zdarzeĹ„.</td></tr>';
        return;
      }

      let html = '';
      data.logs.forEach(log => {
        const d = new Date(log.created_at * 1000);
        const dStr = d.toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'});
        
        let detailsText = '';
        if (log.details && log.details !== 'null' && log.details !== '""') {
          try {
             const parsed = JSON.parse(log.details);
             detailsText = typeof parsed === 'object' ? JSON.stringify(parsed).replace(/["{}]/g, '').replace(/:/g, ': ') : parsed;
          } catch(e) {
             detailsText = log.details;
          }
        }
        
        html += `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500">${dStr}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${this.escapeHtml(log.username)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${this.escapeHtml(log.action)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 uppercase">${this.escapeHtml(log.entity_type)}</td>
            <td class="px-6 py-4 text-xs text-slate-500 break-words max-w-xs">${this.escapeHtml(detailsText) || this.escapeHtml(log.entity_id)} <br/><span class="text-[9px] text-slate-300">IP: ${this.escapeHtml(log.ip_address)}</span></td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
      
    } catch(err) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-400">Wystapil blad.</td></tr>';
    }
  }
};

// Expose globally for HTML onclick
window.fetchAuditLogs = () => AdminApp.fetchAuditLogs();

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
  
  // Custom user visibility - show history tab only if logged in user is RafaĹ‚
  const userStr = localStorage.getItem('lesa_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.username) {
        const lowerName = user.username.toLowerCase();
        if (lowerName === 'rafal' || lowerName === 'rafał') {
          const histBtn = document.getElementById('nav-history-btn');
          if (histBtn) histBtn.classList.remove('hidden');
        }
      }
    } catch(e) {}
  }
});







