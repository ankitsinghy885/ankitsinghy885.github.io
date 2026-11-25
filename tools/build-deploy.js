/* build-deploy.js - copies only the files a live site needs into dist/.
   Upload/drag that one folder (Netlify Drop, GitHub Pages, any static host).
   Run: npm run deploy   */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

// everything the hosted app needs - and nothing else (no tools, no docs, no builds)
const FILES = [
  'index.html',
  'privacy.html',
  'manifest.webmanifest',
  'sw.js',
  'css/styles.css',
  'js/i18n.js',
  'js/currencies.js',
  'js/store.js',
  'js/calc.js',
  'js/charts.js',
  'js/app.js',
  'icons/icon-64.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'img/welcome-banner.jpg',
  '.well-known/assetlinks.json',
  // referenced by the manifest, so PWABuilder and the install prompt can read them
  'store/screenshots/01-dashboard.png',
  'store/screenshots/02-category-budgets.png',
  'store/screenshots/03-charts.png',
  'store/screenshots/04-add-expense.png',
  'store/screenshots/05-history.png',
  'store/screenshots/06-currencies.png'
];

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

rmrf(dist);

let bytes = 0;
const missing = [];
FILES.forEach((rel) => {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) { missing.push(rel); return; }
  const to = path.join(dist, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  bytes += fs.statSync(to).size;
});

if (missing.length) {
  console.error('Missing files, build incomplete:\n  ' + missing.join('\n  '));
  process.exit(1);
}

// the privacy page is a Play Store requirement - warn while it still has placeholders
const privacy = fs.readFileSync(path.join(dist, 'privacy.html'), 'utf8');
if (privacy.includes('REPLACE_WITH_')) {
  console.warn('WARNING: privacy.html still has REPLACE_WITH_ placeholders in it.');
}
const links = fs.readFileSync(path.join(dist, '.well-known/assetlinks.json'), 'utf8');
if (links.includes('REPLACE_WITH_')) {
  console.log('Note: .well-known/assetlinks.json is still a template - fill it in at the');
  console.log('      PWABuilder step (see PLAYSTORE.md), then deploy again.');
}

console.log('');
console.log('  dist/ ready - ' + FILES.length + ' files, ' + (bytes / 1024).toFixed(0) + ' KB');
console.log('  Upload this folder:  ' + dist);
console.log('');
