import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper write PNG from pixel getter
function createPNG(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const buffer = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    buffer[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y);
      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a !== undefined ? a : 255;
    }
  }
  const compressed = zlib.deflateSync(buffer);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.resolve('assets/images/adventure');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating adventure PNG assets...');

// 1. BG SKY (960 x 540)
{
  const width = 960, height = 540;
  const png = createPNG(width, height, (x, y) => {
    // Sky gradient from deep clear cyan/sky-blue to warm pastel horizon
    const t = y / height;
    let r = Math.round(56 + t * (235 - 56));
    let g = Math.round(155 + t * (245 - 155));
    let b = Math.round(214 + t * (210 - 214));

    // Sun at (220, 110)
    const dx = x - 220;
    const dy = y - 110;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 42) {
      return [255, 248, 190, 255];
    } else if (dist < 90) {
      const glow = 1 - (dist - 42) / 48;
      r = Math.min(255, Math.round(r + glow * 120));
      g = Math.min(255, Math.round(g + glow * 100));
      b = Math.min(255, Math.round(b + glow * 40));
    }

    // Distant mountain silhouette (y > 340)
    const mHeight = 360 + Math.sin(x * 0.007) * 45 + Math.sin(x * 0.02) * 20;
    if (y > mHeight) {
      const mt = (y - mHeight) / (height - mHeight);
      const mr = Math.round(110 - mt * 30);
      const mg = Math.round(168 - mt * 40);
      const mb = Math.round(160 - mt * 30);
      return [mr, mg, mb, 255];
    }

    // Fluffy cloud puffs
    function inCloud(cx, cy, rx, ry) {
      const cdx = (x - cx) / rx;
      const cdy = (y - cy) / ry;
      return (cdx * cdx + cdy * cdy) < 1;
    }

    const clouds = [
      [140, 170, 75, 24], [180, 160, 60, 28], [220, 172, 70, 22],
      [580, 140, 90, 26], [640, 130, 80, 32], [700, 145, 85, 25],
      [820, 200, 70, 20], [860, 192, 60, 25]
    ];
    for (const [cx, cy, rx, ry] of clouds) {
      if (inCloud(cx, cy, rx, ry)) {
        return [255, 255, 255, 245];
      }
    }

    return [r, g, b, 255];
  });
  fs.writeFileSync(path.join(outDir, 'bg-sky.png'), png);
  console.log('✓ bg-sky.png generated');
}

// 2. BG TREES & MIDGROUND HILLS (960 x 360)
{
  const width = 960, height = 360;
  const png = createPNG(width, height, (x, y) => {
    // Transparent sky top
    const hillBase = 160 + Math.sin(x * 0.012) * 35 + Math.cos(x * 0.025) * 15;
    if (y < hillBase) {
      return [0, 0, 0, 0];
    }

    // Midground rolling green hill
    const depth = (y - hillBase) / (height - hillBase);
    let r = Math.round(46 - depth * 15);
    let g = Math.round(135 - depth * 35);
    let b = Math.round(75 - depth * 25);

    // Tree clusters along hill crest
    const treeSpacing = 64;
    const treeIdx = Math.floor(x / treeSpacing);
    const treeCenterX = treeIdx * treeSpacing + 32;
    const treeCenterY = 160 + Math.sin(treeCenterX * 0.012) * 35 + Math.cos(treeCenterX * 0.025) * 15;

    const tdx = (x - treeCenterX);
    const tdy = (y - (treeCenterY - 14));
    if (tdx * tdx + tdy * tdy < 24 * 24 && y < treeCenterY + 4) {
      // Tree foliage
      return [35, 108, 56, 255];
    }

    // Subtle texture noise / grass blades
    if ((x + y * 3) % 17 === 0) {
      r = Math.min(255, r + 15);
      g = Math.min(255, g + 20);
    }

    return [r, g, b, 255];
  });
  fs.writeFileSync(path.join(outDir, 'bg-trees.png'), png);
  console.log('✓ bg-trees.png generated');
}

