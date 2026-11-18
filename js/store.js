/* store.js - app state, persistence (localStorage) and mutations. */
(function (global) {
  'use strict';

  var KEY = 'expense-tracker.v1';
  var LEGACY_KEYS = [];

  var DEFAULT_CATEGORIES = [
    { id: 'food', name: 'Food & Drinks', icon: '🍽️' },
    { id: 'groceries', name: 'Groceries', icon: '🛒' },
    { id: 'transport', name: 'Transport', icon: '🚌' },
    { id: 'bills', name: 'Bills & Utilities', icon: '🧾' },
    { id: 'rent', name: 'Rent', icon: '🏠' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'health', name: 'Health', icon: '💊' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'fun', name: 'Entertainment', icon: '🎬' },
    { id: 'mobile', name: 'Mobile & Internet', icon: '📱' },
    { id: 'other', name: 'Other', icon: '✨' }
  ];

  function defaults() {
    var country = null, currency = 'INR';
    try {
      country = global.Currencies ? global.Currencies.detectCountry() : null;
      if (country && global.Currencies.currencyFor(country)) {
        currency = global.Currencies.currencyFor(country);
      } else {
        country = 'IN';
      }
    } catch (e) { country = 'IN'; }
    var lang = global.I18n ? global.I18n.detect() : 'en';
    return {
      v: 1,
      settings: {
        country: country,
        currency: currency,
        lang: lang,
        locale: global.Currencies ? global.Currencies.localeFor(country, lang) : 'en-IN',
        monthlyBudget: 0,
        cycleStartDay: 1,
        limitMode: 'adaptive',   // 'adaptive' | 'flat'
        nearBudgetPct: 80,
        alerts: true,
        theme: 'auto',           // 'auto' | 'light' | 'dark'
        onboarded: false
      },
      categories: DEFAULT_CATEGORIES.map(function (c) { return { id: c.id, name: c.name, icon: c.icon }; }),
      expenses: []               // {id, amount, categoryId, note, date:'YYYY-MM-DD', createdAt}
    };
  }

  var state = defaults();
  var storageOk = true;
  var listeners = [];

  function readRaw() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) return raw;
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        var legacy = global.localStorage.getItem(LEGACY_KEYS[i]);
        if (legacy) return legacy;
      }
      return null;
    } catch (e) {
      storageOk = false;
      return null;
    }
  }

  function migrate(data) {
    var base = defaults();
    var out = {
      v: 1,
      settings: Object.assign({}, base.settings, data.settings || {}),
      categories: Array.isArray(data.categories) && data.categories.length ? data.categories : base.categories,
      expenses: Array.isArray(data.expenses) ? data.expenses : []
    };
    // keep stored currency/country even if the browser locale now says otherwise
    out.settings.cycleStartDay = clampInt(out.settings.cycleStartDay, 1, 28, 1);
    out.settings.nearBudgetPct = clampInt(out.settings.nearBudgetPct, 50, 99, 80);
    out.settings.monthlyBudget = Math.max(0, Number(out.settings.monthlyBudget) || 0);
    if (global.Currencies) {
      out.settings.locale = global.Currencies.localeFor(out.settings.country, out.settings.lang);
    }
    out.expenses = out.expenses.filter(function (e) {
      return e && typeof e.date === 'string' && isFinite(Number(e.amount));
    }).map(function (e) {
      return {
        id: e.id || uid(),
        amount: Math.max(0, Number(e.amount) || 0),
        categoryId: e.categoryId || 'other',
        note: typeof e.note === 'string' ? e.note : '',
        date: e.date,
        createdAt: e.createdAt || Date.now()
      };
    });
    return out;
  }

  function clampInt(v, lo, hi, dflt) {
    var n = parseInt(v, 10);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function load() {
    var raw = readRaw();
    if (raw) {
      try { state = migrate(JSON.parse(raw)); }
      catch (e) { state = defaults(); }
    } else {
      state = defaults();
    }
    return state;
  }

  var saveTimer = null;
  function save(immediate) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    function write() {
      try {
        global.localStorage.setItem(KEY, JSON.stringify(state));
        storageOk = true;
      } catch (e) { storageOk = false; }
    }
    if (immediate) write(); else saveTimer = setTimeout(write, 120);
  }

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { /* a broken listener must not block the rest */ }
    });
  }

  function commit() { save(); emit(); }

  // ---- mutations -----------------------------------------------------------

  function setSettings(patch) {
    Object.assign(state.settings, patch);
    if (patch && patch.country) {
      var cur = global.Currencies && global.Currencies.currencyFor(patch.country);
      if (cur && !patch.currency) state.settings.currency = cur;
    }
    // money and dates follow both the country and the chosen language
    if (patch && (patch.country !== undefined || patch.lang !== undefined || patch.currency !== undefined)) {
      if (global.Currencies) {
        state.settings.locale = global.Currencies.localeFor(state.settings.country, state.settings.lang);
      }
    }
    state.settings.cycleStartDay = clampInt(state.settings.cycleStartDay, 1, 28, 1);
    state.settings.monthlyBudget = Math.max(0, Number(state.settings.monthlyBudget) || 0);
    commit();
  }

  function addExpense(exp) {
    var row = {
      id: uid(),
      amount: Math.max(0, Number(exp.amount) || 0),
      categoryId: exp.categoryId || 'other',
      note: (exp.note || '').trim().slice(0, 140),
      date: exp.date,
      createdAt: Date.now()
    };
    state.expenses.push(row);
    commit();
    return row;
  }

  function updateExpense(id, patch) {
    var row = state.expenses.filter(function (e) { return e.id === id; })[0];
    if (!row) return null;
    if (patch.amount !== undefined) row.amount = Math.max(0, Number(patch.amount) || 0);
    if (patch.categoryId !== undefined) row.categoryId = patch.categoryId;
    if (patch.note !== undefined) row.note = (patch.note || '').trim().slice(0, 140);
    if (patch.date !== undefined) row.date = patch.date;
    commit();
    return row;
  }

  function deleteExpense(id) {
    var before = state.expenses.length;
    state.expenses = state.expenses.filter(function (e) { return e.id !== id; });
    if (state.expenses.length !== before) commit();
  }

  function restoreExpense(row) {
    state.expenses.push(row);
    commit();
  }

  function addCategory(name, icon) {
    name = (name || '').trim().slice(0, 30);
    if (!name) return null;
    var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid();
    if (state.categories.some(function (c) { return c.id === id; })) id = id + '-' + uid().slice(-3);
    var cat = { id: id, name: name, icon: icon || '🏷️' };
    state.categories.push(cat);
    commit();
    return cat;
  }

  function deleteCategory(id) {
    if (state.categories.length <= 1) return;
    state.categories = state.categories.filter(function (c) { return c.id !== id; });
    var fallback = state.categories[0].id;
    state.expenses.forEach(function (e) { if (e.categoryId === id) e.categoryId = fallback; });
    commit();
  }

  function category(id) {
    return state.categories.filter(function (c) { return c.id === id; })[0] ||
           { id: id, name: 'Other', icon: '✨' };
  }

  function exportData() {
    return JSON.stringify({
      app: 'daily-expense-tracker', v: 1, exportedAt: new Date().toISOString(),
      settings: state.settings, categories: state.categories, expenses: state.expenses
    }, null, 2);
  }

  /** Import a JSON backup. mode: 'replace' | 'merge'. Returns {added, total}. */
  function importData(json, mode) {
    var data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data || typeof data !== 'object') throw new Error('Not a valid backup file');
    var incoming = migrate(data);
    if (mode === 'merge') {
      var seen = {};
      state.expenses.forEach(function (e) { seen[e.date + '|' + e.amount + '|' + e.note + '|' + e.categoryId] = true; });
      var added = 0;
      incoming.expenses.forEach(function (e) {
        var k = e.date + '|' + e.amount + '|' + e.note + '|' + e.categoryId;
        if (!seen[k]) { state.expenses.push(e); seen[k] = true; added++; }
      });
      incoming.categories.forEach(function (c) {
        if (!state.categories.some(function (x) { return x.id === c.id; })) state.categories.push(c);
      });
      commit();
      return { added: added, total: state.expenses.length };
    }
    state = incoming;
    commit();
    return { added: state.expenses.length, total: state.expenses.length };
  }

  function reset() {
    var keepSettings = Object.assign({}, state.settings);
    state = defaults();
    state.settings = keepSettings;
    state.settings.onboarded = true;
    commit();
  }

  function hardReset() {
    try { global.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    state = defaults();
    commit();
  }

  global.Store = {
    load: load,
    get: function () { return state; },
    settings: function () { return state.settings; },
    categories: function () { return state.categories; },
    expenses: function () { return state.expenses; },
    category: category,
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    setSettings: setSettings,
    addExpense: addExpense,
    updateExpense: updateExpense,
    deleteExpense: deleteExpense,
    restoreExpense: restoreExpense,
    addCategory: addCategory,
    deleteCategory: deleteCategory,
    exportData: exportData,
    importData: importData,
    reset: reset,
    hardReset: hardReset,
    save: save,
    storageOk: function () { return storageOk; },
    defaultCategories: function () { return DEFAULT_CATEGORIES.slice(); }
  };
})(window);
