const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to calculate CRC32 for PNG chunks
function makeCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = crc32(typeAndData);
  chunk.writeUInt32BE(c, 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  // RGBA: 4 bytes per pixel, plus 1 filter byte per scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

console.log('Generating production assets for Your Music — By Anzles...');

// 1. App Icon (1024x1024)
const iconPng = createPng(512, 512, (x, y, w, h) => {
  // Vibrant Radial & Diagonal Gradient from Indigo/Purple to Neon Cyan
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);
  const diag = (x + y) / (w + h);

  // Background gradient: #4A00E0 -> #8E2DE2 -> #00CEC9
  let r = Math.floor(74 * (1 - diag) + 142 * diag);
  let g = Math.floor(0 * (1 - diag) + 45 * diag + 100 * Math.sin(diag * Math.PI));
  let b = Math.floor(224 * (1 - diag) + 226 * diag);

  // Musical Note Shape (Double eighth note with beam)
  // Note 1: circle at (180, 340), radius 42
  // Note 2: circle at (330, 300), radius 42
  // Stem 1: rect (205 to 225, 140 to 340)
  // Stem 2: rect (355 to 375, 100 to 300)
  // Beam: quad connecting top stems (205,140)-(375,100) with thickness 36
  const inNote1 = Math.hypot(x - 180, y - 340) < 42;
  const inNote2 = Math.hypot(x - 330, y - 300) < 42;
  const inStem1 = x >= 205 && x <= 227 && y >= 140 && y <= 340;
  const inStem2 = x >= 355 && x <= 377 && y >= 100 && y <= 300;
  
  // Beam calculation
  let inBeam = false;
  if (x >= 205 && x <= 377) {
    const slope = (100 - 140) / (377 - 205);
    const topY = 140 + slope * (x - 205);
    if (y >= topY && y <= topY + 36) inBeam = true;
  }

  // Outer glowing ring
  const inRing = dist >= 230 && dist <= 242;

  if (inNote1 || inNote2 || inStem1 || inStem2 || inBeam) {
    return [255, 255, 255, 255]; // Pure White Music Note
  }
  if (inRing) {
    return [0, 206, 201, 200]; // Cyan Glow Ring
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
});
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconPng);
console.log('✅ assets/icon.png generated');

// 2. Adaptive Icon (512x512 with transparent background and centered music note)
const adaptivePng = createPng(512, 512, (x, y, w, h) => {
  const inNote1 = Math.hypot(x - 180, y - 340) < 42;
  const inNote2 = Math.hypot(x - 330, y - 300) < 42;
  const inStem1 = x >= 205 && x <= 227 && y >= 140 && y <= 340;
  const inStem2 = x >= 355 && x <= 377 && y >= 100 && y <= 300;
  let inBeam = false;
  if (x >= 205 && x <= 377) {
    const slope = (100 - 140) / (377 - 205);
    const topY = 140 + slope * (x - 205);
    if (y >= topY && y <= topY + 36) inBeam = true;
  }

  if (inNote1 || inNote2 || inStem1 || inStem2 || inBeam) {
    return [108, 92, 231, 255]; // Primary Violet
  }
  return [0, 0, 0, 0]; // Transparent
});
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptivePng);
console.log('✅ assets/adaptive-icon.png generated');

// 3. Splash Screen (512x1024)
const splashPng = createPng(512, 1024, (x, y, w, h) => {
  // Midnight dark background #090A10
  const cx = w / 2;
  const cy = h / 2 - 60;
  const dist = Math.hypot(x - cx, y - cy);

  // Centered note
  const nx = x - (cx - 256);
  const ny = y - (cy - 256);

  const inNote1 = Math.hypot(nx - 180, ny - 340) < 40;
  const inNote2 = Math.hypot(nx - 330, ny - 300) < 40;
  const inStem1 = nx >= 205 && nx <= 227 && ny >= 140 && ny <= 340;
  const inStem2 = nx >= 355 && nx <= 377 && ny >= 100 && ny <= 300;
  let inBeam = false;
  if (nx >= 205 && nx <= 377) {
    const slope = (100 - 140) / (377 - 205);
    const topY = 140 + slope * (nx - 205);
    if (ny >= topY && ny <= topY + 34) inBeam = true;
  }

  // Subtle ambient purple glow around center
  const glow = Math.max(0, 1 - dist / 300);

  if (inNote1 || inNote2 || inStem1 || inStem2 || inBeam) {
    return [255, 255, 255, 255];
  }

  const r = Math.floor(9 + 50 * glow);
  const g = Math.floor(10 + 20 * glow);
  const b = Math.floor(16 + 80 * glow);

  return [r, g, b, 255];
});
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashPng);
console.log('✅ assets/splash.png generated');

// 4. Favicon (48x48)
const faviconPng = createPng(48, 48, (x, y, w, h) => {
  const inNote = Math.hypot(x - 24, y - 24) < 18;
  if (inNote) return [108, 92, 231, 255];
  return [9, 10, 16, 255];
});
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconPng);
console.log('✅ assets/favicon.png generated');

console.log('🎉 Production asset generation complete.');
