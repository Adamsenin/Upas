import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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

// ============================================================================
// 1. GENERATE CHARACTER SI KUPAS (432 x 48, 9 frames: Idle, Run1-4, Jump, Fall, Cheer, Hurt)
// ============================================================================
{
  const totalFrames = 9;
  const frameWidth = 48;
  const frameHeight = 48;
  const totalWidth = totalFrames * frameWidth;

  const png = createPNG(totalWidth, frameHeight, (x, y) => {
    const frame = Math.floor(x / frameWidth);
    const fx = x % frameWidth; // 0..47
    let py = y;

    // Head bob and offsets
    let bob = 0;
    let legOffset = 0;
    let armOffset = 0;

    if (frame === 1) { bob = 1; legOffset = 4; armOffset = -2; }
    else if (frame === 2) { bob = 0; legOffset = 2; armOffset = 0; }
    else if (frame === 3) { bob = 1; legOffset = -4; armOffset = 2; }
    else if (frame === 4) { bob = 0; legOffset = -2; armOffset = 0; }
    else if (frame === 5) { bob = -3; legOffset = 0; armOffset = -4; } // Jump
    else if (frame === 6) { bob = 2; legOffset = 0; armOffset = 2; }  // Fall
    else if (frame === 7) { bob = -1; legOffset = 1; }                // Celebrate
    else if (frame === 8) { bob = 3; legOffset = 0; }                 // Hurt / Recoil

    py = py - bob;

    // Cap / Hat (y: 6-17, x: 14-33)
    if (py >= 6 && py <= 9 && fx >= 18 && fx <= 29) {
      return [242, 165, 65, 255]; // Golden yellow crown
    }
    if (py === 10 && fx >= 17 && fx <= 30) {
      return [220, 38, 38, 255]; // Red hat ribbon band
    }
    if (py >= 11 && py <= 13 && fx >= 14 && fx <= 33) {
      return [242, 165, 65, 255]; // Wide brim
    }

    // Hair / Bangs (y: 13-17)
    if (py >= 13 && py <= 17 && fx >= 16 && fx <= 31) {
      if ((fx >= 16 && fx <= 18) || (fx >= 29 && fx <= 31) || (py === 14 && fx % 3 === 0)) {
        return [70, 40, 20, 255]; // Dark brown hair locks
      }
    }

    // Face / Head (y: 14-27, x: 17-30)
    if (fx >= 17 && fx <= 30 && py >= 14 && py <= 27) {
      // Cheeks (blush)
      if (py === 22 && (fx === 18 || fx === 19 || fx === 28 || fx === 29)) {
        return [255, 175, 175, 255]; // Pink rosy cheeks
      }

      // Eyes
      if (frame === 8) {
        // Hurt: wincing eyes "> <"
        if ((py === 19 || py === 20) && (fx === 20 || fx === 21 || fx === 26 || fx === 27)) {
          return [70, 40, 20, 255];
        }
      } else {
        // Normal animated eyes
        if ((py === 19 || py === 20) && (fx === 20 || fx === 21 || fx === 26 || fx === 27)) {
          if (py === 19 && (fx === 20 || fx === 26)) {
            return [255, 255, 255, 255]; // Eye sparkle highlight
          }
          return [30, 45, 40, 255]; // Eye pupil
        }
      }

      // Smile / Mouth
      if (frame === 7) {
        // Wide open happy smile
        if (py >= 23 && py <= 25 && fx >= 22 && fx <= 25) {
          return [220, 38, 38, 255];
        }
      } else if (frame === 8) {
        // Wavy hurt mouth
        if (py === 24 && fx >= 22 && fx <= 25) {
          return [180, 50, 50, 255];
        }
      } else {
        // Cheerful friendly smile
        if (py === 24 && fx >= 22 && fx <= 25) {
          return [180, 50, 50, 255];
        }
      }

      return [255, 224, 185, 255]; // Warm peach skin
    }

    // Neck
    if (fx >= 22 && fx <= 25 && py === 28) {
      return [255, 224, 185, 255];
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
      // Holding leaf badge in right hand
      if (fx >= 32 && fx <= 37 && py >= 14 && py <= 19) {
        return [34, 197, 94, 255]; // Leaf badge
      }
    } else if (frame === 8) {
      // Hurt: arms clutching chest
      if ((fx >= 15 && fx <= 18 && py >= 27 && py <= 33) || (fx >= 29 && fx <= 32 && py >= 27 && py <= 33)) {
        return [46, 125, 79, 255];
      }
    } else {
      // Normal arms swing
      const ay = py + armOffset;
      if (fx >= 14 && fx <= 16 && ay >= 29 && ay <= 34) {
        return [46, 125, 79, 255];
      }
      if (fx >= 31 && fx <= 33 && ay >= 29 && ay <= 34) {
        return [46, 125, 79, 255];
      }
    }

    // Shorts / Pants (Khaki y: 37-40, x: 18-29)
    if (fx >= 18 && fx <= 29 && py >= 37 && py <= 40) {
      return [180, 140, 80, 255]; // Khaki shorts
    }

    // Legs & Hiking Boots (y: 41-47)
    const leftLegX = 20 + legOffset;
    if (fx >= leftLegX && fx <= leftLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255]; // Skin
    }
    if (fx >= leftLegX - 1 && fx <= leftLegX + 4 && py >= 45 && py <= 47) {
      return [100, 50, 20, 255]; // Hiking boots
    }

    const rightLegX = 25 - legOffset;
    if (fx >= rightLegX && fx <= rightLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255]; // Skin
    }
    if (fx >= rightLegX - 1 && fx <= rightLegX + 4 && py >= 45 && py <= 47) {
      return [100, 50, 20, 255]; // Hiking boots
    }

    return [0, 0, 0, 0];
  });

  fs.writeFileSync(path.join(outDir, 'character-spritesheet.png'), png);
  console.log('✓ character-spritesheet.png (Si Kupas, 9 frames) generated.');
}

