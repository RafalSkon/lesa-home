/**
 * LeSa - Home: Generator Umowy o Wykonanie Instalacji Ogrzewania Podłogowego
 * Nowa treść prawna: §1–§26 (wersja poprawiona, 2026)
 */

// Helper: konwersja kwoty na słowa
function kwotaSlownie(kwota) {
  const jednosci = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
  const nastki = ["dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście", "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście"];
  const dziesiatki = ["", "dziesięć", "dwadzieścia", "trzydzieści", "czterdzieści", "pięćdziesiąt", "sześćdziesiąt", "siedemdziesiąt", "osiemdziesiąt", "dziewięćdziesiąt"];
  const setki = ["", "sto", "dwieście", "trzysta", "czterysta", "pięćset", "sześćset", "siedemset", "osiemset", "dziewięćset"];
  const grupy = [["", "", ""], ["tysiąc", "tysiące", "tysięcy"], ["milion", "miliony", "milionów"]];

  let liczba = Math.floor(kwota);
  let grosze = Math.round((kwota - liczba) * 100);
  if (liczba === 0) return `zero złotych ${grosze}/100 gr`;

  let wynik = [], g = 0;
  while (liczba > 0) {
    let s = Math.floor((liczba % 1000) / 100);
    let d = Math.floor((liczba % 100) / 10);
    let j = liczba % 10;
    liczba = Math.floor(liczba / 1000);
    if (s === 0 && d === 0 && j === 0) { g++; continue; }
    let czesc = [];
    if (s > 0) czesc.push(setki[s]);
    if (d === 1) { czesc.push(nastki[j]); }
    else { if (d > 0) czesc.push(dziesiatki[d]); if (j > 0) czesc.push(jednosci[j]); }
    let forma = 2;
    if (s === 0 && d === 0 && j === 1) forma = 0;
    else if (d !== 1 && (j >= 2 && j <= 4)) forma = 1;
    let nazwaGrupy = grupy[g][forma];
    if (nazwaGrupy) czesc.push(nazwaGrupy);
    wynik.unshift(czesc.join(" "));
    g++;
  }
  return `${wynik.join(" ")} złotych ${grosze > 0 ? grosze + '/100 gr' : '00/100 gr'}`;
}

