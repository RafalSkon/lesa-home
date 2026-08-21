/**
 * LeSa - Home: Knowledge Base & Blog Logic
 * Rich articles on underfloor heating, heat pumps, screeds, and zone automation
 */

const Blog = {
  articles: [
    {
      id: 1,
      title: 'Ogrzewanie podłogowe a Pompa Ciepła – dlaczego to idealny duet dla Twojego portfela?',
      slug: 'podlogowka-i-pompa-ciepla-duet-idealny',
      readTime: '5 min czytania',
      category: 'Efektywność & Koszty',
      date: 'Sierpień 2026',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Dowiedz się, dlaczego ogrzewanie podłogowe pozwala pompie ciepła pracować z najwyższym możliwym współczynnikiem COP i jak obniża rachunki za prąd nawet o 30%.',
      content: `
        <h3>Dlaczego tradycyjne grzejniki „męczą” pompę ciepła?</h3>
        <p>Pompy ciepła (zarówno powietrzne, jak i gruntowe) są urządzeniami <strong>niskotemperaturowymi</strong>. Oznacza to, że ich najwyższa sprawność energetyczna (współczynnik COP sięgający 4.5 – 5.2) występuje wtedy, gdy woda w instalacji nie musi być podgrzewana do więcej niż 30–35°C.</p>
        <p>Tradycyjne grzejniki ścienne potrzebują wody o temperaturze 55–65°C, aby skutecznie ogrzać pomieszczenie konwekcją. Wymuszenie na pompie ciepła tak wysokiej temperatury zasilania powoduje drastyczny spadek sprawności i nawet dwukrotnie wyższe rachunki za energię elektryczną!</p>

        <h3>Ogrzewanie podłogowe jako ogromny grzejnik płaszczyznowy</h3>
        <p>Dzięki temu, że ogrzewanie podłogowe oddaje ciepło całą powierzchnią posadzki (zjawisko promieniowania), woda zasilająca 5-warstwowe rury grzewcze z barierą EVOH ma temperaturę zaledwie <strong>28–32°C</strong>. Dla stóp podłoga jest przyjemnie letnia (ok. 23–24°C), a całe pomieszczenie nagrzewa się równomiernie od dołu do góry.</p>

        <div class="p-4 bg-orange-50 rounded-xl border border-orange-200 my-4 text-orange-950">
          <strong>Wskazówka eksperta LeSa - Home:</strong> Każde obniżenie temperatury zasilania instalacji o zaledwie 1°C przekłada się na około <strong>2.5% do 3% niższe zużycie energii elektrycznej</strong> przez pompę ciepła w skali całego sezonu grzewczego!
        </div>

        <h3>Zalety duetu Podłogówka + Pompa Ciepła:</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Najniższy możliwy koszt eksploatacji:</strong> Ogrzanie dobrze zaizolowanego domu 150 m² może zamknąć się w kwocie 1500–2200 zł rocznie.</li>
          <li><strong>Funkcja chłodzenia latem:</strong> Większość nowoczesnych pomp ciepła umożliwia tzw. chłodzenie pasywne lub aktywne przez podłogówkę, obniżając temperaturę w domu o przyjemne 3–5°C bez przeciągów z klimatyzatora.</li>
          <li><strong>Akumulacja ciepła:</strong> Wylewka podłogowa działa jak potężny bufor energii termicznej. Można dogrzewać dom w tańszej taryfie nocnej lub w szczycie produkcji z fotowoltaiki.</li>
        </ul>
      `
    },
    {
      id: 2,
      title: 'Wylewka anhydrytowa czy tradycyjna cementowa pod ogrzewanie podłogowe?',
      slug: 'wylewka-anhydrytowa-czy-cementowa',
      readTime: '6 min czytania',
      category: 'Technologia & Materiały',
      date: 'Sierpień 2026',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Porównanie przewodności cieplnej, grubości warstwy, czasu nagrzewania oraz kosztów wylewki anhydrytowej w zestawieniu z tradycyjnym miksokretem.',
      content: `
        <h3>Serce podłogówki to nie tylko rury, ale i wylewka</h3>
        <p>Nawet najlepsza rura 5-warstwowa z barierą tlenową EVOH nie odda efektywnie ciepła do pomieszczenia, jeśli otaczająca ją warstwa jastrychu będzie miała słabą przewodność cieplną lub pęcherzyki powietrza tworzące izolator. Inwestorzy najczęściej wybierają pomiędzy tradycyjnym jastrychem cementowym (miksokret) a samopoziomującą wylewką anhydrytową na bazie siarczanu wapnia.</p>

        <h3>Porównanie właściwości termicznych:</h3>
        <div class="overflow-x-auto my-4">
          <table class="w-full text-left text-sm border-collapse border border-slate-200">
            <thead class="bg-slate-100 text-slate-900 font-semibold">
              <tr>
                <th class="p-3 border border-slate-200">Cecha</th>
                <th class="p-3 border border-slate-200 text-orange-700">Wylewka Anhydrytowa</th>
                <th class="p-3 border border-slate-200">Jastrych Cementowy</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-200">
                <td class="p-3 font-medium">Przewodność cieplna (λ)</td>
                <td class="p-3 text-orange-700 font-bold">1.8 - 2.0 W/mK</td>
                <td class="p-3">0.9 - 1.2 W/mK</td>
              </tr>
              <tr class="border-b border-slate-200 bg-slate-50/50">
                <td class="p-3 font-medium">Grubość nad rurą</td>
                <td class="p-3 text-orange-700 font-bold">35 - 45 mm (mniej masy)</td>
                <td class="p-3">65 - 80 mm (gruba warstwa)</td>
              </tr>
              <tr class="border-b border-slate-200">
                <td class="p-3 font-medium">Czas reakcji na grzanie</td>
                <td class="p-3 text-orange-700 font-bold">~30 - 45 minut</td>
                <td class="p-3">~2 - 3 godziny</td>
              </tr>
              <tr class="border-b border-slate-200 bg-slate-50/50">
                <td class="p-3 font-medium">Otulenie rur grzewczych (5W EVOH)</td>
                <td class="p-3 text-orange-700 font-bold">100% płynna masa, brak porów</td>
                <td class="p-3">Zależne od zagęszczenia (często pory)</td>
              </tr>
              <tr>
                <td class="p-3 font-medium">Konieczność dylatacji</td>
                <td class="p-3 text-orange-700 font-bold">Do 300 m² bez dylatacji pośrednich</td>
                <td class="p-3">Pola max 30-40 m²</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Podsumowanie i rekomendacja LeSa - Home</h3>
        <p>Choć wylewka anhydrytowa jest nieco droższa na etapie zakupu materiału, to dzięki <strong>dwukrotnie lepszemu przewodnictwu cieplnemu</strong> i możliwości wylania cieńszej warstwy, podłogówka reaguje na zmiany temperatury znacznie szybciej, a pompa ciepła spala mniej energii. W 90% nowoczesnych domów energooszczędnych to obecnie bezkonkurencyjny wybór.</p>
      `
    },
    {
      id: 3,
      title: 'Sterowanie strefowe ogrzewaniem – jak zaoszczędzić kolejne 15% na ogrzewaniu?',
      slug: 'sterowanie-strefowe-automatyka-smart',
      readTime: '4 min czytania',
      category: 'Smart Home & Automatyka',
      date: 'Sierpień 2026',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Dlaczego jeden termostat w korytarzu to za mało? Sprawdź jak siłowniki termoelektryczne i termostaty pokojowe współpracują z rozdzielaczem podłogówki.',
      content: `
        <h3>Problem jednego czujnika temperatury</h3>
        <p>Wielu deweloperów instaluje w domu tylko jeden termostat centralny, zwykle w salonie. Gdy salon nagrzeje się od gotowania lub słońca wpadającego przez okna tarasowe, kocioł lub pompa ciepła wyłącza się, a sypialnie na piętrze pozostają niedogrzane.</p>

        <h3>Jak działa automatyka strefowa od LeSa - Home?</h3>
        <p>Instalujemy system składający się z 3 elementów:</p>
        <ol class="list-decimal pl-5 space-y-2 mb-4">
          <li><strong>Siłowniki termoelektryczne</strong> zamontowane na każdej pętli rozdzielacza.</li>
          <li><strong>Listwa centralna (master)</strong> sterująca pracą pomp i siłowników.</li>
          <li><strong>Bezprzewodowe lub przewodowe termostaty</strong> w każdym pokoju (salon, sypialnia, łazienka, gabinet).</li>
        </ol>

        <p>Dzięki temu możesz ustawić <strong>23°C w łazience</strong>, <strong>21°C w salonie</strong> i <strong>18.5°C w sypialni dla głębszego snu</strong>. Gdy słońce nagrzeje salon, siłownik odcina tylko tę jedną pętlę, a pozostałe pomieszczenia nadal otrzymują dokładnie tyle ciepła, ile potrzebują.</p>
      `
    },
    {
      id: 4,
      title: 'Krok po kroku: Jak wygląda profesjonalny montaż podłogówki w LeSa - Home?',
      slug: 'krok-po-kroku-montaz-podlogowki',
      readTime: '5 min czytania',
      category: 'Standardy & Prace',
      date: 'Sierpień 2026',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Od obliczeń zapotrzebowania cieplnego (OZC), przez laserowe wyznaczenie poziomów, próbę ciśnieniową, aż po protokół odbioru.',
      content: `
        <h3>Bezpieczeństwo na lata – proces bez kompromisów</h3>
        <p>Ogrzewanie podłogowe to instalacja, która po zalaniu posadzką zostaje w Twoim domu na dekady. W <strong>LeSa - Home</strong> stosujemy rygorystyczny 5-etapowy proces montażowy:</p>

        <div class="space-y-4 my-4">
          <div class="p-4 bg-slate-50 border-l-4 border-orange-500 rounded-r-xl">
            <h4 class="font-bold text-slate-900">Krok 1: Projekt i bilans zapotrzebowania cieplnego</h4>
            <p class="text-sm text-slate-600">Nie układamy rur „na oko”. Dobieramy rozstaw pętli (10cm, 15cm lub 20cm) na podstawie strat ciepła i planowanego wykończenia podłogi (drewno, winyl, płytki).</p>
          </div>
          <div class="p-4 bg-slate-50 border-l-4 border-orange-500 rounded-r-xl">
            <h4 class="font-bold text-slate-900">Krok 2: Przygotowanie podłoża i izolacja termiczna</h4>
            <p class="text-sm text-slate-600">Układamy styropian EPS 100/150 na mijankę, taśmę brzegową z dylatacją obwodową oraz folię z rastrem kotwiczącym.</p>
          </div>
          <div class="p-4 bg-slate-50 border-l-4 border-orange-500 rounded-r-xl">
            <h4 class="font-bold text-slate-900">Krok 3: Montaż rur 5-warstwowych EVOH w jednym odcinku</h4>
            <p class="text-sm text-slate-600">Każda pętla jest wykonana z jednego, nielączonego w posadzce odcinka certyfikowanej rury 5-warstwowej ze specjalną barierą tlenową EVOH chroniącą instalację przed zapowietrzaniem i korozją.</p>
          </div>
          <div class="p-4 bg-slate-50 border-l-4 border-orange-500 rounded-r-xl">
            <h4 class="font-bold text-slate-900">Krok 4: 24-godzinna próba ciśnieniowa na 6 bar</h4>
            <p class="text-sm text-slate-600">Instalacja jest napełniana wodą lub sprężonym powietrzem pod ciśnieniem 6 bar. Wylewka jest wykonywana ZAWSZE przy instalacji pozostającej pod ciśnieniem!</p>
          </div>
          <div class="p-4 bg-slate-50 border-l-4 border-orange-500 rounded-r-xl">
            <h4 class="font-bold text-slate-900">Krok 5: Protokół odbioru i 10 lat gwarancji</h4>
            <p class="text-sm text-slate-600">Przekazujemy pełną dokumentację fotograficzną przed zalaniem, schemat obiegów oraz pisemną 10-letnią gwarancję.</p>
          </div>
        </div>
      `
    }
  ],

  init() {
    this.container = document.getElementById('blog-grid');
    this.modal = document.getElementById('blog-modal');
    this.modalBody = document.getElementById('blog-modal-body');
    this.modalClose = document.getElementById('blog-modal-close');

    if (!this.container) return;

    this.render();
    this.bindEvents();
  },

  bindEvents() {
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

  render() {
    this.container.innerHTML = '';

    this.articles.forEach(article => {
      const card = document.createElement('article');
      card.className = 'bg-white rounded-2xl overflow-hidden border border-slate-200 card-hover shadow-sm flex flex-col justify-between group cursor-pointer';
      card.innerHTML = `
        <div>
          <div class="relative h-48 overflow-hidden bg-slate-100">
            <img src="${article.image}" alt="${article.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
            <span class="absolute top-3 left-3 bg-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${article.category}
            </span>
            <span class="absolute bottom-3 left-3 text-white text-xs flex items-center gap-1 font-medium">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ${article.readTime}
            </span>
          </div>
          <div class="p-6">
            <h3 class="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-orange-600 transition-colors line-clamp-2">
              ${article.title}
            </h3>
            <p class="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
              ${article.excerpt}
            </p>
          </div>
        </div>
        <div class="px-6 pb-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>${article.date}</span>
          <span class="text-orange-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Czytaj artykuł
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openModal(article.id);
      });

      this.container.appendChild(card);
    });
  },

  openModal(id) {
    const article = this.articles.find(a => a.id === id);
    if (!article || !this.modal || !this.modalBody) return;

    this.modalBody.innerHTML = `
      <div class="mb-4">
        <span class="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
          ${article.category} • ${article.readTime}
        </span>
        <h2 class="text-2xl md:text-3xl font-bold font-heading text-slate-900 mb-3">${article.title}</h2>
        <p class="text-xs text-slate-500">Opublikowano przez: Eksperci LeSa - Home • ${article.date}</p>
      </div>

      <div class="relative h-60 md:h-72 w-full overflow-hidden rounded-2xl mb-6">
        <img src="${article.image}" alt="${article.title}" class="w-full h-full object-cover" />
      </div>

      <div class="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm md:text-base space-y-4">
        ${article.content}
      </div>

      <div class="mt-8 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 class="font-bold text-slate-900 text-base">Masz pytania dotyczące tej technologii?</h4>
          <p class="text-xs text-slate-600">Skontaktuj się z naszym inżynierem i dobierz bezpłatnie rozwiązanie dla swojego budynku.</p>
        </div>
        <a href="#kontakt" class="modal-article-cta px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shrink-0 shadow-md transition-all">
          Zapytaj eksperta
        </a>
      </div>
    `;

    const cta = this.modalBody.querySelector('.modal-article-cta');
    if (cta) {
      cta.addEventListener('click', () => this.closeModal());
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
  Blog.init();
});
