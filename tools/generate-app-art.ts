import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.join(process.cwd(), 'assets');
const source = await readFile(path.join(root, 'app-icon.svg'));
await sharp(source).resize(1024, 1024).png().toFile(path.join(root, 'icon-only.png'));
const center = await sharp(source).resize(760, 760).png().toBuffer();
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#fff7e7' } })
  .composite([{ input: center, left: 986, top: 986 }])
  .png().toFile(path.join(root, 'splash.png'));
