import { createIcons, List, LockKeyhole, Music2, RotateCcw, Settings2, Undo2, Volume2, VolumeX, X, ZoomIn, ZoomOut } from 'lucide';
import Phaser from 'phaser';
import { MusicPlayer } from './audio/music';
import { itemAssetUrl } from './game/assets';
import { createGame, pickItem, retryGame, undoPick, unlockSlot, type GameState } from './game/model';
import { GameScene } from './game/scene';
import { loadSave, saveGame, unlockNextLevel, unlockedLevelIndex } from './game/save';
import { level1 } from './levels/level1';
import { level2 } from './levels/level2';
import { level3 } from './levels/level3';
import { level4 } from './levels/level4';
import { level5 } from './levels/level5';
import { level6 } from './levels/level6';
import { level7 } from './levels/level7';
import './styles.css';

const levels = [level1, level2, level3, level4, level5, level6, level7];
const levelIds = levels.map((entry) => entry.id);
const selectedLevel = new URLSearchParams(window.location.search).get('level');
const selectedIndex = levels.findIndex((entry) => entry.id === selectedLevel);
const level = selectedIndex >= 0 && selectedIndex <= unlockedLevelIndex(levelIds) ? levels[selectedIndex] : level1;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main class="game-shell">
    <header class="topbar">
      <button class="icon-button" id="settings" type="button" aria-label="设置" title="设置"><i data-lucide="settings-2"></i></button>
      <span class="level-name">${level.name}</span>
      <button class="icon-button" id="levels" type="button" aria-label="选择关卡" title="选择关卡"><i data-lucide="list"></i></button>
    </header>
    <section class="targets" id="targets" aria-label="目标类别"></section>
    <section class="tray" id="tray" aria-label="临时物品框"></section>
    <div class="scene-wrap" id="scene" aria-label="${level.name}场景"></div>
    <footer class="bottom-bar">
      <div class="bottom-actions">
        <button class="small-action" id="undo" type="button" title="撤回"><i data-lucide="undo-2"></i><span>撤回</span></button>
        <button class="icon-button" id="retry" type="button" aria-label="重试本关" title="重试本关"><i data-lucide="rotate-ccw"></i></button>
        <button class="icon-button" id="music-toggle" type="button" aria-label="静音" title="静音"><i data-lucide="volume-2"></i></button>
        <button class="icon-button" id="zoom-out" type="button" aria-label="缩小场景" title="缩小场景"><i data-lucide="zoom-out"></i></button>
        <button class="icon-button" id="zoom-in" type="button" aria-label="放大场景" title="放大场景"><i data-lucide="zoom-in"></i></button>
      </div>
      <span class="level-stat" id="level-stat"></span>
    </footer>
  </main>
  <dialog id="modal"></dialog>
`;

const targetRoot = document.querySelector<HTMLElement>('#targets')!;
const trayRoot = document.querySelector<HTMLElement>('#tray')!;
const modal = document.querySelector<HTMLDialogElement>('#modal')!;
const music = new MusicPlayer();
let state: GameState = loadSave(level.id)?.state ?? createGame(level);
let scene: GameScene;
let sceneReady = false;
let animating = false;

const iconSet = { List, LockKeyhole, Music2, RotateCcw, Settings2, Undo2, Volume2, VolumeX, X, ZoomIn, ZoomOut };
function paintIcons(root: ParentNode = app): void {
  createIcons({ icons: iconSet, root: root as Element });
}

function currentCamera(): { x: number; y: number; zoom?: number } {
  return sceneReady ? scene.cameraPosition() : loadSave(level.id)?.camera ?? level.initialCamera ?? { x: 0, y: 0 };
}

function persist(): void {
  saveGame(level.id, state, currentCamera());
}

function updateZoomButtons(): void {
  const zoom = sceneReady ? scene.zoomLevel() : 1;
  document.querySelector<HTMLButtonElement>('#zoom-out')!.disabled = zoom <= .85;
  document.querySelector<HTMLButtonElement>('#zoom-in')!.disabled = zoom >= 1.25;
}

async function flyItem(id: string, destination: HTMLElement): Promise<void> {
  const start = scene.itemScreenRect(id);
  const item = level.items.find((entry) => entry.id === id)!;
  if (!start) return;

  const end = destination.getBoundingClientRect();
  const image = document.createElement('img');
  image.className = 'flying-item';
  image.src = itemAssetUrl(item);
  image.alt = '';
  image.style.left = `${start.x}px`;
  image.style.top = `${start.y}px`;
  image.style.width = `${start.width}px`;
  image.style.height = `${start.height}px`;
  document.body.appendChild(image);

  const dx = end.left + end.width / 2 - start.x - start.width / 2;
  const dy = end.top + end.height / 2 - start.y - start.height / 2;
  const scale = Math.min(32 / start.width, 32 / start.height);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flight = image.animate([
    { transform: `translate(0, 0) rotate(${item.angle ?? 0}deg) scale(1)`, opacity: 1 },
    { transform: `translate(${dx * .55}px, ${dy * .55 - (reducedMotion ? 0 : 42)}px) rotate(${(item.angle ?? 0) / 2}deg) scale(.78)`, opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`, opacity: .8 },
  ], { duration: reducedMotion ? 120 : 420, easing: 'cubic-bezier(.22,.72,.2,1)', fill: 'forwards' });
  try {
    await flight.finished.catch(() => undefined);
  } finally {
    image.remove();
  }
}

