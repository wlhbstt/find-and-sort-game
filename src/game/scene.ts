import Phaser from 'phaser';
import { itemAssetName, itemAssetUrl } from './assets';
import type { GameState } from './model';
import type { Level } from './level';

type SceneOptions = {
  level: Level;
  state: () => GameState;
  onPick: (id: string) => void;
  onCamera: (x: number, y: number) => void;
  onReady?: () => void;
  camera?: { x: number; y: number };
};

export class GameScene extends Phaser.Scene {
  private readonly options: SceneOptions;
  private readonly sprites = new Map<string, Phaser.GameObjects.Image>();
  private down?: { x: number; y: number; lastX: number; lastY: number; itemId?: string; dragged: boolean };
  private cameraSaveTimer?: number;

  constructor(options: SceneOptions) {
    super({ key: options.level.id });
    this.options = options;
  }

  preload(): void {
    const { level } = this.options;
    const background = level.background ?? '/assets/balcony.svg';
    if (background.endsWith('.svg')) this.load.svg('level-bg', background, { width: level.width, height: level.height });
    else this.load.image('level-bg', background);
    const queued = new Set<string>();
    for (const item of level.items) {
      const key = itemAssetName(item);
      if (queued.has(key)) continue;
      queued.add(key);
      if (key.startsWith('custom_')) this.load.svg(key, itemAssetUrl(item), { width: 256, height: 256 });
      else this.load.image(key, itemAssetUrl(item));
    }
  }

  create(): void {
    const { level } = this.options;
    this.add.image(0, 0, 'level-bg').setOrigin(0).setDisplaySize(level.width, level.height).setDepth(-1000);
    const coverDepth = new Map<string, number>();
    const depthOf = (id: string): number => {
      const known = coverDepth.get(id);
      if (known !== undefined) return known;
      const item = level.items.find((entry) => entry.id === id)!;
      const depth = item.coveredBy.length ? Math.max(...item.coveredBy.map(depthOf)) + 1 : 0;
      coverDepth.set(id, depth);
      return depth;
    };

    for (const item of [...level.items].sort((a, b) => depthOf(b.id) - depthOf(a.id) || a.y - b.y)) {
      const image = this.add.image(item.x + item.width / 2, item.y + item.height / 2, itemAssetName(item))
        .setDisplaySize(item.width, item.height)
        .setAngle(item.angle ?? 0)
        .setDepth(1000 - depthOf(item.id) * 100 + item.y / 10000)
        .setData('itemId', item.id);
      image.setInteractive({ pixelPerfect: true, alphaTolerance: 20 });
      this.sprites.set(item.id, image);
    }

    this.cameras.main.setBounds(0, 0, level.width, level.height);
    const camera = this.cameras.main;
    camera.setScroll(this.options.camera?.x ?? 0, this.options.camera?.y ?? 0);
    this.clampCamera();
    this.scale.on('resize', (size: Phaser.Structs.Size) => {
      camera.setViewport(0, 0, size.width, size.height);
      this.clampCamera();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      this.down = {
        x: pointer.x, y: pointer.y, lastX: pointer.x, lastY: pointer.y,
        itemId: currentlyOver[0]?.getData('itemId') as string | undefined,
        dragged: false,
      };
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.down || !pointer.isDown) return;
      const dx = pointer.x - this.down.lastX;
      const dy = pointer.y - this.down.lastY;
      if (Math.hypot(pointer.x - this.down.x, pointer.y - this.down.y) > 8) this.down.dragged = true;
      if (this.down.dragged) {
        camera.scrollX -= dx / camera.zoom;
        camera.scrollY -= dy / camera.zoom;
        this.clampCamera();
        this.queueCameraSave();
      }
      this.down.lastX = pointer.x;
      this.down.lastY = pointer.y;
    });
    this.input.on('pointerup', () => {
      const down = this.down;
      this.down = undefined;
      if (!down || down.dragged || !down.itemId) return;
      const item = level.items.find((entry) => entry.id === down.itemId)!;
      if (item.coveredBy.some((id) => !this.options.state().removed.includes(id))) {
        this.shakeItem(item.id);
      } else {
        this.options.onPick(item.id);
      }
    });
    this.sync(this.options.state());
    this.options.onReady?.();
  }

  sync(state: GameState): void {
    for (const item of this.options.level.items) {
      const sprite = this.sprites.get(item.id);
      if (!sprite) continue;
      sprite.setVisible(!state.removed.includes(item.id));
      if (sprite.input) sprite.input.enabled = !state.removed.includes(item.id);
    }
  }

  cameraPosition(): { x: number; y: number } {
    const camera = this.cameras?.main;
    return camera ? { x: camera.scrollX, y: camera.scrollY } : { x: 0, y: 0 };
  }

  itemScreenRect(id: string): { x: number; y: number; width: number; height: number } | null {
    const sprite = this.sprites.get(id);
    if (!sprite) return null;
    const item = this.options.level.items.find((entry) => entry.id === id)!;
    const canvas = this.game.canvas.getBoundingClientRect();
    const camera = this.cameras.main;
    return {
      x: canvas.left + (item.x - camera.scrollX) * camera.zoom,
      y: canvas.top + (item.y - camera.scrollY) * camera.zoom,
      width: sprite.displayWidth * camera.zoom,
      height: sprite.displayHeight * camera.zoom,
    };
  }

  hideItem(id: string): void {
    const sprite = this.sprites.get(id);
    sprite?.setVisible(false);
    if (sprite?.input) sprite.input.enabled = false;
  }

  private shakeItem(id: string): void {
    const sprite = this.sprites.get(id);
    const item = this.options.level.items.find((entry) => entry.id === id);
    if (!sprite || !item) return;
    this.tweens.killTweensOf(sprite);
    const centerX = item.x + item.width / 2;
    sprite.x = centerX;
    this.tweens.add({
      targets: sprite,
      x: centerX + 5,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => sprite.setX(centerX),
    });
  }

  private clampCamera(): void {
    const camera = this.cameras.main;
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX, 0, Math.max(0, this.options.level.width - camera.width / camera.zoom));
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY, 0, Math.max(0, this.options.level.height - camera.height / camera.zoom));
  }

  private queueCameraSave(): void {
    if (this.cameraSaveTimer !== undefined) window.clearTimeout(this.cameraSaveTimer);
    this.cameraSaveTimer = window.setTimeout(() => {
      const { x, y } = this.cameraPosition();
      this.options.onCamera(x, y);
    }, 180);
  }
}
