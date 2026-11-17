import type { Level, LevelItem } from '../game/level';
import covers from './covers3.json';
import { itemPose, scatter } from './pose';

const categories = [
  { id: 'tableware', label: '餐具', target: 12 },
  { id: 'pots', label: '锅具', target: 12 },
  { id: 'utensils', label: '厨用工具', target: 12 },
  { id: 'fruit', label: '水果', target: 12 },
  { id: 'vegetables', label: '蔬菜', target: 12 },
  { id: 'seasonings', label: '调味品', target: 12 },
  { id: 'drinks', label: '饮料', target: 12 },
  { id: 'snacks', label: '零食', target: 12 },
  { id: 'cleaning', label: '清洁用品', target: 12 },
  { id: 'containers', label: '收纳容器', target: 12 },
];

const groupedCategories = categories.flatMap((category) => Array(category.target).fill(category.id) as string[]);
const categoryOrder = groupedCategories.map((_, index) => {
  const blockStart = Math.floor(index / 20) * 20;
  return groupedCategories[blockStart + ((index - blockStart) * 9) % 20];
});

const items: LevelItem[] = categoryOrder.map((categoryId, index) => {
  const column = index % 10;
  const row = Math.floor(index / 10);
  const variant = index % 7;
  const position = scatter(index, 16 + column * 85 + (row % 2) * 21, 62 + row * 80, 80, 72);
  return {
    id: `item-${String(index + 1).padStart(3, '0')}`,
    categoryId,
    ...itemPose(index, position.x, position.y, 133, 980, 1250),
    coveredBy: (covers as Record<string, string[]>)[String(index + 1)] ?? [],
    variant,
  };
});

export const level3: Level = {
  id: 'kitchen',
  name: '厨房',
  background: '/assets/kitchen.svg',
  width: 980,
  height: 1250,
  categories,
  items,
};
