/**
 * LeSa - Home: Portfolio & Realizations Logic
 * Interactive gallery, category filtering, and detailed project view modal
 */

const Portfolio = {
  projects: [
    {
      id: 1,
      category: 'new-build',
      title: 'Nowoczesny Dom Parterowy pod Krakowem',
      subtitle: 'Kompleksowa podłogówka 165 m² + Wylewka Anhydrytowa',
      tag: 'Dom Jednorodzinny',
      area: '165 m²',
      duration: '2 dni montażu',
      heatSource: 'Pompa ciepła powietrze-woda',
      loops: '14 sekcji (2 rozdzielacze)',
      pipe: 'Rura 5-warstwowa z barierą tlenową EVOH 16x2.0',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
      description: `W tej realizacji wykonaliśmy kompleksowy montaż ogrzewania podłogowego w parterowym domu energooszczędnym. Klientowi zależało na idealnym dopasowaniu parametrów do niskotemperaturowej pompy ciepła.

Zastosowaliśmy zagęszczony rozstaw rur 10 cm przy dużych przeszkleniach tarasowych oraz 15 cm w pozostałych strefach dziennych i sypialniach. Całość zalana wylewką anhydrytową o grubości 45 mm, co gwarantuje błyskawiczny czas reakcji podłogówki (ponad 2-krotnie szybszy niż tradycyjny beton). Przed zalaniem wykonano 24-godzinną próbę ciśnieniową 6 bar.`,
      highlights: [
        'Rury 5-warstwowe z barierą antydyfuzyjną EVOH',
        'Zagęszczone pętle przy oknach HS',
        'Wylewka anhydrytowa samopoziomująca',
        'Rozdzielacze ze stali szlachetnej z rotametrami',
        'Przygotowanie pod bezprzewodowe siłowniki termoelektryczne'
      ]
    },
    {
      id: 2,
      category: 'heat-pump',
      title: 'Rezydencja z Pompą Ciepła i Smart Automatyką',
      subtitle: 'Dwu-kondygnacyjny system 240 m² z kontrolą strefową',
      tag: 'Pompa Ciepła + Smart',
      area: '240 m²',
      duration: '3 dni robocze',
      heatSource: 'Gruntowa pompa ciepła + Rekuperacja',
      loops: '21 sekcji (góra + dół)',
      pipe: 'Rura 5-warstwowa z barierą antydyfuzyjną EVOH 16x2.0',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
      description: `Zaawansowany projekt dla inwestora oczekującego pełnej kontroli temperatury w każdym z 9 oddzielnych pomieszczeń. 

Zaprojektowaliśmy układ hydrauliczny z dwoma szafkami rozdzielaczowymi (parter i piętro). Każda pętla została wyposażona w precyzyjne siłowniki termoelektryczne sparowane ze ściennymi termostatami dotykowymi zintegrowanymi z aplikacją mobilną. System pozwala na obniżanie temperatury w nieużywanych pokojach, generując dodatkowe 18% oszczędności rocznie.`,
      highlights: [
        'Rury 5-warstwowe z barierą tlenową EVOH',
        '9 niezależnych stref temperaturowych',
        'Pełna integracja ze smartfonem i pompą ciepła',
        'Brak jakichkolwiek widocznych grzejników',
        'Idealna współpraca z posadzką z mikrocementu i parkietu'
      ]
    },
    {
      id: 3,
      category: 'renovation',
      title: 'Modernizacja Kamienicy - System Suchy Lekki',
      subtitle: 'Ogrzewanie podłogowe na stropie drewnianym 85 m²',
      tag: 'Modernizacja',
      area: '85 m²',
      duration: '2 dni',
      heatSource: 'Kocioł kondensacyjny z buforem',
      loops: '8 sekcji',
      pipe: 'Rura 5-warstwowa EVOH 16 mm w płytach z folią aluminiową',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      description: `Inwestycja wymagająca specjalistycznego podejścia inżynieryjnego. Ze względu na drewniane stropy i ograniczenia nośności nie było możliwości wykonania ciężkiej wylewki betonowej.

Zastosowaliśmy nowoczesny system suchy (płyty EPS z wyprofilowanymi rowkami i panelami transmisyjnymi z aluminium o wysokiej przewodności cieplnej). Waga całego systemu to zaledwie ~6 kg/m² zamiast ~110 kg/m² przy tradycyjnym jastrychu! Całość przykryta suchym jastrychem gipsowo-włóknowym pod panele winylowe.`,
      highlights: [
        'Brak obciążenia dla konstrukcji stropu drewnianego',
        'Czysty montaż bez wody i długiego czasu schnięcia',
        'Gotowość do montażu podłogi w 24 godziny',
        'Aluminiowe radiatory dla równomiernego grzania'
      ]
    },
    {
      id: 4,
      category: 'anhydrite',
      title: 'Segment Bliźniaczy w Stanie Deweloperskim',
      subtitle: 'Podłogówka 120 m² z idealnie gładkim jastrychem',
      tag: 'Wylewka Anhydrytowa',
      area: '120 m²',
      duration: '1 dzień montaż + wylewka',
      heatSource: 'Kocioł gazowy dwufunkcyjny',
      loops: '11 sekcji',
      pipe: 'Rura 5-warstwowa z barierą tlenową EVOH 16 mm',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
      description: `Ekspresowa i precyzyjna realizacja dla młodej rodziny. W ciągu jednego dnia rozłożyliśmy izolację termiczną, folię z rastrem, spięliśmy 11 obiegów grzewczych i podłączyliśmy rozdzielacz z szafką podtynkową.

Kolejnego dnia wykonano wylewkę anhydrytową Knauf, która osiągnęła gotowość do chodzenia już po 48 godzinach. Dzięki idealnemu otuleniu rur bez pęcherzyków powietrza przewodnictwo cieplne λ wynosi aż 1,8 W/mK.`,
      highlights: [
        'Ekspresowy czas realizacji',
        'Perfekcyjny poziom pod duże płytki wielkoformatowe',
        'Pomiary kamerą termowizyjną po wygrzaniu posadzki',
        'Protokół szczelności przekazany inwestorowi'
      ]
    },
    {
      id: 5,
      category: 'heat-pump',
      title: 'Dom w Stylu Nowoczesnej Stodoły',
      subtitle: 'Wysokie sufity 5m, podłogówka 180 m² ze sterowaniem pogodowym',
      tag: 'Pompa Ciepła',
      area: '180 m²',
      duration: '2 dni',
      heatSource: 'Pompa ciepła Split 8kW',
      loops: '16 sekcji',
      pipe: 'Rura 5-warstwowa z barierą tlenową EVOH 16x2.0',
      image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80',
      description: `W budynkach z antresolą i wysokim salonem (tzw. nowoczesna stodoła) tradycyjne grzejniki powodują, że całe ciepłe powietrze ucieka pod kalenicę. Ogrzewanie podłogowe od LeSa - Home idealnie rozwiązało ten problem!

Ciepło promieniuje od podłogi do wysokości 2 metrów, zapewniając domownikom komfort termiczny przy temperaturze wody zasilającej zaledwie 28-32°C. Dodatkowo w salonie zamontowano bezprzewodowy czujnik nasłonecznienia, który dynamicznie reaguje na zyski słoneczne z przeszkleń.`,
      highlights: [
        'Eliminacja strat ciepła pod wysokim dachem',
        'Zintegrowana krzywa grzewcza pompy ciepła',
        'Wyciszone podejścia do rozdzielaczy',
        '10 lat gwarancji na całą instalację podposadzkową'
      ]
    },
    {
      id: 6,
      category: 'new-build',
      title: 'Parterowy Dom z Garażem i Warsztatem',
      subtitle: 'Odrębne strefy temperaturowe w części mieszkalnej i gospodarczej',
      tag: 'Dom Jednorodzinny',
      area: '150 m²',
      duration: '2 dni',
      heatSource: 'Kocioł na pellet z buforem',
      loops: '13 sekcji',
      pipe: 'Rura 5-warstwowa z barierą tlenową EVOH 16 mm',
      image: 'https://images.unsplash.com/photo-16005851554526-990dced4db0d?auto=format&fit=crop&w=900&q=80',
      description: `Projekt uwzględniający zróżnicowane zapotrzebowanie cieplne poszczególnych części domu. W strefie mieszkalnej zaprojektowano temperaturę bazową 22°C, w sypialniach 19.5°C, a w garażu i kotłowni podtrzymanie 12°C.

Zastosowaliśmy zawory termostatyczne z bezpośrednim nastawem przepływów na rotametrach, co umożliwia bezproblemową pracę bez konieczności ciągłej regulacji. Inwestor otrzymał pełną dokumentację fotograficzną ułożenia pętli przed zalaniem.`,
      highlights: [
        'Zróżnicowane strefy temperaturowe',
        'Precyzyjne wyważenie hydrauliczne układu',
        'Zabezpieczenie przed zamarzaniem w garażu',
        'Dokumentacja fotograficzna z metrykami pętli'
      ]
    }
  ],

  init() {
    this.container = document.getElementById('portfolio-grid');
    this.filterButtons = document.querySelectorAll('.portfolio-filter-btn');
    this.modal = document.getElementById('portfolio-modal');
    this.modalBody = document.getElementById('portfolio-modal-body');
    this.modalClose = document.getElementById('portfolio-modal-close');

    if (!this.container) return;

    this.render(this.projects);
    this.bindEvents();
  },

  bindEvents() {
    // Filter click handler
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = btn.getAttribute('data-filter');
        
        // Update active class
        this.filterButtons.forEach(b => {
          b.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
          b.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
        });
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
        btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');

        // Filter projects
        if (filter === 'all') {
          this.render(this.projects);
        } else {
          const filtered = this.projects.filter(p => p.category === filter);
          this.render(filtered);
        }
      });
    });

    // Close modal handlers
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('open')) {
        this.closeModal();
      }
    });
  },

  render(items) {
    this.container.innerHTML = '';
    
    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-500">
          Brak realizacji w wybranej kategorii.
        </div>
      `;
      return;
    }

    items.forEach(project => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl overflow-hidden border border-slate-200 card-hover shadow-sm flex flex-col group';
      card.innerHTML = `
        <div class="relative overflow-hidden h-56 bg-slate-100 cursor-pointer" data-project-id="${project.id}">
          <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
          <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-orange-600 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            ${project.tag}
          </span>
          <span class="absolute bottom-3 left-3 text-white font-semibold text-sm flex items-center gap-1.5">
            <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            ${project.area}
          </span>
          <span class="absolute bottom-3 right-3 text-white text-xs bg-slate-900/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            ${project.duration}
          </span>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors cursor-pointer" data-project-id="${project.id}">
              ${project.title}
            </h3>
            <p class="text-slate-600 text-sm mb-4 line-clamp-2">
              ${project.subtitle}
            </p>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 py-3 border-t border-b border-slate-100 mb-4">
              <div>
                <span class="block text-slate-400 font-medium">Źródło ciepła:</span>
                <span class="font-semibold text-slate-700 truncate block">${project.heatSource}</span>
              </div>
              <div>
                <span class="block text-slate-400 font-medium">Liczba pętli:</span>
                <span class="font-semibold text-slate-700 block">${project.loops}</span>
              </div>
            </div>
          </div>
          <button class="w-full py-2.5 px-4 bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-800 font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 group-hover:bg-orange-600 group-hover:text-white" data-project-id="${project.id}">
            <span>Zobacz szczegóły realizacji</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      `;

      // Attach click events
      const clickableEls = card.querySelectorAll('[data-project-id]');
      clickableEls.forEach(el => {
        el.addEventListener('click', () => {
          this.openModal(project.id);
        });
      });

      this.container.appendChild(card);
    });
  },

  openModal(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project || !this.modal || !this.modalBody) return;

    this.modalBody.innerHTML = `
      <div class="relative h-64 md:h-80 w-full overflow-hidden rounded-2xl mb-6 bg-slate-900">
        <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <span class="inline-block bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            ${project.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-bold font-heading text-white">${project.title}</h2>
          <p class="text-slate-200 text-sm md:text-base mt-1">${project.subtitle}</p>
        </div>
      </div>

      <!-- Technical specifications Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-orange-50/70 border border-orange-100 rounded-2xl mb-6">
        <div>
          <span class="text-xs text-orange-900/60 uppercase font-semibold block">Powierzchnia</span>
          <span class="text-base font-bold text-orange-950">${project.area}</span>
        </div>
        <div>
          <span class="text-xs text-orange-900/60 uppercase font-semibold block">Czas montażu</span>
          <span class="text-base font-bold text-orange-950">${project.duration}</span>
        </div>
        <div>
          <span class="text-xs text-orange-900/60 uppercase font-semibold block">Liczba obiegów</span>
          <span class="text-base font-bold text-orange-950">${project.loops}</span>
        </div>
        <div>
          <span class="text-xs text-orange-900/60 uppercase font-semibold block">Gwarancja</span>
          <span class="text-base font-bold text-orange-950">10 Lat</span>
        </div>
      </div>

      <div class="space-y-4 mb-6 text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
        ${project.description}
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Kluczowe parametry techniczne tej realizacji:
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${project.highlights.map(h => `
            <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800">
              <span class="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
              <span>${h}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-xs text-slate-500 text-center sm:text-left">
          Planujesz podobny budynek? Wykonamy dla Ciebie bezpłatny audyt i bilans cieplny.
        </div>
        <a href="#kontakt" class="modal-cta-btn w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-orange-600/30 transition-all">
          Zapytaj o wycenę dla mojego domu
        </a>
      </div>
    `;

    // Modal CTA listener to close modal and scroll to contact
    const ctaBtn = this.modalBody.querySelector('.modal-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    this.modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Portfolio.init();
});
