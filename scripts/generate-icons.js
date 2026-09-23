import zlib from 'zlib';
import fs from 'fs';
import path from 'path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function createPng(width, height, drawPixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6 (RGBA)
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x / width, y / height, x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function renderGongfuIcon(u, v, isMaskable = false) {
  // Background
  const bgR = 120 - Math.round(v * 45); // #78350f -> #451a03
  const bgG = 53 - Math.round(v * 27);
  const bgB = 15 - Math.round(v * 12);

  if (isMaskable) {
    // For maskable, entire canvas is solid tea terracotta gradient
    // Safe zone is 15% - 85%
  }

  // Coordinates normalized to center (0,0)
  const cx = u - 0.5;
  const cy = v - 0.52;

  // Scale down inside safe zone for maskable icons
  const scale = isMaskable ? 0.75 : 0.88;
  const nx = cx / scale;
  const ny = cy / scale;

  // Gaiwan cup body
  // ny between 0.0 and 0.28
  const cupWidthAtY = 0.32 - Math.pow(Math.max(0, ny), 1.8) * 0.45;
  const inCup = ny >= 0 && ny <= 0.25 && Math.abs(nx) <= cupWidthAtY;

  // Cup Rim / Lid rim
  const inRim = Math.abs(ny - 0.0) <= 0.025 && Math.abs(nx) <= 0.33;

  // Tea Liquor inside
  const inLiquor = ny >= 0.01 && ny <= 0.22 && Math.abs(nx) <= (cupWidthAtY - 0.035);

  // Saucer base
  const inSaucer = Math.abs(ny - 0.27) <= 0.025 && Math.abs(nx) <= 0.28;

  // Leaf ascending
  // leaf center around ny = -0.18, nx = 0.0
  const leafDistX = nx;
  const leafDistY = ny + 0.18;
  // Curved teardrop shape
  const leafRadius = 0.16 * (1.0 - Math.abs(leafDistY) * 2.2);
  const inLeaf = leafDistY >= -0.22 && leafDistY <= 0.12 && Math.abs(leafDistX) <= Math.max(0, leafRadius);

  // Steam waves
  const inSteam1 = Math.abs(nx + 0.12 + Math.sin(ny * 25) * 0.02) < 0.015 && ny < -0.05 && ny > -0.32;
  const inSteam2 = Math.abs(nx - 0.12 - Math.sin(ny * 25) * 0.02) < 0.015 && ny < -0.05 && ny > -0.32;

  // Corner rounding for non-maskable icons
  let alpha = 255;
  if (!isMaskable) {
    // Rounded squircle
    const cornerDist = Math.pow(Math.abs(cx) * 2, 4) + Math.pow(Math.abs(cy) * 2, 4);
    if (cornerDist > 0.88) {
      return [0, 0, 0, 0];
    }
  }

  if (inLeaf) {
    // Warm golden amber leaf with leaf vein
    if (Math.abs(nx) < 0.01) {
      return [120, 53, 15, 255]; // vein
    }
    return [251, 191, 36, 255];
  }

  if (inSteam1 || inSteam2) {
    return [254, 243, 199, 140];
  }

  if (inLiquor) {
    return [217, 119, 6, 255]; // rich amber liquor
  }

  if (inCup || inRim || inSaucer) {
    return [254, 243, 199, 255]; // porcelain cream
  }

  return [bgR, bgG, bgB, alpha];
}

const pubDir = path.resolve('public');
fs.mkdirSync(pubDir, { recursive: true });

// 192x192
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, (u, v) => renderGongfuIcon(u, v, false)));
console.log('pwa-192x192.png generated');

// 512x512
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, (u, v) => renderGongfuIcon(u, v, false)));
console.log('pwa-512x512.png generated');

// 512x512 maskable (safe-zone padded full bleed)
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (u, v) => renderGongfuIcon(u, v, true)));
console.log('pwa-maskable-512x512.png generated');

// apple-touch-icon 180x180
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, (u, v) => renderGongfuIcon(u, v, true)));
console.log('apple-touch-icon.png generated');

// favicon 64x64
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPng(64, 64, (u, v) => renderGongfuIcon(u, v, false)));
console.log('favicon.ico generated');
