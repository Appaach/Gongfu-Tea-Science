import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = path.resolve('assets');
const publicDir = path.resolve('public');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Terracotta Clay Warm Chinese Tea Seal SVG
const terracottaBg = '#8c3809';
const terracottaGradient = `
  <defs>
    <radialGradient id="teaGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#b44b12" />
      <stop offset="60%" stop-color="#8c3809" />
      <stop offset="100%" stop-color="#6b2605" />
    </radialGradient>
  </defs>
`;

function getFullIconSvg(width = 1024, height = 1024, rounded = false) {
  const rx = rounded ? Math.round(width * 0.2) : 0;
  return `
  <svg viewBox="0 0 1024 1024" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${terracottaGradient}
    <rect width="${width}" height="${height}" rx="${rx}" fill="url(#teaGlow)" />
    
    <g transform="scale(${width / 500})" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
      <!-- Decorative circle / seal ring -->
      <circle cx="250" cy="250" r="215" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="250" cy="250" r="206" stroke="rgba(255,255,255,0.7)" stroke-width="3" />

      <!-- Top horizontal crossbar of the grass radical (艹) -->
      <line x1="140" y1="150" x2="242" y2="150" stroke-width="16" />

      <!-- Top Left Tea Leaf & Stem -->
      <path d="M210 200 C205 165 195 135 152 104 C175 106 205 120 222 155 C226 163 225 180 220 200" stroke-width="15" fill="none" />
      <path d="M165 116 C180 142 195 168 214 185" stroke-width="12" fill="none" />

      <!-- Top Right Tea Shoot / Arching Leaf -->
      <path d="M210 200 C235 170 265 110 380 82 C355 125 320 168 268 180" stroke-width="16" fill="none" />
      <path d="M268 168 C310 145 348 115 372 90" stroke-width="12" fill="none" />

      <!-- Roof / Shelter of Character 茶 (人 radical) -->
      <path d="M250 178 Q195 220 115 268" stroke-width="18" fill="none" />
      <path d="M250 178 Q315 225 385 265" stroke-width="18" fill="none" />

      <!-- Central vertical stem connecting roof to cup -->
      <line x1="250" y1="230" x2="250" y2="335" stroke-width="16" />

      <!-- Teacup / Gaiwan Bowl (Bottom element of 茶) -->
      <path d="M155 278 Q250 292 345 278" stroke-width="15" fill="none" />
      <path d="M155 278 C160 348 200 395 214 395" stroke-width="15" fill="none" />
      <path d="M345 278 C340 348 300 395 286 395" stroke-width="15" fill="none" />
      <path d="M214 395 C216 414 235 418 250 418 C265 418 284 414 286 395" stroke-width="15" fill="none" />

      <!-- Blooming Tea Leaves inside the Cup -->
      <path d="M250 375 C242 340 215 322 195 320 C195 342 225 365 245 378" stroke-width="14" fill="none" />
      <path d="M245 378 C258 350 290 320 316 288 C320 320 300 365 250 392" stroke-width="14" fill="none" />
    </g>
  </svg>
  `;
}

function getForegroundSvg(width = 1024, height = 1024) {
  // Centered within safe zone (0.6 scale)
  const scale = (width / 500) * 0.72;
  const offset = (width - 500 * scale) / 2;
  return `
  <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${offset}, ${offset}) scale(${scale})" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="250" cy="250" r="215" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="250" cy="250" r="206" stroke="rgba(255,255,255,0.85)" stroke-width="3" />

      <line x1="140" y1="150" x2="242" y2="150" stroke-width="16" />
      <path d="M210 200 C205 165 195 135 152 104 C175 106 205 120 222 155 C226 163 225 180 220 200" stroke-width="15" />
      <path d="M165 116 C180 142 195 168 214 185" stroke-width="12" />
      <path d="M210 200 C235 170 265 110 380 82 C355 125 320 168 268 180" stroke-width="16" />
      <path d="M268 168 C310 145 348 115 372 90" stroke-width="12" />
      <path d="M250 178 Q195 220 115 268" stroke-width="18" />
      <path d="M250 178 Q315 225 385 265" stroke-width="18" />
      <line x1="250" y1="230" x2="250" y2="335" stroke-width="16" />
      <path d="M155 278 Q250 292 345 278" stroke-width="15" />
      <path d="M155 278 C160 348 200 395 214 395" stroke-width="15" />
      <path d="M345 278 C340 348 300 395 286 395" stroke-width="15" />
      <path d="M214 395 C216 414 235 418 250 418 C265 418 284 414 286 395" stroke-width="15" />
      <path d="M250 375 C242 340 215 322 195 320 C195 342 225 365 245 378" stroke-width="14" />
      <path d="M245 378 C258 350 290 320 316 288 C320 320 300 365 250 392" stroke-width="14" />
    </g>
  </svg>
  `;
}

