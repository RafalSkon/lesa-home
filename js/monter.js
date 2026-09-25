const MonterApp = {
  projects: [],
  clients: [],
  selectedProjectId: null,
  currentMonthOffset: 0,

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

    // Pobierz zlecenia "Do Montażu" z datą
    let tasks = this.projects.filter(p => p.status === 'Do Montażu' && p.installationDate);
    
    // Budowanie mapy dni -> lista zadań
    const tasksMap = {};
    tasks.forEach(task => {
       const start = new Date(task.installationDate);
       if (isNaN(start.getTime())) return; // skip invalid dates
       const days = task.installationDays || 1;
       for (let i = 0; i < days; i++) {
          const current = new Date(start);
          current.setDate(start.getDate() + i);
          const dateStr = current.toISOString().split('T')[0];
          if (!tasksMap[dateStr]) tasksMap[dateStr] = [];
          tasksMap[dateStr].push(task);
       }
    });
    this.tasksMap = tasksMap; // zapisz globalnie dla kliknięć

    const dzisiaj = new Date();
    let html = '';

    const nazwyMiesiecy = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const nazwyDni = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

    const monthDate = new Date(dzisiaj.getFullYear(), dzisiaj.getMonth() + this.currentMonthOffset, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    
    html += `
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h4 class="font-bold text-slate-700 mb-3 text-center">${nazwyMiesiecy[month]} ${year}</h4>
        <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
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
        const currentCellDate = new Date(year, month, d+1);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const dayTasks = tasksMap[dateStr];
        const hasTasks = dayTasks && dayTasks.length > 0;
        
        const isToday = (dateStr === dzisiaj.toISOString().split('T')[0]);
        
        let btnClass = "w-full py-3 flex items-center justify-center rounded-lg font-medium transition-all ";
        if (hasTasks) {
            btnClass += "bg-blue-600 text-white shadow-md shadow-blue-200 cursor-pointer hover:bg-blue-700 hover:scale-105";
        } else if (isToday) {
            btnClass += "bg-slate-100 text-blue-600 border border-blue-200 font-bold";
        } else {
            btnClass += "text-slate-600 hover:bg-slate-50";
        }
        
        const onclickAttr = hasTasks ? `onclick="MonterApp.showDailyTasks('${dateStr}')"` : ``;
        
        html += `<div><button class="${btnClass}" ${onclickAttr}>${d}</button></div>`;
    }
    
    html += `</div></div>`;
    
    container.innerHTML = html;
  },

  changeMonth(dir) {
    this.currentMonthOffset += dir;
    
    // Resetuj też dolny widok z wybranym dniem by było czyściej (opcjonalne)
    const dailySection = document.getElementById('monter-daily-tasks');
    if (dailySection) dailySection.classList.add('hidden');
    
    this.renderTerminarz();
  },

  showDailyTasks(dateStr) {
    this.selectedDateStr = dateStr;
    const dailySection = document.getElementById('monter-daily-tasks');
    const header = document.getElementById('daily-tasks-header');
    const listContainer = document.getElementById('monter-projects-list');
    
    if (!this.tasksMap[dateStr]) return;
    
    const tasks = this.tasksMap[dateStr];
    header.textContent = `Prace w dniu: ${dateStr}`;
    
    listContainer.innerHTML = tasks.map(task => {
      const clientName = this.getClientName(task.clientId);
      const loops = task.cadData?.loopsCount || 0;
      
      let badges = '';
      if (task.protocols && task.protocols.szczelnosc) {
          badges += `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 ml-2">Szczelność ✅</span>`;
      }
      
      return `
        <div onclick="MonterApp.openProjectModal('${task.id}')" class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer border-l-4 border-l-blue-500">
          <div class="flex justify-between items-start mb-2">
            <span class="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">${task.installationDate} (Trwa: ${task.installationDays || 1} dni)</span>
            <span class="text-xs font-bold text-slate-400 bg-slate-100 px-2 rounded-md py-0.5">Pętli: ${loops}</span>
          </div>
          <h3 class="font-bold text-slate-800 text-lg leading-tight mb-1">${clientName}${badges}</h3>
          <p class="text-sm text-slate-500 font-medium flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span class="truncate">${task.investmentAddress || 'Brak adresu'}</span>
          </p>
        </div>
      `;
    }).join('');
    
    dailySection.classList.remove('hidden');
  },

  openProjectModal(projectId) {
    this.selectedProjectId = projectId;
    const task = this.projects.find(p => p.id === projectId);
    if (!task) return;
    
    const clientName = this.getClientName(task.clientId);
    const dateStr = task.installationDate ? task.installationDate : 'Termin do ustalenia';
    
    document.getElementById('modal-date-badge').textContent = dateStr;
    document.getElementById('modal-project-title').textContent = clientName;
    document.getElementById('modal-project-address').textContent = task.investmentAddress || 'Brak wpisanego adresu inwestycji';
    
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
    }

    let html = '';
    
    const generateRoomItem = (roomName, id, fileTypeLabel) => `
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
        <div class="flex flex-col">
          <span class="font-bold text-slate-700 text-sm">${roomName}</span>
          <span class="text-[10px] text-slate-400" id="photo-count-${id}">Wczytywanie...</span>
        </div>
        <div>
          <input type="file" multiple accept="image/*" class="hidden" id="file-upload-${id}" onchange="MonterApp.handlePhotoUpload(event, '${task.id}', '${id}', '${fileTypeLabel}')">
          <button onclick="document.getElementById('file-upload-${id}').click()" class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors flex items-center gap-1 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Dodaj
          </button>
        </div>
      </div>
    `;

    rooms.forEach((r, idx) => {
       html += generateRoomItem(r.name || \`Pomieszczenie \${idx+1}\`, \`room-\${idx}\`, \`photo_room-\${idx}\`);
    });

    html += generateRoomItem('Inne / Ogólne', 'inne', 'photo_inne');

    container.innerHTML = html;
    
    this.updatePhotoCounts(task.id);
  },

  async handlePhotoUpload(event, projectId, uiId, fileTypeLabel) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const countEl = document.getElementById(\`photo-count-\${uiId}\`);
    if (countEl) countEl.innerHTML = \`<span class="text-blue-500 font-bold">Wysyłanie \${files.length} zdjęć...</span>\`;
    
    try {
      for (let i = 0; i < files.length; i++) {
        await ApiService.uploadSitePhoto(projectId, files[i], fileTypeLabel);
      }
      this.updatePhotoCounts(projectId);
    } catch (err) {
      console.error("Błąd podczas wgrywania zdjęć:", err);
      alert('Nie udało się wgrać niektórych zdjęć. Sprawdź połączenie.');
      this.updatePhotoCounts(projectId);
    }
  },

  async updatePhotoCounts(projectId) {
    if (!window.ApiService) return;
    
    try {
      const files = await ApiService.getProjectFiles(projectId);
      // files have fileType like 'photo_room-0', 'photo_inne', or just 'photo'
      
      const counts = {};
      files.forEach(f => {
        if (!counts[f.fileType]) counts[f.fileType] = 0;
        counts[f.fileType]++;
      });
      
      // Update UI for all room IDs
      // To keep it simple, we just find all elements matching our expected pattern
      // Since we don't have the room list here, we rely on the DOM elements
      const countEls = document.querySelectorAll('[id^="photo-count-"]');
      countEls.forEach(el => {
        const id = el.id.replace('photo-count-', '');
        const fileTypeLabel = id === 'inne' ? 'photo_inne' : \`photo_\${id}\`;
        const c = counts[fileTypeLabel] || 0;
        if (c > 0) {
            el.innerHTML = \`<span class="text-emerald-600 font-bold text-xs">✓ Dodano: \${c}</span>\`;
        } else {
            el.textContent = 'Brak zdjęć';
        }
      });
      
      // Also maybe fallback 'photo' type mapping to 'inne'
      const oldPhotos = counts['photo'] || 0;
      if (oldPhotos > 0) {
        const inneEl = document.getElementById('photo-count-inne');
        if (inneEl) {
           const curr = counts['photo_inne'] || 0;
           inneEl.innerHTML = \`<span class="text-emerald-600 font-bold text-xs">✓ Dodano: \${curr + oldPhotos}</span>\`;
        }
      }
      
    } catch (e) {
      console.error(e);
      const countEls = document.querySelectorAll('[id^="photo-count-"]');
      countEls.forEach(el => el.textContent = 'Brak zdjęć');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MonterApp.init();
});


