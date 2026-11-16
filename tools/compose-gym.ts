import path from 'node:path';
import sharp from 'sharp';

const root = path.join(process.cwd(), 'public', 'assets');
const scenes = [
  { name: 'gym-lounge', photo: 'gym-photo-1.jpg', width: 1420, height: 2150, x: 790, y: 210, photoWidth: 610, photoHeight: 930 },
  { name: 'gym-lockers', photo: 'gym-photo-2.jpg', width: 1460, height: 2380, x: 680, y: 260, photoWidth: 680, photoHeight: 1050 },
];

for (const scene of scenes) {
  const photo = await sharp(path.join(root, 'people', scene.photo))
    .resize(scene.photoWidth, scene.photoHeight, { fit: 'fill' }).png().toBuffer();
  const frame = Buffer.from(`<svg width="${scene.width}" height="${scene.height}"><rect x="${scene.x - 8}" y="${scene.y - 8}" width="${scene.photoWidth + 16}" height="${scene.photoHeight + 16}" fill="none" stroke="#f5efe1" stroke-width="16"/><rect x="${scene.x - 17}" y="${scene.y - 17}" width="${scene.photoWidth + 34}" height="${scene.photoHeight + 34}" fill="none" stroke="#66756b" stroke-width="7"/></svg>`);
  await sharp(path.join(root, `${scene.name}.svg`))
    .composite([{ input: photo, left: scene.x, top: scene.y }, { input: frame, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, `${scene.name}-photo.png`));
  console.log(`${scene.name}-photo.png`);
}
