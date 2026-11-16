import type { Level, LevelItem } from '../game/level';
import covers from './covers2.json';
import { itemPose } from './pose';

const categories = [
  { id: 'books', label: '书本', target: 8 },
  { id: 'magazines', label: '杂志', target: 9 },
  { id: 'photos', label: '照片', target: 9 },
  { id: 'stationery', label: '文具', target: 9 },
  { id: 'electronics', label: '电子配件', target: 9 },
  { id: 'tea', label: '茶具', target: 9 },
  { id: 'toys', label: '玩具', target: 9 },
  { id: 'storage', label: '收纳盒', target: 9 },
  { id: 'decor', label: '装饰摆件', target: 9 },
];

const groupedCategories = categories.flatMap((category) => Array(category.target).fill(category.id) as string[]);
const categoryOrder = groupedCategories.map((_, index) => {
  const blockStart = Math.floor(index / 20) * 20;
  return groupedCategories[blockStart + ((index - blockStart) * 9) % 20];
});

const items: LevelItem[] = categoryOrder.map((categoryId, index) => {
  const column = index % 8;
  const row = Math.floor(index / 8);
  const variant = index % 4;
  return {
    id: `item-${String(index + 1).padStart(2, '0')}`,
    categoryId,
    ...itemPose(index,
      12 + column * 94 + (row % 2) * 10 + ((row * 17 + column * 11) % 23) - 11,
      75 + row * 91 + ((row * 13 + column * 7) % 25) - 12,
      110, 820, 1100),
    coveredBy: (covers as Record<string, string[]>)[String(index + 1)] ?? [],
    variant,
  };
});

export const level2: Level = {
  id: 'study',
  name: '书房',
  background: '/assets/study.svg',
  width: 820,
  height: 1100,
  categories,
  items,
};
