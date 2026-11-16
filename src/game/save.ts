import type { GameState } from './model';

export type SaveRecord = {
  version: 1;
  levelId: string;
  state: GameState;
  camera: { x: number; y: number };
};

const KEY = 'find-sort-save-v1';

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

export function saveGame(levelId: string, state: GameState, camera: { x: number; y: number }): void {
  try {
    const record: SaveRecord = { version: 1, levelId, state, camera };
    localStorage.setItem(keyFor(levelId), JSON.stringify(record));
  } catch {
    // The current session remains playable when browser storage is unavailable.
  }
}
