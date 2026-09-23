import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, drawFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with row filter 0
  const rowStride = 1 + width * 4;
  const raw = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    raw[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Tea Icons
function drawTeaIcon(x, y, width, height, isMaskable = false) {
  // Normalize to -1..1
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background
  let r = 146, g = 64, b = 14, a = 255; // #92400e (amber-800)

  // Gradient towards warm dark amber
  const grad = (ny + 1) / 2;
  r = Math.floor(180 - grad * 60);
  g = Math.floor(83 - grad * 35);
  b = Math.floor(9 - grad * 5);

  if (!isMaskable) {
    // Rounded squircle background for standard icons
    const cornerRadius = 0.88;
    const p = 4; // superellipse
    const superDist = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
    if (superDist > Math.pow(cornerRadius, p)) {
      return [0, 0, 0, 0]; // transparent
    }
  }

  // Draw Tea Leaf & Gaiwan in center safe zone (scale within 0.6)
  const sx = nx * 1.5;
  const sy = (ny + 0.1) * 1.5;

  // Gaiwan Bowl: sy between 0.0 and 0.5, parabola
  const inBowl = sy >= 0.05 && sy <= 0.45 && Math.abs(sx) <= (0.6 - (sy - 0.05) * 0.4);
  // Gaiwan Lid: sy between -0.25 and 0.05
  const inLid = sy >= -0.2 && sy <= 0.05 && Math.abs(sx) <= (0.65 - Math.abs(sy + 0.05) * 1.2);
  // Gaiwan Saucer: sy between 0.45 and 0.58
  const inSaucer = sy >= 0.45 && sy <= 0.55 && Math.abs(sx) <= 0.75;
  // Lid Knob:
  const inKnob = sy >= -0.32 && sy <= -0.2 && Math.abs(sx) <= 0.15;

  // Steam/Aroma curve (leaf shape above cup):
  const leafX = sx;
  const leafY = sy + 0.55;
  const inLeaf = (leafY >= -0.35 && leafY <= 0.35) && (Math.abs(leafX) <= 0.3 * (1 - Math.pow(leafY / 0.35, 2)));

  if (inLeaf) {
    // Golden amber / jade leaf
    return [245, 158, 11, 255]; // amber-500
  }

  if (inBowl || inLid || inSaucer || inKnob) {
    // Porcelain white/cream cup
    return [254, 252, 248, 255]; // stone-50
  }

  return [r, g, b, 255];
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, (x, y, w, h) => drawTeaIcon(x, y, w, h, false)));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, (x, y, w, h) => drawTeaIcon(x, y, w, h, false)));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, (x, y, w, h) => drawTeaIcon(x, y, w, h, true)));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, (x, y, w, h) => drawTeaIcon(x, y, w, h, false)));

console.log('Icons generated successfully in public/');
