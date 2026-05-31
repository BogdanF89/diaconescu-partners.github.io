// assets/js/site.js
// Shared bilingual (RO/EN) i18n engine for inner pages (service + legal).
// The homepage keeps its own inline i18n; this file deduplicates the rest.
//
// A page using this engine must, BEFORE this script runs, define:
//   window.i18n = { ro: { key: 'text', ... }, en: { key: 'text', ... } };
// Optionally:
//   window.i18nTitle = { ro: 'Title RO', en: 'Title EN' };
//
// Markup contract:
//   <el data-i18n="key">        -> textContent
//   <el data-i18n-html="key">   -> innerHTML  (value may contain HTML)
//   <el data-i18n-ph="key">     -> placeholder
//   <button data-lang="ro">RO</button>  toggle buttons (get .active for current lang)
//
// Language is persisted in localStorage under 'lang' (shared with the homepage),
// so a visitor's choice carries across the whole site.
(function () {
  'use strict';

  var STORAGE_KEY = 'lang';
  var DEFAULT_LANG = 'ro';

  function dict() { return window.i18n || {}; }

  function applyLang(lang) {
    var d = dict();
    if (!d[lang]) lang = DEFAULT_LANG;
    var table = d[lang] || {};

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = table[el.getAttribute('data-i18n')];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = table[el.getAttribute('data-i18n-html')];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = table[el.getAttribute('data-i18n-ph')];
      if (v !== undefined) el.placeholder = v;
    });

    if (window.i18nTitle && window.i18nTitle[lang]) {
      document.title = window.i18nTitle[lang];
    }

    document.documentElement.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function savedLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function init() {
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-lang'));
      });
    });
    applyLang(savedLang() || DEFAULT_LANG);
  }

  // Expose for inline handlers / debugging; setLang kept for back-compat.
  window.applyLang = applyLang;
  window.setLang = applyLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
