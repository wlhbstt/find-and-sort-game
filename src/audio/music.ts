type MusicSettings = { volume: number; muted: boolean };

const SETTINGS_KEY = 'find-sort-music-settings-v1';
const DB_NAME = 'find-sort-audio-v1';
const STORE_NAME = 'tracks';

function openTrackDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readTrack(): Promise<Blob | null> {
  const db = await openTrackDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME);
    const request = transaction.objectStore(STORE_NAME).get('custom');
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function writeTrack(blob: Blob | null): Promise<void> {
  const db = await openTrackDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    if (blob) store.put(blob, 'custom');
    else store.delete('custom');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

function readSettings(): MusicSettings {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<MusicSettings>;
    return {
      volume: typeof value.volume === 'number' ? Math.max(0, Math.min(1, value.volume)) : 0.55,
      muted: Boolean(value.muted),
    };
  } catch {
    return { volume: 0.55, muted: false };
  }
}

export class MusicPlayer {
  private readonly audio = new Audio();
  private settings = readSettings();
  private context?: AudioContext;
  private gain?: GainNode;
  private effectsGain?: GainNode;
  private timer?: number;
  private step = 0;
  private trackUrl?: string;
  private usingCustom = false;

  constructor() {
    this.audio.loop = true;
    this.applyVolume();
  }

  async initialize(): Promise<void> {
    try {
      const track = await readTrack();
      if (track) {
        this.usingCustom = true;
        this.trackUrl = URL.createObjectURL(track);
        this.audio.src = this.trackUrl;
      }
    } catch {
      this.usingCustom = false;
    }
  }

  async start(): Promise<void> {
    if (this.usingCustom) {
      await this.audio.play().catch(() => undefined);
      return;
    }
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    await this.context.resume();
    if (this.timer !== undefined) return;
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.applyVolume();
    const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
    const playNote = (frequency: number, start: number, duration: number, level: number) => {
      const oscillator = this.context!.createOscillator();
      const envelope = this.context!.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(level, start + 0.035);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope).connect(this.gain!);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };
    const tick = () => {
      const now = this.context!.currentTime;
      playNote(notes[this.step % notes.length], now, 0.38, 0.17);
      if (this.step % 4 === 0) playNote([261.63, 329.63, 392, 329.63][Math.floor(this.step / 4) % 4], now, 1.35, 0.055);
      this.step += 1;
    };
    tick();
    this.timer = window.setInterval(tick, 480);
  }

  async importTrack(file: File): Promise<void> {
    await writeTrack(file);
    this.stopDefault();
    if (this.trackUrl) URL.revokeObjectURL(this.trackUrl);
    this.trackUrl = URL.createObjectURL(file);
    this.usingCustom = true;
    this.audio.src = this.trackUrl;
    this.applyVolume();
    await this.audio.play();
  }

  async useDefault(): Promise<void> {
    await writeTrack(null);
    this.audio.pause();
    this.usingCustom = false;
    if (this.trackUrl) URL.revokeObjectURL(this.trackUrl);
    this.trackUrl = undefined;
    this.audio.removeAttribute('src');
    this.audio.load();
    await this.start();
  }

  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.persistSettings();
    this.applyVolume();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.persistSettings();
    this.applyVolume();
  }

  getSettings(): MusicSettings {
    return { ...this.settings };
  }

  playPick(): void {
    if (this.settings.muted || this.settings.volume === 0 || !window.AudioContext) return;
    this.context ??= new AudioContext();
    const context = this.context;
    void context.resume().catch(() => undefined);
    if (!this.effectsGain) {
      this.effectsGain = context.createGain();
      this.effectsGain.gain.value = this.settings.volume;
      this.effectsGain.connect(context.destination);
    }
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.exponentialRampToValueAtTime(980, now + .12);
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.exponentialRampToValueAtTime(.2, now + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + .15);
    oscillator.connect(envelope).connect(this.effectsGain);
    oscillator.start(now);
    oscillator.stop(now + .16);
  }

  pause(): void {
    if (this.usingCustom) this.audio.pause();
    this.stopDefault();
  }

  resume(): void {
    void this.start();
  }

  private applyVolume(): void {
    const value = this.settings.muted ? 0 : this.settings.volume;
    this.audio.volume = value;
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(value * 0.55, this.context.currentTime, 0.05);
    if (this.effectsGain && this.context) this.effectsGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  private persistSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  private stopDefault(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    if (this.context && this.context.state === 'running') void this.context.suspend();
  }
}