function render(): void {
  targetRoot.innerHTML = state.slots.map((categoryId) => {
    if (!categoryId) return '<div class="target done"><span class="target-name">完成</span><span class="target-count">✓</span></div>';
    const category = level.categories.find((entry) => entry.id === categoryId)!;
    return `<div class="target"><span class="target-name">${category.label}</span><span class="target-count">${state.counts[category.id]}/${category.target}</span></div>`;
  }).join('');

  trayRoot.innerHTML = Array.from({ length: 10 }, (_, index) => {
    if (index >= state.capacity) {
      return `<button class="tray-slot locked" type="button" data-slot="${index}" data-number="${index + 1}" aria-label="解锁第 ${index + 1} 格"><i data-lucide="lock-keyhole"></i></button>`;
    }
    const itemId = state.tray[index];
    if (itemId) {
      const item = level.items.find((entry) => entry.id === itemId)!;
      return `<div class="tray-slot" aria-label="${level.categories.find((entry) => entry.id === item.categoryId)?.label}"><img src="${itemAssetUrl(item)}" alt=""></div>`;
    }
    return '<div class="tray-slot open-empty" aria-hidden="true"></div>';
  }).join('');

  const openCount = Math.min(10, state.capacity);
  document.querySelector<HTMLElement>('#level-stat')!.textContent = `${state.removed.length}/${level.items.length}`;
  const undoButton = document.querySelector<HTMLButtonElement>('#undo')!;
  undoButton.disabled = state.history.length === 0 || state.mode === 'won';
  const musicSettings = music.getSettings();
  const musicButton = document.querySelector<HTMLButtonElement>('#music-toggle')!;
  musicButton.setAttribute('aria-label', musicSettings.muted ? '打开声音' : '静音');
  musicButton.title = musicSettings.muted ? '打开声音' : '静音';
  musicButton.innerHTML = `<i data-lucide="${musicSettings.muted ? 'volume-x' : 'volume-2'}"></i>`;
  document.querySelector<HTMLButtonElement>('#retry')!.disabled = false;
  trayRoot.dataset.openCount = String(openCount);
  paintIcons();
  scene?.sync(state);
  updateZoomButtons();
  persist();
}

function showModal(title: string, body: string): void {
  modal.innerHTML = `<div class="dialog-content"><div class="dialog-head"><h2 class="dialog-title">${title}</h2><button class="dialog-close" type="button" data-close aria-label="关闭" title="关闭"><i data-lucide="x"></i></button></div>${body}</div>`;
  paintIcons(modal);
  if (!modal.open) modal.showModal();
  modal.querySelector<HTMLElement>('[data-close]')?.addEventListener('click', () => modal.close());
}

function goToLevel(id: string): void {
  const index = levelIds.indexOf(id);
  if (index < 0 || index > unlockedLevelIndex(levelIds)) return;
  persist();
  const url = new URL(window.location.href);
  url.searchParams.set('level', id);
  window.location.assign(url.href);
}

function openLevels(): void {
  const unlocked = unlockedLevelIndex(levelIds);
  const choices = levels.map((entry, index) => {
    const found = entry.id === level.id ? state.removed.length : loadSave(entry.id)?.state.removed.length ?? 0;
    const locked = index > unlocked;
    return `<button class="level-choice${entry.id === level.id ? ' selected' : ''}" type="button" data-level="${entry.id}" ${locked ? 'disabled' : ''}><span>${index + 1}. ${entry.name}</span><span>${locked ? '<i data-lucide="lock-keyhole"></i>' : `${found}/${entry.items.length}`}</span></button>`;
  }).join('');
  showModal('选择关卡', `<div class="level-list">${choices}</div>`);
  modal.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
    button.onclick = () => button.dataset.level === level.id ? modal.close() : goToLevel(button.dataset.level!);
  });
}

