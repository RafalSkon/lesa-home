/**
 * LeSa - Home: Generator Umowy o Wykonanie Instalacji Ogrzewania Podłogowego – Wodnego
 * Treść umowy: dosłowna, §1–§26 (wersja poprawiona, plik DOCX 25.09.2026)
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
    let s = Math.floor((liczba % 1000) / 100), d = Math.floor((liczba % 100) / 10), j = liczba % 10;
    liczba = Math.floor(liczba / 1000);
    if (s === 0 && d === 0 && j === 0) { g++; continue; }
    let czesc = [];
    if (s > 0) czesc.push(setki[s]);
    if (d === 1) { czesc.push(nastki[j]); } else { if (d > 0) czesc.push(dziesiatki[d]); if (j > 0) czesc.push(jednosci[j]); }
    let forma = 2;
    if (s === 0 && d === 0 && j === 1) forma = 0;
    else if (d !== 1 && (j >= 2 && j <= 4)) forma = 1;
    let ng = grupy[g][forma]; if (ng) czesc.push(ng);
    wynik.unshift(czesc.join(" ")); g++;
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
    contractorRep: '',

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
    depositAmt: 0,
    paymentDays: 7,
    paymentType: 'ryczaltowy',

    // Terminy i gwarancja
    dateStart: '',
    dateEnd: '',
    warrantyPipes: '10 lat',
    warrantyMonths: '36',

    // Dokumentacja powykonawcza §21
    docProtocol: true,
    docSchema: true,
    docLoopList: true,
    docPhotos: true,
    docManifoldInfo: true,
    docManual: true,

    // Oświadczenie konsumenta §20
    consumerStartDeclaration: true,

    // Załączniki
    attachSpec: true,
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
    const start = new Date(today); start.setDate(today.getDate() + 21);
    const end = new Date(today); end.setDate(today.getDate() + 28);
    this.data.contractNo = `UM/LES/${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/01`;
    this.data.contractDate = today.toISOString().split('T')[0];
    this.data.dateStart = start.toISOString().split('T')[0];
    this.data.dateEnd = end.toISOString().split('T')[0];
  },

  async loadActiveProjectData(projectId = null) {
    const activeProjectId = projectId || new URLSearchParams(window.location.search).get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (!activeProjectId) return;
    try {
      let projects = [];
      let clients = [];
      if (window.ApiService) {
        projects = await ApiService.getProjects() || [];
        try { clients = await ApiService.getClients() || []; } catch (e) {}
      } else {
        projects = JSON.parse(localStorage.getItem('lesa_projects')) || JSON.parse(sessionStorage.getItem('lesa_projects')) || [];
        clients = JSON.parse(localStorage.getItem('lesa_clients')) || JSON.parse(sessionStorage.getItem('lesa_clients')) || [];
      }
      const project = projects.find(p => p.id === activeProjectId);
      if (project) {
        this.data.projectId = project.id;
        
        let cName = project.clientName || project.client_name || '';
        let cAddr = project.clientAddress || '';
        let cNip = project.clientNip || project.client_nip || '';
        let cPesel = project.clientPesel || project.client_pesel || '';
        let cIdCard = project.clientIdCard || project.client_id_card || '';
        let cPhone = project.clientPhone || project.client_phone || '';
        let cEmail = project.clientEmail || project.client_email || '';

        const cId = project.clientId || project.client_id;
        if (cId && clients && clients.length) {
          const c = clients.find(cl => cl.id === cId);
          if (c) {
            if (!cName) cName = c.name || c.client_name || c.companyName || '';
            if (!cAddr) cAddr = c.address || '';
            if (!cNip) cNip = c.nip || '';
            if (!cPesel) cPesel = c.pesel || '';
            if (!cIdCard) cIdCard = c.id_card || '';
            if (!cPhone) cPhone = c.phone || '';
            if (!cEmail) cEmail = c.email || '';
          }
        }

        this.data.clientName = cName;
        this.data.clientAddress = cAddr;

        let invAddr = project.investmentAddress || project.address || '';
        const invCity = project.investmentCity || project.city || '';
        if (invAddr && invCity && !invAddr.toLowerCase().includes(invCity.toLowerCase())) {
          invAddr += ', ' + invCity;
        }
        this.data.investmentAddress = invAddr || cAddr || '';

        this.data.clientNip   = cNip ? (cNip.toUpperCase().startsWith('NIP:') ? cNip : `NIP: ${cNip}`) : '';
        this.data.clientPesel = cPesel;
        this.data.clientIdCard = cIdCard;
        this.data.clientPhone = cPhone;
        this.data.clientEmail = cEmail;
        this.data.contractType = cNip ? 'B2B' : 'B2C';
        this.data.vatRate = cNip ? 23 : 8;

        if (project.cadData) {
          if (project.cadData.area)       this.data.area    = project.cadData.area;
          if (project.cadData.loopsCount) this.data.loops   = project.cadData.loopsCount;
          if (project.cadData.pipeLen)    this.data.pipeLen = project.cadData.pipeLen;
        }

        // --- POBIERANIE OFERTY DLA TEGO PROJEKTU ---
        let offers = [];
        if (window.ApiService && typeof ApiService.getOffers === 'function') {
          try { offers = await ApiService.getOffers() || []; } catch (e) {}
        } else {
          offers = JSON.parse(localStorage.getItem('lesa_saved_offers')) || JSON.parse(sessionStorage.getItem('lesa_saved_offers')) || [];
        }

        const pTitle = (project.title || project.projectTitle || '').trim().toLowerCase();
        const cNameLower = (cName || '').trim().toLowerCase();
        const pId = project.id || activeProjectId;

        // Dopasowanie oferty:
        // 1. Bezpośrednio po projectId
        // 2. Po tytule projektu
        // 3. Po nazwie klienta
        const matchedOffer = offers.find(o => o.projectId && (o.projectId === pId)) ||
                             offers.find(o => pTitle && o.projectName && o.projectName.trim().toLowerCase() === pTitle) ||
                             offers.find(o => cNameLower && o.clientName && o.clientName.trim().toLowerCase().includes(cNameLower));

        if (matchedOffer) {
          let net = 0;
          if (matchedOffer.totalNet && matchedOffer.totalNet > 0) {
            net = matchedOffer.totalNet;
          } else if (matchedOffer.total_net && matchedOffer.total_net > 0) {
            net = matchedOffer.total_net;
          } else if (matchedOffer.net && matchedOffer.net > 0) {
            net = matchedOffer.net;
          } else if (matchedOffer.scopeItems && Array.isArray(matchedOffer.scopeItems)) {
            net = matchedOffer.scopeItems.reduce((acc, it) => {
              const q = parseFloat(String(it.qty).replace(',', '.')) || 0;
              const p = parseFloat(String(it.price).replace(',', '.')) || 0;
              return acc + (q * p);
            }, 0);
          }

          if (net > 0) {
            this.data.priceNetto = Math.round(net * 100) / 100;
          }

          if (!project.cadData) {
            if (matchedOffer.summaryArea) {
              const a = parseFloat(String(matchedOffer.summaryArea).replace(',', '.')) || 0;
              if (a > 0) {
                this.data.area = Math.round(a);
                this.data.loops = Math.ceil(a / 11);
              }
            }
            if (matchedOffer.summaryPipe) {
              const p = parseFloat(String(matchedOffer.summaryPipe).replace(',', '.')) || 0;
              if (p > 0) {
                this.data.pipeLen = Math.round(p);
              }
            }
          }

          this.loadedOffer = matchedOffer;
        } else {
          this.loadedOffer = null;
        }

        const select = document.getElementById('db-project-select');
        if (select && select.value !== activeProjectId) {
          select.value = activeProjectId;
        }
      }
    } catch (e) { console.error('Error loading project:', e); }
  },

  async initDbProjectSelector() {
    const select = document.getElementById('db-project-select');
    const btnLoad = document.getElementById('btn-load-db-project');
    if (!select || !btnLoad) return;
    try {
      let projects = [];
      let clients = [];
      if (window.ApiService) {
        projects = await ApiService.getProjects() || [];
        try { clients = await ApiService.getClients() || []; } catch (e) {}
      } else {
        projects = JSON.parse(localStorage.getItem('lesa_projects')) || JSON.parse(sessionStorage.getItem('lesa_projects')) || [];
        clients = JSON.parse(localStorage.getItem('lesa_clients')) || JSON.parse(sessionStorage.getItem('lesa_clients')) || [];
      }

      const getProjectTitle = (p) => (p.title || p.projectTitle || p.projectName || p.name || '').trim();
      const getClientName = (p) => {
        if (p.clientName) return p.clientName.trim();
        if (p.client_name) return p.client_name.trim();
        const cId = p.clientId || p.client_id;
        if (cId && clients && clients.length) {
          const c = clients.find(cl => cl.id === cId);
          if (c) return (c.name || c.client_name || c.companyName || '').trim();
        }
        return '';
      };

      // Sortowanie alfabetycznie po nazwie projektu
      projects.sort((a, b) => {
        const titleA = getProjectTitle(a) || getClientName(a) || 'Brak nazwy';
        const titleB = getProjectTitle(b) || getClientName(b) || 'Brak nazwy';
        return titleA.localeCompare(titleB, 'pl');
      });

      select.innerHTML = '<option value="">-- Wybierz projekt z bazy --</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const pTitle = getProjectTitle(p);
        const cName = getClientName(p);
        const dateStr = (p.createdAt || p.created_at) ? new Date(p.createdAt || p.created_at).toLocaleDateString('pl-PL') : '';

        let label = '';
        if (pTitle && cName) {
          label = `${pTitle} — ${cName}`;
        } else if (pTitle) {
          label = pTitle;
        } else if (cName) {
          label = `Inwestor: ${cName}`;
        } else {
          label = 'Projekt bez nazwy';
        }

        if (dateStr) {
          label += ` (${dateStr})`;
        }

        opt.textContent = label;
        select.appendChild(opt);
      });

      const activePid = new URLSearchParams(window.location.search).get('projectId') || localStorage.getItem('lesa_active_project_id');
      if (activePid && select.querySelector(`option[value="${activePid}"]`)) {
        select.value = activePid;
      }

      const applySelection = async () => {
        if (!select.value) { this.showToast('Wybierz projekt z listy!'); return; }
        await this.loadActiveProjectData(select.value);
        this.bindDomElements(); this.updateCalculations(); this.render();
        if (this.loadedOffer) {
          const offNo = this.loadedOffer.number ? `[${this.loadedOffer.number}] ` : '';
          this.showToast(`Wczytano dane z projektu i ofertę ${offNo}(${this.data.priceNetto.toLocaleString('pl-PL')} zł netto)!`);
        } else {
          this.showToast('Wczytano dane projektu (brak przypisanej oferty w bazie).');
        }
      };

      btnLoad.addEventListener('click', applySelection);
      select.addEventListener('change', () => {
        if (select.value) {
          applySelection();
        }
      });
    } catch (e) {
      console.error('Błąd bazy projektów:', e);
      select.innerHTML = '<option value="">-- Błąd pobierania bazy --</option>';
    }
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('area')) { const a = parseInt(params.get('area'),10); if (a>0){ this.data.area=a; this.data.loops=Math.ceil(a/11); this.data.pipeLen=Math.round(a*8.5); } }
    if (params.has('price')) { const p = parseFloat(params.get('price')); if (p>0) this.data.priceNetto=p; }
    if (params.has('type')) { const t = params.get('type'); if (t==='B2B'||t==='B2C'){ this.data.contractType=t; this.data.vatRate=t==='B2B'?23:8; } }
  },

  bindDomElements() {
    const set = (id, val) => { const el=document.getElementById(id); if(el) el.value=val; };
    const chk = (id, val) => { const el=document.getElementById(id); if(el) el.checked=val; };

    set('inp_contract_no',    this.data.contractNo);
    set('inp_contract_date',  this.data.contractDate);
    set('inp_contract_place', this.data.contractPlace);

    set('inp_contractor_name',  this.data.contractorName);
    set('inp_contractor_nip',   this.data.contractorNip);
    set('inp_contractor_regon', this.data.contractorRegon);
    set('inp_contractor_address', this.data.contractorAddress);
    set('inp_contractor_phone', this.data.contractorPhone);
    set('inp_contractor_email', this.data.contractorEmail);
    set('inp_contractor_bank',  this.data.contractorBank);

    set('inp_client_name',    this.data.clientName);
    set('inp_client_nip',     (this.data.clientNip || '').replace(/^NIP:\s*/i, ''));
    set('inp_client_rep',     this.data.clientRep || '');
    set('inp_client_pesel',   this.data.clientPesel);
    set('inp_client_id_card', this.data.clientIdCard);
    set('inp_client_address', this.data.clientAddress);
    set('inp_client_phone',   this.data.clientPhone);
    set('inp_client_email',   this.data.clientEmail);
    set('inp_investment_address', this.data.investmentAddress);

    set('inp_tech_area',      this.data.area);
    set('inp_tech_loops',     this.data.loops);
    set('inp_tech_pipe_len',  this.data.pipeLen);
    set('inp_tech_pipe_type', this.data.pipeType);
    set('inp_tech_manifold',  this.data.manifold);
    set('inp_tech_screed',    this.data.screed);
    set('inp_tech_control',   this.data.control);
    chk('chk_test_pressure',  this.data.testPressure);
    chk('chk_thermal_audit',  this.data.thermalAudit);
    chk('chk_edge_tape',      this.data.edgeTape);
    chk('chk_tacker',         this.data.tacker);

    set('inp_price_netto',   this.data.priceNetto);
    set('inp_vat_rate',      this.data.vatRate);
    set('inp_deposit_amt',   this.data.depositAmt || 0);
    const pDaysRadios = document.querySelectorAll('input[name="payment_days"]');
    pDaysRadios.forEach(r => { r.checked = parseInt(r.value, 10) === (this.data.paymentDays || 7); });

    set('inp_date_start',      this.data.dateStart);
    set('inp_date_end',        this.data.dateEnd);
    set('inp_warranty_pipes',  this.data.warrantyPipes);
    set('inp_warranty_months', this.data.warrantyMonths);

    chk('chk_consumer_start',  this.data.consumerStartDeclaration);
    chk('chk_attach_spec',     this.data.attachSpec);

    chk('chk_doc_protocol',     this.data.docProtocol);
    chk('chk_doc_schema',       this.data.docSchema);
    chk('chk_doc_loop_list',    this.data.docLoopList);
    chk('chk_doc_photos',       this.data.docPhotos);
    chk('chk_doc_manifold_info',this.data.docManifoldInfo);
    chk('chk_doc_manual',       this.data.docManual);

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
      if (this.data.vatRate === 8) { this.data.vatRate = 23; const el=document.getElementById('inp_vat_rate'); if(el) el.value='23'; }
    } else {
      if (b2bBox) { b2bBox.classList.add('hidden'); b2bBox.classList.remove('grid'); }
      if (b2cBox) { b2cBox.classList.remove('hidden'); b2cBox.classList.add('grid'); }
    }
  },

  bindEvents() {
    const form = document.getElementById('contract-form');
    form.addEventListener('input',  () => { this.syncDataFromForm(); this.updateCalculations(); this.render(); });
    form.addEventListener('change', () => { this.syncDataFromForm(); this.updateCalculations(); this.render(); });

    document.querySelectorAll('input[name="contract_type"]').forEach(r => {
      r.addEventListener('change', (e) => { this.data.contractType = e.target.value; this.toggleB2bB2cFields(); this.updateCalculations(); this.render(); });
    });

    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        const icon    = trigger.querySelector('svg');
        content.classList.toggle('hidden');
        if (icon) icon.classList.toggle('rotate-180');
      });
    });

    const areaEl = document.getElementById('inp_tech_area');
    if (areaEl) areaEl.addEventListener('input', (e) => {
      const area = parseInt(e.target.value,10)||0;
      if (area > 0) {
        const loops = Math.ceil(area/11), pipes = Math.round(area*8.5);
        const lEl=document.getElementById('inp_tech_loops'); if(lEl) lEl.value=loops;
        const pEl=document.getElementById('inp_tech_pipe_len'); if(pEl) pEl.value=pipes;
        this.data.loops=loops; this.data.pipeLen=pipes;
      }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset)));

    document.getElementById('btn-print-doc')?.addEventListener('click',    () => window.print());
    document.getElementById('btn-quick-print')?.addEventListener('click',  () => window.print());
    document.getElementById('btn-reset-form')?.addEventListener('click',   () => { if(confirm('Czy na pewno chcesz wyczyścić formularz i utworzyć nową umowę?')) window.location.href='generator-umow.html'; });
    document.getElementById('btn-save-draft')?.addEventListener('click',   () => this.saveDraft());
    document.getElementById('btn-load-drafts')?.addEventListener('click',  () => this.openDraftsModal());
    document.getElementById('btn-close-modal')?.addEventListener('click',  () => this.closeDraftsModal());
    document.getElementById('btn-clear-all-drafts')?.addEventListener('click', () => this.clearAllDrafts());
    document.getElementById('btn-copy-text')?.addEventListener('click',    () => this.copyToClipboard());

    const tabForm=document.getElementById('tab-btn-form'), tabDoc=document.getElementById('tab-btn-doc');
    const editorCol=document.getElementById('editor-container'), previewCol=document.getElementById('preview-container');
    if (tabForm && tabDoc) {
      tabForm.addEventListener('click', () => { tabForm.classList.add('bg-orange-600','text-white'); tabForm.classList.remove('text-slate-400'); tabDoc.classList.remove('bg-orange-600','text-white'); tabDoc.classList.add('text-slate-400'); editorCol.classList.remove('hidden'); previewCol.classList.add('hidden'); });
      tabDoc.addEventListener('click',  () => { tabDoc.classList.add('bg-orange-600','text-white'); tabDoc.classList.remove('text-slate-400'); tabForm.classList.remove('bg-orange-600','text-white'); tabForm.classList.add('text-slate-400'); editorCol.classList.add('hidden'); previewCol.classList.remove('hidden'); });
    }
  },

  syncDataFromForm() {
    const gv = (id) => { const el=document.getElementById(id); return el?el.value:''; };
    const gc = (id) => { const el=document.getElementById(id); return el?el.checked:false; };

    this.data.contractNo    = gv('inp_contract_no');
    this.data.contractDate  = gv('inp_contract_date');
    this.data.contractPlace = gv('inp_contract_place');

    this.data.contractorName    = gv('inp_contractor_name');
    this.data.contractorNip     = gv('inp_contractor_nip');
    this.data.contractorRegon   = gv('inp_contractor_regon');
    this.data.contractorAddress = gv('inp_contractor_address');
    this.data.contractorPhone   = gv('inp_contractor_phone');
    this.data.contractorEmail   = gv('inp_contractor_email');
    this.data.contractorBank    = gv('inp_contractor_bank');

    this.data.clientName    = gv('inp_client_name');
    this.data.clientPesel   = gv('inp_client_pesel');
    this.data.clientIdCard  = gv('inp_client_id_card');
    this.data.clientNip     = gv('inp_client_nip')  || '';
    this.data.clientRep     = gv('inp_client_rep')  || '';
    this.data.clientAddress = gv('inp_client_address');
    this.data.clientPhone   = gv('inp_client_phone');
    this.data.clientEmail   = gv('inp_client_email');
    this.data.investmentAddress = gv('inp_investment_address');

    this.data.area     = parseFloat(gv('inp_tech_area'))    || 0;
    this.data.loops    = parseInt(gv('inp_tech_loops'),10)  || 0;
    this.data.pipeLen  = parseInt(gv('inp_tech_pipe_len'),10)|| 0;
    this.data.pipeType = gv('inp_tech_pipe_type');
    this.data.manifold = gv('inp_tech_manifold');
    this.data.screed   = gv('inp_tech_screed');
    this.data.control  = gv('inp_tech_control');
    this.data.testPressure = gc('chk_test_pressure');
    this.data.thermalAudit = gc('chk_thermal_audit');
    this.data.edgeTape     = gc('chk_edge_tape');
    this.data.tacker       = gc('chk_tacker');

    this.data.priceNetto  = parseFloat(gv('inp_price_netto'))  || 0;
    this.data.vatRate     = parseFloat(gv('inp_vat_rate'))     || 0;
    this.data.depositAmt  = parseFloat(gv('inp_deposit_amt'))  || 0;
    const pDaysChecked    = document.querySelector('input[name="payment_days"]:checked');
    this.data.paymentDays = pDaysChecked ? parseInt(pDaysChecked.value, 10) : 7;

    this.data.dateStart      = gv('inp_date_start');
    this.data.dateEnd        = gv('inp_date_end');
    this.data.warrantyPipes  = gv('inp_warranty_pipes');
    this.data.warrantyMonths = gv('inp_warranty_months');

    this.data.consumerStartDeclaration = gc('chk_consumer_start');
    this.data.attachSpec     = gc('chk_attach_spec');

    this.data.docProtocol     = gc('chk_doc_protocol');
    this.data.docSchema       = gc('chk_doc_schema');
    this.data.docLoopList     = gc('chk_doc_loop_list');
    this.data.docPhotos       = gc('chk_doc_photos');
    this.data.docManifoldInfo = gc('chk_doc_manifold_info');
    this.data.docManual       = gc('chk_doc_manual');
  },

  updateCalculations() {
    const brutto = Math.round(this.data.priceNetto * (1 + this.data.vatRate / 100) * 100) / 100;
    this.data.priceBrutto = brutto;
    const el = document.getElementById('inp_price_brutto'); if(el) el.value = brutto;
    
    const fmtCur = (n) => (parseFloat(n) || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
    const vatRate = parseFloat(this.data.vatRate) || 0;
    const vatStr = vatRate === 0 ? 'ZW' : `${vatRate}%`;
    const netTotal = parseFloat(this.data.priceNetto) || 0;
    const vatTotal = Math.round((brutto - netTotal) * 100) / 100;

    const dDisp = document.getElementById('deposit_amount_display'); 
    if (dDisp) {
      dDisp.innerHTML = `Razem: <strong>${fmtCur(netTotal)} netto</strong> + <strong>${fmtCur(vatTotal)} VAT (${vatStr})</strong> = <strong class="text-slate-900">${fmtCur(brutto)} brutto</strong>`;
    }
    
    const restEl = document.getElementById('rest_amount_display');
    if (restEl) {
      const dep = parseFloat(this.data.depositAmt) || 0;
      if (dep > 0) {
        const depBrutto = dep;
        const depNetto = vatRate > 0 ? Math.round((depBrutto / (1 + vatRate / 100)) * 100) / 100 : depBrutto;
        const depVat = Math.round((depBrutto - depNetto) * 100) / 100;

        const restBrutto = Math.max(0, Math.round((brutto - depBrutto) * 100) / 100);
        const restNetto = Math.max(0, Math.round((netTotal - depNetto) * 100) / 100);
        const restVat = Math.max(0, Math.round((restBrutto - restNetto) * 100) / 100);

        restEl.innerHTML = `
          <div class="p-2.5 bg-orange-50/70 border border-orange-200 rounded-lg space-y-1.5 text-[11px]">
            <div class="text-slate-800">
              <span class="font-bold text-orange-800">&bull; Zaliczka:</span> 
              <span>${fmtCur(depNetto)} netto</span> + <span>${fmtCur(depVat)} VAT (${vatStr})</span> = 
              <strong class="text-slate-900">${fmtCur(depBrutto)} brutto</strong>
              <span class="text-[10px] text-slate-500 block">Termin: najpóźniej na 2 tygodnie przed rozpoczęciem prac</span>
            </div>
            <div class="text-slate-800 pt-1.5 border-t border-orange-200/60">
              <span class="font-bold text-orange-800">&bull; Reszta do zapłaty:</span> 
              <span>${fmtCur(restNetto)} netto</span> + <span>${fmtCur(restVat)} VAT (${vatStr})</span> = 
              <strong class="text-orange-700">${fmtCur(restBrutto)} brutto</strong>
              <span class="text-[10px] text-slate-500 block">Termin: ${this.data.paymentDays || 7} dni od zakończenia prac i odbioru</span>
            </div>
          </div>
        `;
      } else {
        restEl.innerHTML = `
          <div class="p-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-[11px] text-slate-800 space-y-0.5">
            <div><span class="font-bold text-slate-800">&bull; Płatność całościowa (100%):</span></div>
            <div>${fmtCur(netTotal)} netto + ${fmtCur(vatTotal)} VAT (${vatStr}) = <strong class="text-orange-600 font-bold">${fmtCur(brutto)} brutto</strong></div>
            <div class="text-[10px] text-slate-500">Termin: ${this.data.paymentDays || 7} dni od zakończenia prac i odbioru</div>
          </div>
        `;
      }
    }
  },

  applyPreset(preset) {
    if (preset === 'b2c_house') {
      this.data.contractType='B2C'; this.data.area=140; this.data.loops=13; this.data.pipeLen=1190;
      this.data.priceNetto=19500; this.data.vatRate=8;
      this.data.screed='Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)';
      this.data.control='Smart Home: termostaty bezprzewodowe w każdym pokoju + listwa sterująca';
      this.showToast('Wczytano profil: Dom Jednorodzinny B2C (140m²)');
    } else if (preset === 'b2b_dev') {
      this.data.contractType='B2B'; this.data.clientName='Bud-Invest Sp. z o.o.';
      this.data.clientNip='NIP: 525-100-20-30'; this.data.clientRep='Marek Wiśniewski – Członek Zarządu';
      this.data.clientAddress='Al. Jerozolimskie 100, 02-001 Warszawa';
      this.data.investmentAddress='Osiedle Zielona Dolina, Budynek B, Warszawa';
      this.data.area=360; this.data.loops=34; this.data.pipeLen=3060;
      this.data.priceNetto=48500; this.data.vatRate=23;
      this.data.screed='Po stronie Zamawiającego (brak wylewki w umowie)';
      this.showToast('Wczytano profil: Inwestycja Deweloperska B2B');
    }
    this.bindDomElements(); this.updateCalculations(); this.render();
  },

  // =====================================================================
  //  RENDER – dosłowna treść umowy §1–§26 z pliku DOCX (25.09.2026)
  // =====================================================================
  render() {
    const container = document.getElementById('rendered-contract');
    if (!container) return;

    const d = this.data;
    const brutto = d.priceBrutto || Math.round(d.priceNetto * (1 + d.vatRate/100) * 100)/100;
    const slownie = kwotaSlownie(brutto);

    const fmt = (s) => s ? new Date(s).toLocaleDateString('pl-PL', {day:'2-digit',month:'2-digit',year:'numeric'}) : '................................';
    const dateFmt  = fmt(d.contractDate);
    const startFmt = fmt(d.dateStart);
    const endFmt   = fmt(d.dateEnd);
    const vatRate  = parseFloat(d.vatRate) || 0;
    const vatStr   = vatRate === 0 ? 'ZW' : `${vatRate}%`;
    const fmtMoney = (val) => (parseFloat(val) || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

    const netTotal = parseFloat(d.priceNetto) || 0;
    const vatTotal = Math.round((brutto - netTotal) * 100) / 100;
    const depositAmt = parseFloat(d.depositAmt) || 0;
    const pDays = d.paymentDays || 7;

    // Rozbicie kwot: Zaliczka oraz Reszta (Netto, VAT, Brutto)
    let depBrutto = 0, depNetto = 0, depVat = 0, depSlownie = '';
    let restBrutto = brutto, restNetto = netTotal, restVat = vatTotal, restSlownie = slownie;

    if (depositAmt > 0) {
      depBrutto = depositAmt;
      depNetto = vatRate > 0 ? Math.round((depBrutto / (1 + vatRate / 100)) * 100) / 100 : depBrutto;
      depVat = Math.round((depBrutto - depNetto) * 100) / 100;
      depSlownie = kwotaSlownie(depBrutto);

      restBrutto = Math.max(0, Math.round((brutto - depBrutto) * 100) / 100);
      restNetto = Math.max(0, Math.round((netTotal - depNetto) * 100) / 100);
      restVat = Math.max(0, Math.round((restBrutto - restNetto) * 100) / 100);
      restSlownie = kwotaSlownie(restBrutto);
    }

    // Termin wpłaty zaliczki: najpóźniej na 2 tygodnie przed rozpoczęciem prac
    let depositTimingStr = 'najpóźniej na 2 tygodnie przed planowanym terminem rozpoczęcia prac';
    if (d.dateStart) {
      const dStart = new Date(d.dateStart);
      if (!isNaN(dStart.getTime())) {
        const dPre = new Date(dStart);
        dPre.setDate(dPre.getDate() - 14);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dPre >= today) {
          depositTimingStr = `najpóźniej na 2 tygodnie przed planowanym terminem rozpoczęcia prac (tj. do dnia ${fmt(dPre.toISOString().split('T')[0])} r.)`;
        }
      }
    }

    // Taśma brzegowa §5 – warunkowe
    const edgeTapeText = d.edgeTape
      ? '&#9746; jest w zakresie Wykonawcy, &#9744; jest w zakresie wykonawcy jastrychu, &#9744; dostarcza ją Zamawiający, a montuje Wykonawca.'
      : '&#9744; jest w zakresie Wykonawcy, &#9746; jest w zakresie wykonawcy jastrychu, &#9744; dostarcza ją Zamawiający, a montuje Wykonawca.';

    // Oświadczenie konsumenta §20
    const consYes = d.consumerStartDeclaration ? '&#9746;' : '&#9744;';
    const consNo  = d.consumerStartDeclaration ? '&#9744;' : '&#9746;';

    // Dokumentacja powykonawcza §21
    const cb = (v) => v ? '&#9746;' : '&#9744;';

    // Nagłówek (wspólny)
    const docHeader = (subtitle, rightText) => `
      <div class="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-2.5 avoid-break">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center p-1 shadow-sm print:bg-orange-600 print-exact">
            <svg class="w-full h-full" viewBox="0 0 100 100" fill="none">
              <path d="M22,64 A36,36 0 1,1 76,77" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
              <path d="M42,30 A20,20 0 0,1 70,58" fill="none" stroke="#e0e7ff" stroke-width="7.5" stroke-linecap="round"/>
              <circle cx="50" cy="50" r="4" fill="#ffffff"/>
            </svg>
          </div>
          <div>
            <span class="text-sm font-extrabold tracking-tight text-slate-900 font-heading">LeSa <span class="text-orange-600">HOME</span></span>
            <span class="text-[8.5px] uppercase tracking-widest text-slate-500 block -mt-0.5">${subtitle}</span>
          </div>
        </div>
        <div class="text-right text-[10px] text-slate-600 leading-tight">${rightText}</div>
      </div>`;

    const pageFooter = (page, total) => `
      <div class="text-[9px] text-slate-400 pt-1.5 border-t border-slate-200 flex justify-between mt-2.5 avoid-break">
        <span>Strona ${page} z ${total} &bull; Umowa nr ${d.contractNo}</span>
        <span>LeSa – Home &bull; www.lesa-home.pl</span>
      </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 1
    // ─────────────────────────────────────────────
    const page1 = `
    <div class="document-page">
      <div class="page-main-body">
        ${docHeader('Nowoczesne Systemy Grzewcze &bull; Instalacje HVAC',
          `Nr umowy: <strong class="font-mono text-slate-900">${d.contractNo}</strong><br>
           Miejscowość: <strong>${d.contractPlace}</strong>, dn. <strong>${dateFmt}</strong>`)}

        <div class="text-center my-1.5">
          <h1 class="text-[12.5px] font-extrabold uppercase tracking-wide text-slate-900 leading-tight">UMOWA O WYKONANIE INSTALACJI OGRZEWANIA PODŁOGOWEGO – WODNEGO</h1>
        </div>

        <p class="text-[10px] text-slate-800 mb-1.5">
          zawarta w dniu <strong>${dateFmt}</strong> w <strong>${d.contractPlace}</strong> pomiędzy:
        </p>

        <!-- Strony umowy -->
        <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] leading-tight grid grid-cols-2 gap-3 mb-2.5 avoid-break">
          <div>
            <strong class="text-orange-700 uppercase text-[9.5px] block font-bold mb-0.5">Wykonawcą:</strong>
            Nazwa firmy: <strong>${d.contractorName}</strong><br>
            Adres siedziby: ${d.contractorAddress}<br>
            ${d.contractorNip} &bull; ${d.contractorRegon}<br>
            ${d.contractorRep ? `reprezentowanym przez: <strong>${d.contractorRep}</strong><br>` : ''}
            tel.: ${d.contractorPhone} &bull; e-mail: ${d.contractorEmail}
          </div>
          <div>
            <strong class="text-slate-700 uppercase text-[9.5px] block font-bold mb-0.5">a Zamawiającym:</strong>
            Imię i nazwisko / nazwa: <strong>${d.clientName}</strong><br>
            Adres: ${d.clientAddress}<br>
            ${d.contractType === 'B2C'
              ? `PESEL: ${d.clientPesel||'................................'} ${d.clientIdCard ? `&bull; Dowód: ${d.clientIdCard}` : ''}`
              : `NIP: ${d.clientNip||'................................'}`}<br>
            ${d.clientRep ? `reprezentowanym przez: <strong>${d.clientRep}</strong><br>` : ''}
            tel.: ${d.clientPhone} &bull; e-mail: ${d.clientEmail}
          </div>
          <div class="col-span-2 text-[9px] text-slate-500 border-t border-slate-200/80 pt-1">
            zwanymi dalej odpowiednio „Wykonawcą” i „Zamawiającym”.
          </div>
        </div>

        <!-- §1 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;1.</span> Przedmiot umowy</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zleca, a Wykonawca przyjmuje do wykonania instalację wodnego ogrzewania podłogowego w budynku położonym pod adresem: <strong>${d.investmentAddress}</strong>.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Przedmiotem umowy jest wykonanie instalacji ogrzewania podłogowego w systemie mokrym, z rurami grzewczymi mocowanymi do izolacji termicznej za pomocą klipsów/takerów, zgodnie z zakresem określonym w niniejszej umowie, ofercie oraz Załączniku Technicznym.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Szczegółowy zakres prac, rodzaj zastosowanych materiałów, średnice rur, rozstaw rur, liczba obiegów, lokalizacja rozdzielaczy oraz pozostałe parametry określa:
          </p>
          <div class="pl-2 text-[9.5px] text-slate-700 grid grid-cols-2 gap-x-2 mb-0.5">
            <div>a) niniejsza umowa,</div>
            <div>c) Załącznik nr 1 – Specyfikacja Techniczna,</div>
            <div>b) oferta Wykonawcy nr <strong>${d.contractNo}</strong>,</div>
            <div>d) zaakceptowany rysunek/schemat wykonawczy.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Dokumenty wymienione w ust. 3 stanowią integralną część umowy. W przypadku rozbieżności pierwszeństwo mają, w kolejności: niniejsza umowa, zaakceptowane pisemne zmiany do umowy, Załącznik Techniczny, oferta, rysunek wykonawczy – z zastrzeżeniem, że w zakresie technicznym rysunek może uszczegóławiać sposób prowadzenia instalacji.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">5.</span>Załącznik nr 1 – Specyfikacja Techniczna stanowi integralną część umowy wyłącznie wtedy, gdy został sporządzony i fizycznie dołączony do niniejszej umowy oraz parafowany przez obie strony. W przypadku niedołączenia Załącznika Technicznego, szczegółowe parametry techniczne instalacji określa wyłącznie treść niniejszej umowy oraz oferta Wykonawcy.
          </p>
        </div>

        <!-- §2 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;2.</span> Zakres prac Wykonawcy</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>W zakresie umowy Wykonawca wykonuje w szczególności:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-700 pl-1 mb-1">
            <div>&bull; przygotowanie i rozplanowanie obiegów,</div>
            <div>&bull; wykonanie połączeń instalacyjnych,</div>
            <div>&bull; montaż rur grzewczych na izolacji termicznej,</div>
            <div>&bull; napełnienie i odpowietrzenie instalacji,</div>
            <div>&bull; wykonanie podejść do rozdzielaczy,</div>
            <div>&bull; wykonanie próby szczelności wg technologii,</div>
            <div>&bull; montaż rozdzielaczy (jeśli ujęty w ofercie),</div>
            <div>&bull; sporządzenie protokołu próby szczelności,</div>
            <div>&bull; oznaczenie obiegów grzewczych,</div>
            <div>&bull; przekazanie informacji o wykonanej instalacji.</div>
          </div>
          <p class="text-[10px] text-slate-700 mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Zakres obejmuje wyłącznie prace wskazane w umowie i ofercie. Prace niewymienione nie są objęte wynagrodzeniem ryczałtowym.
          </p>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli oferta nie stanowi inaczej, Wykonawca nie wykonuje:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-600 pl-1 mb-1">
            <div>&bull; izolacji termicznej podłogi ze styropianu,</div>
            <div>&bull; montażu lub uruchomienia źródła ciepła / pompy,</div>
            <div>&bull; wykonania i naprawy podłoża konstrukcyjnego,</div>
            <div>&bull; instalacji elektrycznej sterowania ogrzewaniem,</div>
            <div>&bull; wykonania jastrychu/wylewki,</div>
            <div>&bull; wykonania automatyki źródła ciepła,</div>
            <div>&bull; posadzek i warstw wykończeniowych oraz tynków,</div>
            <div>&bull; wykonania elementów nieujętych w ofercie,</div>
            <div>&bull; wykonania instalacji elektrycznej budynku,</div>
            <div>&bull; napraw szkód powstałych po zakończeniu prac.</div>
          </div>
          <p class="text-[10px] text-slate-700">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Montaż siłowników, termostatów, automatyki oraz uruchomienie całego systemu grzewczego stanowi odrębny zakres, jeżeli nie został jednoznacznie wskazany w ofercie.
          </p>
        </div>
      </div>

      ${pageFooter(1, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 2
    // ─────────────────────────────────────────────
    const page2 = `
    <div class="document-page">
      <div class="page-main-body">
        <div class="flex justify-between text-[9.5px] text-slate-500 pb-1.5 border-b border-slate-200 mb-2 avoid-break">
          <span>LeSa HOME &bull; Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 2 z 4</span>
        </div>

        <!-- §3 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;3.</span> Dokumentacja i sposób zaprojektowania instalacji</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja jest wykonywana:</p>
          <div class="pl-2 text-[9.5px] text-slate-700 space-y-0.5 mb-0.5">
            <div>&#9744; na podstawie dokumentacji dostarczonej przez Zamawiającego,</div>
            <div>&#9744; na podstawie dokumentacji projektowej sporządzonej przez uprawnionego projektanta,</div>
            <div>&#9746; na podstawie opracowania technicznego / schematu wykonawczego Wykonawcy w zakresie objętym ofertą.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Jeżeli Wykonawca nie wykonuje pełnego projektu instalacji, sporządzony przez niego rysunek rozdzielaczy i rozkład rur stanowi dokumentację wykonawczą i nie jest projektem budowlanym w rozumieniu przepisów prawa budowlanego, chyba że strony wyraźnie ustalą inaczej.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>W przypadku wykonywania instalacji na podstawie dokumentacji Zamawiającego lub osoby trzeciej Wykonawca wykonuje roboty zgodnie z przekazaną dokumentacją w zakresie objętym umową. Jeżeli Wykonawca stwierdzi, że dokumentacja, materiał, podłoże lub warunki na budowie mogą uniemożliwić prawidłowe wykonanie instalacji, zobowiązany jest poinformować o tym Zamawiającego przed wykonaniem spornych prac.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Wykonawca nie odpowiada za błędy lub niekompletność dokumentacji dostarczonej przez Zamawiającego lub osobę trzecią, jeżeli po zachowaniu należytej staranności nie było podstaw do ich stwierdzenia.
          </p>
        </div>

        <!-- §4 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;4.</span> Warunki rozpoczęcia prac</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zobowiązuje się zapewnić przed rozpoczęciem prac:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-700 pl-1 mb-0.5">
            <div>&bull; dostęp do budynku i pomieszczeń, możliwość bezpiecznych robót,</div>
            <div>&bull; odpowiednią temperaturę wewnątrz budynku umożliwiającą prace,</div>
            <div>&bull; gotową konstrukcję podłogi, prawidłowe i stabilne podłoże,</div>
            <div>&bull; dostęp do energii elektrycznej i wody niezbędnych do prac,</div>
            <div>&bull; prawidłowo ułożoną izolację (jeżeli poza umową),</div>
            <div>&bull; informacje o instalacjach i elementach w warstwach podłogi.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Izolacja termiczna, na której montowana jest instalacja, musi być ułożona stabilnie, bez miejscowych zapadnięć i bez uszkodzeń uniemożliwiających prawidłowe zamocowanie rur.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca może odmówić rozpoczęcia prac do czasu usunięcia stwierdzonych przeszkód technicznych. Jeżeli usunięcie przeszkód powoduje dodatkowe koszty lub konieczność dodatkowych prac, ich wykonanie wymaga uzgodnienia z Zamawiającym.
          </p>
        </div>

        <!-- §5 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;5.</span> Dylatacje i taśma brzegowa</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zobowiązany jest przed rozpoczęciem montażu przekazać Wykonawcy informację o:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-700 pl-1 mb-0.5">
            <div>&bull; lokalizacji istniejących dylatacji konstrukcyjnych,</div>
            <div>&bull; lokalizacji progów drzwiowych i miejsc z dylatacją,</div>
            <div>&bull; planowanych dylatacjach jastrychu,</div>
            <div>&bull; przebiegu dylatacji z dokumentacji lub technologii posadzki.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Obieg grzewczy nie może przechodzić przez dylatację bez zastosowania rozwiązania technicznego przewidzianego dla tego miejsca. W miejscach przejścia przewodu przez dylatację stosuje się rurę ochronną/peszel zgodnie z przyjętym rozwiązaniem wykonawczym.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli Zamawiający lub kierownik budowy nie przekaże Wykonawcy informacji o planowanym przebiegu dylatacji przed rozpoczęciem montażu, Wykonawca może zastosować rozwiązanie przewidziane w Załączniku Technicznym, w szczególności prowadzenie przewodów w rurach ochronnych w miejscach wymagających zabezpieczenia. Wykonawca nie odpowiada za skutki niewłaściwego wykonania dylatacji przez inną ekipę, jeżeli Wykonawca wykonał instalację zgodnie z przekazanymi informacjami.
          </p>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">4.</span>Taśma brzegowa: ${edgeTapeText}</p>
          <p class="text-[10px] text-slate-700">
            <span class="text-slate-400 font-semibold select-none mr-1">5.</span>Jeżeli taśma brzegowa lub wykonanie dylatacji nie są objęte zakresem Wykonawcy, odpowiedzialność za ich prawidłowe wykonanie ponosi podmiot, który je wykonuje.
          </p>
        </div>

        <!-- §6 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;6.</span> Zasady wykonania instalacji</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja zostanie wykonana zgodnie z: dokumentacją techniczną, zasadami wiedzy technicznej, wymaganiami technicznymi producentów zastosowanych materiałów, postanowieniami Załącznika Technicznego, normami wskazanymi w §15.</p>
          <p class="text-[10px] text-slate-700 mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Rozstaw rur zostanie określony w dokumentacji lub Załączniku Technicznym. Trasa każdego obiegu zostanie wykonana w sposób umożliwiający prawidłową pracę instalacji, odpowietrzenie oraz regulację hydrauliczną. Rury należy prowadzić w sposób ograniczający ryzyko ich uszkodzenia przez kolejne ekipy budowlane.
          </p>
          <p class="text-[10px] text-slate-700">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Po wykonaniu instalacji Wykonawca oznacza poszczególne obiegi zgodnie z przyjętym schematem. Położenie rur, rozdzielaczy i innych elementów instalacji może zostać udokumentowane fotografiami wykonanymi przez Wykonawcę. Wykonawca może wykonać dokumentację fotograficzną instalacji jako dokumentację robót zanikających.
          </p>
        </div>

        <!-- §7 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;7.</span> Próba szczelności i przekazanie instalacji</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Przed zakryciem instalacji przez jastrych instalacja zostanie poddana próbie szczelności. Parametry próby wynikają z obowiązujących wymagań technicznych, przyjętej technologii oraz dokumentacji producentów zastosowanych elementów. Próbę należy wykonać z użyciem czynnika oraz przy ciśnieniu odpowiednim dla zastosowanych elementów instalacji. Wynik próby zostanie potwierdzony protokołem.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Do czasu wykonania jastrychu instalacja powinna pozostawać pod nadzorem Zamawiającego lub wykonawcy jastrychu w sposób określony w protokole i dokumentacji technicznej.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Zamawiający przyjmuje do wiadomości, że od chwili zakończenia robót Wykonawcy instalacja może zostać uszkodzona przez: chodzenie po nieosłoniętej instalacji, transport materiałów, kotwienie innych elementów, wiercenie, cięcie, montaż innych instalacji, wykonywanie jastrychu, prace innych ekip.
          </p>
          <p class="text-[10px] text-slate-700">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Wykonawca nie odpowiada za uszkodzenia instalacji powstałe po jej odbiorze, jeżeli nie wynikają one z wad wykonawczych istniejących przed odbiorem.
          </p>
        </div>

        <!-- §8 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;8.</span> Jastrych / wylewka</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonanie jastrychu nie jest przedmiotem umowy, chyba że oferta stanowi inaczej. Za dobór rodzaju jastrychu, jego grubość, klasę, skład, zbrojenie, dylatacje, warunki dojrzewania i wykonanie odpowiada wykonawca jastrychu w zakresie powierzonych mu prac.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca instalacji nie odpowiada za pękanie jastrychu, odspajanie jastrychu, uszkodzenia powierzchni posadzki lub inne skutki nieprawidłowego wykonania jastrychu, jeżeli nie wynikają one z nieprawidłowości instalacji wykonanej przez Wykonawcę.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca jastrychu zobowiązany jest wykonywać swoje prace w sposób niepowodujący uszkodzenia instalacji. Jeżeli podczas wykonywania jastrychu dojdzie do uszkodzenia rury lub elementu instalacji, należy przerwać prace w miejscu uszkodzenia i niezwłocznie poinformować Wykonawcę instalacji.
          </p>
        </div>
      </div>

      ${pageFooter(2, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 3
    // ─────────────────────────────────────────────
    const page3 = `
    <div class="document-page">
      <div class="page-main-body">
        <div class="flex justify-between text-[9.5px] text-slate-500 pb-1.5 border-b border-slate-200 mb-2 avoid-break">
          <span>LeSa HOME &bull; Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 3 z 4</span>
        </div>

        <!-- §9 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;9.</span> Uruchomienie i regulacja instalacji</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonanie instalacji podłogowej nie jest równoznaczne z uruchomieniem całego systemu grzewczego budynku. Uruchomienie źródła ciepła, ustawienie temperatury zasilania, automatyki pogodowej, krzywej grzewczej, bufora, pompy ciepła, kotła lub innych urządzeń nie jest przedmiotem umowy, chyba że oferta stanowi inaczej.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca może dokonać wstępnej regulacji przepływów na rozdzielaczu zgodnie z dokumentacją wykonawczą. Ostateczna regulacja hydrauliczna może wymagać pracy instalacji przy rzeczywistych parametrach źródła ciepła oraz po zakończeniu pozostałych prac budowlanych.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca nie gwarantuje osiągnięcia konkretnej temperatury powietrza w pomieszczeniach, jeżeli na jej osiągnięcie wpływają elementy pozostające poza zakresem niniejszej umowy, w szczególności: izolacyjność budynku, straty ciepła, moc źródła ciepła, parametry zasilania, regulacja automatyki, rodzaj i opór cieplny okładziny podłogowej, sposób użytkowania budynku, nieprawidłowe działanie urządzeń innych wykonawców.
          </p>
        </div>

        <!-- §10 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;10.</span> Materiały dostarczone przez Zamawiającego</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Jeżeli materiały dostarcza Zamawiający, ponosi on odpowiedzialność za ich jakość, pochodzenie, właściwości oraz przydatność do zastosowania w instalacji. Wykonawca ma obowiązek poinformować Zamawiającego o stwierdzonych przed rozpoczęciem lub w trakcie robót wadach materiałów, które mogą mieć wpływ na prawidłowe wykonanie instalacji.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku zastosowania materiałów dostarczonych przez Zamawiającego Wykonawca nie ponosi odpowiedzialności za wady wynikające z właściwości tych materiałów, ich niezgodności z wymaganiami technicznymi lub nieprawidłowego przechowywania, jeżeli przyczyna wady leży po stronie tych materiałów.
          </p>
        </div>

        <!-- §11 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;11.</span> Roboty dodatkowe i zmiany</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Robotami dodatkowymi są prace nieobjęte zakresem umowy lub wynikające ze zmiany decyzji Zamawiającego, projektu albo warunków zastanych na budowie. Roboty dodatkowe wymagają uzgodnienia zakresu i wynagrodzenia.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku konieczności wykonania prac dodatkowych z przyczyn technicznych ujawnionych po rozpoczęciu prac Wykonawca informuje Zamawiającego o zakresie tych prac przed ich wykonaniem, o ile pozwalają na to warunki na budowie.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Zmiany przebiegu obiegów, lokalizacji rozdzielaczy, średnic rur, rozstawu lub innych istotnych parametrów po wykonaniu części robót mogą powodować dodatkowe wynagrodzenie.
          </p>
        </div>

        <!-- §12 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;12.</span> Termin wykonania</h2>
          <div class="flex items-start mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1 text-[10px]">1.</span>
            <div class="flex-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] text-slate-700 grid grid-cols-2 gap-2">
              <div>Planowane rozpoczęcie prac: <strong>${startFmt}</strong></div>
              <div>Planowane zakończenie prac: <strong>${endFmt}</strong></div>
            </div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Termin może ulec zmianie, jeżeli wystąpią przeszkody niezależne od Wykonawcy, w szczególności: brak przygotowania placu budowy, brak dostępu do obiektu, opóźnienia innych wykonawców, konieczność usunięcia wad podłoża, zmiany dokumentacji, brak materiałów po stronie Zamawiającego, warunki uniemożliwiające bezpieczne wykonanie prac.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Opóźnienie spowodowane koniecznością wykonania prac przez inne ekipy lub brakiem współdziałania Zamawiającego nie stanowi opóźnienia Wykonawcy.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>O każdej zmianie terminu, o której mowa w ust. 3, Wykonawca informuje Zamawiającego niezwłocznie, wskazując przyczynę oraz nowy planowany termin. Termin realizacji ulega przedłużeniu o czas trwania przeszkody, o której mowa w ust. 3, powiększony o czas niezbędny do wznowienia prac.
          </p>
        </div>

        <!-- §13 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;13.</span> Wynagrodzenie i płatności</h2>
          <div class="flex items-start mb-1">
            <span class="text-slate-400 font-semibold select-none mr-1 text-[10px]">1.</span>
            <div class="flex-1 bg-orange-50/70 border border-orange-200 rounded p-1.5 text-[9.5px] text-slate-800 space-y-0.5">
              <div>Wynagrodzenie wynosi:
                <strong>${fmtMoney(netTotal)} netto</strong> + VAT (${vatStr}): <strong>${fmtMoney(vatTotal)}</strong> =
                <strong>${fmtMoney(brutto)} brutto</strong>
                (słownie: <em>${slownie}</em>). Wynagrodzenie: <strong>&#9746; ryczałtowe</strong> &#9744; kosztorysowe.
              </div>
            </div>
          </div>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">2.</span><strong>Warunki i terminy płatności:</strong></p>
          <div class="pl-2 text-[9.5px] text-slate-700 space-y-0.5 mb-0.5">
            ${depositAmt > 0 ? `
              <div>&bull; <strong>Zaliczka:</strong> <strong>${fmtMoney(depNetto)} netto</strong> + VAT (${vatStr}): <strong>${fmtMoney(depVat)}</strong> = <strong>${fmtMoney(depBrutto)} brutto</strong> (słownie: <em>${depSlownie}</em>), płatna przelewem <strong>${depositTimingStr}</strong>.</div>
              <div>&bull; <strong>Pozostała część:</strong> <strong>${fmtMoney(restNetto)} netto</strong> + VAT (${vatStr}): <strong>${fmtMoney(restVat)}</strong> = <strong>${fmtMoney(restBrutto)} brutto</strong> (słownie: <em>${restSlownie}</em>), płatna przelewem w terminie <strong>${pDays} dni</strong> od daty zakończenia prac i odbioru.</div>
            ` : `
              <div>&bull; <strong>Płatność całościowa (100%):</strong> <strong>${fmtMoney(netTotal)} netto</strong> + VAT (${vatStr}): <strong>${fmtMoney(vatTotal)}</strong> = <strong>${fmtMoney(brutto)} brutto</strong> (słownie: <em>${slownie}</em>), płatna przelewem w terminie <strong>${pDays} dni</strong> od daty zakończenia prac i odbioru.</div>
            `}
            <div class="text-[9px] text-slate-600">Rachunek Wykonawcy: <span class="font-mono font-bold text-slate-900">${d.contractorBank}</span></div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Za dzień zapłaty uznaje się dzień uznania rachunku bankowego Wykonawcy. Materiały lub prace dodatkowe niewskazane w ofercie mogą zostać rozliczone odrębnie na podstawie uzgodnienia stron.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>W przypadku opóźnienia Zamawiającego w zapłacie zaliczki, wynagrodzenia lub innej należności przekraczającego 3 dni robocze od terminu płatności, Wykonawcy przysługują odsetki ustawowe za opóźnienie oraz prawo do wstrzymania wykonywania prac do czasu zaksięgowania zaległej wpłaty na rachunku bankowym Wykonawcy. Terminy realizacji ulegają wówczas przedłużeniu o czas wstrzymania prac.
          </p>
        </div>

        <!-- §14 -->
        <div class="mb-2 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;14.</span> Odbiór</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Po zakończeniu prac Wykonawca zgłasza gotowość do odbioru. Odbiór obejmuje:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-700 pl-1 mb-0.5">
            <div>&bull; wizualną ocenę wykonanych prac,</div>
            <div>&bull; potwierdzenie wykonania próby szczelności,</div>
            <div>&bull; sprawdzenie zgodności z zakresem umowy,</div>
            <div>&bull; przekazanie dokumentacji wskazanej w umowie.</div>
            <div class="col-span-2">&bull; weryfikację prawidłowości oznaczenia poszczególnych obiegów.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Usterki lub uwagi stwierdzone podczas odbioru zostaną wpisane do protokołu wraz z terminem ich usunięcia, jeżeli są zasadne. Usterki niemające wpływu na możliwość bezpiecznego zakrycia instalacji nie stanowią podstawy do odmowy odbioru całego przedmiotu umowy, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa. W przypadku wad uniemożliwiających prawidłowe wykonanie lub zakrycie instalacji odbiór może zostać odroczony do czasu ich usunięcia.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli Zamawiający nie stawi się na odbiór w terminie wyznaczonym przez Wykonawcę, nie krótszym niż 3 dni robocze od dnia wezwania, lub odmawia podpisania protokołu odbioru bez podania uzasadnionych przyczyn technicznych, Wykonawca jest uprawniony do sporządzenia jednostronnego protokołu odbioru. Jednostronny protokół odbioru wywołuje takie same skutki jak protokół podpisany przez obie strony i stanowi podstawę do wystawienia faktury końcowej oraz rozliczenia wynagrodzenia.
          </p>
        </div>
      </div>

      ${pageFooter(3, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 4
    // ─────────────────────────────────────────────
    const page4 = `
    <div class="document-page">
      <div class="page-main-body">
        <div class="flex justify-between text-[9.5px] text-slate-500 pb-1.5 border-b border-slate-200 mb-2 avoid-break">
          <span>LeSa HOME &bull; Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 4 z 4</span>
        </div>

        <!-- §15 -->
        <div class="mb-1.5 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;15.</span> Normy, przepisy i zasady techniczne</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja wykonywana jest z uwzględnieniem obwiązujących przepisów oraz Polskich Norm:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] text-slate-600 pl-1 mb-0.5 leading-tight">
            <div>&bull; PN-EN 1264-1:2021-10 – Ogrzewanie płaszczyznowe – Definicje i symbole;</div>
            <div>&bull; PN-EN 1264-4:2021-10 – Ogrzewanie płaszczyznowe – Instalowanie;</div>
            <div>&bull; PN-EN 1264-2:2021-10 – Ogrzewanie płaszczyznowe – Moc cieplna;</div>
            <div>&bull; PN-EN 14336:2025-11 – Montaż i przekazanie wodnych instalacji grzewczych;</div>
            <div>&bull; PN-EN 1264-3:2021-10 – Ogrzewanie płaszczyznowe – Wymiarowanie;</div>
            <div>&bull; PN-EN 12831-1:2017-08 – Obliczanie projektowego obciążenia cieplnego.</div>
          </div>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku zmiany powyższych norm zastosowanie ma ich aktualne wydanie. W odniesieniu do materiałów stosuje się również wymagania producentów oraz dokumentację techniczną.
          </p>
        </div>

        <!-- §16 -->
        <div class="mb-1.5 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;16.</span> Odpowiedzialność Wykonawcy</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonawca odpowiada za prawidłowość wykonania prac objętych umową w zakresie wynikającym z umowy i przepisów prawa.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca nie odpowiada za elementy instalacji lub budynku pozostające poza zakresem jego prac, chyba że strony wyraźnie postanowiły inaczej.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>W szczególności odpowiedzialność Wykonawcy nie obejmuje wad: konstrukcji budynku, izolacji innej ekipy, jastrychu, posadzki, źródła ciepła, automatyki, instalacji elektrycznych, instalacji innych wykonawców, materiałów Zamawiającego.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Powyższe ograniczenia nie wyłączają odpowiedzialności Wykonawcy za szkody lub wady powstałe z jego winy w zakresie wynikającym z bezwzględnie obowiązujących przepisów prawa.
          </p>
        </div>

        <!-- §17 -->
        <div class="mb-1.5 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;17.</span> Gwarancja i odpowiedzialność za wady</h2>
          <div class="flex items-start mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1 text-[10px]">1.</span>
            <div class="flex-1 bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] text-slate-700">
              Wykonawca udziela na wykonane przez siebie prace gwarancji na okres: <strong>${d.warrantyMonths} miesięcy</strong> od dnia odbioru.
            </div>
          </div>
          <p class="text-[10px] text-slate-700 mb-0.5 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Gwarancja obejmuje wady wykonawcze instalacji powstałe z przyczyn leżących po stronie Wykonawcy. Gwarancja nie obejmuje uszkodzeń powstałych wskutek: ingerencji osób trzecich, wiercenia, kotwienia, uszkodzenia rur przez inne ekipy, niewłaściwego wykonania jastrychu, nieprawidłowej eksploatacji, zamrożenia, niewłaściwych parametrów źródła ciepła, samowolnych zmian.
          </p>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Udzielona gwarancja nie ogranicza uprawnień Zamawiającego z przepisów prawa. Zgłoszenia wad Zamawiający dokonuje w formie pisemnej, dokumentowej lub e-mail. Wykonawca ustosunkuje się w terminie 7 dni roboczych i przystąpi do usunięcia uznanej wady w terminie uzgodnionym, nie dłuższym niż 30 dni.
          </p>
        </div>

        <!-- §18 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;18.</span> Zamrożenie instalacji</h2>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja nie może zostać narażona na zamarznięcie. Jeżeli instalacja zostanie napełniona wodą przed uruchomieniem źródła ciepła, Zamawiający zobowiązuje się zapewnić temperaturę uniemożliwiającą zamarznięcie albo uzgodnić z Wykonawcą inne zabezpieczenie. Wykonawca nie odpowiada za szkody wynikające z zamarznięcia instalacji po jej przekazaniu.
          </p>
        </div>

        <!-- §19 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;19.</span> Zmiany umowy</h2>
          <p class="text-[10px] text-slate-700 text-justify">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wszelkie zmiany zakresu, wynagrodzenia lub istotnych warunków umowy wymagają formy dokumentowej lub pisemnej. Uzgodnienia e-mail mogą stanowić podstawę wykonania dodatkowych prac, jeżeli pozwalają jednoznacznie ustalić ich zakres i wynagrodzenie.
          </p>
        </div>

        <!-- §20 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;20.</span> Postanowienia dotyczące konsumenta</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Jeżeli Zamawiający jest konsumentem, do umowy stosuje się przepisy dotyczące ochrony konsumentów. W przypadku umowy zawartej poza lokalem lub na odległość, przysługuje prawo odstąpienia w terminie 14 dni od zawarcia bez podania przyczyny.
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W celu skorzystania z prawa odstąpienia konsument składa jednoznaczne oświadczenie (pismem lub e-mailem).
          </p>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Rozpoczęcie usługi przed upływem terminu 14 dni wymaga wyraźnego oświadczenia konsumenta:
          </p>
          <div class="bg-amber-50/80 border border-amber-200 rounded p-1.5 text-[9px] text-slate-800 mb-0.5 leading-snug">
            <span class="font-semibold block">Oświadczenie Konsumenta:</span>
            <span class="italic block">„Żądam rozpoczęcia wykonywania usługi przed upływem terminu do odstąpienia od umowy. Przyjmuję do wiadomości, że w przypadku pełnego wykonania usługi utracę prawo do odstąpienia od umowy.”</span>
            <div class="flex gap-4 mt-0.5">
              <div>${consYes} Składam powyższe oświadczenie</div>
              <div>${consNo} Nie składam powyższego oświadczenia</div>
            </div>
          </div>
          <p class="text-[10px] text-slate-700">
            <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Postanowienia umowy nie mogą ograniczać bezwzględnie obowiązujących praw konsumenta.
          </p>
        </div>

        <!-- §21 -->
        <div class="mb-1 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;21.</span> Dokumentacja powykonawcza</h2>
          <p class="text-[10px] text-slate-700 mb-0.5"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Po zakończeniu prac Wykonawca przekazuje – w zakresie określonym ofertą:</p>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-700 pl-1">
            <div>${cb(d.docProtocol)} protokół próby szczelności,</div>
            <div>${cb(d.docPhotos)} zdjęcia instalacji przed jastrychem,</div>
            <div>${cb(d.docSchema)} schemat instalacji,</div>
            <div>${cb(d.docManifoldInfo)} informacje dot. rozdzielaczy,</div>
            <div>${cb(d.docLoopList)} wykaz obiegów i długości rur,</div>
            <div>${cb(d.docManual)} instrukcję użytkowania.</div>
          </div>
        </div>

        <!-- §22, §23, §24, §25 w zwartym układzie 2-kolumnowym -->
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 mb-1.5 avoid-break">
          <div>
            <h2 class="font-bold text-[10.5px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;22.</span> Odpowiedzialność za inne roboty</h2>
            <p class="text-[9.5px] text-slate-700 text-justify">
              Każda ze stron odpowiada za zakres powierzonych prac. Zamawiający poinformuje innych wykonawców o instalacji przed pracami mogącymi ją uszkodzić. Wykonawca nie odpowiada za uszkodzenia przez osoby trzecie po odbiorze.
            </p>
          </div>
          <div>
            <h2 class="font-bold text-[10.5px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;23.</span> Ochrona danych osobowych (RODO)</h2>
            <p class="text-[9.5px] text-slate-700 text-justify">
              Administratorem danych osobowych jest Wykonawca. Dane przetwarzane są w celu wykonania umowy i wypełnienia obowiązków prawnych (art. 6 ust. 1 lit. b i c RODO). Szczegółowe informacje zawiera załączona klauzula informacyjna.
            </p>
          </div>
          <div>
            <h2 class="font-bold text-[10.5px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;24.</span> Zastrzeżenie własności</h2>
            <p class="text-[9.5px] text-slate-700 text-justify">
              Materiały i urządzenia dostarczone przez Wykonawcę pozostają jego własnością do uiszczenia całości wynagrodzenia (art. 589 k.c.).
            </p>
          </div>
          <div>
            <h2 class="font-bold text-[10.5px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;25.</span> Siła wyższa</h2>
            <p class="text-[9.5px] text-slate-700 text-justify">
              Strony nie odpowiadają za niewykonanie zobowiązań z powodu siły wyższej (zdarzenia zewnętrzne, niemożliwe do przewidzenia i zapobieżenia). Terminy realizacji ulegają przedłużeniu o czas trwania przeszkody.
            </p>
          </div>
        </div>

        <!-- §26 -->
        <div class="mb-1.5 avoid-break">
          <h2 class="font-bold text-[11px] text-slate-900 mb-0.5"><span class="text-orange-600">&sect;26.</span> Postanowienia końcowe</h2>
          <p class="text-[10px] text-slate-700 text-justify mb-0.5">
            <span class="text-slate-400 font-semibold select-none mr-1">1.</span>W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego, prawa budowlanego oraz o ochronie konsumentów.
            <span class="text-slate-400 font-semibold select-none ml-2 mr-1">2.</span>Nieważność pojedynczego postanowienia nie narusza pozostałych.
            <span class="text-slate-400 font-semibold select-none ml-2 mr-1">3.</span>Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.
            <span class="text-slate-400 font-semibold select-none ml-2 mr-1">4.</span>Integralną część stanowią wymienione załączniki.
            <span class="text-slate-400 font-semibold select-none ml-2 mr-1">5.</span>Spory rozstrzyga sąd powszechny właściwy według przepisów prawa.
          </p>
          <p class="text-[9.5px] text-slate-600 mt-0.5">
            <strong>Załączniki do umowy:</strong>
            ${d.attachSpec ? ' &#9746; Załącznik nr 2: Klauzula informacyjna RODO (Ochrona danych osobowych)' : ' &#9744; Załącznik nr 2'}
          </p>
        </div>

        <!-- Podpisy -->
        <div class="pt-2 pb-1 border-t-2 border-slate-300 grid grid-cols-2 gap-8 mt-1 signature-block avoid-break">
          <div class="text-center">
            <div class="border-b border-dashed border-slate-400 pb-5 mb-1"></div>
            <div class="font-bold text-xs text-slate-900">${d.contractorName}</div>
            <div class="text-[8.5px] uppercase tracking-wider text-slate-500">WYKONAWCA – podpis i pieczęć</div>
          </div>
          <div class="text-center">
            <div class="border-b border-dashed border-slate-400 pb-5 mb-1"></div>
            <div class="font-bold text-xs text-slate-900">${d.clientName}</div>
            <div class="text-[8.5px] uppercase tracking-wider text-slate-500">ZAMAWIAJĄCY – podpis</div>
          </div>
        </div>
      </div>

      ${pageFooter(4, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  KLAUZULA RODO (Załącznik nr 2)
    // ─────────────────────────────────────────────
    let rodoHtml = '';
    if (d.attachSpec) {
      rodoHtml = `
      <!-- ZAŁĄCZNIK NR 2 - STRONA 1 -->
      <div class="document-page">
        <div class="page-main-body">
          ${docHeader('Klauzula Informacyjna RODO &bull; Ochrona Danych',
            `Załącznik nr 2 do Umowy: <strong>${d.contractNo}</strong>`)}
          
          <div class="text-center my-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">ZAŁĄCZNIK NR 2</span>
            <h2 class="text-xs font-extrabold uppercase tracking-wide text-slate-900">KLAUZULA INFORMACYJNA DOTYCZĄCA PRZETWARZANIA DANYCH OSOBOWYCH</h2>
            <p class="text-[9.5px] text-slate-500 mt-0.5">do Umowy o wykonanie instalacji ogrzewania podłogowego – wodnego</p>
          </div>

          <p class="text-[10px] text-slate-700 leading-snug mb-2">
            Zgodnie z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (dalej: „RODO”), informujemy, że:
          </p>

          <!-- 1. Administrator -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 1. Administrator danych osobowych
            </h3>
            <p class="text-[10px] text-slate-600 mb-1">Administratorem Państwa danych osobowych jest Wykonawca:</p>
            <div class="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] grid grid-cols-2 gap-2">
              <div>
                <span class="text-[9.5px] uppercase font-bold text-orange-700 block">Wykonawca:</span>
                <strong>${d.contractorName}</strong><br>
                <span class="text-slate-600">Siedziba:</span> ${d.contractorAddress}
              </div>
              <div>
                <span class="text-[9.5px] uppercase font-bold text-orange-700 block">Kontakt i Identyfikacja:</span>
                ${d.contractorNip}<br>
                tel.: ${d.contractorPhone} &bull; e-mail: ${d.contractorEmail}
              </div>
            </div>
          </div>

          <!-- 2. Kontakt IOD -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 2. Kontakt w sprawach ochrony danych osobowych
            </h3>
            <p class="text-[10px] text-slate-600 leading-snug">
              We wszystkich sprawach dotyczących przetwarzania danych osobowych mogą Państwo kontaktować się z Administratorem przy użyciu danych kontaktowych wskazanych w pkt 1, a jeżeli Administrator wyznaczył Inspektora Ochrony Danych – również pod poniższym adresem:
            </p>
            <div class="p-1.5 bg-slate-50 rounded border border-slate-200 text-[9.5px] text-slate-700 mt-1">
              <strong>Inspektor Ochrony Danych / kontakt:</strong> kontakt bezpośredni z Administratorem (e-mail: ${d.contractorEmail})
            </div>
          </div>

          <!-- 3. Cele i podstawy prawne -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 3. Cele, podstawy prawne i okresy przetwarzania danych
            </h3>
            <p class="text-[10px] text-slate-600 mb-1">Państwa dane osobowe przetwarzane są w następujących celach:</p>
            <table class="w-full text-left text-[9.5px] border border-slate-300 rounded overflow-hidden">
              <thead class="bg-slate-900 text-white text-[9px]">
                <tr>
                  <th class="p-1 border border-slate-700 w-[38%]">Cel przetwarzania</th>
                  <th class="p-1 border border-slate-700 w-[32%]">Podstawa prawna</th>
                  <th class="p-1 border border-slate-700 w-[30%]">Okres przechowywania</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr class="bg-white">
                  <td class="p-1 border border-slate-200">Zawarcie i wykonanie umowy o wykonanie instalacji ogrzewania podłogowego – wodnego, w tym kontakt w sprawach realizacji umowy</td>
                  <td class="p-1 border border-slate-200">art. 6 ust. 1 lit. b) RODO – przetwarzanie niezbędne do wykonania umowy</td>
                  <td class="p-1 border border-slate-200">przez okres obowiązywania umowy oraz do upływu terminu przedawnienia wzajemnych roszczeń</td>
                </tr>
                <tr class="bg-slate-50">
                  <td class="p-1 border border-slate-200">Wypełnienie obowiązków prawnych ciążących na Wykonawcy, w tym obowiązków podatkowych i rachunkowych (np. wystawienie i przechowywanie faktur)</td>
                  <td class="p-1 border border-slate-200">art. 6 ust. 1 lit. c) RODO w zw. z przepisami prawa podatkowego i ustawy o rachunkowości</td>
                  <td class="p-1 border border-slate-200">przez okres wymagany właściwymi przepisami prawa (co do zasady 5 lat licząc od końca roku podatkowego)</td>
                </tr>
                <tr class="bg-white">
                  <td class="p-1 border border-slate-200">Ustalenie, dochodzenie lub obrona przed roszczeniami związanymi z realizacją umowy, w tym z tytułu gwarancji i rękojmi</td>
                  <td class="p-1 border border-slate-200">art. 6 ust. 1 lit. f) RODO – prawnie uzasadniony interes Administratora</td>
                  <td class="p-1 border border-slate-200">do czasu upływu terminu przedawnienia ewentualnych roszczeń, a w przypadku gwarancji – przez okres jej trwania</td>
                </tr>
                <tr class="bg-slate-50">
                  <td class="p-1 border border-slate-200">Marketing bezpośredni własnych produktów i usług Wykonawcy (wyłącznie w przypadku wyrażenia odrębnej zgody)</td>
                  <td class="p-1 border border-slate-200">art. 6 ust. 1 lit. a) RODO – zgoda osoby, której dane dotyczą</td>
                  <td class="p-1 border border-slate-200">do czasu wycofania zgody</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Odbiorcy danych -->
          <div class="mb-1 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 4. Odbiorcy danych osobowych
            </h3>
            <p class="text-[9.5px] text-slate-600 mb-0.5">Państwa dane osobowe mogą zostać ujawnione następującym kategoriom odbiorców:</p>
            <ul class="text-[9px] text-slate-700 space-y-0.5 pl-3 list-disc">
              <li>podwykonawcom i podmiotom współpracującym przy realizacji umowy (ekipom montującym, wykonawcy jastrychu, dostawcom);</li>
              <li>podmiotom świadczącym usługi księgowe, rachunkowe, podatkowe oraz informatyczne i hostingowe;</li>
              <li>bankom i instytucjom płatniczym – w zakresie obsługi rozliczeń; ubezpieczycielowi Administratora oraz organom publicznym.</li>
            </ul>
            <p class="text-[8.5px] text-slate-500 italic mt-0.5">Dane osobowe nie są przekazywane do państw trzecich (poza EOG) ani do organizacji międzynarodowych.</p>
          </div>
        </div>

        <div class="text-[9px] text-slate-400 pt-1.5 border-t border-slate-200 flex justify-between mt-auto avoid-break">
          <span>Załącznik nr 2 &bull; Klauzula informacyjna RODO &bull; Strona 1 z 2</span>
          <span>Umowa nr ${d.contractNo}</span>
        </div>
      </div>

      <!-- ZAŁĄCZNIK NR 2 - STRONA 2 -->
      <div class="document-page">
        <div class="page-main-body">
          <div class="flex justify-between text-[9.5px] text-slate-500 pb-1.5 border-b border-slate-200 mb-2 avoid-break">
            <span>LeSa HOME &bull; Załącznik nr 2 do Umowy: <strong>${d.contractNo}</strong></span><span>Strona 2 z 2</span>
          </div>

          <!-- 5. Prawa osoby -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 5. Prawa osoby, której dane dotyczą
            </h3>
            <p class="text-[10px] text-slate-600 mb-1">Przysługuje Państwu prawo do:</p>
            <div class="grid grid-cols-2 gap-1 text-[9.5px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
              <div>&#10003; dostępu do treści swoich danych osobowych;</div>
              <div>&#10003; przenoszenia danych osobowych;</div>
              <div>&#10003; sprostowania (poprawiania) danych;</div>
              <div>&#10003; wniesienia sprzeciwu wobec przetwarzania;</div>
              <div>&#10003; żądania usunięcia danych (w granicach prawa);</div>
              <div>&#10003; cofnięcia zgody w dowolnym momencie;</div>
              <div>&#10003; żądania ograniczenia przetwarzania;</div>
              <div>&#10003; wniesienia skargi do Prezesa UODO.</div>
            </div>
          </div>

          <!-- 6. Wymóg podania danych -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-0.5 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 6. Informacja o wymogu podania danych
            </h3>
            <p class="text-[10px] text-slate-700 leading-snug">
              Podanie danych osobowych jest dobrowolne, jednak niezbędne do zawarcia i wykonania umowy. Odmowa podania danych uniemożliwia zawarcie umowy oraz realizację wynikających z niej obowiązków.
            </p>
          </div>

          <!-- 7. Profilowanie -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-0.5 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 7. Zautomatyzowane podejmowanie decyzji
            </h3>
            <p class="text-[10px] text-slate-700 leading-snug">
              Państwa dane osobowe nie są przetwarzane w sposób zautomatyzowany, w tym nie podlegają profilowaniu, oraz nie są wykorzystywane do podejmowania decyzji wywołujących wobec Państwa skutki prawne.
            </p>
          </div>

          <!-- 8. Zgoda marketingowa (opcjonalnie) -->
          <div class="mb-3 p-2.5 bg-amber-50/70 rounded-lg border border-amber-300 avoid-break">
            <h3 class="font-bold text-[10.5px] uppercase text-amber-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> 8. Zgoda na przetwarzanie danych w celach marketingowych (opcjonalnie)
            </h3>
            <div class="space-y-1 text-[10px] text-slate-800">
              <label class="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" class="mt-0.5 rounded text-orange-600">
                <span class="font-medium">Wyrażam zgodę na przetwarzanie moich danych osobowych przez Wykonawcę w celu marketingu bezpośredniego jego własnych produktów i usług.</span>
              </label>
              <label class="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" class="mt-0.5 rounded text-orange-600">
                <span>Nie wyrażam zgody na przetwarzanie moich danych osobowych w celach marketingowych.</span>
              </label>
            </div>
            <p class="text-[9px] text-slate-500 mt-1">
              Zgoda jest dobrowolna i może zostać w każdym czasie wycofana bez wpływu na pozostałe cele.
            </p>
          </div>

          <!-- 9. Potwierdzenie i Podpis -->
          <div class="mb-2 avoid-break">
            <h3 class="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span> 9. Potwierdzenie zapoznania się z klauzulą informacyjną
            </h3>
            <p class="text-[10px] text-slate-700 mb-2">
              Oświadczam, że zapoznałem/-am się z treścią powyższej klauzuli informacyjnej dotyczącej przetwarzania danych osobowych.
            </p>

            <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span class="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Miejscowość i data:</span>
                <div class="font-bold text-xs text-slate-900">${d.contractPlace}, dn. ${dateFmt}</div>
                <div class="mt-2.5">
                  <span class="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Zamawiający:</span>
                  <div class="font-bold text-xs text-slate-900">${d.clientName}</div>
                </div>
              </div>
              <div class="text-center flex flex-col justify-end">
                <div class="border-b-2 border-dashed border-slate-400 pb-7 mb-1"></div>
                <div class="font-bold text-xs text-slate-900">${d.clientName}</div>
                <div class="text-[9px] uppercase tracking-wider text-slate-500">Czytelny podpis Zamawiającego</div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-[9px] text-slate-400 pt-1.5 border-t border-slate-200 flex justify-between mt-auto avoid-break">
          <span>Załącznik nr 2 &bull; Klauzula informacyjna RODO &bull; Strona 2 z 2</span>
          <span>Umowa nr ${d.contractNo}</span>
        </div>
      </div>`;
    }

    container.innerHTML = page1 + page2 + page3 + page4 + rodoHtml;
  },

  // ─────────────────────────────────────────────
  //  Drafts / LocalStorage / API
  // ─────────────────────────────────────────────
  async saveDraft() {
    const draftId = 'draft_' + Date.now();
    const item = { id: draftId, savedAt: new Date().toLocaleString('pl-PL'), contractNo: this.data.contractNo, clientName: this.data.clientName, investmentAddress: this.data.investmentAddress, priceBrutto: this.data.priceBrutto, data: JSON.parse(JSON.stringify(this.data)) };
    if (window.ApiService) { await ApiService.saveContract(item); }
    else { const list = await this.getSavedDrafts(); list.unshift(item); localStorage.setItem('lesa_contracts_history', JSON.stringify(list.slice(0,30))); }
    this.updateDraftsBadge();
    this.showToast(`Zapisano umowę dla: ${this.data.clientName}`);
  },

  async getSavedDrafts() {
    if (window.ApiService) return await ApiService.getContracts();
    try { return JSON.parse(localStorage.getItem('lesa_contracts_history')) || []; } catch(e) { return []; }
  },

  async updateDraftsBadge() {
    const drafts = await this.getSavedDrafts();
    const badge = document.getElementById('saved-count-badge');
    if (badge) { if(drafts.length>0){ badge.textContent=drafts.length; badge.classList.remove('hidden'); badge.classList.add('flex'); } else { badge.classList.add('hidden'); badge.classList.remove('flex'); } }
  },

  async openDraftsModal() {
    const modal = document.getElementById('history-modal');
    const listContainer = document.getElementById('saved-contracts-list');
    const drafts = await this.getSavedDrafts();
    if (drafts.length === 0) {
      listContainer.innerHTML = `<div class="text-center py-8 text-slate-400"><p class="font-medium text-slate-600">Brak zapisanych umów w pamięci</p><p class="text-xs text-slate-400">Wypełnij formularz i kliknij „Zapisz".</p></div>`;
    } else {
      listContainer.innerHTML = drafts.map(item => `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-500 transition-all flex items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2"><span class="font-bold text-sm text-slate-900">${item.clientName||'Bez nazwy'}</span><span class="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold">${item.contractNo}</span></div>
            <div class="text-xs text-slate-500 mt-0.5">${item.investmentAddress||'Brak adresu'} &bull; <strong>${Number(item.priceBrutto||0).toLocaleString('pl-PL')} zł brutto</strong></div>
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

  async loadDraft(id) {
    const drafts = await this.getSavedDrafts();
    const item = drafts.find(x => x.id === id);
    if (item && item.data) { this.data=item.data; this.bindDomElements(); this.updateCalculations(); this.render(); this.closeDraftsModal(); this.showToast(`Wczytano umowę: ${item.contractNo}`); }
  },

  async deleteDraft(id) {
    let drafts = await this.getSavedDrafts();
    drafts = drafts.filter(x => x.id !== id);
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
    setTimeout(() => toast.classList.remove('translate-y-2','opacity-0'), 10);
    setTimeout(() => { toast.classList.add('opacity-0','translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => { ContractApp.init(); });
