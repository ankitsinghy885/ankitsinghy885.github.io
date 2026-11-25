/* ui-check.js — drive the real page in headless Chrome and assert the flows
   that only exist once the browser is involved: the warning before a currency
   change, and the choice before a backup overwrites anything.
 *
 *   node tools/ui-check.js
 *
 * check.js covers the logic; this covers the wiring. Exits non-zero on failure.
 */
'use strict';

var http = require('http'), fs = require('fs'), path = require('path');
var os = require('os'), cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var PORT = Number(process.env.UICHECK_PORT || 8247);
var BASE = 'http://127.0.0.1:' + PORT + '/';
var DEBUG = 9810 + (process.pid % 80);

var CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].filter(function (p) { return p && fs.existsSync(p); })[0];

var MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function serve() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var rel = decodeURIComponent(q.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      var f = path.join(ROOT, path.normalize(rel).replace(/^[\\/]+/, ''));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        r.writeHead(404); r.end('not found'); return;
      }
      r.writeHead(200, {
        'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(PORT, '127.0.0.1', function () { res(s); });
  });
}

function getJson(u) {
  return new Promise(function (res, rej) {
    http.get(u, function (r) {
      var b = '';
      r.on('data', function (c) { b += c; });
      r.on('end', function () { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function connect(url) {
  var ws = new WebSocket(url), n = 1, pend = new Map();
  var ready = new Promise(function (res) { ws.addEventListener('open', function () { res(); }); });
  ws.addEventListener('message', function (e) {
    var m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      var p = pend.get(m.id); pend.delete(m.id);
      if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
    }
  });
  return {
    send: function (method, params) {
      return ready.then(function () {
        var id = n++;
        ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
        return new Promise(function (res, rej) { pend.set(id, { res: res, rej: rej }); });
      });
    },
    close: function () { ws.close(); }
  };
}

// ── a device with a little history on it ────────────────────────────────────
var SEED = "(function(){var state={v:1,settings:{country:'IN',currency:'INR',lang:'en'," +
  "locale:'en-IN',monthlyBudget:20000,cycleStartDay:1,limitMode:'adaptive'," +
  "nearBudgetPct:80,alerts:true,theme:'light',onboarded:true}," +
  "categories:[{id:'food',name:'Food & Drinks',icon:'\\uD83C\\uDF7D\\uFE0F',budget:0}]," +
  "expenses:[{id:'a',amount:5000,categoryId:'food',note:'mine',date:'2026-11-05',createdAt:1}," +
  "{id:'b',amount:300,categoryId:'food',note:'mine too',date:'2026-11-06',createdAt:2}]};" +
  "localStorage.setItem('expense-tracker.v1',JSON.stringify(state));})();";

// ── changing currency ───────────────────────────────────────────────────────
var PICK_CURRENCY = '(' + function (answer) {
  var asked = [];
  window.confirm = function (msg) { asked.push(msg); return answer; };
  var before = Store.settings().currency;
  document.getElementById('currencyTopBtn').click();
  var rows = document.querySelectorAll('#pickerList button[data-cur]');
  var target = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].getAttribute('data-cur') !== before) { target = rows[i]; break; }
  }
  if (!target) return JSON.stringify({ error: 'no other currency offered' });
  var want = target.getAttribute('data-cur');
  target.click();
  return JSON.stringify({
    asked: asked, before: before, wanted: want,
    after: Store.settings().currency,
    sheetOpen: !document.getElementById('pickerSheet').hidden
  });
}.toString() + ')';

var PICK_CURRENCY_EMPTY = '(' + function () {
  var asked = [];
  window.confirm = function (msg) { asked.push(msg); return false; };
  Store.hardReset();
  Store.setSettings({ country: 'IN', currency: 'INR', onboarded: true });
  var before = Store.settings().currency;
  document.getElementById('currencyTopBtn').click();
  var rows = document.querySelectorAll('#pickerList button[data-cur]');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].getAttribute('data-cur') !== before) { rows[i].click(); break; }
  }
  return JSON.stringify({ asked: asked, before: before, after: Store.settings().currency });
}.toString() + ')()';

