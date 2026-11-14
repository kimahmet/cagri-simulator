// Uygulama ikonlarını oyundaki HERO sprite'ından üretir: node scripts/icon.mjs
import fs from 'node:fs'; import zlib from 'node:zlib';
const html = fs.readFileSync('www/index.html', 'utf8');
const HERO = eval(html.match(/const HERO = (\[[\s\S]*?\]);/)[1]);
const PAL = eval('(' + html.match(/const PAL = (\{[^}]*\})/)[1] + ')');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size), bg = hex('#2b1d4a');
  const crop = 24; // sadece üst 24 satır (kafa + kefiye)
  const s2 = Math.floor(size / crop), ox2 = Math.floor((size - 16 * s2) / 2);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) {
    const r = Math.floor((y) / s2), c = Math.floor((x - ox2) / s2), ch = HERO[r]?.[c];
    const col = ch && ch !== '.' && x >= ox2 ? hex(PAL[ch]) : bg, i = y * (size * 4 + 1) + 1 + x * 4;
    raw[i] = col[0]; raw[i + 1] = col[1]; raw[i + 2] = col[2]; raw[i + 3] = 255; } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [192, 512]) fs.writeFileSync(`www/icon-${s}.png`, png(s));
console.log('ikonlar yazıldı');
