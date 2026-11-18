/* check.js - runs the app's logic (currencies, store, calc) outside the browser
   and asserts the numbers. Run: node tools/check.js   */
'use strict';
const path = require('path');

// ---- minimal browser stubs the logic modules expect ------------------------
global.window = global;
// node 22+ ships a read-only global navigator, so replace it outright
Object.defineProperty(global, 'navigator', {
  value: { language: 'en-IN', languages: ['en-IN'] },
  configurable: true, writable: true
});
const memory = {};
global.localStorage = {
  getItem: (k) => (k in memory ? memory[k] : null),
  setItem: (k, v) => { memory[k] = String(v); },
  removeItem: (k) => { delete memory[k]; }
};

global.document = { documentElement: { setAttribute: function () {} } };

require(path.join(__dirname, '..', 'js', 'i18n.js'));
require(path.join(__dirname, '..', 'js', 'currencies.js'));
require(path.join(__dirname, '..', 'js', 'store.js'));
require(path.join(__dirname, '..', 'js', 'calc.js'));

const { Currencies, Store, Calc, I18n } = global;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}
function eq(name, actual, expected) {
  ok(name, Object.is(actual, expected) || actual === expected, 'got ' + JSON.stringify(actual) + ', want ' + JSON.stringify(expected));
}
function near(name, actual, expected, tol) {
  ok(name, Math.abs(actual - expected) <= (tol || 0.01), 'got ' + actual + ', want ~' + expected);
}
function section(t) { console.log('\n' + t); }

// ---- currencies ------------------------------------------------------------
section('currencies');
eq('detects India from the en-IN locale', Currencies.detectCountryFromLocale(), 'IN');
eq('India uses INR', Currencies.currencyFor('IN'), 'INR');
eq('Japan uses JPY', Currencies.currencyFor('JP'), 'JPY');
eq('Brazil uses BRL', Currencies.currencyFor('BR'), 'BRL');
ok('country list covers 190+ countries', Currencies.countries().length >= 190,
  Currencies.countries().length + ' countries');
ok('every mapped currency is a real ISO-4217 code', (() => {
  const known = new Set(Intl.supportedValuesOf('currency'));
  const bad = Currencies.countries().filter((c) => !known.has(c.currency)).map((c) => c.country + ':' + c.currency);
  if (bad.length) console.log('     unknown:', bad.join(', '));
  return bad.length === 0;
})());
ok('every country resolves to a readable name', Currencies.countries().every((c) => c.name && c.name !== c.country));
eq('rupee symbol', Currencies.symbolOf('INR'), '₹');
eq('India flag emoji', Currencies.flagOf('IN'), '🇮🇳');

const inr = { currency: 'INR', locale: 'en-IN', country: 'IN' };
eq('whole rupees have no decimals', Currencies.money(1250, inr), '₹1,250');
eq('indian grouping (lakh)', Currencies.money(125000, inr), '₹1,25,000');
eq('paise shown only when present', Currencies.money(1250.5, inr), '₹1,250.50');
eq('compact form uses the local scale (lakh in en-IN)', Currencies.money(125000, inr, { compact: true }), '₹1.3L');
eq('compact form in en-US', Currencies.money(125000, { currency: 'USD', locale: 'en-US' }, { compact: true }), '$125K');
eq('yen formats for Japan', Currencies.money(1250, { currency: 'JPY', locale: 'en-JP' }), '¥1,250');
ok('every currency formats without throwing', Currencies.countries().every((c) => {
  try { Currencies.money(99, { currency: c.currency, locale: 'en-' + c.country }); return true; }
  catch (e) { console.log('     throws for', c.currency, e.message); return false; }
}));

