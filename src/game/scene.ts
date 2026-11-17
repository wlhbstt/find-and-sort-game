import Phaser from 'phaser';
import { itemAssetName, itemAssetUrl } from './assets';
import type { GameState } from './model';
import type { Level } from './level';

type SceneOptions = {
  level: Level;
  state: () => GameState;
  onPick: (id: string) => void;
  onCamera: () => void;
  onReady?: () => void;
  camera?: { x: number; y: number; zoom?: number };
};

export const MIN_ZOOM = .5;
export const MAX_ZOOM = 1.25;

const furnishings: Record<string, { asset: string; x: number; y: number; size: number }[]> = {
  balcony: [
    { asset: 'chair', x: 528, y: 735, size: 206 },
    { asset: 'couch_and_lamp', x: 180, y: 924, size: 248 },
  ],
  study: [
    { asset: 'chair', x: 560, y: 749, size: 214 },
    { asset: 'couch_and_lamp', x: 172, y: 868, size: 260 },
  ],
  kitchen: [
    { asset: 'chair', x: 762, y: 987, size: 235 },
    { asset: 'chair', x: 228, y: 1031, size: 196 },
  ],
  'night-market': [
    { asset: 'chair', x: 137, y: 1270, size: 210 },
    { asset: 'chair', x: 908, y: 1250, size: 185 },
  ],
  attic: [
    { asset: 'chair', x: 376, y: 1535, size: 250 },
    { asset: 'couch_and_lamp', x: 1050, y: 1550, size: 315 },
  ],
};

export class GameScene extends Phaser.Scene {
  private readonly options: SceneOptions;
  private readonly sprites = new Map<string, Phaser.GameObjects.Image>();
  private down?: { x: number; y: number; lastX: number; lastY: number; itemId?: string; dragged: boolean };
  private pinchDistance?: number;
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
    for (const asset of new Set((furnishings[level.id] ?? []).map((entry) => entry.asset))) {
      this.load.image(`furniture-${asset}`, `/assets/fluent-emoji/${asset}.png`);
    }
    const queued = new Set<string>();
    for (const item of level.items) {
      const key = itemAssetName(item);
      if (queued.has(key)) continue;
      queued.add(key);
      this.load.image(key, itemAssetUrl(item));
    }
  }

  create(): void {
    const { level } = this.options;
    this.add.image(0, 0, 'level-bg').setOrigin(0).setDisplaySize(level.width, level.height).setDepth(-1000);
    for (const { asset, x, y, size } of furnishings[level.id] ?? []) {
      this.add.image(x, y, `furniture-${asset}`).setDisplaySize(size, size).setDepth(-900);
    }
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
      image.setInteractive({ pixelPerfect: true, alphaTolerance: 88 });
      this.sprites.set(item.id, image);
    }

    const camera = this.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(this.options.camera?.zoom ?? 1, MIN_ZOOM, MAX_ZOOM));
    camera.setScroll(this.options.camera?.x ?? 0, this.options.camera?.y ?? 0);
    this.clampCamera();
    this.scale.on('resize', (size: Phaser.Structs.Size) => {
      camera.setViewport(0, 0, size.width, size.height);
      this.clampCamera();
    });
    this.input.addPointer(1);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        this.down = undefined;
        this.pinchDistance = Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
        return;
      }
      this.down = {
        x: pointer.x, y: pointer.y, lastX: pointer.x, lastY: pointer.y,
        itemId: currentlyOver[0]?.getData('itemId') as string | undefined,
        dragged: false,
      };
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const distance = Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
        if (this.pinchDistance && distance > 0) {
          this.setZoomAround(camera.zoom * distance / this.pinchDistance,
            (this.input.pointer1.x + this.input.pointer2.x) / 2,
            (this.input.pointer1.y + this.input.pointer2.y) / 2);
        }
        this.pinchDistance = distance;
        return;
      }
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
      if (this.pinchDistance !== undefined) {
        this.pinchDistance = undefined;
        this.down = undefined;
        return;
      }
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
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.setZoomAround(camera.zoom + (dy < 0 ? .05 : -.05), pointer.x, pointer.y);
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

  cameraPosition(): { x: number; y: number; zoom: number } {
    const camera = this.cameras?.main;
    return camera ? { x: camera.scrollX, y: camera.scrollY, zoom: camera.zoom } : { x: 0, y: 0, zoom: 1 };
  }

  zoomLevel(): number {
    return this.cameras.main.zoom;
  }

  zoomBy(step: number): void {
    const camera = this.cameras.main;
    this.setZoomAround(camera.zoom + step, camera.width / 2, camera.height / 2);
  }

  resetView(x: number, y: number): void {
    const camera = this.cameras.main;
    camera.setZoom(1);
    camera.setScroll(x, y);
    this.clampCamera();
  }

  itemScreenRect(id: string): { x: number; y: number; width: number; height: number } | null {
    const sprite = this.sprites.get(id);
    if (!sprite) return null;
    const item = this.options.level.items.find((entry) => entry.id === id)!;
    const canvas = this.game.canvas.getBoundingClientRect();
    const camera = this.cameras.main;
    return {
      x: canvas.left + camera.width * camera.originX + (item.x - camera.scrollX - camera.width * camera.originX) * camera.zoom,
      y: canvas.top + camera.height * camera.originY + (item.y - camera.scrollY - camera.height * camera.originY) * camera.zoom,
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
    const { width, height } = this.options.level;
    const visibleWidth = camera.width / camera.zoom;
    const visibleHeight = camera.height / camera.zoom;
    camera.scrollX = visibleWidth >= width
      ? (width - camera.width) / 2
      : Phaser.Math.Clamp(camera.scrollX, (visibleWidth - camera.width) / 2, width - (visibleWidth + camera.width) / 2);
    camera.scrollY = visibleHeight >= height
      ? (height - camera.height) / 2
      : Phaser.Math.Clamp(camera.scrollY, (visibleHeight - camera.height) / 2, height - (visibleHeight + camera.height) / 2);
  }

  private setZoomAround(value: number, x: number, y: number): void {
    const camera = this.cameras.main;
    const zoom = Phaser.Math.Clamp(value, MIN_ZOOM, MAX_ZOOM);
    if (zoom === camera.zoom) return;
    const previous = camera.zoom;
    camera.setZoom(zoom);
    camera.scrollX += (x - camera.width * camera.originX) * (1 / previous - 1 / zoom);
    camera.scrollY += (y - camera.height * camera.originY) * (1 / previous - 1 / zoom);
    this.clampCamera();
    this.queueCameraSave();
  }

  private queueCameraSave(): void {
    if (this.cameraSaveTimer !== undefined) window.clearTimeout(this.cameraSaveTimer);
    this.cameraSaveTimer = window.setTimeout(() => {
      this.options.onCamera();
    }, 180);
  }
}
