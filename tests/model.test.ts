import { describe, expect, it } from 'vitest';
import {
  createGame,
  pickItem,
  unlockSlot,
  undoPick,
  retryGame,
  type GameState,
} from '../src/game/model';
import type { Level } from '../src/game/level';

const level: Level = {
  id: 'test',
  name: 'Test',
  width: 500,
  height: 700,
  categories: [
    { id: 'a', label: 'A', target: 1 },
    { id: 'b', label: 'B', target: 1 },
    { id: 'c', label: 'C', target: 1 },
    { id: 'd', label: 'D', target: 2 },
    { id: 'e', label: 'E', target: 1 },
  ],
  items: [
    { id: 'a1', categoryId: 'a', x: 40, y: 40, width: 40, height: 40, coveredBy: ['d1'] },
    { id: 'b1', categoryId: 'b', x: 90, y: 40, width: 40, height: 40, coveredBy: [] },
    { id: 'c1', categoryId: 'c', x: 140, y: 40, width: 40, height: 40, coveredBy: [] },
    { id: 'd1', categoryId: 'd', x: 40, y: 20, width: 40, height: 40, coveredBy: [] },
    { id: 'd2', categoryId: 'd', x: 190, y: 40, width: 40, height: 40, coveredBy: [] },
    { id: 'e1', categoryId: 'e', x: 240, y: 40, width: 40, height: 40, coveredBy: [] },
  ],
};

function collect(state: GameState, ...ids: string[]): GameState {
  return ids.reduce((current, id) => pickItem(level, current, id), state);
}

describe('game rules', () => {
  it('blocks a covered item and stores a future category', () => {
    const initial = createGame(level);
    expect(pickItem(level, initial, 'a1')).toBe(initial);
    const state = pickItem(level, initial, 'd1');
    expect(state.tray).toEqual(['d1']);
    expect(state.counts.d).toBe(0);
    expect(state.removed).toContain('d1');
  });

  it('replaces only the completed slot and settles stored items', () => {
    const state = collect(createGame(level), 'd1', 'a1');
    expect(state.slots).toEqual(['d', 'b', 'c']);
    expect(state.counts.d).toBe(1);
    expect(state.tray).toEqual([]);
  });

  it('processes later completed categories without shifting other slots', () => {
    const state = collect(createGame(level), 'd1', 'd2', 'a1');
    expect(state.slots).toEqual(['e', 'b', 'c']);
    expect(state.counts.d).toBe(2);
    expect(state.tray).toEqual([]);
  });

  it('shows failure at capacity and allows one slot to be unlocked', () => {
    const initial = createGame(level);
    const full: GameState = { ...initial, tray: ['x1', 'x2', 'x3', 'x4'], removed: ['x1', 'x2', 'x3', 'x4'] };
    const state = pickItem(level, full, 'e1');
    expect(state.mode).toBe('full');
    expect(unlockSlot(state, 'wrong')).toBe(state);
    const resumed = unlockSlot(state, '万理华最帅');
    expect(resumed.capacity).toBe(6);
    expect(resumed.mode).toBe('playing');
  });

  it('undoes the whole pick but preserves an unlocked slot', () => {
    const picked = collect(createGame(level), 'd1', 'a1');
    const unlocked = unlockSlot(picked, '万理华最帅');
    const undone = undoPick(unlocked, '我老公是万理华');
    expect(undone.removed).toEqual(['d1']);
    expect(undone.tray).toEqual(['d1']);
    expect(undone.counts.a).toBe(0);
    expect(undone.counts.d).toBe(0);
    expect(undone.slots).toEqual(['a', 'b', 'c']);
    expect(undone.capacity).toBe(6);
  });

  it('resets the level only on retry and wins after all items are found', () => {
    const won = collect(createGame(level), 'd1', 'a1', 'b1', 'c1', 'd2', 'e1');
    expect(won.mode).toBe('won');
    const retried = retryGame(level);
    expect(retried.removed).toEqual([]);
    expect(retried.capacity).toBe(5);
  });
});