function openWin(): void {
  unlockNextLevel(levelIds, levels.indexOf(level));
  const nextLevel = levels[levels.indexOf(level) + 1];
  showModal('关卡完成', `<p class="dialog-copy">${level.name}已经整理完成。</p><div class="dialog-actions"><button class="small-action" id="play-again" type="button">再玩一次</button>${nextLevel ? '<button class="small-action primary-action" id="next-level" type="button">下一关</button>' : ''}</div>`);
  modal.querySelector<HTMLButtonElement>('#play-again')!.onclick = () => {
    state = retryGame(level);
    scene.resetView(level.initialCamera?.x ?? 0, level.initialCamera?.y ?? 0);
    modal.close();
    render();
  };
  modal.querySelector<HTMLButtonElement>('#next-level')?.addEventListener('click', () => goToLevel(nextLevel.id));
}

function openUnlock(): void {
  if (state.capacity >= 10) {
    showModal('格子已满', '<p class="dialog-copy">临时格最多解锁到 10 个。</p>');
    return;
  }
  showModal('解锁临时格', `<p class="dialog-copy">输入口令解锁第 ${state.capacity + 1} 格。</p><div class="phrase-row"><input id="phrase" type="text" autocomplete="off" aria-label="解锁口令"><button class="small-action primary-action" id="submit" type="button">解锁</button></div><p class="error-text" id="error"></p>`);
  const input = modal.querySelector<HTMLInputElement>('#phrase')!;
  modal.querySelector<HTMLButtonElement>('#submit')!.onclick = () => {
    const next = unlockSlot(state, input.value.trim());
    if (next === state) {
      modal.querySelector<HTMLElement>('#error')!.textContent = '口令不正确';
      return;
    }
    state = next;
    modal.close();
    render();
  };
  input.focus();
}

function performUndo(input: HTMLInputElement, error: HTMLElement): void {
  const next = undoPick(state, input.value.trim());
  if (next === state) {
    error.textContent = '口令不正确';
    return;
  }
  state = next;
  modal.close();
  render();
}

function openUndo(): void {
  if (animating) return;
  showModal('撤回最近操作', `<p class="dialog-copy">输入口令撤回最近一次点击及其带来的计数变化。</p><div class="phrase-row"><input id="phrase" type="text" autocomplete="off" aria-label="撤回口令"><button class="small-action primary-action" id="submit" type="button">撤回</button></div><p class="error-text" id="error"></p>`);
  const input = modal.querySelector<HTMLInputElement>('#phrase')!;
  modal.querySelector<HTMLButtonElement>('#submit')!.onclick = () => performUndo(input, modal.querySelector<HTMLElement>('#error')!);
  input.focus();
}

function openFailure(): void {
  const unlockControls = state.capacity < 10
    ? `<div class="phrase-row"><input id="unlock-phrase" type="text" autocomplete="off" placeholder="解锁口令" aria-label="解锁口令"><button class="small-action primary-action" id="unlock" type="button">解锁一格</button></div><p class="error-text" id="unlock-error"></p>`
    : '';
  showModal('临时格已满', `<p class="dialog-copy">撤回上次点击，或重新开始本关。</p>${unlockControls}<div class="phrase-row"><input id="undo-phrase" type="text" autocomplete="off" placeholder="撤回口令" aria-label="撤回口令"><button class="small-action" id="undo-last" type="button">撤回</button></div><p class="error-text" id="undo-error"></p><div class="dialog-actions"><button class="small-action" id="retry-level" type="button">重试本关</button></div>`);
  const unlockInput = modal.querySelector<HTMLInputElement>('#unlock-phrase');
  modal.querySelector<HTMLButtonElement>('#unlock')?.addEventListener('click', () => {
    const next = unlockSlot(state, unlockInput!.value.trim());
    if (next === state) {
      modal.querySelector<HTMLElement>('#unlock-error')!.textContent = '口令不正确';
      return;
    }
    state = next;
    modal.close();
    render();
  });
  const undoInput = modal.querySelector<HTMLInputElement>('#undo-phrase')!;
  modal.querySelector<HTMLButtonElement>('#undo-last')!.onclick = () => performUndo(undoInput, modal.querySelector<HTMLElement>('#undo-error')!);
  modal.querySelector<HTMLButtonElement>('#retry-level')!.onclick = () => {
    state = retryGame(level);
    scene.resetView(level.initialCamera?.x ?? 0, level.initialCamera?.y ?? 0);
    modal.close();
    render();
  };
}

