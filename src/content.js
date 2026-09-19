(() => {
  'use strict';

  const DEFAULTS = {
    profile: 'clean',
    pageIntro: true,
    resultStagger: true,
    resultHover: true,
    navigationTransitions: true,
    searchBar: true,
    microinteractions: true,
    scrollReveal: true,
    loading: true,
    clickRipple: true,
    cursorGlow: true,
    particles: false,
    rgbGlow: false,
    glass: true,
    logoStyles: true
  };

  const RESULT_SELECTORS = [
    '#search .MjjYud',
    '#search .tF2Cxc',
    '#search .g',
    '#rso > div'
  ].join(',');

  const SEARCH_SELECTORS = [
    'textarea[name="q"]',
    'input[name="q"]',
    'textarea[aria-label="Search"]',
    'input[aria-label="Search"]'
  ].join(',');

  let settings = { ...DEFAULTS };
  let observer;
  let revealObserver;
  let particleContainer;
  let cursorGlow;
  let cursorTargetX = 0;
  let cursorTargetY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let cursorFrame = 0;
  let cursorListenerInstalled = false;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const storage = chrome.storage?.sync ?? chrome.storage?.local;

  function getSettings() {
    return new Promise((resolve) => {
      if (!storage) return resolve({ ...DEFAULTS });
      storage.get(DEFAULTS, (value) => resolve({ ...DEFAULTS, ...value }));
    });
  }

  function setRootState() {
    const root = document.documentElement;
    root.dataset.ggProfile = settings.profile;
    root.dataset.ggPageIntro = settings.pageIntro ? 'on' : 'off';
    root.dataset.ggResultStagger = settings.resultStagger ? 'on' : 'off';
    root.dataset.ggResultHover = settings.resultHover ? 'on' : 'off';
    root.dataset.ggNavigation = settings.navigationTransitions ? 'on' : 'off';
    root.dataset.ggSearchBar = settings.searchBar ? 'on' : 'off';
    root.dataset.ggMicro = settings.microinteractions ? 'on' : 'off';
    root.dataset.ggReveal = settings.scrollReveal ? 'on' : 'off';
    root.dataset.ggLoading = settings.loading ? 'on' : 'off';
    root.dataset.ggRipple = settings.clickRipple ? 'on' : 'off';
    root.dataset.ggCursor = settings.cursorGlow ? 'on' : 'off';
    root.dataset.ggParticles = settings.particles ? 'on' : 'off';
    root.dataset.ggRgb = settings.rgbGlow ? 'on' : 'off';
    root.dataset.ggGlass = settings.glass ? 'on' : 'off';
    root.dataset.ggLogo = settings.logoStyles ? 'on' : 'off';
  }

  function addClassOnce(element, className) {
    if (element && !element.classList.contains(className)) element.classList.add(className);
  }

  function setupPageIntro() {
    if (!settings.pageIntro || reducedMotion) return;
    addClassOnce(document.documentElement, 'gg-page-intro-ready');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.add('gg-page-intro-visible');
    }));
  }

  function findResults() {
    return [...document.querySelectorAll(RESULT_SELECTORS)]
      .filter((node) => node instanceof HTMLElement)
      .filter((node, index, all) => all.indexOf(node) === index)
      .slice(0, 50);
  }

  function setupRevealObserver() {
    if (revealObserver) revealObserver.disconnect();
    if (!settings.scrollReveal || reducedMotion || !('IntersectionObserver' in window)) return;

    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('gg-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  }

  function decorateResults() {
    const results = findResults();
    results.forEach((result, index) => {
      addClassOnce(result, 'gg-result');
      if (settings.resultStagger && !reducedMotion) {
        result.style.setProperty('--gg-result-index', Math.min(index, 12).toString());
      }
      if (settings.scrollReveal && revealObserver && !result.classList.contains('gg-visible')) {
        revealObserver.observe(result);
      } else if (!settings.scrollReveal || reducedMotion) {
        result.classList.add('gg-visible');
      }
    });
  }

  function decorateSearchBar() {
    document.querySelectorAll(SEARCH_SELECTORS).forEach((input) => {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
      addClassOnce(input, 'gg-search-input');
      const shell = input.closest('form') || input.parentElement;
      if (shell instanceof HTMLElement) addClassOnce(shell, 'gg-search-shell');
    });
  }

  function decorateLogo() {
    if (!settings.logoStyles) return;
    document.querySelectorAll('#hplogo, .lnXdpd, [aria-label="Google"]').forEach((logo) => {
      if (logo instanceof HTMLElement || logo instanceof SVGElement) addClassOnce(logo, 'gg-logo');
    });
  }

  function setupParticles() {
    if (particleContainer) {
      particleContainer.remove();
      particleContainer = null;
    }
    if (!settings.particles || reducedMotion) return;

    particleContainer = document.createElement('div');
    particleContainer.id = 'gg-particles';
    particleContainer.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 12; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'gg-particle';
      particle.style.setProperty('--gg-p-left', `${Math.random() * 100}%`);
      particle.style.setProperty('--gg-p-top', `${15 + Math.random() * 70}%`);
      particle.style.setProperty('--gg-p-delay', `${Math.random() * -12}s`);
      particle.style.setProperty('--gg-p-duration', `${9 + Math.random() * 8}s`);
      particleContainer.appendChild(particle);
    }

    document.documentElement.appendChild(particleContainer);
  }

  function setupCursorGlow() {
    if (cursorGlow) {
      cursorGlow.remove();
      cursorGlow = null;
    }
    if (!settings.cursorGlow || reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

    cursorGlow = document.createElement('div');
    cursorGlow.id = 'gg-cursor-glow';
    cursorGlow.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(cursorGlow);

    const tick = () => {
      cursorX += (cursorTargetX - cursorX) * 0.16;
      cursorY += (cursorTargetY - cursorY) * 0.16;
      if (cursorGlow) {
        cursorGlow.style.transform = `translate3d(${cursorX - 18}px, ${cursorY - 18}px, 0)`;
      }
      cursorFrame = requestAnimationFrame(tick);
    };

    if (!cursorListenerInstalled) {
      window.addEventListener('pointermove', (event) => {
        cursorTargetX = event.clientX;
        cursorTargetY = event.clientY;
      }, { passive: true });
      cursorListenerInstalled = true;
    }

    cancelAnimationFrame(cursorFrame);
    cursorFrame = requestAnimationFrame(tick);
  }

  function setupRipple() {
    if (document.documentElement.dataset.ggRippleListener === 'on') return;
    document.documentElement.dataset.ggRippleListener = 'on';
    document.addEventListener('pointerdown', (event) => {
      if (!settings.clickRipple || reducedMotion) return;
      const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"], input[type="submit"]') : null;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('#gg-cursor-glow, #gg-particles')) return;

      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'gg-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      target.classList.add('gg-ripple-host');
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
    }, { passive: true });
  }

  function setupNavigationTransitions() {
    if (document.documentElement.dataset.ggNavigationListener === 'on') return;
    document.documentElement.dataset.ggNavigationListener = 'on';

    const start = () => {
      document.documentElement.classList.add('gg-leaving');
    };

    document.addEventListener('click', (event) => {
      if (!settings.navigationTransitions || reducedMotion || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.origin !== location.origin) return;
      if (anchor.href === location.href) return;
      start();
    }, true);

    document.addEventListener('submit', () => {
      if (settings.navigationTransitions && !reducedMotion) start();
    }, true);
  }

  function setupLoadingBar() {
    if (document.getElementById('gg-loading-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'gg-loading-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(bar);

    window.addEventListener('pageshow', () => bar.classList.remove('gg-loading-active'), { passive: true });

    const observerLocal = new MutationObserver(() => {
      if (settings.loading && !reducedMotion && document.documentElement.classList.contains('gg-leaving')) {
        bar.classList.add('gg-loading-active');
      }
    });
    observerLocal.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  function refreshDecorations() {
    decorateResults();
    decorateSearchBar();
    decorateLogo();
  }

  function observeDom() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      window.clearTimeout(observeDom._timer);
      observeDom._timer = window.setTimeout(refreshDecorations, 40);
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  }

  async function boot() {
    settings = await getSettings();
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRootState();
    setupPageIntro();
    setupRevealObserver();
    setupParticles();
    setupCursorGlow();
    setupRipple();
    setupNavigationTransitions();
    setupLoadingBar();
    refreshDecorations();
    observeDom();

    storage?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== 'sync' && areaName !== 'local') return;
      const relevant = Object.keys(DEFAULTS).some((key) => changes[key]);
      if (!relevant) return;
      getSettings().then((next) => {
        settings = next;
        setRootState();
        setupRevealObserver();
        setupParticles();
        setupCursorGlow();
        refreshDecorations();
      });
    });
  }

  boot().catch(() => {});
})();
