import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { itemAssetUrl } from '../src/game/assets';
import type { Level, LevelItem } from '../src/game/level';
import { level1 } from '../src/levels/level1';
import { level2 } from '../src/levels/level2';
import { level3 } from '../src/levels/level3';
import { level4 } from '../src/levels/level4';
import { level5 } from '../src/levels/level5';
import { level6 } from '../src/levels/level6';
import { level7 } from '../src/levels/level7';

const levels = [level1, level2, level3, level4, level5, level6, level7];
const masks = new Map<string, { pixels: Buffer; width: number }>();

async function maskFor(item: LevelItem): Promise<{ pixels: Buffer; width: number }> {
  const source = itemAssetUrl(item);
  const key = `${source}:${item.width}:${item.height}`;
  const cached = masks.get(key);
  if (cached) return cached;
  const file = path.join(process.cwd(), 'public', source.slice(1));
  const { data, info } = await sharp(file)
    .resize(item.width, item.height, { fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = { pixels: data, width: info.width };
  masks.set(key, mask);
  return mask;
}

async function opaqueOverlap(a: LevelItem, b: LevelItem): Promise<number> {
  const aRadians = (a.angle ?? 0) * Math.PI / 180;
  const bRadians = (b.angle ?? 0) * Math.PI / 180;
  const aCos = Math.cos(aRadians);
  const aSin = Math.sin(aRadians);
  const bCos = Math.cos(bRadians);
  const bSin = Math.sin(bRadians);
  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;
  const aHalfX = (Math.abs(aCos) * a.width + Math.abs(aSin) * a.height) / 2;
  const aHalfY = (Math.abs(aSin) * a.width + Math.abs(aCos) * a.height) / 2;
  const bHalfX = (Math.abs(bCos) * b.width + Math.abs(bSin) * b.height) / 2;
  const bHalfY = (Math.abs(bSin) * b.width + Math.abs(bCos) * b.height) / 2;
  const left = Math.max(aCenterX - aHalfX, bCenterX - bHalfX);
  const top = Math.max(aCenterY - aHalfY, bCenterY - bHalfY);
  const right = Math.min(aCenterX + aHalfX, bCenterX + bHalfX);
  const bottom = Math.min(aCenterY + aHalfY, bCenterY + bHalfY);
  if (right <= left || bottom <= top) return 0;
  const [first, second] = await Promise.all([maskFor(a), maskFor(b)]);
  let count = 0;
  for (let y = Math.ceil(top); y < bottom; y += 1) {
    for (let x = Math.ceil(left); x < right; x += 1) {
      const adx = x - aCenterX;
      const ady = y - aCenterY;
      const bdx = x - bCenterX;
      const bdy = y - bCenterY;
      const ax = Math.floor(aCos * adx + aSin * ady + a.width / 2);
      const ay = Math.floor(-aSin * adx + aCos * ady + a.height / 2);
      const bx = Math.floor(bCos * bdx + bSin * bdy + b.width / 2);
      const by = Math.floor(-bSin * bdx + bCos * bdy + b.height / 2);
      if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax >= a.width || ay >= a.height || bx >= b.width || by >= b.height) continue;
      if (first.pixels[(ay * first.width + ax) * 4 + 3] > 40 &&
          second.pixels[(by * second.width + bx) * 4 + 3] > 40) count += 1;
    }
  }
  return count;
}

async function generate(level: Level, number: number): Promise<void> {
  const covers: Record<string, string[]> = {};
  let pairs = 0;
  for (let below = 1; below < level.items.length; below += 1) {
    const item = level.items[below];
    for (let above = 0; above < below; above += 1) {
      if (await opaqueOverlap(level.items[above], item) < (number === 1 ? 200 : number === 2 ? 150 : 120)) continue;
      (covers[String(below + 1)] ??= []).push(level.items[above].id);
      pairs += 1;
    }
  }
  const target = path.join(process.cwd(), 'src', 'levels', `covers${number}.json`);
  await writeFile(target, `${JSON.stringify(covers, null, 2)}\n`);
  console.log(`${level.name}: ${level.items.length} items, ${pairs} opaque overlap pairs`);
}

for (let index = 0; index < levels.length; index += 1) {
  await generate(levels[index], index + 1);
}
