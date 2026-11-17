import type { Level, LevelItem } from '../game/level';
import covers from './covers1.json';
import { itemPose, scatter } from './pose';

const categories = [
  { id: 'boxes', label: '纸箱', target: 6 },
  { id: 'bags', label: '包袋', target: 6 },
  { id: 'cleaning', label: '清洁用品', target: 6 },
  { id: 'garden', label: '花草', target: 6 },
  { id: 'sports', label: '运动用品', target: 6 },
  { id: 'clothes', label: '衣物', target: 6 },
  { id: 'drinks', label: '饮料', target: 7 },
  { id: 'snacks', label: '零食', target: 7 },
];

const groupedCategories = categories.flatMap((category) => Array(category.target).fill(category.id) as string[]);
const categoryOrder = groupedCategories.map((_, index) => {
  const blockStart = Math.floor(index / 20) * 20;
  const blockLength = Math.min(20, groupedCategories.length - blockStart);
  return groupedCategories[blockStart + ((index - blockStart) * 9) % blockLength];
});

const items: LevelItem[] = categoryOrder.map((categoryId, index) => {
  const column = index % 5;
  const row = Math.floor(index / 5);
  const variant = index % 7;
  const position = scatter(index, 22 + column * 120 + (row % 2) * 25, 74 + row * 90, 100, 82);
  return {
    id: `item-${String(index + 1).padStart(2, '0')}`,
    categoryId,
    ...itemPose(index, position.x, position.y, 148, 700, 1100),
    coveredBy: (covers as Record<string, string[]>)[String(index + 1)] ?? [],
    variant,
  };
});

export const level1: Level = {
  id: 'balcony',
  name: '顶楼阳台',
  width: 700,
  height: 1100,
  categories,
  items,
};
