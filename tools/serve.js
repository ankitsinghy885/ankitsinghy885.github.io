/* serve.js - tiny static server for local testing (no dependencies).
   Run: npm start      Then open http://localhost:5173
   Phone pe dekhna ho to niche jo Network URL chhapega wo kholo (same WiFi par). */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || process.argv[2] || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400).end('bad request');
    return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const file = path.resolve(root, '.' + urlPath);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403, { 'content-type': 'text/plain' }).end('forbidden');
    return;
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 - not found: ' + urlPath);
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(buf);
  });
});

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + port + ' already busy. Try: npm start -- 5174');
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

server.listen(port, () => {
  const lan = lanAddress();
  console.log('');
  console.log('  Expense Tracker is running');
  console.log('');
  console.log('  Local:    http://localhost:' + port);
  if (lan) console.log('  Network:  http://' + lan + ':' + port + '   <- phone pe yahi kholo (same WiFi)');
  console.log('');
  console.log('  Stop: Ctrl+C');
  console.log('');
});
