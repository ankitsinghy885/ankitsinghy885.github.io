/* shot.js — screenshot the app at a few widths, with demo data seeded.
 *
 *   node tools/shot.js                     all sizes
 *   node tools/shot.js phone               just one
 *
 * Drives headless Chrome over the DevTools protocol; no dependencies.
 * Writes PNGs into tools/shots/.
 */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(__dirname, 'shots');
var PORT = Number(process.env.SHOT_PORT || 8213);
var BASE = 'http://127.0.0.1:' + PORT + '/';
var DEBUG_PORT = 9333;

var CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].filter(function (p) { return p && fs.existsSync(p); })[0];

var SIZES = {
  phone: { width: 412, height: 915, dsf: 2 },
  tablet: { width: 820, height: 1180, dsf: 2 },
  desktop: { width: 1280, height: 900, dsf: 2 },
  wide: { width: 1912, height: 960, dsf: 1 }
};

var MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

// ── a tiny static server so localStorage and the service worker behave ──
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

// ── minimal CDP client ───────────────────────────────────────────────
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
      res.on('end', function () {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// demo data so the dashboard is not empty
var SEED = `(function () {
  function day(back) {
    var d = new Date(); d.setDate(d.getDate() - back);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var rows = [
    ['Vegetables', 'groceries', 320, 0], ['Petrol', 'transport', 400, 0],
    ['Chai', 'food', 60, 0], ['Lunch', 'food', 240, 1],
    ['Milk & bread', 'groceries', 185, 1], ['Metro card', 'transport', 200, 2],
    ['Dinner out', 'food', 980, 3], ['Phone recharge', 'mobile', 299, 3],
    ['Medicines', 'health', 450, 4], ['Movie', 'fun', 500, 4],
    ['Electricity', 'bills', 1240, 5], ['Auto', 'transport', 120, 5],
    ['Groceries', 'groceries', 1460, 6], ['Notebook', 'education', 180, 6],
    ['Shirt', 'shopping', 899, 8], ['Breakfast', 'food', 150, 9]
  ];
  var cats = [
    ['food', 'Food & Drinks', '🍽️'], ['groceries', 'Groceries', '🛒'],
    ['transport', 'Transport', '🚌'], ['bills', 'Bills & Utilities', '🧾'],
    ['rent', 'Rent', '🏠'], ['shopping', 'Shopping', '🛍️'],
    ['health', 'Health', '💊'], ['education', 'Education', '📚'],
    ['fun', 'Entertainment', '🎬'], ['mobile', 'Mobile & Internet', '📱'],
    ['other', 'Other', '✨']
  ];
  var state = {
    v: 1,
    settings: {
      country: 'IN', currency: 'INR', lang: 'en', locale: 'en-IN',
      monthlyBudget: 20000, cycleStartDay: 1, limitMode: 'adaptive',
      nearBudgetPct: 80, alerts: true, theme: 'dark', onboarded: true
    },
    categories: cats.map(function (c) { return { id: c[0], name: c[1], icon: c[2] }; }),
    expenses: rows.map(function (r, i) {
      return {
        id: 'seed' + i, note: r[0], categoryId: r[1], amount: r[2],
        date: day(r[3]), createdAt: Date.now() - i * 60000
      };
    })
  };
  localStorage.setItem('expense-tracker.v1', JSON.stringify(state));
})();`;

function run() {
  if (!CHROME) { console.error('No Chrome or Edge found. Set CHROME_PATH.'); process.exit(1); }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  var only = process.argv[2];
  var view = process.argv[3] || 'home';     // home | history | settings
  var names = only ? [only] : Object.keys(SIZES);
  names.forEach(function (n) { if (!SIZES[n]) { console.error('unknown size: ' + n); process.exit(1); } });
  if (['home', 'history', 'settings', 'welcome'].indexOf(view) < 0) {
    console.error('unknown view: ' + view); process.exit(1);
  }

  var srv, chrome, profile;

  return serve().then(function (s) {
    srv = s;
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-profile-'));
    // its own port and profile, so a run never collides with a browser that
    // is already open (or with a previous run that has not exited yet)
    DEBUG_PORT = 9400 + (process.pid % 500);
    chrome = cp.spawn(CHROME, [
      '--headless=new', '--remote-debugging-port=' + DEBUG_PORT, '--user-data-dir=' + profile,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'
    ], { stdio: 'ignore' });

    // wait for the debugging endpoint
    var tries = 0;
    function poll() {
      return fetchJson('http://127.0.0.1:' + DEBUG_PORT + '/json/version').catch(function () {
        if (++tries > 80) throw new Error('Chrome did not open its debug port');
        return wait(250).then(poll);
      });
    }
    return poll();
  }).then(function () {
    // the page target can take a moment to appear after the port opens
    var tries = 0;
    function pick() {
      return fetchJson('http://127.0.0.1:' + DEBUG_PORT + '/json/list').then(function (tabs) {
        var page = tabs.filter(function (t) {
          return t.type === 'page' && t.webSocketDebuggerUrl;
        })[0];
        if (page) return page;
        if (++tries > 40) throw new Error('no page target to attach to');
        return wait(250).then(pick);
      });
    }
    return pick();
  }).then(function (page) {
    var cdp = connect(page.webSocketDebuggerUrl);

    var chain = cdp.send('Page.enable').then(function () { return cdp.send('Runtime.enable'); });

    names.forEach(function (name) {
      var size = SIZES[name];
      chain = chain.then(function () {
        return cdp.send('Emulation.setDeviceMetricsOverride', {
          width: size.width, height: size.height,
          deviceScaleFactor: size.dsf, mobile: size.width < 600
        });
      }).then(function () {
        return cdp.send('Page.navigate', { url: BASE });
      }).then(function () { return wait(900); })
        .then(function () {
          // seed, drop any service worker cache, then reload into the real app.
          // 'welcome' wants a first-ever launch, so it clears instead of seeding.
          return cdp.send('Runtime.evaluate', {
            expression: view === 'welcome' ? 'localStorage.clear();' : SEED,
            awaitPromise: false
          });
        })
        .then(function () {
          return cdp.send('Runtime.evaluate', {
            expression: "navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});",
            awaitPromise: true
          }).catch(function () { });
        })
        .then(function () { return cdp.send('Page.navigate', { url: BASE }); })
        .then(function () { return wait(1400); })
        .then(function () {
          if (view === 'home' || view === 'welcome') return null;
          return cdp.send('Runtime.evaluate', {
            expression: "document.querySelector('.tab[data-tab=\"" + view + "\"]').click(); scrollTo(0,0);"
          }).then(function () { return wait(600); });
        })
        .then(function () {
          return cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        })
        .then(function (res) {
          var stem = name + (view === 'home' ? '' : '-' + view);
          var file = path.join(OUT, stem + '.png');
          fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
          console.log('  ' + stem + '  ' + size.width + 'x' + size.height + '  ->  tools/shots/' + stem + '.png');
        });
    });

    return chain.then(function () { cdp.close(); });
  }).then(function () {
    chrome.kill(); srv.close();
    console.log('done');
  }).catch(function (err) {
    console.error('failed: ' + err.message);
    if (chrome) chrome.kill();
    if (srv) srv.close();
    process.exitCode = 1;
  });
}

run();
