type Chime = 'sparkle' | 'page' | 'lumos';

/** Cathedral bells and warm brass-like swells, synthesized locally after a gesture. */
class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private wet: GainNode | null = null;
  private sources = new Set<OscillatorNode>();
  private lastPlayed = -Infinity;
  private preference = true;

  constructor() {
    try { this.preference = localStorage.getItem('once_sound_enabled') !== 'false'; } catch {}
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopVoices();
        if (this.ctx?.state === 'running') void this.ctx.suspend().catch(() => {});
      }
    });
  }
  get enabled() { return this.preference; }
  set enabled(value: boolean) {
    this.preference = value;
    try { localStorage.setItem('once_sound_enabled', String(value)); } catch {}
    if (!value) this.stopVoices();
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(value ? .48 : 0, this.ctx.currentTime, .025);
    }
  }
  private stopVoices() {
    for (const source of this.sources) { try { source.stop(); } catch {} }
    this.sources.clear();
  }
  private initCtx() {
    if (!this.ctx) {
      const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      this.ctx = new Constructor();
      const ctx = this.ctx;
      this.master = ctx.createGain(); this.master.gain.value = this.preference ? .48 : 0;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20; compressor.knee.value = 18; compressor.ratio.value = 5;
      compressor.attack.value = .008; compressor.release.value = .35;
      const warmth = ctx.createBiquadFilter(); warmth.type = 'lowpass'; warmth.frequency.value = 4400;
      this.dry = ctx.createGain(); this.dry.gain.value = .75;
      this.wet = ctx.createGain(); this.wet.gain.value = .36;
      const hall = ctx.createConvolver();
      const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.8), ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          previous = previous * .65 + (Math.random() * 2 - 1) * .35;
          data[i] = previous * Math.pow(1 - i / data.length, 2.7) * Math.min(1, i / (ctx.sampleRate * .018));
        }
      }
      hall.buffer = impulse;
      this.dry.connect(warmth); this.wet.connect(hall); hall.connect(warmth);
      warmth.connect(compressor); compressor.connect(this.master); this.master.connect(ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
  }
  private voice(frequency: number, time: number, duration: number, volume: number, type: OscillatorType = 'sine', pan = 0, attack = .025) {
    if (!this.ctx || !this.dry || !this.wet) return;
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), stereo = ctx.createStereoPanner();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    stereo.pan.value = pan;
    oscillator.connect(gain); gain.connect(stereo); stereo.connect(this.dry); stereo.connect(this.wet);
    this.sources.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); stereo.disconnect(); this.sources.delete(oscillator); };
    oscillator.start(time); oscillator.stop(time + duration + .02);
  }
  playChime(type: Chime = 'sparkle') {
    if (!this.enabled || document.hidden || performance.now() - this.lastPlayed < 160) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.lastPlayed = performance.now();
      const now = this.ctx.currentTime + .015;
      if (type === 'page') {
        // Low D bell with slightly inharmonic bronze overtones and a distant fifth.
        [[146.83, .18, 1.5], [293.66, .08, 1.1], [440, .05, 1.3], [602, .022, .8]].forEach(([hz, gain, duration], i) => this.voice(hz, now + i * .018, duration, gain, 'sine', (i % 2 ? 1 : -1) * .28));
        this.voice(73.42, now, .9, .1, 'sine', 0, .06);
      } else if (type === 'lumos') {
        // Slow, warm open-fifth fanfare with an airy upper bell.
        [146.83, 220, 293.66, 440].forEach((hz, i) => this.voice(hz, now + i * .075, 1.8, .045, 'triangle', (i - 1.5) * .22, .18));
        this.voice(73.42, now, 1.9, .12, 'sine', 0, .1);
        this.voice(880, now + .22, 1.6, .04, 'sine', .35, .06);
      } else {
        // A restrained constellation of bells above the same low tonal foundation.
        [293.66, 440, 587.33, 880].forEach((hz, i) => this.voice(hz, now + i * .09, 1.3, .055 - i * .007, 'sine', (i - 1.5) * .3));
        this.voice(146.83, now, 1.4, .075, 'sine', 0, .06);
      }
    } catch { /* Browsers without audio support keep all navigation usable. */ }
  }
}
export const sound = new SoundManager();