// ============================================================================
// 2. GENERATE CHARACTER RARA PENELITI ALAM (432 x 48, 9 frames)
// ============================================================================
{
  const totalFrames = 9;
  const frameWidth = 48;
  const frameHeight = 48;
  const totalWidth = totalFrames * frameWidth;

  const png = createPNG(totalWidth, frameHeight, (x, y) => {
    const frame = Math.floor(x / frameWidth);
    const fx = x % frameWidth; // 0..47
    let py = y;

    let bob = 0;
    let legOffset = 0;
    let armOffset = 0;

    if (frame === 1) { bob = 1; legOffset = 4; armOffset = -2; }
    else if (frame === 2) { bob = 0; legOffset = 2; armOffset = 0; }
    else if (frame === 3) { bob = 1; legOffset = -4; armOffset = 2; }
    else if (frame === 4) { bob = 0; legOffset = -2; armOffset = 0; }
    else if (frame === 5) { bob = -3; legOffset = 0; armOffset = -4; } // Jump
    else if (frame === 6) { bob = 2; legOffset = 0; armOffset = 2; }  // Fall
    else if (frame === 7) { bob = -1; legOffset = 1; }                // Celebrate
    else if (frame === 8) { bob = 3; legOffset = 0; }                 // Hurt

    py = py - bob;

    // Ponytail (flowing behind left/top head, x: 9-16, y: 10-22)
    const ponySway = (frame === 5 || frame === 6) ? -3 : (legOffset > 0 ? 2 : 0);
    const px = fx + ponySway;
    if (px >= 9 && px <= 16 && py >= 10 && py <= 22) {
      // Hair tie orange
      if (px >= 14 && px <= 16 && py >= 13 && py <= 15) {
        return [249, 115, 22, 255]; // Bright orange tie
      }
      return [45, 25, 20, 255]; // Glossy dark hair
    }

    // Researcher Headband / Visor (y: 10-13, x: 16-31)
    if (py >= 10 && py <= 12 && fx >= 16 && fx <= 31) {
      return [13, 148, 136, 255]; // Teal field visor/band
    }
    if (py === 11 && fx >= 22 && fx <= 25) {
      return [254, 240, 138, 255]; // Field crest badge
    }

    // Hair / Bangs
    if (py >= 13 && py <= 17 && fx >= 16 && fx <= 31) {
      if ((fx >= 16 && fx <= 19) || (fx >= 28 && fx <= 31) || (py === 13)) {
        return [45, 25, 20, 255];
      }
    }

    // Face / Head (y: 14-27, x: 17-30)
    if (fx >= 17 && fx <= 30 && py >= 14 && py <= 27) {
      // Cheeks (blush)
      if (py === 22 && (fx === 18 || fx === 19 || fx === 28 || fx === 29)) {
        return [255, 180, 190, 255];
      }

      // Eyes
      if (frame === 8) {
        // Hurt
        if ((py === 19 || py === 20) && (fx === 20 || fx === 21 || fx === 26 || fx === 27)) {
          return [45, 25, 20, 255];
        }
      } else {
        // Large bright observant eyes
        if ((py === 19 || py === 20) && (fx === 20 || fx === 21 || fx === 26 || fx === 27)) {
          if (py === 19 && (fx === 20 || fx === 26)) {
            return [255, 255, 255, 255];
          }
          return [20, 80, 75, 255]; // Deep teal iris
        }
      }

      // Mouth
      if (frame === 7) {
        if (py >= 23 && py <= 25 && fx >= 22 && fx <= 25) {
          return [220, 38, 38, 255];
        }
      } else {
        if (py === 24 && fx >= 22 && fx <= 25) {
          return [180, 50, 50, 255];
        }
      }

      return [255, 224, 185, 255];
    }

    // Neckerchief / Bandana (y: 27-29, x: 20-27)
    if (py >= 27 && py <= 29 && fx >= 20 && fx <= 27) {
      return [245, 158, 11, 255]; // Golden amber bandana
    }

    // Body / Field Jacket (x: 17-30, y: 29-36)
    if (fx >= 17 && fx <= 30 && py >= 29 && py <= 36) {
      if (fx === 23 || fx === 24) {
        return [230, 245, 245, 255]; // Mint white inner tee
      }
      return [124, 58, 237, 255]; // Vibrant Violet / Indigo field jacket
    }

    // Arms & Field Notebook
    if (frame === 7) {
      // Celebrating with notebook held up
      if ((fx >= 13 && fx <= 16 && py >= 18 && py <= 28) || (fx >= 31 && fx <= 34 && py >= 18 && py <= 28)) {
        return [255, 224, 185, 255];
      }
      // Field notebook in hand
      if (fx >= 33 && fx <= 39 && py >= 14 && py <= 20) {
        return [13, 148, 136, 255]; // Teal field notes
      }
    } else if (frame === 8) {
      if ((fx >= 15 && fx <= 18 && py >= 27 && py <= 33) || (fx >= 29 && fx <= 32 && py >= 27 && py <= 33)) {
        return [124, 58, 237, 255];
      }
    } else {
      const ay = py + armOffset;
      if (fx >= 14 && fx <= 16 && ay >= 29 && ay <= 34) {
        return [124, 58, 237, 255];
      }
      if (fx >= 31 && fx <= 33 && ay >= 29 && ay <= 34) {
        return [124, 58, 237, 255];
      }
    }

    // Cargo Shorts / Skort (Teal charcoal y: 37-40, x: 18-29)
    if (fx >= 18 && fx <= 29 && py >= 37 && py <= 40) {
      return [30, 41, 59, 255]; // Deep slate
    }

    // Legs & Field Boots (y: 41-47)
    const leftLegX = 20 + legOffset;
    if (fx >= leftLegX && fx <= leftLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255];
    }
    if (fx >= leftLegX - 1 && fx <= leftLegX + 4 && py >= 45 && py <= 47) {
      return [71, 85, 105, 255]; // Slate outdoor boots
    }

    const rightLegX = 25 - legOffset;
    if (fx >= rightLegX && fx <= rightLegX + 3 && py >= 41 && py <= 44) {
      return [255, 224, 185, 255];
    }
    if (fx >= rightLegX - 1 && fx <= rightLegX + 4 && py >= 45 && py <= 47) {
      return [71, 85, 105, 255];
    }

    return [0, 0, 0, 0];
  });

  fs.writeFileSync(path.join(outDir, 'character-rara.png'), png);
  console.log('✓ character-rara.png (Rara Peneliti Alam, 9 frames) generated.');
}

