/* calc.js - dates, budget cycles and every derived number the UI shows.
   All dates are local-time "YYYY-MM-DD" keys, so string compare == date compare. */
(function (global) {
  'use strict';

  var DAY_MS = 86400000;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseKey(key) {
    var p = String(key).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function todayKey() { return dateKey(today()); }

  function addDays(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function daysBetween(a, b) {
    // whole days from a to b (both local midnight), DST-safe via rounding
    return Math.round((b.getTime() - a.getTime()) / DAY_MS);
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  // ---- budget cycle -------------------------------------------------------

  /** The highest day of the month a cycle may start on. */
  var MAX_START_DAY = 30;

  /** How many days a month really has. Day 0 of the next month is the last
      day of this one, so February answers 28 or 29 on its own. */
  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /** The chosen start day inside one month, pulled back when that month is
      too short to have it: 30 lands on 28 February, or 29 in a leap year. */
  function cycleAnchor(year, monthIndex, startDay) {
    return new Date(year, monthIndex, Math.min(startDay, daysInMonth(year, monthIndex)));
  }

  function normalizeStartDay(startDay) {
    return clamp(parseInt(startDay, 10) || 1, 1, MAX_START_DAY);
  }

  /** First day of the budget cycle that contains `d`. */
  function cycleStart(d, startDay) {
    startDay = normalizeStartDay(startDay);
    var here = cycleAnchor(d.getFullYear(), d.getMonth(), startDay);
    if (d.getDate() >= here.getDate()) return here;
    return cycleAnchor(d.getFullYear(), d.getMonth() - 1, startDay);
  }

  /** Last day of the cycle that contains `d`. */
  function cycleEnd(d, startDay) {
    startDay = normalizeStartDay(startDay);
    var s = cycleStart(d, startDay);
    return addDays(cycleAnchor(s.getFullYear(), s.getMonth() + 1, startDay), -1);
  }

  /** The cycle `offset` cycles away from the one containing `ref` (0 = current). */
  function cycleAt(ref, startDay, offset) {
    startDay = normalizeStartDay(startDay);
    var s = cycleStart(ref || today(), startDay);
    // Step whole months from the day the user chose, not from `s` - a cycle
    // pulled back to 28 February must not carry that 28 into March.
    var moved = cycleAnchor(s.getFullYear(), s.getMonth() + (offset || 0), startDay);
    return cycleRange(moved, startDay);
  }

  function cycleRange(d, startDay) {
    var s = cycleStart(d, startDay);
    var e = cycleEnd(d, startDay);
    return {
      start: s, end: e,
      startKey: dateKey(s), endKey: dateKey(e),
      days: daysBetween(s, e) + 1
    };
  }

  function monthName(d, locale) {
    try {
      return new Intl.DateTimeFormat(locale || undefined, { month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return d.toDateString();
    }
  }

  /** "November 2026", or "15 Nov - 14 Dec 2026" when the cycle is not a calendar month. */
  function cycleLabel(range, startDay, locale) {
    if ((parseInt(startDay, 10) || 1) === 1) return monthName(range.start, locale);
    try {
      var short = new Intl.DateTimeFormat(locale || undefined, { day: 'numeric', month: 'short' });
      var longer = new Intl.DateTimeFormat(locale || undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      return short.format(range.start) + ' – ' + longer.format(range.end);
    } catch (e) {
      return monthName(range.start, locale);
    }
  }

  /** The span a cycle covers, spelled out: "1 Nov – 30 Nov 2026".
      The year is left off the first date when both ends share it. */
  function rangeText(range, locale) {
    try {
      var sameYear = range.start.getFullYear() === range.end.getFullYear();
      var short = new Intl.DateTimeFormat(locale || undefined, { day: 'numeric', month: 'short' });
      var full = new Intl.DateTimeFormat(locale || undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      return (sameYear ? short : full).format(range.start) + ' – ' + full.format(range.end);
    } catch (e) {
      return range.startKey + ' – ' + range.endKey;
    }
  }

  function dayLabel(key, locale, opts) {
    var d = parseKey(key);
    var tk = todayKey();
    var i18n = global.I18n;
    if (!opts || !opts.plain) {
      if (key === tk) return i18n ? i18n.t('day.today') : 'Today';
      if (key === dateKey(addDays(today(), -1))) return i18n ? i18n.t('day.yesterday') : 'Yesterday';
    }
    try {
      return new Intl.DateTimeFormat(locale || undefined,
        { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    } catch (e) { return key; }
  }

  // ---- aggregation --------------------------------------------------------

  function inRange(key, startKey, endKey) {
    return key >= startKey && key <= endKey;
  }

  function rangeTotal(expenses, startKey, endKey) {
    var sum = 0;
    for (var i = 0; i < expenses.length; i++) {
      if (inRange(expenses[i].date, startKey, endKey)) sum += expenses[i].amount;
    }
    return sum;
  }

  function dayTotal(expenses, key) { return rangeTotal(expenses, key, key); }

  function byDay(expenses, startKey, endKey) {
    var map = {};
    expenses.forEach(function (e) {
      if (inRange(e.date, startKey, endKey)) map[e.date] = (map[e.date] || 0) + e.amount;
    });
    return map;
  }

  /** Every number the dashboard needs for the cycle containing `ref`. */
  function summary(state, ref) {
    var s = state.settings;
    var exp = state.expenses;
    var now = ref || today();
    var range = cycleRange(now, s.cycleStartDay);
    var tKey = dateKey(now);
    var budget = Number(s.monthlyBudget) || 0;

    var cycleTotal = rangeTotal(exp, range.startKey, range.endKey);
    var todayTotal = dayTotal(exp, tKey);
    var spentBeforeToday = Math.max(0, cycleTotal - todayTotal);

    // Only count the part of the cycle that has already happened.
    var inCycle = tKey >= range.startKey && tKey <= range.endKey;
    var elapsed = inCycle ? daysBetween(range.start, now) + 1 : range.days;
    var daysLeft = inCycle ? daysBetween(now, range.end) + 1 : 0;

    var flatLimit = budget > 0 ? budget / range.days : 0;
    var adaptiveLimit = 0;
    if (budget > 0) {
      adaptiveLimit = daysLeft > 0 ? Math.max(0, (budget - spentBeforeToday) / daysLeft) : 0;
    }
    var limit = budget > 0 ? (s.limitMode === 'flat' ? flatLimit : adaptiveLimit) : 0;

    var remaining = budget - cycleTotal;              // can go negative
    var leftToday = limit > 0 ? limit - todayTotal : 0;
    var budgetPct = budget > 0 ? (cycleTotal / budget) * 100 : 0;
    var dayPct = limit > 0 ? (todayTotal / limit) * 100 : 0;
    var avgPerDay = elapsed > 0 ? cycleTotal / elapsed : 0;
    var projected = avgPerDay * range.days;

    var budgetStatus = 'none';
    if (budget > 0) {
      if (budgetPct >= 100) budgetStatus = 'critical';
      else if (budgetPct >= (s.nearBudgetPct || 80)) budgetStatus = 'warning';
      else budgetStatus = 'good';
    }
    var dayStatus = 'none';
    if (limit > 0) {
      if (dayPct > 100) dayStatus = 'over';
      else if (dayPct >= 80) dayStatus = 'warning';
      else dayStatus = 'good';
    }

    return {
      range: range,
      label: cycleLabel(range, s.cycleStartDay, s.locale),
      todayKey: tKey,
      inCycle: inCycle,
      budget: budget,
      cycleTotal: cycleTotal,
      todayTotal: todayTotal,
      spentBeforeToday: spentBeforeToday,
      remaining: remaining,
      limit: limit,
      flatLimit: flatLimit,
      adaptiveLimit: adaptiveLimit,
      leftToday: leftToday,
      budgetPct: budgetPct,
      dayPct: dayPct,
      daysInCycle: range.days,
      daysElapsed: elapsed,
      daysLeft: daysLeft,
      avgPerDay: avgPerDay,
      projected: projected,
      budgetStatus: budgetStatus,
      dayStatus: dayStatus,
      txCount: exp.filter(function (e) { return inRange(e.date, range.startKey, range.endKey); }).length
    };
  }

  /** Last `n` days ending today: [{key, total, isToday, label}] */
  function lastDays(state, n, ref) {
    var end = ref || today();
    var map = byDay(state.expenses, dateKey(addDays(end, -(n - 1))), dateKey(end));
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = addDays(end, -i);
      var k = dateKey(d);
      out.push({
        key: k,
        date: d,
        total: map[k] || 0,
        isToday: i === 0,
        short: shortDayLabel(d, state.settings.locale)
      });
    }
    return out;
  }

  function shortDayLabel(d, locale) {
    try {
      return new Intl.DateTimeFormat(locale || undefined, { weekday: 'short' }).format(d).slice(0, 3);
    } catch (e) { return String(d.getDate()); }
  }

  /** Per-day totals for a whole cycle: [{key, dayOfMonth, total}] */
  function cycleDays(state, range) {
    var map = byDay(state.expenses, range.startKey, range.endKey);
    var out = [];
    for (var i = 0; i < range.days; i++) {
      var d = addDays(range.start, i);
      var k = dateKey(d);
      out.push({ key: k, date: d, day: d.getDate(), total: map[k] || 0 });
    }
    return out;
  }

  /** Category totals for a range, biggest first. */
  function categoryBreakdown(state, startKey, endKey) {
    var totals = {};
    var grand = 0;
    state.expenses.forEach(function (e) {
      if (!inRange(e.date, startKey, endKey)) return;
      totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount;
      grand += e.amount;
    });
    return Object.keys(totals).map(function (id) {
      var c = global.Store.category(id);
      return {
        id: id, name: c.name, icon: c.icon, total: totals[id],
        pct: grand > 0 ? (totals[id] / grand) * 100 : 0
      };
    }).sort(function (a, b) { return b.total - a.total; });
  }

  /** Expenses in a range grouped by date, newest day first. */
  function groupByDay(expenses, startKey, endKey, filter) {
    var groups = {};
    expenses.forEach(function (e) {
      if (!inRange(e.date, startKey, endKey)) return;
      if (filter && !filter(e)) return;
      (groups[e.date] = groups[e.date] || []).push(e);
    });
    return Object.keys(groups).sort().reverse().map(function (k) {
      var rows = groups[k].sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      return {
        key: k,
        rows: rows,
        total: rows.reduce(function (s, e) { return s + e.amount; }, 0)
      };
    });
  }

  /** How many cycles back the oldest expense sits (0 when there is no data). */
  function oldestCycleOffset(state) {
    if (!state.expenses.length) return 0;
    var oldest = state.expenses.reduce(function (min, e) { return e.date < min ? e.date : min; }, state.expenses[0].date);
    var o = cycleStart(parseKey(oldest), state.settings.cycleStartDay);
    var c = cycleStart(today(), state.settings.cycleStartDay);
    return (c.getFullYear() - o.getFullYear()) * 12 + (c.getMonth() - o.getMonth());
  }

  global.Calc = {
    DAY_MS: DAY_MS,
    dateKey: dateKey,
    parseKey: parseKey,
    today: today,
    todayKey: todayKey,
    addDays: addDays,
    daysBetween: daysBetween,
    cycleStart: cycleStart,
    cycleEnd: cycleEnd,
    cycleRange: cycleRange,
    cycleAt: cycleAt,
    cycleLabel: cycleLabel,
    rangeText: rangeText,
    dayLabel: dayLabel,
    monthName: monthName,
    rangeTotal: rangeTotal,
    dayTotal: dayTotal,
    byDay: byDay,
    summary: summary,
    lastDays: lastDays,
    cycleDays: cycleDays,
    categoryBreakdown: categoryBreakdown,
    groupByDay: groupByDay,
    oldestCycleOffset: oldestCycleOffset
  };
})(window);
