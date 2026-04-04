/**
 * VendIA Global Utilities — v1.0
 * Include in every page before </body>:
 *   <script src="vendIA-global.js"></script>
 *
 * Exposes:
 *   window.showToast(msg, type)     — enhanced toast (overrides per-page version)
 *   window.VendIA.*                 — all utilities
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     TOAST SYSTEM
  ═══════════════════════════════════════════════ */
  const TOAST_MAX = 3;

  const TOAST_ICONS = {
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  function getWrap() {
    let w = document.getElementById('toastWrap');
    if (!w) {
      w = document.createElement('div');
      w.id = 'toastWrap';
      w.className = 'toast-wrap';
      document.body.appendChild(w);
    }
    return w;
  }

  function dismissToast(el) {
    if (!el || el.classList.contains('vd-out')) return;
    el.classList.add('vd-out');
    setTimeout(() => el.remove(), 220);
  }

  window.showToast = function (msg, type) {
    type = type || 'success';
    const wrap = getWrap();

    // Evict oldest if at max
    const active = wrap.querySelectorAll('.vd-toast:not(.vd-out)');
    if (active.length >= TOAST_MAX) dismissToast(active[active.length - 1]);

    const t = document.createElement('div');
    t.className = 'vd-toast ' + type;
    t.innerHTML =
      '<span class="vd-toast-icon">' + (TOAST_ICONS[type] || TOAST_ICONS.info) + '</span>' +
      '<span class="vd-toast-msg">' + msg + '</span>' +
      '<button class="vd-toast-close" onclick="VendIA.dismissToast(this.parentElement)">\u00d7</button>';

    wrap.appendChild(t);

    // Auto-dismiss with hover-pause
    let remaining = 3000;
    let startTime = Date.now();
    let timer = setTimeout(() => dismissToast(t), remaining);

    t.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      remaining -= Date.now() - startTime;
    });
    t.addEventListener('mouseleave', function () {
      startTime = Date.now();
      timer = setTimeout(() => dismissToast(t), Math.max(remaining, 800));
    });

    return t;
  };

  /* ═══════════════════════════════════════════════
     MAIN NAMESPACE
  ═══════════════════════════════════════════════ */
  var VendIA = window.VendIA = {

    dismissToast: dismissToast,

    /* ─── URL FILTER PERSISTENCE ─────────────────── */

    getParam: function (key) {
      return new URLSearchParams(window.location.search).get(key);
    },

    setParam: function (key, value) {
      var url = new URL(window.location.href);
      if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
      history.pushState({ vd: true }, '', url.toString());
    },

    setParams: function (obj) {
      var url = new URL(window.location.href);
      Object.keys(obj).forEach(function (k) {
        var v = obj[k];
        if (v === null || v === undefined || v === '') url.searchParams.delete(k);
        else url.searchParams.set(k, String(v));
      });
      history.pushState({ vd: true }, '', url.toString());
    },

    /**
     * Apply URL params to form elements or callbacks.
     * map: { paramKey: 'elementId' | fn(value) }
     * Example:
     *   VendIA.applyParamsToFilters({
     *     tipo:      'filterTipo',       // sets el.value
     *     prioridad: function(v){ ... }  // calls fn
     *   });
     */
    applyParamsToFilters: function (map) {
      var params = new URLSearchParams(window.location.search);
      Object.keys(map).forEach(function (param) {
        var val = params.get(param);
        if (val === null) return;
        var target = map[param];
        if (typeof target === 'function') {
          target(val);
        } else {
          var el = document.getElementById(target);
          if (el) el.value = val;
        }
      });
    },

    /* ─── COUNT-UP ANIMATION ──────────────────────── */

    /**
     * Animate a number from 0 to `to`.
     * el: DOM element whose textContent will be updated
     * prefix/suffix: e.g. '$', '%'
     * decimals: decimal places in output
     */
    countUp: function (el, to, opts) {
      if (!el) return;
      opts = opts || {};
      var duration = opts.duration || 800;
      var prefix   = opts.prefix   || '';
      var suffix   = opts.suffix   || '';
      var decimals = opts.decimals || 0;
      var startTime = null;

      function fmt(n) {
        return prefix + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      }

      function step(ts) {
        if (!startTime) startTime = ts;
        var elapsed  = ts - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = fmt(eased * to);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = fmt(to);
      }
      requestAnimationFrame(step);
    },

    /**
     * Run countUp on all elements matching selector.
     * Each element needs data-value="123" data-prefix="$" data-suffix="%"
     */
    countUpAll: function (selector, parentEl) {
      var root = parentEl || document;
      root.querySelectorAll(selector).forEach(function (el) {
        var to       = parseFloat(el.dataset.value || el.textContent.replace(/[^0-9.]/g, '')) || 0;
        var prefix   = el.dataset.prefix  || '';
        var suffix   = el.dataset.suffix  || '';
        var decimals = parseInt(el.dataset.decimals || '0', 10);
        VendIA.countUp(el, to, { prefix: prefix, suffix: suffix, decimals: decimals });
      });
    },

    /* ─── PROGRESS BAR ANIMATION ──────────────────── */

    /**
     * Animate a bar element's width from 0 to targetPct.
     * Applies class vd-bar-fill (defined in CSS) for transition.
     */
    animateBar: function (el, targetPct, delay) {
      if (!el) return;
      delay = delay || 0;
      el.style.transition = 'none';
      el.style.width = '0%';
      setTimeout(function () {
        el.style.transition = 'width 600ms ease';
        el.style.width = Math.min(100, Math.max(0, targetPct)) + '%';
      }, delay + 30);
    },

    animateBarsAll: function (selector, parentEl) {
      var root = parentEl || document;
      root.querySelectorAll(selector).forEach(function (el) {
        var target = parseFloat(el.dataset.pct || el.style.width) || 0;
        VendIA.animateBar(el, target);
      });
    },

    /* ─── CARD STAGGER ANIMATION ──────────────────── */

    /**
     * Add stagger-child class with animation-delay to each matching element.
     * interval: ms between each card (default 60)
     */
    staggerCards: function (selector, parentEl, interval) {
      var root = parentEl || document;
      interval = interval || 60;
      root.querySelectorAll(selector).forEach(function (el, i) {
        el.style.animationDelay = (i * interval) + 'ms';
        el.classList.add('stagger-child');
      });
    },

    /* ─── SKELETON HELPERS ────────────────────────── */

    showSkeleton: function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = '';
    },

    hideSkeleton: function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    },

    /**
     * Show skeleton for `ms` ms then call callback.
     * Usage: VendIA.withSkeleton('skId', 600, function(){ renderContent(); });
     */
    withSkeleton: function (id, ms, cb) {
      VendIA.showSkeleton(id);
      setTimeout(function () {
        VendIA.hideSkeleton(id);
        if (cb) cb();
      }, ms || 600);
    },

    /* ─── EMPTY STATES ────────────────────────────── */

    EMPTY_CONFIGS: {
      'no-search': {
        icon: `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        title: 'No encontramos clientes con esos filtros.',
        sub: 'Probá ajustando o limpiando los filtros de búsqueda.',
        action: `<button class="btn btn-secondary btn-sm" onclick="VendIA.clearFilters()">Limpiar filtros</button>`,
      },
      'no-recommendations': {
        icon: `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent)"><polyline points="20 6 9 17 4 12"/></svg>`,
        title: 'No hay recomendaciones activas este mes.',
        sub: 'El motor no detectó oportunidades pendientes para este cliente.',
        action: `<button class="btn btn-ghost btn-sm">Ver historial</button>`,
      },
      'no-promos': {
        icon: `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
        title: 'Sin promociones por el momento.',
        sub: 'Las promociones publicadas aparecerán aquí.',
        action: '',
      },
      'no-data': {
        icon: `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
        title: 'No hay datos disponibles.',
        sub: 'Importá datos o esperá a que el motor procese la información.',
        action: '',
      },
    },

    /**
     * Inject (or toggle) an empty state into a container.
     * type: key in EMPTY_CONFIGS, or custom { icon, title, sub, action }
     */
    showEmpty: function (containerEl, type, customCfg) {
      if (!containerEl) return;
      var existing = containerEl.querySelector('.vd-empty');
      if (existing) { existing.classList.add('visible'); return; }

      var cfg = customCfg || VendIA.EMPTY_CONFIGS[type] || VendIA.EMPTY_CONFIGS['no-data'];
      var div = document.createElement('div');
      div.className = 'vd-empty visible';
      div.innerHTML =
        '<div class="vd-empty-icon">' + cfg.icon + '</div>' +
        '<div class="vd-empty-title">' + cfg.title + '</div>' +
        (cfg.sub    ? '<div class="vd-empty-sub">'     + cfg.sub    + '</div>' : '') +
        (cfg.action ? '<div class="vd-empty-actions">' + cfg.action + '</div>' : '');
      containerEl.appendChild(div);
    },

    hideEmpty: function (containerEl) {
      if (!containerEl) return;
      var el = containerEl.querySelector('.vd-empty');
      if (el) el.classList.remove('visible');
    },

    /* ─── DIRTY FORM GUARD (beforeunload) ─────────── */

    _dirty: false,

    markDirty: function () { VendIA._dirty = true; },
    markClean: function () { VendIA._dirty = false; },

    /**
     * Attach input listeners to forms matching selector,
     * and set up beforeunload guard.
     * Call VendIA.markClean() after a successful save.
     */
    guardForms: function (selector) {
      var root = selector ? document.querySelectorAll(selector) : [];
      root.forEach(function (el) {
        el.addEventListener('input', VendIA.markDirty);
        el.addEventListener('change', VendIA.markDirty);
      });

      if (!VendIA._guardInstalled) {
        VendIA._guardInstalled = true;
        window.addEventListener('beforeunload', function (e) {
          if (VendIA._dirty) {
            var msg = '¿Salir? Los datos no guardados se perderán.';
            e.preventDefault();
            e.returnValue = msg;
            return msg;
          }
        });
      }
    },

    /* ─── BOTTOM TAB BAR (mobile) ─────────────────── */

    initBottomBar: function (activeHref) {
      // Only on mobile
      if (window.innerWidth > 767) return;
      // Don't double-inject
      if (document.querySelector('.vd-bottom-bar')) return;

      var tabs = [
        {
          href: 'Home_Admin.html', label: 'Home',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        },
        {
          href: 'Lista_de_clientes.html', label: 'Clientes',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        },
        {
          href: 'KPIs.html', label: 'KPIs',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        },
        {
          href: 'Objetivos.html', label: 'Objetivos',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        },
        {
          href: 'Configuracion.html', label: 'Más',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
        },
      ];

      var bar = document.createElement('nav');
      bar.className = 'vd-bottom-bar';
      bar.setAttribute('aria-label', 'Navegación principal');

      bar.innerHTML = tabs.map(function (t) {
        var isCurrent = t.href === activeHref;
        return '<a class="vd-tab-item' + (isCurrent ? ' active' : '') + '" href="' + t.href + '">' +
          t.icon + '<span>' + t.label + '</span></a>';
      }).join('');

      document.body.appendChild(bar);
    },

    /* ─── POPSTATE HANDLER ────────────────────────── */
    // Calls window.applyFiltersFromURL() if defined (per-page hook)
    _bindPopstate: function () {
      window.addEventListener('popstate', function () {
        if (typeof window.applyFiltersFromURL === 'function') {
          window.applyFiltersFromURL();
        }
      });
    },

    /* ─── CLEAR FILTERS HELPER ────────────────────── */
    // Override per-page or set window.clearFilters = fn
    clearFilters: function () {
      if (typeof window._clearFilters === 'function') {
        window._clearFilters();
      }
    },

    /* ─── PAGE INIT (call on DOMContentLoaded) ────── */
    init: function () {
      // Determine current page filename
      var page = window.location.pathname.split('/').pop() || 'Home_Admin.html';
      if (!page.endsWith('.html')) page = 'Home_Admin.html';

      VendIA.initBottomBar(page);
      VendIA._bindPopstate();

      // Stagger any cards already in DOM
      // (per-page can call VendIA.staggerCards after dynamic render)
      setTimeout(function () {
        VendIA.staggerCards('.kpi-card');
        VendIA.staggerCards('.action-card');
      }, 50);
    },

  };

  /* ═══════════════════════════════════════════════
     AUTO-INIT
  ═══════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VendIA.init);
  } else {
    VendIA.init();
  }

}());