// ---- location (time zone) detection ---------------------------------------
section('country from the device time zone');
const { execFileSync } = require('child_process');
function detectForTimeZone(tz) {
  const file = JSON.stringify(path.join(__dirname, '..', 'js', 'currencies.js'));
  const script =
    "global.window = global;" +
    "Object.defineProperty(global, 'navigator', { value: { language: 'en-US', languages: ['en-US'] }, configurable: true });" +
    "require(" + file + ");" +
    "console.log(window.Currencies.detectCountryFromTimeZone() || 'null');";
  return execFileSync(process.execPath, ['-e', script], {
    env: Object.assign({}, process.env, { TZ: tz }), encoding: 'utf8'
  }).trim();
}
eq('Asia/Kolkata -> India', detectForTimeZone('Asia/Kolkata'), 'IN');
eq('Asia/Calcutta (old name) -> India', detectForTimeZone('Asia/Calcutta'), 'IN');
eq('America/New_York -> United States', detectForTimeZone('America/New_York'), 'US');
eq('Asia/Tokyo -> Japan', detectForTimeZone('Asia/Tokyo'), 'JP');
eq('Europe/London -> United Kingdom', detectForTimeZone('Europe/London'), 'GB');
eq('Asia/Dubai -> United Arab Emirates', detectForTimeZone('Asia/Dubai'), 'AE');
eq('Australia/Sydney -> Australia', detectForTimeZone('Australia/Sydney'), 'AU');
eq('Asia/Kathmandu -> Nepal', detectForTimeZone('Asia/Kathmandu'), 'NP');
eq('Europe/Kyiv (renamed zone) -> Ukraine', detectForTimeZone('Europe/Kyiv'), 'UA');
eq('an unknown zone gives nothing, so the locale takes over', detectForTimeZone('UTC'), 'null');

// ---- translations ----------------------------------------------------------
section('languages');
eq('two languages offered', I18n.languages().length, 2);
eq('english is the default', I18n.current(), 'en');
ok('hindi has every english key', (() => {
  const en = I18n.keys('en'), hi = I18n.keys('hi');
  const missing = en.filter((k) => hi.indexOf(k) < 0);
  if (missing.length) console.log('     missing in hi: ' + missing.join(', '));
  return missing.length === 0;
})());
ok('no stray keys in hindi', (() => {
  const en = I18n.keys('en'), hi = I18n.keys('hi');
  const extra = hi.filter((k) => en.indexOf(k) < 0);
  if (extra.length) console.log('     extra in hi: ' + extra.join(', '));
  return extra.length === 0;
})());
eq('english string', I18n.t('home.spentToday'), 'Spent today');
I18n.setLang('hi');
eq('hindi string', I18n.t('home.spentToday'), 'आज का खर्च');
eq('variables are filled', I18n.t('toast.theme', { name: 'X' }), 'थीम: X');
eq('counted string', I18n.tc('count.day', 3), '3 दिन');
eq('default category translated', I18n.catName({ id: 'food', name: 'Food & Drinks' }),
  'खाना-पीना');
eq('custom category passes through', I18n.catName({ id: 'gym-x1', name: 'Gym' }), 'Gym');
eq('unknown key falls back to the key', I18n.t('no.such.key'), 'no.such.key');
I18n.setLang('en');
eq('english counted string', I18n.tc('count.day', 1), '1 day');
eq('english plural', I18n.tc('count.day', 5), '5 days');

// country names follow the UI language, but stay searchable in English
Currencies.setDisplayLang('hi');
const inHi = Currencies.countries().filter((c) => c.country === 'IN')[0];
eq('country name in hindi', inHi.name, 'भारत');
eq('english name kept for search', inHi.nameEn, 'India');
eq('currency name in hindi', inHi.currencyName, 'भारतीय रुपया');
ok('hindi list is sorted in hindi', (() => {
  const names = Currencies.countries().slice(0, 5).map((c) => c.name);
  const sorted = names.slice().sort((a, b) => a.localeCompare(b, 'hi'));
  return names.join('|') === sorted.join('|');
})());
Currencies.setDisplayLang('en');
eq('switches back to english', Currencies.countries().filter((c) => c.country === 'IN')[0].name, 'India');

// ---- budget cycles ---------------------------------------------------------
section('budget cycles');
const nov14 = new Date(2026, 10, 14);
let r = Calc.cycleRange(nov14, 1);
eq('calendar month start', r.startKey, '2026-11-01');
eq('calendar month end', r.endKey, '2026-11-30');
eq('calendar month length', r.days, 30);

r = Calc.cycleRange(nov14, 15);
eq('salary cycle starts last month', r.startKey, '2026-10-15');
eq('salary cycle ends the day before payday', r.endKey, '2026-11-14');
eq('salary cycle length', r.days, 31);

