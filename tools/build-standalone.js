/* build-standalone.js - bundles the whole app into one standalone.html file.
   Handy for copying straight onto a phone (works from file:// too).
   Run: node tools/build-standalone.js   */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// NOTE: every replacement below passes a FUNCTION, never a string. A replacement
// string would treat "$$", "$&" and friends as patterns - and the app code is full
// of $$(...) helpers, which would silently become $(...) in the bundle.

// inline the stylesheet
html = html.replace(
  /<link rel="stylesheet" href="css\/styles\.css">/,
  () => '<style>\n' + read('css/styles.css') + '\n</style>'
);

// inline every script, in order
['js/i18n.js', 'js/currencies.js', 'js/store.js', 'js/calc.js', 'js/charts.js', 'js/app.js'].forEach((src) => {
  const tag = new RegExp('<script src="' + src.replace(/[.\/]/g, '\\$&') + '"><\\/script>');
  if (!tag.test(html)) throw new Error('could not find the script tag for ' + src);
  const code = read(src).replace(/<\/script>/gi, '<\\/script>');
  html = html.replace(tag, () => '<script>\n' + code + '\n</script>');
});

// a single file has no manifest or service worker to point at
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '');

// embed the icon so the browser tab still shows it
const icon = fs.readFileSync(path.join(root, 'icons', 'icon-192.png')).toString('base64');
html = html
  .replace(/<link rel="icon"[^>]*>/, () => '<link rel="icon" href="data:image/png;base64,' + icon + '">')
  .replace(/<link rel="apple-touch-icon"[^>]*>/, () => '<link rel="apple-touch-icon" href="data:image/png;base64,' + icon + '">');

// the first-run banner is a real file on the site; a single-file build has to
// carry it inline or the welcome screen shows a broken image
const banner = fs.readFileSync(path.join(root, 'img', 'welcome-banner.jpg')).toString('base64');
html = html.replace(/src="img\/welcome-banner\.jpg"/,
  () => 'src="data:image/jpeg;base64,' + banner + '"');

// the bundle must not still point at files that are not shipped with it
['<script src=', '<link rel="stylesheet"', 'src="img/'].forEach((frag) => {
  if (html.includes(frag)) throw new Error('standalone build still references ' + frag);
});
if (!html.includes('$$(')) throw new Error('the $$ helper was mangled during inlining');

const out = path.join(root, 'standalone.html');
fs.writeFileSync(out, html);
console.log('wrote standalone.html  ' + (fs.statSync(out).size / 1024).toFixed(1) + ' KB');
