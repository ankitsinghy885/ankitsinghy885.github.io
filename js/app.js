/* app.js - views, forms, sheets and wiring. */
(function (global) {
  'use strict';

  var Store = global.Store, Calc = global.Calc, Charts = global.Charts,
      Cur = global.Currencies, I18n = global.I18n;

  // ── tiny helpers ─────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function t(key, vars) { return I18n.t(key, vars); }
  function tc(key, n, vars) { return I18n.tc(key, n, vars); }
  function m(v, opts) { return Cur.money(v, Store.settings(), opts); }
  function mInt(v) { return Cur.money(v, Store.settings(), { digits: 0 }); }
  function fmtAxis(v) {
    return Math.abs(v) >= 10000
      ? Cur.money(v, Store.settings(), { compact: true })
      : Cur.money(v, Store.settings(), { digits: 0 });
  }
  function pct(v) { return Math.round(v) + '%'; }
  function catName(cat) { return I18n.catName(cat); }
  function catLabel(cat) { return cat.icon + ' ' + I18n.catName(cat); }
  function dayLabel(key, opts) { return Calc.dayLabel(key, Store.settings().locale, opts); }

  var ui = {
    tab: 'home',
    chartRange: 7,
    cycleOffset: 0,
    editingId: null,
    lastDayKey: Calc.todayKey(),
    limitHidden: true,          // the daily limit starts covered on every launch
    pickerTarget: 'settings',
    lastFocus: null
  };


  var ART = {
    // the hero card's backdrop: a quiet rising line
    wave: '<svg viewBox="0 0 400 140" preserveAspectRatio="none" focusable="false" aria-hidden="true">' +
      '<path d="M0 104 C 60 70, 110 118, 170 88 S 300 44, 400 72 L400 140 L0 140 Z" fill="rgba(255,255,255,0.07)"/>' +
      '<path d="M0 112 C 70 78, 120 126, 190 96 S 310 52, 400 80" fill="none" ' +
      'stroke="rgba(255,255,255,0.22)" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>',

    // onboarding: a phone showing a chart, a stack of coins, a rising arrow
    welcome: '<svg viewBox="0 0 280 150" focusable="false" aria-hidden="true">' +
      '<ellipse cx="140" cy="138" rx="104" ry="9" class="art-shadow"/>' +
      '<rect x="92" y="10" width="100" height="120" rx="16" class="art-soft"/>' +
      '<rect x="101" y="21" width="82" height="98" rx="10" class="art-surface"/>' +
      '<rect x="110" y="32" width="44" height="7" rx="3.5" class="art-line"/>' +
      '<rect x="110" y="45" width="28" height="6" rx="3" class="art-line-soft"/>' +
      '<rect x="110" y="86" width="14" height="22" rx="4" class="art-accent-soft"/>' +
      '<rect x="130" y="70" width="14" height="38" rx="4" class="art-accent"/>' +
      '<rect x="150" y="78" width="14" height="30" rx="4" class="art-accent-soft"/>' +
      '<g>' +
      '<ellipse cx="44" cy="124" rx="27" ry="9" class="art-gold-dark"/>' +
      '<ellipse cx="44" cy="115" rx="27" ry="9" class="art-gold"/>' +
      '<ellipse cx="44" cy="106" rx="27" ry="9" class="art-gold-dark"/>' +
      '<ellipse cx="44" cy="97" rx="27" ry="9" class="art-gold"/>' +
      '</g>' +
      '<path d="M206 104 L226 78 L242 92 L264 54" class="art-stroke"/>' +
      '<circle cx="264" cy="54" r="7" class="art-accent"/>' +
      '<path d="M214 30 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" class="art-accent-soft"/>' +
      '</svg>',

    // a receipt waiting for its first entry
    expenses: '<svg viewBox="0 0 130 100" focusable="false" aria-hidden="true">' +
      '<ellipse cx="65" cy="88" rx="44" ry="7" class="art-shadow"/>' +
      '<rect x="34" y="10" width="56" height="70" rx="9" class="art-soft"/>' +
      '<path d="M46 30 H78 M46 43 H70 M46 56 H62" class="art-stroke" stroke-width="3"/>' +
      '<circle cx="95" cy="66" r="15" class="art-accent"/>' +
      '<path d="M95 59 V73 M88 66 H102" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none"/>' +
      '</svg>',

    // nothing to chart yet
    chart: '<svg viewBox="0 0 130 100" focusable="false" aria-hidden="true">' +
      '<ellipse cx="65" cy="88" rx="44" ry="7" class="art-shadow"/>' +
      '<rect x="34" y="54" width="16" height="26" rx="5" class="art-accent-soft"/>' +
      '<rect x="57" y="36" width="16" height="44" rx="5" class="art-accent"/>' +
      '<rect x="80" y="46" width="16" height="34" rx="5" class="art-accent-soft"/>' +
      '<path d="M26 80 H104" class="art-stroke"/>' +
      '</svg>',

    // an empty month
    calendar: '<svg viewBox="0 0 130 100" focusable="false" aria-hidden="true">' +
      '<ellipse cx="65" cy="90" rx="42" ry="7" class="art-shadow"/>' +
      '<rect x="33" y="16" width="64" height="64" rx="10" class="art-soft"/>' +
      '<rect x="33" y="16" width="64" height="16" rx="8" class="art-accent"/>' +
      '<rect x="45" y="10" width="7" height="13" rx="3.5" class="art-accent"/>' +
      '<rect x="78" y="10" width="7" height="13" rx="3.5" class="art-accent"/>' +
      '<circle cx="47" cy="46" r="4" class="art-accent-soft"/>' +
      '<circle cx="65" cy="46" r="4" class="art-accent-soft"/>' +
      '<circle cx="83" cy="46" r="4" class="art-accent-soft"/>' +
      '<circle cx="47" cy="63" r="4" class="art-accent-soft"/>' +
      '<circle cx="65" cy="63" r="4" class="art-accent-soft"/>' +
      '<circle cx="83" cy="63" r="4" class="art-accent-soft"/>' +
      '</svg>',

    // set a target
    target: '<svg viewBox="0 0 120 80" focusable="false" aria-hidden="true">' +
      '<ellipse cx="54" cy="72" rx="34" ry="6" class="art-shadow"/>' +
      '<circle cx="54" cy="40" r="26" class="art-soft"/>' +
      '<circle cx="54" cy="40" r="16" class="art-accent-soft"/>' +
      '<circle cx="54" cy="40" r="6" class="art-accent"/>' +
      '<path d="M60 38 L88 15" class="art-stroke"/>' +
      '<path d="M97 8 L88.6 21.2 L81.2 12.1 Z" class="art-accent"/>' +
      '</svg>',

    // privacy badge
    shield: '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">' +
      '<path d="M12 2 L20 5 V11 C20 16 16.6 20.2 12 22 C7.4 20.2 4 16 4 11 V5 Z" class="art-accent-soft"/>' +
      '<path d="M12 4.3 L17.8 6.4 V11 C17.8 15 15.2 18.3 12 19.8 C8.8 18.3 6.2 15 6.2 11 V6.4 Z" class="art-surface"/>' +
      '<path d="M9.2 11.8 l2 2.2 3.6 -4.4" class="art-stroke" stroke-width="2"/>' +
      '</svg>'
  };

  // ---- small UI icons (24x24, drawn in the element's own colour) ---------
  var ICONS = {
    shield: '<path d="M12 2.6 L19.6 5.4 V11 c0 4.6-3.2 8.4-7.6 10.1C7.6 19.4 4.4 15.6 4.4 11 V5.4 Z" ' +
      'fill="currentColor" opacity="0.22"/>' +
      '<path d="M8.9 11.9 l2.2 2.3 4-4.6" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="8.6" fill="currentColor" opacity="0.22"/>' +
      '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M12 7.2 V12 l3.3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    pie: '<path d="M12 3.4 a8.6 8.6 0 1 0 8.6 8.6 H12 Z" fill="currentColor" opacity="0.22"/>' +
      '<path d="M13.6 2.6 a9.4 9.4 0 0 1 7.8 7.8 H13.6 Z" fill="currentColor"/>' +
      '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.5"/>',
    wallet: '<rect x="3.2" y="6" width="17.6" height="13" rx="3.4" fill="currentColor" opacity="0.22"/>' +
      '<path d="M3.2 9.4 h17.6" stroke="currentColor" stroke-width="1.6" opacity="0.6"/>' +
      '<path d="M16.4 12.4 h4.4 v3.6 h-4.4 a1.8 1.8 0 0 1 0 -3.6 Z" fill="currentColor"/>',
    target: '<circle cx="12" cy="12" r="8.6" fill="currentColor" opacity="0.18"/>' +
      '<circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="12" cy="12" r="1.9" fill="currentColor"/>',
    bars: '<rect x="4" y="12.4" width="4.2" height="7.6" rx="1.6" fill="currentColor" opacity="0.45"/>' +
      '<rect x="9.9" y="7.6" width="4.2" height="12.4" rx="1.6" fill="currentColor"/>' +
      '<rect x="15.8" y="10.2" width="4.2" height="9.8" rx="1.6" fill="currentColor" opacity="0.45"/>',
    receipt: '<path d="M5.4 3.6 h13.2 v16.8 l-2.6 -1.6 -2.2 1.6 -2.2 -1.6 -2.2 1.6 -2.2 -1.6 -1.8 1.6 Z" ' +
      'fill="currentColor" opacity="0.22"/>' +
      '<path d="M8.6 8.4 h6.8 M8.6 12 h4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };

  function icon(name) {
    if (!ICONS[name]) return '';
    return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function art(kind) { return ART[kind] || ''; }

  function paintArt() {
    $$('[data-art]').forEach(function (el) { el.innerHTML = art(el.getAttribute('data-art')); });
    $$('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon')); });
  }

  function emptyBox(kind, message) {
    return '<p class="empty">' + art(kind) + '<span>' + esc(message) + '</span></p>';
  }

  function setTileAccent(sel, accent) {
    var tile = $(sel) && $(sel).closest('.tile');
    if (!tile) return;
    if (accent) tile.dataset.accent = accent; else tile.removeAttribute('data-accent');
  }

  // ── toast ────────────────────────────────────────────────
  var toastTimer = null;
  function toast(message, actionLabel, onAction) {
    var wrap = $('#toastWrap');
    wrap.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'toast';
    var span = document.createElement('span');
    span.textContent = message;
    box.appendChild(span);
    if (actionLabel) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = actionLabel;
      btn.addEventListener('click', function () {
        wrap.innerHTML = '';
        if (onAction) onAction();
      });
      box.appendChild(btn);
    }
    wrap.appendChild(box);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { wrap.innerHTML = ''; }, actionLabel ? 6000 : 2600);
  }

  // ── theme & language ─────────────────────────────────────
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    $('#themeIcon').textContent = { auto: '◑', light: '☀', dark: '☾' }[theme] || '◑';
    var sel = $('#themeSelect');
    if (sel) sel.value = theme;
  }

  function applyLang(code, announce) {
    I18n.setLang(code);
    Cur.setDisplayLang(code);      // country & currency names follow the UI language
    pickerRows = null;
    I18n.apply();
    if (!$('#pickerSheet').hidden) renderPicker($('#pickerSearch').value);
    $('#langIcon').textContent = code === 'hi' ? 'हि' : code.toUpperCase();
    buildCycleStartOptions(true);
    buildLangControls();
    if (announce) toast(t('toast.language', { name: I18n.langName(code) }));
    render();
  }

  function buildLangControls() {
    var langs = I18n.languages();
    var cur = I18n.current();

    var sel = $('#langSelect');
    if (sel) {
      sel.innerHTML = langs.map(function (l) {
        return '<option value="' + esc(l.code) + '">' + esc(l.name) + '</option>';
      }).join('');
      sel.value = cur;
    }
    var box = $('#welcomeLangs');
    if (box) {
      box.innerHTML = langs.map(function (l) {
        return '<button type="button" class="lang-pill' + (l.code === cur ? ' is-on' : '') +
          '" data-lang="' + esc(l.code) + '">' + esc(l.name) + '</button>';
      }).join('');
    }
  }

  // ── sheets ───────────────────────────────────────────────
  function openSheet(id) {
    ui.lastFocus = document.activeElement;
    $('#scrim').hidden = false;
    var sheet = $(id);
    sheet.hidden = false;
    document.body.classList.add('is-locked');
    var first = sheet.querySelector('input:not([type="hidden"]), button.pick-item, select');
    if (first && !/iPhone|iPad|Android/i.test(navigator.userAgent)) {
      try { first.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }
  function closeSheets() {
    $$('.sheet').forEach(function (s) { s.hidden = true; });
    $('#scrim').hidden = true;
    document.body.classList.remove('is-locked');
    if (ui.lastFocus && ui.lastFocus.focus) {
      try { ui.lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
    ui.lastFocus = null;
  }

  // ── navigation ───────────────────────────────────────────
  function goto(tab) {
    ui.tab = tab;
    ['home', 'history', 'settings'].forEach(function (x) {
      $('#view-' + x).hidden = x !== tab;
    });
    $$('.tab').forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    $('#fab').hidden = tab === 'settings';
    global.scrollTo({ top: 0, behavior: 'auto' });
    render();
  }

  // ── header ───────────────────────────────────────────────
  function renderHeader() {
    var s = Store.settings();
    var range = Calc.cycleRange(Calc.today(), s.cycleStartDay);
    $('#cycleLabel').textContent = Calc.cycleLabel(range, s.cycleStartDay, s.locale);

    var country = s.country ? Cur.flagOf(s.country) : '';
    $('#currencyTopFlag').textContent = country || '🏳️';
    $('#currencyTopText').textContent = s.currency;
  }

  // ── alerts ───────────────────────────────────────────────
  function alertHtml(tone, icon, title, body) {
    return '<div class="alert" data-tone="' + tone + '">' +
      '<span class="alert-icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="alert-body"><strong>' + esc(title) + '</strong><span>' + body + '</span></span>' +
      '</div>';
  }

  function renderAlerts(sum) {
    var host = $('#alerts');
    var s = Store.settings();
    if (!s.alerts) { host.innerHTML = ''; return; }
    var out = [];

    if (sum.budget <= 0) {
      out.push(alertHtml('info', 'i', t('alert.setBudget.title'), esc(t('alert.setBudget.body'))));
    }

    if (sum.budget > 0 && sum.budgetStatus === 'critical') {
      out.push(alertHtml('critical', '!', t('alert.overBudget.title'),
        t('alert.overBudget.body', {
          over: esc(m(Math.abs(sum.remaining))),
          budget: esc(m(sum.budget)),
          days: esc(tc('count.day', sum.daysLeft))
        })));
    } else if (sum.budget > 0 && sum.budgetStatus === 'warning') {
      out.push(alertHtml('serious', '!', t('alert.nearBudget.title', { pct: pct(sum.budgetPct) }),
        t('alert.nearBudget.body', {
          left: esc(m(sum.remaining)),
          days: esc(tc('count.day', sum.daysLeft))
        })));
    }

    if (sum.limit > 0 && sum.dayStatus === 'over') {
      var tomorrow = sum.daysLeft > 1 ? Math.max(0, (sum.budget - sum.cycleTotal) / (sum.daysLeft - 1)) : 0;
      var body = t('alert.overLimit.body', {
        spent: esc(m(sum.todayTotal)), limit: esc(mInt(sum.limit))
      });
      if (sum.daysLeft > 1) body += t('alert.overLimit.tomorrow', { amount: esc(mInt(tomorrow)) });
      out.push(alertHtml('critical', '!', t('alert.overLimit.title'), body));
    } else if (sum.limit > 0 && sum.dayStatus === 'warning') {
      out.push(alertHtml('warning', '!', t('alert.nearLimit.title'),
        t('alert.nearLimit.body', { left: esc(mInt(sum.leftToday)), limit: esc(mInt(sum.limit)) })));
    }

    if (sum.budget > 0 && sum.budgetStatus === 'good' && sum.projected > sum.budget && sum.daysElapsed >= 3) {
      out.push(alertHtml('warning', '!', t('alert.pace.title'),
        t('alert.pace.body', {
          avg: esc(mInt(sum.avgPerDay)),
          projected: esc(mInt(sum.projected)),
          budget: esc(m(sum.budget))
        })));
    }

    host.innerHTML = out.slice(0, 3).join('');
  }

  // ── home ─────────────────────────────────────────────────
  function renderHome() {
    var state = Store.get();
    var s = state.settings;
    var sum = Calc.summary(state);

    renderAlerts(sum);

    $('#todaySpend').textContent = m(sum.todayTotal);
    var todayCount = state.expenses.filter(function (e) { return e.date === sum.todayKey; }).length;
    $('#todayMeta').textContent = todayCount
      ? tc('home.expensesToday', todayCount)
      : t('home.noExpensesToday');

    // the hero ring: one arc for today's spend against today's limit
    var wrap = $('#dayMeterWrap');
    var hero = $('#heroCard');
    var ring = $('#dayRing');
    var ringLen = 2 * Math.PI * 68;        // r = 68 in the hero SVG
    ring.style.strokeDasharray = ringLen.toFixed(1);
    if (sum.limit > 0) {
      hero.removeAttribute('data-nolimit');
      wrap.style.display = '';
      var shown = Math.max(0, Math.min(100, sum.dayPct));
      ring.style.strokeDashoffset = (ringLen * (1 - shown / 100)).toFixed(1);
      ring.dataset.state = sum.dayStatus === 'over' ? 'over' : (sum.dayStatus === 'warning' ? 'warning' : 'good');
      $('#dayMeterLeft').textContent = t('home.ofLimitToday', {
        spent: m(sum.todayTotal), limit: mInt(sum.limit)
      });
      $('#dayMeterRight').textContent = pct(sum.dayPct);
    } else {
      // no budget yet: leave the track empty rather than hiding the whole ring
      hero.setAttribute('data-nolimit', 'true');
      wrap.style.display = 'none';
      ring.style.strokeDashoffset = ringLen.toFixed(1);
      ring.dataset.state = 'good';
    }

    // the daily limit stays covered until it is tapped, so it is not on show
    // to whoever glances at the screen
    var limitNote = sum.budget <= 0 ? t('tile.setBudgetFirst')
      : (s.limitMode === 'flat'
        ? t('tile.divDays', { amount: m(sum.budget), n: sum.daysInCycle })
        : mInt(Math.max(0, sum.budget - sum.spentBeforeToday)) + ' ÷ ' +
          tc('count.dayLeft', sum.daysLeft));
    var limitEl = $('#tileLimit');
    var hidden = ui.limitHidden && sum.limit > 0;
    limitEl.textContent = sum.limit <= 0 ? '—'
      : (hidden ? Cur.symbolOf(s.currency) + '••••' : mInt(sum.limit));
    if (hidden) limitEl.dataset.masked = 'true'; else limitEl.removeAttribute('data-masked');
    $('#tileLimitNote').textContent = hidden ? t('tile.tapToShow') : limitNote;
    setTileAccent('#tileLimit', sum.limit > 0 ? 'brand' : '');
    var limitCard = $('#tileLimitCard');
    limitCard.setAttribute('aria-expanded', String(!hidden));
    limitCard.setAttribute('aria-label', t('tile.limit') + ' — ' +
      t(hidden ? 'a11y.showAmount' : 'a11y.hideAmount'));

    var leftEl = $('#tileLeftToday');
    if (sum.limit > 0) {
      leftEl.textContent = mInt(Math.abs(sum.leftToday));
      leftEl.dataset.tone = sum.leftToday < 0 ? 'bad' : 'good';
      $('#tileLeftNote').textContent = sum.leftToday < 0 ? t('tile.overLimit') : t('tile.stillSafe');
      setTileAccent('#tileLeftToday', sum.leftToday < 0 ? 'bad' : 'good');
    } else {
      leftEl.textContent = '—';
      leftEl.removeAttribute('data-tone');
      $('#tileLeftNote').textContent = '';
      setTileAccent('#tileLeftToday', '');
    }

    $('#tileMonth').textContent = m(sum.cycleTotal);
    $('#tileMonthNote').textContent = t('tile.monthNote', {
      count: tc('count.expense', sum.txCount), avg: mInt(sum.avgPerDay)
    });

    var remEl = $('#tileRemaining');
    if (sum.budget > 0) {
      remEl.textContent = m(Math.abs(sum.remaining));
      remEl.dataset.tone = sum.remaining < 0 ? 'bad' : 'good';
      $('#tileRemainingNote').textContent = (sum.remaining < 0 ? t('tile.overBudget') : '') +
        tc('count.dayLeft', sum.daysLeft);
      setTileAccent('#tileRemaining', sum.remaining < 0 ? 'bad' : 'good');
    } else {
      remEl.textContent = '—';
      remEl.removeAttribute('data-tone');
      $('#tileRemainingNote').textContent = t('tile.noBudget');
      setTileAccent('#tileRemaining', '');
    }

    $('#budgetTrack').style.display = sum.budget > 0 ? '' : 'none';
    var bFill = $('#budgetMeter');
    bFill.style.width = sum.budget > 0 ? Math.min(100, sum.budgetPct) + '%' : '0%';
    bFill.dataset.state = sum.budgetStatus === 'critical' ? 'critical'
      : (sum.budgetStatus === 'warning' ? 'warning' : 'good');
    $('#budgetMeterLeft').textContent = sum.budget > 0
      ? t('budget.ofBudget', { spent: m(sum.cycleTotal), budget: m(sum.budget) })
      : t('tile.noBudget');
    $('#budgetMeterRight').textContent = sum.budget > 0 ? pct(sum.budgetPct) : '';

    var facts = [
      [t('facts.daysGone'), t('facts.daysGoneValue', { a: sum.daysElapsed, b: sum.daysInCycle })],
      [t('facts.avgPerDay'), mInt(sum.avgPerDay)],
      [t('facts.dailyLimit', { mode: t(s.limitMode === 'flat' ? 'mode.flat' : 'mode.adaptive') }),
        sum.limit > 0 ? mInt(sum.limit) : '—']
    ];
    if (sum.budget > 0 && sum.daysElapsed >= 2) {
      facts.push([t('facts.projected'), mInt(sum.projected)]);
    }
    var budgetEmpty = $('#budgetEmpty');
    if (sum.budget > 0) {
      budgetEmpty.hidden = true;
      $('#budgetFacts').hidden = false;
      $('#budgetFacts').innerHTML = facts.map(function (f) {
        return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
      }).join('');
    } else {
      $('#budgetFacts').innerHTML = '';
      $('#budgetFacts').hidden = true;
      budgetEmpty.hidden = false;
      budgetEmpty.innerHTML = art('target') +
        '<span>' + esc(t('alert.setBudget.body')) + '</span>' +
        '<button type="button" class="btn btn-primary" data-goto="settings">' +
        esc(t('budget.set')) + '</button>';
    }

    renderDailyChart(sum);
    renderCategories(sum);
    renderRecent(state);
  }

  function renderDailyChart(sum) {
    var state = Store.get();
    var data = Calc.lastDays(state, ui.chartRange);
    var host = $('#chartDaily');
    var showEvery = ui.chartRange > 10 ? Math.ceil(ui.chartRange / 7) : 1;
    var plotData = data.map(function (d, i) {
      var label = ui.chartRange > 10
        ? ((data.length - 1 - i) % showEvery === 0 ? String(d.date.getDate()) : '')
        : d.short;
      return { key: d.key, total: d.total, short: label, isToday: d.isToday };
    });

    $('#chartSub').textContent = t(ui.chartRange === 7 ? 'chart.sub7' : 'chart.sub30');

    Charts.responsive(host, function () {
      Charts.columns(host, {
        data: plotData,
        // a wider card deserves a taller plot, otherwise the bars look lost
        height: host.clientWidth >= 420 ? 215 : 150,
        limit: sum.limit,
        fmt: function (v) { return m(v); },
        fmtAxis: fmtAxis,
        dayLabel: function (k) { return dayLabel(k); },
        ariaLabel: t('chart.aria', { n: ui.chartRange })
      });
    });

    var rows = data.slice().reverse().filter(function (d) { return d.total > 0; });
    $('#chartTable').innerHTML = rows.length
      ? '<table class="data"><thead><tr><th>' + esc(t('table.day')) + '</th><th class="num">' +
        esc(t('table.spent')) + '</th></tr></thead><tbody>' +
        rows.map(function (d) {
          return '<tr><td>' + esc(dayLabel(d.key)) + '</td><td class="num">' + esc(m(d.total)) + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="meta">' + esc(t('chart.empty')) + '</p>';
  }

  function renderCategories(sum) {
    var state = Store.get();
    var rows = Calc.categoryBreakdown(state, sum.range.startKey, sum.range.endKey).map(function (r) {
      return { id: r.id, name: catName(r), icon: r.icon, total: r.total, pct: r.pct };
    });
    var host = $('#catBars');
    $('#catTag').textContent = rows.length ? tc('count.category', rows.length) : '';
    if (!rows.length) {
      host.innerHTML = emptyBox('chart', t('cats.empty'));
      $('#catTableWrap').hidden = true;
      return;
    }
    $('#catTableWrap').hidden = false;
    var top = rows.slice(0, 6);
    Charts.rankedBars(host, { data: top, fmt: function (v) { return m(v); }, max: rows[0].total });
    if (rows.length > top.length) {
      var more = document.createElement('p');
      more.className = 'meta';
      more.textContent = t('cats.more', { count: tc('count.moreCategory', rows.length - top.length) });
      host.appendChild(more);
    }
    $('#catTable').innerHTML =
      '<table class="data"><thead><tr><th>' + esc(t('table.category')) + '</th><th class="num">' +
      esc(t('table.spent')) + '</th><th class="num">' + esc(t('table.share')) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + esc(r.icon + ' ' + r.name) + '</td><td class="num">' + esc(m(r.total)) +
          '</td><td class="num">' + pct(r.pct) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function expenseRowHtml(e, opts) {
    var cat = Store.category(e.categoryId);
    var sub = [];
    if (e.note) sub.push(catName(cat));
    if (opts && opts.withDate) sub.push(dayLabel(e.date));
    return '<button type="button" class="exp" data-edit="' + esc(e.id) + '">' +
      '<span class="exp-icon" aria-hidden="true">' + esc(cat.icon) + '</span>' +
      '<span class="exp-main">' +
        '<span class="exp-title">' + esc(e.note || catName(cat)) + '</span>' +
        (sub.length ? '<span class="exp-sub">' + esc(sub.join(' · ')) + '</span>' : '') +
      '</span>' +
      '<span class="exp-amt">' + esc(m(e.amount)) + '</span>' +
      '</button>';
  }

  function renderRecent(state) {
    var rows = state.expenses.slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }).slice(0, 6);
    $('#recentList').innerHTML = rows.length
      ? '<div class="exp-list">' + rows.map(function (e) {
          return expenseRowHtml(e, { withDate: true });
        }).join('') + '</div>'
      : emptyBox('expenses', t('recent.empty'));
  }

  // ── history ──────────────────────────────────────────────
  function renderHistory() {
    var state = Store.get();
    var s = state.settings;
    var range = Calc.cycleAt(Calc.today(), s.cycleStartDay, -ui.cycleOffset);
    var label = Calc.cycleLabel(range, s.cycleStartDay, s.locale);

    $('#cycLabel').textContent = label + (ui.cycleOffset === 0 ? t('hist.thisMonth') : '');
    try {
      var f = new Intl.DateTimeFormat(s.locale || undefined, { day: 'numeric', month: 'short' });
      $('#cycRange').textContent = t('hist.range', {
        from: f.format(range.start), to: f.format(range.end), days: tc('count.day', range.days)
      });
    } catch (e) { $('#cycRange').textContent = tc('count.day', range.days); }

    $('#cycNext').disabled = ui.cycleOffset <= 0;
    $('#cycPrev').disabled = ui.cycleOffset >= Calc.oldestCycleOffset(state) + 1;

    var total = Calc.rangeTotal(state.expenses, range.startKey, range.endKey);
    var days = Calc.cycleDays(state, range);
    var spentDays = days.filter(function (d) { return d.total > 0; });
    var peak = days.reduce(function (a, b) { return b.total > a.total ? b : a; }, { total: 0, key: null });
    var count = state.expenses.filter(function (e) {
      return e.date >= range.startKey && e.date <= range.endKey;
    }).length;
    var elapsed = ui.cycleOffset === 0
      ? Math.min(range.days, Calc.daysBetween(range.start, Calc.today()) + 1)
      : range.days;

    var facts = [
      [t('hist.total'), m(total)],
      [t('hist.count'), String(count)],
      [t('facts.avgPerDay'), mInt(elapsed > 0 ? total / elapsed : 0)],
      [t('hist.daysWithSpending'), t('facts.daysGoneValue', { a: spentDays.length, b: range.days })]
    ];
    if (peak.key) {
      facts.push([t('hist.highestDay'), m(peak.total) + ' · ' + dayLabel(peak.key, { plain: true })]);
    }
    if (s.monthlyBudget > 0) {
      facts.push([t('hist.budget'), m(s.monthlyBudget)]);
      facts.push([total > s.monthlyBudget ? t('hist.overBy') : t('hist.underBy'),
        m(Math.abs(s.monthlyBudget - total))]);
    }
    $('#histFacts').innerHTML = facts.map(function (f2) {
      return '<div><dt>' + esc(f2[0]) + '</dt><dd>' + esc(f2[1]) + '</dd></div>';
    }).join('');

    var sel = $('#histCat');
    var keep = sel.value;
    sel.innerHTML = '<option value="">' + esc(t('hist.allCats')) + '</option>' +
      state.categories.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(catLabel(c)) + '</option>';
      }).join('');
    sel.value = keep;

    var q = $('#histSearch').value.trim().toLowerCase();
    var catId = sel.value;
    var groups = Calc.groupByDay(state.expenses, range.startKey, range.endKey, function (e) {
      if (catId && e.categoryId !== catId) return false;
      if (!q) return true;
      var cat = Store.category(e.categoryId);
      return (e.note || '').toLowerCase().indexOf(q) >= 0 ||
             catName(cat).toLowerCase().indexOf(q) >= 0 ||
             cat.name.toLowerCase().indexOf(q) >= 0 ||
             String(e.amount).indexOf(q) >= 0;
    });

    var host = $('#historyList');
    if (!groups.length) {
      host.innerHTML = emptyBox(q || catId ? 'chart' : 'calendar',
        q || catId ? t('hist.noMatch') : t('hist.empty', { month: label }));
      return;
    }
    host.innerHTML = groups.map(function (g) {
      return '<section class="day-group">' +
        '<div class="day-head"><span>' + esc(dayLabel(g.key)) + '</span>' +
        '<b>' + esc(m(g.total)) + '</b></div>' +
        '<div class="exp-list">' + g.rows.map(function (e) { return expenseRowHtml(e); }).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  // ── settings ─────────────────────────────────────────────
  function dayOrdinal(d) {
    if (I18n.current() !== 'en') return String(d);
    var suffix = (d % 10 === 1 && d !== 11) ? 'st' : (d % 10 === 2 && d !== 12) ? 'nd'
      : (d % 10 === 3 && d !== 13) ? 'rd' : 'th';
    return d + suffix;
  }

  function buildCycleStartOptions(force) {
    var cs = $('#cycleStart');
    if (!cs) return;
    if (!force && cs.dataset.lang === I18n.current() && cs.options.length) return;
    var keep = cs.value;
    var html = '';
    for (var d = 1; d <= 30; d++) {
      var label = d === 1 ? t('set.calendarMonth', { day: dayOrdinal(1) }) : dayOrdinal(d);
      html += '<option value="' + d + '">' + esc(label) + '</option>';
    }
    cs.innerHTML = html;
    cs.dataset.lang = I18n.current();
    if (keep) cs.value = keep;
  }

  function countryLabel(s) {
    var country = Cur.countries().filter(function (c) { return c.country === s.country; })[0];
    var sym = Cur.symbolOf(s.currency);
    return country
      ? country.flag + '  ' + country.name + ' · ' + s.currency + ' ' + sym
      : s.currency + ' ' + sym;
  }

  function renderSettings() {
    var s = Store.settings();
    var label = countryLabel(s);
    $('#currencyBtnText').textContent = label;
    $('#welcomeCurrencyText').textContent = label;

    var sym = Cur.symbolOf(s.currency);
    $('#budgetPrefix').textContent = sym;
    $('#amountPrefix').textContent = sym;
    $('#welcomePrefix').textContent = sym;

    var bi = $('#budgetInput');
    if (document.activeElement !== bi) bi.value = s.monthlyBudget ? s.monthlyBudget : '';

    buildCycleStartOptions(false);
    $('#cycleStart').value = String(s.cycleStartDay);

    $$('input[name="limitMode"]').forEach(function (r) { r.checked = r.value === s.limitMode; });
    $('#nearPct').value = s.nearBudgetPct;
    $('#nearPctLabel').textContent = t('set.warnAt', { pct: s.nearBudgetPct + '%' });
    $('#alertsOn').checked = !!s.alerts;
    $('#themeSelect').value = s.theme;
    var ls = $('#langSelect');
    if (ls) ls.value = I18n.current();

    $('#catManage').innerHTML = Store.categories().map(function (c) {
      return '<span class="chip">' + esc(catLabel(c)) +
        '<button type="button" class="x" data-del-cat="' + esc(c.id) + '" aria-label="' +
        esc(t('a11y.deleteCat', { name: catName(c) })) + '">×</button></span>';
    }).join('');

    $('#storageNote').textContent = Store.storageOk()
      ? t('set.savedNote', { count: tc('count.expense', Store.expenses().length) })
      : t('set.storageBlocked');
  }

  // ── render switchboard ───────────────────────────────────
  var rafPending = false;
  function render() {
    if (rafPending) return;
    rafPending = true;
    global.requestAnimationFrame(function () {
      rafPending = false;
      renderHeader();
      if (ui.tab === 'home') renderHome();
      else if (ui.tab === 'history') renderHistory();
      renderSettings();
    });
  }

  // ── expense sheet ────────────────────────────────────────
  function quickSteps() {
    var exps = Store.expenses();
    var base;
    if (exps.length >= 5) {
      var amounts = exps.map(function (e) { return e.amount; })
        .filter(function (a) { return a > 0; })
        .sort(function (a, b) { return a - b; });
      var median = amounts[Math.floor(amounts.length / 2)] || 100;
      base = Math.pow(10, Math.round(Math.log10(median)));
    } else {
      var big = ['IDR', 'VND', 'KRW', 'JPY', 'LAK', 'IRR', 'UZS', 'PYG', 'COP', 'CLP', 'MMK', 'KHR',
        'LBP', 'GNF', 'MGA', 'RWF', 'UGX', 'TZS', 'KZT', 'NGN', 'SYP', 'ZWG', 'IQD', 'STN', 'SLE'];
      base = big.indexOf(Store.settings().currency) >= 0 ? 10000 : 100;
    }
    return [base / 2, base, base * 2, base * 5].map(function (v) { return Math.round(v); });
  }

  function renderQuickAmounts() {
    $('#quickAmounts').innerHTML = quickSteps().map(function (v) {
      return '<button type="button" class="quick" data-add="' + v + '">+' + esc(mInt(v)) + '</button>';
    }).join('');
  }

  function renderCatChips(selectedId) {
    $('#catChips').innerHTML = Store.categories().map(function (c) {
      return '<button type="button" class="chip' + (c.id === selectedId ? ' is-on' : '') +
        '" role="radio" aria-checked="' + (c.id === selectedId) + '" data-cat="' + esc(c.id) + '">' +
        esc(catLabel(c)) + '</button>';
    }).join('');
  }

  function deleteButton() {
    var actions = $('#expenseForm .sheet-actions');
    var existing = $('#deleteExpenseBtn');
    if (ui.editingId) {
      if (!existing) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'deleteExpenseBtn';
        btn.className = 'btn btn-danger';
        btn.addEventListener('click', function () {
          var row = Store.expenses().filter(function (e) { return e.id === ui.editingId; })[0];
          if (!row) return;
          var copy = Object.assign({}, row);
          Store.deleteExpense(row.id);
          closeSheets();
          toast(t('toast.deleted'), t('toast.undo'), function () { Store.restoreExpense(copy); });
        });
        actions.insertBefore(btn, actions.firstChild);
        existing = btn;
      }
      existing.textContent = t('sheet.delete');
      actions.classList.add('three');
    } else {
      if (existing) existing.remove();
      actions.classList.remove('three');
    }
  }

  function openExpenseSheet(id) {
    ui.editingId = id || null;
    var row = id ? Store.expenses().filter(function (e) { return e.id === id; })[0] : null;
    var cats = Store.categories();
    $('#sheetTitle').textContent = t(row ? 'sheet.edit' : 'sheet.add');
    $('#saveBtn').textContent = t(row ? 'sheet.saveChanges' : 'sheet.save');
    $('#amountInput').value = row ? row.amount : '';
    $('#noteInput').value = row ? row.note : '';
    $('#dateInput').value = row ? row.date : Calc.todayKey();
    $('#dateInput').max = Calc.todayKey();
    renderCatChips(row ? row.categoryId : (cats[0] && cats[0].id));
    renderQuickAmounts();

    var sum = Calc.summary(Store.get());
    $('#sheetHint').textContent = sum.limit > 0
      ? t('sheet.leftToday', { left: mInt(Math.max(0, sum.leftToday)), limit: mInt(sum.limit) })
      : '';
    deleteButton();
    openSheet('#expenseSheet');
    if (!row) {
      var a = $('#amountInput');
      try { a.focus({ preventScroll: true }); } catch (e) { a.focus(); }
    }
  }

  function submitExpense(ev) {
    ev.preventDefault();
    var amount = parseFloat($('#amountInput').value);
    if (!isFinite(amount) || amount <= 0) {
      $('#sheetHint').textContent = t('sheet.amountError');
      $('#amountInput').focus();
      return;
    }
    var chip = $('#catChips .chip.is-on');
    var payload = {
      amount: amount,
      categoryId: chip ? chip.dataset.cat : (Store.categories()[0] || {}).id,
      note: $('#noteInput').value,
      date: $('#dateInput').value || Calc.todayKey()
    };
    if (ui.editingId) {
      Store.updateExpense(ui.editingId, payload);
      toast(t('toast.updated'));
    } else {
      Store.addExpense(payload);
      var sum = Calc.summary(Store.get());
      if (sum.limit > 0 && sum.todayTotal > sum.limit) {
        toast(t('toast.savedLimitCrossed', { amount: mInt(sum.todayTotal - sum.limit) }));
      } else if (sum.limit > 0) {
        toast(t('toast.savedLeft', { amount: mInt(Math.max(0, sum.leftToday)) }));
      } else {
        toast(t('toast.saved'));
      }
    }
    ui.editingId = null;
    closeSheets();
  }

  // ── country / currency picker ────────────────────────────
  var pickerRows = null;
  function buildPickerRows() {
    if (pickerRows) return pickerRows;
    pickerRows = Cur.countries().map(function (c) {
      return { kind: 'country', country: c.country, flag: c.flag, name: c.name, nameEn: c.nameEn,
               currency: c.currency, symbol: c.symbol,
               currencyName: c.currencyName, currencyNameEn: c.currencyNameEn };
    }).concat(Cur.extraCurrencies().map(function (c) {
      return { kind: 'currency', country: '', flag: '🏳️', name: c.currencyName,
               nameEn: c.currencyNameEn, currency: c.currency, symbol: c.symbol,
               currencyName: c.currencyName, currencyNameEn: c.currencyNameEn };
    }));
    return pickerRows;
  }

  function renderPicker(query) {
    var s = Store.settings();
    var q = (query || '').trim().toLowerCase();
    var rows = buildPickerRows().filter(function (r) {
      if (!q) return r.kind === 'country';
      // match the translated name and the English one, so "india" works in Hindi too
      return r.name.toLowerCase().indexOf(q) >= 0 ||
             (r.nameEn || '').toLowerCase().indexOf(q) >= 0 ||
             r.currency.toLowerCase().indexOf(q) >= 0 ||
             r.currencyName.toLowerCase().indexOf(q) >= 0 ||
             (r.currencyNameEn || '').toLowerCase().indexOf(q) >= 0 ||
             r.country.toLowerCase() === q;
    });
    var list = $('#pickerList');
    var html = '';
    if (!q) html += '<li class="pick-group">' + esc(t('picker.allCountries')) + '</li>';
    html += rows.slice(0, 400).map(function (r) {
      var on = r.kind === 'country' ? r.country === s.country : (!s.country && r.currency === s.currency);
      return '<li><button type="button" class="pick-item' + (on ? ' is-on' : '') +
        '" role="option" aria-selected="' + on + '" data-cc="' + esc(r.country) + '" data-cur="' + esc(r.currency) + '">' +
        '<span class="pick-flag" aria-hidden="true">' + r.flag + '</span>' +
        '<span><span class="pick-name">' + esc(r.name) + '</span>' +
        '<span class="pick-cur">' + esc(r.currency + ' · ' + r.currencyName) + '</span></span>' +
        '<span class="pick-sym" aria-hidden="true">' + esc(r.symbol) + '</span>' +
        '</button></li>';
    }).join('');
    if (!rows.length) html = '<li class="pick-group">' + esc(t('picker.nothing')) + '</li>';
    list.innerHTML = html;
  }

  function openPicker(target) {
    ui.pickerTarget = target;
    if (target === 'welcome') $('#welcomeSheet').hidden = true;
    $('#pickerSearch').value = '';
    renderPicker('');
    openSheet('#pickerSheet');
  }

  function pickCurrency(cc, cur, message) {
    if (cc) Store.setSettings({ country: cc, currency: cur });
    else Store.setSettings({ currency: cur, country: null });
    closeSheets();
    if (ui.pickerTarget === 'welcome') openSheet('#welcomeSheet');
    toast(message || t('toast.currencySet', { cur: cur + ' ' + Cur.symbolOf(cur) }));
  }

  function detectCountry() {
    var cc = Cur.detectCountry();
    var cur = cc && Cur.currencyFor(cc);
    if (!cc || !cur) { toast(t('toast.detectFailed')); return; }
    var row = Cur.countries().filter(function (c) { return c.country === cc; })[0];
    pickCurrency(cc, cur, t('toast.detected', {
      country: (row ? row.name : cc), cur: cur + ' ' + Cur.symbolOf(cur)
    }));
  }

  // ── import / export ──────────────────────────────────────
  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(v) {
    var s = String(v === undefined || v === null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCsv() {
    var s = Store.settings();
    var rows = Store.expenses().slice().sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
    var out = [[t('sheet.date'), t('sheet.amount'), 'Currency', t('table.category'), t('sheet.note')]
      .map(csvCell).join(',')];
    rows.forEach(function (e) {
      out.push([e.date, e.amount, s.currency, catName(Store.category(e.categoryId)), e.note]
        .map(csvCell).join(','));
    });
    download('expenses-' + Calc.todayKey() + '.csv', '﻿' + out.join('\n'), 'text/csv;charset=utf-8');
    toast(t('toast.csv'));
  }

  // ── wiring ───────────────────────────────────────────────
  function wire() {
    $$('.tab').forEach(function (b) {
      b.addEventListener('click', function () { goto(b.dataset.tab); });
    });

    document.addEventListener('click', function (ev) {
      var go = ev.target.closest('[data-goto]');
      if (go) { goto(go.dataset.goto); return; }
      var edit = ev.target.closest('[data-edit]');
      if (edit) { openExpenseSheet(edit.dataset.edit); return; }
      var close = ev.target.closest('[data-close-sheet]');
      if (close) { closeSheets(); return; }
      var add = ev.target.closest('[data-add]');
      if (add) {
        var input = $('#amountInput');
        input.value = String((parseFloat(input.value) || 0) + Number(add.dataset.add));
        return;
      }
      var chip = ev.target.closest('[data-cat]');
      if (chip) { renderCatChips(chip.dataset.cat); return; }
      var lang = ev.target.closest('[data-lang]');
      if (lang) {
        Store.setSettings({ lang: lang.dataset.lang });
        applyLang(lang.dataset.lang, false);
        return;
      }
      var del = ev.target.closest('[data-del-cat]');
      if (del) {
        var cat = Store.category(del.dataset.delCat);
        var used = Store.expenses().filter(function (e) { return e.categoryId === cat.id; }).length;
        var msg = used
          ? t('confirm.deleteCatUsed', { name: catName(cat), count: tc('count.expense', used) })
          : t('confirm.deleteCat', { name: catName(cat) });
        if (global.confirm(msg)) Store.deleteCategory(cat.id);
        return;
      }
      var pick = ev.target.closest('.pick-item');
      if (pick) { pickCurrency(pick.dataset.cc, pick.dataset.cur); return; }
    });

    // tap (or Enter/Space) to uncover the daily limit, tap again to cover it
    var limitCard = $('#tileLimitCard');
    function toggleLimit() {
      ui.limitHidden = !ui.limitHidden;
      render();
    }
    limitCard.addEventListener('click', toggleLimit);
    limitCard.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        toggleLimit();
      }
    });

    $('#fab').addEventListener('click', function () { openExpenseSheet(null); });
    $('#scrim').addEventListener('click', closeSheets);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !$('#scrim').hidden) closeSheets();
    });
    $('#expenseForm').addEventListener('submit', submitExpense);

    // header: country/currency, language, theme
    $('#currencyTopBtn').addEventListener('click', function () { openPicker('settings'); });
    $('#langBtn').addEventListener('click', function () {
      var langs = I18n.languages();
      var idx = 0;
      langs.forEach(function (l, i) { if (l.code === I18n.current()) idx = i; });
      var next = langs[(idx + 1) % langs.length].code;
      Store.setSettings({ lang: next });
      applyLang(next, true);
    });
    $('#themeBtn').addEventListener('click', function () {
      var order = ['auto', 'light', 'dark'];
      var next = order[(order.indexOf(Store.settings().theme) + 1) % 3];
      Store.setSettings({ theme: next });
      applyTheme(next);
      toast(t('toast.theme', { name: t('theme.' + next) }));
    });
    $('#themeSelect').addEventListener('change', function () {
      Store.setSettings({ theme: this.value });
      applyTheme(this.value);
    });
    $('#langSelect').addEventListener('change', function () {
      Store.setSettings({ lang: this.value });
      applyLang(this.value, false);
    });

    $$('.seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        ui.chartRange = Number(b.dataset.range);
        $$('.seg-btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        render();
      });
    });

    $('#cycPrev').addEventListener('click', function () { ui.cycleOffset++; render(); });
    $('#cycNext').addEventListener('click', function () {
      if (ui.cycleOffset > 0) ui.cycleOffset--;
      render();
    });
    var searchTimer = null;
    $('#histSearch').addEventListener('input', function () {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(render, 160);
    });
    $('#histCat').addEventListener('change', render);

    $('#currencyBtn').addEventListener('click', function () { openPicker('settings'); });
    $('#welcomeCurrencyBtn').addEventListener('click', function () { openPicker('welcome'); });
    $('#detectBtn').addEventListener('click', detectCountry);
    var pickTimer = null;
    $('#pickerSearch').addEventListener('input', function () {
      var v = this.value;
      if (pickTimer) clearTimeout(pickTimer);
      pickTimer = setTimeout(function () { renderPicker(v); }, 120);
    });

    $('#budgetInput').addEventListener('input', function () {
      var v = parseFloat(this.value);
      Store.setSettings({ monthlyBudget: isFinite(v) && v > 0 ? v : 0 });
    });
    $('#cycleStart').addEventListener('change', function () {
      Store.setSettings({ cycleStartDay: parseInt(this.value, 10) });
      ui.cycleOffset = 0;
    });
    $$('input[name="limitMode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) Store.setSettings({ limitMode: r.value });
      });
    });
    $('#nearPct').addEventListener('input', function () {
      $('#nearPctLabel').textContent = t('set.warnAt', { pct: this.value + '%' });
      Store.setSettings({ nearBudgetPct: parseInt(this.value, 10) });
    });
    $('#alertsOn').addEventListener('change', function () {
      Store.setSettings({ alerts: this.checked });
    });

    $('#catForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = $('#catName').value;
      if (!name.trim()) return;
      Store.addCategory(name, $('#catIcon').value);
      $('#catName').value = '';
      $('#catIcon').value = '';
      toast(t('toast.catAdded'));
    });

    $('#exportJson').addEventListener('click', function () {
      download('expense-tracker-backup-' + Calc.todayKey() + '.json', Store.exportData());
      toast(t('toast.backup'));
    });
    $('#exportCsv').addEventListener('click', exportCsv);
    $('#importBtn').addEventListener('click', function () { $('#importFile').click(); });
    $('#importFile').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var merge = global.confirm(t('confirm.import'));
          var res = Store.importData(String(reader.result), merge ? 'merge' : 'replace');
          toast(merge ? t('toast.imported', { count: tc('count.expense', res.added) }) : t('toast.restored'));
        } catch (e) {
          toast(t('toast.importFail'));
        }
      };
      reader.readAsText(file);
      this.value = '';
    });
    $('#clearData').addEventListener('click', function () {
      if (!global.confirm(t('confirm.clear'))) return;
      Store.reset();
      toast(t('toast.cleared'));
    });

    $('#welcomeForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = parseFloat($('#welcomeBudget').value);
      Store.setSettings({ monthlyBudget: isFinite(v) && v > 0 ? v : 0, onboarded: true });
      closeSheets();
      toast(t('toast.allSet'));
    });
    $('#welcomeSkip').addEventListener('click', function () {
      Store.setSettings({ onboarded: true });
      closeSheets();
    });

    setInterval(checkDayRollover, 60000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) checkDayRollover();
    });
    global.addEventListener('storage', function (ev) {
      if (ev.key === 'expense-tracker.v1') {
        Store.load();
        applyLang(Store.settings().lang || I18n.detect(), false);
      }
    });
  }

  function checkDayRollover() {
    var k = Calc.todayKey();
    if (k !== ui.lastDayKey) {
      ui.lastDayKey = k;
      ui.cycleOffset = 0;
      render();
    }
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
  }

  // ── boot ─────────────────────────────────────────────────
  function boot() {
    Store.load();
    Store.subscribe(render);
    applyTheme(Store.settings().theme);
    I18n.setLang(Store.settings().lang || I18n.detect());
    Cur.setDisplayLang(I18n.current());
    I18n.apply();
    buildLangControls();
    buildCycleStartOptions(true);
    paintArt();
    $('#langIcon').textContent = I18n.current() === 'hi' ? 'हि' : I18n.current().toUpperCase();
    wire();
    goto('home');
    if (!Store.settings().onboarded) {
      setTimeout(function () { openSheet('#welcomeSheet'); }, 350);
    } else if (/[?&]action=add\b/.test(location.search)) {
      setTimeout(function () { openExpenseSheet(null); }, 200);
    }
    registerSW();
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