r = Calc.cycleRange(new Date(2026, 10, 15), 15);
eq('on payday a new cycle starts', r.startKey, '2026-11-15');
eq('…and ends before the next one', r.endKey, '2026-12-14');

r = Calc.cycleRange(new Date(2026, 0, 5), 20);
eq('december-to-january cycle rolls the year back', r.startKey, '2025-12-20');
eq('…and ends in january', r.endKey, '2026-01-19');

r = Calc.cycleRange(new Date(2028, 1, 10), 1);
eq('leap february has 29 days', r.days, 29);

eq('previous cycle via offset', Calc.cycleAt(nov14, 1, -1).startKey, '2026-10-01');
eq('two cycles back', Calc.cycleAt(nov14, 1, -2).startKey, '2026-09-01');

// ---- the dashboard numbers -------------------------------------------------
section('daily limit & summary');
Store.load();
Store.setSettings({ country: 'IN', currency: 'INR', monthlyBudget: 30000, cycleStartDay: 1, limitMode: 'adaptive' });

// 13 days before today at 1,000/day, then 1,500 spent today
for (let d = 1; d <= 13; d++) {
  Store.addExpense({ amount: 1000, categoryId: 'food', note: 'day ' + d, date: '2026-11-' + String(d).padStart(2, '0') });
}
Store.addExpense({ amount: 900, categoryId: 'transport', note: 'cab', date: '2026-11-14' });
Store.addExpense({ amount: 600, categoryId: 'food', note: 'dinner', date: '2026-11-14' });

let s = Calc.summary(Store.get(), nov14);
eq('month total', s.cycleTotal, 14500);
eq('today total', s.todayTotal, 1500);
eq('spent before today', s.spentBeforeToday, 13000);
eq('budget left', s.remaining, 15500);
eq('days in cycle', s.daysInCycle, 30);
eq('days gone', s.daysElapsed, 14);
eq('days left (today counts)', s.daysLeft, 17);
near('adaptive limit = (30000-13000)/17', s.limit, 1000);
near('flat limit = 30000/30', s.flatLimit, 1000);
near('left for today', s.leftToday, -500);
eq('today is over the limit', s.dayStatus, 'over');
near('budget used %', s.budgetPct, 48.33, 0.01);
eq('budget still healthy', s.budgetStatus, 'good');
near('average per day', s.avgPerDay, 1035.71, 0.01);
near('projected month end', s.projected, 31071.43, 0.02);
eq('expense count this month', s.txCount, 15);

Store.setSettings({ limitMode: 'flat' });
near('flat mode reports the flat limit', Calc.summary(Store.get(), nov14).limit, 1000);
Store.setSettings({ limitMode: 'adaptive' });

// overspending today shrinks what is left for the rest of the month
Store.addExpense({ amount: 10500, categoryId: 'shopping', note: 'phone', date: '2026-11-14' });
s = Calc.summary(Store.get(), nov14);
eq('month total after a big buy', s.cycleTotal, 25000);
near('today\'s limit does not move while today is spent', s.limit, 1000);
near('tomorrow has far less to spend', (s.budget - s.cycleTotal) / (s.daysLeft - 1), 312.5);
near('budget used %', s.budgetPct, 83.33, 0.01);
eq('near-budget warning fires past 80%', s.budgetStatus, 'warning');
Store.deleteExpense(Store.expenses().filter((e) => e.note === 'phone')[0].id);

// a budget overrun is reported, never hidden
Store.addExpense({ amount: 20000, categoryId: 'rent', note: 'rent', date: '2026-11-14' });
s = Calc.summary(Store.get(), nov14);
eq('over budget is flagged', s.budgetStatus, 'critical');
eq('remaining goes negative', s.remaining, -4500);
ok('left for today goes deep negative', s.leftToday < -19000, 'got ' + s.leftToday);
Store.deleteExpense(Store.expenses().filter((e) => e.note === 'rent')[0].id);

