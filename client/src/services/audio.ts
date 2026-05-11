/**
 * Procedural audio using Web Audio API.
 *
 * We synthesize all sound effects at runtime so the project ships with ZERO
 * audio assets — no copyright concerns, smaller bundle.
 *
 * Sounds:
 *  - cardFlip: short noise burst with high-pass filter
 *  - chipDrop: pluck with metallic decay
 *  - chipStack: clipped chip clinks in series
 *  - cashRegister: bright bell tone
 *  - travel: low rumble + horse hoof rhythm
 *  - uiClick: short blip
 *  - win: triumphant chord
 *  - lose: descending tone
 */

type SoundName =
  | 'cardFlip'
  | 'cardDeal'
  | 'chipDrop'
  | 'chipStack'
  | 'cash'
  | 'click'
  | 'win'
  | 'lose'
  | 'fold';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  enabled = true;
  volume = 0.5;

  private ensureCtx() {
    if (!this.ctx) {
      const AC = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  play(name: SoundName) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const out = this.masterGain;
    switch (name) {
      case 'cardFlip':
        return playNoiseBurst(ctx, out, { duration: 0.06, freqHigh: 4500, gain: 0.18 });
      case 'cardDeal':
        return playNoiseBurst(ctx, out, { duration: 0.08, freqHigh: 3500, gain: 0.22 });
      case 'chipDrop':
        return playChip(ctx, out, 0.08, 880);
      case 'chipStack':
        return playChipStack(ctx, out);
      case 'cash':
        return playBellChord(ctx, out, [880, 1100, 1320], 0.4);
      case 'click':
        return playBlip(ctx, out, 1200, 0.04, 0.14);
      case 'win':
        return playBellChord(ctx, out, [523, 659, 784, 988], 0.7);
      case 'lose':
        return playSweep(ctx, out, 440, 110, 0.45);
      case 'fold':
        return playNoiseBurst(ctx, out, { duration: 0.18, freqHigh: 1200, gain: 0.18 });
    }
  }
}

function playNoiseBurst(
  ctx: AudioContext,
  out: AudioNode,
  opts: { duration: number; freqHigh: number; gain: number },
) {
  const length = Math.floor(ctx.sampleRate * opts.duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = opts.freqHigh;
  const gain = ctx.createGain();
  gain.gain.value = opts.gain;
  src.connect(filter).connect(gain).connect(out);
  src.start();
}

function playChip(ctx: AudioContext, out: AudioNode, duration = 0.08, base = 880) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = base;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playChipStack(ctx: AudioContext, out: AudioNode) {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playChip(ctx, out, 0.06, 700 + Math.random() * 300), i * 40);
  }
}

function playBlip(ctx: AudioContext, out: AudioNode, freq: number, duration: number, gainAmt: number) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(gainAmt, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playBellChord(ctx: AudioContext, out: AudioNode, freqs: number[], duration: number) {
  const t = ctx.currentTime;
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02 + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(out);
    osc.start(t + i * 0.04);
    osc.stop(t + duration + 0.05);
  });
}

function playSweep(ctx: AudioContext, out: AudioNode, fStart: number, fEnd: number, duration: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(fStart, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(fEnd, ctx.currentTime + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(out);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.05);
}

export const audio = new AudioService();
