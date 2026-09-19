(() => {
  'use strict';

  const RESULT_SELECTORS = '#search .MjjYud, #search .tF2Cxc, #search .g, #rso > div';
  const observed = new WeakSet();
  let observerTimer = 0;

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

  function decorateResults() {
    const results = [...document.querySelectorAll(RESULT_SELECTORS)]
      .filter((element) => element instanceof HTMLElement);

    results.forEach((result, index) => {
      if (observed.has(result)) return;

      observed.add(result);
      result.classList.add('gg-result');
      result.style.setProperty('--gg-result-index', Math.min(index, 10));
    });
  }

  function smoothNavigation() {
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

      document.documentElement.classList.add('gg-navigating');
    }, true);

    document.addEventListener('submit', () => {
      document.documentElement.classList.add('gg-navigating');
    }, true);

    window.addEventListener('pageshow', () => {
      document.documentElement.classList.remove('gg-navigating');
    }, { passive: true });
  }

  function observeGoogle() {
    const observer = new MutationObserver(() => {
      window.clearTimeout(observerTimer);
      observerTimer = window.setTimeout(decorateResults, 30);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    decorateResults();
  }

  preparePage();
  smoothNavigation();
  observeGoogle();
})();