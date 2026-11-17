import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { itemAssetUrl } from '../src/game/assets';
import { validateLevel, findSolution, type Level } from '../src/game/level';
import { createGame, pickItem } from '../src/game/model';
import { level1 } from '../src/levels/level1';
import { level2 } from '../src/levels/level2';
import { level3 } from '../src/levels/level3';
import { level4 } from '../src/levels/level4';
import { level5 } from '../src/levels/level5';
import { level6 } from '../src/levels/level6';
import { level7 } from '../src/levels/level7';

describe('level data', () => {
  it('rejects invalid counts and coverage cycles', () => {
    const invalid: Level = {
      id: 'invalid', name: 'Invalid', width: 100, height: 100,
      categories: [{ id: 'a', label: 'A', target: 2 }],
      items: [{ id: 'one', categoryId: 'a', x: 0, y: 0, width: 20, height: 20, coveredBy: ['one'] }],
    };
    expect(validateLevel(invalid)).toContain('category a has 1 items, expected 2');
    expect(validateLevel(invalid)).toContain('coverage cycle at one');
  });

  it('validates the first level and finds a five-slot solution', () => {
    expect(validateLevel(level1)).toEqual([]);
    const solution = findSolution(level1);
    expect(solution).not.toBeNull();
    expect(solution).toHaveLength(50);
  });

  it('accepts an uncovered item and rejects one beneath another', () => {
    const initial = createGame(level1);
    const visible = level1.items.find((item) => item.coveredBy.length === 0)!;
    const covered = level1.items.find((item) => item.coveredBy.length > 0)!;
    expect(pickItem(level1, initial, visible.id).removed).toContain(visible.id);
    expect(pickItem(level1, initial, covered.id)).toBe(initial);
  });

  it('validates the study and finds an 80-item path with five temporary slots', () => {
    expect(level2.categories).toHaveLength(9);
    expect(level2.items).toHaveLength(80);
    expect(validateLevel(level2)).toEqual([]);
    expect(findSolution(level2)).toHaveLength(80);
  });

  it('validates the kitchen and finds a 120-item path with five temporary slots', () => {
    expect(level3.categories).toHaveLength(10);
    expect(level3.items).toHaveLength(120);
    expect(validateLevel(level3)).toEqual([]);
    expect(findSolution(level3)).toHaveLength(120);
  });

  it.each([
    [level4, 11, 180],
    [level5, 12, 270],
    [level6, 13, 297],
    [level7, 14, 327],
  ])('validates %s and finds a five-slot solution', (level, categoryCount, itemCount) => {
    expect(level.categories).toHaveLength(categoryCount);
    expect(level.items).toHaveLength(itemCount);
    expect(validateLevel(level)).toEqual([]);
    expect(level.items.some((item) => item.coveredBy.length > 0)).toBe(true);
    expect(findSolution(level)).toHaveLength(itemCount);
    expect(existsSync(path.join(process.cwd(), 'public', level.background!.slice(1)))).toBe(true);
    for (const asset of new Set(level.items.map(itemAssetUrl))) {
      expect(existsSync(path.join(process.cwd(), 'public', asset.slice(1)))).toBe(true);
    }
  });

  it.each([level1, level2, level3, level4, level5, level6, level7])('keeps varied item poses within %s', (level) => {
    expect(new Set(level.items.map((item) => item.angle)).size).toBeGreaterThan(5);
    expect(new Set(level.items.map((item) => item.width)).size).toBeGreaterThan(5);
    for (const item of level.items) {
      const angle = (item.angle ?? 0) * Math.PI / 180;
      const halfWidth = (Math.abs(Math.cos(angle)) * item.width + Math.abs(Math.sin(angle)) * item.height) / 2;
      const halfHeight = (Math.abs(Math.sin(angle)) * item.width + Math.abs(Math.cos(angle)) * item.height) / 2;
      expect(item.x + item.width / 2 - halfWidth).toBeGreaterThanOrEqual(0);
      expect(item.y + item.height / 2 - halfHeight).toBeGreaterThanOrEqual(0);
      expect(item.x + item.width / 2 + halfWidth).toBeLessThanOrEqual(level.width);
      expect(item.y + item.height / 2 + halfHeight).toBeLessThanOrEqual(level.height);
    }
  });
});
