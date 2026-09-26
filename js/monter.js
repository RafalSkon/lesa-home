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

const MonterApp = {
  projects: [],
  clients: [],
  selectedProjectId: null,
  currentMonthOffset: 0,
  projectColors: PROJECT_COLORS,

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

  async init() {
    this.checkAuth();
    try {
      await this.loadData();
      if (!this.projects) this.projects = [];
      if (!this.clients) this.clients = [];
      this.renderTerminarz();
    } catch (e) {
      console.error(e);
      document.getElementById('monter-calendar-container').innerHTML = '<p class="p-4 text-red-500">Wystąpił błąd ładowania danych: ' + e.message + '</p>';
    }
  },

  async checkAuth() {
    // Security: ALWAYS verify server session first before showing UI
    if (window.ApiService) {
      try {
        const serverAuth = await ApiService.verifySession();
        if (!serverAuth) {
          localStorage.removeItem('lesa_monter_auth');
          window.location.href = 'login.html';
          return;
        }
      } catch (e) {
        if (localStorage.getItem('lesa_monter_auth') !== 'true') {
          window.location.href = 'login.html';
          return;
        }
      }
    } else {
      if (localStorage.getItem('lesa_monter_auth') !== 'true') {
        window.location.href = 'login.html';
        return;
      }
    }

    const loginScreen = document.getElementById('monter-login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    const appScreen = document.getElementById('monter-app');
    if (appScreen) appScreen.classList.remove('hidden');
  },

  async login() {
    const pwd = document.getElementById('monter-password').value;
    const err = document.getElementById('login-error');
    
    // Now logging in strictly via ApiService (which talks to backend)
    // Assuming the user types their username somewhere, but monter.html might only have a password field.
    // If it only has a password field, we can hardcode the username to 'monter' or similar, 
    // but they should really use login.html.
    // We will just redirect them to login.html to be safe.
    window.location.href = 'login.html';
  },

  logout() {
    localStorage.removeItem('lesa_monter_auth');
    localStorage.removeItem('lesa_user');
    
    // Bezpieczeństwo: Kasujemy wszystkie zbuforowane dane aplikacji!
    ['lesa_clients', 'lesa_projects', 'lesa_saved_offers', 'lesa_contracts_history', 'lesa_contractor_profile', 'lesa_active_project_id'].forEach(k => localStorage.removeItem(k));
          
    if (window.ApiService) {
      fetch(ApiService.getBaseUrl() + 'auth.php?action=logout').catch(() => {});
    }
    window.location.href = 'login.html';
  },

  async loadData() {
    if (window.ApiService) {
      this.projects = await ApiService.getProjects();
      this.clients = await ApiService.getClients();
    } else {
      const pData = localStorage.getItem('lesa_projects');
      if (pData) this.projects = JSON.parse(pData);
      
      const cData = localStorage.getItem('lesa_clients');
      if (cData) this.clients = JSON.parse(cData);
    }
  },
  
  getClientName(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    return client ? client.name : 'Nieznany Inwestor';
  },

  renderTerminarz() {
    const container = document.getElementById('monter-calendar-container');
    if (!container) return;

    // Pobierz zlecenia przekazane do montażu
    let tasks = (this.projects || []).filter(p => {
      const st = (p.status || '').toLowerCase().trim();
      const isMonterStatus = st.includes('monta') || st.includes('realizac') || st === 'do montażu';
      const hasDate = !!(p.installationDate || p.installation_date);
      return isMonterStatus && hasDate;
    });

    tasks.forEach(task => {
      task.installationDate = task.installationDate || task.installation_date;
      task.installationDays = parseInt(task.installationDays || task.installation_days || 1, 10) || 1;
      task.clientId = task.clientId || task.client_id;
      task.investmentAddress = task.investmentAddress || task.address;
      task.investmentCity = task.investmentCity || task.city;
      task.projectTitle = task.projectTitle || task.title;
      task.colorInfo = this.getProjectColor(task);
    });

    // Budowanie mapy dni -> lista zadań (odporne na strefy czasowe)
    const tasksMap = {};
    tasks.forEach(task => {
      const dateVal = task.installationDate;
      if (!dateVal) return;
      const parts = dateVal.split('-').map(Number);
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
    this.tasksMap = tasksMap;
    this.monterTasks = tasks;

    const dzisiaj = new Date();
    const todayStr = `${dzisiaj.getFullYear()}-${String(dzisiaj.getMonth() + 1).padStart(2, '0')}-${String(dzisiaj.getDate()).padStart(2, '0')}`;

    const nazwyMiesiecy = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const nazwyDni = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

    const monthDate = new Date(dzisiaj.getFullYear(), dzisiaj.getMonth() + this.currentMonthOffset, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    let html = `
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h4 class="font-bold text-slate-800 mb-3 text-center text-sm">${nazwyMiesiecy[month]} ${year}</h4>
        <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
          ${nazwyDni.map(d => `<div>${d}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-1 text-sm">
    `;

    // przesunięcie, bo niedziela to 0, my chcemy Pn=0
    let startDay = monthDate.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Puste komórki przed pierwszym dniem
    for (let i = 0; i < startDay; i++) {
      html += `<div class="p-2"></div>`;
    }

    // Dni miesiąca
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasksMap[dateStr];
      const hasTasks = dayTasks && dayTasks.length > 0;
      const isToday = (dateStr === todayStr);
      const isSelected = (this.selectedDateStr === dateStr);

      let btnClass = "w-full py-2 sm:py-2.5 flex flex-col items-center justify-between rounded-xl font-bold transition-all relative text-xs min-h-[46px] border ";
      if (isSelected) {
        btnClass += "bg-slate-900 text-white border-slate-950 ring-4 ring-slate-400 shadow-md scale-105 z-10";
      } else if (isToday) {
        btnClass += "bg-blue-50/80 text-blue-700 border-blue-400 font-extrabold hover:bg-blue-100";
      } else if (hasTasks) {
        btnClass += "bg-white text-slate-800 border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 hover:scale-105";
      } else {
        btnClass += "text-slate-700 border-transparent hover:bg-slate-100";
      }

      let dotsHtml = '';
      if (hasTasks) {
        dotsHtml = '<div class="flex items-center justify-center gap-0.5 mt-0.5 flex-wrap max-w-full px-0.5">';
        const visibleDots = dayTasks.slice(0, 3);
        visibleDots.forEach(t => {
          dotsHtml += `<span class="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style="background-color: ${isSelected ? '#ffffff' : t.colorInfo.hex}"></span>`;
        });
        if (dayTasks.length > 3) {
          dotsHtml += `<span class="text-[7px] leading-none ${isSelected ? 'text-white' : 'text-slate-500'} font-bold">+${dayTasks.length - 3}</span>`;
        }
        dotsHtml += '</div>';
      }

      const onclickAttr = `onclick="MonterApp.showDailyTasks('${dateStr}')"`;

      html += `<div><button class="${btnClass}" ${onclickAttr} title="${hasTasks ? 'Zaplanowane zlecenia (' + dayTasks.length + ')' : ''}"><span>${d}</span>${dotsHtml}</button></div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;

    // Render list of tasks (either for selected day or all)
    if (this.selectedDateStr) {
      const dayTasks = this.tasksMap[this.selectedDateStr] || [];
      this.renderTasksList(dayTasks, `Prace w dniu: ${this.selectedDateStr}`, true);
    } else {
      this.renderTasksList(tasks, 'Wszystkie zaplanowane zlecenia', false);
    }
  },

  showDailyTasks(dateStr) {
    this.selectedDateStr = dateStr;
    this.renderTerminarz();
  },

  showAllTasks() {
    this.selectedDateStr = null;
    this.renderTerminarz();
  },

  changeMonth(dir) {
    this.currentMonthOffset += dir;
    this.renderTerminarz();
  },

  resetMonth() {
    this.currentMonthOffset = 0;
    this.selectedDateStr = null;
    this.renderTerminarz();
  },

  renderTasksList(tasks, headerText, isFiltered = false) {
    const header = document.getElementById('daily-tasks-header');
    const listContainer = document.getElementById('monter-projects-list');
    const btnAll = document.getElementById('btn-show-all-tasks');

    if (header) header.innerHTML = `<span class="truncate">${headerText}</span>`;
    if (btnAll) {
      if (isFiltered) btnAll.classList.remove('hidden');
      else btnAll.classList.add('hidden');
    }

    if (!listContainer) return;

    if (!tasks || tasks.length === 0) {
      listContainer.innerHTML = `
        <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p class="text-sm font-bold text-slate-700 mb-1">Brak zleceń w tym terminie</p>
          <p class="text-xs text-slate-400 mb-4">${isFiltered ? 'Nie zaplanowano żadnego montażu na ten dzień.' : 'W bazie nie ma jeszcze zleceń ze statusem "Do Montażu" i wyznaczoną datą.'}</p>
          ${isFiltered ? `<button onclick="MonterApp.showAllTasks()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">Pokaż wszystkie zlecenia</button>` : ''}
        </div>
      `;
      return;
    }

    // Usunięcie duplikatów (jeśli jedno zlecenie trwa kilka dni i wyświetlamy 'wszystkie')
    const uniqueTasks = [];
    const seenIds = new Set();
    tasks.forEach(t => {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        uniqueTasks.push(t);
      }
    });

    listContainer.innerHTML = uniqueTasks.map(task => {
      const clientName = this.getClientName(task.clientId || task.client_id);
      const loops = task.cadData?.loopsCount || 0;
      const duration = task.installationDays || 1;
      const durationText = duration > 1 ? `${duration} dni` : `1 dzień`;
      const dateDisplay = task.installationDate ? `📅 ${task.installationDate} (${durationText})` : `Termin do ustalenia`;
      const col = task.colorInfo || this.getProjectColor(task);

      let badges = '';
      if (task.protocols && task.protocols.szczelnosc) {
        badges += `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Szczelność ✅</span>`;
      }
      if (task.protocols && task.protocols.odbior) {
        badges += `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">Odbiór ✅</span>`;
      }

      return `
        <div onclick="MonterApp.openProjectModal('${task.id}')" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group" style="border-left: 5px solid ${col.hex};">
          <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">${dateDisplay}</span>
            </div>
            <div class="flex items-center gap-1.5">
              ${badges}
              <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Pętli: ${loops}</span>
            </div>
          </div>
          <h3 class="font-bold text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors flex items-center gap-2">
            <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" style="background-color: ${col.hex}"></span>
            <span>${task.projectTitle || task.title || clientName}</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5 font-medium pl-5">Inwestor: <strong class="text-slate-700">${clientName}</strong></p>
          <p class="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span class="truncate font-semibold">${task.investmentAddress || task.address ? (task.investmentAddress || task.address) + (task.investmentCity || task.city ? ', ' + (task.investmentCity || task.city) : '') : 'Brak podanego adresu'}</span>
          </p>
        </div>
      `;
    }).join('');
  },

  openProjectModal(projectId) {
    this.selectedProjectId = projectId;
    const task = this.projects.find(p => p.id === projectId);
    if (!task) return;
    
    const clientName = this.getClientName(task.clientId || task.client_id);
    const duration = task.installationDays || task.installation_days || 1;
    const durationText = duration > 1 ? `${duration} dni` : `1 dzień`;
    const dateStr = (task.installationDate || task.installation_date) ? `📅 ${task.installationDate || task.installation_date} (Czas: ${durationText})` : 'Termin do ustalenia';
    const col = this.getProjectColor(task);
    
    const dateBadge = document.getElementById('modal-date-badge');
    if (dateBadge) {
      dateBadge.textContent = dateStr;
    }

    const titleEl = document.getElementById('modal-project-title');
    if (titleEl) {
      titleEl.innerHTML = `
        <span class="inline-block w-4 h-4 rounded-full shadow-sm mr-1.5 align-middle" style="background-color: ${col.hex}"></span>
        <span>${(task.projectTitle || task.title) ? `${task.projectTitle || task.title} - ${clientName}` : clientName}</span>
      `;
    }

    document.getElementById('modal-project-address').textContent = (task.investmentAddress || task.address) ? (task.investmentAddress || task.address) + (task.investmentCity || task.city ? ', ' + (task.investmentCity || task.city) : '') : 'Brak wpisanego adresu inwestycji';
    
    document.getElementById('modal-loops').textContent = task.cadData?.loopsCount || 0;
    document.getElementById('modal-pipe').textContent = task.cadData?.pipeLength || 0;
    
    const modal = document.getElementById('monter-project-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    const badgeSzczelnosc = document.getElementById('monter-badge-szczelnosc');
    if (badgeSzczelnosc) {
      if (task.protocols && task.protocols.szczelnosc) {
         badgeSzczelnosc.classList.remove('hidden');
         badgeSzczelnosc.classList.add('inline-block');
      } else {
         badgeSzczelnosc.classList.add('hidden');
         badgeSzczelnosc.classList.remove('inline-block');
      }
    }

    const badgeOdbior = document.getElementById('monter-badge-odbior');
    if (badgeOdbior) {
      if (task.protocols && task.protocols.odbior) {
         badgeOdbior.classList.remove('hidden');
         badgeOdbior.classList.add('inline-block');
      } else {
         badgeOdbior.classList.add('hidden');
         badgeOdbior.classList.remove('inline-block');
      }
    }
    
    // Ustaw aktywny projekt do protokołów globalnie
    localStorage.setItem('lesa_active_project_id', projectId);
    
    this.renderPhotosSection(task);
  },
  
  closeProject() {
    this.selectedProjectId = null;
    const modal = document.getElementById('monter-project-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  openProtocol(type) {
    if (!this.selectedProjectId) return;
    
    let url = '';
    if (type === 'szczelnosc') url = 'protokol-szczelnosci.html';
    if (type === 'gwarancja') url = 'protokol-odbioru.html';
    
    if (url) {
      window.open(url + '?projectId=' + encodeURIComponent(this.selectedProjectId), '_blank');
    }
  },

  renderPhotosSection(task) {
    const container = document.getElementById('monter-rooms-photos-list');
    if (!container) return;

    let rooms = [];
    if (task.cadData && task.cadData.rooms && task.cadData.rooms.length > 0) {
      rooms = task.cadData.rooms;
    } else {
      rooms = [
        { name: 'Salon' },
        { name: 'Kuchnia' },
        { name: 'Łazienka' },
        { name: 'Kotłownia' },
        { name: 'Korytarz' }
      ];
    }

    let html = '';
    
    const generateRoomItem = (roomName, id, fileTypeLabel) => `
      <div class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-all flex flex-col gap-2.5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex flex-col">
            <span class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <span class="truncate">${roomName}</span>
            </span>
            <div id="photo-status-${id}" class="mt-0.5">
              <span class="text-[11px] text-slate-400">Sprawdzanie zdjęć...</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 shrink-0">
            <!-- 1. Zrób zdjęcie telefonem (Aparat bezpośredni) -->
            <input type="file" accept="image/*" capture="environment" class="hidden" id="camera-upload-${id}" onchange="MonterApp.handlePhotoUpload(event, '${task.id}', '${id}', '${fileTypeLabel}', '${encodeURIComponent(roomName)}')">
            <button onclick="document.getElementById('camera-upload-${id}').click()" id="btn-camera-${id}" title="Zrób zdjęcie aparatem telefonu" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Aparat</span>
            </button>

            <!-- 2. Dodaj z pamięci / galerii telefonu -->
            <input type="file" multiple accept="image/*" class="hidden" id="file-upload-${id}" onchange="MonterApp.handlePhotoUpload(event, '${task.id}', '${id}', '${fileTypeLabel}', '${encodeURIComponent(roomName)}')">
            <button onclick="document.getElementById('file-upload-${id}').click()" id="btn-gallery-${id}" title="Wybierz z pamięci lub galerii urządzenia" class="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>Z pamięci</span>
            </button>
          </div>
        </div>
        
        <!-- Kontener na miniatury zdjęć -->
        <div id="photo-thumbs-${id}" class="flex items-center gap-2 overflow-x-auto pt-1 empty:hidden border-t border-slate-100"></div>
      </div>
    `;

    rooms.forEach((r, idx) => {
       html += generateRoomItem(r.name || `Pomieszczenie ${idx+1}`, `room-${idx}`, `photo_room-${idx}`);
    });

    html += generateRoomItem('Inne / Ogólne', 'inne', 'photo_inne');

    container.innerHTML = html;
    
    this.updatePhotoCounts(task.id);
  },

  async handlePhotoUpload(event, projectId, uiId, fileTypeLabel, encodedRoomName) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const roomName = decodeURIComponent(encodedRoomName || '');
    const statusEl = document.getElementById(`photo-status-${uiId}`);
    const btnCam = document.getElementById(`btn-camera-${uiId}`);
    const btnGal = document.getElementById(`btn-gallery-${uiId}`);
    
    if (statusEl) {
      statusEl.innerHTML = `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 animate-pulse"><svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Wgrywanie ${files.length} zdjęć na serwer...</span>`;
    }
    if (btnCam) btnCam.disabled = true;
    if (btnGal) btnGal.disabled = true;
    
    try {
      for (let i = 0; i < files.length; i++) {
        await ApiService.uploadSitePhoto(projectId, files[i], fileTypeLabel, roomName);
      }
      await this.updatePhotoCounts(projectId);
    } catch (err) {
      console.error("Błąd podczas wgrywania zdjęć:", err);
      alert('Nie udało się wgrać niektórych zdjęć. Sprawdź połączenie.');
      await this.updatePhotoCounts(projectId);
    } finally {
      if (btnCam) btnCam.disabled = false;
      if (btnGal) btnGal.disabled = false;
      event.target.value = '';
    }
  },

  async updatePhotoCounts(projectId) {
    if (!window.ApiService) return;
    
    try {
      const files = await ApiService.getProjectFiles(projectId);
      
      const photos = (files || []).filter(f => {
        const type = f.fileType || f.file_type || '';
        const url = f.fileUrl || f.file_url || '';
        return type.startsWith('photo') || url.match(/\.(jpg|jpeg|png|webp)$/i);
      });

      const statusEls = document.querySelectorAll('[id^="photo-status-"]');
      statusEls.forEach(el => {
        const uiId = el.id.replace('photo-status-', '');
        const targetFileType = uiId === 'inne' ? 'photo_inne' : `photo_${uiId}`;
        const thumbsEl = document.getElementById(`photo-thumbs-${uiId}`);

        const roomPhotos = photos.filter(p => {
          const type = p.fileType || p.file_type || '';
          return type === targetFileType;
        });

        if (uiId === 'inne') {
          photos.forEach(p => {
            const type = p.fileType || p.file_type || '';
            if (type === 'photo' && !roomPhotos.some(rp => rp.id === p.id)) {
              roomPhotos.push(p);
            }
          });
        }

        const count = roomPhotos.length;
        if (count > 0) {
          el.innerHTML = `
            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Zapisano na serwerze (${count} ${count === 1 ? 'zdjęcie' : (count < 5 ? 'zdjęcia' : 'zdjęć')})
            </span>
          `;
          
          if (thumbsEl) {
            thumbsEl.innerHTML = roomPhotos.map(p => {
              const url = p.fileUrl || p.file_url;
              const name = p.fileName || p.file_name;
              return `
                <div class="relative group/thumb shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                  <a href="${url}" target="_blank" class="block w-full h-full">
                    <img src="${url}" class="w-full h-full object-cover transition-transform group-hover/thumb:scale-105" alt="${name}">
                  </a>
                  <button onclick="MonterApp.deletePhoto('${p.id}', '${projectId}')" title="Usuń zdjęcie" class="absolute top-0.5 right-0.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition-all opacity-80 hover:opacity-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div class="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white px-1 truncate font-mono">${name}</div>
                </div>
              `;
            }).join('');
          }
        } else {
          el.innerHTML = `<span class="text-[11px] text-slate-400">Brak wgranych zdjęć</span>`;
          if (thumbsEl) thumbsEl.innerHTML = '';
        }
      });
      
    } catch (e) {
      console.error("Błąd podczas pobierania zdjęć:", e);
      const statusEls = document.querySelectorAll('[id^="photo-status-"]');
      statusEls.forEach(el => el.innerHTML = `<span class="text-[11px] text-slate-400">Brak wgranych zdjęć</span>`);
    }
  },

  async deletePhoto(photoId, projectId) {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie z serwera?')) return;
    try {
      if (window.ApiService) {
        await ApiService.deleteProjectFile(photoId);
        await this.updatePhotoCounts(projectId);
      }
    } catch (e) {
      console.error(e);
      alert('Nie udało się usunąć zdjęcia: ' + e.message);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MonterApp.init());
} else {
  MonterApp.init();
}


