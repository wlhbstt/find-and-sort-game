import { packedLevel } from './packed';
import covers from './covers7.json';

export const level7 = packedLevel({
  id: 'gym-lockers', name: '健身房更衣室',
  background: import.meta.env?.VITE_PRIVATE_PHOTOS === 'true' ? '/assets/gym-lockers-photo.png' : '/assets/gym-lockers.svg',
  initialCamera: { x: 770, y: 320 },
  width: 1460, height: 2380, columns: 17, rows: 26, stride: 113,
  stepX: 79, stepY: 86, itemSize: 130,
  reserved: { x: 720, y: 340, width: 440, height: 660 }, covers,
  categories: [
    { id: 'shoes', label: '运动鞋', target: 23 },
    { id: 'training-clothes', label: '训练服', target: 23 },
    { id: 'protective', label: '护具', target: 23 },
    { id: 'towels', label: '毛巾', target: 23 },
    { id: 'bottles', label: '水壶', target: 23 },
    { id: 'balls', label: '球类', target: 23 },
    { id: 'dumbbells', label: '哑铃', target: 23 },
    { id: 'bands', label: '弹力带', target: 23 },
    { id: 'cleaning', label: '清洁用品', target: 23 },
    { id: 'luggage', label: '健身包', target: 24 },
    { id: 'jump-ropes', label: '跳绳', target: 24 },
    { id: 'nutrition', label: '能量食品', target: 24 },
    { id: 'headphones', label: '耳机', target: 24 },
    { id: 'boxes', label: '储物盒', target: 24 },
  ],
});
