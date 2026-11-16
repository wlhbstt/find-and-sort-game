import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { unlockNextLevel, unlockedLevelIndex } from '../src/game/save';

const ids = ['one', 'two', 'three'];
const values = new Map<string, string>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

function savedWin(id: string): void {
  values.set(`find-sort-save-v1:${id}`, JSON.stringify({
    version: 1, levelId: id,
    state: { levelId: id, removed: [], tray: [], slots: [], mode: 'won' },
  }));
}

describe('sequential level unlocks', () => {
  it('starts with only the first level and restores contiguous old wins', () => {
    expect(unlockedLevelIndex(ids)).toBe(0);
    savedWin('two');
    expect(unlockedLevelIndex(ids)).toBe(0);
    savedWin('one');
    expect(unlockedLevelIndex(ids)).toBe(2);
  });

  it('keeps the next level unlocked after replaying a completed level', () => {
    unlockNextLevel(ids, 0);
    expect(unlockedLevelIndex(ids)).toBe(1);
    savedWin('one');
    values.delete('find-sort-save-v1:one');
    expect(unlockedLevelIndex(ids)).toBe(1);
  });
});