// 3. CHARACTER SPRITESHEET (384 x 48 -> 8 frames @ 48x48)
{
  const width = 384, height = 48;
  const frameWidth = 48;

  // Si Kupas Penjelajah: Friendly explorer with safari hat, khaki vest, backpack, happy eyes
  const png = createPNG(width, height, (x, y) => {
    const frame = Math.floor(x / frameWidth);
    const fx = x % frameWidth; // 0..47
    const fy = y;              // 0..47

    // Frame animations:
    // 0: Idle, 1-4: Run cycle, 5: Jump, 6: Fall, 7: Celebrate
    let bobY = 0;
    let legOffset = 0;
    let armOffset = 0;

    if (frame === 0) {
      // Idle breathing
      bobY = 0;
    } else if (frame === 1) {
      bobY = -1;
      legOffset = -3;
      armOffset = 3;
    } else if (frame === 2) {
      bobY = -2;
      legOffset = 0;
      armOffset = 0;
    } else if (frame === 3) {
      bobY = -1;
      legOffset = 3;
      armOffset = -3;
    } else if (frame === 4) {
      bobY = 0;
      legOffset = 0;
      armOffset = 0;
    } else if (frame === 5) {
      bobY = -4; // Jump up
      legOffset = -2;
      armOffset = -5;
    } else if (frame === 6) {
      bobY = 1; // Fall down
      legOffset = 2;
      armOffset = 4;
    } else if (frame === 7) {
      bobY = -3; // Celebrate
      armOffset = -7;
    }

    const py = fy - bobY;

    // Safari Explorer Hat (Brim y: 14-16, Crown y: 7-13, Width 26)
    if (py >= 7 && py <= 13 && fx >= 16 && fx <= 31) {
      return [214, 168, 98, 255]; // Safari hat crown
    }
    if (py >= 11 && py <= 12 && fx >= 16 && fx <= 31) {
      return [180, 80, 40, 255]; // Red/brown ribbon band
    }
    if (py >= 14 && py <= 16 && fx >= 12 && fx <= 35) {
      return [195, 150, 85, 255]; // Hat brim
    }

    // Head / Face (Round cute face y: 17-27, x: 16-31)
    const hdx = fx - 23.5;
    const hdy = py - 22;
    if (hdx * hdx + hdy * hdy <= 7 * 7) {
      // Cheeks blush
      if (py === 24 && (fx === 18 || fx === 29)) {
        return [255, 170, 160, 255];
      }
      // Eyes
      if ((py === 21 || py === 22) && (fx === 21 || fx === 26)) {
        return [27, 58, 47, 255]; // Dark rimba eyes
      }
      // Smile
      if (py === 25 && fx >= 22 && fx <= 25) {
        return [180, 50, 40, 255];
      }
      return [255, 224, 185, 255]; // Warm skin tone
    }

    // Explorer Backpack on back (x: 10-15, y: 24-34)
    if (fx >= 11 && fx <= 15 && py >= 24 && py <= 34) {
      return [140, 75, 30, 255]; // Leather brown backpack
    }

    // Body / Vest (x: 17-30, y: 28-36)
    if (fx >= 17 && fx <= 30 && py >= 28 && py <= 36) {
      if (fx === 23 || fx === 24) {
        return [245, 245, 240, 255]; // Inner white tee
      }
      return [46, 125, 79, 255]; // Pandan green explorer vest
    }

    // Arms
    if (frame === 7) {
      // Celebrate arms up!
      if ((fx >= 13 && fx <= 16 && py >= 18 && py <= 28) || (fx >= 31 && fx <= 34 && py >= 18 && py <= 28)) {
        return [255, 224, 185, 255];
      }
      // Holding leaf badge in hand
      if (fx >= 32 && fx <= 37 && py >= 14 && py <= 19) {
        return [34, 197, 94, 255];
      }
    } else {
      // Normal arms
      const ay = py + armOffset;
      if (fx >= 14 && fx <= 16 && ay >= 29 && ay <= 34) {
        return [46, 125, 79, 255];
      }
      if (fx >= 31 && fx <= 33 && ay >= 29 && ay <= 34) {
        return [46, 125, 79, 255];
      }
    }

    // Shorts / Pants (Khaki y: 37-41, x: 18-29)
    if (fx >= 18 && fx <= 29 && py >= 37 && py <= 40) {
      return [180, 140, 80, 255]; // Khaki shorts
    }

    // Legs & Hiking Boots (y: 41-47)
    // Left leg
    const leftLegX = 20 + legOffset;
    if (fx >= leftLegX && fx <= leftLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255]; // Skin
    }
    if (fx >= leftLegX - 1 && fx <= leftLegX + 4 && py >= 45 && py <= 47) {
      return [100, 50, 20, 255]; // Hiking boots
    }

    // Right leg
    const rightLegX = 25 - legOffset;
    if (fx >= rightLegX && fx <= rightLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255]; // Skin
    }
    if (fx >= rightLegX - 1 && fx <= rightLegX + 4 && py >= 45 && py <= 47) {
      return [100, 50, 20, 255]; // Hiking boots
    }

    // Transparent pixel
    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(outDir, 'character-spritesheet.png'), png);
  console.log('✓ character-spritesheet.png generated');
}

