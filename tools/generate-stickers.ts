import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.join(process.cwd(), 'public/assets/fluent-emoji');
const customDir = path.join(process.cwd(), 'public/assets/items');
const targetDir = path.join(process.cwd(), 'public/assets/stickers');
const padding = 16;
const size = 256 + padding * 2;

await mkdir(targetDir, { recursive: true });
const sources = [
  ...(await readdir(sourceDir)).filter((name) => name.endsWith('.png')).map((name) => [path.join(sourceDir, name), name]),
  ...(await readdir(customDir)).filter((name) => name.endsWith('.svg')).map((name) => [path.join(customDir, name), name.replace(/\.svg$/, '.png')]),
];
for (const [source, name] of sources) {
  const sourceImage = await sharp(source).resize(256, 256, { fit: 'contain', background: '#00000000' }).ensureAlpha().png().toBuffer();
  const alpha = await sharp(sourceImage).extractChannel('alpha').png().toBuffer();
  const [outlineMask, shadowMask] = await Promise.all([
    sharp(alpha).extend({ top: padding, bottom: padding, left: padding, right: padding, background: '#000' })
      .blur(3.5).threshold(32).png().toBuffer(),
    sharp(alpha).extend({ top: padding + 4, bottom: padding - 4, left: padding + 4, right: padding - 4, background: '#000' })
      .blur(7).linear(.3, 0).png().toBuffer(),
  ]);
  const base = (color: string) => sharp({ create: { width: size, height: size, channels: 3, background: color } });
  const [outline, shadow] = await Promise.all([
    base('#171b1c').joinChannel(outlineMask).png().toBuffer(),
    base('#171b1c').joinChannel(shadowMask).png().toBuffer(),
  ]);
  const sticker = await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([
      { input: shadow },
      { input: outline },
      { input: sourceImage, top: padding, left: padding },
    ]).png().toBuffer();
  await writeFile(path.join(targetDir, name), sticker);
}
console.log(`Created stickers in ${targetDir}`);
