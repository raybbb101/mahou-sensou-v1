// 効果音はすべて WebAudio で合成する(音声ファイルなし)。
const ELEM = {
  fire: { noise: 900, tone: 120, type: "sawtooth", dur: .28 }, ice: { noise: 4200, tone: 1400, type: "sine", dur: .22 },
  water: { noise: 1400, tone: 300, type: "sine", dur: .25 }, thunder: { noise: 5200, tone: 90, type: "square", dur: .2 },
  arcane: { noise: 2400, tone: 660, type: "triangle", dur: .22 }, holy: { noise: 3000, tone: 880, type: "sine", dur: .34 },
  shadow: { noise: 500, tone: 80, type: "sawtooth", dur: .36 }, nature: { noise: 1800, tone: 240, type: "triangle", dur: .22 },
};
export class Sfx {
  constructor() { this.ctx = null; this.vol = .5; this.last = {}; this.muted = false; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination); this.nb = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate); const d = this.nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch { this.ctx = null; }
  }
  tone(f0, f1, dur, type = "sine", g = .2) {
    const C = this.ctx, t = C.currentTime, o = C.createOscillator(), a = C.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(a); a.connect(this.master); o.start(t); o.stop(t + dur);
  }
  noise(freq, dur, g = .2, q = 1) {
    const C = this.ctx, t = C.currentTime, s = C.createBufferSource(), f = C.createBiquadFilter(), a = C.createGain();
    s.buffer = this.nb; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(a); a.connect(this.master); s.start(t, Math.random() * .5, dur + .02);
  }
  play(name) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.last[name] && now - this.last[name] < .05) return;
    this.last[name] = now;
    const [k, el] = name.split("-");
    if ((k === "cast" || k === "hit") && ELEM[el]) {
      const E = ELEM[el];
      if (k === "cast") { this.tone(E.tone * 1.5, E.tone * 2.4, .12, E.type, .08); this.noise(E.noise, .1, .05, 2); }
      else { this.tone(E.tone * 1.2, E.tone * .5, E.dur, E.type, .14); this.noise(E.noise, E.dur, .16); }
      return;
    }
    switch (name) {
      case "hurt": this.tone(240, 70, .16, "square", .12); this.noise(600, .12, .12); break;
      case "boom": this.tone(120, 30, .5, "sawtooth", .22); this.noise(300, .5, .3); break;
      case "boss-dead": this.tone(300, 30, 1.4, "sawtooth", .25); this.noise(240, 1.4, .34); break;
      case "boss-cast": this.tone(110, 240, .3, "triangle", .09); break;
      case "boss-shot": this.tone(420, 140, .14, "square", .05); break;
      case "boss-dash": this.noise(500, .35, .2); this.tone(90, 200, .3, "sawtooth", .1); break;
      case "hit-boss": this.noise(700, .16, .1); break;
      case "down": this.tone(440, 60, .7, "triangle", .2); break;
      case "heal": this.tone(520, 1040, .3, "sine", .1); this.tone(780, 1560, .26, "sine", .07); break;
      case "reflect": this.tone(1200, 300, .2, "square", .08); break;
      case "thunder": this.noise(4000, .2, .2); this.tone(70, 40, .4, "sawtooth", .2); break;
      case "reaction": this.tone(520, 1560, .18, "square", .1); this.noise(3000, .18, .14); break;
      case "dash": this.noise(2200, .14, .12, .7); this.tone(300, 620, .1, "sine", .05); break;
      case "perfect": this.tone(1200, 1900, .12, "sine", .14); this.tone(1800, 2600, .16, "triangle", .08); break;
      case "ult": this.tone(70, 900, .9, "sawtooth", .22); this.noise(900, 1, .3); setTimeout(() => { if (this.ctx) { this.tone(1100, 120, .9, "square", .14); this.noise(300, 1.2, .4); } }, 500); break;
      case "ui": this.tone(660, 880, .07, "square", .05); break;
      case "ui2": this.tone(880, 1320, .1, "square", .06); break;
      case "win": [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, f, .3, "triangle", .15), i * 130)); break;
    }
  }
}