function openSettings(): void {
  const settings = music.getSettings();
  showModal('音乐设置', `<div class="volume-row"><label for="volume">音量</label><output id="volume-value">${Math.round(settings.volume * 100)}%</output><input id="volume" type="range" min="0" max="100" value="${Math.round(settings.volume * 100)}"></div><label class="setting-line">静音<input id="muted" type="checkbox" ${settings.muted ? 'checked' : ''}></label><label class="small-action primary-action" for="music-file"><i data-lucide="music-2"></i><span>导入音频</span></label><input class="hidden-file" id="music-file" type="file" accept="audio/*"><p class="file-name" id="file-name"></p><div class="dialog-actions"><button class="small-action" id="default-music" type="button">使用默认音乐</button></div><p class="error-text" id="music-error"></p>`);
  const volume = modal.querySelector<HTMLInputElement>('#volume')!;
  volume.oninput = () => {
    const next = Number(volume.value) / 100;
    music.setVolume(next);
    modal.querySelector<HTMLOutputElement>('#volume-value')!.value = `${volume.value}%`;
  };
  modal.querySelector<HTMLInputElement>('#muted')!.onchange = (event) => {
    music.setMuted((event.currentTarget as HTMLInputElement).checked);
    render();
  };
  modal.querySelector<HTMLInputElement>('#music-file')!.onchange = async (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await music.importTrack(file);
      modal.querySelector<HTMLElement>('#file-name')!.textContent = file.name;
      modal.querySelector<HTMLElement>('#music-error')!.textContent = '';
      render();
    } catch {
      modal.querySelector<HTMLElement>('#music-error')!.textContent = '无法读取该音频文件';
    }
  };
  modal.querySelector<HTMLButtonElement>('#default-music')!.onclick = async () => {
    try {
      await music.useDefault();
      modal.querySelector<HTMLElement>('#file-name')!.textContent = '';
      modal.querySelector<HTMLElement>('#music-error')!.textContent = '';
      render();
    } catch {
      modal.querySelector<HTMLElement>('#music-error')!.textContent = '切换默认音乐失败';
    }
  };
}

document.querySelector<HTMLButtonElement>('#settings')!.onclick = openSettings;
document.querySelector<HTMLButtonElement>('#levels')!.onclick = openLevels;
document.querySelector<HTMLButtonElement>('#undo')!.onclick = openUndo;
document.querySelector<HTMLButtonElement>('#retry')!.onclick = () => {
  if (animating) return;
  showModal('重试本关？', '<p class="dialog-copy">本关找到的物品和解锁格数将清空。</p><div class="dialog-actions"><button class="small-action primary-action" id="confirm-retry" type="button">重试本关</button></div>');
  modal.querySelector<HTMLButtonElement>('#confirm-retry')!.onclick = () => {
    state = retryGame(level);
    scene.resetView(level.initialCamera?.x ?? 0, level.initialCamera?.y ?? 0);
    modal.close();
    render();
  };
};
document.querySelector<HTMLButtonElement>('#music-toggle')!.onclick = () => {
  music.setMuted(!music.getSettings().muted);
  render();
};
for (const [id, step] of [['#zoom-out', -.1], ['#zoom-in', .1]] as const) {
  document.querySelector<HTMLButtonElement>(id)!.onclick = () => {
    scene.zoomBy(step);
    updateZoomButtons();
  };
}
trayRoot.addEventListener('click', (event) => {
  if (animating) return;
  if ((event.target as HTMLElement).closest('.locked')) openUnlock();
});
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

const saved = loadSave(level.id);
scene = new GameScene({
  level,
  state: () => state,
  onPick: async (id) => {
    if (animating) return;
    const next = pickItem(level, state, id);
    if (next === state) return;
    const item = level.items.find((entry) => entry.id === id)!;
    const targetIndex = state.slots.indexOf(item.categoryId);
    const destination = targetIndex >= 0
      ? targetRoot.children[targetIndex] as HTMLElement
      : trayRoot.children[next.tray.indexOf(id)] as HTMLElement;
    animating = true;
    state = next;
    music.playPick();
    persist();
    scene.hideItem(id);
    try {
      await flyItem(id, destination);
    } finally {
      animating = false;
      render();
    }
    if (state.mode === 'full') openFailure();
    else if (state.mode === 'won') openWin();
  },
  onCamera: () => { persist(); updateZoomButtons(); },
  onReady: () => {
    sceneReady = true;
    persist();
    if (state.mode === 'full') openFailure();
    if (state.mode === 'won') openWin();
  },
  camera: saved?.camera ?? level.initialCamera ?? { x: 0, y: 0 },
});

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'scene',
  backgroundColor: '#d8c6a6',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  render: { antialias: true, roundPixels: true },
  scene: [scene],
});

const musicReady = music.initialize();
window.addEventListener('pointerdown', async () => {
  await musicReady;
  await music.start();
}, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause();
  else music.resume();
});
window.addEventListener('pagehide', persist);
render();
