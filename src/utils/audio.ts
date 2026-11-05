type Chime = 'sparkle' | 'page' | 'lumos';

/** Cathedral bells and warm brass-like swells, synthesized locally after a gesture. */
class SoundManager {
  // 오디오 그래프와 음소거 선호, 재생 중인 소스의 생명주기를 보관한다.
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
  // 사용자 동작 뒤 오디오 그래프를 한 번 만들고 공명·압축 처리 경로를 연결한다.
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
  // 개별 발성 및 주파수 상승 발성을 공통 오디오 그래프에 연결한다.
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
  private chirp(startFrequency: number, endFrequency: number, time: number, duration: number, volume: number, pan = 0) {
    if (!this.ctx || !this.dry || !this.wet) return;
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), stereo = ctx.createStereoPanner();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFrequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration * .75);
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    stereo.pan.value = pan;
    oscillator.connect(gain); gain.connect(stereo); stereo.connect(this.dry); stereo.connect(this.wet);
    this.sources.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); stereo.disconnect(); this.sources.delete(oscillator); };
    oscillator.start(time); oscillator.stop(time + duration + .02);
  }
  // 상호작용 종류별로 종소리·마법 화음·새소리 합성을 선택한다.
  playChime(type: Chime = 'sparkle') {
    if (!this.enabled || document.hidden || performance.now() - this.lastPlayed < 160) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.lastPlayed = performance.now();
      const now = this.ctx.currentTime + .015;
      if (type === 'page') {
        // A brief struck bronze bell with softly detuned upper partials.
        [[392, .12, .72], [785, .045, .58], [1178, .018, .42], [1760, .008, .3]].forEach(([hz, gain, duration], i) => this.voice(hz, now + i * .006, duration, gain, 'sine', (i % 2 ? 1 : -1) * .2, .008));
      } else if (type === 'lumos') {
        // A rising, warm chord with a few bright sparkles for a magical flourish.
        [261.63, 329.63, 392, 523.25].forEach((hz, i) => this.voice(hz, now + i * .055, .85, .038, 'triangle', (i - 1.5) * .2, .045));
        this.voice(1046.5, now + .2, .5, .025, 'sine', .35, .025);
        this.chirp(1318.5, 1760, now + .28, .22, .018, -.3);
      } else {
        // Two light, upward bird-like calls, synthesized without an audio asset.
        this.chirp(1568, 2093, now, .16, .055, -.2);
        this.chirp(1760, 2349, now + .12, .17, .045, .2);
        this.chirp(2093, 1760, now + .28, .15, .035, 0);
      }
    } catch { /* Browsers without audio support keep all navigation usable. */ }
  }
}
export const sound = new SoundManager();
