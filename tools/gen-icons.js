/* gen-icons.js - builds every app icon from images/logo.png.
   Pure Node: decodes the PNG, resamples it, writes the sizes the app needs.
   Run: node tools/gen-icons.js   */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const SOURCE = path.join(root, 'images', 'logo.png');

// ---- PNG writer ------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePng(file, width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  // Adaptive row filtering: try all five, keep the one that compresses best
  // (the usual "minimum sum of absolute differences" heuristic). On artwork
  // like this it roughly halves the file compared with no filtering.
  const stride = width * 4;
  const bpp = 4;
  const raw = Buffer.alloc((stride + 1) * height);
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);
  const cand = [Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride),
    Buffer.alloc(stride), Buffer.alloc(stride)];

  for (let y = 0; y < height; y++) {
    rgba.copy(line, 0, y * stride, y * stride + stride);
    const scores = [0, 0, 0, 0, 0];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      const v = line[x];
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const paeth = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      const vals = [v, (v - a) & 0xff, (v - b) & 0xff, (v - ((a + b) >> 1)) & 0xff, (v - paeth) & 0xff];
      for (let f = 0; f < 5; f++) {
        cand[f][x] = vals[f];
        scores[f] += vals[f] < 128 ? vals[f] : 256 - vals[f];
      }
    }
    let best = 0;
    for (let f = 1; f < 5; f++) if (scores[f] < scores[best]) best = f;
    raw[y * (stride + 1)] = best;
    cand[best].copy(raw, y * (stride + 1) + 1);
    line.copy(prev);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

// ---- PNG reader (8-bit, non-interlaced) ------------------------------------
function readPng(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('not a PNG: ' + file);

  let pos = 8;
  let width = 0, height = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  let palette = null, trns = null;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colour = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }

  if (depth !== 8) throw new Error('only 8-bit PNGs are supported (got ' + depth + ')');
  if (interlace !== 0) throw new Error('interlaced PNGs are not supported');

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colour];
  if (!channels) throw new Error('unsupported colour type ' + colour);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = channels;                 // bytes per pixel at 8-bit depth
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  // undo the per-scanline filters
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst - stride + x] : 0;
      const c = (x >= bpp && y > 0) ? out[dst - stride + x - bpp] : 0;
      const v = raw[src + x];
      let r;
      switch (filter) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          r = v + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c));
          break;
        }
        default: throw new Error('bad filter type ' + filter);
      }
      out[dst + x] = r & 0xff;
    }
  }

  // expand to RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * bpp, d = i * 4;
    if (colour === 0) { rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]; rgba[d + 3] = 255; }
    else if (colour === 2) { rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = 255; }
    else if (colour === 3) {
      const p = out[s] * 3;
      rgba[d] = palette[p]; rgba[d + 1] = palette[p + 1]; rgba[d + 2] = palette[p + 2];
      rgba[d + 3] = trns && out[s] < trns.length ? trns[out[s]] : 255;
    } else if (colour === 4) { rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]; rgba[d + 3] = out[s + 1]; }
    else { rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = out[s + 3]; }
  }
  return { width: width, height: height, rgba: rgba };
}

// ---- resampling ------------------------------------------------------------
/** Box filter: average every source pixel that falls in the target pixel. */
function resize(src, w, h) {
  const out = Buffer.alloc(w * h * 4);
  const sx = src.width / w, sy = src.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.min(src.height, Math.max(y0 + 1, Math.ceil((y + 1) * sy)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.min(src.width, Math.max(x0 + 1, Math.ceil((x + 1) * sx)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * src.width + xx) * 4;
          const al = src.rgba[i + 3] / 255;
          r += src.rgba[i] * al; g += src.rgba[i + 1] * al; b += src.rgba[i + 2] * al;
          a += src.rgba[i + 3];
          n++;
        }
      }
      const o = (y * w + x) * 4;
      const alpha = a / n;
      const k = alpha > 0 ? (n * 255) / a : 0;
      out[o] = Math.round(Math.min(255, (r / n) * k));
      out[o + 1] = Math.round(Math.min(255, (g / n) * k));
      out[o + 2] = Math.round(Math.min(255, (b / n) * k));
      out[o + 3] = Math.round(alpha);
    }
  }
  return { width: w, height: h, rgba: out };
}