// ── restoring a backup ──────────────────────────────────────────────────────
var BACKUP_JSON = JSON.stringify({
  app: 'daily-expense-tracker', v: 1, exportedAt: '2026-11-18T10:00:00.000Z',
  settings: { currency: 'INR' }, categories: [],
  expenses: [
    { id: 'b1', date: '2026-11-12', amount: 450, categoryId: 'food', note: 'from backup' },
    { id: 'b2', date: '2026-11-14', amount: 1200, categoryId: 'food', note: 'from backup' }
  ]
});

function dropFile(body) {
  return '(function(){' +
    'var file = new File([' + JSON.stringify(body) + "], 'backup.json', { type: 'application/json' });" +
    'var dt = new DataTransfer(); dt.items.add(file);' +
    "var input = document.getElementById('importFile');" +
    'input.files = dt.files;' +
    "input.dispatchEvent(new Event('change', { bubbles: true }));" +
    '})();';
}

var SHEET_STATE = '(' + function () {
  var sheet = document.getElementById('importSheet');
  return JSON.stringify({
    open: !sheet.hidden,
    summary: document.getElementById('importSummary').textContent,
    replaceSub: document.getElementById('importReplaceSub').textContent,
    mine: Store.expenses().length
  });
}.toString() + ')()';

var CLICK_MERGE = '(' + function () {
  document.getElementById('importMerge').click();
  return JSON.stringify({
    total: Store.expenses().length,
    sheetOpen: !document.getElementById('importSheet').hidden,
    toast: (document.querySelector('#toastWrap .toast') || {}).textContent || ''
  });
}.toString() + ')()';

var CLICK_REPLACE = '(' + function () {
  document.getElementById('importReplace').click();
  var toast = document.querySelector('#toastWrap .toast');
  return JSON.stringify({
    total: Store.expenses().length,
    sheetOpen: !document.getElementById('importSheet').hidden,
    toast: toast ? toast.textContent : '',
    hasUndo: !!(toast && toast.querySelector('button'))
  });
}.toString() + ')()';

var CLICK_UNDO = '(' + function () {
  var btn = document.querySelector('#toastWrap .toast button');
  if (!btn) return JSON.stringify({ error: 'no undo offered' });
  btn.click();
  return JSON.stringify({
    total: Store.expenses().length,
    notes: Store.expenses().map(function (e) { return e.note; }).sort()
  });
}.toString() + ')()';

var CANCEL_SHEET = '(' + function () {
  document.querySelector('#importSheet [data-close-sheet]').click();
  return JSON.stringify({
    total: Store.expenses().length,
    sheetOpen: !document.getElementById('importSheet').hidden
  });
}.toString() + ')()';

var JUNK_FILE = '(' + function () {
  return JSON.stringify({
    sheetOpen: !document.getElementById('importSheet').hidden,
    total: Store.expenses().length,
    toast: (document.querySelector('#toastWrap .toast') || {}).textContent || ''
  });
}.toString() + ')()';

// ── harness ─────────────────────────────────────────────────────────────────
var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }

