/* store-shots.js — regenerate the Play Store / manifest screenshots.
 *
 *   node tools/store-shots.js
 *
 * Writes six 1080x1920 PNGs into store/screenshots/. Viewport-sized shots
 * (not full-page), the way a phone actually shows the app.
 * Drives headless Chrome over the DevTools protocol; no dependencies.
 */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'store', 'screenshots');
var PORT = Number(process.env.SHOT_PORT || 8219);
var BASE = 'http://127.0.0.1:' + PORT + '/';
var DEBUG_PORT = 9900 + (process.pid % 90);

// Play Store phone screenshots: 1080x1920
var VIEW = { width: 540, height: 960, dsf: 2 };

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
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function serve() {
  return new Promise(function (resolve) {
    var srv = http.createServer(function (req, res) {
      var rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      var file = path.join(ROOT, path.normalize(rel).replace(/^[\\/]+/, ''));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, '127.0.0.1', function () { resolve(srv); });
  });
}

function connect(wsUrl) {
  var ws = new WebSocket(wsUrl);
  var next = 1;
  var pending = new Map();
  var ready = new Promise(function (res, rej) {
    ws.addEventListener('open', function () { res(); });
    ws.addEventListener('error', function (e) { rej(new Error('ws error: ' + (e && e.message))); });
  });
  ws.addEventListener('message', function (ev) {
    var msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    }
  });
  function send(method, params) {
    return ready.then(function () {
      var id = next++;
      ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
      return new Promise(function (resolve, reject) { pending.set(id, { resolve: resolve, reject: reject }); });
    });
  }
  return { send: send, close: function () { ws.close(); } };
}