/** Rounded-rectangle alpha mask, so the artwork's square corners come off. */
function roundCorners(img, radius) {
  const { width: w, height: h, rgba } = img;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let cover = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const px = x + (sx + 0.5) / 3, py = y + (sy + 0.5) / 3;
          const cx = Math.min(Math.max(px, radius), w - radius);
          const cy = Math.min(Math.max(py, radius), h - radius);
          const dx = px - cx, dy = py - cy;
          if (dx * dx + dy * dy <= radius * radius + 0.0001) cover++;
        }
      }
      const i = (y * w + x) * 4;
      rgba[i + 3] = Math.round(rgba[i + 3] * (cover / 9));
    }
  }
  return img;
}

/** Paste `img` centred on a solid background of `size` x `size`. */
function onBackground(img, size, inset, bg) {
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = 255;
  }
  const inner = Math.round(size * (1 - inset * 2));
  const scaled = resize(img, inner, inner);
  const off = Math.round((size - inner) / 2);
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4;
      const d = ((y + off) * size + (x + off)) * 4;
      const a = scaled.rgba[s + 3] / 255;
      out[d] = Math.round(scaled.rgba[s] * a + out[d] * (1 - a));
      out[d + 1] = Math.round(scaled.rgba[s + 1] * a + out[d + 1] * (1 - a));
      out[d + 2] = Math.round(scaled.rgba[s + 2] * a + out[d + 2] * (1 - a));
      out[d + 3] = 255;
    }
  }
  return { width: size, height: size, rgba: out };
}

/** The colour outside the artwork's rounded corner - what it sits on. */
function backdropColour(img) {
  const c = Math.round(img.width * 0.012);
  const corners = [[c, c], [img.width - 1 - c, c], [c, img.height - 1 - c],
    [img.width - 1 - c, img.height - 1 - c]];
  let r = 0, g = 0, b = 0;
  corners.forEach(function (p) {
    const i = (p[1] * img.width + p[0]) * 4;
    r += img.rgba[i]; g += img.rgba[i + 1]; b += img.rgba[i + 2];
  });
  return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
}

// ---- build -----------------------------------------------------------------
if (!fs.existsSync(SOURCE)) {
  console.error('Missing ' + SOURCE + ' - put the logo there first (see images/README.md).');
  process.exit(1);
}

const logo = readPng(SOURCE);
console.log('source: images/logo.png  ' + logo.width + 'x' + logo.height);
const bg = backdropColour(logo);
console.log('backdrop colour: rgb(' + bg.join(', ') + ')');

fs.mkdirSync(path.join(root, 'icons'), { recursive: true });
fs.mkdirSync(path.join(root, 'store'), { recursive: true });

function emit(file, img) {
  const bytes = writePng(path.join(root, file), img.width, img.height, img.rgba);
  console.log('wrote ' + file + '  ' + img.width + 'x' + img.height + '  ' + (bytes / 1024).toFixed(0) + ' KB');
}

// home-screen icons, plus a small one the app itself shows in its header
[64, 192, 512].forEach((size) => {
  emit('icons/icon-' + size + '.png', roundCorners(resize(logo, size, size), size * 0.225));
});

// maskable: Android crops to a circle, so the art sits inside the safe centre
emit('icons/icon-maskable-512.png', onBackground(logo, 512, 0.12, bg));

// Play Store listing icon: square and fully opaque, Play rounds it itself
emit('store/play-icon-512.png', onBackground(logo, 512, 0, bg));

// the logo at a size that is handy for a website or social profile
emit('store/logo-1024.png', resize(logo, 1024, 1024));
