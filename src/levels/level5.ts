import { packedLevel } from './packed';
import covers from './covers5.json';

export const level5 = packedLevel({
  id: 'attic', name: '老屋阁楼', background: '/assets/attic.svg',
  width: 1400, height: 1940, columns: 15, rows: 18, stride: 107,
  stepX: 87, stepY: 95, itemSize: 139, covers,
  categories: [
    { id: 'books', label: '旧书', target: 22 },
    { id: 'photos', label: '相框', target: 22 },
    { id: 'toys', label: '玩具', target: 22 },
    { id: 'clothes', label: '衣物', target: 22 },
    { id: 'shoes-hats', label: '鞋帽', target: 22 },
    { id: 'luggage', label: '箱包', target: 22 },
    { id: 'appliances', label: '旧家电', target: 23 },
    { id: 'sports', label: '运动用品', target: 23 },
    { id: 'decor', label: '装饰摆件', target: 23 },
    { id: 'tools', label: '工具', target: 23 },
    { id: 'boxes', label: '纸箱', target: 23 },
    { id: 'paper-bags', label: '纸袋', target: 23 },
  ],
});
