// Minimal PNG decode / crop / encode toolkit (no deps beyond zlib).
import { readFileSync, writeFileSync } from 'fs';
import zlib from 'zlib';

const CH = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function decode(path) {
  const b = readFileSync(path);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not png');
  let i = 8, w = 0, h = 0, depth = 8, ct = 6, pal = null, trns = null;
  const idat = [];
  while (i < b.length) {
    const len = b.readUInt32BE(i);
    const type = b.toString('latin1', i + 4, i + 8);
    const data = b.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; ct = data[9];
      if (data[12] !== 0) throw new Error('interlaced png unsupported');
    } else if (type === 'PLTE') pal = Buffer.from(data);
    else if (type === 'tRNS') trns = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    i += 12 + len;
  }
  if (depth !== 8) throw new Error('bit depth ' + depth + ' unsupported');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const chan = CH[ct];
  const bpp = chan;
  const stride = w * bpp;
  const cur = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++];
    const row = raw.subarray(p, p + stride); p += stride;
    const off = y * stride, prev = off - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[off + x - bpp] : 0;
      const bb = y > 0 ? cur[prev + x] : 0;
      const c = (y > 0 && x >= bpp) ? cur[prev + x - bpp] : 0;
      let v = row[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += bb;
      else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) {
        const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c);
      }
      cur[off + x] = v & 255;
    }
  }
  // normalise to RGBA
  const out = Buffer.alloc(w * h * 4);
  for (let n = 0; n < w * h; n++) {
    let r, g, bl, al = 255;
    if (ct === 6) { r = cur[n * 4]; g = cur[n * 4 + 1]; bl = cur[n * 4 + 2]; al = cur[n * 4 + 3]; }
    else if (ct === 2) { r = cur[n * 3]; g = cur[n * 3 + 1]; bl = cur[n * 3 + 2]; }
    else if (ct === 0) { r = g = bl = cur[n]; }
    else if (ct === 4) { r = g = bl = cur[n * 2]; al = cur[n * 2 + 1]; }
    else { const ix = cur[n]; r = pal[ix * 3]; g = pal[ix * 3 + 1]; bl = pal[ix * 3 + 2]; if (trns && ix < trns.length) al = trns[ix]; }
    out[n * 4] = r; out[n * 4 + 1] = g; out[n * 4 + 2] = bl; out[n * 4 + 3] = al;
  }
  return { w, h, data: out };
}

export function crop(img, x0, y0, cw, ch) {
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const src = ((y0 + y) * img.w + x0) * 4;
    img.data.copy(out, y * cw * 4, src, src + cw * 4);
  }
  return { w: cw, h: ch, data: out };
}

// high-quality box/lanczos-lite downscale in premultiplied space
export function resize(img, nw, nh) {
  const out = Buffer.alloc(nw * nh * 4);
  const sx = img.w / nw, sy = img.h / nh;
  for (let y = 0; y < nh; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.ceil((y + 1) * sy));
    for (let x = 0; x < nw; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.ceil((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < Math.min(y1, img.h); yy++) {
        for (let xx = x0; xx < Math.min(x1, img.w); xx++) {
          const i = (yy * img.w + xx) * 4, al = img.data[i + 3] / 255;
          r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al;
          a += img.data[i + 3]; n++;
        }
      }
      const o = (y * nw + x) * 4, am = a / n;
      const inv = am > 0 ? 255 / a : 0;
      out[o] = Math.round(r * inv); out[o + 1] = Math.round(g * inv); out[o + 2] = Math.round(b * inv);
      out[o + 3] = Math.round(am);
    }
  }
  return { w: nw, h: nh, data: out };
}

// Apply the brand's feColorMatrix white-mark keying: rgb -> white, alpha = 3(r+g+b) - 7
export function whiteMark(img) {
  const d = Buffer.from(img.data);
  for (let n = 0; n < img.w * img.h; n++) {
    const i = n * 4;
    const s = (d[i] + d[i + 1] + d[i + 2]) / 255;
    const a = Math.max(0, Math.min(1, 3 * s - 7));
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
  }
  return { w: img.w, h: img.h, data: d };
}

function crcTable() {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
}
const CRCT = crcTable();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRCT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, cr]);
}

export function encode(img, path) {
  const { w, h, data } = img;
  // choose best filter per row (minimum sum of abs)
  const stride = w * 4;
  const rows = [];
  for (let y = 0; y < h; y++) {
    const off = y * stride;
    let best = null, bestScore = Infinity;
    for (let ft = 0; ft < 5; ft++) {
      const line = Buffer.alloc(stride + 1); line[0] = ft;
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= 4 ? data[off + x - 4] : 0;
        const b = y > 0 ? data[off - stride + x] : 0;
        const c = (y > 0 && x >= 4) ? data[off - stride + x - 4] : 0;
        let v;
        if (ft === 0) v = data[off + x];
        else if (ft === 1) v = data[off + x] - a;
        else if (ft === 2) v = data[off + x] - b;
        else if (ft === 3) v = data[off + x] - ((a + b) >> 1);
        else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = data[off + x] - ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)); }
        v &= 255; line[x + 1] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) { bestScore = score; best = line; }
    }
    rows.push(best);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  return png.length;
}
