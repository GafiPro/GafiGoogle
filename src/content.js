(() => {
  'use strict';

  const RESULT_SELECTORS = '#search .MjjYud, #search .tF2Cxc, #search .g, #rso > div';
  const SEARCH_SELECTORS = 'textarea[name="q"], input[name="q"]';
  const observed = new WeakSet();
  let observerTimer = 0;
  let loadingBar;
  let lastPointer = { x: 0, y: 0 };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  function preparePage() {
    document.documentElement.classList.add('gg-page-ready');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('gg-page-visible');
      });
    });
  }

  function createLoadingBar() {
    if (loadingBar) return;

    loadingBar = document.createElement('div');
    loadingBar.className = 'gg-loading-bar';
    loadingBar.setAttribute('aria-hidden', 'true');
    loadingBar.innerHTML = '<span class="gg-loading-track"><i></i><i></i><i></i><i></i></span>';
    document.documentElement.appendChild(loadingBar);
  }

  function startLoading() {
    createLoadingBar();
    document.documentElement.classList.remove('gg-loading-done');
    document.documentElement.classList.add('gg-loading');
  }

  function finishLoading() {
    if (!loadingBar) return;
    document.documentElement.classList.add('gg-loading-done');
    window.setTimeout(() => {
      document.documentElement.classList.remove('gg-loading');
      document.documentElement.classList.remove('gg-loading-done');
    }, 340);
  }

  function decorateResults() {
    const results = [...document.querySelectorAll(RESULT_SELECTORS)]
      .filter((element) => element instanceof HTMLElement);

    results.forEach((result, index) => {
      if (observed.has(result)) return;

      observed.add(result);
      result.classList.add('gg-result');
      result.style.setProperty('--gg-result-index', Math.min(index, 12));

      const image = result.querySelector('img');
      if (image) image.classList.add('gg-result-image');
    });
  }

  function addClickWave(event) {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const wave = document.createElement('span');
    wave.className = 'gg-click-wave';
    wave.style.left = event.clientX + 'px';
    wave.style.top = event.clientY + 'px';
    document.documentElement.appendChild(wave);

    window.setTimeout(() => wave.remove(), 700);
  }

  function addSearchFocusEffects() {
    document.addEventListener('focusin', (event) => {
      const input = event.target instanceof Element
        ? event.target.closest(SEARCH_SELECTORS)
        : null;

      if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
      input.classList.add('gg-search-focus');
    });

    document.addEventListener('focusout', (event) => {
      const input = event.target instanceof Element
        ? event.target.closest(SEARCH_SELECTORS)
        : null;

      if (input) input.classList.remove('gg-search-focus');
    });
  }

  function smoothNavigation() {
    document.addEventListener('pointerdown', (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      addClickWave(event);
    }, { passive: true });

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target instanceof Element
        ? event.target.closest('a[href]')
        : null;

      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.origin !== location.origin) return;
      if (anchor.href === location.href) return;

      document.documentElement.style.setProperty('--gg-origin-x', lastPointer.x + 'px');
      document.documentElement.style.setProperty('--gg-origin-y', lastPointer.y + 'px');

      startLoading();
      document.documentElement.classList.add('gg-navigating');
    }, true);

    document.addEventListener('submit', () => {
      document.documentElement.style.setProperty('--gg-origin-x', lastPointer.x + 'px');
      document.documentElement.style.setProperty('--gg-origin-y', lastPointer.y + 'px');

      startLoading();
      document.documentElement.classList.add('gg-searching');
      document.documentElement.classList.add('gg-navigating');
    }, true);

    window.addEventListener('pageshow', () => {
      document.documentElement.classList.remove('gg-navigating');
      document.documentElement.classList.remove('gg-searching');
      finishLoading();
    }, { passive: true });

    window.addEventListener('pagehide', () => {
      if (loadingBar) loadingBar.classList.add('gg-pagehide');
    }, { passive: true });
  }

  function observeGoogle() {
    const observer = new MutationObserver(() => {
      window.clearTimeout(observerTimer);
      observerTimer = window.setTimeout(decorateResults, 24);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    decorateResults();
  }

  preparePage();
  createLoadingBar();
  addSearchFocusEffects();
  smoothNavigation();
  observeGoogle();
})();