(async function () {
  if (!CHROME) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
  var srv = await serve();
  var profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-check-'));
  var chrome = cp.spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });

  try {
    for (var i = 0; i < 80; i++) {
      try { await getJson('http://127.0.0.1:' + DEBUG + '/json/version'); break; }
      catch (e) { await wait(250); }
    }
    var tabs = await getJson('http://127.0.0.1:' + DEBUG + '/json/list');
    var page = tabs.filter(function (t) { return t.type === 'page' && t.webSocketDebuggerUrl; })[0];
    if (!page) throw new Error('no page target to attach to');
    var cdp = connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });

    async function evaluate(expr) {
      var r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (r.exceptionDetails) {
        throw new Error((r.exceptionDetails.exception || {}).description || 'page threw');
      }
      return r.result.value;
    }

    /** Fresh page with the seed in place; returns a helper to run expressions. */
    async function fresh() {
      await cdp.send('Page.navigate', { url: BASE });
      await wait(900);
      await evaluate(SEED);
      // a service worker left over from another tool would serve a stale page
      await cdp.send('Runtime.evaluate', {
        expression: 'navigator.serviceWorker && navigator.serviceWorker.getRegistrations()' +
          '.then(function(rs){rs.forEach(function(r){r.unregister();});})',
        awaitPromise: true
      }).catch(function () { });
      await cdp.send('Page.navigate', { url: BASE });
      await wait(1800);
    }

    // ---- currency ---------------------------------------------------------
    section('changing currency');

    await fresh();
    var cancelled = JSON.parse(await evaluate(PICK_CURRENCY + '(false)'));
    ok('the user is warned before anything changes', cancelled.asked.length === 1,
      JSON.stringify(cancelled.asked));
    ok('the warning names the currency being left and the one being taken',
      /INR/.test(cancelled.asked[0] || '') &&
      cancelled.asked[0].indexOf(cancelled.wanted) >= 0, cancelled.asked[0]);
    ok('it says the amounts are not converted',
      /not convert/i.test(cancelled.asked[0] || ''), cancelled.asked[0]);
    ok('saying no leaves the currency alone', cancelled.after === cancelled.before,
      cancelled.before + ' -> ' + cancelled.after);
    ok('and closes the picker instead of leaving it open', cancelled.sheetOpen === false);

    await fresh();
    var accepted = JSON.parse(await evaluate(PICK_CURRENCY + '(true)'));
    ok('saying yes applies the new currency', accepted.after === accepted.wanted,
      accepted.before + ' -> ' + accepted.after + ', wanted ' + accepted.wanted);

    await fresh();
    var empty = JSON.parse(await evaluate(PICK_CURRENCY_EMPTY));
    ok('with nothing recorded there is nothing to warn about', empty.asked.length === 0,
      JSON.stringify(empty.asked));
    ok('so the currency changes straight away', empty.after !== empty.before,
      empty.before + ' -> ' + empty.after);

    // ---- restoring a backup ----------------------------------------------
    section('restoring a backup');

    await fresh();
    await evaluate(dropFile(BACKUP_JSON));
    await wait(600);
    var sheet = JSON.parse(await evaluate(SHEET_STATE));
    ok('a chosen file opens the choice sheet', sheet.open === true);
    ok('nothing is written just by picking the file', sheet.mine === 2, 'has ' + sheet.mine);
    ok('the sheet says what is in the file', /2 expenses/.test(sheet.summary), sheet.summary);
    ok('and what is already on the device', /2 expenses/.test(sheet.summary), sheet.summary);
    ok('and when the file was written', /18 Nov/.test(sheet.summary), sheet.summary);
    ok('replacing says an undo is kept', /undo/i.test(sheet.replaceSub), sheet.replaceSub);

    var cancelledSheet = JSON.parse(await evaluate(CANCEL_SHEET));
    ok('closing the sheet changes nothing', cancelledSheet.total === 2,
      'has ' + cancelledSheet.total);
    ok('…and it is no longer showing', cancelledSheet.sheetOpen === false);

    await fresh();
    await evaluate(dropFile(BACKUP_JSON));
    await wait(600);
    var merged = JSON.parse(await evaluate(CLICK_MERGE));
    ok('merging keeps what was here and adds the rest', merged.total === 4,
      'has ' + merged.total);
    ok('and the sheet closes behind it', merged.sheetOpen === false);
    ok('with a word about what happened', /2 expenses/.test(merged.toast), merged.toast);

    await fresh();
    await evaluate(dropFile(BACKUP_JSON));
    await wait(600);
    var replaced = JSON.parse(await evaluate(CLICK_REPLACE));
    ok('replacing leaves only the file', replaced.total === 2, 'has ' + replaced.total);
    ok('and offers a way back', replaced.hasUndo === true, replaced.toast);

    var undone = JSON.parse(await evaluate(CLICK_UNDO));
    ok('which brings the old data back', undone.total === 2, 'has ' + undone.total);
    ok('…the user\u2019s own, not the file\u2019s',
      undone.notes.join(',') === 'mine,mine too', undone.notes.join(','));

    // a file that is not a backup must be refused outright
    await fresh();
    await evaluate(dropFile('{"something":"else"}'));
    await wait(600);
    var junk = JSON.parse(await evaluate(JUNK_FILE));
    ok('a file that is not a backup never opens the sheet', junk.sheetOpen === false);
    ok('and leaves every expense where it was', junk.total === 2, 'has ' + junk.total);
    ok('while saying it could not be read', /could not read/i.test(junk.toast), junk.toast);

    cdp.close();
  } catch (err) {
    fail++;
    console.log('\n  FAIL harness -> ' + err.message);
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  chrome.kill();
  srv.close();
  process.exitCode = fail ? 1 : 0;
})();