function fetchJson(url) {
  return new Promise(function (resolve, reject) {
    http.get(url, function (res) {
      var body = '';
      res.on('data', function (c) { body += c; });
      res.on('end', function () { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// A month that looks lived-in: enough history for the chart and the category
// split, and a pace that trips the "crossing the budget" alert.
function seedFor(theme) {
  return '(function () {' +
    'function day(back){var d=new Date();d.setDate(d.getDate()-back);' +
    "return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}" +
    'var rows=[' +
    "['Chai','food',60,0]," +
    "['Vegetables','groceries',640,1],['Auto','transport',140,1]," +
    "['Lunch','food',320,2],['Milk & bread','groceries',185,2]," +
    "['Dinner out','food',1180,3],['Metro card','transport',400,3]," +
    "['Electricity','bills',1860,4],['Chai','food',80,4]," +
    "['Groceries','groceries',2240,5],['Notebook','education',180,5]," +
    "['Medicines','health',760,6],['Movie','fun',900,6]," +
    "['Petrol','transport',1200,7],['Breakfast','food',220,7]," +
    "['Shirt','shopping',1899,8]," +
    "['Phone recharge','mobile',299,9],['Lunch','food',260,9]," +
    "['Vegetables','groceries',520,10],['Auto','transport',160,10]," +
    "['Gym fees','health',1500,11]," +
    "['Dinner out','food',840,12],['Cab','transport',430,12]," +
    "['Groceries','groceries',1980,13]," +
    "['Internet bill','bills',1099,14],['Chai','food',70,14]," +
    "['Books','education',1240,15]," +
    "['Lunch','food',340,16],['Milk','groceries',70,16]," +
    "['Concert','fun',1600,17]" +
    '];' +
    "var cats=[['food','Food & Drinks','🍽️'],['groceries','Groceries','🛒']," +
    "['transport','Transport','🚌'],['bills','Bills & Utilities','🧾']," +
    "['rent','Rent','🏠'],['shopping','Shopping','🛍️'],['health','Health','💊']," +
    "['education','Education','📚'],['fun','Entertainment','🎬']," +
    "['mobile','Mobile & Internet','📱'],['other','Other','✨']];" +
    'var state={v:1,settings:{' +
    "country:'IN',currency:'INR',lang:'en',locale:'en-IN'," +
    'monthlyBudget:30000,cycleStartDay:1,' +
    "limitMode:'adaptive',nearBudgetPct:80,alerts:true," +
    "theme:'" + theme + "',onboarded:true}," +
    'categories:cats.map(function(c){return {id:c[0],name:c[1],icon:c[2]};}),' +
    'expenses:rows.map(function(r,i){return {id:"s"+i,note:r[0],categoryId:r[1],' +
    'amount:r[2],date:day(r[3]),createdAt:Date.now()-i*60000};})};' +
    "localStorage.setItem('expense-tracker.v1',JSON.stringify(state));" +
    '})();';
}

// name, theme, and what to do once the app has loaded
// the daily limit is covered until tapped; uncover it for the store shots so
// the listing shows a real figure rather than a row of dots
var REVEAL = "document.querySelector('#tileLimitCard').click();";

var SHOTS = [
  { file: '01-dashboard.png', theme: 'light', act: REVEAL },
  {
    file: '02-charts.png', theme: 'light',
    act: "document.querySelector('[data-range=\"30\"]').click();" +
      "document.querySelector('#chartDaily').closest('.card').scrollIntoView({block:'center'});"
  },
  { file: '03-add-expense.png', theme: 'light', act: "document.querySelector('#fab').click();" },
  { file: '04-history.png', theme: 'light', act: "document.querySelector('.tab[data-tab=\"history\"]').click();scrollTo(0,0);" },
  { file: '05-currencies.png', theme: 'light', act: "document.querySelector('#currencyTopBtn').click();" },
  { file: '06-dark-mode.png', theme: 'dark', act: REVEAL }
];

function run() {
  if (!CHROME) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  var srv, chrome, profile;

  return serve().then(function (s) {
    srv = s;
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'store-shot-'));
    chrome = cp.spawn(CHROME, [
      '--headless=new', '--remote-debugging-port=' + DEBUG_PORT, '--user-data-dir=' + profile,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'
    ], { stdio: 'ignore' });
    var tries = 0;
    function poll() {
      return fetchJson('http://127.0.0.1:' + DEBUG_PORT + '/json/version').catch(function () {
        if (++tries > 80) throw new Error('Chrome did not open its debug port');
        return wait(250).then(poll);
      });
    }
    return poll();
  }).then(function () {
    var tries = 0;
    function pick() {
      return fetchJson('http://127.0.0.1:' + DEBUG_PORT + '/json/list').then(function (tabs) {
        var page = tabs.filter(function (t) { return t.type === 'page' && t.webSocketDebuggerUrl; })[0];
        if (page) return page;
        if (++tries > 40) throw new Error('no page target to attach to');
        return wait(250).then(pick);
      });
    }
    return pick();
  }).then(function (page) {
    var cdp = connect(page.webSocketDebuggerUrl);
    var chain = cdp.send('Page.enable').then(function () { return cdp.send('Runtime.enable'); })
      .then(function () {
        return cdp.send('Emulation.setDeviceMetricsOverride', {
          width: VIEW.width, height: VIEW.height, deviceScaleFactor: VIEW.dsf, mobile: true
        });
      });

    SHOTS.forEach(function (shot) {
      chain = chain
        .then(function () { return cdp.send('Page.navigate', { url: BASE }); })
        .then(function () { return wait(800); })
        .then(function () { return cdp.send('Runtime.evaluate', { expression: seedFor(shot.theme) }); })
        .then(function () {
          return cdp.send('Runtime.evaluate', {
            expression: 'navigator.serviceWorker && navigator.serviceWorker.getRegistrations()' +
              '.then(function(rs){rs.forEach(function(r){r.unregister();});});',
            awaitPromise: true
          }).catch(function () { });
        })
        .then(function () { return cdp.send('Page.navigate', { url: BASE }); })
        .then(function () { return wait(1500); })
        .then(function () {
          if (!shot.act) return null;
          return cdp.send('Runtime.evaluate', { expression: shot.act }).then(function () { return wait(800); });
        })
        .then(function () {
          // viewport only - these stand in for a phone screen, not a whole page
          return cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        })
        .then(function (res) {
          fs.writeFileSync(path.join(OUT, shot.file), Buffer.from(res.data, 'base64'));
          console.log('  ' + shot.file + '  ' + (VIEW.width * VIEW.dsf) + 'x' + (VIEW.height * VIEW.dsf) + '  (' + shot.theme + ')');
        });
    });

    return chain.then(function () { cdp.close(); });
  }).then(function () {
    chrome.kill(); srv.close();
    console.log('done - ' + SHOTS.length + ' screenshots in store/screenshots/');
  }).catch(function (err) {
    console.error('failed: ' + err.message);
    if (chrome) chrome.kill();
    if (srv) srv.close();
    process.exitCode = 1;
  });
}

run();
