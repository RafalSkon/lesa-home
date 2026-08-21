/**
 * LeSa - Home: Smart Underfloor Heating Calculator
 * Dynamic calculation of estimated installation costs, materials, and time
 */

const Calculator = {
  // Base rates in PLN per m2
  rates: {
    baseInstallation: 95, // System tacker + rura 5-warstwowa z barierą tlenową EVOH 16x2 + rozdzielacz
    buildingType: {
      new: 0,        // Standardowy nowy budynek
      renovation: 35 // Frezowanie w wylewce / system suchy lekki
    },
    screed: {
      anhydrite: 45, // Wylewka anhydrytowa samopoziomująca
      cement: 32,    // Tradycyjny miksokret cementowy
      none: 0        // Klient zamawia tylko montaż rur bez wylewki
    },
    control: {
      smart: 28,     // Automatyka strefowa (termostaty bezprzewodowe w każdym pokoju + listwa)
      manual: 0      // Sterowanie ręczne na rotametrach rozdzielacza
    },
    sourcePrep: {
      heat_pump: 15, // Pętla o zagęszczonym rozstawie 10cm pod zasilanie niskotemperaturowe pompy
      boiler: 0      // Standardowy rozstaw 15cm
    }
  },

  init() {
    this.areaSlider = document.getElementById('calc-area-slider');
    this.areaValueDisplay = document.getElementById('calc-area-value');
    this.buildingTypeInputs = document.querySelectorAll('input[name="building-type"]');
    this.screedInputs = document.querySelectorAll('input[name="screed-type"]');
    this.controlInputs = document.querySelectorAll('input[name="control-type"]');
    this.sourceInputs = document.querySelectorAll('input[name="heat-source"]');
    
    this.resultMin = document.getElementById('calc-price-min');
    this.resultMax = document.getElementById('calc-price-max');
    this.resultM2 = document.getElementById('calc-price-m2');
    this.resultTime = document.getElementById('calc-estimated-time');
    this.resultLoops = document.getElementById('calc-estimated-loops');
    this.resultPipes = document.getElementById('calc-estimated-pipes');
    this.transferBtn = document.getElementById('calc-transfer-btn');

    if (!this.areaSlider) return;

    this.bindEvents();
    this.calculate();
  },

  bindEvents() {
    this.areaSlider.addEventListener('input', () => {
      this.areaValueDisplay.textContent = `${this.areaSlider.value} m²`;
      this.calculate();
    });

    const allRadios = [
      ...this.buildingTypeInputs,
      ...this.screedInputs,
      ...this.controlInputs,
      ...this.sourceInputs
    ];

    allRadios.forEach(radio => {
      radio.addEventListener('change', () => this.calculate());
    });

    if (this.transferBtn) {
      this.transferBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.transferToContactForm();
      });
    }
  },

  getSelectedValue(nodeList, fallback) {
    for (const el of nodeList) {
      if (el.checked) return el.value;
    }
    return fallback;
  },

  calculate() {
    const area = parseInt(this.areaSlider.value, 10) || 120;
    const buildingType = this.getSelectedValue(this.buildingTypeInputs, 'new');
    const screed = this.getSelectedValue(this.screedInputs, 'anhydrite');
    const control = this.getSelectedValue(this.controlInputs, 'smart');
    const source = this.getSelectedValue(this.sourceInputs, 'heat_pump');

    // Calculate rate per m2
    let pricePerM2 = this.rates.baseInstallation;
    pricePerM2 += this.rates.buildingType[buildingType] || 0;
    pricePerM2 += this.rates.screed[screed] || 0;
    pricePerM2 += this.rates.control[control] || 0;
    pricePerM2 += this.rates.sourcePrep[source] || 0;

    const totalCalculated = area * pricePerM2;
    // Provide a realistic realistic +/- 8% estimate buffer
    const minTotal = Math.round((totalCalculated * 0.94) / 100) * 100;
    const maxTotal = Math.round((totalCalculated * 1.06) / 100) * 100;

    // Technical estimations
    // Average loop is ~80m of pipe covering ~10-12m2
    const loopsCount = Math.ceil(area / 11);
    const pipeMeters = Math.round(area * (source === 'heat_pump' ? 8.5 : 7.2));
    
    // Time estimation
    let days = '1 dzień';
    if (area > 130 && area <= 220) days = '2 dni';
    else if (area > 220) days = '2-3 dni';

    // Update UI
    if (this.resultMin) this.resultMin.textContent = `${minTotal.toLocaleString('pl-PL')} zł`;
    if (this.resultMax) this.resultMax.textContent = `${maxTotal.toLocaleString('pl-PL')} zł`;
    if (this.resultM2) this.resultM2.textContent = `~${pricePerM2} zł/m²`;
    if (this.resultTime) this.resultTime.textContent = days;
    if (this.resultLoops) this.resultLoops.textContent = `${loopsCount} sekcji`;
    if (this.resultPipes) this.resultPipes.textContent = `~${pipeMeters} mb rury`;
  },

  transferToContactForm() {
    const area = this.areaSlider.value;
    const buildingType = this.getSelectedValue(this.buildingTypeInputs, 'new') === 'new' ? 'Nowy budynek' : 'Modernizacja';
    const screed = this.getSelectedValue(this.screedInputs, 'anhydrite') === 'anhydrite' ? 'Wylewka anhydrytowa' : 'Cementowa / brak';
    const control = this.getSelectedValue(this.controlInputs, 'smart') === 'smart' ? 'Sterowanie strefowe Smart' : 'Standardowe';
    const source = this.getSelectedValue(this.sourceInputs, 'heat_pump') === 'heat_pump' ? 'Pod pompę ciepła' : 'Inne';

    const areaInput = document.getElementById('contact-area');
    const msgInput = document.getElementById('contact-message');

    if (areaInput) {
      areaInput.value = area;
    }

    if (msgInput) {
      msgInput.value = `Dzień dobry, proszę o dokładną wycenę i bezpłatny audyt. Moje parametry z kalkulatora:
- Powierzchnia: ${area} m²
- Typ inwestycji: ${buildingType}
- Wylewka: ${screed}
- Automatyka: ${control}
- Źródło ciepła: ${source}`;
    }

    // Scroll smoothly to contact section
    const contactSection = document.getElementById('kontakt');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Calculator.init();
});
