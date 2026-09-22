/**
 * LeSa - Home: Admin Hub & CAD Engineering Controller
 * Authentication, Dashboard KPIs, Contracts Registry, CAD Loop Engine, CRM Leads
 */

const AdminApp = {
  activeTab: 'dashboard',
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
  checkAuth() {
    const isAuth = localStorage.getItem('lesa_admin_auth') || sessionStorage.getItem('lesa_admin_auth');
    if (isAuth !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    const authScreen = document.getElementById('auth-screen');
    const adminApp = document.getElementById('admin-app');
    if (authScreen) authScreen.classList.add('hidden');
    if (adminApp) adminApp.classList.remove('hidden');
  },

  bindAuthEvents() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz siï¿½ wylogowaï¿½?')) {
          localStorage.removeItem('lesa_admin_auth');
          sessionStorage.removeItem('lesa_admin_auth');
          localStorage.removeItem('lesa_user');
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
      this.showToast('Konto zostaï¿½o zatwierdzone.');
      this.loadUsers();
    }
  },

  async revokeUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    if (window.ApiService) {
      await ApiService.updateUser(id, user.role, 'pending');
      this.showToast('Konto zostaï¿½o zablokowane.');
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
    this.showToast('Ã¢Åâ¦ Zapisano domyÄ¹âºlne dane firmy dla umÄÅw!');
  },

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
    toast.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-orange-500"></span>
      <span>${msg}</span>
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
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
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
      tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-slate-500">Brak uï¿½ytkownikï¿½w.</td></tr>`;
      return;
    }

    this.users.forEach(u => {
      const isPending = u.status === 'pending';
      tbody.innerHTML += `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${u.username}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            <select class="border-slate-300 rounded text-xs" onchange="AdminApp.updateUserRole('${u.id}', this.value)">
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="monter" ${u.role === 'monter' ? 'selected' : ''}>Monter</option>
            </select>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
              ${u.status}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            ${isPending ? 
              `<button onclick="AdminApp.approveUser('${u.id}')" class="text-emerald-600 hover:text-emerald-900 mr-3">Zatwierdï¿½</button>` : 
              `<button onclick="AdminApp.revokeUser('${u.id}')" class="text-rose-600 hover:text-rose-900 mr-3">Zablokuj</button>`
            }
          </td>
        </tr>
      `;
    });
  },

  async updateUserRole(id, role) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    if (window.ApiService) {
      await ApiService.updateUser(id, role, user.status);
      this.showToast('Zmieniono rolï¿½ uï¿½ytkownika.');
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
      this.updateDashboardKPIs();
    }
  },

  async loadProjectsData() {
    if (window.ApiService) {
      this.projects = await ApiService.getProjects() || [];
      this.updateDashboardKPIs();
    }
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
      this.showToast('Wybierz klienta i podaj nazwÄ projektu.');
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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});

