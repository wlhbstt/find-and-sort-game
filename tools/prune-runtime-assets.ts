import { readdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { itemAssetName } from '../src/game/assets';
import { level1 } from '../src/levels/level1';
import { level2 } from '../src/levels/level2';
import { level3 } from '../src/levels/level3';
import { level4 } from '../src/levels/level4';
import { level5 } from '../src/levels/level5';
import { level6 } from '../src/levels/level6';
import { level7 } from '../src/levels/level7';

const assets = path.resolve('dist/assets');
const stickers = path.join(assets, 'stickers');
const emoji = path.join(assets, 'fluent-emoji');
const usedStickers = new Set(
  [level1, level2, level3, level4, level5, level6, level7]
    .flatMap((level) => level.items.map(itemAssetName)),
);
const furniture = new Set(['chair.png', 'couch_and_lamp.png']);

for (const name of usedStickers) await access(path.join(stickers, `${name}.png`));
for (const name of furniture) await access(path.join(emoji, name));

for (const name of await readdir(stickers)) {
  if (name.endsWith('.png') && !usedStickers.has(name.slice(0, -4))) {
    await rm(path.join(stickers, name));
  }
}
for (const name of await readdir(emoji)) {
  if (!furniture.has(name)) await rm(path.join(emoji, name));
}
await rm(path.join(assets, 'items'), { recursive: true });

console.log(`Kept ${usedStickers.size} stickers and ${furniture.size} furniture images`);
