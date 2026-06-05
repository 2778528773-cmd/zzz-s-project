const fs = require('fs');
const zlib = require('zlib');

const size = 1024;
const out = 'build/icon.png';

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function roundedRectAlpha(x, y, rect, radius) {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  const outside = Math.hypot(dx, dy);
  const cx = Math.max(rect.x + radius, Math.min(x, rect.x + rect.w - radius));
  const cy = Math.max(rect.y + radius, Math.min(y, rect.y + rect.h - radius));
  const cornerDistance = Math.hypot(x - cx, y - cy) - radius;
  const distance = Math.max(outside, cornerDistance);
  return Math.max(0, Math.min(1, 1 - distance / 2.2));
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const c1 = vx * wx + vy * wy;
  const c2 = vx * vx + vy * vy;
  const t = Math.max(0, Math.min(1, c1 / c2));
  const x = ax + t * vx;
  const y = ay + t * vy;
  return Math.hypot(px - x, py - y);
}

function checkAlpha(x, y, width) {
  const d1 = distanceToSegment(x, y, 336, 520, 462, 646);
  const d2 = distanceToSegment(x, y, 462, 646, 724, 386);
  const d = Math.min(d1, d2);
  return Math.max(0, Math.min(1, 1 - (d - width / 2) / 3));
}

fs.mkdirSync('build', { recursive: true });

const raw = Buffer.alloc((size * 4 + 1) * size);
const rect = { x: 160, y: 142, w: 704, h: 704 };
let offset = 0;

for (let y = 0; y < size; y += 1) {
  raw[offset] = 0;
  offset += 1;

  for (let x = 0; x < size; x += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    const baseAlpha = roundedRectAlpha(x, y, rect, 184);
    if (baseAlpha > 0) {
      const t = (x * 0.34 + y * 0.66) / size;
      r = mix(95, 51, t);
      g = mix(186, 132, t);
      b = mix(255, 233, t);
      a = 255 * baseAlpha;

      const shine = Math.max(0, 1 - Math.hypot((x - 330) / 360, (y - 260) / 260));
      r = mix(r, 188, shine * 0.24);
      g = mix(g, 224, shine * 0.22);
      b = mix(b, 255, shine * 0.18);

      const inner = roundedRectAlpha(x, y, { x: 182, y: 164, w: 660, h: 660 }, 166);
      const border = Math.max(0, baseAlpha - inner);
      r = mix(r, 255, border * 0.22);
      g = mix(g, 255, border * 0.22);
      b = mix(b, 255, border * 0.22);

      const glass = Math.max(0, 1 - Math.hypot((x - 456) / 470, (y - 396) / 360));
      r = mix(r, 255, glass * 0.1);
      g = mix(g, 255, glass * 0.1);
      b = mix(b, 255, glass * 0.1);
    }

    const shadow = checkAlpha(x, y - 20, 92);
    if (shadow > 0) {
      r = mix(r, 14, shadow * 0.24);
      g = mix(g, 16, shadow * 0.24);
      b = mix(b, 20, shadow * 0.24);
      a = Math.max(a, 255 * shadow * 0.18);
    }

    const check = checkAlpha(x, y, 82);
    if (check > 0) {
      const t = (x - 320) / 420;
      r = mix(r, 255, check);
      g = mix(g, 255, check);
      b = mix(b, 255, check);
      a = Math.max(a, 255 * check);
    }

    const checkHighlight = checkAlpha(x, y - 2, 28);
    if (checkHighlight > 0) {
      r = mix(r, 255, checkHighlight * 0.22);
      g = mix(g, 255, checkHighlight * 0.22);
      b = mix(b, 255, checkHighlight * 0.22);
    }

    raw[offset] = clamp(r);
    raw[offset + 1] = clamp(g);
    raw[offset + 2] = clamp(b);
    raw[offset + 3] = clamp(a);
    offset += 4;
  }
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync(out, png);
console.log(out);
