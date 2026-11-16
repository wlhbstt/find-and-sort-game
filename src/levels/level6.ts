import { packedLevel } from './packed';
import covers from './covers6.json';

export const level6 = packedLevel({
  id: 'gym-lounge', name: '健身俱乐部',
  background: import.meta.env.VITE_PRIVATE_PHOTOS === 'true' ? '/assets/gym-lounge-photo.png' : '/assets/gym-lounge.svg',
  initialCamera: { x: 830, y: 450 },
  width: 1420, height: 2150, columns: 17, rows: 23, stride: 101,
  stepX: 76, stepY: 88, itemSize: 128,
  reserved: { x: 850, y: 340, width: 450, height: 590 }, covers,
  categories: [
    { id: 'dumbbells', label: '哑铃', target: 22 },
    { id: 'shoes', label: '运动鞋', target: 22 },
    { id: 'towels', label: '毛巾', target: 23 },
    { id: 'bottles', label: '运动水壶', target: 23 },
    { id: 'protective', label: '护具', target: 23 },
    { id: 'bands', label: '弹力带', target: 23 },
    { id: 'yoga', label: '瑜伽用品', target: 23 },
    { id: 'training-clothes', label: '训练服', target: 23 },
    { id: 'nutrition', label: '营养食品', target: 23 },
    { id: 'headphones', label: '耳机', target: 23 },
    { id: 'timers', label: '计时器', target: 23 },
    { id: 'luggage', label: '收纳包', target: 23 },
    { id: 'cleaning', label: '清洁用品', target: 23 },
  ],
});
