/**
 * app.js — SE.AR.L. S.R.L.S
 * Roma — Costruzioni e Ristrutturazioni
 */

/* ============================================================
   0. COMPONENTI CONDIVISI
   NOTA: fetch() richiede un server HTTP.
   In locale: python3 -m http.server 8080
   Online: GitHub Pages / Netlify funzionano senza problemi.
   ============================================================ */
async function caricaComponenti() {
  await Promise.all([
    caricaComponente('navbar-placeholder', 'components/navbar.html'),
    caricaComponente('footer-placeholder', 'components/footer.html'),
  ]);
}

async function caricaComponente(placeholderId, percorso) {
  const el = document.getElementById(placeholderId);
  if (!el) return;
  try {
    const res = await fetch(percorso);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(`Errore componente "${percorso}":`, err);
  }
}

/* ============================================================
   1. HAMBURGER MENU
   ============================================================ */
function initMobileMenu() {
  const btn      = document.getElementById('menu-toggle');
  const menu     = document.getElementById('mobile-menu');
  const iconOpen  = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.contains('menu-open');
    if (isOpen) {
      menu.classList.remove('menu-open');
      menu.style.maxHeight = '0';
      menu.style.opacity   = '0';
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    } else {
      menu.classList.add('menu-open');
      menu.style.maxHeight = '500px';
      menu.style.opacity   = '1';
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
    }
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('menu-open');
      menu.style.maxHeight = '0';
      menu.style.opacity   = '0';
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    });
  });
}

/* ============================================================
   2. NAVBAR SCROLL
   ============================================================ */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar-scrolled', window.scrollY > 30);
  }, { passive: true });
}

/* ============================================================
   3. ACTIVE NAV LINK
   ============================================================ */
function initActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('nav-link-active');
    }
  });
}

/* ============================================================
   4. ANNO FOOTER
   ============================================================ */
function initAnnoFooter() {
  document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* ============================================================
   5. SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

/* ============================================================
   6. CREA CARD PROGETTO
   ============================================================ */
function creaCard(lavoro, index) {
  const card = document.createElement('article');
  card.className = 'gallery-card';
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  card.style.transitionDelay = `${index * 80}ms`;

  const isInternal = lavoro.link_progetto && !lavoro.link_progetto.startsWith('http');
  const isExternal = lavoro.link_progetto && lavoro.link_progetto.startsWith('http');
  const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
  const label  = isInternal ? 'Vedi il cantiere' : (isExternal ? 'Vedi progetto' : '');

  card.innerHTML = `
    <div class="card-image-wrap">
      <img src="${lavoro.immagine_url}" alt="${lavoro.titolo}" loading="lazy" class="card-image" />
      <span class="card-badge">${lavoro.categoria}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${lavoro.titolo}</h3>
      <p class="card-desc">${lavoro.descrizione_breve}</p>
      ${lavoro.link_progetto
        ? `<a href="${lavoro.link_progetto}" ${target} class="card-link">
             ${label}
             <svg class="card-link-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
             </svg>
           </a>`
        : `<span class="card-link-disabled">Lavoro in portfolio</span>`
      }
    </div>
  `;

  // Animazione entrata via IntersectionObserver
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      }, index * 80);
      obs.unobserve(card);
    }
  }, { threshold: 0.1 });
  obs.observe(card);

  return card;
}

/* ============================================================
   7. GALLERIA DINAMICA
   ============================================================ */
