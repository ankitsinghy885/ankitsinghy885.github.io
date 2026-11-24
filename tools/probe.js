/* probe.js — ask the running page for the geometry of a few elements.
 *   node tools/probe.js 1912 "body,#main,#view-home,.tiles"
 * Prints each selector's box and a couple of computed values.
 */
'use strict';
var http = require('http'), fs = require('fs'), path = require('path');
var os = require('os'), cp = require('child_process');

var ROOT = path.join(__dirname, '..');
var PORT = 8231, BASE = 'http://127.0.0.1:' + PORT + '/';
var DEBUG = 9700 + (process.pid % 90);
var WIDTH = Number(process.argv[2] || 1912);
var SELECTORS = (process.argv[3] || 'body,#main,#view-home').split(',');

var CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].filter(function (p) { return p && fs.existsSync(p); })[0];

var MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };

function serve() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var rel = decodeURIComponent(q.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      var f = path.join(ROOT, path.normalize(rel).replace(/^[\\/]+/, ''));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(PORT, '127.0.0.1', function () { res(s); });
  });
}
function getJson(u) {
  return new Promise(function (res, rej) {
    http.get(u, function (r) { var b = ''; r.on('data', function (c) { b += c; }); r.on('end', function () { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function connect(url) {
  var ws = new WebSocket(url), n = 1, pend = new Map();
  var ready = new Promise(function (res) { ws.addEventListener('open', function () { res(); }); });
  ws.addEventListener('message', function (e) {
    var m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { var p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  });
  return { send: function (method, params) {
    return ready.then(function () { var id = n++; ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
      return new Promise(function (res, rej) { pend.set(id, { res: res, rej: rej }); }); });
  }, close: function () { ws.close(); } };
}

var EXPR = '(' + function (sels) {
  return sels.map(function (s) {
    var el = document.querySelector(s);
    if (!el) return s + '  -> NOT FOUND';
    var b = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    return s + '  x=' + Math.round(b.left) + ' w=' + Math.round(b.width) +
      '  max-width=' + cs.maxWidth + '  display=' + cs.display +
      '  cols=' + (cs.gridTemplateColumns || '-');
  }).join('\n');
}.toString() + ')(' + JSON.stringify(SELECTORS) + ')';

(async function () {
  var srv = await serve();
  var profile = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
  var chrome = cp.spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + DEBUG,
    '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  for (var i = 0; i < 60; i++) { try { await getJson('http://127.0.0.1:' + DEBUG + '/json/version'); break; } catch (e) { await wait(250); } }
  var tabs = await getJson('http://127.0.0.1:' + DEBUG + '/json/list');
  var page = tabs.filter(function (t) { return t.type === 'page' && t.webSocketDebuggerUrl; })[0];
  var cdp = connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: BASE });
  await wait(1500);
  var r = await cdp.send('Runtime.evaluate', { expression: EXPR, returnByValue: true });
  console.log('viewport ' + WIDTH + 'px\n' + r.result.value.split('\n').map(function (l) { return '  ' + l; }).join('\n'));
  cdp.close(); chrome.kill(); srv.close();
})();
