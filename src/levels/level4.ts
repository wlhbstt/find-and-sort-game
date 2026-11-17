import { packedLevel } from './packed';
import covers from './covers4.json';

export const level4 = packedLevel({
  id: 'night-market', name: '夜市', background: '/assets/night-market.svg',
  width: 1100, height: 1680, columns: 12, rows: 15, stride: 73,
  stepX: 82, stepY: 100, itemSize: 137, covers,
  categories: [
    { id: 'street-food', label: '小吃', target: 16 },
    { id: 'drinks', label: '饮料', target: 16 },
    { id: 'fruit', label: '水果', target: 16 },
    { id: 'toys', label: '玩具', target: 16 },
    { id: 'jewelry', label: '饰品', target: 16 },
    { id: 'flowers', label: '花束', target: 16 },
    { id: 'lights', label: '灯具', target: 16 },
    { id: 'paper-bags', label: '纸袋', target: 17 },
    { id: 'boxes', label: '包装盒', target: 17 },
    { id: 'tools', label: '摊位工具', target: 17 },
    { id: 'souvenirs', label: '纪念品', target: 17 },
  ],
});