async function caricaGalleria() {
  const grid   = document.getElementById('galleria-grid');
  const loader = document.getElementById('galleria-loader');
  const errore = document.getElementById('galleria-errore');
  if (!grid) return;

  try {
    const res    = await fetch('js/lavori.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lavori = await res.json();
    if (loader) loader.style.display = 'none';
    lavori.forEach((l, i) => grid.appendChild(creaCard(l, i)));
  } catch (err) {
    console.error('Errore galleria:', err);
    if (loader) loader.style.display = 'none';
    if (errore) errore.style.display = 'block';
  }
}

/* ============================================================
   8. ANTEPRIMA HOME (ultimi 3)
   ============================================================ */
async function caricaAnteprimaHome() {
  const grid = document.getElementById('home-lavori-grid');
  if (!grid) return;
  try {
    const res    = await fetch('js/lavori.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lavori = await res.json();
    lavori.slice(0, 3).forEach((l, i) => grid.appendChild(creaCard(l, i)));
  } catch (err) {
    console.error('Errore anteprima home:', err);
  }
}

/* ============================================================
   9. FILTRI GALLERIA
   ============================================================ */
function initFiltriGalleria() {
  const filtriEl  = document.getElementById('filtri-galleria');
  const grid      = document.getElementById('galleria-grid');
  const countEl   = document.getElementById('risultati-count');
  if (!filtriEl || !grid) return;

  let cards = [];
  const obs = new MutationObserver(() => {
    cards = [...grid.querySelectorAll('.gallery-card')];
    if (cards.length) { aggiornaCount(cards.length, 'tutti'); obs.disconnect(); }
  });
  obs.observe(grid, { childList: true });

  filtriEl.addEventListener('click', e => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    filtriEl.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const cat = pill.dataset.categoria;
    let n = 0;
    cards.forEach(card => {
      const badge = card.querySelector('.card-badge')?.textContent.trim();
      const show  = cat === 'tutti' || badge === cat;
      card.style.display = show ? '' : 'none';
      if (show) n++;
    });
    aggiornaCount(n, cat);
  });

  function aggiornaCount(n, cat) {
    if (!countEl) return;
    const label = cat === 'tutti' ? 'lavori nel portfolio' : 'lavori trovati';
    countEl.textContent = `${n} ${label}`;
    countEl.classList.remove('hidden');
  }
}

/* ============================================================
   10. FORM CONTATTI
   ============================================================ */
function initFormContatti() {
  const form = document.getElementById('form-contatti');
  if (!form) return;

  form.addEventListener('submit', e => {
    // Rimuovi e.preventDefault() quando colleghi Formspree / Web3Forms
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const btn      = document.getElementById('btn-submit');
    const feedback = document.getElementById('form-feedback');

    btn.textContent = 'Invio in corso…';
    btn.disabled    = true;

    setTimeout(() => {
      btn.textContent = 'Richiesta inviata ✓';
      btn.classList.add('btn-success');
      if (feedback) { feedback.textContent = 'Grazie! La contatteremo entro 24 ore lavorative.'; feedback.classList.remove('hidden'); }
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Invia Richiesta';
        btn.disabled    = false;
        btn.classList.remove('btn-success');
        if (feedback) feedback.classList.add('hidden');
      }, 6000);
    }, 1200);
  });
}

/* ============================================================
   11. SLIDER (pagine cantiere)
   ============================================================ */
function initSlider() {
  const wrap  = document.querySelector('.slider-wrap');
  const track = document.getElementById('slider-track');
  const dotsEl = document.getElementById('slider-dots');
  const thumbStrip = document.getElementById('thumb-strip');
  if (!wrap || !track) return;

  const slides = track.querySelectorAll('.slide');
  const total  = slides.length;
  if (!total) return;

  let current = 0;
  let timer   = null;

  // Dots
  if (dotsEl) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Foto ${i + 1}`);
      dot.addEventListener('click', () => { goTo(i); reset(); });
      dotsEl.appendChild(dot);
    });
  }

  // Thumbnails
  if (thumbStrip) {
    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      if (!img) return;
      const btn = document.createElement('button');
      btn.className = 'thumb' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Foto ${i + 1}`);
      btn.innerHTML = `<img src="${img.src}" alt="" />`;
      btn.addEventListener('click', () => { goTo(i); reset(); });
      thumbStrip.appendChild(btn);
    });
  }

  function goTo(i) {
    current = (i + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsEl?.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === current));
    thumbStrip?.querySelectorAll('.thumb').forEach((t, j) => t.classList.toggle('active', j === current));
  }

  document.getElementById('slider-prev')?.addEventListener('click', () => { goTo(current - 1); reset(); });
  document.getElementById('slider-next')?.addEventListener('click', () => { goTo(current + 1); reset(); });

  // Touch swipe
  let tx = 0;
  wrap.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend',   e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) { goTo(d > 0 ? current + 1 : current - 1); reset(); }
  });

  // Tastiera
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); reset(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); reset(); }
  });

  // Autoplay
  function start() { timer = setInterval(() => goTo(current + 1), 5000); }
  function reset() { clearInterval(timer); start(); }
  wrap.addEventListener('mouseenter', () => clearInterval(timer));
  wrap.addEventListener('mouseleave', start);

  goTo(0);
  start();
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await caricaComponenti();

  initMobileMenu();
  initNavbarScroll();
  initActiveNavLink();
  initAnnoFooter();
  initScrollReveal();
  initFiltriGalleria();

  caricaGalleria();
  caricaAnteprimaHome();
  initFormContatti();
  initSlider();
});
