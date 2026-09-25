/**
 * LeSa - Home: Admin Hub & CAD Engineering Controller
 * Authentication, Dashboard KPIs, Contracts Registry, CAD Loop Engine, CRM Leads
 */

const AdminApp = {
  activeTab: 'dashboard',
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
    
    const cdAddress = document.getElementById('cd-address');
    if (cdAddress) cdAddress.textContent = (client.address || '') + (client.city ? ', ' + client.city : '');
    
    const cdContact = document.getElementById('cd-contact');
    if (cdContact) cdContact.textContent = (client.phone || '') + (client.email ? ' | ' + client.email : '');
    
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
      container.innerHTML = '<p class="text-xs text-slate-500 text-center p-4">Brak projektĂłw.</p>';
      return;
    }
    
    filtered.forEach(p => {
      const c = this.clients.find(x => x.id === p.client_id);
      const cName = c ? (c.name || c.client_name) : 'Brak klienta';
      container.innerHTML += `
        <div onclick="AdminApp.viewProject('${p.id}')" class="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <p class="text-sm font-bold text-slate-800 truncate">${p.title || 'Brak nazwy'}</p>
          <p class="text-[10px] text-slate-500 truncate">${cName}</p>
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

    const titleEl = document.getElementById('pd-project-title');
    if (titleEl) titleEl.textContent = proj.title || 'Brak nazwy';
    
    const c = this.clients.find(x => x.id === proj.client_id);
    const linkEl = document.getElementById('pd-client-link');
    if (linkEl) linkEl.textContent = c ? (c.name || c.client_name) : 'Nieznany klient';
    
    const addressEl = document.getElementById('pd-project-address');
    if (addressEl) addressEl.textContent = 'Adres inwestycji: ' + (proj.address || 'Brak') + (proj.city ? ', ' + proj.city : '');
    
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
                       <button onclick="AdminApp.openProjectInTool('umowa')" class="text-[10px] px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-orange-700 font-bold font-mono transition-colors">Otwórz (${c.contractNo || 'UM'})</button>
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
                   <button onclick="AdminApp.openProjectInTool('oferta')" class="text-[10px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 font-bold font-mono transition-colors">Otwórz (${o.number || 'OFE'})</button>
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
               <button onclick="AdminApp.openProjectInTool('szczelnosc')" class="text-[10px] px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-sky-700 font-bold transition-colors">Otwórz &rarr;</button>
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
               <button onclick="AdminApp.openProjectInTool('odbior')" class="text-[10px] px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-700 font-bold transition-colors">Otwórz &rarr;</button>
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
                       <a href="${url}" target="_blank" class="text-[10px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-bold transition-colors shrink-0">Pobierz</a>
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
    
    grid.innerHTML = '<div class="col-span-full text-center text-xs text-slate-400 py-4">Wczytywanie zdjÄ™Ä‡...</div>';
    
    if (window.ApiService) {
      try {
        const files = await ApiService.getProjectFiles(projectId);
        const photos = files.filter(f => f.fileType && f.fileType.startsWith('photo'));
        
        if (photos.length === 0) {
          grid.innerHTML = '<div class="col-span-full text-center text-xs text-slate-400 py-4">Brak zdjÄ™Ä‡ z montaĹĽu dla tego projektu. Monter moĹĽe je dodaÄ‡ telefonem z budowy.</div>';
          return;
        }
        
        let html = '';
        photos.forEach(p => {
          let badgeText = 'ZdjÄ™cie';
          if (p.fileType === 'photo_inne') badgeText = 'Inne';
          else if (p.fileType.startsWith('photo_room-')) {
             const roomIdx = p.fileType.replace('photo_room-', '');
             // try to get room name from proj if available, else just ID
             const proj = this.projects.find(x => x.id === projectId);
             let roomName = `Pomieszczenie ${parseInt(roomIdx) + 1}`;
             if (proj && proj.cadData && proj.cadData.rooms && proj.cadData.rooms[roomIdx]) {
                roomName = proj.cadData.rooms[roomIdx].name;
             }
             badgeText = roomName;
          }
          
          html += `
            <div class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
              <a href="${p.fileUrl}" target="_blank" class="block w-full h-full">
                <img src="${p.fileUrl}" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="${p.fileName}">
              </a>
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-4">
                 <p class="text-[9px] text-white font-bold truncate drop-shadow-md">${badgeText}</p>
              </div>
            </div>
          `;
        });
        
        grid.innerHTML = html;
        
      } catch (e) {
        console.error(e);
        grid.innerHTML = '<div class="col-span-full text-center text-xs text-red-400 py-4">BĹ‚Ä…d podczas Ĺ‚adowania zdjÄ™Ä‡.</div>';
      }
    }
  },

  async handleAdminPhotoUpload(event) {
    if (!this.currentViewedProjectId) return;
    const file = event.target.files[0];
    if (!file) return;
    
    if (window.ApiService) {
      try {
        this.showToast('WysyĹ‚anie zdjÄ™cia...');
        await ApiService.uploadSitePhoto(this.currentViewedProjectId, file, 'photo_inne');
        this.showToast('ZdjÄ™cie dodane pomyĹ›lnie!');
        this.loadProjectPhotos(this.currentViewedProjectId);
      } catch (e) {
        console.error(e);
        this.showToast('WystÄ…piĹ‚ bĹ‚Ä…d podczas wgrywania.');
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
    if (tool === 'umowa' || tool === 'generator') url = 'generator-umow.html?projectId=' + proj.id;
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
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${c.contract_number}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${c.client_name}</td>
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
    }
  },

  openProjectModal(id = null) {
    document.getElementById('project-modal').classList.remove('hidden');
    this.populateClientDropdown();
    
    if (id) {
      const proj = this.projects.find(p => p.id === id);
      if (proj) {
        document.getElementById('project-modal-title').textContent = 'Edytuj Projekt';
        document.getElementById('modal-project-id').value = proj.id;
        document.getElementById('modal-project-client-id').value = proj.client_id || '';
        document.getElementById('modal-project-title').value = proj.title || '';
        document.getElementById('modal-project-address').value = proj.address || '';
        document.getElementById('modal-project-city').value = proj.city || '';
        if (document.getElementById('modal-project-status')) document.getElementById('modal-project-status').value = proj.status || 'Nowy';
        this.updateClientDropdownText(proj.client_id);
      }
    } else {
      document.getElementById('project-modal-title').textContent = 'Nowy Projekt';
      document.getElementById('modal-project-id').value = '';
      document.getElementById('modal-project-client-id').value = '';
      document.getElementById('modal-project-title').value = '';
      document.getElementById('modal-project-address').value = '';
      document.getElementById('modal-project-city').value = '';
      if (document.getElementById('modal-project-status')) document.getElementById('modal-project-status').value = 'Nowy';
      this.updateClientDropdownText('');
    }
  },
  
  openProjectModalForClient() {
    this.openProjectModal();
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
    const data = {
      id: document.getElementById('modal-project-id').value || 'p_' + Date.now(),
      client_id: document.getElementById('modal-project-client-id').value,
      title: document.getElementById('modal-project-title').value,
      address: document.getElementById('modal-project-address').value,
      city: document.getElementById('modal-project-city').value,
      status: document.getElementById('modal-project-status') ? document.getElementById('modal-project-status').value : 'Nowy'
    };
    if (!data.title || !data.client_id) {
      this.showToast('Wybierz klienta i podaj nazwÄ™ projektu.');
      return;
    }
    if (window.ApiService) {
      await ApiService.saveProject(data);
      this.closeProjectModal();
      this.showToast('Zapisano projekt.');
      this.loadProjectsData();
      if (typeof this.renderProjectsList === 'function') this.renderProjectsList();
    }
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







