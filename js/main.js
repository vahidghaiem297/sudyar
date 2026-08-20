document.addEventListener('DOMContentLoaded', () => {

  // ---------- hero background: particles.js (moderate density, lines follow the cursor) ----------
  const particlesEl = document.getElementById('hero-particles');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (particlesEl && window.particlesJS && !prefersReducedMotion) {
    particlesJS('hero-particles', {
      particles: {
        number: { value: 90, density: { enable: true, value_area: 700 } },
        color: { value: '#EFE9D8' },
        shape: { type: 'circle' },
        opacity: { value: 0.35, random: true, anim: { enable: false } },
        size: { value: 2.6, random: true, anim: { enable: false } },
        line_linked: {
          enable: true, distance: 140, color: '#E4BE6E', opacity: 0.22, width: 1
        },
        move: {
          enable: true, speed: 0.9, direction: 'none', random: true,
          straight: false, out_mode: 'out', bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: false },
          resize: true
        },
        modes: {
          grab: { distance: 170, line_linked: { opacity: 0.55 } }
        }
      },
      retina_detect: true
    });
  }

  // ---------- final CTA background: particles.js (dark tones for the light/gold section) ----------
  const finalParticlesEl = document.getElementById('final-particles');
  if (finalParticlesEl && window.particlesJS && !prefersReducedMotion) {
    particlesJS('final-particles', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 650 } },
        color: { value: '#1C2A22' },
        shape: { type: 'circle' },
        opacity: { value: 0.3, random: true, anim: { enable: false } },
        size: { value: 2.6, random: true, anim: { enable: false } },
        line_linked: {
          enable: true, distance: 140, color: '#1C1404', opacity: 0.18, width: 1
        },
        move: {
          enable: true, speed: 0.9, direction: 'none', random: true,
          straight: false, out_mode: 'out', bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: false },
          resize: true
        },
        modes: {
          grab: { distance: 170, line_linked: { opacity: 0.5 } }
        }
      },
      retina_detect: true
    });
  }

  // ---------- journey section: faint floating orbs (drift + gently bump) ----------
  // Plain particles.js has no particle-vs-particle collision, so this is a
  // small, self-contained physics loop: soft circles of random size drift
  // slowly, bounce elastically off one another, and stay bounded inside the
  // section (edge-bounce) — deliberately slow/low-opacity so it stays calm.
  const orbsHost = document.getElementById('journeyOrbs');
  if (orbsHost && !prefersReducedMotion) {
    const ORB_COUNT_DESKTOP = 12;
    const ORB_COUNT_MOBILE = 7;
    const isMobileWidth = () => window.innerWidth <= 640;

    let width = 0, height = 0, orbs = [];

    function rand(min, max) { return min + Math.random() * (max - min); }

    function buildOrbs() {
      orbsHost.innerHTML = '';
      const rect = orbsHost.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const count = isMobileWidth() ? ORB_COUNT_MOBILE : ORB_COUNT_DESKTOP;
      orbs = [];
      for (let i = 0; i < count; i++) {
        const r = rand(22, 78);
        const el = document.createElement('div');
        el.className = 'orb' + (Math.random() < 0.4 ? ' gold' : '');
        el.style.width = el.style.height = (r * 2) + 'px';
        orbsHost.appendChild(el);
        const speed = rand(0.05, 0.16); // slow + calm
        const angle = rand(0, Math.PI * 2);
        orbs.push({
          el, r,
          x: rand(r, Math.max(r, width - r)),
          y: rand(r, Math.max(r, height - r)),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed
        });
      }
    }

    function step() {
      // wall collisions — keeps every orb inside the section's own bounds
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x - o.r < 0) { o.x = o.r; o.vx = Math.abs(o.vx); }
        else if (o.x + o.r > width) { o.x = width - o.r; o.vx = -Math.abs(o.vx); }
        if (o.y - o.r < 0) { o.y = o.r; o.vy = Math.abs(o.vy); }
        else if (o.y + o.r > height) { o.y = height - o.r; o.vy = -Math.abs(o.vy); }
      }
      // orb-vs-orb collisions — gentle elastic bump, mass ~ area
      for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
          const a = orbs[i], b = orbs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.r + b.r;
          if (dist > 0 && dist < minDist) {
            const nx = dx / dist, ny = dy / dist;
            const overlap = (minDist - dist) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap;
            b.x += nx * overlap; b.y += ny * overlap;
            const ma = a.r * a.r, mb = b.r * b.r;
            const relVx = a.vx - b.vx, relVy = a.vy - b.vy;
            const velAlongNormal = relVx * nx + relVy * ny;
            if (velAlongNormal > 0) continue;
            const restitution = 0.85; // slightly damped so it stays calm
            const impulse = -(1 + restitution) * velAlongNormal / (1 / ma + 1 / mb);
            const ix = impulse * nx, iy = impulse * ny;
            a.vx += ix / ma; a.vy += iy / ma;
            b.vx -= ix / mb; b.vy -= iy / mb;
          }
        }
      }
      for (const o of orbs) {
        o.el.style.transform = `translate3d(${(o.x - o.r).toFixed(1)}px, ${(o.y - o.r).toFixed(1)}px, 0)`;
      }
      requestAnimationFrame(step);
    }

    buildOrbs();
    requestAnimationFrame(step);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildOrbs, 250);
    });
  }

  // ---------- mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.textContent = isOpen ? '✕' : '☰';
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      navToggle.textContent = '☰';
    }));
  }

  // ---------- shared helpers ----------
  const sections = Array.from(document.querySelectorAll('#fullpage > .section'));
  const dotItems = Array.from(document.querySelectorAll('.side-dots .dot-item'));
  const progressBar = document.getElementById('progressBar');
  const backToTop = document.getElementById('backToTop');  const counterIdx = document.getElementById('counterIdx');
  const counterLabel = document.getElementById('counterLabel');
  const header = document.querySelector('header');
  const footerEl = document.getElementById('footer');
  const faDigits = {'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
  const toFa = n => String(n).split('').map(c => faDigits[c] !== undefined ? faDigits[c] : c).join('');
  const total = sections.length;
  // the footer sits right after the last section but isn't one of the counted/
  // dotted sections — it's addressed as one extra "virtual" stop (index === total)
  // so wheel/keyboard scrolling can continue past the last section into it.
  const maxIndex = footerEl ? total : total - 1;
  const HEADER_OFFSET = 76;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopMQ = window.matchMedia('(min-width:901px) and (min-height:640px)');
  const isDesktop = () => desktopMQ.matches;

  function updateUI(index){
    const section = sections[index] || footerEl;
    if (!section) return;
    document.body.dataset.theme = section.dataset.theme || 'light';
    dotItems.forEach((d, i) => d.classList.toggle('active', i === index));
    if (counterIdx) counterIdx.textContent = toFa(Math.min(index + 1, total)) + ' / ' + toFa(total);
    if (counterLabel) counterLabel.textContent = section.dataset.label || '';
  }

  // ---------- custom eased "one wheel tick = one section" full-page scroll ----------
  // A small, dependency-free stand-in for fullPage.js's default autoScrolling
  // behaviour (easeInOutCubic, ~700ms) — no vendor script, no license key.
  function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  let currentIndex = 0;
  let isAnimating = false;
  let rafId = null;

  function animateScrollTo(targetY, duration, onDone){
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 1 || duration <= 0){
      window.scrollTo(0, targetY);
      onDone && onDone();
      return;
    }
    const startTime = performance.now();
    cancelAnimationFrame(rafId);
    function step(now){
      const t = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(t));
      if (t < 1) { rafId = requestAnimationFrame(step); }
      else { onDone && onDone(); }
    }
    rafId = requestAnimationFrame(step);
  }

  function targetTopFor(idx){
    const el = sections[idx] || footerEl;
    return el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  }

  function moveToIndex(idx){
    idx = Math.max(0, Math.min(maxIndex, idx));
    currentIndex = idx;
    isAnimating = true;
    const targetY = targetTopFor(idx);
    animateScrollTo(targetY, reduceMotion ? 0 : 150, () => { isAnimating = false; });
  }

  window.addEventListener('wheel', (e) => {
    if (!isDesktop() || document.body.classList.contains('modal-open')) return; // let touch/short screens scroll natively
    e.preventDefault();
    if (isAnimating || Math.abs(e.deltaY) < 8) return;
    moveToIndex(currentIndex + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (!isDesktop() || isAnimating || document.body.classList.contains('modal-open')) return;
    if (e.keyCode === 34 || e.keyCode === 40) { e.preventDefault(); moveToIndex(currentIndex + 1); }
    else if (e.keyCode === 33 || e.keyCode === 38) { e.preventDefault(); moveToIndex(currentIndex - 1); }
  });

  let touchStartY = null;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!isDesktop() || touchStartY === null) return;
    const diff = touchStartY - e.touches[0].clientY;
    if (Math.abs(diff) < 40 || isAnimating) return;
    e.preventDefault();
    moveToIndex(currentIndex + (diff > 0 ? 1 : -1));
    touchStartY = null;
  }, { passive: false });

  // ---------- section navigation (dots, header/footer/CTA links) ----------
  function goToAnchor(id){
    const idx = sections.findIndex(s => s.id === id);
    if (idx !== -1 && isDesktop()){
      moveToIndex(idx);
    } else {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  dotItems.forEach(item => {
    item.addEventListener('click', () => goToAnchor(item.getAttribute('data-target')));
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      goToAnchor(id);
    });
  });

  // ---------- track which section is active (keeps dots/counter/theme in sync) ----------
  if ('IntersectionObserver' in window && sections.length){
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5){
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) { currentIndex = idx; updateUI(idx); }
        }
      });
    }, { threshold: [0.5] });
    sections.forEach(s => sectionObserver.observe(s));
  }

  function onScroll(){
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const pct = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (header) header.style.background = scrollTop > 10 ? 'rgba(21,42,32,.92)' : 'rgba(21,42,32,.7)';
    if (backToTop) backToTop.classList.toggle('show', scrollTop > 480);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  updateUI(0);
  onScroll();

  // ---------- scroll reveal (fade/slide-in for titles, text, buttons, cards) ----------
  const revealEls = document.querySelectorAll('.reveal, .anim-right, .anim-left, .anim-stagger, .video-zoom');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){ e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // ---------- tutorial video modal (per-chapter) ----------
  const videoModal = document.getElementById('videoModal');
  const tutorialVideo = document.getElementById('tutorialVideo');
  const tutorialVideoTitle = document.getElementById('tutorialVideoTitle');
  if (videoModal && tutorialVideo){
    const openVideo = (btn) => {
      const src = btn.getAttribute('data-video-src');
      const title = btn.getAttribute('data-video-title') || '';
      if (src){
        tutorialVideo.pause();
        tutorialVideo.setAttribute('src', src);
        tutorialVideo.load();
      }
      if (tutorialVideoTitle) tutorialVideoTitle.textContent = title;
      videoModal.classList.add('active');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      tutorialVideo.play().catch(() => {});
    };
    const closeVideo = () => {
      videoModal.classList.remove('active');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      tutorialVideo.pause();
    };
    document.querySelectorAll('[data-video-open]').forEach(btn => btn.addEventListener('click', () => openVideo(btn)));
    videoModal.querySelectorAll('[data-video-close]').forEach(el => el.addEventListener('click', closeVideo));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('active')) closeVideo();
    });
  }

  // ---------- pricing billing toggle (yearly / unlimited) ----------
  const billingTabs = document.querySelectorAll('.billing-tab');
  const priceGrid = document.getElementById('priceGrid');
  if (billingTabs.length && priceGrid){
    billingTabs.forEach(tab => tab.addEventListener('click', () => {
      billingTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      priceGrid.dataset.billing = tab.dataset.billing;
    }));
  }

  // ---------- FAQ accordion ----------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      faqItems.forEach(i => {
        i.classList.remove('open');
        const btn = i.querySelector('.faq-q');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      if (willOpen){
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

});
