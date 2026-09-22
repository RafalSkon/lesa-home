/**
 * LeSa - Home: Legal Contract & Technical Handover Protocol Generator
 * Complete Web Application Engine for HVAC / Floor Heating Contracts
 */

// Helper to convert numbers to Polish words
function kwotaSlownie(kwota) {
  const jednosci = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
  const nastki = ["dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście", "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście"];
  const dziesiatki = ["", "dziesięć", "dwadzieścia", "trzydzieści", "czterdzieści", "pięćdziesiąt", "sześćdziesiąt", "siedemdziesiąt", "osiemdziesiąt", "dziewięćdziesiąt"];
  const setki = ["", "sto", "dwieście", "trzysta", "czterysta", "pięćset", "sześćset", "siedemset", "osiemset", "dziewięćset"];
  const grupy = [
    ["", "", ""],
    ["tysiąc", "tysiące", "tysięcy"],
    ["milion", "miliony", "milionów"]
  ];

  let liczba = Math.floor(kwota);
  let grosze = Math.round((kwota - liczba) * 100);

  if (liczba === 0) return `zero złotych ${grosze}/100 gr`;

  let wynik = [];
  let g = 0;

  while (liczba > 0) {
    let s = Math.floor((liczba % 1000) / 100);
    let d = Math.floor((liczba % 100) / 10);
    let j = liczba % 10;
    liczba = Math.floor(liczba / 1000);

    if (s === 0 && d === 0 && j === 0) {
      g++;
      continue;
    }

    let czesc = [];
    if (s > 0) czesc.push(setki[s]);

    if (d === 1) {
      czesc.push(nastki[j]);
    } else {
      if (d > 0) czesc.push(dziesiatki[d]);
      if (j > 0) czesc.push(jednosci[j]);
    }

    let forma = 2;
    if (s === 0 && d === 0 && j === 1) {
      forma = 0;
    } else if (d !== 1 && (j >= 2 && j <= 4)) {
      forma = 1;
    }

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
    
    // Contractor
    contractorName: 'LeSa - Home | Rafał Skowroński',
    contractorNip: 'NIP: 0000000000',
    contractorRegon: 'REGON: 000000000',
    contractorAddress: 'ul. Instalatorów 15, 00-001 Warszawa',
    contractorPhone: '+48 790 000 000',
    contractorEmail: 'kontakt@lesa-home.pl',
    contractorBank: 'PL 12 1020 0000 0000 1234 5678 9012 (PKO BP)',

    // Client
    clientName: 'Jan Kowalski',
    clientPesel: '85051201234',
    clientIdCard: 'ABC 123456',
    clientNip: '',
    clientRep: '',
    clientAddress: 'ul. Przykładowa 12/4, 05-500 Piaseczno',
    clientPhone: '+48 600 123 456',
    clientEmail: 'jan.kowalski@email.pl',
    investmentAddress: 'Działka nr 142/5, ul. Słoneczna, 05-500 Piaseczno',

    // Technical
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

    // Finance
    priceNetto: 19500,
    vatRate: 8,
    priceBrutto: 21060,
    depositPct: 40,
    finalPct: 60,
    paymentDays: 3,

    // Schedule & Warranty
    dateStart: '',
    dateEnd: '',
    warrantyPipes: '10 lat',
    warrantyWork: '36 miesięcy (3 lata)',
    attachProtocol: true,
    attachSpec: true
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
    const end = new Date(today);
    end.setDate(today.getDate() + 14);
    const start = new Date(today);
    start.setDate(today.getDate() + 7);
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
          if (project.clientNip) {
              this.data.contractType = 'B2B';
          } else {
              this.data.contractType = 'B2C';
          }
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
      if (area > 0) {
        this.data.area = area;
        this.data.loops = Math.ceil(area / 11);
        this.data.pipeLen = Math.round(area * 8.5);
      }
    }
    if (params.has('price')) {
      const price = parseFloat(params.get('price'));
      if (price > 0) {
        this.data.priceNetto = price;
      }
    }
    if (params.has('type')) {
      const type = params.get('type');
      if (type === 'B2B' || type === 'B2C') {
        this.data.contractType = type;
        this.data.vatRate = type === 'B2B' ? 23 : 8;
      }
    }
    if (params.has('screed')) {
      const s = params.get('screed');
      if (s === 'anhydrite') this.data.screed = 'Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)';
      else if (s === 'cement') this.data.screed = 'Tradycyjny miksokret cementowy (w zakresie Wykonawcy)';
      else if (s === 'none') this.data.screed = 'Po stronie Zamawiającego (brak wylewki w umowie)';
    }
    if (params.has('control')) {
      const c = params.get('control');
      if (c === 'smart') this.data.control = 'Smart Home: termostaty bezprzewodowe w każdym pokoju + listwa sterująca';
      else if (c === 'manual') this.data.control = 'Sterowanie manualne rotametrami na rozdzielaczu';
    }
  },

  bindDomElements() {
    // Populate form fields from initial data
    document.getElementById('inp_contract_no').value = this.data.contractNo;
    document.getElementById('inp_contract_date').value = this.data.contractDate;
    document.getElementById('inp_contract_place').value = this.data.contractPlace;

    // Contractor
    document.getElementById('inp_contractor_name').value = this.data.contractorName;
    document.getElementById('inp_contractor_nip').value = this.data.contractorNip;
    document.getElementById('inp_contractor_regon').value = this.data.contractorRegon;
    document.getElementById('inp_contractor_address').value = this.data.contractorAddress;
    document.getElementById('inp_contractor_phone').value = this.data.contractorPhone;
    document.getElementById('inp_contractor_email').value = this.data.contractorEmail;
    document.getElementById('inp_contractor_bank').value = this.data.contractorBank;

    // Client
    document.getElementById('inp_client_name').value = this.data.clientName;
    document.getElementById('inp_client_pesel').value = this.data.clientPesel;
    document.getElementById('inp_client_id_card').value = this.data.clientIdCard;
    document.getElementById('inp_client_address').value = this.data.clientAddress;
    document.getElementById('inp_client_phone').value = this.data.clientPhone;
    document.getElementById('inp_client_email').value = this.data.clientEmail;
    document.getElementById('inp_investment_address').value = this.data.investmentAddress;

    // Tech
    document.getElementById('inp_tech_area').value = this.data.area;
    document.getElementById('inp_tech_loops').value = this.data.loops;
    document.getElementById('inp_tech_pipe_len').value = this.data.pipeLen;
    document.getElementById('inp_tech_pipe_type').value = this.data.pipeType;
    document.getElementById('inp_tech_manifold').value = this.data.manifold;
    document.getElementById('inp_tech_screed').value = this.data.screed;
    document.getElementById('inp_tech_control').value = this.data.control;
    document.getElementById('chk_test_pressure').checked = this.data.testPressure;
    document.getElementById('chk_thermal_audit').checked = this.data.thermalAudit;
    document.getElementById('chk_edge_tape').checked = this.data.edgeTape;
    document.getElementById('chk_tacker').checked = this.data.tacker;

    // Finance
    document.getElementById('inp_price_netto').value = this.data.priceNetto;
    document.getElementById('inp_vat_rate').value = this.data.vatRate;
    document.getElementById('inp_deposit_pct').value = this.data.depositPct;
    document.getElementById('inp_final_pct').value = this.data.finalPct;
    document.getElementById('inp_payment_days').value = this.data.paymentDays;

    // Dates & Warranty
    document.getElementById('inp_date_start').value = this.data.dateStart;
    document.getElementById('inp_date_end').value = this.data.dateEnd;
    document.getElementById('inp_warranty_pipes').value = this.data.warrantyPipes;
    document.getElementById('inp_warranty_work').value = this.data.warrantyWork;
    document.getElementById('chk_attach_protocol').checked = this.data.attachProtocol;
    document.getElementById('chk_attach_spec').checked = this.data.attachSpec;

    // Radio
    const radios = document.querySelectorAll('input[name="contract_type"]');
    radios.forEach(r => {
      r.checked = r.value === this.data.contractType;
    });
    this.toggleB2bB2cFields();
  },

  toggleB2bB2cFields() {
    const b2cBox = document.getElementById('client_b2c_fields');
    const b2bBox = document.getElementById('client_b2b_fields');
    if (this.data.contractType === 'B2B') {
      b2cBox.classList.add('hidden');
      b2cBox.classList.remove('grid');
      b2bBox.classList.remove('hidden');
      b2bBox.classList.add('grid');
      if (this.data.vatRate === 8) {
        this.data.vatRate = 23;
        document.getElementById('inp_vat_rate').value = "23";
      }
    } else {
      b2bBox.classList.add('hidden');
      b2bBox.classList.remove('grid');
      b2cBox.classList.remove('hidden');
      b2cBox.classList.add('grid');
    }
  },

  bindEvents() {
    // Listen to form input changes
    const form = document.getElementById('contract-form');
    form.addEventListener('input', () => {
      this.syncDataFromForm();
      this.updateCalculations();
      this.render();
    });
    form.addEventListener('change', () => {
      this.syncDataFromForm();
      this.updateCalculations();
      this.render();
    });

    // Contract type radio
    const radios = document.querySelectorAll('input[name="contract_type"]');
    radios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.data.contractType = e.target.value;
        this.toggleB2bB2cFields();
        this.updateCalculations();
        this.render();
      });
    });

    // Accordions
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        const icon = trigger.querySelector('svg');
        content.classList.toggle('hidden');
        if (icon) icon.classList.toggle('rotate-180');
      });
    });

    // Area auto recalculate loops & pipes
    document.getElementById('inp_tech_area').addEventListener('input', (e) => {
      const area = parseInt(e.target.value, 10) || 0;
      if (area > 0) {
        const loops = Math.ceil(area / 11);
        const pipes = Math.round(area * 8.5);
        document.getElementById('inp_tech_loops').value = loops;
        document.getElementById('inp_tech_pipe_len').value = pipes;
        this.data.loops = loops;
        this.data.pipeLen = pipes;
      }
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // Top Bar Actions
    document.getElementById('btn-print-doc').addEventListener('click', () => window.print());
    document.getElementById('btn-quick-print').addEventListener('click', () => window.print());

    document.getElementById('btn-reset-form').addEventListener('click', () => {
      if (confirm('Czy na pewno chcesz wyczyścić formularz i utworzyć nową umowę?')) {
        window.location.href = 'generator-umow.html';
      }
    });

    document.getElementById('btn-save-draft').addEventListener('click', () => this.saveDraft());
    document.getElementById('btn-load-drafts').addEventListener('click', () => this.openDraftsModal());
    document.getElementById('btn-close-modal').addEventListener('click', () => this.closeDraftsModal());
    document.getElementById('btn-clear-all-drafts').addEventListener('click', () => this.clearAllDrafts());

    document.getElementById('btn-copy-text').addEventListener('click', () => this.copyToClipboard());

    // Mobile View Toggle
    const tabForm = document.getElementById('tab-btn-form');
    const tabDoc = document.getElementById('tab-btn-doc');
    const editorCol = document.getElementById('editor-container');
    const previewCol = document.getElementById('preview-container');

    if (tabForm && tabDoc) {
      tabForm.addEventListener('click', () => {
        tabForm.classList.add('bg-orange-600', 'text-white');
        tabForm.classList.remove('text-slate-400');
        tabDoc.classList.remove('bg-orange-600', 'text-white');
        tabDoc.classList.add('text-slate-400');
        editorCol.classList.remove('hidden');
        previewCol.classList.add('hidden');
      });

      tabDoc.addEventListener('click', () => {
        tabDoc.classList.add('bg-orange-600', 'text-white');
        tabDoc.classList.remove('text-slate-400');
        tabForm.classList.remove('bg-orange-600', 'text-white');
        tabForm.classList.add('text-slate-400');
        editorCol.classList.add('hidden');
        previewCol.classList.remove('hidden');
      });
    }
  },

  syncDataFromForm() {
    this.data.contractNo = document.getElementById('inp_contract_no').value;
    this.data.contractDate = document.getElementById('inp_contract_date').value;
    this.data.contractPlace = document.getElementById('inp_contract_place').value;

    // Contractor
    this.data.contractorName = document.getElementById('inp_contractor_name').value;
    this.data.contractorNip = document.getElementById('inp_contractor_nip').value;
    this.data.contractorRegon = document.getElementById('inp_contractor_regon').value;
    this.data.contractorAddress = document.getElementById('inp_contractor_address').value;
    this.data.contractorPhone = document.getElementById('inp_contractor_phone').value;
    this.data.contractorEmail = document.getElementById('inp_contractor_email').value;
    this.data.contractorBank = document.getElementById('inp_contractor_bank').value;

    // Client
    this.data.clientName = document.getElementById('inp_client_name').value;
    this.data.clientPesel = document.getElementById('inp_client_pesel').value;
    this.data.clientIdCard = document.getElementById('inp_client_id_card').value;
    this.data.clientNip = document.getElementById('inp_client_nip')?.value || '';
    this.data.clientRep = document.getElementById('inp_client_rep')?.value || '';
    this.data.clientAddress = document.getElementById('inp_client_address').value;
    this.data.clientPhone = document.getElementById('inp_client_phone').value;
    this.data.clientEmail = document.getElementById('inp_client_email').value;
    this.data.investmentAddress = document.getElementById('inp_investment_address').value;

    // Tech
    this.data.area = parseFloat(document.getElementById('inp_tech_area').value) || 0;
    this.data.loops = parseInt(document.getElementById('inp_tech_loops').value, 10) || 0;
    this.data.pipeLen = parseInt(document.getElementById('inp_tech_pipe_len').value, 10) || 0;
    this.data.pipeType = document.getElementById('inp_tech_pipe_type').value;
    this.data.manifold = document.getElementById('inp_tech_manifold').value;
    this.data.screed = document.getElementById('inp_tech_screed').value;
    this.data.control = document.getElementById('inp_tech_control').value;
    this.data.testPressure = document.getElementById('chk_test_pressure').checked;
    this.data.thermalAudit = document.getElementById('chk_thermal_audit').checked;
    this.data.edgeTape = document.getElementById('chk_edge_tape').checked;
    this.data.tacker = document.getElementById('chk_tacker').checked;

    // Finance
    this.data.priceNetto = parseFloat(document.getElementById('inp_price_netto').value) || 0;
    this.data.vatRate = parseFloat(document.getElementById('inp_vat_rate').value) || 0;
    this.data.depositPct = parseFloat(document.getElementById('inp_deposit_pct').value) || 0;
    this.data.finalPct = parseFloat(document.getElementById('inp_final_pct').value) || 0;
    this.data.paymentDays = parseInt(document.getElementById('inp_payment_days').value, 10) || 3;

    // Dates
    this.data.dateStart = document.getElementById('inp_date_start').value;
    this.data.dateEnd = document.getElementById('inp_date_end').value;
    this.data.warrantyPipes = document.getElementById('inp_warranty_pipes').value;
    this.data.warrantyWork = document.getElementById('inp_warranty_work').value;
    this.data.attachProtocol = document.getElementById('chk_attach_protocol').checked;
    this.data.attachSpec = document.getElementById('chk_attach_spec').checked;
  },

  updateCalculations() {
    // Calculate Brutto
    const netto = this.data.priceNetto;
    const vat = this.data.vatRate;
    const brutto = Math.round(netto * (1 + vat / 100) * 100) / 100;
    this.data.priceBrutto = brutto;

    document.getElementById('inp_price_brutto').value = brutto;

    // Deposits
    const depositVal = Math.round(brutto * (this.data.depositPct / 100));
    const finalVal = Math.round(brutto - depositVal);

    document.getElementById('deposit_amount_display').textContent = `= ${depositVal.toLocaleString('pl-PL')} zł`;
    document.getElementById('final_amount_display').textContent = `= ${finalVal.toLocaleString('pl-PL')} zł`;
  },

  applyPreset(preset) {
    if (preset === 'b2c_house') {
      this.data.contractType = 'B2C';
      this.data.area = 140;
      this.data.loops = 13;
      this.data.pipeLen = 1190;
      this.data.priceNetto = 19500;
      this.data.vatRate = 8;
      this.data.screed = 'Wylewka anhydrytowa samopoziomująca gr. ~50mm (w zakresie Wykonawcy)';
      this.data.control = 'Smart Home: termostaty bezprzewodowe w każdym pokoju + listwa sterująca';
      this.showToast('Wczytano profil: Standardowy Dom Jednorodzinny B2C (140m²)');
    } else if (preset === 'b2b_dev') {
      this.data.contractType = 'B2B';
      this.data.clientName = 'Bud-Invest Sp. z o.o.';
      this.data.clientNip = 'NIP: 525-100-20-30';
      this.data.clientRep = 'Marek Wiśniewski - Członek Zarządu';
      this.data.clientAddress = 'Al. Jerozolimskie 100, 02-001 Warszawa';
      this.data.investmentAddress = 'Osiedle Zielona Dolina, Budynek B, Warszawa';
      this.data.area = 360;
      this.data.loops = 34;
      this.data.pipeLen = 3060;
      this.data.priceNetto = 48500;
      this.data.vatRate = 23;
      this.data.depositPct = 50;
      this.data.finalPct = 50;
      this.data.screed = 'Po stronie Zamawiającego (brak wylewki w umowie)';
      this.showToast('Wczytano profil: Inwestycja Deweloperska B2B');
    } else if (preset === 'protocol_only') {
      this.data.attachProtocol = true;
      this.data.attachSpec = true;
      this.showToast('Przełączono podgląd pod protokół odbioru');
    }

    this.bindDomElements();
    this.updateCalculations();
    this.render();
  },

  render() {
    const container = document.getElementById('rendered-contract');
    if (!container) return;

    const d = this.data;
    const slownieKwota = kwotaSlownie(d.priceBrutto);
    const depositAmt = Math.round(d.priceBrutto * (d.depositPct / 100));
    const finalAmt = Math.round(d.priceBrutto - depositAmt);

    // Format dates
    const dateFormatted = d.contractDate ? new Date(d.contractDate).toLocaleDateString('pl-PL') : '...................';
    const startFormatted = d.dateStart ? new Date(d.dateStart).toLocaleDateString('pl-PL') : '...................';
    const endFormatted = d.dateEnd ? new Date(d.dateEnd).toLocaleDateString('pl-PL') : '...................';

    // HTML for Page 1: Main Agreement
    const page1Html = `
      <div class="document-page">
        
        <!-- Header / Logo -->
        <div class="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center p-1 text-white">
              <svg class="w-full h-full" viewBox="0 0 100 100" fill="none">
                <path d="M22,64 A36,36 0 1,1 76,77" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" />
                <path d="M42,30 A20,20 0 0,1 70,58" fill="none" stroke="#ea580c" stroke-width="7.5" stroke-linecap="round" />
                <circle cx="50" cy="50" r="4" fill="#ea580c" />
              </svg>
            </div>
            <div>
              <span class="text-base font-extrabold tracking-tight text-slate-900 font-heading">LeSa <span class="text-orange-600">HOME</span></span>
              <span class="text-[9px] uppercase tracking-widest text-slate-500 block -mt-1">Nowoczesne Systemy Grzewcze &bull; Ogrzewanie Podłogowe</span>
            </div>
          </div>
          <div class="text-right text-[11px] text-slate-600">
            <div>Nr umowy: <strong class="text-slate-900 font-mono">${d.contractNo || 'UM/LES/2026/01'}</strong></div>
            <div>Miejscowość: <strong>${d.contractPlace || 'Warszawa'}</strong>, dn. <strong>${dateFormatted}</strong></div>
          </div>
        </div>

        <!-- Document Title -->
        <div class="text-center my-4">
          <h1 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">
            UMOWA O ROBOTY MONTAŻOWE INSTALACJI GRZEWCZEJ
          </h1>
          <p class="text-[11px] text-slate-500 font-medium mt-0.5">
            (System Wodnego Ogrzewania Podłogowego w standardzie niskotemperaturowym)
          </p>
        </div>

        <!-- Parties Clause -->
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 mb-4">
          <p class="font-medium text-slate-700">Zawarta w dniu <strong>${dateFormatted}</strong> r. w <strong>${d.contractPlace}</strong> pomiędzy:</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
            <div>
              <strong class="text-orange-950 uppercase text-[11px] block text-orange-700">1. WYKONAWCA:</strong>
              <div class="font-bold text-slate-900">${d.contractorName}</div>
              <div class="text-[11px] text-slate-600">${d.contractorAddress}</div>
              <div class="text-[11px] text-slate-600">${d.contractorNip} &bull; ${d.contractorRegon}</div>
              <div class="text-[11px] text-slate-600">Tel: ${d.contractorPhone} &bull; E-mail: ${d.contractorEmail}</div>
            </div>
            
            <div>
              <strong class="text-slate-950 uppercase text-[11px] block text-slate-700">2. ZAMAWIAJĄCY / INWESTOR:</strong>
              <div class="font-bold text-slate-900">${d.clientName}</div>
              <div class="text-[11px] text-slate-600">${d.clientAddress}</div>
              ${d.contractType === 'B2C' 
                ? `<div class="text-[11px] text-slate-600">PESEL: ${d.clientPesel || '–'} &bull; Seria/Nr dowodu: ${d.clientIdCard || '–'}</div>`
                : `<div class="text-[11px] text-slate-600">${d.clientNip || '–'} &bull; Reprezentacja: ${d.clientRep || 'Zarząd'}</div>`
              }
              <div class="text-[11px] text-slate-600">Tel: ${d.clientPhone} &bull; E-mail: ${d.clientEmail}</div>
            </div>
          </div>
        </div>

        <!-- § 1. PRZEDMIOT UMOWY -->
        <div class="space-y-1.5 mb-3.5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 1.</span> Przedmiot Umowy i Zakres Prac
          </h2>
          <p class="text-[12px] text-slate-700 text-justify">
            1. Zamawiający zleca, a Wykonawca zobowiązuje się do kompleksowego wykonania instalacji wodnego ogrzewania podłogowego w budynku pod adresem: <strong>${d.investmentAddress}</strong>, na powierzchni grzewczej ok. <strong>${d.area} m²</strong>.
          </p>
          <div class="text-[11.5px] text-slate-700 pl-3 border-l-2 border-orange-300 space-y-0.5 my-1.5">
            <div>&bull; <strong>System rurociągów:</strong> Montaż rury: <em>${d.pipeType}</em> w szacunkowej długości ok. <strong>${d.pipeLen} mb</strong> w ilości <strong>${d.loops} pętli grzewczych</strong>.</div>
            <div>&bull; <strong>Rozdzielacze:</strong> <em>${d.manifold}</em>.</div>
            <div>&bull; <strong>Wylewka posadzki:</strong> <em>${d.screed}</em>.</div>
            <div>&bull; <strong>Automatyka sterująca:</strong> <em>${d.control}</em>.</div>
            <div>&bull; <strong>Usługi dodatkowe:</strong> ${[
              d.testPressure ? 'Próba ciśnieniowa szczelności 6 bar pod protokół' : '',
              d.thermalAudit ? 'Projekt ułożenia pętli i optymalizacja hydrauliczna' : '',
              d.edgeTape ? 'Taśmy brzegowe dylatacyjne i folia' : '',
              d.tacker ? 'Mocowanie systemowe Tacker' : ''
            ].filter(Boolean).join(', ')}.</div>
          </div>
        </div>

        <!-- § 2. OBOWIĄZKI ZAMAWIAJĄCEGO -->
        <div class="space-y-1.5 mb-3.5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 2.</span> Warunki Gotowości Placu Budowy (Front Robót)
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Zamawiający oświadcza, że posiada tytuł prawny do dysponowania obiektem oraz zobowiązuje się przygotować plac budowy najpóźniej na dzień rozpoczęcia prac, tj.:
          </p>
          <ul class="list-disc list-inside text-[11px] text-slate-600 pl-1 space-y-0.5">
            <li>Zapewnić stan surowy zamknięty budynku (zamontowana stolarka okienna i drzwiowa),</li>
            <li>Zapewnić podłoże betonowe uprzątnięte, zamiecione, suche i wolne od gruzu budowlanego,</li>
            <li>Zapewnić nieodpłatny dostęp do punktu poboru wody oraz prądu (230V / 400V),</li>
            <li>Wyznaczyć na ścianach stałe poziomy odniesienia posadzki ("poziom zero" / repery),</li>
            <li>Zapewnić w obiekcie temperaturę dodatnią nie niższą niż <strong>+5&deg;C</strong>.</li>
          </ul>
          <p class="text-[10.5px] text-slate-500 italic">
            * Brak przygotowania frontu robót zwalnia Wykonawcę z odpowiedzialności za opóźnienia i skutkuje automatycznym przesunięciem terminu zakończenia prac.
          </p>
        </div>

        <!-- § 3. TERMINY REALIZACJI -->
        <div class="space-y-1.5 mb-3.5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 3.</span> Harmonogram Realizacji
          </h2>
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div>Rozpoczęcie robót na budowie: <strong>${startFormatted}</strong></div>
            <div>Planowane zakończenie i zgłoszenie do odbioru: <strong>${endFormatted}</strong></div>
          </div>
        </div>

        <!-- § 4. WYNAGRODZENIE I ROZLICZENIA -->
        <div class="space-y-1.5 mb-3.5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 4.</span> Wynagrodzenie i Płatności
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Za wykonanie przedmiotu umowy strony ustalają wynagrodzenie ryczałtowe w kwocie: <strong>${d.priceNetto.toLocaleString('pl-PL')} zł netto</strong> + podatek VAT ${d.vatRate}%, co stanowi łącznie: <strong class="text-slate-900">${d.priceBrutto.toLocaleString('pl-PL')} zł brutto</strong> (słownie: <em>${slownieKwota}</em>).
          </p>
          <div class="text-[11px] text-slate-700 bg-orange-50/50 p-2.5 rounded-lg border border-orange-200 space-y-1">
            <div>&bull; <strong>I Transza (Zadatek na zakup materiałów):</strong> <strong>${depositAmt.toLocaleString('pl-PL')} zł</strong> (${d.depositPct}%), płatna przelewem w terminie 3 dni od zawarcia niniejszej umowy.</div>
            <div>&bull; <strong>II Transza (Płatność końcowa):</strong> <strong>${finalAmt.toLocaleString('pl-PL')} zł</strong> (${d.finalPct}%), płatna w terminie <strong>${d.paymentDays} dni</strong> od podpisania Protokołu Odbioru Końcowego.</div>
            <div class="text-[10.5px] text-slate-600 font-mono">Nr konta Wykonawcy: <strong>${d.contractorBank}</strong></div>
          </div>
        </div>

        <!-- Footer Notice -->
        <div class="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 flex justify-between">
          <span>Strona 1 z 2 &bull; Umowa nr ${d.contractNo}</span>
          <span>LeSa - Home &bull; www.lesa-home.pl</span>
        </div>

      </div>

      <!-- ================= PAGE 2: TERMS & SIGNATURES ================= -->
      <div class="document-page">
        
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 mb-4 text-xs text-slate-500">
          <span>Załącznik do Umowy nr: <strong>${d.contractNo}</strong></span>
          <span>Strona 2 z 2</span>
        </div>

        <!-- § 5. ODBIÓR I PRÓBA CIŚNIENIOWA -->
        <div class="space-y-1.5 mb-4">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 5.</span> Odbiór Końcowy i Próba Ciśnieniowa
          </h2>
          <p class="text-[11.5px] text-slate-700 text-justify">
            1. Potwierdzeniem prawidłowego wykonania instalacji jest przeprowadzenie w obecności Zamawiającego próby ciśnieniowej na zimno (sprężonym powietrzem lub wodą pod ciśnieniem 6 bar) oraz spisanie <strong>Protokołu Odbioru Końcowego (Załącznik nr 1)</strong>.
          </p>
          <p class="text-[11.5px] text-slate-700 text-justify">
            2. Pozytywny wynik próby ciśnieniowej potwierdzony w protokole stanowi dowód pełnej szczelności i braku wad ukrytych instalacji w chwili przekazania.
          </p>
        </div>

        <!-- § 6. GWARANCJA I RĘKOJMIA -->
        <div class="space-y-1.5 mb-4">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 6.</span> Warunki Gwarancji i Ograniczenia Odpowiedzialności
          </h2>
          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2">
            <div>Gwarancja na szczelność rurociągów: <strong>${d.warrantyPipes}</strong></div>
            <div>Gwarancja na montaż i osprzęt: <strong>${d.warrantyWork}</strong></div>
          </div>
          <p class="text-[11px] text-slate-700 text-justify">
            1. Gwarancja obowiązuje pod warunkiem użytkowania instalacji zgodnie z dokumentacją techniczną i wytycznymi producenta.
          </p>
          <p class="text-[11px] text-slate-700 text-justify">
            2. <strong>Wyłączenie odpowiedzialności:</strong> Gwarancja Wykonawcy nie obejmuje uszkodzeń mechanicznych (przebicie, przewiercenie rur, zgniecenie) powstałych po podpisaniu protokołu odbioru w wyniku prac innych wykonawców (posadzkarze, tynkarze, ekipy wykończeniowe).
          </p>
          <p class="text-[11px] text-slate-700 text-justify">
            3. Zamawiający ma obowiązek dopilnować, aby w trakcie wylewania jastrychu instalacja pozostawała pod stałym ciśnieniem kontrolnym min. 3.0 bar.
          </p>
        </div>

        <!-- § 7. POSTANOWIENIA KOŃCOWE & RODO -->
        <div class="space-y-1.5 mb-5">
          <h2 class="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
            <span class="text-orange-600 font-extrabold">&sect; 7.</span> Postanowienia Końcowe
          </h2>
          <p class="text-[11px] text-slate-600 text-justify">
            1. Wszelkie zmiany niniejszej umowy wymagają formy pisemnej lub elektronicznej pod rygorem nieważności.
          </p>
          <p class="text-[11px] text-slate-600 text-justify">
            2. W sprawach nieuregulowanych umową zastosowanie mają właściwe przepisy Kodeksu Cywilnego dotyczące umowy o roboty budowlane / montażowe.
          </p>
          <p class="text-[11px] text-slate-600 text-justify">
            3. Spory wynikłe z umowy strony poddają pod rozstrzygnięcie sądu powszechnego właściwego dla siedziby Wykonawcy.
          </p>
          <p class="text-[11px] text-slate-600 text-justify">
            4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.
          </p>
        </div>

        <!-- SIGNATURE BOXES -->
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
          <span>Strona 2 z 2 &bull; Umowa nr ${d.contractNo}</span>
          <span>Podpisano w dn. ${dateFormatted}</span>
        </div>

      </div>
    `;

    // HTML for Protocol (Załącznik nr 1)
    let protocolHtml = '';
    if (d.attachProtocol) {
      protocolHtml = `
        <div class="document-page">
          
          <div class="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-extrabold tracking-tight text-slate-900 font-heading">LeSa <span class="text-orange-600">HOME</span></span>
              <span class="text-[10px] text-slate-500 font-semibold">| PROTOKÓŁ TECHNICZNY</span>
            </div>
            <div class="text-right text-[10px] text-slate-600">
              Załącznik nr 1 do Umowy: <strong>${d.contractNo}</strong>
            </div>
          </div>

          <div class="text-center my-4">
            <h2 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">
              PROTOKÓŁ PRÓBY CIŚNIENIOWEJ I ODBIORU TECHNICZNEGO INSTALACJI
            </h2>
            <p class="text-[11px] text-slate-500">
              Sporządzony zgodnie z Polską Normą PN-EN 1264-4 dla systemów ogrzewania płaszczyznowego
            </p>
          </div>

          <!-- Basic Data -->
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

          <!-- Pressure Test Data Table -->
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
              <tr class="bg-white">
                <td class="p-2 border border-slate-200 font-medium">Medium próbne:</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-900">Sprężone powietrze / Woda</td>
                <td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&check; Zgodne z normą</td>
              </tr>
              <tr class="bg-slate-50">
                <td class="p-2 border border-slate-200 font-medium">Ciśnienie początkowe próby:</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-900">6.0 bar</td>
                <td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&check; Spełnia (min. 1.5x robocze)</td>
              </tr>
              <tr class="bg-white">
                <td class="p-2 border border-slate-200 font-medium">Czas trwania próby:</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-900">24 godziny (lub 120 min skrócona)</td>
                <td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&check; Prawidłowy czas</td>
              </tr>
              <tr class="bg-slate-50">
                <td class="p-2 border border-slate-200 font-medium">Ciśnienie końcowe / Spadek:</td>
                <td class="p-2 border border-slate-200 font-bold text-slate-900">6.0 bar &bull; Spadek: 0.0 bar</td>
                <td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&check; Brak ubytków</td>
              </tr>
              <tr class="bg-orange-50 font-bold">
                <td class="p-2 border border-orange-200 text-slate-900">WYNIK KOŃCOWY PRÓBY:</td>
                <td class="p-2 border border-orange-200 text-emerald-800 uppercase" colspan="2">POZYTYWNY &bull; INSTALACJA 100% SZCZELNA</td>
              </tr>
            </tbody>
          </table>

          <!-- Visual Checklist -->
          <h3 class="font-bold text-xs uppercase text-slate-900 mb-2 flex items-center gap-1">
            <span class="text-orange-600">&bull;</span> Weryfikacja Jakościowa Montażu
          </h3>
          <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>&check; Rury ułożone bez zagięć i załamań</div>
            <div>&check; Taśma brzegowa dylatacyjna kompletna</div>
            <div>&check; Rozdzielacz zamocowany stabilnie i wypoziomowany</div>
            <div>&check; Rotametry i zawory odcinające sprawne</div>
            <div>&check; Brak widocznych uszkodzeń mechanicznych rur</div>
            <div>&check; Przekazano wytyczne wygrzewania wylewki</div>
          </div>

          <!-- Protocol Signatures -->
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

  // Save to LocalStorage
  async saveDraft() {
    const draftId = 'draft_' + Date.now();
    const draftItem = {
      id: draftId,
      savedAt: new Date().toLocaleString('pl-PL'),
      contractNo: this.data.contractNo,
      clientName: this.data.clientName,
      investmentAddress: this.data.investmentAddress,
      priceBrutto: this.data.priceBrutto,
      data: JSON.parse(JSON.stringify(this.data))
    };

    if (window.ApiService) {
        await ApiService.saveContract(draftItem);
    } else {
        const list = await this.getSavedDrafts();
        list.unshift(draftItem);
        localStorage.setItem('lesa_contracts_history', JSON.stringify(list.slice(0, 30)));
    }
    this.updateDraftsBadge();
    this.showToast(`Zapisano umowę dla: ${this.data.clientName}`);
  },

  async getSavedDrafts() {
    if (window.ApiService) {
        return await ApiService.getContracts();
    }
    try {
      const saved = localStorage.getItem('lesa_contracts_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async updateDraftsBadge() {
    const drafts = this.getSavedDrafts();
    const badge = document.getElementById('saved-count-badge');
    if (badge) {
      if (drafts.length > 0) {
        badge.textContent = drafts.length;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
    }
  },

  async openDraftsModal() {
    const modal = document.getElementById('history-modal');
    const listContainer = document.getElementById('saved-contracts-list');
    const drafts = this.getSavedDrafts();

    if (drafts.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p class="font-medium text-slate-600">Brak zapisanych umów w pamięci</p>
          <p class="text-xs text-slate-400">Wypełnij formularz i kliknij przycisk "Zapisz", aby móc do niego wrócić w dowolnym momencie.</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = drafts.map(item => `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-500 transition-all flex items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-900">${item.clientName || 'Bez nazwy'}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold">${item.contractNo}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${item.investmentAddress || 'Brak adresu'} &bull; <strong>${Number(item.priceBrutto || 0).toLocaleString('pl-PL')} zł brutto</strong></div>
            <div class="text-[10px] text-slate-400 mt-1">Zapisano: ${item.savedAt}</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors" onclick="ContractApp.loadDraft('${item.id}')">
              Wczytaj
            </button>
            <button class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" onclick="ContractApp.deleteDraft('${item.id}')" title="Usuń">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `).join('');
    }

    modal.classList.add('open');
  },

  closeDraftsModal() {
    const modal = document.getElementById('history-modal');
    modal.classList.remove('open');
  },

  loadDraft(id) {
    const drafts = this.getSavedDrafts();
    const item = drafts.find(x => x.id === id);
    if (item && item.data) {
      this.data = item.data;
      this.bindDomElements();
      this.updateCalculations();
      this.render();
      this.closeDraftsModal();
      this.showToast(`Wczytano umowę: ${item.contractNo}`);
    }
  },

  deleteDraft(id) {
    let drafts = this.getSavedDrafts();
    drafts = drafts.filter(x => x.id !== id);
    localStorage.setItem('lesa_contracts_history', JSON.stringify(drafts));
    this.updateDraftsBadge();
    this.openDraftsModal(); // re-render modal
  },

  async clearAllDrafts() {
    if (confirm('Czy na pewno chcesz usunąć wszystkie zapisane umowy?')) {
      if (window.ApiService) { /* Cannot clear all from api yet */ } else { localStorage.removeItem('lesa_contracts_history'); }
      this.updateDraftsBadge();
      this.openDraftsModal();
      this.showToast('Wyczyszczono historię umów.');
    }
  },

  copyToClipboard() {
    const container = document.getElementById('rendered-contract');
    if (!container) return;

    const text = container.innerText;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Skopiowano treść umowy do schowka!');
    }).catch(() => {
      this.showToast('Nie udało się skopiować automatycznie.');
    });
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
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ContractApp.init();
});



