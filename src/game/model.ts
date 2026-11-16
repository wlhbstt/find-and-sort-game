import type { Level } from './level';

export type GameMode = 'playing' | 'full' | 'won';

type Snapshot = {
  removed: string[];
  tray: string[];
  counts: Record<string, number>;
  slots: (string | null)[];
  nextCategoryIndex: number;
  mode: GameMode;
};

export type GameState = Snapshot & {
  levelId: string;
  capacity: number;
  history: Snapshot[];
};

export function createGame(level: Level): GameState {
  return {
    levelId: level.id,
    removed: [],
    tray: [],
    counts: Object.fromEntries(level.categories.map((category) => [category.id, 0])),
    slots: Array.from({ length: 3 }, (_, index) => level.categories[index]?.id ?? null),
    nextCategoryIndex: Math.min(3, level.categories.length),
    capacity: 5,
    mode: 'playing',
    history: [],
  };
}

function snapshot(state: GameState): Snapshot {
  return {
    removed: [...state.removed],
    tray: [...state.tray],
    counts: { ...state.counts },
    slots: [...state.slots],
    nextCategoryIndex: state.nextCategoryIndex,
    mode: state.mode,
  };
}

function settleCategories(level: Level, state: GameState): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < state.slots.length; index += 1) {
      const categoryId = state.slots[index];
      const category = level.categories.find((entry) => entry.id === categoryId);
      if (!category || state.counts[category.id] < category.target) continue;

      const next = level.categories[state.nextCategoryIndex];
      state.slots[index] = next?.id ?? null;
      if (next) {
        state.nextCategoryIndex += 1;
        const stored = state.tray.filter((id) =>
          level.items.find((item) => item.id === id)?.categoryId === next.id,
        );
        state.counts[next.id] += stored.length;
        state.tray = state.tray.filter((id) => !stored.includes(id));
      }
      changed = true;
    }
  }
}

export function pickItem(level: Level, state: GameState, itemId: string): GameState {
  const item = level.items.find((entry) => entry.id === itemId);
  if (state.mode !== 'playing' || !item || state.removed.includes(itemId)) return state;
  if (item.coveredBy.some((id) => !state.removed.includes(id))) return state;

  const next: GameState = {
    ...state,
    ...snapshot(state),
    history: [...state.history, snapshot(state)],
    removed: [...state.removed, itemId],
  };
  if (next.slots.includes(item.categoryId)) {
    next.counts[item.categoryId] += 1;
  } else {
    next.tray.push(itemId);
  }
  settleCategories(level, next);
  if (level.categories.every((category) => next.counts[category.id] === category.target)) {
    next.mode = 'won';
  } else if (next.tray.length >= next.capacity) {
    next.mode = 'full';
  }
  return next;
}

export function unlockSlot(state: GameState, phrase: string): GameState {
  if (phrase !== '万理华最帅' || state.capacity >= 10 || state.mode === 'won') return state;
  return { ...state, capacity: state.capacity + 1, mode: 'playing' };
}

export function undoPick(state: GameState, phrase: string): GameState {
  if (phrase !== '我老公是万理华' || state.mode === 'won' || state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    ...previous,
    capacity: state.capacity,
    history: state.history.slice(0, -1),
  };
}

export function retryGame(level: Level): GameState {
  return createGame(level);
}
