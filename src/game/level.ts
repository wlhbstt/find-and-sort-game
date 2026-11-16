import { createGame, pickItem, type GameState } from './model';

export type Category = { id: string; label: string; target: number };
export type LevelItem = {
  id: string;
  categoryId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  coveredBy: string[];
  variant?: number;
};
export type Level = {
  id: string;
  name: string;
  background?: string;
  initialCamera?: { x: number; y: number };
  width: number;
  height: number;
  categories: Category[];
  items: LevelItem[];
};

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const categories = new Set(level.categories.map((category) => category.id));
  const itemIds = new Set<string>();
  for (const item of level.items) {
    if (itemIds.has(item.id)) errors.push(`duplicate item ${item.id}`);
    itemIds.add(item.id);
    if (!categories.has(item.categoryId)) errors.push(`unknown category ${item.categoryId}`);
    if (item.x < 0 || item.y < 0 || item.x + item.width > level.width || item.y + item.height > level.height) {
      errors.push(`item ${item.id} is outside the scene`);
    }
  }
  for (const category of level.categories) {
    const actual = level.items.filter((item) => item.categoryId === category.id).length;
    if (actual !== category.target) errors.push(`category ${category.id} has ${actual} items, expected ${category.target}`);
  }
  const byId = new Map(level.items.map((item) => [item.id, item]));
  for (const item of level.items) {
    for (const above of item.coveredBy) {
      if (!byId.has(above)) errors.push(`item ${item.id} has unknown cover ${above}`);
    }
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) {
      errors.push(`coverage cycle at ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const above of byId.get(id)?.coveredBy ?? []) {
      if (byId.has(above)) visit(above);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const item of level.items) visit(item.id);
  return errors;
}

export function findSolution(level: Level, maxStates = 100_000): string[] | null {
  const seen = new Set<string>();
  let states = 0;
  function search(state: GameState, path: string[]): string[] | null {
    if (state.mode === 'won') return path;
    if (state.mode === 'full' || states >= maxStates) return null;
    const key = `${state.removed.join(',')}|${state.slots.join(',')}|${state.tray.join(',')}`;
    if (seen.has(key)) return null;
    seen.add(key);
    states += 1;

    const available = level.items.filter((item) =>
      !state.removed.includes(item.id) && item.coveredBy.every((id) => state.removed.includes(id)),
    );
    available.sort((a, b) => Number(state.slots.includes(b.categoryId)) - Number(state.slots.includes(a.categoryId)));
    for (const item of available) {
      const next = pickItem(level, { ...state, history: [] }, item.id);
      const solution = search({ ...next, history: [] }, [...path, item.id]);
      if (solution) return solution;
    }
    return null;
  }
  return search(createGame(level), []);
}