const ContractApp = {
  data: {
    contractType: 'B2C',
    contractNo: '',
    contractDate: '',
    contractPlace: 'Warszawa',

    // Wykonawca
    contractorName: 'LeSa - Home | Rafał Skowroński',
    contractorNip: 'NIP: 0000000000',
    contractorRegon: 'REGON: 000000000',
    contractorAddress: 'ul. Instalatorów 15, 00-001 Warszawa',
    contractorPhone: '+48 790 000 000',
    contractorEmail: 'kontakt@lesa-home.pl',
    contractorBank: 'PL 12 1020 0000 0000 1234 5678 9012 (PKO BP)',

    // Zamawiający
    clientName: 'Jan Kowalski',
    clientPesel: '85051201234',
    clientIdCard: 'ABC 123456',
    clientNip: '',
    clientRep: '',
    clientAddress: 'ul. Przykładowa 12/4, 05-500 Piaseczno',
    clientPhone: '+48 600 123 456',
    clientEmail: 'jan.kowalski@email.pl',
    investmentAddress: 'Działka nr 142/5, ul. Słoneczna, 05-500 Piaseczno',

    // Techniczne
    area: 140,
    loops: 13,
    pipeLen: 1190,
    pipeType: 'Rura 5-warstwowa PE-RT II / EVOH 16x2.0 mm (z barierą antydyfuzyjną)',
    manifold: 'Stal nierdzewna szlachetna z przepływomierzami (rotametry magnetyczne) + odpowietrzniki auto',
    screed: 'Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)',
    control: 'Smart Home: termostaty bezprzewodowe w każdym pokoju + listwa sterująca',
    testPressure: true,
    thermalAudit: true,
    edgeTape: true,
    tacker: true,

    // Finansowe
    priceNetto: 19500,
    vatRate: 8,
    priceBrutto: 21060,
    depositPct: 40,
    finalPct: 60,
    paymentDays: 3,

    // Terminy i gwarancja
    dateStart: '',
    dateEnd: '',
    warrantyPipes: '10 lat',
    warrantyMonths: '36',
    attachProtocol: true,
    attachSpec: true,

    // Nowe pola z §3 - dokumentacja
    docSource: 'wykonawca', // 'zamawiajacy' | 'projektant' | 'wykonawca'
    edgeTapeScope: 'wykonawca', // 'wykonawca' | 'jastrych' | 'zamawiajacy'
    screedInScope: false,

    // Konsument §20
    consumerStartDeclaration: true,
  },

  async init() {
    this.loadContractorProfile();
    this.setDefaultDatesAndNumbers();
    await this.loadActiveProjectData();
    this.parseUrlParams();
    this.bindDomElements();
    this.bindEvents();
    this.updateCalculations();
    this.render();
    this.updateDraftsBadge();
    this.initDbProjectSelector();
  },

  loadContractorProfile() {
    try {
      const saved = localStorage.getItem('lesa_contractor_profile');
      if (saved) {
        const prof = JSON.parse(saved);
        if (prof.name) this.data.contractorName = prof.name;
        if (prof.nip) this.data.contractorNip = prof.nip;
        if (prof.address) this.data.contractorAddress = prof.address;
        if (prof.bank) this.data.contractorBank = prof.bank;
        if (prof.phone) this.data.contractorPhone = prof.phone;
        if (prof.email) this.data.contractorEmail = prof.email;
      }
    } catch (e) {}
  },

  setDefaultDatesAndNumbers() {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const end = new Date(today); end.setDate(today.getDate() + 14);
    const start = new Date(today); start.setDate(today.getDate() + 7);
    this.data.contractNo = `UM/LES/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/01`;
    this.data.contractDate = formattedToday;
    this.data.dateStart = start.toISOString().split('T')[0];
    this.data.dateEnd = end.toISOString().split('T')[0];
  },

  async loadActiveProjectData(projectId = null) {
    const activeProjectId = projectId || new URLSearchParams(window.location.search).get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (activeProjectId) {
      try {
        let projects = [];
        if (window.ApiService) { projects = await ApiService.getProjects(); } else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
          this.data.clientName = project.clientName || '';
          this.data.clientAddress = project.clientAddress || '';
          this.data.investmentAddress = project.investmentAddress || project.clientAddress || '';
          this.data.clientNip = project.clientNip ? `NIP: ${project.clientNip}` : '';
          this.data.clientPesel = project.clientPesel || '';
          this.data.clientIdCard = project.clientIdCard || '';
          this.data.clientPhone = project.clientPhone || '';
          this.data.clientEmail = project.clientEmail || '';
          this.data.contractType = project.clientNip ? 'B2B' : 'B2C';
          if (project.cadData) {
            if (project.cadData.area) this.data.area = project.cadData.area;
            if (project.cadData.loopsCount) this.data.loops = project.cadData.loopsCount;
            if (project.cadData.pipeLen) this.data.pipeLen = project.cadData.pipeLen;
          }
        }
      } catch (e) { console.error('Error loading project:', e); }
    }
  },

  async initDbProjectSelector() {
    const select = document.getElementById('db-project-select');
    const btnLoad = document.getElementById('btn-load-db-project');
    if (!select || !btnLoad) return;
    try {
      let projects = [];
      if (window.ApiService) { projects = await ApiService.getProjects(); } else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
      select.innerHTML = '<option value="">-- Wybierz projekt z bazy --</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.clientName} - ${p.name || 'Brak nazwy'} (${new Date(p.createdAt || Date.now()).toLocaleDateString()})`;
        select.appendChild(opt);
      });
      btnLoad.addEventListener('click', async () => {
        if (!select.value) { this.showToast('Wybierz projekt z listy!'); return; }
        await this.loadActiveProjectData(select.value);
        this.bindDomElements(); this.updateCalculations(); this.render();
        this.showToast('Wczytano dane z projektu!');
      });
    } catch (e) {
      select.innerHTML = '<option value="">-- Błąd pobierania bazy --</option>';
    }
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('area')) {
      const area = parseInt(params.get('area'), 10);
      if (area > 0) { this.data.area = area; this.data.loops = Math.ceil(area / 11); this.data.pipeLen = Math.round(area * 8.5); }
    }
    if (params.has('price')) { const price = parseFloat(params.get('price')); if (price > 0) this.data.priceNetto = price; }
    if (params.has('type')) { const type = params.get('type'); if (type === 'B2B' || type === 'B2C') { this.data.contractType = type; this.data.vatRate = type === 'B2B' ? 23 : 8; } }
    if (params.has('screed')) {
      const s = params.get('screed');
      if (s === 'anhydrite') this.data.screed = 'Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)';
      else if (s === 'cement') this.data.screed = 'Tradycyjny miksokret cementowy (w zakresie Wykonawcy)';
      else if (s === 'none') this.data.screed = 'Po stronie Zamawiającego (brak wylewki w umowie)';
    }
  },

  bindDomElements() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    set('inp_contract_no', this.data.contractNo);
    set('inp_contract_date', this.data.contractDate);
    set('inp_contract_place', this.data.contractPlace);

    set('inp_contractor_name', this.data.contractorName);
    set('inp_contractor_nip', this.data.contractorNip);
    set('inp_contractor_regon', this.data.contractorRegon);
    set('inp_contractor_address', this.data.contractorAddress);
    set('inp_contractor_phone', this.data.contractorPhone);
    set('inp_contractor_email', this.data.contractorEmail);
    set('inp_contractor_bank', this.data.contractorBank);

    set('inp_client_name', this.data.clientName);
    set('inp_client_pesel', this.data.clientPesel);
    set('inp_client_id_card', this.data.clientIdCard);
    set('inp_client_address', this.data.clientAddress);
    set('inp_client_phone', this.data.clientPhone);
    set('inp_client_email', this.data.clientEmail);
    set('inp_investment_address', this.data.investmentAddress);

    set('inp_tech_area', this.data.area);
    set('inp_tech_loops', this.data.loops);
    set('inp_tech_pipe_len', this.data.pipeLen);
    set('inp_tech_pipe_type', this.data.pipeType);
    set('inp_tech_manifold', this.data.manifold);
    set('inp_tech_screed', this.data.screed);
    set('inp_tech_control', this.data.control);
    chk('chk_test_pressure', this.data.testPressure);
    chk('chk_thermal_audit', this.data.thermalAudit);
    chk('chk_edge_tape', this.data.edgeTape);
    chk('chk_tacker', this.data.tacker);

    set('inp_price_netto', this.data.priceNetto);
    set('inp_vat_rate', this.data.vatRate);
    set('inp_deposit_pct', this.data.depositPct);
    set('inp_final_pct', this.data.finalPct);
    set('inp_payment_days', this.data.paymentDays);

    set('inp_date_start', this.data.dateStart);
    set('inp_date_end', this.data.dateEnd);
    set('inp_warranty_pipes', this.data.warrantyPipes);
    set('inp_warranty_months', this.data.warrantyMonths);
    chk('chk_attach_protocol', this.data.attachProtocol);
    chk('chk_attach_spec', this.data.attachSpec);
    chk('chk_consumer_start', this.data.consumerStartDeclaration);

    const radios = document.querySelectorAll('input[name="contract_type"]');
    radios.forEach(r => { r.checked = r.value === this.data.contractType; });
    this.toggleB2bB2cFields();
  },

  toggleB2bB2cFields() {
    const b2cBox = document.getElementById('client_b2c_fields');
    const b2bBox = document.getElementById('client_b2b_fields');
    if (this.data.contractType === 'B2B') {
      if (b2cBox) { b2cBox.classList.add('hidden'); b2cBox.classList.remove('grid'); }
      if (b2bBox) { b2bBox.classList.remove('hidden'); b2bBox.classList.add('grid'); }
      if (this.data.vatRate === 8) { this.data.vatRate = 23; const el = document.getElementById('inp_vat_rate'); if (el) el.value = "23"; }
    } else {
      if (b2bBox) { b2bBox.classList.add('hidden'); b2bBox.classList.remove('grid'); }
      if (b2cBox) { b2cBox.classList.remove('hidden'); b2cBox.classList.add('grid'); }
    }
  },

  bindEvents() {
    const form = document.getElementById('contract-form');
    form.addEventListener('input', () => { this.syncDataFromForm(); this.updateCalculations(); this.render(); });
    form.addEventListener('change', () => { this.syncDataFromForm(); this.updateCalculations(); this.render(); });

    const radios = document.querySelectorAll('input[name="contract_type"]');
    radios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.data.contractType = e.target.value;
        this.toggleB2bB2cFields();
        this.updateCalculations();
        this.render();
      });
    });

    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        const icon = trigger.querySelector('svg');
        content.classList.toggle('hidden');
        if (icon) icon.classList.toggle('rotate-180');
      });
    });

    const areaEl = document.getElementById('inp_tech_area');
    if (areaEl) areaEl.addEventListener('input', (e) => {
      const area = parseInt(e.target.value, 10) || 0;
      if (area > 0) {
        const loops = Math.ceil(area / 11); const pipes = Math.round(area * 8.5);
        const lEl = document.getElementById('inp_tech_loops'); if (lEl) lEl.value = loops;
        const pEl = document.getElementById('inp_tech_pipe_len'); if (pEl) pEl.value = pipes;
        this.data.loops = loops; this.data.pipeLen = pipes;
      }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
    });

    document.getElementById('btn-print-doc')?.addEventListener('click', () => window.print());
    document.getElementById('btn-quick-print')?.addEventListener('click', () => window.print());
    document.getElementById('btn-reset-form')?.addEventListener('click', () => { if (confirm('Czy na pewno chcesz wyczyścić formularz i utworzyć nową umowę?')) window.location.href = 'generator-umow.html'; });
    document.getElementById('btn-save-draft')?.addEventListener('click', () => this.saveDraft());
    document.getElementById('btn-load-drafts')?.addEventListener('click', () => this.openDraftsModal());
    document.getElementById('btn-close-modal')?.addEventListener('click', () => this.closeDraftsModal());
    document.getElementById('btn-clear-all-drafts')?.addEventListener('click', () => this.clearAllDrafts());
    document.getElementById('btn-copy-text')?.addEventListener('click', () => this.copyToClipboard());

    const tabForm = document.getElementById('tab-btn-form');
    const tabDoc = document.getElementById('tab-btn-doc');
    const editorCol = document.getElementById('editor-container');
    const previewCol = document.getElementById('preview-container');
    if (tabForm && tabDoc) {
      tabForm.addEventListener('click', () => { tabForm.classList.add('bg-orange-600', 'text-white'); tabForm.classList.remove('text-slate-400'); tabDoc.classList.remove('bg-orange-600', 'text-white'); tabDoc.classList.add('text-slate-400'); editorCol.classList.remove('hidden'); previewCol.classList.add('hidden'); });
      tabDoc.addEventListener('click', () => { tabDoc.classList.add('bg-orange-600', 'text-white'); tabDoc.classList.remove('text-slate-400'); tabForm.classList.remove('bg-orange-600', 'text-white'); tabForm.classList.add('text-slate-400'); editorCol.classList.add('hidden'); previewCol.classList.remove('hidden'); });
    }
  },

  syncDataFromForm() {
    const gv = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const gc = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

    this.data.contractNo = gv('inp_contract_no');
    this.data.contractDate = gv('inp_contract_date');
    this.data.contractPlace = gv('inp_contract_place');

    this.data.contractorName = gv('inp_contractor_name');
    this.data.contractorNip = gv('inp_contractor_nip');
    this.data.contractorRegon = gv('inp_contractor_regon');
    this.data.contractorAddress = gv('inp_contractor_address');
    this.data.contractorPhone = gv('inp_contractor_phone');
    this.data.contractorEmail = gv('inp_contractor_email');
    this.data.contractorBank = gv('inp_contractor_bank');

    this.data.clientName = gv('inp_client_name');
    this.data.clientPesel = gv('inp_client_pesel');
    this.data.clientIdCard = gv('inp_client_id_card');
    this.data.clientNip = gv('inp_client_nip') || '';
    this.data.clientRep = gv('inp_client_rep') || '';
    this.data.clientAddress = gv('inp_client_address');
    this.data.clientPhone = gv('inp_client_phone');
    this.data.clientEmail = gv('inp_client_email');
    this.data.investmentAddress = gv('inp_investment_address');

    this.data.area = parseFloat(gv('inp_tech_area')) || 0;
    this.data.loops = parseInt(gv('inp_tech_loops'), 10) || 0;
    this.data.pipeLen = parseInt(gv('inp_tech_pipe_len'), 10) || 0;
    this.data.pipeType = gv('inp_tech_pipe_type');
    this.data.manifold = gv('inp_tech_manifold');
    this.data.screed = gv('inp_tech_screed');
    this.data.control = gv('inp_tech_control');
    this.data.testPressure = gc('chk_test_pressure');
    this.data.thermalAudit = gc('chk_thermal_audit');
    this.data.edgeTape = gc('chk_edge_tape');
    this.data.tacker = gc('chk_tacker');

    this.data.priceNetto = parseFloat(gv('inp_price_netto')) || 0;
    this.data.vatRate = parseFloat(gv('inp_vat_rate')) || 0;
    this.data.depositPct = parseFloat(gv('inp_deposit_pct')) || 0;
    this.data.finalPct = parseFloat(gv('inp_final_pct')) || 0;
    this.data.paymentDays = parseInt(gv('inp_payment_days'), 10) || 3;

    this.data.dateStart = gv('inp_date_start');
    this.data.dateEnd = gv('inp_date_end');
    this.data.warrantyPipes = gv('inp_warranty_pipes');
    this.data.warrantyMonths = gv('inp_warranty_months');
    this.data.attachProtocol = gc('chk_attach_protocol');
    this.data.attachSpec = gc('chk_attach_spec');
    this.data.consumerStartDeclaration = gc('chk_consumer_start');
  },

  updateCalculations() {
    const netto = this.data.priceNetto;
    const vat = this.data.vatRate;
    const brutto = Math.round(netto * (1 + vat / 100) * 100) / 100;
    this.data.priceBrutto = brutto;
    const el = document.getElementById('inp_price_brutto'); if (el) el.value = brutto;

    const depositVal = Math.round(brutto * (this.data.depositPct / 100));
    const finalVal = Math.round(brutto - depositVal);
    const ddisp = document.getElementById('deposit_amount_display'); if (ddisp) ddisp.textContent = `= ${depositVal.toLocaleString('pl-PL')} zł`;
    const fdisp = document.getElementById('final_amount_display'); if (fdisp) fdisp.textContent = `= ${finalVal.toLocaleString('pl-PL')} zł`;
  },

  applyPreset(preset) {
    if (preset === 'b2c_house') {
      this.data.contractType = 'B2C'; this.data.area = 140; this.data.loops = 13; this.data.pipeLen = 1190;
      this.data.priceNetto = 19500; this.data.vatRate = 8;
      this.data.screed = 'Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)';
      this.data.control = 'Smart Home: termostaty bezprzewodowe w każdym pokoju + listwa sterująca';
      this.showToast('Wczytano profil: Standardowy Dom Jednorodzinny B2C (140m²)');
    } else if (preset === 'b2b_dev') {
      this.data.contractType = 'B2B'; this.data.clientName = 'Bud-Invest Sp. z o.o.';
      this.data.clientNip = 'NIP: 525-100-20-30'; this.data.clientRep = 'Marek Wiśniewski - Członek Zarządu';
      this.data.clientAddress = 'Al. Jerozolimskie 100, 02-001 Warszawa';
      this.data.investmentAddress = 'Osiedle Zielona Dolina, Budynek B, Warszawa';
      this.data.area = 360; this.data.loops = 34; this.data.pipeLen = 3060;
      this.data.priceNetto = 48500; this.data.vatRate = 23; this.data.depositPct = 50; this.data.finalPct = 50;
      this.data.screed = 'Po stronie Zamawiającego (brak wylewki w umowie)';
      this.showToast('Wczytano profil: Inwestycja Deweloperska B2B');
    } else if (preset === 'protocol_only') {
      this.data.attachProtocol = true; this.data.attachSpec = true;
      this.showToast('Przełączono podgląd pod protokół odbioru');
    }
    this.bindDomElements(); this.updateCalculations(); this.render();
  },

  // ===========================
  // RENDER – nowa treść prawna §1–§26
  // ===========================
  render() {
    const container = document.getElementById('rendered-contract');
    if (!container) return;

    const d = this.data;
    const slownieKwota = kwotaSlownie(d.priceBrutto);
    const depositAmt = Math.round(d.priceBrutto * (d.depositPct / 100));
    const finalAmt = Math.round(d.priceBrutto - depositAmt);

    const fmt = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '.................................';
    const dateFormatted = fmt(d.contractDate);
    const startFormatted = fmt(d.dateStart);
    const endFormatted = fmt(d.dateEnd);

    const screedInScope = d.screed && !d.screed.includes('stronie Zamawiającego');

    // --- Nagłówek dokumentu (wspólny) ---
    const headerHtml = (subtitle) => `
      <div class="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center p-1.5 shadow-sm print:bg-orange-600 print-exact">
            <svg class="w-full h-full" viewBox="0 0 100 100" fill="none">
              <path d="M22,64 A36,36 0 1,1 76,77" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
              <path d="M42,30 A20,20 0 0,1 70,58" fill="none" stroke="#e0e7ff" stroke-width="7.5" stroke-linecap="round"/>
              <circle cx="50" cy="50" r="4" fill="#ffffff"/>
            </svg>
          </div>
          <div>
            <span class="text-base font-extrabold tracking-tight text-slate-900 font-heading">LeSa <span class="text-orange-600">HOME</span></span>
            <span class="text-[9px] uppercase tracking-widest text-slate-500 block -mt-1">${subtitle}</span>
          </div>
        </div>
        <div class="text-right text-[11px] text-slate-600">
          <div>Nr umowy: <strong class="text-slate-900 font-mono">${d.contractNo || 'UM/LES/2026/01'}</strong></div>
          <div>Miejscowość: <strong>${d.contractPlace || 'Warszawa'}</strong>, dn. <strong>${dateFormatted}</strong></div>
        </div>
      </div>`;

    // --- STRONA 1 ---
    const page1Html = `
      <div class="document-page">
        ${headerHtml('Nowoczesne Systemy Grzewcze &bull; Instalacje HVAC')}

        <div class="text-center my-4">
          <h1 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">UMOWA O WYKONANIE INSTALACJI OGRZEWANIA PODŁOGOWEGO – WODNEGO</h1>
          <p class="text-[11px] text-slate-500 font-medium mt-0.5">(System Wodnego Ogrzewania Podłogowego w standardzie niskotemperaturowym)</p>
        </div>

        <!-- Strony umowy -->
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 mb-4">
          <p class="font-medium text-slate-700">Zawarta w dniu <strong>${dateFormatted}</strong> r. w <strong>${d.contractPlace}</strong> pomiędzy:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            <div>
              <strong class="text-orange-700 uppercase text-[11px] block">1. WYKONAWCA:</strong>
              <div class="font-bold text-slate-900">${d.contractorName}</div>
              <div class="text-[11px] text-slate-600">Adres siedziby: ${d.contractorAddress}</div>
              <div class="text-[11px] text-slate-600">${d.contractorNip} &bull; ${d.contractorRegon}</div>
              <div class="text-[11px] text-slate-600">Tel: ${d.contractorPhone} &bull; E-mail: ${d.contractorEmail}</div>
            </div>
            <div>
              <strong class="text-slate-700 uppercase text-[11px] block">2. ZAMAWIAJĄCY / INWESTOR:</strong>
              <div class="font-bold text-slate-900">${d.clientName}</div>
              <div class="text-[11px] text-slate-600">Adres: ${d.clientAddress}</div>
              ${d.contractType === 'B2C'
                ? `<div class="text-[11px] text-slate-600">PESEL: ${d.clientPesel || '–'} &bull; Dowód: ${d.clientIdCard || '–'}</div>`
                : `<div class="text-[11px] text-slate-600">${d.clientNip || '–'} &bull; Repr.: ${d.clientRep || 'Zarząd'}</div>`}
              <div class="text-[11px] text-slate-600">Tel: ${d.clientPhone} &bull; E-mail: ${d.clientEmail}</div>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 pt-1 border-t border-slate-200">zwanymi dalej odpowiednio „Wykonawcą" i „Zamawiającym".</p>
        </div>

        <!-- §1. Przedmiot umowy -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 1.</span> Przedmiot Umowy
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Zamawiający zleca, a Wykonawca przyjmuje do wykonania instalację wodnego ogrzewania podłogowego w budynku położonym pod adresem: <strong>${d.investmentAddress}</strong>.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            2. Przedmiotem umowy jest wykonanie instalacji ogrzewania podłogowego w systemie mokrym, z rurami grzewczymi mocowanymi do izolacji termicznej za pomocą klipsów/takerów, na łącznej powierzchni grzewczej ok. <strong>${d.area} m²</strong>, zgodnie z zakresem określonym w niniejszej umowie i ofercie.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            3. Szczegółowy zakres prac określają: <em>a) niniejsza umowa, b) oferta Wykonawcy nr ${d.contractNo}, c) Załącznik nr 1 – Specyfikacja Techniczna (o ile sporządzony i parafowany przez obie strony).</em>
          </p>
        </div>

        <!-- §2. Zakres prac -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 2.</span> Zakres Prac Wykonawcy
          </h2>
          <div class="text-[11.5px] text-slate-700 pl-3 border-l-2 border-orange-300 space-y-0.5 my-1">
            <div>&bull; <strong>Rurociągi:</strong> Montaż rury <em>${d.pipeType}</em> w ilości <strong>${d.loops} pętli</strong>, szacowana długość <strong>${d.pipeLen} mb</strong>.</div>
            <div>&bull; <strong>Rozdzielacze:</strong> <em>${d.manifold}</em>.</div>
            ${screedInScope ? `<div>&bull; <strong>Wylewka posadzkowa:</strong> <em>${d.screed}</em>.</div>` : ''}
            <div>&bull; <strong>Automatyka:</strong> <em>${d.control}</em>.</div>
            <div>&bull; <strong>Usługi dodatkowe:</strong> ${[
              d.testPressure ? 'Próba szczelności pod protokół' : '',
              d.thermalAudit ? 'Projekt ułożenia pętli i bilans cieplny' : '',
              d.edgeTape ? 'Taśmy brzegowe dylatacyjne i folia' : '',
              d.tacker ? 'Mocowanie systemowe Tacker' : ''
            ].filter(Boolean).join(', ') || 'wg oferty'}.</div>
          </div>
          <p class="text-[11px] text-slate-600 text-justify">
            Zakres obejmuje wyłącznie prace wskazane w umowie i ofercie. Jeżeli oferta nie stanowi inaczej, Wykonawca nie wykonuje: izolacji termicznej podłogi, podłoża konstrukcyjnego, instalacji elektrycznej sterowania, montażu i uruchomienia źródła ciepła.
          </p>
        </div>

        <!-- §3. Dokumentacja -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 3.</span> Dokumentacja i Sposób Zaprojektowania
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            Instalacja wykonywana jest na podstawie <strong>opracowania technicznego / schematu wykonawczego Wykonawcy</strong> w zakresie objętym ofertą. Sporządzony rysunek stanowi dokumentację wykonawczą i nie jest projektem budowlanym w rozumieniu przepisów prawa budowlanego, chyba że strony wyraźnie postanowiły inaczej.
          </p>
        </div>

        <!-- §4. Warunki placu budowy -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 4.</span> Warunki Gotowości Placu Budowy
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Zamawiający zobowiązuje się zapewnić przed rozpoczęciem prac:
          </p>
          <ul class="list-disc list-inside text-[11px] text-slate-600 pl-1 space-y-0.5">
            <li>dostęp do budynku i możliwość bezpiecznego prowadzenia robót,</li>
            <li>prawidłowo wykonane i stabilne podłoże, gotową izolację termiczną (jeśli nie w zakresie Wykonawcy),</li>
            <li>odpowiednią temperaturę wewnątrz budynku (min. <strong>+5&deg;C</strong>),</li>
            <li>dostęp do energii elektrycznej i wody,</li>
            <li>informacje o przebiegu istniejących instalacji w warstwach podłogi.</li>
          </ul>
          <p class="text-[10.5px] text-slate-500 italic">
            * Brak przygotowania frontu robót zwalnia Wykonawcę z odpowiedzialności za opóźnienia. Wykonawca może odmówić rozpoczęcia prac do czasu usunięcia stwierdzonych przeszkód.
          </p>
        </div>

        <div class="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 flex justify-between">
          <span>Strona 1 z 3 &bull; Umowa nr ${d.contractNo}</span>
          <span>LeSa - Home &bull; www.lesa-home.pl</span>
        </div>
      </div>

      <!-- ========== STRONA 2 ========== -->
      <div class="document-page">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 mb-4 text-xs text-slate-500">
          <span>Umowa nr: <strong>${d.contractNo}</strong></span>
          <span>Strona 2 z 3</span>
        </div>

        <!-- §5. Dylatacje -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 5.</span> Dylatacje i Taśma Brzegowa
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Zamawiający zobowiązany jest przed rozpoczęciem montażu przekazać Wykonawcy informację o lokalizacji istniejących dylatacji konstrukcyjnych i planowanych dylatacjach jastrychu. Obieg grzewczy nie może przechodzić przez dylatację bez zastosowania rury ochronnej/peszla.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            2. Taśma brzegowa dylatacyjna: <strong>${d.edgeTape ? '☑ w zakresie Wykonawcy' : '☐ po stronie Zamawiającego / wykonawcy jastrychu'}</strong>.
            Wykonawca nie odpowiada za skutki niewłaściwego wykonania dylatacji przez inną ekipę.
          </p>
        </div>

        <!-- §6. Próba szczelności -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 6.</span> Próba Szczelności i Przekazanie Instalacji
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Przed zakryciem instalacji przez jastrych zostanie przeprowadzona próba szczelności (sprężonym powietrzem lub wodą pod ciśnieniem min. 6 bar), potwierdzona <strong>Protokołem Próby Szczelności (Załącznik nr 1)</strong>. Wynik pozytywny stanowi dowód pełnej szczelności instalacji w chwili przekazania.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            2. Zamawiający przyjmuje do wiadomości, że od chwili zakończenia robót Wykonawcy instalacja może zostać uszkodzona przez inne ekipy budowlane. Wykonawca nie odpowiada za uszkodzenia powstałe po odbiorze, jeżeli nie wynikają z wad wykonawczych sprzed odbioru.
          </p>
        </div>

        <!-- §7. Jastrych -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 7.</span> Jastrych / Wylewka
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            ${screedInScope
              ? `Wykonanie jastrychu: <strong>${d.screed}</strong> jest objęte niniejszą umową. Za dobór składu i parametrów odpowiada Wykonawca.`
              : `Wykonanie jastrychu nie jest przedmiotem niniejszej umowy. Za dobór rodzaju, grubości i wykonanie jastrychu odpowiada wykonawca jastrychu lub Zamawiający.`}
            W trakcie wylewania jastrychu instalacja powinna pozostawać pod ciśnieniem kontrolnym min. 3.0 bar. Wykonawca instalacji nie odpowiada za pękanie jastrychu wynikające z nieprawidłowości leżących po stronie wykonawcy jastrychu.
          </p>
        </div>

        <!-- §8. Uruchomienie i regulacja -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 8.</span> Uruchomienie i Regulacja
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            Wykonanie instalacji podłogowej nie jest równoznaczne z uruchomieniem całego systemu grzewczego budynku. Uruchomienie źródła ciepła, ustawienie automatyki pogodowej i krzywej grzewczej jest zakresem odrębnym, chyba że oferta stanowi inaczej. Wykonawca nie gwarantuje osiągnięcia konkretnej temperatury powietrza, jeżeli zależy ona od elementów poza zakresem niniejszej umowy (izolacyjność budynku, moc źródła ciepła, okładzina podłogowa itp.).
          </p>
        </div>

        <!-- §9. Terminy realizacji -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 9.</span> Harmonogram Realizacji
          </h2>
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>Planowany start prac: <strong>${startFormatted}</strong></div>
            <div>Planowane zakończenie i zgłoszenie do odbioru: <strong>${endFormatted}</strong></div>
          </div>
          <p class="text-[11px] text-slate-600 text-justify mt-1">
            Termin może ulec zmianie z przyczyn niezależnych od Wykonawcy (brak dostępu, opóźnienia innych ekip, zmiany dokumentacji, warunki uniemożliwiające bezpieczne prowadzenie prac). Wykonawca informuje Zamawiającego o każdej zmianie terminu, wskazując przyczynę i nowy termin.
          </p>
        </div>

        <!-- §10. Wynagrodzenie i płatności -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 10.</span> Wynagrodzenie i Płatności
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Za wykonanie przedmiotu umowy strony ustalają wynagrodzenie <strong>ryczałtowe</strong> w kwocie: <strong>${d.priceNetto.toLocaleString('pl-PL')} zł netto</strong> + VAT ${d.vatRate}%, łącznie: <strong class="text-slate-900">${d.priceBrutto.toLocaleString('pl-PL')} zł brutto</strong> (słownie: <em>${slownieKwota}</em>).
          </p>
          <div class="text-[11px] text-slate-700 bg-orange-50/50 p-2.5 rounded-lg border border-orange-200 space-y-1">
            <div>&bull; <strong>I Transza – Zaliczka na materiały (${d.depositPct}%):</strong> <strong>${depositAmt.toLocaleString('pl-PL')} zł</strong>, płatna przelewem w terminie 3 dni od zawarcia umowy.</div>
            <div>&bull; <strong>II Transza – Płatność końcowa (${d.finalPct}%):</strong> <strong>${finalAmt.toLocaleString('pl-PL')} zł</strong>, płatna w terminie <strong>${d.paymentDays} dni</strong> od podpisania Protokołu Odbioru Końcowego.</div>
            <div class="text-[10.5px] text-slate-600 font-mono">Nr konta Wykonawcy: <strong>${d.contractorBank}</strong></div>
          </div>
          <p class="text-[11px] text-slate-600 text-justify">
            2. Za dzień zapłaty uznaje się dzień uznania rachunku bankowego Wykonawcy. W przypadku opóźnienia w zapłacie przekraczającego 3 dni robocze Wykonawcy przysługują odsetki ustawowe za opóźnienie oraz prawo do wstrzymania prac.
          </p>
          <p class="text-[11px] text-slate-600 text-justify">
            3. Materiały i urządzenia dostarczone przez Wykonawcę pozostają jego własnością do czasu uiszczenia całości wynagrodzenia (art. 589 KC).
          </p>
        </div>

        <!-- §11. Odbiór końcowy -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 11.</span> Odbiór Końcowy
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Po zakończeniu prac Wykonawca zgłasza gotowość do odbioru. Odbiór potwierdza zgodność prac z umową i wynik próby szczelności. Usterki niemające wpływu na możliwość bezpiecznego zakrycia instalacji nie stanowią podstawy do odmowy odbioru.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            2. Jeżeli Zamawiający nie stawi się na odbiór w terminie wyznaczonym przez Wykonawcę (min. 3 dni robocze od wezwania) lub odmawia podpisania protokołu bez uzasadnienia technicznego, Wykonawca jest uprawniony do sporządzenia <strong>jednostronnego protokołu odbioru</strong>, który wywołuje takie same skutki prawne jak protokół podpisany obustronnie.
          </p>
        </div>

        <div class="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 flex justify-between">
          <span>Strona 2 z 3 &bull; Umowa nr ${d.contractNo}</span>
          <span>LeSa - Home &bull; www.lesa-home.pl</span>
        </div>
      </div>

      <!-- ========== STRONA 3 ========== -->
      <div class="document-page">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 mb-4 text-xs text-slate-500">
          <span>Umowa nr: <strong>${d.contractNo}</strong></span>
          <span>Strona 3 z 3</span>
        </div>

        <!-- §12. Gwarancja i rękojmia -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 12.</span> Gwarancja i Rękojmia
          </h2>
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-1.5">
            <div>Gwarancja na szczelność rurociągów: <strong>${d.warrantyPipes}</strong></div>
            <div>Gwarancja na montaż i osprzęt: <strong>${d.warrantyMonths} miesięcy</strong> od dnia odbioru</div>
          </div>
          <p class="text-[11px] text-slate-600 text-justify">
            Gwarancja nie obejmuje uszkodzeń mechanicznych (przebicie, przewiercenie, zgniecenie rur) powstałych po odbiorze wskutek prac innych wykonawców, zamrożenia instalacji, nieprawidłowej eksploatacji lub materiałów dostarczonych przez Zamawiającego. Zgłoszeń gwarancyjnych dokonuje się w formie pisemnej lub e-mail na adres Wykonawcy; czas reakcji: 7 dni roboczych.
          </p>
        </div>

        <!-- §13. Normy techniczne -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 13.</span> Normy i Przepisy Techniczne
          </h2>
          <p class="text-[11px] text-slate-600 text-justify">
            Instalacja wykonywana jest zgodnie z: <em>PN-EN 1264-1÷4:2021, PN-EN 14336:2025, PN-EN 12831-1:2017</em> oraz zasadami wiedzy technicznej i wymaganiami producentów zastosowanych materiałów.
          </p>
        </div>

        <!-- §14. Zamrożenie instalacji -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 14.</span> Zamrożenie Instalacji
          </h2>
          <p class="text-[11px] text-slate-600 text-justify">
            Instalacja nie może zostać narażona na zamarznięcie. Jeżeli instalacja zostanie napełniona wodą przed uruchomieniem źródła ciepła, Zamawiający zobowiązuje się zapewnić temperaturę budynku uniemożliwiającą zamarznięcie lub uzgodnić z Wykonawcą inne zabezpieczenie. Wykonawca nie odpowiada za szkody wynikające z zamarznięcia instalacji po jej przekazaniu.
          </p>
        </div>

        ${d.contractType === 'B2C' ? `
        <!-- §15. Prawa konsumenta -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 15.</span> Postanowienia Dotyczące Konsumenta
          </h2>
          <p class="text-[11px] text-slate-600 text-justify">
            Zamawiającemu będącemu konsumentem przysługuje prawo odstąpienia od umowy zawartej poza lokalem przedsiębiorstwa lub na odległość w terminie 14 dni od jej zawarcia (ustawa z 30.05.2014 o prawach konsumenta).
          </p>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900">
            <strong>Oświadczenie Zamawiającego (konsument):</strong> „Żądam rozpoczęcia wykonywania usługi przed upływem terminu do odstąpienia od umowy. Przyjmuję do wiadomości, że w przypadku pełnego wykonania usługi przez Wykonawcę utracę prawo do odstąpienia od umowy."<br>
            ${d.consumerStartDeclaration ? '<strong>☑ Zamawiający składa powyższe oświadczenie</strong>' : '☐ Zamawiający nie składa powyższego oświadczenia'}
          </div>
        </div>` : ''}

        <!-- §16. RODO -->
        <div class="space-y-1.5 mb-3">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; ${d.contractType === 'B2C' ? '16' : '15'}.</span> Ochrona Danych Osobowych (RODO)
          </h2>
          <p class="text-[11px] text-slate-600 text-justify">
            Administratorem danych osobowych Zamawiającego jest Wykonawca. Dane przetwarzane są w celu zawarcia i realizacji umowy (art. 6 ust. 1 lit. b i c RODO). Szczegółowe informacje zawiera klauzula informacyjna stanowiąca Załącznik nr 2 do umowy.
          </p>
        </div>

        <!-- §17. Postanowienia końcowe -->
        <div class="space-y-1.5 mb-5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; ${d.contractType === 'B2C' ? '17' : '16'}.</span> Postanowienia Końcowe
          </h2>
          <div class="text-[11px] text-slate-600 space-y-0.5">
            <p>1. Wszelkie zmiany zakresu lub wynagrodzenia wymagają formy dokumentowej lub pisemnej (e-mail jest dopuszczalny, jeśli pozwala jednoznacznie ustalić zakres i wynagrodzenie).</p>
            <p>2. W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz przepisy dot. procesu budowlanego.</p>
            <p>3. Jeżeli którekolwiek z postanowień okaże się nieważne, nie wpływa to na ważność pozostałych.</p>
            <p>4. Strony będą dążyć do polubownego rozwiązywania sporów. W braku porozumienia – sąd właściwy według przepisów ogólnych, z zastrzeżeniem przepisów o właściwości sądu w sprawach konsumenckich.</p>
            <p>5. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.</p>
          </div>
          <div class="text-[10.5px] text-slate-500 mt-1">
            <strong>Załączniki:</strong>
            ${d.attachProtocol ? ' &bull; Załącznik nr 1: Protokół Próby Szczelności i Odbioru Końcowego' : ''}
            ${d.attachSpec ? ' &bull; Załącznik nr 2: Klauzula informacyjna RODO' : ''}
          </div>
        </div>

        <!-- Podpisy -->
        <div class="pt-8 pb-4 border-t-2 border-slate-300 grid grid-cols-2 gap-8 my-6">
          <div class="text-center">
            <div class="border-b border-dashed border-slate-400 pb-12 mb-2"></div>
            <div class="font-bold text-xs text-slate-900">${d.contractorName}</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500">Podpis i pieczęć Wykonawcy</div>
          </div>
          <div class="text-center">
            <div class="border-b border-dashed border-slate-400 pb-12 mb-2"></div>
            <div class="font-bold text-xs text-slate-900">${d.clientName}</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500">Podpis Zamawiającego / Inwestora</div>
          </div>
        </div>

        <div class="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100 flex justify-between">
          <span>Strona 3 z 3 &bull; Umowa nr ${d.contractNo}</span>
          <span>Podpisano w dn. ${dateFormatted}</span>
        </div>
      </div>
    `;

    // --- Protokół Próby Szczelności (Załącznik nr 1) ---
    let protocolHtml = '';
    if (d.attachProtocol) {
      protocolHtml = `
        <div class="document-page">
          ${headerHtml('Nowoczesne Systemy Grzewcze &bull; Protokół Techniczny')}

          <div class="text-center my-4">
            <h2 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">PROTOKÓŁ PRÓBY CIŚNIENIOWEJ I ODBIORU TECHNICZNEGO INSTALACJI</h2>
            <p class="text-[11px] text-slate-500">Załącznik nr 1 do Umowy nr: <strong>${d.contractNo}</strong> &bull; Wg PN-EN 1264-4:2021</p>
          </div>

          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 mb-4">
            <div class="grid grid-cols-2 gap-2">
              <div>Inwestor: <strong>${d.clientName}</strong></div>
              <div>Wykonawca: <strong>${d.contractorName}</strong></div>
            </div>
            <div>Adres inwestycji: <strong>${d.investmentAddress}</strong></div>
            <div class="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <div>Powierzchnia: <strong>${d.area} m²</strong></div>
              <div>Liczba pętli: <strong>${d.loops} sekcji</strong></div>
              <div>Długość rur: <strong>${d.pipeLen} mb</strong></div>
            </div>
          </div>

          <h3 class="font-bold text-xs uppercase text-slate-900 mb-2 flex items-center gap-1">
            <span class="text-orange-600">&bull;</span> Parametry i Przebieg Próby Szczelności
          </h3>
          <table class="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden mb-4">
            <thead class="bg-slate-900 text-white text-[11px]">
              <tr>
                <th class="p-2 border border-slate-700">Parametr techniczny</th>
                <th class="p-2 border border-slate-700">Wartość pomiarowa</th>
                <th class="p-2 border border-slate-700">Ocena techniczna</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-[11px]">
              <tr class="bg-white"><td class="p-2 border border-slate-200 font-medium">Medium próbne:</td><td class="p-2 border border-slate-200 font-bold">Sprężone powietrze / Woda</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Zgodne z normą</td></tr>
              <tr class="bg-slate-50"><td class="p-2 border border-slate-200 font-medium">Ciśnienie próby:</td><td class="p-2 border border-slate-200 font-bold">6.0 bar</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Spełnia (min. 1.5x robocze)</td></tr>
              <tr class="bg-white"><td class="p-2 border border-slate-200 font-medium">Czas trwania próby:</td><td class="p-2 border border-slate-200 font-bold">24 h (lub 120 min skrócona)</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Prawidłowy czas</td></tr>
              <tr class="bg-slate-50"><td class="p-2 border border-slate-200 font-medium">Ciśnienie końcowe / Spadek:</td><td class="p-2 border border-slate-200 font-bold">6.0 bar &bull; Spadek: 0.0 bar</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Brak ubytków</td></tr>
              <tr class="bg-orange-50 font-bold"><td class="p-2 border border-orange-200 text-slate-900">WYNIK KOŃCOWY:</td><td class="p-2 border border-orange-200 text-emerald-800 uppercase" colspan="2">POZYTYWNY &bull; INSTALACJA 100% SZCZELNA</td></tr>
            </tbody>
          </table>

          <h3 class="font-bold text-xs uppercase text-slate-900 mb-2 flex items-center gap-1">
            <span class="text-orange-600">&bull;</span> Weryfikacja Jakościowa Montażu
          </h3>
          <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>&#10003; Rury ułożone bez zagięć i załamań</div>
            <div>&#10003; Taśma brzegowa dylatacyjna kompletna</div>
            <div>&#10003; Rozdzielacz zamocowany i wypoziomowany</div>
            <div>&#10003; Rotametry i zawory odcinające sprawne</div>
            <div>&#10003; Obiegi oznaczone zgodnie ze schematem</div>
            <div>&#10003; Przekazano wytyczne wygrzewania wylewki</div>
          </div>

          <div class="pt-4 pb-2 border-t-2 border-slate-300 grid grid-cols-2 gap-8 my-4">
            <div class="text-center">
              <div class="border-b border-dashed border-slate-400 pb-10 mb-1.5"></div>
              <div class="font-bold text-xs text-slate-900">Podpis Instalatora (LeSa Home)</div>
              <div class="text-[10px] text-slate-500">Potwierdzam wykonanie próby</div>
            </div>
            <div class="text-center">
              <div class="border-b border-dashed border-slate-400 pb-10 mb-1.5"></div>
              <div class="font-bold text-xs text-slate-900">Podpis Inwestora / Zamawiającego</div>
              <div class="text-[10px] text-slate-500">Przyjmuję instalację bez zastrzeżeń</div>
            </div>
          </div>

          <div class="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 flex justify-between">
            <span>Załącznik nr 1 &bull; Protokół Odbioru &bull; Umowa nr ${d.contractNo}</span>
            <span>Data próby: ${endFormatted}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = page1Html + protocolHtml;
  },

  // ===========================
  // Drafts / LocalStorage / API
  // ===========================
  async saveDraft() {
    const draftId = 'draft_' + Date.now();
    const draftItem = { id: draftId, savedAt: new Date().toLocaleString('pl-PL'), contractNo: this.data.contractNo, clientName: this.data.clientName, investmentAddress: this.data.investmentAddress, priceBrutto: this.data.priceBrutto, data: JSON.parse(JSON.stringify(this.data)) };
    if (window.ApiService) { await ApiService.saveContract(draftItem); }
    else { const list = await this.getSavedDrafts(); list.unshift(draftItem); localStorage.setItem('lesa_contracts_history', JSON.stringify(list.slice(0, 30))); }
    this.updateDraftsBadge();
    this.showToast(`Zapisano umowę dla: ${this.data.clientName}`);
  },

  async getSavedDrafts() {
    if (window.ApiService) return await ApiService.getContracts();
    try { const saved = localStorage.getItem('lesa_contracts_history'); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  },

  async updateDraftsBadge() {
    const drafts = this.getSavedDrafts();
    const badge = document.getElementById('saved-count-badge');
    if (badge) {
      if (drafts.length > 0) { badge.textContent = drafts.length; badge.classList.remove('hidden'); badge.classList.add('flex'); }
      else { badge.classList.add('hidden'); badge.classList.remove('flex'); }
    }
  },

  async openDraftsModal() {
    const modal = document.getElementById('history-modal');
    const listContainer = document.getElementById('saved-contracts-list');
    const drafts = this.getSavedDrafts();
    if (drafts.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-8 text-slate-400"><svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><p class="font-medium text-slate-600">Brak zapisanych umów w pamięci</p><p class="text-xs text-slate-400">Wypełnij formularz i kliknij „Zapisz".</p></div>`;
    } else {
      listContainer.innerHTML = drafts.map(item => `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-500 transition-all flex items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2"><span class="font-bold text-sm text-slate-900">${item.clientName || 'Bez nazwy'}</span><span class="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold">${item.contractNo}</span></div>
            <div class="text-xs text-slate-500 mt-0.5">${item.investmentAddress || 'Brak adresu'} &bull; <strong>${Number(item.priceBrutto || 0).toLocaleString('pl-PL')} zł brutto</strong></div>
            <div class="text-[10px] text-slate-400 mt-1">Zapisano: ${item.savedAt}</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors" onclick="ContractApp.loadDraft('${item.id}')">Wczytaj</button>
            <button class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" onclick="ContractApp.deleteDraft('${item.id}')" title="Usuń"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </div>`).join('');
    }
    modal.classList.add('open');
  },

  closeDraftsModal() { document.getElementById('history-modal')?.classList.remove('open'); },

  loadDraft(id) {
    const drafts = this.getSavedDrafts();
    const item = drafts.find(x => x.id === id);
    if (item && item.data) { this.data = item.data; this.bindDomElements(); this.updateCalculations(); this.render(); this.closeDraftsModal(); this.showToast(`Wczytano umowę: ${item.contractNo}`); }
  },

  deleteDraft(id) {
    let drafts = this.getSavedDrafts(); drafts = drafts.filter(x => x.id !== id);
    localStorage.setItem('lesa_contracts_history', JSON.stringify(drafts));
    this.updateDraftsBadge(); this.openDraftsModal();
  },

  async clearAllDrafts() {
    if (confirm('Czy na pewno chcesz usunąć wszystkie zapisane umowy?')) {
      if (!window.ApiService) localStorage.removeItem('lesa_contracts_history');
      this.updateDraftsBadge(); this.openDraftsModal(); this.showToast('Wyczyszczono historię umów.');
    }
  },

  copyToClipboard() {
    const container = document.getElementById('rendered-contract');
    if (!container) return;
    navigator.clipboard.writeText(container.innerText).then(() => this.showToast('📋 Skopiowano treść umowy do schowka!')).catch(() => this.showToast('Nie udało się skopiować automatycznie.'));
  },

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-orange-500"></span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => { ContractApp.init(); });