// 4. TILESET GRASSLAND & OBJECTS (512 x 256)
{
  const width = 512, height = 256;
  const png = createPNG(width, height, (x, y) => {
    // Grid regions:
    // Row 0-63: Terrains (Grass Top 0-63, Dirt 64-127, Stone 128-191, River Water 192-255)
    // Row 64-127: Bridge & Props (Wooden Bridge intact 0-127, Broken Bridge 128-255, Rocks 256-319)
    // Row 128-191: Flower (Wilted 0-63, Blooming 64-127) & Waterwheel (128-255)
    // Row 192-255: Collectibles (Biotic 0-95, Abiotic 96-191, Leaf Coins 192-255) & Ancient Gate (256-511)

    // 1. Grass Top Block (0..63, 0..63)
    if (x < 64 && y < 64) {
      if (y < 12) {
        // Lush grass tufts
        if (y < 4 && (x % 6 === 0 || x % 6 === 1)) return [0, 0, 0, 0];
        return [74, 178, 62, 255]; // Bright grass green
      } else if (y < 18) {
        return [46, 125, 79, 255]; // Deep green border
      } else {
        // Rich fertile loam soil
        const noise = (x * 7 + y * 13) % 19;
        if (noise < 3) return [110, 68, 30, 255];
        return [142, 85, 42, 255];
      }
    }

    // 2. Dirt Block (64..127, 0..63)
    if (x >= 64 && x < 128 && y < 64) {
      const noise = (x * 11 + y * 17) % 23;
      if (noise < 4) return [115, 70, 32, 255];
      if (noise > 19) return [165, 105, 55, 255];
      return [142, 85, 42, 255];
    }

    // 3. River Water Tile (192..255, 0..63)
    if (x >= 192 && x < 256 && y < 64) {
      const wave = Math.sin((x + y) * 0.2) * 2;
      if (y < 8 + wave) {
        return [255, 255, 255, 230]; // White crest foam
      }
      return [35, 112, 138, 240]; // Pure laut blue
    }

    // 4. Wooden Bridge Intact (0..127, 64..127)
    if (x < 128 && y >= 64 && y < 128) {
      const by = y - 64;
      if (by >= 18 && by <= 26) {
        // Plank horizontal
        const plankGap = x % 16;
        if (plankGap === 0) return [70, 40, 15, 255];
        return [190, 130, 75, 255]; // Wood plank
      }
      if ((by >= 12 && by <= 17) && (x % 32 < 6)) {
        return [140, 85, 45, 255]; // Railing post
      }
      if (by === 12) {
        return [160, 100, 55, 255]; // Top rail
      }
      return [0, 0, 0, 0];
    }

    // 5. Broken Bridge (128..255, 64..127)
    if (x >= 128 && x < 256 && y >= 64 && y < 128) {
      const bx = x - 128;
      const by = y - 64;
      // Missing middle gap (bx between 45 and 85)
      if (bx > 42 && bx < 86) {
        return [0, 0, 0, 0]; // Broken open gap
      }
      if (by >= 18 && by <= 26) {
        const plankGap = bx % 16;
        if (plankGap === 0) return [70, 40, 15, 255];
        return [170, 110, 60, 255];
      }
      return [0, 0, 0, 0];
    }

    // 6. Wilted Wildflower (0..63, 128..191)
    if (x < 64 && y >= 128 && y < 192) {
      const fx = x;
      const fy = y - 128;
      // Drooping stem
      if (fx >= 28 && fx <= 31 && fy >= 28 && fy <= 58) {
        return [120, 115, 60, 255]; // Wilted olive stem
      }
      // Drooping brown petals
      const dx = fx - 24;
      const dy = fy - 26;
      if (dx * dx + dy * dy < 11 * 11) {
        return [180, 130, 90, 255]; // Dry wilted petal
      }
      return [0, 0, 0, 0];
    }

    // 7. Blooming Wildflower (64..127, 128..191)
    if (x >= 64 && x < 128 && y >= 128 && y < 192) {
      const fx = x - 64;
      const fy = y - 128;
      // Vibrant upright stem
      if (fx >= 30 && fx <= 33 && fy >= 24 && fy <= 58) {
        return [34, 197, 94, 255];
      }
      // Leaves
      if (fy >= 40 && fy <= 44 && ((fx >= 20 && fx <= 30) || (fx >= 33 && fx <= 43))) {
        return [46, 125, 79, 255];
      }
      // Radiant golden flower center
      const dx = fx - 32;
      const dy = fy - 20;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 6) return [255, 220, 40, 255];
      if (d < 14) return [244, 63, 94, 255]; // Bright rose pink petals
      return [0, 0, 0, 0];
    }

    // 8. Waterwheel (128..255, 128..191)
    if (x >= 128 && x < 256 && y >= 128 && y < 192) {
      const wx = x - 192;
      const wy = y - 160;
      const dist = Math.sqrt(wx * wx + wy * wy);
      if (dist < 6) return [100, 50, 20, 255]; // Iron axle
      if (dist >= 26 && dist <= 30) return [160, 100, 50, 255]; // Outer wooden ring
      // 8 Spokes
      const angle = Math.atan2(wy, wx);
      const spoke = Math.sin(angle * 4);
      if (Math.abs(spoke) < 0.15 && dist <= 28) {
        return [180, 120, 60, 255];
      }
      return [0, 0, 0, 0];
    }

    // 9. Collectibles: Biotic & Abiotic & Coins (0..255, 192..255)
    if (y >= 192) {
      const cy = y - 192; // 0..63
      const cx = x;

      // Item 1: Butterfly 🦋 (0..47)
      if (cx < 48) {
        const dx = cx - 24;
        const dy = cy - 32;
        if ((Math.abs(dx) < 14 && Math.abs(dy) < 10) && !(Math.abs(dx) < 3 && Math.abs(dy) > 4)) {
          return [56, 189, 248, 255]; // Sky blue butterfly wings
        }
        if (Math.abs(dx) <= 2 && Math.abs(dy) <= 8) {
          return [27, 58, 47, 255]; // Body
        }
        return [0, 0, 0, 0];
      }

      // Item 2: Mushroom 🍄 (48..95)
      if (cx >= 48 && cx < 96) {
        const mx = cx - 72;
        const my = cy - 32;
        if (my >= 0 && my <= 12 && Math.abs(mx) <= 4) {
          return [245, 245, 240, 255]; // Stem
        }
        if (my < 0 && (mx * mx + my * my * 1.5 < 12 * 12)) {
          if ((mx === -4 && my === -5) || (mx === 4 && my === -4)) return [255, 255, 255, 255]; // White spots
          return [239, 68, 68, 255]; // Red mushroom cap
        }
        return [0, 0, 0, 0];
      }

      // Item 3: Dewdrop Water 💧 (96..143)
      if (cx >= 96 && cx < 144) {
        const wx = cx - 120;
        const wy = cy - 32;
        if (wy >= 0 && wx * wx + wy * wy <= 10 * 10) return [14, 165, 233, 255];
        if (wy < 0 && wy >= -12 && Math.abs(wx) <= (12 + wy) * 0.8) return [56, 189, 248, 255];
        return [0, 0, 0, 0];
      }

      // Item 4: Sun Crystal / Pebble 🪨 (144..191)
      if (cx >= 144 && cx < 192) {
        const px = cx - 168;
        const py = cy - 32;
        if (px * px + py * py <= 9 * 9) return [245, 158, 11, 255]; // Glowing amber crystal
        if (px * px + py * py <= 12 * 12) return [252, 211, 77, 180];
        return [0, 0, 0, 0];
      }

      // Item 5: Leaf Coin 🍃 (192..255)
      if (cx >= 192 && cx < 256) {
        const kx = cx - 224;
        const ky = cy - 32;
        const dist = Math.sqrt(kx * kx + ky * ky);
        if (dist <= 14) {
          if (dist >= 11) return [242, 165, 65, 255]; // Gold rim
          // Leaf imprint
          if (Math.abs(kx + ky) <= 4 && dist <= 9) return [46, 125, 79, 255];
          return [254, 240, 138, 255]; // Yellow gold face
        }
        return [0, 0, 0, 0];
      }
    }

    // 10. Ancient Gate (256..511, 64..255)
    if (x >= 256 && y >= 64) {
      const gx = x - 256;
      const gy = y - 64;
      // Stone Archway pillars
      if ((gx >= 20 && gx <= 50) || (gx >= 150 && gx <= 180)) {
        if (gy < 160) {
          const stone = (gx * 3 + gy * 7) % 17;
          if (stone < 3) return [90, 100, 95, 255];
          return [120, 130, 125, 255]; // Mossy stone pillar
        }
      }
      // Arch header
      if (gx >= 20 && gx <= 180 && gy >= 10 && gy <= 40) {
        return [130, 140, 135, 255];
      }
      // Glowing portal runes inside gate
      if (gx > 55 && gx < 145 && gy > 45 && gy < 160) {
        const pulse = Math.sin(gx * 0.1) * Math.cos(gy * 0.1);
        if (pulse > 0.4) return [74, 222, 128, 200];
        return [22, 101, 52, 150]; // Forest portal glow
      }
      return [0, 0, 0, 0];
    }

    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(outDir, 'tileset-grassland.png'), png);
  console.log('✓ tileset-grassland.png generated');
}

// 5. LEVEL 1 BANNER PREVIEW (640 x 360)
{
  const width = 640, height = 360;
  const png = createPNG(width, height, (x, y) => {
    // Sky
    if (y < 200) {
      const t = y / 200;
      return [
        Math.round(80 + t * 140),
        Math.round(180 + t * 60),
        Math.round(230 - t * 40),
        255
      ];
    }
    // Grass & river
    const rx = x - 320;
    if (Math.abs(rx) < 50 + (y - 200) * 0.5) {
      return [35, 112, 138, 255]; // River
    }
    return [46, 125, 79, 255]; // Padang rumput
  });
  fs.writeFileSync(path.join(outDir, 'level1-banner.png'), png);
  console.log('✓ level1-banner.png generated');
}

console.log('All Adventure PNG assets successfully created!');

