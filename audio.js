/**
 * Procedural Wind & Ambience Synthesizer for ASCII Knight
 * Uses Web Audio API without any external audio assets.
 */
class KnightAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.masterGain = null;
    this.windFilter1 = null;
    this.windFilter2 = null;
    this.windGain = null;
    this.grassGain = null;
    this.grassFilter = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Create pink noise buffer (5 seconds)
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Wind noise source
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    // Wind filter 1 (deep rumble)
    this.windFilter1 = this.ctx.createBiquadFilter();
    this.windFilter1.type = "lowpass";
    this.windFilter1.frequency.setValueAtTime(240, this.ctx.currentTime);
    this.windFilter1.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Wind filter 2 (howling resonance)
    this.windFilter2 = this.ctx.createBiquadFilter();
    this.windFilter2.type = "bandpass";
    this.windFilter2.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.windFilter2.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    // Grass rustle noise source
    const grassSource = this.ctx.createBufferSource();
    grassSource.buffer = noiseBuffer;
    grassSource.loop = true;

    this.grassFilter = this.ctx.createBiquadFilter();
    this.grassFilter.type = "bandpass";
    this.grassFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.grassFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.grassGain = this.ctx.createGain();
    this.grassGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Connect nodes
    windSource.connect(this.windFilter1);
    this.windFilter1.connect(this.windFilter2);
    this.windFilter2.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    grassSource.connect(this.grassFilter);
    this.grassFilter.connect(this.grassGain);
    this.grassGain.connect(this.masterGain);

    windSource.start(0);
    grassSource.start(0);
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0.0001 : 0.65;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.6);
    }
    return !this.isMuted;
  }

  update(windStrength, gust) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Modulate wind frequency based on gusts
    const baseFreq = 220 + windStrength * 160 + gust * 280;
    const howlFreq = 350 + windStrength * 250 + gust * 450;
    const targetGain = 0.25 + gust * 0.45;

    this.windFilter1.frequency.setTargetAtTime(baseFreq, now, 0.1);
    this.windFilter2.frequency.setTargetAtTime(howlFreq, now, 0.15);
    this.windGain.gain.setTargetAtTime(targetGain, now, 0.1);

    // Modulate grass rustle
    const rustleFreq = 1200 + gust * 900;
    this.grassFilter.frequency.setTargetAtTime(rustleFreq, now, 0.1);
    this.grassGain.gain.setTargetAtTime(0.04 + gust * 0.12, now, 0.1);
  }
}

window.KnightAudio = KnightAudio;
