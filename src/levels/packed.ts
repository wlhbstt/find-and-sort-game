import type { Category, Level, LevelItem } from '../game/level';
import { itemPose, scatter } from './pose';

type PackedLevel = Omit<Level, 'items' | 'categories'> & {
  categories: Category[];
  columns: number;
  rows: number;
  stride: number;
  stepX: number;
  stepY: number;
  itemSize: number;
  reserved?: { x: number; y: number; width: number; height: number };
  covers: Record<string, string[]>;
};

export function packedLevel(config: PackedLevel): Level {
  const { columns, rows, stride, stepX, stepY, itemSize, reserved, covers, ...level } = config;
  const categoryIds = config.categories.flatMap(({ id, target }) => Array<string>(target).fill(id));
  const cells = Array.from({ length: columns * rows }, (_, index) => index).filter((cell) => {
    if (!reserved) return true;
    const x = 22 + (cell % columns) * stepX + itemSize / 2;
    const y = 66 + Math.floor(cell / columns) * stepY + itemSize / 2;
    return x < reserved.x || x > reserved.x + reserved.width || y < reserved.y || y > reserved.y + reserved.height;
  });
  let seed = stride;
  for (let index = cells.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = seed % (index + 1);
    [cells[index], cells[other]] = [cells[other], cells[index]];
  }
  if (categoryIds.length > cells.length) throw new Error(`${config.id} has too many items for its layout`);
  const items: LevelItem[] = categoryIds.map((categoryId, index) => {
    const cell = cells[index];
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    const position = scatter(index, 22 + column * stepX + (row % 2) * 18,
      66 + row * stepY, reserved ? 48 : stepX, reserved ? 48 : stepY);
    return {
      id: `item-${String(index + 1).padStart(3, '0')}`,
      categoryId,
      ...itemPose(index, position.x, position.y, itemSize, config.width, config.height),
      coveredBy: covers[String(index + 1)] ?? [],
      variant: index % 7,
    };
  });
  return { ...level, categories: config.categories, items };
}
