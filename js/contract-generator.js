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
    depositDate: '',
    rata1Amt: 0,
    rata1Date: '',
    rata2Amt: 0,
    rata2Date: '',
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
    attachProtocol: true,
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
    const start = new Date(today); start.setDate(today.getDate() + 7);
    const end = new Date(today); end.setDate(today.getDate() + 21);
    this.data.contractNo = `UM/LES/${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/01`;
    this.data.contractDate = today.toISOString().split('T')[0];
    this.data.dateStart = start.toISOString().split('T')[0];
    this.data.dateEnd = end.toISOString().split('T')[0];
    const d3 = new Date(today); d3.setDate(today.getDate() + 3);
    this.data.depositDate = d3.toISOString().split('T')[0];
  },

  async loadActiveProjectData(projectId = null) {
    const activeProjectId = projectId || new URLSearchParams(window.location.search).get('projectId') || localStorage.getItem('lesa_active_project_id');
    if (!activeProjectId) return;
    try {
      let projects = [];
      if (window.ApiService) { projects = await ApiService.getProjects(); }
      else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
      const project = projects.find(p => p.id === activeProjectId);
      if (project) {
        this.data.clientName    = project.clientName    || '';
        this.data.clientAddress = project.clientAddress || '';
        this.data.investmentAddress = project.investmentAddress || project.clientAddress || '';
        this.data.clientNip   = project.clientNip   ? `NIP: ${project.clientNip}` : '';
        this.data.clientPesel = project.clientPesel || '';
        this.data.clientIdCard = project.clientIdCard || '';
        this.data.clientPhone = project.clientPhone || '';
        this.data.clientEmail = project.clientEmail || '';
        this.data.contractType = project.clientNip ? 'B2B' : 'B2C';
        if (project.cadData) {
          if (project.cadData.area)       this.data.area    = project.cadData.area;
          if (project.cadData.loopsCount) this.data.loops   = project.cadData.loopsCount;
          if (project.cadData.pipeLen)    this.data.pipeLen = project.cadData.pipeLen;
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
      if (window.ApiService) { projects = await ApiService.getProjects(); }
      else { projects = JSON.parse(localStorage.getItem('lesa_projects')) || []; }
      select.innerHTML = '<option value="">-- Wybierz projekt z bazy --</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.clientName} – ${p.name || 'Brak nazwy'} (${new Date(p.createdAt || Date.now()).toLocaleDateString()})`;
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
    set('inp_deposit_amt',   this.data.depositAmt);
    set('inp_deposit_date',  this.data.depositDate);
    set('inp_rata1_amt',     this.data.rata1Amt);
    set('inp_rata1_date',    this.data.rata1Date);
    set('inp_rata2_amt',     this.data.rata2Amt);
    set('inp_rata2_date',    this.data.rata2Date);

    set('inp_date_start',      this.data.dateStart);
    set('inp_date_end',        this.data.dateEnd);
    set('inp_warranty_pipes',  this.data.warrantyPipes);
    set('inp_warranty_months', this.data.warrantyMonths);

    chk('chk_consumer_start',  this.data.consumerStartDeclaration);
    chk('chk_attach_protocol', this.data.attachProtocol);
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
    this.data.depositDate = gv('inp_deposit_date');
    this.data.rata1Amt    = parseFloat(gv('inp_rata1_amt'))    || 0;
    this.data.rata1Date   = gv('inp_rata1_date');
    this.data.rata2Amt    = parseFloat(gv('inp_rata2_amt'))    || 0;
    this.data.rata2Date   = gv('inp_rata2_date');

    this.data.dateStart      = gv('inp_date_start');
    this.data.dateEnd        = gv('inp_date_end');
    this.data.warrantyPipes  = gv('inp_warranty_pipes');
    this.data.warrantyMonths = gv('inp_warranty_months');

    this.data.consumerStartDeclaration = gc('chk_consumer_start');
    this.data.attachProtocol = gc('chk_attach_protocol');
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
    const dDisp = document.getElementById('deposit_amount_display'); if(dDisp) dDisp.textContent = `Brutto: ${brutto.toLocaleString('pl-PL')} zł`;
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
    } else if (preset === 'protocol_only') {
      this.data.attachProtocol=true; this.data.attachSpec=true;
      this.showToast('Przełączono podgląd pod protokół odbioru');
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
    const depositDateFmt = fmt(d.depositDate);
    const rata1DateFmt   = fmt(d.rata1Date);
    const rata2DateFmt   = fmt(d.rata2Date);

    const vatStr = d.vatRate === 0 ? 'ZW' : `${d.vatRate}%`;
    const depositAmtStr = d.depositAmt ? `${Number(d.depositAmt).toLocaleString('pl-PL')} zł` : '................................ zł';
    const rata1AmtStr   = d.rata1Amt   ? `${Number(d.rata1Amt).toLocaleString('pl-PL')} zł`   : '................................ zł';
    const rata2AmtStr   = d.rata2Amt   ? `${Number(d.rata2Amt).toLocaleString('pl-PL')} zł`   : '................................ zł';

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
        <div class="text-right text-[11px] text-slate-600">${rightText}</div>
      </div>`;

    const pageFooter = (page, total) => `
      <div class="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between mt-4">
        <span>Strona ${page} z ${total} &bull; Umowa nr ${d.contractNo}</span>
        <span>LeSa – Home &bull; www.lesa-home.pl</span>
      </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 1
    // ─────────────────────────────────────────────
    const page1 = `
    <div class="document-page">
      ${docHeader('Nowoczesne Systemy Grzewcze &bull; Instalacje HVAC',
        `Nr umowy: <strong class="font-mono">${d.contractNo}</strong><br>
         Miejscowość: <strong>${d.contractPlace}</strong>, dn. <strong>${dateFmt}</strong>`)}

      <div class="text-center my-4">
        <h1 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">UMOWA O WYKONANIE INSTALACJI OGRZEWANIA PODŁOGOWEGO – WODNEGO</h1>
      </div>

      <p class="text-[12px] text-slate-800 mb-3">
        zawarta w dniu <strong>${dateFmt}</strong> w <strong>${d.contractPlace}</strong> pomiędzy:
      </p>

      <!-- Strony umowy -->
      <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11.5px] space-y-2.5 mb-4">
        <div>
          <strong class="text-orange-700 uppercase text-[11px]">Wykonawcą:</strong><br>
          Nazwa firmy: <strong>${d.contractorName}</strong><br>
          Adres siedziby: ${d.contractorAddress}<br>
          ${d.contractorNip} &bull; ${d.contractorRegon}<br>
          ${d.contractorRep ? `reprezentowanym przez: <strong>${d.contractorRep}</strong><br>` : ''}
          tel.: ${d.contractorPhone} &bull; e-mail: ${d.contractorEmail}
        </div>
        <div class="border-t border-slate-200 pt-2">
          <strong class="text-slate-700 uppercase text-[11px]">a Zamawiającym:</strong><br>
          Imię i nazwisko / nazwa: <strong>${d.clientName}</strong><br>
          Adres: ${d.clientAddress}<br>
          ${d.contractType === 'B2C'
            ? `PESEL: ${d.clientPesel||'................................'} / NIP: –`
            : `NIP: ${d.clientNip||'................................'}`}<br>
          tel.: ${d.clientPhone} &bull; e-mail: ${d.clientEmail}
        </div>
        <p class="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
          zwanymi dalej odpowiednio „Wykonawcą" i „Zamawiającym".
        </p>
      </div>

      <!-- §1 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;1.</span> Przedmiot umowy</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zleca, a Wykonawca przyjmuje do wykonania instalację wodnego ogrzewania podłogowego w budynku położonym pod adresem: <strong>${d.investmentAddress}</strong>.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Przedmiotem umowy jest wykonanie instalacji ogrzewania podłogowego w systemie mokrym, z rurami grzewczymi mocowanymi do izolacji termicznej za pomocą klipsów/takerów, zgodnie z zakresem określonym w niniejszej umowie, ofercie oraz Załączniku Technicznym.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Szczegółowy zakres prac, rodzaj zastosowanych materiałów, średnice rur, rozstaw rur, liczba obiegów, lokalizacja rozdzielaczy oraz pozostałe parametry określa:
        </p>
        <div class="pl-4 text-[11.5px] text-slate-700 space-y-0.5 mb-1">
          <div>a) niniejsza umowa,</div>
          <div>b) oferta Wykonawcy nr <strong>${d.contractNo}</strong>,</div>
          <div>c) Załącznik nr 1 – Specyfikacja Techniczna,</div>
          <div>d) zaakceptowany rysunek/schemat wykonawczy, jeżeli został sporządzony.</div>
        </div>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Dokumenty wymienione w ust. 3 stanowią integralną część umowy. W przypadku rozbieżności pierwszeństwo mają, w kolejności: niniejsza umowa, zaakceptowane pisemne zmiany do umowy, Załącznik Techniczny, oferta, rysunek wykonawczy – z zastrzeżeniem, że w zakresie technicznym rysunek może uszczegóławiać sposób prowadzenia instalacji.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">5.</span>Załącznik nr 1 – Specyfikacja Techniczna stanowi integralną część umowy wyłącznie wtedy, gdy został sporządzony i fizycznie dołączony do niniejszej umowy oraz parafowany przez obie strony. W przypadku niedołączenia Załącznika Technicznego, szczegółowe parametry techniczne instalacji określa wyłącznie treść niniejszej umowy oraz oferta Wykonawcy.
        </p>
      </div>

      <!-- §2 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;2.</span> Zakres prac Wykonawcy</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>W zakresie umowy Wykonawca wykonuje w szczególności:</p>
        <ul class="list-disc list-inside text-[11.5px] text-slate-700 pl-2 space-y-0.5 mb-1">
          <li>przygotowanie i rozplanowanie obiegów ogrzewania podłogowego,</li>
          <li>montaż rur grzewczych na przygotowanej izolacji termicznej,</li>
          <li>wykonanie podejść do rozdzielaczy,</li>
          <li>montaż rozdzielaczy, jeżeli został ujęty w ofercie,</li>
          <li>oznaczenie obiegów,</li>
          <li>wykonanie niezbędnych połączeń instalacyjnych,</li>
          <li>napełnienie i odpowietrzenie wykonanej instalacji,</li>
          <li>wykonanie próby szczelności zgodnie z przyjętą technologią i właściwymi wymaganiami technicznymi,</li>
          <li>sporządzenie protokołu próby szczelności,</li>
          <li>przekazanie Zamawiającemu informacji o wykonanej instalacji.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700 mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Zakres obejmuje wyłącznie prace wskazane w umowie i ofercie. Prace niewymienione nie są objęte wynagrodzeniem ryczałtowym.
        </p>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli oferta nie stanowi inaczej, Wykonawca nie wykonuje:</p>
        <ul class="list-disc list-inside text-[11.5px] text-slate-600 pl-2 space-y-0.5 mb-1">
          <li>izolacji termicznej podłogi ze styropianu,</li>
          <li>wykonania i naprawy podłoża konstrukcyjnego,</li>
          <li>wykonania jastrychu/wylewki,</li>
          <li>wykonania posadzek i warstw wykończeniowych,</li>
          <li>wykonania tynków,</li>
          <li>wykonania instalacji elektrycznej,</li>
          <li>montażu lub uruchomienia pompy ciepła, kotła lub innego źródła ciepła, chyba że zostało to wyraźnie ujęte w ofercie,</li>
          <li>wykonania instalacji elektrycznej sterowania ogrzewaniem,</li>
          <li>wykonania automatyki źródła ciepła,</li>
          <li>wykonania elementów nieujętych w ofercie,</li>
          <li>napraw szkód powstałych wskutek działań innych ekip po zakończeniu prac Wykonawcy.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Montaż siłowników, termostatów, automatyki oraz uruchomienie całego systemu grzewczego stanowi odrębny zakres, jeżeli nie został jednoznacznie wskazany w ofercie.
        </p>
      </div>

      ${pageFooter(1, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 2
    // ─────────────────────────────────────────────
    const page2 = `
    <div class="document-page">
      <div class="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-200 mb-4">
        <span>Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 2 z 4</span>
      </div>

      <!-- §3 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;3.</span> Dokumentacja i sposób zaprojektowania instalacji</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja jest wykonywana:</p>
        <div class="pl-2 text-[11.5px] text-slate-700 space-y-0.5 mb-1">
          <div>&#9744; na podstawie dokumentacji dostarczonej przez Zamawiającego,</div>
          <div>&#9744; na podstawie dokumentacji projektowej sporządzonej przez uprawnionego projektanta,</div>
          <div>&#9746; na podstawie opracowania technicznego / schematu wykonawczego Wykonawcy w zakresie objętym ofertą.</div>
        </div>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Jeżeli Wykonawca nie wykonuje pełnego projektu instalacji, sporządzony przez niego rysunek rozdzielaczy i rozkład rur stanowi dokumentację wykonawczą i nie jest projektem budowlanym w rozumieniu przepisów prawa budowlanego, chyba że strony wyraźnie ustalą inaczej.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>W przypadku wykonywania instalacji na podstawie dokumentacji Zamawiającego lub osoby trzeciej Wykonawca wykonuje roboty zgodnie z przekazaną dokumentacją w zakresie objętym umową. Jeżeli Wykonawca stwierdzi, że dokumentacja, materiał, podłoże lub warunki na budowie mogą uniemożliwić prawidłowe wykonanie instalacji, zobowiązany jest poinformować o tym Zamawiającego przed wykonaniem spornych prac.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Wykonawca nie odpowiada za błędy lub niekompletność dokumentacji dostarczonej przez Zamawiającego lub osobę trzecią, jeżeli po zachowaniu należytej staranności nie było podstaw do ich stwierdzenia.
        </p>
      </div>

      <!-- §4 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;4.</span> Warunki rozpoczęcia prac</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zobowiązuje się zapewnić przed rozpoczęciem prac:</p>
        <ul class="list-disc list-inside text-[11.5px] text-slate-700 pl-2 space-y-0.5 mb-1">
          <li>dostęp do budynku i pomieszczeń, możliwość bezpiecznego prowadzenia robót,</li>
          <li>gotową konstrukcję podłogi zgodną z projektem, prawidłowo wykonane i stabilne podłoże,</li>
          <li>prawidłowo ułożoną izolację termiczną, jeżeli nie jest ona przedmiotem umowy,</li>
          <li>odpowiednią temperaturę wewnątrz budynku, umożliwiającą wykonanie prac,</li>
          <li>dostęp do energii elektrycznej i wody, jeżeli są niezbędne do wykonania prac,</li>
          <li>informacje o przebiegu instalacji i innych elementów znajdujących się w warstwach podłogi.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Izolacja termiczna, na której montowana jest instalacja, musi być ułożona stabilnie, bez miejscowych zapadnięć i bez uszkodzeń uniemożliwiających prawidłowe zamocowanie rur.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca może odmówić rozpoczęcia prac do czasu usunięcia stwierdzonych przeszkód technicznych. Jeżeli usunięcie przeszkód powoduje dodatkowe koszty lub konieczność dodatkowych prac, ich wykonanie wymaga uzgodnienia z Zamawiającym.
        </p>
      </div>

      <!-- §5 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;5.</span> Dylatacje i taśma brzegowa</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Zamawiający zobowiązany jest przed rozpoczęciem montażu przekazać Wykonawcy informację o:</p>
        <ul class="list-disc list-inside text-[11.5px] text-slate-700 pl-2 space-y-0.5 mb-1">
          <li>lokalizacji istniejących dylatacji konstrukcyjnych,</li>
          <li>planowanych dylatacjach jastrychu,</li>
          <li>lokalizacji progów drzwiowych i innych miejsc, w których przewidziano dylatację,</li>
          <li>przebiegu dylatacji wynikającym z dokumentacji budowlanej lub technologii wykonania posadzki.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Obieg grzewczy nie może przechodzić przez dylatację bez zastosowania rozwiązania technicznego przewidzianego dla tego miejsca. W miejscach przejścia przewodu przez dylatację stosuje się rurę ochronną/peszel zgodnie z przyjętym rozwiązaniem wykonawczym.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli Zamawiający lub kierownik budowy nie przekaże Wykonawcy informacji o planowanym przebiegu dylatacji przed rozpoczęciem montażu, Wykonawca może zastosować rozwiązanie przewidziane w Załączniku Technicznym, w szczególności prowadzenie przewodów w rurach ochronnych w miejscach wymagających zabezpieczenia. Wykonawca nie odpowiada za skutki niewłaściwego wykonania dylatacji przez inną ekipę, jeżeli Wykonawca wykonał instalację zgodnie z przekazanymi informacjami.
        </p>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">4.</span>Taśma brzegowa: ${edgeTapeText}</p>
        <p class="text-[11.5px] text-slate-700">
          <span class="text-slate-400 font-semibold select-none mr-1">5.</span>Jeżeli taśma brzegowa lub wykonanie dylatacji nie są objęte zakresem Wykonawcy, odpowiedzialność za ich prawidłowe wykonanie ponosi podmiot, który je wykonuje.
        </p>
      </div>

      <!-- §6 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;6.</span> Zasady wykonania instalacji</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja zostanie wykonana zgodnie z: dokumentacją techniczną, zasadami wiedzy technicznej, wymaganiami technicznymi producentów zastosowanych materiałów, postanowieniami Załącznika Technicznego, normami wskazanymi w §15.</p>
        <p class="text-[11.5px] text-slate-700 mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Rozstaw rur zostanie określony w dokumentacji lub Załączniku Technicznym. Trasa każdego obiegu zostanie wykonana w sposób umożliwiający prawidłową pracę instalacji, odpowietrzenie oraz regulację hydrauliczną. Rury należy prowadzić w sposób ograniczający ryzyko ich uszkodzenia przez kolejne ekipy budowlane.
        </p>
        <p class="text-[11.5px] text-slate-700">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Po wykonaniu instalacji Wykonawca oznacza poszczególne obiegi zgodnie z przyjętym schematem. Położenie rur, rozdzielaczy i innych elementów instalacji może zostać udokumentowane fotografiami wykonanymi przez Wykonawcę. Wykonawca może wykonać dokumentację fotograficzną instalacji jako dokumentację robót zanikających.
        </p>
      </div>

      <!-- §7 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;7.</span> Próba szczelności i przekazanie instalacji</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Przed zakryciem instalacji przez jastrych instalacja zostanie poddana próbie szczelności. Parametry próby wynikają z obowiązujących wymagań technicznych, przyjętej technologii oraz dokumentacji producentów zastosowanych elementów. Próbę należy wykonać z użyciem czynnika oraz przy ciśnieniu odpowiednim dla zastosowanych elementów instalacji. Wynik próby zostanie potwierdzony protokołem.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Do czasu wykonania jastrychu instalacja powinna pozostawać pod nadzorem Zamawiającego lub wykonawcy jastrychu w sposób określony w protokole i dokumentacji technicznej.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Zamawiający przyjmuje do wiadomości, że od chwili zakończenia robót Wykonawcy instalacja może zostać uszkodzona przez: chodzenie po nieosłoniętej instalacji, transport materiałów, kotwienie innych elementów, wiercenie, cięcie, montaż innych instalacji, wykonywanie jastrychu, prace innych ekip.
        </p>
        <p class="text-[11.5px] text-slate-700">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Wykonawca nie odpowiada za uszkodzenia instalacji powstałe po jej odbiorze, jeżeli nie wynikają one z wad wykonawczych istniejących przed odbiorem.
        </p>
      </div>

      ${pageFooter(2, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 3
    // ─────────────────────────────────────────────
    const page3 = `
    <div class="document-page">
      <div class="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-200 mb-4">
        <span>Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 3 z 4</span>
      </div>

      <!-- §8 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;8.</span> Jastrych / wylewka</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonanie jastrychu nie jest przedmiotem umowy, chyba że oferta stanowi inaczej. Za dobór rodzaju jastrychu, jego grubość, klasę, skład, zbrojenie, dylatacje, warunki dojrzewania i wykonanie odpowiada wykonawca jastrychu w zakresie powierzonych mu prac.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca instalacji nie odpowiada za pękanie jastrychu, odspajanie jastrychu, uszkodzenia powierzchni posadzki lub inne skutki nieprawidłowego wykonania jastrychu, jeżeli nie wynikają one z nieprawidłowości instalacji wykonanej przez Wykonawcę.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca jastrychu zobowiązany jest wykonywać swoje prace w sposób niepowodujący uszkodzenia instalacji. Jeżeli podczas wykonywania jastrychu dojdzie do uszkodzenia rury lub elementu instalacji, należy przerwać prace w miejscu uszkodzenia i niezwłocznie poinformować Wykonawcę instalacji.
        </p>
      </div>

      <!-- §9 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;9.</span> Uruchomienie i regulacja instalacji</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonanie instalacji podłogowej nie jest równoznaczne z uruchomieniem całego systemu grzewczego budynku. Uruchomienie źródła ciepła, ustawienie temperatury zasilania, automatyki pogodowej, krzywej grzewczej, bufora, pompy ciepła, kotła lub innych urządzeń nie jest przedmiotem umowy, chyba że oferta stanowi inaczej.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca może dokonać wstępnej regulacji przepływów na rozdzielaczu zgodnie z dokumentacją wykonawczą. Ostateczna regulacja hydrauliczna może wymagać pracy instalacji przy rzeczywistych parametrach źródła ciepła oraz po zakończeniu pozostałych prac budowlanych.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Wykonawca nie gwarantuje osiągnięcia konkretnej temperatury powietrza w pomieszczeniach, jeżeli na jej osiągnięcie wpływają elementy pozostające poza zakresem niniejszej umowy, w szczególności: izolacyjność budynku, straty ciepła, moc źródła ciepła, parametry zasilania, regulacja automatyki, rodzaj i opór cieplny okładziny podłogowej, sposób użytkowania budynku, nieprawidłowe działanie urządzeń innych wykonawców.
        </p>
      </div>

      <!-- §10 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;10.</span> Materiały dostarczone przez Zamawiającego</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Jeżeli materiały dostarcza Zamawiający, ponosi on odpowiedzialność za ich jakość, pochodzenie, właściwości oraz przydatność do zastosowania w instalacji. Wykonawca ma obowiązek poinformować Zamawiającego o stwierdzonych przed rozpoczęciem lub w trakcie robót wadach materiałów, które mogą mieć wpływ na prawidłowe wykonanie instalacji.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku zastosowania materiałów dostarczonych przez Zamawiającego Wykonawca nie ponosi odpowiedzialności za wady wynikające z właściwości tych materiałów, ich niezgodności z wymaganiami technicznymi lub nieprawidłowego przechowywania, jeżeli przyczyna wady leży po stronie tych materiałów.
        </p>
      </div>

      <!-- §11 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;11.</span> Roboty dodatkowe i zmiany</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Robotami dodatkowymi są prace nieobjęte zakresem umowy lub wynikające ze zmiany decyzji Zamawiającego, projektu albo warunków zastanych na budowie. Roboty dodatkowe wymagają uzgodnienia zakresu i wynagrodzenia.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku konieczności wykonania prac dodatkowych z przyczyn technicznych ujawnionych po rozpoczęciu prac Wykonawca informuje Zamawiającego o zakresie tych prac przed ich wykonaniem, o ile pozwalają na to warunki na budowie.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Zmiany przebiegu obiegów, lokalizacji rozdzielaczy, średnic rur, rozstawu lub innych istotnych parametrów po wykonaniu części robót mogą powodować dodatkowe wynagrodzenie.
        </p>
      </div>

      <!-- §12 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;12.</span> Termin wykonania</h2>
        <div class="flex items-start mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1 mt-0.5 text-[11.5px]">1.</span>
          <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11.5px] text-slate-700 grid grid-cols-2 gap-2">
            <div>Planowany termin rozpoczęcia prac: <strong>${startFmt}</strong></div>
            <div>Planowany termin zakończenia prac: <strong>${endFmt}</strong></div>
          </div>
        </div>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Termin może ulec zmianie, jeżeli wystąpią przeszkody niezależne od Wykonawcy, w szczególności: brak przygotowania placu budowy, brak dostępu do obiektu, opóźnienia innych wykonawców, konieczność usunięcia wad podłoża, zmiany dokumentacji, brak materiałów po stronie Zamawiającego, warunki uniemożliwiające bezpieczne wykonanie prac.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Opóźnienie spowodowane koniecznością wykonania prac przez inne ekipy lub brakiem współdziałania Zamawiającego nie stanowi opóźnienia Wykonawcy.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>O każdej zmianie terminu, o której mowa w ust. 3, Wykonawca informuje Zamawiającego niezwłocznie, wskazując przyczynę oraz nowy planowany termin. Termin realizacji ulega przedłużeniu o czas trwania przeszkody, o której mowa w ust. 3, powiększony o czas niezbędny do wznowienia prac.
        </p>
      </div>

      <!-- §13 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;13.</span> Wynagrodzenie i płatności</h2>
        <div class="flex items-start mb-2">
          <span class="text-slate-400 font-semibold select-none mr-1 mt-0.5 text-[11.5px]">1.</span>
          <div class="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-[11.5px] text-slate-800 space-y-1">
            <div>Wynagrodzenie za wykonanie przedmiotu umowy wynosi:
              <strong>${d.priceNetto.toLocaleString('pl-PL')} zł netto</strong>,
              VAT ${vatStr}: <strong>${(brutto - d.priceNetto).toLocaleString('pl-PL')} zł</strong>,
              łącznie: <strong>${brutto.toLocaleString('pl-PL')} zł brutto</strong>
              (słownie: <em>${slownie}</em>).
            </div>
            <div>Wynagrodzenie ma charakter: <strong>&#9746; ryczałtowy</strong> &#9744; kosztorysowy.</div>
          </div>
        </div>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">2.</span><strong>Terminy płatności:</strong></p>
        <div class="pl-4 text-[11.5px] text-slate-700 space-y-0.5 mb-1">
          <div>Zaliczka: <strong>${depositAmtStr}</strong>, płatna do <strong>${depositDateFmt}</strong></div>
          <div>I rata: <strong>${rata1AmtStr}</strong>, płatna <strong>${rata1DateFmt}</strong></div>
          <div>II rata: <strong>${rata2AmtStr}</strong>, płatna <strong>${rata2DateFmt}</strong></div>
          <div class="text-[11px] text-slate-600 mt-1">Nr konta Wykonawcy: <span class="font-mono">${d.contractorBank}</span></div>
        </div>
        <p class="text-[11.5px] text-slate-700 mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Za dzień zapłaty uznaje się dzień uznania rachunku bankowego Wykonawcy. Materiały lub prace dodatkowe niewskazane w ofercie mogą zostać rozliczone odrębnie na podstawie uzgodnienia stron.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>W przypadku opóźnienia Zamawiającego w zapłacie zaliczki, raty lub innej należności przekraczającego 3 dni robocze od terminu płatności, Wykonawcy przysługują odsetki ustawowe za opóźnienie oraz prawo do wstrzymania wykonywania prac do czasu zaksięgowania zaległej wpłaty na rachunku bankowym Wykonawcy. Terminy realizacji, o których mowa w §12, ulegają wówczas przedłużeniu o czas trwania wstrzymania prac.
        </p>
      </div>

      <!-- §14 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;14.</span> Odbiór</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Po zakończeniu prac Wykonawca zgłasza gotowość do odbioru. Odbiór obejmuje w szczególności:</p>
        <ul class="list-disc list-inside text-[11.5px] text-slate-700 pl-2 space-y-0.5 mb-1">
          <li>wizualną ocenę wykonanych prac,</li>
          <li>sprawdzenie zgodności z zakresem umowy,</li>
          <li>weryfikację oznaczenia obiegów,</li>
          <li>potwierdzenie wykonania próby szczelności,</li>
          <li>przekazanie dokumentacji wskazanej w umowie.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Usterki lub uwagi stwierdzone podczas odbioru zostaną wpisane do protokołu wraz z terminem ich usunięcia, jeżeli są zasadne. Usterki niemające wpływu na możliwość bezpiecznego zakrycia instalacji nie stanowią podstawy do odmowy odbioru całego przedmiotu umowy, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa. W przypadku wad uniemożliwiających prawidłowe wykonanie lub zakrycie instalacji odbiór może zostać odroczony do czasu ich usunięcia.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli Zamawiający nie stawi się na odbiór w terminie wyznaczonym przez Wykonawcę, nie krótszym niż 3 dni robocze od dnia wezwania, lub odmawia podpisania protokołu odbioru bez podania uzasadnionych przyczyn technicznych, Wykonawca jest uprawniony do sporządzenia jednostronnego protokołu odbioru. Jednostronny protokół odbioru wywołuje takie same skutki jak protokół podpisany przez obie strony i stanowi podstawę do wystawienia faktury końcowej oraz rozliczenia wynagrodzenia.
        </p>
      </div>

      ${pageFooter(3, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  STRONA 4
    // ─────────────────────────────────────────────
    const page4 = `
    <div class="document-page">
      <div class="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-200 mb-4">
        <span>Umowa nr: <strong>${d.contractNo}</strong></span><span>Strona 4 z 4</span>
      </div>

      <!-- §15 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;15.</span> Normy, przepisy i zasady techniczne</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja wykonywana jest z uwzględnieniem obowiązujących przepisów prawa, zasad wiedzy technicznej oraz – w zakresie przyjętym niniejszą umową – następujących Polskich Norm:</p>
        <ul class="list-disc list-inside text-[11px] text-slate-600 pl-2 space-y-0.5 mb-1">
          <li>PN-EN 1264-1:2021-10 – Wodne wbudowane systemy ogrzewania i chłodzenia płaszczyznowego – Część 1: Definicje i symbole;</li>
          <li>PN-EN 1264-2:2021-10 – Wodne wbudowane systemy ogrzewania i chłodzenia płaszczyznowego – Część 2: metody określania mocy cieplnej;</li>
          <li>PN-EN 1264-3:2021-10 – Wodne wbudowane systemy ogrzewania i chłodzenia płaszczyznowego – Część 3: Wymiarowanie;</li>
          <li>PN-EN 1264-4:2021-10 – Wodne wbudowane systemy ogrzewania i chłodzenia płaszczyznowego – Część 4: Instalowanie;</li>
          <li>PN-EN 14336:2025-11 – Instalacje grzewcze w budynkach – Montaż i przekazanie do eksploatacji wodnych systemów grzewczych i chłodzących;</li>
          <li>PN-EN 12831-1:2017-08 – Charakterystyka energetyczna budynków – Metoda obliczania projektowego obciążenia cieplnego – Część 1, w zakresie dotyczącym określenia obciążenia cieplnego budynku.</li>
        </ul>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>W przypadku zmiany lub zastąpienia powyższych norm zastosowanie ma ich aktualne wydanie, o ile strony nie postanowią inaczej i nie jest to sprzeczne z obowiązującymi przepisami. W odniesieniu do poszczególnych materiałów i elementów instalacji stosuje się również wymagania producentów oraz dokumentację techniczną tych wyrobów.
        </p>
      </div>

      <!-- §16 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;16.</span> Odpowiedzialność Wykonawcy</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wykonawca odpowiada za prawidłowość wykonania prac objętych umową w zakresie wynikającym z niniejszej umowy i obowiązujących przepisów prawa.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Wykonawca nie odpowiada za elementy instalacji lub budynku pozostające poza zakresem jego prac, chyba że strony wyraźnie postanowiły inaczej.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>W szczególności odpowiedzialność Wykonawcy nie obejmuje wad: konstrukcji budynku, izolacji wykonanej przez inną ekipę, jastrychu, posadzki, źródła ciepła, automatyki, instalacji elektrycznych, instalacji innych wykonawców, materiałów dostarczonych przez Zamawiającego, jeżeli wada wynika z właściwości tych materiałów.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>Powyższe ograniczenia nie wyłączają odpowiedzialności Wykonawcy za szkody lub wady powstałe z jego winy w zakresie, w jakim odpowiedzialność taka wynika z bezwzględnie obowiązujących przepisów prawa.
        </p>
      </div>

      <!-- §17 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;17.</span> Gwarancja i odpowiedzialność za wady</h2>
        <div class="flex items-start mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1 mt-0.5 text-[11.5px]">1.</span>
          <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11.5px] text-slate-700">
            Wykonawca udziela na wykonane przez siebie prace gwarancji na okres: <strong>${d.warrantyMonths} miesięcy</strong> od dnia odbioru.
          </div>
        </div>
        <p class="text-[11.5px] text-slate-700 mb-1 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Gwarancja obejmuje w szczególności wady wykonawcze instalacji powstałe z przyczyn leżących po stronie Wykonawcy. Gwarancja nie obejmuje uszkodzeń powstałych wskutek: ingerencji osób trzecich, wiercenia, kotwienia, cięcia lub innych prac w podłodze, uszkodzenia rur przez inne ekipy, niewłaściwego wykonania jastrychu, nieprawidłowej eksploatacji, zamrożenia instalacji, niewłaściwych parametrów pracy źródła ciepła, zastosowania nieprawidłowych materiałów dostarczonych przez Zamawiającego, samowolnych zmian instalacji.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Udzielona gwarancja nie ogranicza uprawnień Zamawiającego wynikających z przepisów prawa, w zakresie, w jakim przepisy te mają zastosowanie. Zgłoszenia wad w ramach gwarancji Zamawiający dokonuje w formie pisemnej, dokumentowej lub elektronicznej (e-mail) na adres wskazany w umowie, z opisem wady i terminem, w którym może być ona zweryfikowana na miejscu. Wykonawca ustosunkuje się do zgłoszenia w terminie 7 dni roboczych i przystąpi do usunięcia uznanej wady w terminie uzgodnionym z Zamawiającym, nie dłuższym niż 30 dni, chyba że charakter wady wymaga terminu dłuższego, o czym Wykonawca poinformuje Zamawiającego.
        </p>
      </div>

      <!-- §18 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;18.</span> Zamrożenie instalacji</h2>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Instalacja wodnego ogrzewania podłogowego nie może zostać narażona na zamarznięcie. Jeżeli instalacja zostanie napełniona wodą przed uruchomieniem źródła ciepła, Zamawiający zobowiązuje się zapewnić temperaturę budynku uniemożliwiającą zamarznięcie instalacji albo uzgodnić z Wykonawcą inne zabezpieczenie. Wykonawca nie odpowiada za szkody wynikające z zamarznięcia instalacji po jej przekazaniu Zamawiającemu.
        </p>
      </div>

      <!-- §19 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;19.</span> Zmiany umowy</h2>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Wszelkie zmiany zakresu, wynagrodzenia lub istotnych warunków umowy wymagają formy dokumentowej lub pisemnej, z zastrzeżeniem przepisów bezwzględnie obowiązujących. Uzgodnienia dokonane pocztą elektroniczną mogą stanowić podstawę wykonania dodatkowych prac, jeżeli pozwalają jednoznacznie ustalić ich zakres i wynagrodzenie.
        </p>
      </div>

      <!-- §20 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;20.</span> Postanowienia dotyczące konsumenta</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Jeżeli Zamawiający jest konsumentem, do umowy stosuje się przepisy dotyczące ochrony konsumentów w zakresie, w jakim mają zastosowanie. Jeżeli umowa została zawarta na odległość lub poza lokalem przedsiębiorstwa, Zamawiającemu przysługują prawa wynikające z ustawy o prawach konsumenta.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Jeżeli umowa została zawarta poza lokalem przedsiębiorstwa Wykonawcy lub na odległość, Zamawiającemu będącemu konsumentem przysługuje prawo odstąpienia od umowy w terminie 14 dni od dnia jej zawarcia, bez podania przyczyny, zgodnie z ustawą z dnia 30 maja 2014 r. o prawach konsumenta, poprzez złożenie Wykonawcy jednoznacznego oświadczenia o odstąpieniu (np. pismem lub pocztą elektroniczną).
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">3.</span>Jeżeli Zamawiający będący konsumentem chce, aby Wykonawca rozpoczął wykonywanie usługi przed upływem terminu do odstąpienia od umowy, o którym mowa w ust. 3, zobowiązany jest złożyć odrębne, wyraźne oświadczenie w tym zakresie. Niezłożenie takiego oświadczenia oznacza, że Wykonawca rozpocznie prace dopiero po upływie terminu do odstąpienia od umowy.
        </p>
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11.5px] text-slate-800 mb-1">
          <p class="font-semibold mb-1">Oświadczenie Zamawiającego (dotyczy wyłącznie konsumentów):</p>
          <p class="italic mb-1">„Żądam rozpoczęcia wykonywania usługi przed upływem terminu do odstąpienia od umowy. Przyjmuję do wiadomości, że w przypadku pełnego wykonania usługi przez Wykonawcę utracę prawo do odstąpienia od umowy."</p>
          <div>${consYes} Zamawiający składa powyższe oświadczenie</div>
          <div>${consNo} Zamawiający nie składa powyższego oświadczenia</div>
        </div>
        <p class="text-[11.5px] text-slate-700">
          <span class="text-slate-400 font-semibold select-none mr-1">4.</span>W przypadku przepisów chroniących konsumenta postanowienia umowy nie mogą ograniczać praw Zamawiającego przyznanych mu bezwzględnie obowiązującymi przepisami.
        </p>
      </div>

      <!-- §21 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;21.</span> Dokumentacja powykonawcza</h2>
        <p class="text-[11.5px] text-slate-700 mb-1"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>Po zakończeniu prac Wykonawca przekazuje – w zakresie określonym ofertą – następującą dokumentację:</p>
        <div class="pl-2 text-[11.5px] text-slate-700 space-y-0.5">
          <div>${cb(d.docProtocol)} protokół próby szczelności,</div>
          <div>${cb(d.docSchema)} schemat instalacji,</div>
          <div>${cb(d.docLoopList)} wykaz obiegów i długości rur,</div>
          <div>${cb(d.docPhotos)} zdjęcia instalacji przed wykonaniem jastrychu,</div>
          <div>${cb(d.docManifoldInfo)} informacje dotyczące rozdzielaczy,</div>
          <div>${cb(d.docManual)} instrukcję użytkowania,</div>
          <div>${cb(false)} inne: ....................................................................................</div>
        </div>
      </div>

      <!-- §22 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;22.</span> Odpowiedzialność za inne roboty budowlane</h2>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Każda ze stron odpowiada za zakres robót, który został jej powierzony. Zamawiający zobowiązuje się poinformować innych wykonawców o przebiegu instalacji ogrzewania podłogowego przed wykonaniem prac mogących ją uszkodzić. Dokumentacja fotograficzna wykonanej instalacji może służyć do ustalenia przebiegu rur i lokalizacji poszczególnych obiegów. Wykonawca nie ponosi odpowiedzialności za uszkodzenie instalacji przez osoby trzecie po jej odbiorze.
        </p>
      </div>

      <!-- §23 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;23.</span> Ochrona danych osobowych (RODO)</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Administratorem danych osobowych Zamawiającego będącego osobą fizyczną jest Wykonawca. Dane osobowe przetwarzane są w celu zawarcia i wykonania niniejszej umowy, dochodzenia ewentualnych roszczeń oraz wypełnienia obowiązków wynikających z przepisów prawa (w tym podatkowych i rachunkowych).
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Podstawę prawną przetwarzania danych osobowych stanowi art. 6 ust. 1 lit. b) i c) Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO). Szczegółowe informacje o przetwarzaniu danych osobowych, w tym o przysługujących Zamawiającemu prawach, zostaną przekazane odrębnie w formie klauzuli informacyjnej stanowiącej załącznik do umowy.
        </p>
      </div>

      <!-- §24 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;24.</span> Zastrzeżenie własności materiałów</h2>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Materiały i urządzenia dostarczone przez Wykonawcę (w tym rury, rozdzielacze, szafki i pozostałe elementy instalacji) pozostają jego własnością aż do uiszczenia przez Zamawiającego całości wynagrodzenia należnego na podstawie niniejszej umowy, zgodnie z art. 589 Kodeksu cywilnego.
        </p>
      </div>

      <!-- §25 -->
      <div class="mb-3">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;25.</span> Siła wyższa</h2>
        <p class="text-[11.5px] text-slate-700 text-justify mb-1">
          <span class="text-slate-400 font-semibold select-none mr-1">1.</span>Żadna ze stron nie ponosi odpowiedzialności za niewykonanie lub nienależyte wykonanie zobowiązań wynikających z umowy, jeżeli jest to spowodowane działaniem siły wyższej, rozumianej jako zdarzenie zewnętrzne, niemożliwe do przewidzenia i zapobieżenia, w szczególności: klęski żywiołowe, stan wyjątkowy lub stan klęski żywiołowej, działania wojenne, akty władzy publicznej uniemożliwiające wykonanie umowy.
        </p>
        <p class="text-[11.5px] text-slate-700 text-justify">
          <span class="text-slate-400 font-semibold select-none mr-1">2.</span>Strona, której dotyczy działanie siły wyższej, zobowiązana jest niezwłocznie poinformować o tym drugą stronę oraz o przewidywanym wpływie tego zdarzenia na wykonanie umowy. Terminy realizacji umowy ulegają przedłużeniu o czas trwania przeszkody spowodowanej siłą wyższą.
        </p>
      </div>

      <!-- §26 -->
      <div class="mb-5">
        <h2 class="font-bold text-[12px] text-slate-900 mb-1"><span class="text-orange-600">&sect;26.</span> Postanowienia końcowe</h2>
        <div class="text-[11.5px] text-slate-700 space-y-1">
          <p class="text-justify"><span class="text-slate-400 font-semibold select-none mr-1">1.</span>W sprawach nieuregulowanych umową stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz przepisy dotyczące procesu budowlanego i ochrony konsumentów, odpowiednio do statusu Zamawiającego i charakteru wykonywanych prac.</p>
          <p class="text-justify"><span class="text-slate-400 font-semibold select-none mr-1">2.</span>Jeżeli którekolwiek z postanowień umowy okaże się nieważne lub bezskuteczne, nie wpływa to na ważność pozostałych postanowień, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa.</p>
          <p><span class="text-slate-400 font-semibold select-none mr-1">3.</span>Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron / zawarto w formie elektronicznej.</p>
          <p><span class="text-slate-400 font-semibold select-none mr-1">4.</span>Integralną część umowy stanowią załączniki wymienione w umowie. Ilekroć w umowie mowa jest o „dniach roboczych”, rozumie się przez to dni od poniedziałku do piątku, z wyłączeniem dni ustawowo wolnych od pracy.</p>
          <p class="text-justify"><span class="text-slate-400 font-semibold select-none mr-1">5.</span>Strony będą dążyć do polubownego rozwiązywania sporów wynikłych z niniejszej umowy. W przypadku braku porozumienia, sądem właściwym do rozstrzygania sporów jest sąd właściwy według przepisów powszechnie obowiązujących, z zastrzeżeniem bezwzględnie obowiązujących przepisów o właściwości sądu w sprawach konsumenckich.</p>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          <strong>Załączniki:</strong>
          ${d.attachProtocol ? ' &#9746; Załącznik nr 1: Protokół Próby Szczelności i Odbioru Końcowego' : ' &#9744; Załącznik nr 1'}
          &bull;
          ${d.attachSpec ? ' &#9746; Załącznik nr 2: Klauzula informacyjna RODO' : ' &#9744; Załącznik nr 2'}
        </p>
      </div>

      <!-- Podpisy -->
      <div class="pt-8 pb-2 border-t-2 border-slate-300 grid grid-cols-2 gap-12 mt-6">
        <div class="text-center">
          <div class="border-b border-dashed border-slate-400 pb-14 mb-2"></div>
          <div class="font-bold text-xs text-slate-900">${d.contractorName}</div>
          <div class="text-[10px] uppercase tracking-wider text-slate-500">WYKONAWCA – podpis i pieczęć</div>
        </div>
        <div class="text-center">
          <div class="border-b border-dashed border-slate-400 pb-14 mb-2"></div>
          <div class="font-bold text-xs text-slate-900">${d.clientName}</div>
          <div class="text-[10px] uppercase tracking-wider text-slate-500">ZAMAWIAJĄCY – podpis</div>
        </div>
      </div>

      ${pageFooter(4, 4)}
    </div>`;

    // ─────────────────────────────────────────────
    //  PROTOKÓŁ (Załącznik nr 1) – bez zmian
    // ─────────────────────────────────────────────
    let protocolHtml = '';
    if (d.attachProtocol) {
      protocolHtml = `
      <div class="document-page">
        ${docHeader('Nowoczesne Systemy Grzewcze &bull; Protokół Techniczny',
          `Załącznik nr 1 do Umowy: <strong>${d.contractNo}</strong>`)}
        <div class="text-center my-4">
          <h2 class="text-sm font-extrabold uppercase tracking-wide text-slate-900">PROTOKÓŁ PRÓBY CIŚNIENIOWEJ I ODBIORU TECHNICZNEGO INSTALACJI</h2>
          <p class="text-[11px] text-slate-500">Sporządzony zgodnie z Polską Normą PN-EN 1264-4 dla systemów ogrzewania płaszczyznowego</p>
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
        <h3 class="font-bold text-xs uppercase text-slate-900 mb-2 flex items-center gap-1"><span class="text-orange-600">&bull;</span> Parametry i Przebieg Próby Szczelności</h3>
        <table class="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden mb-4">
          <thead class="bg-slate-900 text-white text-[11px]">
            <tr><th class="p-2 border border-slate-700">Parametr techniczny</th><th class="p-2 border border-slate-700">Wartość pomiarowa</th><th class="p-2 border border-slate-700">Ocena techniczna</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-[11px]">
            <tr class="bg-white"><td class="p-2 border border-slate-200 font-medium">Medium próbne:</td><td class="p-2 border border-slate-200 font-bold">Sprężone powietrze / Woda</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Zgodne z normą</td></tr>
            <tr class="bg-slate-50"><td class="p-2 border border-slate-200 font-medium">Ciśnienie próby:</td><td class="p-2 border border-slate-200 font-bold">6.0 bar</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Spełnia (min. 1.5x robocze)</td></tr>
            <tr class="bg-white"><td class="p-2 border border-slate-200 font-medium">Czas trwania próby:</td><td class="p-2 border border-slate-200 font-bold">24 h (lub 120 min skrócona)</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Prawidłowy czas</td></tr>
            <tr class="bg-slate-50"><td class="p-2 border border-slate-200 font-medium">Ciśnienie końcowe / Spadek:</td><td class="p-2 border border-slate-200 font-bold">6.0 bar &bull; 0.0 bar</td><td class="p-2 border border-slate-200 text-emerald-700 font-semibold">&#10003; Brak ubytków</td></tr>
            <tr class="bg-orange-50 font-bold"><td class="p-2 border border-orange-200 text-slate-900">WYNIK KOŃCOWY:</td><td class="p-2 border border-orange-200 text-emerald-800 uppercase" colspan="2">POZYTYWNY &bull; INSTALACJA 100% SZCZELNA</td></tr>
          </tbody>
        </table>
        <h3 class="font-bold text-xs uppercase text-slate-900 mb-2 flex items-center gap-1"><span class="text-orange-600">&bull;</span> Weryfikacja Jakościowa Montażu</h3>
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div>&#10003; Rury ułożone bez zagięć i załamań</div>
          <div>&#10003; Taśma brzegowa dylatacyjna kompletna</div>
          <div>&#10003; Rozdzielacz zamocowany i wypoziomowany</div>
          <div>&#10003; Rotametry i zawory odcinające sprawne</div>
          <div>&#10003; Obiegi oznaczone zgodnie ze schematem</div>
          <div>&#10003; Przekazano wytyczne wygrzewania wylewki</div>
        </div>
        <div class="pt-4 pb-2 border-t-2 border-slate-300 grid grid-cols-2 gap-8 my-4">
          <div class="text-center"><div class="border-b border-dashed border-slate-400 pb-10 mb-1.5"></div><div class="font-bold text-xs text-slate-900">Podpis Instalatora (LeSa Home)</div><div class="text-[10px] text-slate-500">Potwierdzam wykonanie próby</div></div>
          <div class="text-center"><div class="border-b border-dashed border-slate-400 pb-10 mb-1.5"></div><div class="font-bold text-xs text-slate-900">Podpis Inwestora / Zamawiającego</div><div class="text-[10px] text-slate-500">Przyjmuję instalację bez zastrzeżeń</div></div>
        </div>
        <div class="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 flex justify-between">
          <span>Załącznik nr 1 &bull; Protokół Odbioru &bull; Umowa nr ${d.contractNo}</span>
          <span>Data próby: ${endFmt}</span>
        </div>
      </div>`;
    }

    container.innerHTML = page1 + page2 + page3 + page4 + protocolHtml;
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