function getBackgroundSvg(width = 1024, height = 1024) {
  return `
  <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${terracottaGradient}
    <rect width="${width}" height="${height}" fill="url(#teaGlow)" />
  </svg>
  `;
}

function getSplashSvg(width = 2732, height = 2732) {
  const scale = 2.2;
  const offsetX = (width - 500 * scale) / 2;
  const offsetY = (height - 500 * scale) / 2;
  return `
  <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${terracottaGradient}
    <rect width="${width}" height="${height}" fill="url(#teaGlow)" />
    <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="250" cy="250" r="215" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="250" cy="250" r="206" stroke="rgba(255,255,255,0.85)" stroke-width="3" />

      <line x1="140" y1="150" x2="242" y2="150" stroke-width="16" />
      <path d="M210 200 C205 165 195 135 152 104 C175 106 205 120 222 155 C226 163 225 180 220 200" stroke-width="15" />
      <path d="M165 116 C180 142 195 168 214 185" stroke-width="12" />
      <path d="M210 200 C235 170 265 110 380 82 C355 125 320 168 268 180" stroke-width="16" />
      <path d="M268 168 C310 145 348 115 372 90" stroke-width="12" />
      <path d="M250 178 Q195 220 115 268" stroke-width="18" />
      <path d="M250 178 Q315 225 385 265" stroke-width="18" />
      <line x1="250" y1="230" x2="250" y2="335" stroke-width="16" />
      <path d="M155 278 Q250 292 345 278" stroke-width="15" />
      <path d="M155 278 C160 348 200 395 214 395" stroke-width="15" />
      <path d="M345 278 C340 348 300 395 286 395" stroke-width="15" />
      <path d="M214 395 C216 414 235 418 250 418 C265 418 284 414 286 395" stroke-width="15" />
      <path d="M250 375 C242 340 215 322 195 320 C195 342 225 365 245 378" stroke-width="14" />
      <path d="M245 378 C258 350 290 320 316 288 C320 320 300 365 250 392" stroke-width="14" />
    </g>
  </svg>
  `;
}

async function buildAll() {
  console.log('Generating Capacitor assets & PWA icons...');

  // 1. Assets for @capacitor/assets
  const fullIconBuf = Buffer.from(getFullIconSvg(1024, 1024, false));
  const roundedIconBuf = Buffer.from(getFullIconSvg(1024, 1024, true));
  const fgBuf = Buffer.from(getForegroundSvg(1024, 1024));
  const bgBuf = Buffer.from(getBackgroundSvg(1024, 1024));
  const splashBuf = Buffer.from(getSplashSvg(2732, 2732));

  await sharp(fullIconBuf).resize(1024, 1024).png().toFile('assets/icon.png');
  await sharp(fullIconBuf).resize(1024, 1024).png().toFile('assets/icon-only.png');
  await sharp(fullIconBuf).resize(1024, 1024).png().toFile('assets/logo.png');
  await sharp(fgBuf).resize(1024, 1024).png().toFile('assets/icon-foreground.png');
  await sharp(bgBuf).resize(1024, 1024).png().toFile('assets/icon-background.png');
  await sharp(splashBuf).resize(2732, 2732).png().toFile('assets/splash.png');
  await sharp(splashBuf).resize(2732, 2732).png().toFile('assets/splash-dark.png');

  // 2. Public web / PWA assets
  await sharp(roundedIconBuf).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(roundedIconBuf).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(fullIconBuf).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  await sharp(roundedIconBuf).resize(180, 180).png().toFile('public/apple-touch-icon.png');

  console.log('All assets successfully generated in /assets and /public');
}

buildAll().catch(err => {
  console.error(err);
  process.exit(1);
});
