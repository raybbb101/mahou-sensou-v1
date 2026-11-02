// 描画: スナップショットを受け取り 640x360 の 2.5D 画面を作る。pixelfx の frame に効果もスプライトも描く。
import { createFrame, clearFrame, createFx, composite } from "../../vendor/pixelfx/src/core/index.js";
import { FX } from "./fx-registry.js";
import { FX_PAL } from "./palettes.js";
import { buildStage, VW, VH, PAD, CX, CY } from "./stage.js";
import { bakeBoss, bossActor, FRAMES, BOSS_ART } from "./bosses-art.js";
import { paintHero, heroActor, paintImp } from "./hero.js";
import { hexc } from "./art.js";
import { BOSSES } from "../sim/bosses.js";
import { STATUS_INFO, ELEMENTS } from "../sim/skills.js";
import { ULTS } from "../sim/ults.js";
import { Sfx } from "./audio.js";

const Z = .5;
const toS = (x, z) => [CX + x, CY + z * Z];
const GROUND_FX = new Set(["nature/toxic-puddle", "arcane/rune-circle", "arcane/magic-circle-cast", "nature/root-snare", "shadow/hex-sigil"]);
// 地面から離れた位置に描くと自然な、方向を持たないエフェクト
const BODY_FX = new Set(["poisoned", "frozen", "petrified"]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

export class View {
  constructor(canvas, overlay) {
    this.c = canvas; this.ctx = canvas.getContext("2d");
    canvas.width = VW; canvas.height = VH;
    this.ov = overlay; this.octx = overlay.getContext("2d");
    this.frame = createFrame(VW, VH);
    this.img = new ImageData(VW, VH);
    this.pix = this.img.data;
    this.bg = new Uint32Array(VW * VH);
    this.base = new Uint32Array(VW * VH);
    this.baseCam = null;
    this.stages = new Map();
    this.floorNo = 0;
    this.fx = [];
    this.loops = new Map();     // 弾・ゾーンなど ID に紐づくループ
    this.statusFx = new Map();
    this.nums = [];
    this.heroes = new Map();
    this.actors = new Map();
    this.boss = null;
    this.prev = null; this.curr = null; this.since = 0; this.interval = 1 / 30;
    this.cam = { x: 0, y: 0 }; this.shake = 0;
    this.time = 0;
    this.flash = 0; this.hurt = 0;
    this.selfId = null;
    // 必殺技の全画面演出(発動した本人の画面だけ)
    this.skyCanvas = document.getElementById("sky");
    this.skyCanvas.width = 320; this.skyCanvas.height = 180;
    this.skyCtx = this.skyCanvas.getContext("2d");
    this.skyFrame = createFrame(320, 180);
    this.skyImg = new ImageData(320, 180);
    this.sky = null;
    this.trail = [];
    this.particles = [];
    this.sfx = new Sfx();
    this.listeners = {};
    this.scale = 1;
    this.imps = [paintImp(0), paintImp(.25), paintImp(.5), paintImp(.75)];
    this.bossAir = 0;
  }
  on(k, fn) { this.listeners[k] = fn; }
  emit(k, v) { this.listeners[k]?.(v); }

  resize() {
    const W = innerWidth, H = innerHeight, k = Math.max(.25, Math.floor(Math.min(W / VW, H / VH) * 4) / 4);
    this.scale = k;
    const w = Math.round(VW * k), h = Math.round(VH * k);
    for (const el of [this.c, this.ov, this.skyCanvas]) { el.style.width = w + "px"; el.style.height = h + "px"; }
    const dpr = devicePixelRatio || 1;
    this.ov.width = w * dpr; this.ov.height = h * dpr;
    this.dpr = dpr;
    document.documentElement.style.setProperty("--game-w", w + "px");
    document.documentElement.style.setProperty("--game-h", h + "px");
    document.documentElement.style.setProperty("--k", k);
  }

  setFloor(n, withBoss = true) {
    if (n === this.floorNo && (this.boss || !withBoss)) return;
    this.floorNo = n;
    const def = BOSSES[n - 1];
    if (!this.stages.has(n)) this.stages.set(n, buildStage(def.stage, n));
    this.stage = this.stages.get(n);
    this.baseCam = null;
    this.particles = [];
    this.boss = withBoss ? bakeBoss(def.id) : null;
    this.bossAct = this.boss ? bossActor(this.boss) : null;
    this.def = def;
    this.bossAir = 0;
    this.clearAll();
  }
  clearAll() {
    this.fx = []; this.loops.clear(); this.statusFx.clear(); this.nums = [];
    this.prev = this.curr = null;
    this.trail = [];
    if (this.sky) { this.sky = null; this.skyCanvas.classList.remove("on"); this.skyCanvas.style.background = ""; }
  }

  heroFrame(col, dir, step, cast, down) {
    const key = `${col}|${dir}|${step}|${cast}|${down}`;
    let a = this.heroes.get(key);
    if (!a) this.heroes.set(key, (a = paintHero(col, dir, step, cast, down)));
    return a;
  }
  heroActorOf(col) {
    let a = this.actors.get(col);
    if (!a) this.actors.set(col, (a = heroActor(col)));
    return a;
  }

  // ──────── 効果 ────────
  spawnFx(e) {
    const mod = FX[e.fx];
    if (!mod) return;
    const o = { x: 0, y: 0, seed: (Math.random() * 1000) | 0 };
    const meta = mod.meta;
    if (e.pal && meta.options?.palette && FX_PAL[e.pal]) o.palette = FX_PAL[e.pal];
    if (e.reach && meta.options?.reach !== undefined) o.reach = e.reach;
    if (meta.actor) {
      if (e.onBoss || e.pal) o.actor = this.bossAct || this.heroActorOf("#888888");
      else {
        const p = e.attach && this.curr?.p.find((q) => q.id === e.attach);
        o.actor = this.heroActorOf(p?.col || this.curr?.p[0]?.col || "#3f8cff");
      }
    }
    if (e.ang !== undefined) {
      const s = Math.atan2(Math.sin(e.ang) * Z, Math.cos(e.ang));
      if (Math.cos(s) < 0) { o.flip = true; o.angle = s + Math.PI; } else o.angle = s;
    }
    const [sx, sy] = toS(e.x, e.z);
    let ox = sx, oy = sy - (e.hover || 0);
    if (e.chest && !meta.actor) oy -= 20;
    const inst = createFx(mod, { ...o, x: ox, y: oy });
    if (e.skip) inst.update(e.skip);
    const it = { inst, rate: e.rate || 1, startIn: (e.startIn || 0) + (e.delay || 0), attach: e.attach, onBoss: e.onBoss, attachId: e.attachId, chest: e.chest && !meta.actor, cut: e.cut ?? null, loopFor: e.loopFor ?? null, age: 0, ground: e.ground || GROUND_FX.has(e.fx), id: e.fx };
    this.fx.push(it);
    if (this.fx.length > 90) this.fx.shift();
    return it;
  }
  loopFx(key, fxId, pal, x, y, opts = {}) {
    const mod = FX[fxId];
    if (!mod) return null;
    let it = this.loops.get(key);
    if (!it) {
      const o = { x, y, seed: (key.length * 7 + x | 0) % 97 };
      if (pal && mod.meta.options?.palette && FX_PAL[pal]) o.palette = FX_PAL[pal];
      if (mod.meta.actor && !o.actor) o.actor = this.heroActorOf(this.curr?.p[0]?.col || "#3f8cff");
      Object.assign(o, opts);
      it = { inst: createFx(mod, o), seen: 0, rate: 1 };
      this.loops.set(key, it);
    }
    it.inst.options.x = x; it.inst.options.y = y;
    if (opts.flip !== undefined) { it.inst.options.flip = opts.flip; it.inst.options.angle = opts.angle; }
    it.seen = this.time;
    return it;
  }

  playSky(ultId) {
    const U = ULTS[ultId], mod = FX[U.sky];
    if (!mod) return;
    const o = { x: 160, y: mod.meta.origin[1], seed: 11 };
    if (U.skyPal && mod.meta.options?.palette && FX_PAL[U.skyPal]) o.palette = FX_PAL[U.skyPal];
    const inst = createFx(mod, o);
    inst.update(1.5);   // 降り始めの空白を飛ばす
    this.sky = { inst, t: 0, dur: 4.5 };
    this.skyCanvas.classList.add("on");
    this.skyCanvas.style.background = U.color + "2a";
  }
  stepSky(dt) {
    const Y = this.sky;
    if (!Y) return;
    Y.t += dt;
    Y.inst.update(dt);
    clearFrame(this.skyFrame);
    try { Y.inst.draw(this.skyFrame); } catch (e) { console.warn("sky", e); }
    composite(this.skyFrame, this.skyImg.data, null);
    this.skyCtx.putImageData(this.skyImg, 0, 0);
    if (Y.t > Y.dur) { this.sky = null; this.skyCanvas.classList.remove("on"); this.skyCanvas.style.background = ""; }
  }

  // ──────── スナップショット ────────
  apply(s, interval) {
    if (interval) this.interval = interval;
    this.prev = this.curr || s;
    this.curr = s;
    this.since = 0;
    for (const e of s.ev) this.handle(e);
  }
  handle(e) {
    switch (e.e) {
      case "fx": this.spawnFx(e); break;
      case "shake": this.shake = Math.max(this.shake, e.v); break;
      case "flash": this.flash = e.v; break;
      case "sfx": this.sfx.play(e.s); break;
      case "num": this.addNum(e); break;
      case "hurt": if (e.id === this.selfId) { this.hurt = Math.max(this.hurt, .35 + e.v); this.shake = Math.max(this.shake, 3 + e.v * 6); } break;
      case "banner": this.emit("banner", e); break;
      case "toast": if (e.id === this.selfId) this.emit("toast", e); break;
      case "bossmove": this.emit("bossmove", e.name); break;
      case "element": this.emit("element", e); break;
      case "note": this.emit("note", e); break;
      case "ult":
        if (e.id === this.selfId) { this.playSky(e.ult); this.emit("ult", e.ult); this.flash = Math.max(this.flash, .8); }
        break;
      case "ultready": if (e.id === this.selfId) this.emit("toast", { text: "必殺技 発動可能! スペース長押し" }); break;
      case "synergy": if (e.id === this.selfId) this.emit("synergy", e); break;
    }
  }
  addNum(e) {
    const [sx, sy] = toS(e.x, e.z);
    this.nums.push({ x: sx, y: sy - (e.h || 40), text: e.text, kind: e.kind, t: 0, vy: -32 - Math.random() * 12, vx: (Math.random() - .5) * 16 });
    if (this.nums.length > 60) this.nums.shift();
  }

  // ──────── 1 フレーム ────────
  render(dt, title = false) {
    this.time += dt;
    this.since += dt;
    const a = this.since / this.interval > 1 ? 1 : this.since / this.interval;
    const S = this.curr, P = this.prev;
    if (!this.stage) return;
    // カメラ: 自分とボスの中間を少し追う(視差を生む)
    let tx = 0, ty = 0;
    if (S) {
      const me = S.p.find((q) => q.id === this.selfId) || S.p[0];
      if (me) { const ax = me.x * .6 + S.b.x * .4, az = me.z * .6 + S.b.z * .4; tx = clamp(ax * .09, -PAD + 4, PAD - 4); ty = clamp(az * .05, -PAD + 8, PAD - 8); }
    } else { tx = Math.sin(this.time * .2) * 14; ty = Math.cos(this.time * .14) * 5; }
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 3);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 3);
    this.shake = Math.max(0, this.shake - dt * 26);
    const sk = this.shake, shx = sk ? (Math.random() - .5) * sk : 0, shy = sk ? (Math.random() - .5) * sk : 0;
    const camX = Math.round(this.cam.x + shx), camY = Math.round(this.cam.y + shy);
    this.composeBase(camX, camY);
    this.bg.set(this.base);
    const f = this.frame;
    f.ox = camX; f.oy = camY;
    clearFrame(f);
    this.camX = camX; this.camY = camY;

    // 床に描くもの(影・予告)は bg に合成
    if (S) this.drawFloorMarks(S, P, a);

    // エフェクト更新
    for (const it of this.fx) {
      if (it.startIn > 0) { it.startIn -= dt; continue; }
      it.inst.update(dt * it.rate);
      it.age += dt;
      if (it.cut !== null && it.age >= it.cut) { it.inst.stop(); it.cut = null; }
      if (it.loopFor !== null && it.age >= it.loopFor) { it.inst.stop(); it.loopFor = null; }
    }
    this.fx = this.fx.filter((it) => it.startIn > 0 || !it.inst.done());
    for (const it of this.loops.values()) it.inst.update(dt);
    for (const it of this.statusFx.values()) it.inst.update(dt);

    if (S) this.syncEntities(S, P, a);
    const lerped = S ? this.lerpedPlayers(S, P, a) : [];
    const B = S ? this.lerpedBoss(S, P, a) : null;
    if (S) this.follow(lerped, B);

    // 奥に描く効果
    for (const it of this.fx) { if (it.startIn > 0) continue; if (it.ground) this.safeDraw(it.inst); else this.safeDraw(it.inst, "back"); }
    for (const [k, it] of this.loops) { if (k.startsWith("z")) this.safeDraw(it.inst, it.groundOnly ? undefined : "back"); }

    // y ソートしてキャラを描く
    if (S) {
      const ents = [];
      if (B && this.boss) ents.push({ z: B.z, d: () => this.drawBoss(B, S) });
      for (const p of lerped) ents.push({ z: p.z, d: () => this.drawHero(p) });
      for (const m of S.sm) ents.push({ z: m[2], d: () => this.drawSummon(m) });
      for (const c of S.cr) ents.push({ z: c[2], d: () => this.drawCrystal(c) });
      ents.sort((u, v) => u.z - v.z);
      for (const e of ents) e.d();
    }

    // 手前の効果
    for (const [k, it] of this.loops) {
      if (k.startsWith("z") && it.groundOnly) continue;
      this.safeDraw(it.inst, "front");
    }
    for (const it of this.statusFx.values()) this.safeDraw(it.inst);
    for (const it of this.fx) { if (it.startIn > 0 || it.ground) continue; this.safeDraw(it.inst, "front"); }

    this.drawAmbient(dt);
    this.drawForeground(camX, camY);
    this.stepSky(dt);
    composite(f, this.pix, this.bg);
    if (this.flash > 0) { const k = this.flash; for (let i = 0; i < this.pix.length; i += 4) { this.pix[i] += (255 - this.pix[i]) * k; this.pix[i + 1] += (255 - this.pix[i + 1]) * k; this.pix[i + 2] += (255 - this.pix[i + 2]) * k; } this.flash = Math.max(0, this.flash - dt * 2.4); }
    this.ctx.putImageData(this.img, 0, 0);
    this.drawOverlay(dt, lerped, B, S);
    this.hurt = Math.max(0, this.hurt - dt * 1.4);
    this.emit("hurtv", this.hurt);
  }
  safeDraw(inst, layer) {
    try { inst.draw(this.frame, layer); } catch (e) { if (!this.warned?.has(inst.meta?.name)) { (this.warned ||= new Set()).add(inst.meta?.name); console.warn("fx", inst.meta?.name, e); } }
  }

  composeBase(cx, cy) {
    const key = cx + "," + cy;
    if (this.baseCam === key) return;
    this.baseCam = key;
    const St = this.stage, W = St.W;
    const wx = PAD + Math.round(cx * .55), wy = PAD + Math.round(cy * .55), fx = PAD + cx, fy = PAD + cy;
    const out = this.base;
    for (let y = 0; y < VH; y++) {
      const wo = (y + wy) * W + wx, fo = (y + fy) * W + fx, oo = y * VW;
      for (let x = 0; x < VW; x++) { const c = St.floor[fo + x]; out[oo + x] = c || St.wall[wo + x]; }
    }
  }
  drawForeground(cx, cy) {
    const St = this.stage, W = St.W, f = this.frame;
    const ox = PAD + Math.round(cx * 1.35), oy = PAD + Math.round(cy * 1.35);
    for (let y = 0; y < VH; y++) {
      const so = (y + oy) * W + ox, oo = y * VW;
      for (let x = 0; x < VW; x++) { const c = St.fore[so + x]; if (c) { f.color[oo + x] = c; f.light[oo + x] = 0; } }
    }
    // 松明のゆらぎ
    const G = hexc(St.theme.glow);
    const lr = G & 255, lg = (G >>> 8) & 255, lb = (G >>> 16) & 255;
    for (const [tx, ty] of St.torches) {
      const sx = tx - Math.round(cx * .55), sy = ty - Math.round(cy * .55);
      const fl = .7 + Math.sin(this.time * 9 + tx) * .15 + Math.sin(this.time * 23 + ty) * .1;
      for (let j = -9; j <= 3; j++) for (let i = -4; i <= 4; i++) {
        const X = sx + i, Y = sy + j;
        if (X < 0 || Y < 0 || X >= VW || Y >= VH) continue;
        const w = (j + 9) / 12 * 3.4 * fl + Math.sin(this.time * 14 + j) * .6;
        if (Math.abs(i) < w && j < 3) f.light[Y * VW + X] = ((lb * .8) << 16 | (lg * .8) << 8 | lr * .8) >>> 0;
      }
    }
  }

  // ──────── 床の上の印 ────────
  blendEllipse(sx, sy, rx, ry, col, alpha) {
    const cx = sx - this.camX, cy = sy - this.camY, bg = this.bg;
    const r = col & 255, g = (col >>> 8) & 255, b = (col >>> 16) & 255;
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(VH - 1, cy + ry); y++) for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(VW - 1, cx + rx); x++) {
      const u = (x - cx) / rx, v = (y - cy) / ry;
      if (u * u + v * v > 1) continue;
      const i = y * VW + x, c = bg[i];
      bg[i] = ((255 << 24) | ((((c >>> 16) & 255) * (1 - alpha) + b * alpha) << 16) | ((((c >>> 8) & 255) * (1 - alpha) + g * alpha) << 8) | ((c & 255) * (1 - alpha) + r * alpha)) >>> 0;
    }
  }
  shapeMark(h) {
    // 予告: [id, shape, x, z, r, r2, ang, len, wid, t, tele, safe]
    const [, shape, x, z, r, r2, ang, len, wid, t, tele, safe] = h;
    const prog = 1 - clamp(t / (tele || 1), 0, 1);
    const pulse = .5 + .5 * Math.sin(this.time * 18);
    const cX = CX + x - this.camX, cY = CY + z * Z - this.camY;
    const col = safe ? [90, 255, 200] : [255, 50, 50];
    const edge = safe ? [190, 255, 235] : [255, 214, 140];
    const bg = this.bg;
    let x0, x1, y0, y1;
    const inside = (wx, wz) => {
      const dx = wx - x, dz = wz - z, d = Math.hypot(dx, dz);
      if (shape === "circle") {
        if (d > r) return -1;
        return d > r - 2.5 ? 2 : d < r * prog ? 1 : 0;
      }
      if (shape === "donut") {
        if (d < r || d > r2) return -1;
        const inner = r2 - (r2 - r) * prog;
        return d < r + 2.5 ? 2 : d > inner ? 1 : 0;
      }
      if (shape === "cone") {
        if (d > len) return -1;
        let da = Math.atan2(dz, dx) - ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > wid) return -1;
        return Math.abs(da) > wid - .03 || d > len - 3 ? 2 : d < len * prog ? 1 : 0;
      }
      if (shape === "line") {
        const cx = Math.cos(ang), cz = Math.sin(ang), al = dx * cx + dz * cz, of = Math.abs(dx * cz - dz * cx);
        if (al < 0 || al > len || of > wid / 2) return -1;
        return of > wid / 2 - 2 ? 2 : al < len * prog ? 1 : 0;
      }
      return -1;
    };
    const ext = shape === "circle" ? r : shape === "donut" ? r2 : len;
    x0 = Math.max(0, Math.floor(cX - ext)); x1 = Math.min(VW - 1, Math.ceil(cX + ext));
    y0 = Math.max(0, Math.floor(cY - ext * Z)); y1 = Math.min(VH - 1, Math.ceil(cY + ext * Z));
    for (let sy = y0; sy <= y1; sy++) for (let sx = x0; sx <= x1; sx++) {
      const wx = sx + this.camX - CX, wz = (sy + this.camY - CY) / Z;
      if (wx * wx + wz * wz > 275 * 275) continue;
      const v = inside(wx, wz);
      if (v < 0) continue;
      const i = sy * VW + sx, c = bg[i];
      let al, C = col;
      if (v === 2) { al = .92; C = edge; }
      else if (v === 1) al = .38 + pulse * .1;
      else al = ((sx + sy) & 1) ? .16 : .1;
      bg[i] = ((255 << 24) | ((((c >>> 16) & 255) * (1 - al) + C[2] * al) << 16) | ((((c >>> 8) & 255) * (1 - al) + C[1] * al) << 8) | ((c & 255) * (1 - al) + C[0] * al)) >>> 0;
    }
  }
  drawFloorMarks(S, P, a) {
    // ゾーンの範囲
    for (const z of S.z) {
      const [, x, zz, , side, r] = z;
      const [sx, sy] = toS(x, zz);
      this.ring(sx, sy, r, side ? 0xffa040ff : 0xfff0c040, side ? .55 : .28);
    }
    for (const r of S.ru) {
      const [sx, sy] = toS(r[1], r[2]);
      this.blendEllipse(sx, sy, r[3], r[3] * Z, 0xffc0ffa0, .28 + .1 * Math.sin(this.time * 6));
      this.ring(sx, sy, r[3], 0xfffff0a0, 1);
    }
    for (const h of S.hz) this.shapeMark(h);
    // 影
    const b = S.b;
    if (!b.dead && this.boss) {
      const [sx, sy] = toS(b.x, b.z);
      this.blendEllipse(sx, sy, this.boss.w * .36, this.boss.w * .13, 0xff000000, .4);
      if (b.vuln) this.ring(sx, sy, BOSSES[S.floor - 1].hitR + 4 + Math.sin(this.time * 10) * 2, 0xff4060ff, 1);
      if (b.el) { const col = hexc(ELEMENTS[b.el].color); this.ring(sx, sy, BOSSES[S.floor - 1].hitR + 10, col, .9); }
    }
    for (const p of S.p) { const [sx, sy] = toS(p.x, p.z); this.blendEllipse(sx, sy, p.dn ? 11 : 9, 3.5, 0xff000000, .4); if (p.id === this.selfId && !p.dn) this.ring(sx, sy, 14, hexc(p.col), .7); }
    for (const q of S.pr) { const [sx, sy] = toS(q[1], q[2]); this.blendEllipse(sx, sy, q[9] * .9 + 2, q[9] * .35 + 1, 0xff000000, .3); if (q[4] === 1) this.ring(sx, sy, q[9] + 7, 0xff5050ff, .75); }
  }
  ring(sx, sy, r, col, al) {
    const cx = sx - this.camX, cy = sy - this.camY, bg = this.bg;
    const n = Math.max(16, Math.floor(r * 3.2));
    const R = col & 255, G = (col >>> 8) & 255, B = (col >>> 16) & 255;
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, x = Math.round(cx + Math.cos(t) * r), y = Math.round(cy + Math.sin(t) * r * Z);
      if (x < 0 || y < 0 || x >= VW || y >= VH) continue;
      const j = y * VW + x, c = bg[j];
      bg[j] = ((255 << 24) | ((((c >>> 16) & 255) * (1 - al) + B * al) << 16) | ((((c >>> 8) & 255) * (1 - al) + G * al) << 8) | ((c & 255) * (1 - al) + R * al)) >>> 0;
    }
  }

  // ──────── 実体 ────────
  lerpedPlayers(S, P, a) {
    return S.p.map((p) => {
      const q = P?.p.find((k) => k.id === p.id) || p;
      const x = lerp(q.x, p.x, a), z = lerp(q.z, p.z, a);
      return { ...p, x, z, aang: p.ch ? Math.atan2(p.az - z, p.ax - x) : undefined };
    });
  }
  lerpedBoss(S, P, a) {
    const b = S.b, q = P?.b || b;
    const far = Math.hypot(b.x - q.x, b.z - q.z) > 60;
    return { ...b, x: far ? b.x : lerp(q.x, b.x, a), z: far ? b.z : lerp(q.z, b.z, a) };
  }
  syncEntities(S, P, a) {
    const seen = new Set();
    const lp = (id, list) => { const q = P && list(P).find((k) => k[0] === id); return q; };
    for (const q of S.pr) {
      const [id, x, z, fxId, side, dir, hover, ang, pal] = q;
      const key = "p" + id;
      seen.add(key);
      const prv = lp(id, (s) => s.pr) || q;
      const X = lerp(prv[1], x, a), ZZ = lerp(prv[2], z, a);
      const [sx, sy] = toS(X, ZZ);
      if (dir) {
        const s = Math.atan2(Math.sin(ang) * Z, Math.cos(ang));
        const flip = Math.cos(s) < 0;
        this.loopFx(key, fxId, pal || null, sx, sy - 16, { flip, angle: flip ? s + Math.PI : s });
      } else this.loopFx(key, fxId, pal || null, sx, sy);
    }
    for (const q of S.z) {
      const [id, x, z, fxId, side, r, pal, hoverFx, life, rate] = q;
      const key = "z" + id;
      seen.add(key);
      const [sx, sy] = toS(x, z);
      const it = this.loopFx(key, fxId, pal || null, sx, sy - (hoverFx ? (fxId === "holy/sunburst" ? 30 : 0) : 0));
      if (it) { it.groundOnly = GROUND_FX.has(fxId); }
    }
    for (const m of S.sm) if (m[3] !== "summon-rise" && m[4]) { const key = "sum" + m[0]; seen.add(key); const [sx, sy] = toS(m[1], m[2]); this.loopFx(key, "arcane/portal", null, sx, sy); }
    for (const [k, it] of this.loops) if (!seen.has(k)) { it.inst.stop(); this.fx.push({ inst: it.inst, rate: 1, startIn: 0, age: 0, cut: null, loopFor: null }); this.loops.delete(k); }

    // 状態異常ループ
    const sseen = new Set();
    for (const p of S.p) {
      if (p.dn) continue;
      const list = [...p.ss, ...(p.bf.includes("haste") ? ["haste"] : []), ...(p.bf.includes("rage") ? ["rage"] : [])];
      for (const st of list) {
        const key = p.id + "/" + st;
        sseen.add(key);
        if (!this.statusFx.has(key) && STATUS_INFO[st]) {
          const mod = FX[STATUS_INFO[st].fx];
          if (!mod) continue;
          this.statusFx.set(key, { inst: createFx(mod, { x: 0, y: 0, actor: this.heroActorOf(p.col), seed: 3 }), pid: p.id });
        }
      }
    }
    const b = S.b;
    if (!b.dead) {
      // 体を塗り替える状態異常はボスの絵を隠してしまうので、ボスには色味(tint)で表現する
      const list = [...b.ss.filter((k) => !BODY_FX.has(k)), ...(b.bf.includes("rage") ? ["rage"] : []), ...(b.bf.includes("haste") ? ["haste"] : [])];
      if (b.stag && !b.stop) list.push("stunned");
      for (const st of list) {
        const key = "boss/" + st;
        sseen.add(key);
        if (!this.statusFx.has(key) && STATUS_INFO[st] && this.bossAct) {
          const mod = FX[STATUS_INFO[st].fx];
          if (mod) this.statusFx.set(key, { inst: createFx(mod, { x: 0, y: 0, actor: this.bossAct, seed: 5 }), pid: "boss" });
        }
      }
      if (b.ward) { const key = "boss/ward"; sseen.add(key); if (!this.statusFx.has(key)) this.statusFx.set(key, { inst: createFx(FX["holy/divine-shield"], { x: 0, y: 0, radius: Math.min(60, BOSSES[S.floor - 1].hitR + 14), actor: this.bossAct, palette: FX_PAL[BOSSES[S.floor - 1].pal], seed: 2 }), pid: "boss" }); }
      if (b.rf) { const key = "boss/rf"; sseen.add(key); if (!this.statusFx.has(key)) this.statusFx.set(key, { inst: createFx(FX["status/cursed"], { x: 0, y: 0, actor: this.bossAct, seed: 2 }), pid: "boss" }); }
    }
    for (const [k, it] of this.statusFx) if (!sseen.has(k)) { this.statusFx.delete(k); }
    // ピンチ時の鼓動は UI 側で
  }
  follow(players, B) {
    for (const it of this.fx) {
      if (it.attach) { const p = players.find((q) => q.id === it.attach); if (p) { const [sx, sy] = toS(p.x, p.z); it.inst.options.x = sx; it.inst.options.y = sy; } }
      if (it.attachId) { const p = players.find((q) => q.id === it.attachId); if (p) { const [sx, sy] = toS(p.x, p.z); it.inst.options.x = sx; it.inst.options.y = sy - (it.chest ? 20 : 0); const ang = p.aang; if (ang !== undefined) { const s = Math.atan2(Math.sin(ang) * Z, Math.cos(ang)); const flip = Math.cos(s) < 0; it.inst.options.flip = flip; it.inst.options.angle = flip ? s + Math.PI : s; } } }
      if (it.onBoss && B) { const [sx, sy] = toS(B.x, B.z); it.inst.options.x = sx; it.inst.options.y = sy - this.bossAir; }
    }
    for (const [k, it] of this.statusFx) {
      if (it.pid === "boss") { if (B) { const [sx, sy] = toS(B.x, B.z); it.inst.options.x = sx; it.inst.options.y = sy - this.bossAir; } }
      else { const p = players.find((q) => q.id === it.pid); if (p) { const [sx, sy] = toS(p.x, p.z); it.inst.options.x = sx; it.inst.options.y = sy; } }
    }
    if (this.statusFx.size) {} 
  }

  blit(art, sx, sy, flip, o = {}) {
    const f = this.frame, ox = Math.round(sx - this.camX), oy = Math.round(sy - this.camY);
    const { w, h, px, em } = art, C = f.color, L = f.light;
    const flash = o.flash, tint = o.tint, dither = o.dither;
    for (let y = 0; y < h; y++) {
      const Y = oy + y;
      if (Y < 0 || Y >= VH) continue;
      for (let x = 0; x < w; x++) {
        const c = px[y * w + x];
        const e = em[y * w + x];
        const X = ox + (flip ? w - 1 - x : x);
        if (X < 0 || X >= VW) continue;
        if (e && !o.noEm) { L[Y * VW + X] = e; }
        if (!c) continue;
        if (dither && ((X ^ Y) & dither) !== 0) continue;
        let out = c;
        if (flash) out = 0xffffffff;
        else if (tint) { const r = (c & 255) * (1 - tint[3]) + tint[0] * tint[3], g = ((c >>> 8) & 255) * (1 - tint[3]) + tint[1] * tint[3], b = ((c >>> 16) & 255) * (1 - tint[3]) + tint[2] * tint[3]; out = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; }
        C[Y * VW + X] = out;
      }
    }
  }
  drawBoss(B, S) {
    if (B.dead) {
      const dt = (this.deathT = (this.deathT || 0) + 1 / 60);
      if (dt > 1.6) return;
      const [sx, sy] = toS(B.x, B.z), a = this.boss.idle[0];
      this.blit(a, sx - a.w / 2 + (Math.random() - .5) * 6, sy - a.h + 2, B.f < 0, { dither: dt > .8 ? 3 : dt > .3 ? 1 : 0, flash: Math.floor(dt * 12) % 2 === 0 });
      return;
    }
    this.deathT = 0;
    const [sx, sy] = toS(B.x, B.z);
    const targetAir = B.air ? 70 : 0;
    this.bossAir += (targetAir - this.bossAir) * .08;
    const list = B.c ? this.boss.cast : this.boss.idle;
    const stopped = B.stop || B.stag;
    const fr = stopped ? 2 : Math.floor(this.time * (B.c ? 10 : 7)) % list.length;
    const a = list[fr];
    let tint = null;
    if (B.stop) tint = [120, 110, 170, .6];
    else if (B.vent) tint = [255, 80, 30, .25 + .15 * Math.sin(this.time * 8)];
    else if (B.ss.includes("frozen")) tint = [150, 220, 255, .45];
    else if (B.ss.includes("petrified")) tint = [150, 150, 160, .6];
    else if (B.ss.includes("poisoned")) tint = [120, 220, 80, .16];
    else if (B.vuln) tint = [255, 160, 160, .15];
    else if (B.enr > 0) tint = [255, 40, 40, Math.min(.35, B.enr * .15)];
    let dx = 0;
    if (B.stag && !B.stop) dx = Math.sin(this.time * 50) * 1.5;
    this.blit(a, sx - a.w / 2 + dx, sy - a.h + 3 - this.bossAir, B.f < 0, { tint: B.hit && !B.st2 ? [255, 255, 255, .55] : tint, dither: B.st2 ? 3 : 0 });
  }
  drawHero(p) {
    const [sx, sy] = toS(p.x, p.z);
    if (p.dg) {
      this.trail.push({ id: p.id, x: sx, y: sy, col: p.col, d: p.d, f: p.f, t: this.time });
      if (this.trail.length > 24) this.trail.shift();
    }
    for (const tr of this.trail) {
      if (tr.id !== p.id || this.time - tr.t > .22) continue;
      this.blit(this.heroFrame(tr.col, tr.d, 1, 0, 0), tr.x - 12, tr.y - 37, tr.f < 0, { dither: 1, tint: [160, 220, 255, .6], noEm: 1 });
    }
    const step = p.mv ? Math.floor(this.time * 9) % 4 : 0;
    const art = this.heroFrame(p.col, p.d, step, p.cast || p.ch ? 1 : 0, p.dn);
    const blink = p.inv && Math.floor(this.time * 20) % 2 === 0;
    this.blit(art, sx - 12, sy - 37, p.d === 2 ? p.f < 0 : p.f < 0, { flash: p.fl, dither: blink && !p.dg ? 1 : 0, tint: p.dg ? [190, 235, 255, .55] : null });
  }
  drawSummon(m) {
    const [sx, sy] = toS(m[1], m[2]);
    if (!m[4]) return;
    this.blendEllipse(sx, sy, 8, 3, 0xff000000, .35);
    const a = this.imps[Math.floor(this.time * 6) % 4];
    if (m[3] === "summon-rise") this.blit(a, sx - 11, sy - 34, false);
  }
  drawCrystal(c) {
    const [id, x, z, hp, max, kind, hit] = c;
    const [sx, sy] = toS(x, z);
    const X = Math.round(sx - this.camX), Y = Math.round(sy - this.camY);
    this.blendEllipse(sx, sy, 10, 4, 0xff000000, .35);
    const bloom = kind === "bloom";
    const f = this.frame;
    const col = hit ? [255, 255, 255] : bloom ? [244, 150, 190] : [90, 220, 190];
    const b = Math.sin(this.time * 4 + id) * 2 - 22;
    for (let j = -12; j <= 12; j++) for (let i = -8; i <= 8; i++) {
      const on = bloom ? Math.hypot(i, j) < 7 + Math.sin(Math.atan2(j, i) * 5) * 2 : Math.abs(i) * 1.5 + Math.abs(j) < 12;
      if (!on) continue;
      const XX = X + i, YY = Math.round(Y + b + j);
      if (XX < 0 || YY < 0 || XX >= VW || YY >= VH) continue;
      const l = 1 - (i + j) * .03;
      const shade = (i - j) > 4 ? .65 : (i - j) < -5 ? 1.25 : 1;
      f.color[YY * VW + XX] = ((255 << 24) | (Math.min(255, col[2] * l * shade) << 16) | (Math.min(255, col[1] * l * shade) << 8) | Math.min(255, col[0] * l * shade)) >>> 0;
      f.light[YY * VW + XX] = ((col[2] * .15) << 16 | (col[1] * .15) << 8 | col[0] * .15) >>> 0;
    }
    // HP
    const w = Math.round(22 * hp / max);
    for (let i = 0; i < 22; i++) { const XX = X - 11 + i, YY = Y - 40; if (XX >= 0 && YY >= 0 && XX < VW && YY < VH) f.color[YY * VW + XX] = i < w ? 0xff50e0ff : 0xff201018; }
  }

  // ──────── 環境の粒子 ────────
  drawAmbient(dt) {
    const T = this.stage.theme, ps = this.particles, f = this.frame;
    const want = { motes: 26, bubbles: 22, embers: 42, spores: 30, snow: 60, rain: 70, pages: 12, leaves: 20, sparks: 16, feathers: 14, stars: 26 }[T.ambient] || 20;
    while (ps.length < want) ps.push({ x: Math.random() * VW, y: Math.random() * VH, s: Math.random(), l: Math.random() * 6 });
    const G = hexc(T.glow);
    const lr = G & 255, lg = (G >>> 8) & 255, lb = (G >>> 16) & 255;
    for (const p of ps) {
      const s = p.s;
      switch (T.ambient) {
        case "snow": p.y += (14 + s * 24) * dt; p.x += Math.sin(this.time + s * 9) * 10 * dt; break;
        case "rain": p.y += (280 + s * 120) * dt; p.x -= 40 * dt; break;
        case "embers": p.y -= (16 + s * 34) * dt; p.x += Math.sin(this.time * 2 + s * 9) * 14 * dt; break;
        case "bubbles": p.y -= (10 + s * 20) * dt; p.x += Math.sin(this.time * 2 + s * 7) * 8 * dt; break;
        case "leaves": case "feathers": case "pages": p.y += (10 + s * 16) * dt; p.x += Math.sin(this.time * 1.4 + s * 9) * 24 * dt; break;
        case "sparks": p.y += (40 + s * 60) * dt; p.x += (s - .5) * 40 * dt; break;
        default: p.y -= (3 + s * 6) * dt; p.x += Math.sin(this.time * .6 + s * 9) * 5 * dt;
      }
      if (p.y > VH) { p.y = 0; p.x = Math.random() * VW; }
      if (p.y < 0) { p.y = VH; p.x = Math.random() * VW; }
      if (p.x < 0) p.x = VW; if (p.x > VW) p.x = 0;
      const X = p.x | 0, Y = p.y | 0, i = Y * VW + X;
      if (i < 0 || i >= VW * VH) continue;
      const tw = .55 + .45 * Math.sin(this.time * 3 + s * 20);
      if (T.ambient === "rain") { for (let k = 0; k < 4; k++) { const j = (Y + k) * VW + X - (k >> 1); if (j >= 0 && j < VW * VH) f.light[j] = 0x00302418; } }
      else if (T.ambient === "snow" || T.ambient === "feathers" || T.ambient === "pages") { f.color[i] = 0xfff0f0f0; if (s > .6 && i + 1 < VW * VH) f.color[i + 1] = 0xffd0d0d0; }
      else if (T.ambient === "leaves") { f.color[i] = s > .5 ? 0xff40a050 : 0xff60c080; if (i + 1 < VW * VH) f.color[i + 1] = 0xff308040; }
      else if (T.ambient === "bubbles") { f.light[i] = ((lb * tw * .8) << 16 | (lg * tw * .8) << 8 | lr * tw * .8) >>> 0; if (s > .7 && i + VW < VW * VH) f.light[i + VW] = 0x00302020; }
      else f.light[i] = ((lb * tw) << 16 | (lg * tw) << 8 | lr * tw) >>> 0;
    }
  }

  // ──────── オーバーレイ(数字・名前・照準)────────
  drawOverlay(dt, players, B, S) {
    const c = this.octx, k = this.scale * this.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.ov.width, this.ov.height);
    if (!S) return;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const sx = (x) => (x - this.camX) * k, sy = (y) => (y - this.camY) * k;
    const COLORS = { react: "#ff7ae0", ult: "#ff5a30", perfect: "#8cf0ff", n: "#ffffff", crit: "#ffd23c", weak: "#ff9a3c", dull: "#9aa0b0", bad: "#ff5a5a", heal: "#7ee88a", dot: "#c090e0", absorb: "#6ad8ff", miss: "#b0b4c8" };
    for (const n of this.nums) {
      n.t += dt;
      n.x += n.vx * dt; n.y += n.vy * dt; n.vy *= .94;
      const a = n.t < .7 ? 1 : Math.max(0, 1 - (n.t - .7) / .4);
      const big = n.kind === "ult" ? 2.4 : n.kind === "react" ? 1.9 : n.kind === "perfect" ? 1.5 : n.kind === "crit" ? 1.5 : n.kind === "weak" ? 1.25 : 1;
      c.globalAlpha = a;
      c.font = `${Math.round(7.5 * big * k)}px "DotGothic16", monospace`;
      c.lineWidth = 2 * this.dpr;
      c.strokeStyle = "#0a0810";
      c.strokeText(n.text, sx(n.x), sy(n.y));
      c.fillStyle = COLORS[n.kind] || "#fff";
      c.fillText(n.text, sx(n.x), sy(n.y));
    }
    c.globalAlpha = 1;
    this.nums = this.nums.filter((n) => n.t < 1.1);
    // 仲間の名前と HP
    for (const p of players) {
      const [X, Y] = toS(p.x, p.z);
      if (p.id !== this.selfId || p.dn) {
        c.font = `${Math.round(5.5 * k)}px "DotGothic16", monospace`;
        c.lineWidth = 1.5 * this.dpr;
        c.strokeStyle = "#0a0810";
        c.strokeText(p.n, sx(X), sy(Y - 46));
        c.fillStyle = p.col;
        c.fillText(p.n, sx(X), sy(Y - 46));
      }
      const w = 24;
      if (!p.dn) {
        c.fillStyle = "#0a0810"; c.fillRect(sx(X - w / 2 - .5), sy(Y - 42), (w + 1) * k, 3 * k);
        c.fillStyle = p.hp / p.m < .3 ? "#ff5a5a" : "#6ee070"; c.fillRect(sx(X - w / 2), sy(Y - 41.5), w * clamp(p.hp / p.m, 0, 1) * k, 2 * k);
        if (p.bar) { c.fillStyle = "#7ce0ff"; c.fillRect(sx(X - w / 2), sy(Y - 43.5), w * clamp(p.bar / p.m, 0, 1) * k, 1.5 * k); }
        if (p.cast) { c.fillStyle = "#0a0810"; c.fillRect(sx(X - 13), sy(Y + 5), 26 * k, 3 * k); c.fillStyle = "#ffe066"; c.fillRect(sx(X - 12.5), sy(Y + 5.5), 25 * p.cast * k, 2 * k); }
      }
    }
    // ロックオン: 自動で狙っている相手を示す
    const me = S.p.find((q) => q.id === this.selfId);
    if (me && !me.dn && B && !B.dead) {
      const cr = me.tg !== "b" ? S.cr.find((c) => c[0] === me.tg) : null;
      const tx = cr ? cr[1] : B.x, tz = cr ? cr[2] : B.z;
      const [X, Y] = toS(tx, tz);
      const w = cr ? 12 : BOSSES[S.floor - 1].hitR * .85, h = cr ? 22 : Math.min(this.boss?.h || 80, 110) * .5;
      const cy = Y - (cr ? 22 : h) - (cr ? 0 : this.bossAir), s = 5 * k, spin = 1 + Math.sin(this.time * 6) * .05;
      const L = sx(X) - w * k * spin, R = sx(X) + w * k * spin, T = sy(cy) - h * k * spin, D = sy(cy) + h * k * spin;
      c.strokeStyle = "#ffe066"; c.lineWidth = 1.5 * this.dpr;
      c.beginPath();
      for (const [a, b2, dx, dy] of [[L, T, 1, 1], [R, T, -1, 1], [L, D, 1, -1], [R, D, -1, -1]]) { c.moveTo(a + dx * s, b2); c.lineTo(a, b2); c.lineTo(a, b2 + dy * s); }
      c.stroke();
    }
  }
}
