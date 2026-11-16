import type { GameState } from './model';

export type SaveRecord = {
  version: 1;
  levelId: string;
  state: GameState;
  camera: { x: number; y: number; zoom?: number };
};

const KEY = 'find-sort-save-v1';
const UNLOCK_KEY = 'find-sort-unlocked-level-v1';

function keyFor(levelId: string): string {
  return `${KEY}:${levelId}`;
}

export function loadSave(levelId: string): SaveRecord | null {
  try {
    const raw = localStorage.getItem(keyFor(levelId))
      ?? (levelId === 'balcony' ? localStorage.getItem(KEY) : null);
    if (!raw) return null;
    const save = JSON.parse(raw) as SaveRecord;
    if (save.version !== 1 || save.levelId !== levelId || save.state.levelId !== levelId) return null;
    if (!Array.isArray(save.state.removed) || !Array.isArray(save.state.tray) || !Array.isArray(save.state.slots)) return null;
    return save;
  } catch {
    return null;
  }
}

export function unlockedLevelIndex(levelIds: string[]): number {
  let unlocked = 0;
  try {
    const stored = Number(localStorage.getItem(UNLOCK_KEY));
    if (Number.isInteger(stored)) unlocked = Math.max(0, Math.min(levelIds.length - 1, stored));
  } catch {
    // Saved wins can still restore access when storage reads fail.
  }
  for (let index = 0; index < levelIds.length - 1; index += 1) {
    if (loadSave(levelIds[index])?.state.mode !== 'won') break;
    unlocked = Math.max(unlocked, index + 1);
  }
  return unlocked;
}

export function unlockNextLevel(levelIds: string[], completedIndex: number): void {
  try {
    const unlocked = Math.max(unlockedLevelIndex(levelIds), completedIndex + 1);
    localStorage.setItem(UNLOCK_KEY, String(Math.min(levelIds.length - 1, unlocked)));
  } catch {
    // The current session remains playable when browser storage is unavailable.
  }
}

export function saveGame(levelId: string, state: GameState, camera: { x: number; y: number; zoom?: number }): void {
  try {
    const record: SaveRecord = { version: 1, levelId, state, camera };
    localStorage.setItem(keyFor(levelId), JSON.stringify(record));
  } catch {
    // The current session remains playable when browser storage is unavailable.
  }
}