// once earlier days have eaten the whole budget, the limit floors at zero
Store.addExpense({ amount: 20000, categoryId: 'rent', note: 'rent', date: '2026-11-13' });
s = Calc.summary(Store.get(), nov14);
eq('limit cannot go below zero', s.limit, 0);
eq('…and the day reads as over', s.dayStatus, 'none');
Store.deleteExpense(Store.expenses().filter((e) => e.note === 'rent')[0].id);

// no budget set
Store.setSettings({ monthlyBudget: 0 });
s = Calc.summary(Store.get(), nov14);
eq('no budget -> no limit', s.limit, 0);
eq('no budget -> no status', s.budgetStatus, 'none');
eq('totals still work without a budget', s.cycleTotal, 14500);
Store.setSettings({ monthlyBudget: 30000 });

// ---- breakdowns ------------------------------------------------------------
section('history & breakdown');
const rows = Calc.categoryBreakdown(Store.get(), '2026-11-01', '2026-11-30');
eq('biggest category first', rows[0].id, 'food');
eq('food total', rows[0].total, 13600);
near('food share', rows[0].pct, 93.79, 0.01);
eq('transport second', rows[1].id, 'transport');
near('shares add up to 100', rows.reduce((a, b) => a + b.pct, 0), 100, 0.001);

const groups = Calc.groupByDay(Store.expenses(), '2026-11-01', '2026-11-30');
eq('newest day first', groups[0].key, '2026-11-14');
eq('day total', groups[0].total, 1500);
eq('both of today\'s expenses are grouped', groups[0].rows.length, 2);
eq('one group per day with spending', groups.length, 14);

const filtered = Calc.groupByDay(Store.expenses(), '2026-11-01', '2026-11-30', (e) => e.categoryId === 'transport');
eq('category filter', filtered.length, 1);
eq('…keeps only that row', filtered[0].rows[0].note, 'cab');

const week = Calc.lastDays(Store.get(), 7, nov14);
eq('7 day window', week.length, 7);
eq('window starts 6 days back', week[0].key, '2026-11-08');
eq('last point is today', week[6].isToday, true);
eq('today total in the series', week[6].total, 1500);

eq('day totals', Calc.dayTotal(Store.expenses(), '2026-11-14'), 1500);
eq('range totals', Calc.rangeTotal(Store.expenses(), '2026-11-01', '2026-11-07'), 7000);
eq('oldest cycle offset', Calc.oldestCycleOffset(Store.get()) >= 0, true);

// ---- editing, deleting, backup --------------------------------------------
section('edit, delete, backup');
const target = groups[0].rows.filter((e) => e.note === 'cab')[0];
Store.updateExpense(target.id, { amount: 1200, note: 'auto' });
const edited = Store.expenses().filter((e) => e.id === target.id)[0];
eq('amount edited', edited.amount, 1200);
eq('note edited', edited.note, 'auto');
eq('day total follows the edit', Calc.dayTotal(Store.expenses(), '2026-11-14'), 1800);

const before = Store.expenses().length;
Store.deleteExpense(target.id);
eq('delete removes one row', Store.expenses().length, before - 1);
Store.restoreExpense(edited);
eq('undo puts it back', Store.expenses().length, before);

const backup = Store.exportData();
const parsed = JSON.parse(backup);
eq('backup carries every expense', parsed.expenses.length, Store.expenses().length);
eq('backup carries the budget', parsed.settings.monthlyBudget, 30000);

Store.importData(backup, 'merge');
eq('merging the same backup adds nothing', Store.expenses().length, before);

Store.reset();
eq('reset clears expenses', Store.expenses().length, 0);
eq('…but keeps the budget', Store.settings().monthlyBudget, 30000);

Store.importData(backup, 'replace');
eq('restore brings the expenses back', Store.expenses().length, before);

// negative and junk input is clamped, not trusted
Store.addExpense({ amount: -50, categoryId: 'food', date: '2026-11-14' });
eq('negative amounts become zero', Store.expenses()[Store.expenses().length - 1].amount, 0);

// ---- persistence -----------------------------------------------------------
section('persistence');
Store.save(true);
const n = Store.expenses().length;
Store.load();
eq('state survives a reload', Store.expenses().length, n);
eq('settings survive a reload', Store.settings().monthlyBudget, 30000);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
