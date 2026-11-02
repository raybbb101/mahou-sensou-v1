// 魔法戦争 — 戦闘シミュレーション。DOM に依存せず、サーバーでもブラウザでも同じものが動く。
import { SKILLS, specOf, statValue, STATS, HARD_CC, FX_HIT } from "./skills.js";
import { BOSSES, BOSS_HP, BOSS_ATK, BOSS_DEF, bossGap, teleScale, enrageAt } from "./bosses.js";
import { ULTS } from "./ults.js";
import { SYNERGIES } from "./synergies.js";
import { REACTIVE, AURA_TIME, REACT_ICD, reactionOf, COMBOS, COMBO_ICD } from "./reactions.js";

export const TICK = 1 / 30;
const CONTACT_K = .32;             // ボスに触れ続けたときの 0.5 秒あたりのダメージ(攻撃力比)
const DASH_TIME = .2, DASH_SPEED = 560, DASH_IFRAME = .3, DASH_CD = 1.1;
const BOLT_K = .75, ZONE_K = .7;   // 弾とゾーンは数が多いので 1 発を軽くする
export const ARENA_R = 262;   // ワールド座標での床の半径
export const Z_K = .5;        // 奥行きの圧縮率。画面 y = z * Z_K

const hypot = Math.hypot;
export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  const f = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.state = () => s;
  return f;
}
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const rnd2 = (v) => Math.round(v * 10) / 10;

export class Battle {
  /** players: セッションのプレイヤー配列。floor: 1 始まり。 */
  constructor(players, floor, seed) {
    this.rng = makeRng(seed);
    this.floor = floor;
    this.t = 0;
    this.uid = 1;
    this.events = [];
    this.projectiles = [];
    this.zones = [];
    this.hazards = [];
    this.summons = [];
    this.crystals = [];
    this.runes = [];
    this.delayed = [];
    this.over = null;
    const n = players.length;
    this.players = players.map((p, i) => this.makePlayer(p, i, n, players));
    const def = BOSSES[floor - 1];
    const hpMul = 1 + .75 * (n - 1);
    const maxHp = BOSS_HP[floor - 1] * hpMul;
    this.boss = {
      def, id: def.id, x: 0, z: -90, h: 0, hp: maxHp, maxHp, atk: BOSS_ATK[floor - 1], defense: BOSS_DEF[floor - 1],
      state: "intro", timer: 2.2, move: null, phase: 0, bag: [], buffs: {}, debuffs: {}, statuses: {}, ccResist: 0,
      facing: 1, cast: 0, hit: 0, wet: 0, dead: false, air: 0, stealth: 0, ward: null, reflect: 0, stagger: 0, stop: 0,
      vent: 0, element: null, revives: def.gimmick?.kind === "revive" ? def.gimmick.times : 0, lastElem: null, enraged: 0,
    };
    const g = def.gimmick;
    this.gim = g ? { kind: g.kind, cfg: g, timer: (g.every || 0) * .7, mirrorQueue: [], mirrorT: g.every || g.mirror || 0, ringI: 0 } : null;
    if (g?.kind === "rotate") this.rotateElement(true);
    if (g?.kind === "mirror") this.gim.weakT = 0, this.rotateMirrorWeak();
  }

  makePlayer(p, i, n, all) {
    const ang = -Math.PI / 2 + Math.PI + (n > 1 ? (i - (n - 1) / 2) * .5 : 0);
    const s = {};
    for (const k of Object.keys(STATS)) s[k] = statValue(k, p.stats[k] || 0);
    // 隠し効果の判定
    const syn = this.synergiesOf(p, all);
    const F = { dmg: 0, elem: {}, dodge: 0, dashCd: 0, ult: 0, regenPct: 0 };
    for (const y of syn) {
      const E = y.fx;
      if (E.atk) s.atk *= 1 + E.atk;
      if (E.hp) s.hp *= 1 + E.hp;
      if (E.def) s.def *= 1 + E.def;
      if (E.crit) s.crit += E.crit;
      if (E.critDmg) s.critDmg += E.critDmg;
      if (E.haste) s.haste += E.haste;
      F.dmg += E.dmg || 0; F.dodge += E.dodge || 0; F.dashCd += E.dashCd || 0; F.ult += E.ult || 0; F.regenPct += E.regenPct || 0;
      for (const [k, v] of Object.entries(E.elem || {})) F.elem[k] = (F.elem[k] || 0) + v;
    }
    s.hp = Math.round(s.hp);
    return {
      id: p.id, name: p.name, color: p.color, x: Math.cos(ang) * 150, z: Math.sin(ang) * 150, aimX: 0, aimZ: -90, mx: 0, mz: 0,
      facing: 1, s, hp: s.hp, maxHp: s.hp, barrier: 0, buffs: {}, statuses: {}, ccImm: 0, inv: 0, gcd: 0, casting: 0, channel: null,
      skills: p.skills.map((sk) => ({ id: sk.id, rank: sk.rank, cd: 0 })), down: false, dealt: 0, taken: 0, moving: false, silence: 0, dir: 0,
      queue: null, deaths: 0, flash: 0, syn: syn.map((y) => y.id), F,
      dashT: 0, dodge: 0, dashCd: 0, dashX: 0, dashZ: 0, perfT: 0, perfects: 0,
      ult: p.ult || null, ultCharge: p.ultCharge || 0, ultUsed: 0, nohit: 0, contactT: 0, target: "b", last: null, riderT: {},
    };
  }
  synergiesOf(p, all) {
    const elems = { fire: 0, ice: 0, water: 0, thunder: 0, arcane: 0, holy: 0, shadow: 0, nature: 0 };
    for (const k of p.skills) elems[SKILLS[k.id].elem]++;
    const atk = p.skills.filter((k) => !SKILLS[k.id].dmgless).length;
    const spentStats = Object.values(p.stats).reduce((a, b) => a + b, 0);
    const c = { ids: p.skills.map((k) => k.id), skills: p.skills, n: p.skills.length, elems, atk, sup: p.skills.length - atk, floor: this.floor, stats: p.stats, spentStats, party: all, me: p, prevTaken: p.prevTaken, ult: p.ult };
    return SYNERGIES.filter((y) => { try { return y.check(c); } catch { return false; } });
  }

  // ───────── 必殺技ゲージ ─────────
  charge(p, type, amount = 1) {
    const U = p.ult && ULTS[p.ult];
    if (!U || U.charge.type !== type || p.down) return;
    const before = p.ultCharge;
    p.ultCharge = Math.min(U.charge.need, p.ultCharge + amount * (1 + p.F.ult));
    if (before < U.charge.need && p.ultCharge >= U.charge.need) { this.ev({ e: "ultready", id: p.id }); this.ev({ e: "sfx", s: "ui2" }); }
  }
  useUlt(p) {
    const U = p.ult && ULTS[p.ult];
    if (!U || p.ultCharge < U.charge.need || p.down || this.boss.dead) return;
    p.ultCharge = 0; p.ultUsed++;
    p.statuses = {};
    p.inv = Math.max(p.inv, 1);
    p.channel = null; p.casting = 0;
    this.ev({ e: "ult", id: p.id, ult: U.id });
    this.ev({ e: "sfx", s: "ult" });
    this.ev({ e: "shake", v: 10 });
    this.banner(`${p.name}「${U.name}」`, "good");
    const b = this.boss, all = this.players.filter((q) => !q.down);
    const near = (n, r = 60) => Array.from({ length: n }, () => { const a = this.rng() * 6.28, d = this.rng() * r; return [b.x + Math.cos(a) * d, b.z + Math.sin(a) * d]; });
    const salvo = (fx, n, every, pct, o = {}) => near(n, o.r ?? 70).forEach(([x, z], i) => {
      const hit = (FX_HIT[fx] ?? .4) / (o.rate || 1);
      this.later(i * every, () => this.fxAt(fx, x, z, { rate: o.rate || 1, ...(o.hover ? { hover: o.hover } : {}) }));
      this.later(i * every + hit, () => { this.ultDamage(p, pct / n); this.ev({ e: "shake", v: o.shake ?? 6 }); this.ev({ e: "sfx", s: o.sfx || "boom" }); });
    });
    const ringFx = (fx, n, r, o = {}) => { for (let i = 0; i < n; i++) { const a = i / n * 6.28; this.later(i * .06, () => this.fxAt(fx, b.x + Math.cos(a) * r, b.z + Math.sin(a) * r, o)); } };
    switch (U.id) {
      case "meteor-rain": salvo("fire/meteor", 12, .2, .22, { r: 90 }); this.statusBoss("burning", 8, p, { pow: 40 }); break;
      case "inferno": ringFx("fire/flame-pillar", 8, 80); this.fxAt("fire/fire-tornado", b.x, b.z, { cut: 2.2 }); this.later(.5, () => this.ultDamage(p, .18)); b.statuses.burning = { t: 15, pow: 200, mul: p.s.atk / 20 }; break;
      case "zero": this.fxAt("ice/frost-nova", b.x, b.z, { onBoss: 1 }); ringFx("ice/ice-shatter", 6, 70, { rate: 1.5 }); b.stagger = Math.max(b.stagger, 6); b.vuln = 8; b.statuses.frozen = { t: 6 }; this.cancelBossMove(); break;
      case "thunder-god": salvo("lightning/lightning-strike", 10, .16, .2, { r: 50, sfx: "thunder" }); this.later(.3, () => { b.stagger = Math.max(b.stagger, 3); this.cancelBossMove(); }); break;
      case "miracle":
        for (const q of this.players) { if (q.down) { q.down = false; q.statuses = {}; } q.hp = q.maxHp; q.statuses = {}; q.inv = 5; q.buffs.invuln = { t: 5, v: 1 }; this.fxAt("holy/heal", q.x, q.z, { attach: q.id }); }
        this.fxAt("holy/heal-aoe", p.x, p.z, {}); this.ev({ e: "sfx", s: "heal" }); break;
      case "time-prison": this.fxAt("arcane/time-stop", b.x, b.z, { rate: 1.8 }); b.stop = Math.max(b.stop, 8); for (const k of p.skills) k.cd = 0; break;
      case "overdrive": this.applyUltBuff(p, "overdrive", 12, 4); this.fxAt("arcane/mana-burst", p.x, p.z, {}); break;
      case "void-devour": this.fxAt("shadow/black-hole", b.x, b.z, { cut: 1.6, onBoss: 1 }); this.fxAt("shadow/soul-drain", p.x, p.z, { ang: Math.atan2(b.z - p.z, b.x - p.x), flipA: 1, cut: 1.5 }); this.later(1, () => this.ultDamage(p, .12)); p.hp = p.maxHp; break;
      case "doom": this.fxAt("shadow/curse", b.x, b.z, { onBoss: 1 }); b.debuffs.sundered = { t: 15, v: 1 }; for (const q of all) this.applyUltBuff(q, "ultDmg", 15, 2); break;
      case "yggdrasil": for (const q of all) { this.applyUltBuff(q, "ygg", 15, .08); this.fxAt("nature/healing-bloom", q.x, q.z, { attach: q.id }); } break;
      case "storm-avatar": { this.applyUltBuff(p, "avatar", 12, 1); const s = specOf("lightning-strike", 5); this.zones.push({ id: this.uid++, side: 0, owner: p.id, ctx: { p, s, mul: p.s.atk / 20 * 2.2 }, x: p.x, z: p.z, r: 120, life: 12, max: 12, tick: .35, tt: 0, pow: 40, s, fx: "lightning/storm-cloud", follow: p.id, drift: 0, rate: 1, hoverFx: true, mul: 1 }); break; }
      case "phoenix": this.applyUltBuff(p, "phoenix", 30, 2); this.fxAt("fire/fire-ring", p.x, p.z, {}); break;
      case "blood-pact": p.hp = Math.max(1, p.hp * .5); this.applyUltBuff(p, "ultDmg", 10, 4); this.fxAt("status/rage", p.x, p.z, { attach: p.id, cut: 3 }); break;
      case "sanctuary": for (const q of all) { q.inv = 10; q.buffs.invuln = { t: 10, v: 1 }; this.fxAt("holy/divine-shield", q.x, q.z, { attach: q.id, cut: 10 }); } break;
      case "all-out": for (let w = 0; w < 2; w++) this.later(w * 1.2 + .2, () => { for (const k of p.skills) { const s = specOf(k.id, k.rank); if (s.dmgless || p.down) continue; this.finishCast(p, s); } }); for (const k of p.skills) k.cd = 0; break;
      case "insight": this.applyUltBuff(p, "insight", 20, 1); this.fxAt("arcane/rune-circle", b.x, b.z, { cut: 3 }); break;
      case "phantoms": { const s = specOf("magic-missile", 3); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; this.summons.push({ id: this.uid++, owner: p.id, type: "summon-rise", x: p.x + Math.cos(a) * 60, z: p.z + Math.sin(a) * 60, life: 15, born: .2, t: 0, every: .5, s: { ...s, pow: 26, shot: "plasma-shot", range: 700 }, mul: p.s.atk / 20, ctx: { p, s, mul: p.s.atk / 20 } }); } this.fxAt("spawn/summon-rise", p.x, p.z, { cut: 1 }); break; }
      case "scales": this.fxAt("holy/smite", b.x, b.z, { onBoss: 1 }); b.buffs = {}; if (b.ward) { b.ward = null; this.gim.timer = this.gim.cfg.every; } b.reflect = 0; b.stealth = 0; b.stagger = Math.max(b.stagger, 5); b.vuln = 6; this.cancelBossMove(); this.later(.4, () => this.ultDamage(p, .08)); break;
      case "last-stand": p.hp = p.maxHp; this.fxAt("holy/sunburst", b.x, b.z, { hover: 40, cut: 2 }); this.later(.6, () => this.ultDamage(p, (b.maxHp - b.hp) / b.maxHp * .3)); break;
      case "ragnarok": salvo("shadow/dark-explosion", 7, .3, .35, { r: 100, rate: 2, shake: 12 }); this.ev({ e: "flash", v: 1 }); for (const q of all) q.inv = Math.max(q.inv, 3); break;
    }
  }
  applyUltBuff(q, k, t, v) { q.buffs[k] = { t, v }; }
  /** 必殺技のダメージ: 最大HPの割合で与える(防御無視)。 */
  ultDamage(p, pct) {
    const b = this.boss;
    if (b.dead || pct <= 0) return;
    const dmg = b.maxHp * pct;
    b.hp -= dmg;
    b.hit = .15;
    p.dealt += dmg;
    this.ev({ e: "num", x: b.x + (this.rng() - .5) * 40, z: b.z, h: 50 + this.rng() * 40, text: "" + Math.round(dmg), kind: "ult" });
    if (b.hp <= 0) this.bossDown(b.lastElem);
  }

  ev(e) { this.events.push(e); }
  fxAt(fx, x, z, o = {}) { this.ev({ e: "fx", fx, x: rnd2(x), z: rnd2(z), ...o }); }
  banner(text, kind = "info") { this.ev({ e: "banner", text, kind }); }

  // ───────── 入力 ─────────
  input(id, inp) {
    const p = this.players.find((q) => q.id === id);
    if (!p) return;
    if (inp.mx !== undefined) { const m = hypot(inp.mx, inp.mz) || 1; p.mx = inp.mx / Math.max(1, m); p.mz = inp.mz / Math.max(1, m); }
    if (inp.cast !== undefined && inp.cast !== null) p.queue = inp.cast;
    if (inp.dash) p.wantDash = true;
    if (inp.ult) p.wantUlt = true;
  }

  // ───────── 更新 ─────────
  step() {
    if (this.over) return;
    const dt = TICK;
    this.t += dt;
    for (const p of this.players) this.stepPlayer(p, dt);
    this.stepBoss(dt);
    this.stepHazards(dt);
    this.stepProjectiles(dt);
    this.stepZones(dt);
    this.stepSummons(dt);
    this.stepDelayed(dt);
    this.stepGimmick(dt);
    if (!this.over) {
      if (this.boss.dead) { this.boss.deadT = (this.boss.deadT || 0) + dt; if (this.boss.deadT > 2.2) this.over = "win"; }
      else if (this.players.every((p) => p.down)) { this.wipeT = (this.wipeT || 0) + dt; if (this.wipeT > 1.6) this.over = "lose"; }
    }
  }

  hasCC(p) { return HARD_CC.has(Object.keys(p.statuses).find((k) => HARD_CC.has(k))); }
  buffVal(p, k) { return p.buffs[k] ? p.buffs[k].v : 0; }

  stepPlayer(p, dt) {
    p.flash = Math.max(0, p.flash - dt);
    if (p.down) { p.mx = p.mz = 0; return; }   // 倒れた仲間は次の階で復活する
    p.inv = Math.max(0, p.inv - dt);
    p.gcd = Math.max(0, p.gcd - dt);
    p.ccImm = Math.max(0, p.ccImm - dt);
    p.silence = Math.max(0, p.silence - dt);
    p.dodge = Math.max(0, p.dodge - dt);
    p.perfT = Math.max(0, p.perfT - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.wantUlt) { p.wantUlt = false; this.useUlt(p); if (p.down) return; }
    if (p.casting > 0) { p.casting -= dt; if (p.casting <= 0) { const c = p.castDone; p.castDone = null; p.casting = 0; c && this.finishCast(p, c); } }

    // 自動照準: 常に狙うべき相手を見ている
    const tg = this.autoTarget(p);
    if (tg) { p.aimX = tg.x; p.aimZ = tg.z; p.target = tg === this.boss ? "b" : tg.id; }

    // バフ・状態異常
    for (const k of Object.keys(p.buffs)) { p.buffs[k].t -= dt; if (p.buffs[k].t <= 0) { if (k === "barrier") p.barrier = 0; delete p.buffs[k]; } }
    for (const k of Object.keys(p.statuses)) {
      const st = p.statuses[k];
      st.t -= dt;
      st.tick = (st.tick || 0) + dt;
      if (st.tick >= .5) {
        st.tick -= .5;
        const b = this.boss.atk * .5;
        if (k === "burning") this.hurtPlayer(p, b * .28 , { raw: 1, tag: "burn" });
        if (k === "poisoned") this.hurtPlayer(p, Math.max(b * .22, p.maxHp * .012), { raw: 1, tag: "poison" });
        if (k === "bleeding" && p.moving) this.hurtPlayer(p, b * .4, { raw: 1, tag: "bleed" });
      }
      if (st.t <= 0) delete p.statuses[k];
      if (p.down) return;
    }
    if (p.buffs.halo) this.healPlayer(p, p.maxHp * .015 * dt, true);
    if (p.buffs.ygg) this.healPlayer(p, p.maxHp * p.buffs.ygg.v * dt, true);
    if (p.s.regen) this.healPlayer(p, p.s.regen * dt, true);
    if (p.F.regenPct) this.healPlayer(p, p.maxHp * p.F.regenPct * dt, true);
    for (const z of this.zones) if (z.side === 0 && z.s?.allyAll) this.healPlayer(p, p.maxHp * z.s.allyAll * dt, true);

    // 再使用
    const hasteK = (1 + p.s.haste / 100) * (1 + this.buffVal(p, "haste")) * (p.buffs.overdrive ? p.buffs.overdrive.v : 1);
    for (const sk of p.skills) sk.cd = Math.max(0, sk.cd - dt * hasteK);

    // 必殺技ゲージの時間系
    this.charge(p, "time", dt);
    if (p.hp / p.maxHp <= .4) this.charge(p, "lowhp", dt);
    if (Math.hypot(p.x - this.boss.x, p.z - this.boss.z) < this.boss.def.hitR + 80) this.charge(p, "close", dt);
    p.nohit += dt;
    if (p.ult && ULTS[p.ult].charge.type === "nohit") { p.ultCharge = Math.max(p.ultCharge, Math.min(ULTS[p.ult].charge.need, p.nohit * (1 + p.F.ult))); if (p.ultCharge >= ULTS[p.ult].charge.need && !p.ultRdy) { p.ultRdy = true; this.ev({ e: "ultready", id: p.id }); } }

    // 移動
    const st = p.statuses;
    const stunned = st.frozen || st.stunned || st.sleep || st.petrified;
    let mx = p.mx, mz = p.mz;
    if (stunned) mx = mz = 0;
    else if (st.charmed) { const d = hypot(this.boss.x - p.x, this.boss.z - p.z) || 1; mx = (this.boss.x - p.x) / d; mz = (this.boss.z - p.z) / d; }
    else if (st.confused) { mx = -mx; mz = -mz; }
    let sp = p.s.speed * 1.6 * (st.slowed ? .55 : 1) * (1 + this.buffVal(p, "haste") * .6) * (p.buffs.avatar ? 2 : 1);
    if (p.channel) sp *= p.channel.spec.slowSelf ?? .45;
    if (p.casting > 0 && p.castRoot) sp = 0;

    // 回避(スペース)
    if (p.wantDash) {
      p.wantDash = false;
      if (!stunned && p.dashCd <= 0 && !(p.casting > 0 && p.castRoot)) {
        let dx = mx, dz = mz;
        if (!dx && !dz) { const d = hypot(p.x - this.boss.x, p.z - this.boss.z) || 1; dx = (p.x - this.boss.x) / d; dz = (p.z - this.boss.z) / d; }
        const L = hypot(dx, dz) || 1;
        p.dashX = dx / L; p.dashZ = dz / L;
        p.dashT = DASH_TIME;
        p.dodge = DASH_IFRAME + p.F.dodge;
        p.dashCd = p.buffs.avatar ? .1 : DASH_CD * (1 - Math.min(.8, p.F.dashCd));
        p.channel = null;
        this.ev({ e: "sfx", s: "dash" });
      }
    }
    const ox = p.x, oz = p.z;
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.x += p.dashX * DASH_SPEED * dt;
      p.z += p.dashZ * DASH_SPEED * dt;
      p.moving = true;
    } else {
      p.moving = (mx !== 0 || mz !== 0) && sp > 0;
      p.x += mx * sp * dt;
      p.z += mz * sp * dt;
    }
    if (Math.abs(p.aimX - p.x) > 2) p.facing = p.aimX > p.x ? 1 : -1;
    const dx = p.aimX - p.x, dz = p.aimZ - p.z;
    p.dir = Math.abs(dz) > Math.abs(dx) * .9 ? (dz < 0 ? 1 : 0) : 2;   // 0:手前 1:奥 2:横
    // アリーナの縁
    const d = hypot(p.x, p.z);
    if (d > ARENA_R) { p.x *= ARENA_R / d; p.z *= ARENA_R / d; }
    this.charge(p, "distance", hypot(p.x - ox, p.z - oz));

    // 発動
    if (p.channel) this.stepChannel(p, dt);
    if (p.queue !== null && p.queue !== undefined) {
      const slot = p.queue;
      p.queue = null;
      if (!stunned && p.gcd <= 0 && p.casting <= 0 && !p.channel) this.cast(p, slot);
    }
  }

  // ───────── プレイヤーの魔法 ─────────
  /** 自動照準の相手。壊すべき物体(核・花)があれば先に狙い、なければボス。 */
  autoTarget(p) {
    if (this.boss.dead) return null;
    let best = null, bd = 1e9;
    for (const c of this.crystals) { if (c.dead) continue; const d = hypot(c.x - p.x, c.z - p.z); if (d < bd) { bd = d; best = c; } }
    return best || this.boss;
  }
  reachOf(p, s) {
    const K = s.kind;
    if (K === "target" || K === "ground") return s.range;
    if (K === "line" || K === "cone" || K === "linez") return s.len;
    return Infinity;
  }
  inRange(p, s) {
    const R = this.reachOf(p, s);
    if (R === Infinity) return true;
    const t = this.autoTarget(p);
    if (!t) return true;
    return hypot(t.x - p.x, t.z - p.z) - (t === this.boss ? this.boss.def.hitR : 14) <= R;
  }
  /** HP の割合が最も低い味方(回復の自動追跡先)。 */
  weakestAlly(p) {
    let best = p, v = p.hp / p.maxHp;
    for (const q of this.players) if (!q.down && q.hp / q.maxHp < v) { v = q.hp / q.maxHp; best = q; }
    return best;
  }
  cast(p, slot) {
    const sk = p.skills[slot];
    if (!sk || sk.cd > 0) return;
    if (p.silence > 0) { this.ev({ e: "toast", id: p.id, text: "魔法が封じられている!" }); return; }
    const s = specOf(sk.id, sk.rank);
    if (!this.inRange(p, s)) { this.ev({ e: "toast", id: p.id, text: "射程外 — 近づこう" }); return; }
    sk.cd = s.cd;
    p.gcd = .22;
    this.ev({ e: "cast", id: p.id, slot, elem: s.elem });
    this.charge(p, "cast");
    if (this.gim?.mirrorQueue && !s.dmgless) this.gim.mirrorQueue = [s.id, ...this.gim.mirrorQueue.filter((x) => x !== s.id)].slice(0, 4);
    if (s.cast) {
      p.casting = s.cast; p.castRoot = true; p.castMax = s.cast; p.castDone = s;
      if (s.castFx) this.fxAt(s.castFx, p.x, p.z, { rate: (FX_HIT[s.castFx] || 1) / s.cast, cut: s.cast + .2, ground: 1 });
      return;
    }
    this.finishCast(p, s);
  }

  atkMul(p, s) {
    let m = (p.s.atk / 20) * (1 + this.buffVal(p, "blessed") + this.buffVal(p, "rage")) * (1 + p.F.dmg + (p.F.elem[s.elem] || 0));
    if (p.buffs.ultDmg) m *= p.buffs.ultDmg.v;
    if (p.buffs.phoenix) m *= p.buffs.phoenix.v;
    if (p.statuses.cursed) m *= .75;
    for (const z of this.zones) if (z.side === 0 && z.ally?.atk && hypot(p.x - z.x, p.z - z.z) < z.r) { m *= 1 + z.ally.atk; break; }
    if (s.elem === "shadow" && this.anyEclipse()) m *= 1.5;
    if (p.buffs.charged && !s.dmgless) { m *= p.buffs.charged.v; delete p.buffs.charged; this.ev({ e: "sfx", s: "thunder" }); }
    return m;
  }
  anyEclipse() { return this.players.some((q) => q.buffs.eclipse); }

  finishCast(p, s) {
    const mul = s.dmgless ? 1 : this.atkMul(p, s);
    const ctx = { p, s, mul, x: p.x, z: p.z };
    const K = s.kind;
    const tg = this.autoTarget(p) || this.boss;
    const onB = tg === this.boss ? 1 : 0;
    const aimAng = Math.atan2(tg.z - p.z, tg.x - p.x);
    this.ev({ e: "sfx", s: "cast-" + s.elem });
    if (s.iframes) p.inv = Math.max(p.inv, s.iframes);
    if (s.cdCut) this.cutCd(p, s.cdCut, s.id);
    const echoes = s.echoes || [];

    if (K === "bolt") {
      const n = s.count || 1, sp = s.spread ?? .16;
      for (let i = 0; i < n; i++) {
        const a = aimAng + (i - (n - 1) / 2) * sp;
        this.projectiles.push({ id: this.uid++, side: 0, owner: p.id, x: p.x + Math.cos(a) * 14, z: p.z + Math.sin(a) * 14, vx: Math.cos(a) * s.speed, vz: Math.sin(a) * s.speed, r: s.r, life: Math.max(s.life || 0, 3), fx: s.fx, dir: !!s.dir, hover: !!s.hover, rank: s.rank, mul, s, hit: new Map(), turn: s.turn || 6 });
      }
    } else if (K === "ground" || K === "linez") {
      const rate = s.rate || 1, hit = FX_HIT[s.fx] ?? .4;
      const reps = s.repeat || 1;
      const fire = (delay, pow) => {
        if (K === "linez") {
          this.later(delay, () => {
            const ang = Math.atan2(tg.z - p.z, tg.x - p.x), x0 = p.x, z0 = p.z;
            this.fxAt(s.fx, x0, z0, { rate, ang, flipA: 1 });
            this.later(hit / rate, () => { this.damageLine(ctx, x0, z0, ang, s.len, s.wid, pow); this.ev({ e: "sfx", s: "hit-" + s.elem }); });
          });
          return;
        }
        // 発動位置は敵を追いかける
        this.later(delay, () => {
          this.fxAt(s.fx, tg.x, tg.z, { rate, onBoss: onB });
          if (s.shake) this.later(hit / rate, () => this.ev({ e: "shake", v: s.shake }));
          this.later(hit / rate, () => {
            this.damageCircle(ctx, tg.x, tg.z, s.r, pow);
            if (s.heal) for (const q of this.players) if (!q.down && hypot(q.x - tg.x, q.z - tg.z) < s.r) this.healPlayer(q, q.maxHp * s.heal);
            this.ev({ e: "sfx", s: "hit-" + s.elem });
          });
        });
      };
      for (let i = 0; i < reps; i++) fire(i * (s.repeatGap || 0), s.pow);
      echoes.forEach((k, i) => fire(.6 + reps * (s.repeatGap || 0) + i * .55, s.pow * k));
    } else if (K === "nova") {
      const rate = s.rate || 1, hit = FX_HIT[s.fx] ?? .3;
      const wave = (pow, d) => {
        this.later(d, () => this.fxAt(s.fx, p.x, p.z, { rate, attach: p.id, ground: 1 }));
        this.later(hit / rate + d, () => {
          this.damageCircle(ctx, p.x, p.z, s.r, pow);
          if (s.heal) for (const q of this.players) if (!q.down && hypot(q.x - p.x, q.z - p.z) < s.r) this.healPlayer(q, q.maxHp * s.heal);
          if (s.strip) this.stripBoss(p.x, p.z, s.r);
          this.ev({ e: "sfx", s: "hit-" + s.elem });
        });
      };
      wave(s.pow, 0);
      echoes.forEach((k, i) => wave(s.pow * k, .55 * (i + 1)));
    } else if (K === "target") {
      const rate = s.rate || 1, hit = FX_HIT[s.fx] ?? .3;
      const fire = (pow, d) => {
        this.later(d, () => this.fxAt(s.fx, tg.x, tg.z, { rate, onBoss: onB }));
        this.later(hit / rate + d, () => { this.damageTarget(ctx, tg, pow); this.ev({ e: "sfx", s: "hit-" + s.elem }); });
      };
      fire(s.pow, 0);
      echoes.forEach((k, i) => fire(s.pow * k, .5 * (i + 1)));
    } else if (K === "cone" || K === "line") {
      const o = { ang: aimAng, flipA: 1, attachId: p.id };
      if (s.reach) o.reach = Math.min(s.len, Math.max(60, hypot(tg.x - p.x, tg.z - p.z)));
      if (s.dur) {
        p.channel = { spec: s, t: 0, tick: 0, n: 0, mul, ctx };
        this.ev({ e: "fx", fx: s.fx, x: rnd2(p.x), z: rnd2(p.z), ...o, loopFor: s.dur, chest: 1 });
      } else {
        this.fxAt(s.fx, p.x, p.z, { ...o, chest: 1 });
        const n = s.multi || 1, hit = FX_HIT[s.fx] ?? .2;
        for (let i = 0; i < n; i++) this.later(hit + i * .1, () => {
          const a = Math.atan2(tg.z - p.z, tg.x - p.x);
          (K === "cone" ? this.damageCone : this.damageLine).call(this, ctx, p.x, p.z, a, s.len + 30, s.wid, s.pow);
        });
        this.later(hit, () => this.ev({ e: "sfx", s: "hit-" + s.elem }));
      }
    } else if (K === "zone") {
      const place = (dx, dz) => {
        const self = s.atFeet || s.follow;
        this.zones.push({ id: this.uid++, side: 0, owner: p.id, ctx, x: (self ? p.x : tg.x) + dx, z: (self ? p.z : tg.z) + dz, r: s.r, life: s.dur, max: s.dur, tick: s.tick, tt: 0, pow: s.pow, s, fx: s.fx, status: s.status, ally: s.ally, follow: s.follow ? p.id : null, drift: self ? 0 : (s.drift || 55), rate: s.rate || 1, hoverFx: !!s.hoverFx, wet: s.wet, mul });
      };
      place(0, 0);
      if (s.twin) place(s.r * 1.1, 0);
    } else if (K === "self") {
      this.applyBuffSkill(p, s, p);
      if (s.party) for (const q of this.players) if (q !== p && !q.down) this.applyBuffSkill(p, s, q);
      if (s.shieldAtk) this.applyUltBuff(p, "ultDmg", s.buff[1], 2);
      this.fxAt(s.fx, p.x, p.z, { rate: s.rate || 1, attach: p.id, cut: s.buff ? s.buff[1] : undefined });
    } else if (K === "aura") {
      // 回復は HP が最も低い味方へ追跡する。ヒーリングリングとブレッシングは全員に届く
      const list = s.id === "heal" && !s.party ? [...new Set([p, this.weakestAlly(p)])] : this.players.filter((q) => !q.down);
      for (const q of list) {
        if (s.heal) this.healPlayer(q, q.maxHp * s.heal);
        if (s.cleanse) q.statuses = {};
        if (s.buff) this.applyBuffSkill(p, s, q);
        if (s.attach) this.fxAt(s.fx, q.x, q.z, { rate: s.rate || 1, attach: q.id, cut: s.buff ? 2.4 : undefined });
      }
      if (!s.attach) this.fxAt(s.fx, p.x, p.z, { rate: s.rate || 1, attach: p.id, ground: 1 });
      this.ev({ e: "sfx", s: "heal" });
    } else if (K === "global") {
      if (s.stop) {
        this.fxAt(s.fx, this.boss.x, this.boss.z, { rate: s.rate });
        const hit = (FX_HIT[s.fx] || 1) / s.rate;
        this.later(hit * .5, () => { this.boss.stop = Math.max(this.boss.stop, s.stop * (this.floor >= 15 ? .6 : 1)); if (s.stopVuln) this.boss.vuln = s.stop; this.banner("時が止まった", "good"); this.ev({ e: "sfx", s: "cast-arcane" }); });
      } else {
        for (const q of this.players) if (!q.down) this.applyBuffSkill(p, s, q);
        this.fxAt(s.fx, 0, -80, { hover: 120, cut: s.buff[1] });
      }
    } else if (K === "blink") {
      // 移動方向へ。止まっていればボスから離れる方向へ
      let dx = p.mx, dz = p.mz;
      if (!dx && !dz) { const d = hypot(p.x - this.boss.x, p.z - this.boss.z) || 1; dx = (p.x - this.boss.x) / d; dz = (p.z - this.boss.z) / d; }
      const L = hypot(dx, dz) || 1;
      let ax = p.x + dx / L * s.range, az = p.z + dz / L * s.range;
      const e = hypot(ax, az); if (e > ARENA_R) { ax *= ARENA_R / e; az *= ARENA_R / e; }
      this.fxAt("arcane/blink-out", p.x, p.z, { rate: s.rate || 1 });
      p.x = ax; p.z = az; p.inv = Math.max(p.inv, .35);
      this.fxAt("arcane/blink-in", ax, az, { rate: 2 });
    } else if (K === "port") {
      const d = hypot(this.boss.x, this.boss.z) || 1;
      const ax = -this.boss.x / d * 170, az = -this.boss.z / d * 170;
      for (const q of this.players) if (!q.down && (q === p || hypot(q.x - p.x, q.z - p.z) < s.r)) {
        this.fxAt(s.fx, q.x, q.z, { cut: .7 });
        q.x = ax + (q.x - p.x) * .2; q.z = az + (q.z - p.z) * .2; q.inv = Math.max(q.inv, .4);
      }
      this.fxAt(s.fx, ax, az, { cut: 1 });
    } else if (K === "summon") {
      const n = s.summons || (s.twin ? 2 : 1);
      for (let i = 0; i < n; i++) {
        const a = aimAng + (i - (n - 1) / 2) * 1.1, ax = p.x + Math.cos(a) * 44, az = p.z + Math.sin(a) * 44;
        const hit = (FX_HIT[s.fx] || 1) / (s.rate || 1);
        this.fxAt(s.fx, ax, az, { rate: s.rate || 1, cut: hit + .8 });
        this.summons.push({ id: this.uid++, owner: p.id, type: s.id, x: ax, z: az, life: s.dur + hit, born: hit, t: 0, every: s.shotEvery, s, mul, ctx });
      }
    }
  }

  applyBuffSkill(p, s, q) {
    const [b, dur, v] = s.buff || [];
    if (!b) return;
    if (b === "barrier") { q.barrier = Math.max(q.barrier, q.maxHp * v); q.buffs.barrier = { t: dur, v }; return; }
    if (b === "invuln") { q.inv = Math.max(q.inv, dur); q.buffs.invuln = { t: dur, v: 1 }; return; }
    q.buffs[b] = { t: dur, v };
    if (b === "rage") q.buffs.rage.def = .3;
  }
  cutCd(p, amt, except) { for (const sk of p.skills) if (sk.id !== except) sk.cd = Math.max(0, sk.cd - amt); }

  stepChannel(p, dt) {
    const c = p.channel, s = c.spec;
    c.t += dt;
    c.tick += dt;
    const iv = s.dur / s.ticks;
    while (c.tick >= iv && c.n < s.ticks) {
      c.tick -= iv; c.n++;
      const ang = Math.atan2(p.aimZ - p.z, p.aimX - p.x);
      c.ctx.x = p.x; c.ctx.z = p.z;
      (s.kind === "cone" ? this.damageCone : this.damageLine).call(this, c.ctx, p.x, p.z, ang, s.len + 30, s.wid, s.pow);
    }
    if (c.t >= s.dur) p.channel = null;
  }

  // ───────── 当たり判定(プレイヤー → 敵)─────────
  targets() { return this.boss.dead ? [] : [this.boss, ...this.crystals.filter((c) => !c.dead)]; }
  bossHittable(kind) {
    const b = this.boss;
    if (b.air > 0) return kind === "bolt" || kind === "line" || kind === "cone" || kind === "target";
    return true;
  }
  damageCircle(ctx, x, z, r, pow) {
    for (const t of this.targets()) {
      if (t === this.boss && !this.bossHittable("ground")) { if (hypot(t.x - x, t.z - z) < r + t.def.hitR) this.ev({ e: "num", x: t.x, z: t.z, h: 60, text: "届かない", kind: "miss" }); continue; }
      const R = t === this.boss ? t.def.hitR * .8 : 14;
      if (hypot(t.x - x, t.z - z) < r + R) this.hitTarget(ctx, t, pow);
    }
  }
  damageTarget(ctx, t, pow) { if (!t.dead) this.hitTarget(ctx, t, pow, { direct: 1 }); }
  damageCone(ctx, x, z, ang, len, wid, pow) {
    for (const t of this.targets()) {
      const R = t === this.boss ? t.def.hitR : 14;
      const d = hypot(t.x - x, t.z - z);
      if (d - R > len) continue;
      if (Math.abs(angDiff(Math.atan2(t.z - z, t.x - x), ang)) < wid + Math.atan2(R, Math.max(10, d))) this.hitTarget(ctx, t, pow);
    }
  }
  damageLine(ctx, x, z, ang, len, wid, pow) {
    const cx = Math.cos(ang), cz = Math.sin(ang);
    for (const t of this.targets()) {
      const R = t === this.boss ? t.def.hitR : 14;
      const dx = t.x - x, dz = t.z - z, along = dx * cx + dz * cz, off = Math.abs(dx * cz - dz * cx);
      if (along > -R && along < len + R && off < wid / 2 + R) this.hitTarget(ctx, t, pow);
    }
  }

  hitTarget(ctx, t, pow, o = {}) {
    const { p, s, mul } = ctx;
    if (t !== this.boss) {   // 結晶など
      t.hp -= pow * mul * .6;
      this.ev({ e: "num", x: t.x, z: t.z, h: 20, text: "" + Math.round(pow * mul * .6), kind: "n" });
      t.hit = .15;
      if (t.hp <= 0 && !t.dead) { t.dead = true; this.crystalBroken(t); }
      return;
    }
    const b = this.boss;
    if (b.dead) return;
    if (b.revivePause) return;
    const def = b.def;
    let m = 1, tag = "";
    const el = s.elem;
    let weak = def.weak || [], absorb = def.absorb || [], resist = def.resist || [];
    if (b.element) { weak = [OPPOSITE[b.element]]; absorb = [b.element]; resist = []; }
    if (this.gim?.weak) { weak = [this.gim.weak]; resist = []; }
    if (p.buffs.insight) { weak = [el]; absorb = []; resist = []; }
    if (weak.includes(el)) { m *= 1.6; tag = "弱点"; this.charge(p, "weak"); }
    else if (resist.includes(el)) { m *= .55; tag = "耐性"; }
    if (absorb.includes(el)) {
      const heal = pow * mul * .5;
      b.hp = Math.min(b.maxHp, b.hp + heal);
      this.ev({ e: "num", x: b.x, z: b.z, h: 60, text: "吸収 +" + Math.round(heal), kind: "absorb" });
      return;
    }
    // 元素反応とコンボ
    const rx = this.tryReaction(p, s, b), cb = this.tryCombo(p, s, b);
    if (rx) { m *= rx.mult; tag = rx.name; }
    if (cb) { m *= cb.mult; tag = cb.name; }
    if (s.shatter && (b.statuses.slowed || b.statuses.frozen)) { m *= s.shatter; tag = "粉砕"; }
    if (b.stealth > 0) m *= 1 - (this.gim.cfg.dr || .8);
    if (b.vuln > 0) m *= 1.5;
    // ギミック処理
    this.onBossHit(ctx, el, s);

    if (b.ward) { m *= 1 - b.ward.dr; tag = tag || "障壁"; }
    if (this.crystals.some((c) => !c.dead) && this.gim?.cfg.dr) m *= 1 - this.gim.cfg.dr;

    let defense = b.defense * (1 + (b.buffs.armor?.v || 0));
    if (b.debuffs.sundered) defense *= 1 - b.debuffs.sundered.v;
    if (b.debuffs.shocked) m *= 1 + b.debuffs.shocked.v;
    const dm = 100 / (100 + defense);
    const critChance = (p.s.crit + (p.buffs.halo ? p.buffs.halo.v * 100 : 0) + (p.buffs.eclipse ? p.buffs.eclipse.v * 100 : 0)) / 100;
    const crit = p.buffs.insight ? true : this.rng() < critChance;
    if (crit) this.charge(p, "crit");
    if (s.awaken) this.awakenRider(p, s, b);
    if (s.awaken && s.elem === "fire" && b.statuses.burning) m *= 1.25;
    let dmg = pow * mul * m * dm * (crit ? p.s.critDmg / 100 : 1);
    if (b.buffs.shield) { const ab = Math.min(b.buffs.shield.v, dmg); b.buffs.shield.v -= ab; dmg -= ab; if (b.buffs.shield.v <= 0) delete b.buffs.shield; }

    if (b.reflect > 0 && !this.zoneHit) {
      const back = dmg * this.gim.cfg.ratio;
      dmg *= .15;
      this.hurtPlayer(p, back, { raw: 1, tag: "reflect" });
      this.ev({ e: "num", x: p.x, z: p.z, h: 40, text: "反射!", kind: "bad" });
      this.ev({ e: "sfx", s: "reflect" });
    }

    b.hp -= dmg;
    b.hit = .12;
    p.dealt += dmg;
    b.lastElem = el;
    b.lastHitter = p.id;
    this.charge(p, "damage", dmg);
    this.ev({ e: "num", x: b.x + (this.rng() - .5) * 30, z: b.z, h: 40 + this.rng() * 40, text: (tag ? tag + " " : "") + Math.round(dmg), kind: rx || cb ? "react" : crit ? "crit" : tag === "弱点" || tag === "粉砕" || tag === "感電" ? "weak" : tag === "耐性" || tag === "障壁" ? "dull" : "n" });
    if (s.lifesteal) this.healPlayer(p, dmg * s.lifesteal);
    if (s.wet) b.wet = 5;
    if (s.status && this.rng() < s.status[2]) { this.statusBoss(s.status[0], s.status[1], p, s); this.charge(p, "status"); }
    if (s.debuff) b.debuffs[s.debuff[0]] = { t: s.debuff[1], v: s.debuff[2] };
    if (s.strip) this.stripBoss(b.x, b.z, 9999);
    if (b.hp <= 0) this.bossDown(el);
  }

  /** 反応魔法が当たったとき: 敵に残った別の元素と反応する。反応がなければ元素を上書きして残す。 */
  tryReaction(p, s, b) {
    if (!REACTIVE.has(s.id)) return null;
    const A = b.aura;
    let out = null;
    if (A && A.el !== s.elem && this.t - (b.reactT ?? -9) >= REACT_ICD) {
      const R = reactionOf(A.el, s.elem);
      if (R) {
        b.reactT = this.t;
        b.aura = null;
        this.applyReaction(p, R, s, b);
        return R;
      }
    }
    if (!A || A.el !== s.elem || this.t - A.at > .2) b.aura = { el: s.elem, t: AURA_TIME, at: this.t };
    else A.t = AURA_TIME;
    return out;
  }
  applyReaction(p, R, s, b) {
    this.fxAt(R.fx, b.x, b.z, { onBoss: 1, rate: 1.6, cut: 1.4 });
    this.ev({ e: "sfx", s: "reaction" });
    this.ev({ e: "shake", v: 5 });
    this.ev({ e: "react", name: R.name });
    this.charge(p, "status");
    switch (R.effect) {
      case "shock": b.debuffs.shocked = { t: 6, v: .2 }; break;
      case "weaken": b.debuffs.weakened = { t: 5, v: .2 }; break;
      case "sunder": b.debuffs.sundered = { t: 8, v: Math.max(.4, b.debuffs.sundered?.v || 0) }; break;
      case "stagger": this.statusBoss("stunned", 1.2, p, s); break;
      case "freeze": this.statusBoss("frozen", 2, p, s); break;
      case "burn": b.statuses.burning = { t: 8, pow: s.pow * 1.5, mul: p.s.atk / 20 }; break;
      case "bloom": for (const q of this.players) if (!q.down) this.healPlayer(q, q.maxHp * .12); break;
      case "quicken": p.buffs.blessed = { t: 6, v: .3 }; break;
      case "wither": b.statuses.slowed = { t: 5 }; b.statuses.poisoned = { t: 6, pow: s.pow, mul: p.s.atk / 20 }; break;
      case "backlash": this.hurtPlayer(p, p.maxHp * .06, { raw: 1, tag: "backlash" }); break;
      case "refund": this.cutCd(p, 2, s.id); break;
      case "oracle": p.buffs.halo = { t: 6, v: .2 }; break;
    }
  }
  tryCombo(p, s, b) {
    const rec = (b.comboFirst ||= {});
    let hit = null;
    for (const C of COMBOS) {
      if (C.second !== s.id) continue;
      const k = p.id + C.name;
      if (this.t - (rec[p.id + C.first] ?? -99) <= 5 && this.t - (rec["cd" + k] ?? -99) >= COMBO_ICD) { rec["cd" + k] = this.t; hit = C; }
    }
    rec[p.id + s.id] = this.t;
    if (hit) { this.ev({ e: "sfx", s: "reaction" }); this.ev({ e: "react", name: hit.name, combo: 1 }); this.fxAt("arcane/mana-burst", b.x, b.z, { onBoss: 1, rate: 2, cut: .9 }); }
    return hit;
  }

  /** ランク10の属性覚醒。連続ヒットでも暴れないよう魔法ごとに間隔を空ける。 */
  awakenRider(p, s, b) {
    if (this.t - (p.riderT[s.id] ?? -9) < .4) return;
    p.riderT[s.id] = this.t;
    switch (s.elem) {
      case "fire": this.statusBoss("burning", 4, p, s); break;
      case "ice": if (this.rng() < .2 && !(b.stagger > 0)) { b.stagger = 1; b.statuses.frozen = { t: 1 }; this.cancelBossMove(); } break;
      case "water": b.wet = 5; for (const q of this.players) if (!q.down) this.healPlayer(q, q.maxHp * .01, true); break;
      case "thunder": if (this.rng() < .35) { this.fxAt("lightning/zap-hit", b.x, b.z, { onBoss: 1 }); const dm = s.pow * .5 * (p.s.atk / 20); b.hp -= dm; this.ev({ e: "num", x: b.x, z: b.z, h: 60, text: "連雷 " + Math.round(dm), kind: "weak" }); } break;
      case "arcane": this.cutCd(p, .4, s.id); break;
      case "holy": for (const q of this.players) if (!q.down) this.healPlayer(q, q.maxHp * .012, true); break;
      case "shadow": b.debuffs.sundered = { t: 4, v: Math.min(.5, (b.debuffs.sundered?.v || 0) + .05) }; break;
      case "nature": this.statusBoss("poisoned", 5, p, { pow: s.pow * 1.5 }); this.healPlayer(p, s.pow * .1, true); break;
    }
  }

  statusBoss(k, dur, p, s) {
    const b = this.boss;
    if (HARD_CC.has(k)) {
      if (b.ccImmune > 0) { this.ev({ e: "num", x: b.x, z: b.z, h: 90, text: "抵抗", kind: "dull" }); return; }
      const d = dur * Math.max(.35, 1 - this.floor * .03);
      b.stagger = Math.max(b.stagger, d);
      b.ccImmune = 10 + this.floor * .35;
      b.statuses[k] = { t: d };
      this.cancelBossMove();
    } else b.statuses[k] = { t: dur, by: p?.id, pow: (s?.pow || 10), mul: (p?.s.atk || 20) / 20 };
  }
  stripBoss(x, z, r) {
    const b = this.boss;
    if (hypot(b.x - x, b.z - z) > r + b.def.hitR) return;
    const k = Object.keys(b.buffs)[0];
    if (k) { delete b.buffs[k]; this.banner("バフを剥がした!", "good"); }
    if (b.ward && this.gim.cfg.by?.includes("emp")) this.breakWard();
  }

  bossDown(el) {
    const b = this.boss;
    if (b.revives > 0 && !this.gim.cfg.by.includes(el)) {
      b.revives--;
      b.hp = b.maxHp * this.gim.cfg.at;
      this.banner("司祭は死を拒んだ…!", "bad");
      this.fxAt("spawn/soul-rise", b.x, b.z, {});
      this.fxAt("shadow/dark-explosion", b.x, b.z, { rate: 2 });
      this.ev({ e: "sfx", s: "boom" });
      this.ev({ e: "note", floor: this.floor, text: "骸の司祭: 聖属性以外でとどめを刺すと蘇る" });
      this.buffBoss("rage", .25, 20);
      return;
    }
    if (this.gim?.kind === "revive") this.ev({ e: "note", floor: this.floor, text: "骸の司祭: 聖属性でとどめを刺すと蘇らない" });
    b.hp = 0; b.dead = true; b.state = "dead";
    this.hazards.length = 0;
    this.projectiles = this.projectiles.filter((q) => q.side === 0);
    this.zones = this.zones.filter((z) => z.side === 0);
    this.fxAt("explosions/plasma-explosion", b.x, b.z, { hover: 40 });
    this.fxAt("spawn/shatter-death", b.x, b.z, {});
    this.ev({ e: "shake", v: 16 });
    this.ev({ e: "sfx", s: "boss-dead" });
    for (const p of this.players) p.statuses = {};
  }

  // ───────── プレイヤーへの被弾 ─────────
  hurtPlayer(p, raw, o = {}) {
    if (p.down) return 0;
    if (p.dodge > 0) {
      // 回避の無敵中に攻撃を受けた = 完全回避
      if (!o.raw && !o.tag && p.perfT <= 0) {
        p.perfT = .12; p.perfects++;
        this.charge(p, "dodge");
        this.ev({ e: "num", x: p.x, z: p.z, h: 46, text: "完全回避!", kind: "perfect" });
        this.ev({ e: "sfx", s: "perfect" });
      }
      return 0;
    }
    if (p.inv > 0 || p.buffs.invuln) { if (!o.raw) this.ev({ e: "num", x: p.x, z: p.z, h: 44, text: "無効", kind: "dull" }); return 0; }
    let def = p.s.def;
    if (p.buffs.rage) def *= 1 - p.buffs.rage.def;
    let m = o.raw ? 1 : 100 / (100 + def);
    if (p.statuses.petrified) m *= .5;
    for (const z of this.zones) if (z.side === 0 && z.ally?.dr && hypot(p.x - z.x, p.z - z.z) < z.r) { m *= 1 - z.ally.dr; break; }
    let dmg = raw * m;
    if (p.buffs.ygg) dmg /= 3;
    if (this.boss.debuffs.weakened) dmg *= 1 - this.boss.debuffs.weakened.v;
    if (p.barrier > 0) { const ab = Math.min(p.barrier, dmg); p.barrier -= ab; dmg -= ab; if (p.barrier <= 0) delete p.buffs.barrier; }
    p.hp -= dmg;
    p.taken += dmg;
    if (dmg > 0) { p.nohit = 0; p.ultRdy = false; this.charge(p, "taken", dmg); if (p.ult && ULTS[p.ult].charge.type === "nohit") p.ultCharge = p.ultCharge >= ULTS[p.ult].charge.need ? p.ultCharge : 0; }
    if (p.statuses.sleep) delete p.statuses.sleep;
    if (dmg > 0) {
      p.flash = .12;
      if (!o.tag || o.tag === "reflect") this.ev({ e: "hurt", id: p.id, v: Math.min(1, dmg / p.maxHp * 2) });
      this.ev({ e: "num", x: p.x + (this.rng() - .5) * 12, z: p.z, h: 42, text: "" + Math.max(1, Math.round(dmg)), kind: o.tag && o.tag !== "reflect" ? "dot" : "bad" });
    }
    if (p.hp <= 0 && p.buffs.phoenix) {
      delete p.buffs.phoenix;
      p.hp = p.maxHp; p.inv = 3; p.statuses = {};
      this.fxAt("fire/fire-ring", p.x, p.z, {});
      this.banner(`${p.name} は炎の中から蘇った!`, "good");
      return dmg;
    }
    if (p.hp <= 0) {
      p.hp = 0; p.down = true; p.channel = null; p.casting = 0; p.deaths++; p.statuses = {}; p.buffs = {}; p.barrier = 0;
      this.fxAt("spawn/soul-rise", p.x, p.z, {});
      this.ev({ e: "sfx", s: "down" });
      this.banner(`${p.name} が倒れた`, "bad");
    }
    return dmg;
  }
  healPlayer(p, v, quiet) {
    if (p.down) return;
    if (p.statuses.cursed) v *= .4;
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + v);
    if (p.hp > before) this.charge(p, "heal", p.hp - before);
    if (!quiet && p.hp - before >= 1) this.ev({ e: "num", x: p.x, z: p.z, h: 42, text: "+" + Math.round(p.hp - before), kind: "heal" });
  }
  statusPlayer(p, k, dur) {
    if (p.down || p.inv > 0 || p.dodge > 0 || p.buffs.invuln) return;
    if (HARD_CC.has(k)) {
      if (p.ccImm > 0) return;
      p.ccImm = dur + 3;
      p.channel = null;
    }
    p.statuses[k] = { t: Math.max(dur, p.statuses[k]?.t || 0), tick: 0 };
    this.ev({ e: "toast", id: p.id, text: k, status: 1 });
  }

  later(t, fn) { this.delayed.push({ t, fn }); }
  stepDelayed(dt) {
    for (const d of this.delayed) d.t -= dt;
    const due = this.delayed.filter((d) => d.t <= 0);
    if (due.length) { this.delayed = this.delayed.filter((d) => d.t > 0); for (const d of due) d.fn(); }
  }

  // ───────── 弾・ゾーン・召喚 ─────────
  stepProjectiles(dt) {
    const out = [];
    const b = this.boss;
    for (const q of this.projectiles) {
      q.life -= dt;
      if (q.side === 0) {
        // プレイヤーの魔法はどれも敵を追いかける
        const tg = this.players.find((x) => x.id === q.owner) && this.autoTarget(this.players.find((x) => x.id === q.owner));
        if (tg) {
          const a = Math.atan2(tg.z - q.z, tg.x - q.x), sp = hypot(q.vx, q.vz), cur = Math.atan2(q.vz, q.vx);
          const T = (q.turn || 6) * dt, na = cur + Math.max(-T, Math.min(T, angDiff(a, cur)));
          q.vx = Math.cos(na) * sp; q.vz = Math.sin(na) * sp;
        }
      }
      if (q.homing && q.side === 1) {
        const tg = this.nearestPlayer(q.x, q.z);
        if (tg) {
          const a = Math.atan2(tg.z - q.z, tg.x - q.x), sp = hypot(q.vx, q.vz), cur = Math.atan2(q.vz, q.vx);
          const na = cur + Math.max(-q.homing * dt, Math.min(q.homing * dt, angDiff(a, cur)));
          q.vx = Math.cos(na) * sp; q.vz = Math.sin(na) * sp;
        }
      }
      q.x += q.vx * dt;
      q.z += q.vz * dt;
      let alive = q.life > 0 && hypot(q.x, q.z) < ARENA_R + 40;
      if (q.side === 0) {
        for (const t of this.targets()) {
          const R = (t === b ? b.def.hitR * .85 : 14) + q.r;
          if (hypot(t.x - q.x, t.z - q.z) >= R) continue;
          const last = q.hit.get(t);
          const s = q.s;
          if (s.pierce || s.tickHit) {
            const iv = s.tickHit || 99;
            if (last !== undefined && this.t - last < iv) continue;
            q.hit.set(t, this.t);
            this.hitTarget({ p: this.players.find((x) => x.id === q.owner), s, mul: q.mul }, t, s.pow);
            if (s.hitFx) this.fxAt(s.hitFx, q.x, q.z, { rate: s.hitRate || 1.5, pal: s.hitPal });
          } else {
            this.hitTarget({ p: this.players.find((x) => x.id === q.owner), s, mul: q.mul }, t, s.pow);
            if (s.splash) { /* 単体ボスなので見た目の爆発のみ */ }
            if (s.hitFx) this.fxAt(s.hitFx, q.x, q.z, { rate: s.hitRate || 1.5, pal: s.hitPal, hover: 16 });
            this.ev({ e: "sfx", s: "hit-" + s.elem });
            alive = false;
            break;
          }
        }
      } else {
        for (const p of this.players) {
          if (p.down) continue;
          if (hypot(p.x - q.x, p.z - q.z) < q.r + 9) {
            if (q.hit.has(p)) continue;
            // 回避中はすり抜ける
            if (p.dodge > 0) { q.hit.set(p, 1); this.hurtPlayer(p, q.dmg); continue; }
            const did = this.hurtPlayer(p, q.dmg);
            if (q.status && (q.chance === undefined || this.rng() < q.chance)) this.statusPlayer(p, q.status[0], q.status[1]);
            if (did >= 0) this.ev({ e: "sfx", s: "hurt" });
            if (q.pierce) q.hit.set(p, 1); else { alive = false; break; }
          }
        }
      }
      if (alive) out.push(q);
    }
    this.projectiles = out;
  }

  stepZones(dt) {
    const out = [];
    for (const z of this.zones) {
      z.life -= dt;
      z.tt += dt;
      if (z.follow) { const p = this.players.find((q) => q.id === z.follow); if (p) { z.x = p.x; z.z = p.z; } }
      if (z.drift) {
        const tg = z.side === 0 ? this.boss : this.nearestPlayer(z.x, z.z);
        if (tg) { const d = hypot(tg.x - z.x, tg.z - z.z) || 1; z.x += (tg.x - z.x) / d * z.drift * dt; z.z += (tg.z - z.z) / d * z.drift * dt; }
      }
      if (z.pullZone) for (const p of this.players) if (!p.down) { const d = hypot(z.x - p.x, z.z - p.z); if (d < z.pullZone * 2.2 && d > 2) { p.x += (z.x - p.x) / d * 45 * dt; p.z += (z.z - p.z) / d * 45 * dt; } }
      if (z.tt >= z.tick) {
        z.tt -= z.tick;
        if (z.side === 0) {
          if (z.pow > 0) {
            this.zoneHit = true;
            this.damageCircle(z.ctx, z.x, z.z, z.r, z.pow);
            this.zoneHit = false;
          }
          if (z.ally?.regen) for (const p of this.players) if (!p.down && hypot(p.x - z.x, p.z - z.z) < z.r) this.healPlayer(p, p.maxHp * z.ally.regen * z.tick);
          // 毒霧を焼く
          if (z.s?.elem && this.gim?.cfg.burnBy?.includes(z.s.elem)) for (const m of this.zones) if (m.mire && hypot(m.x - z.x, m.z - z.z) < m.r + z.r) m.life = Math.min(m.life, .3);
        } else {
          for (const p of this.players) {
            if (p.down || hypot(p.x - z.x, p.z - z.z) >= z.r) continue;
            this.hurtPlayer(p, z.dmg, { tag: "zone" });
            if (z.status) this.statusPlayer(p, z.status[0], z.status[1]);
          }
          if (z.mire && hypot(this.boss.x - z.x, this.boss.z - z.z) < z.r && !this.boss.dead) {
            this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + this.boss.maxHp * this.gim.cfg.heal * z.tick);
            this.ev({ e: "num", x: this.boss.x, z: this.boss.z, h: 70, text: "再生", kind: "absorb" });
          }
        }
      }
      if (z.life > 0) out.push(z);
    }
    this.zones = out;
  }

  stepSummons(dt) {
    const out = [];
    for (const m of this.summons) {
      m.life -= dt; m.t += dt;
      if (m.t > m.born && !this.boss.dead) {
        m.cool = (m.cool || 0) - dt;
        if (m.cool <= 0) {
          m.cool = m.every;
          const owner = this.players.find((q) => q.id === m.owner);
          const b = (owner && this.autoTarget(owner)) || this.boss, d = hypot(b.x - m.x, b.z - m.z), s = m.s;
          if (d < s.range + (b.def?.hitR || 14)) {
            const a = Math.atan2(b.z - m.z, b.x - m.x);
            const shot = specOf(s.shot, 1);
            const proj = { ...shot, pow: s.pow, elem: s.elem };
            this.projectiles.push({ id: this.uid++, side: 0, owner: m.owner, x: m.x + Math.cos(a) * 10, z: m.z + Math.sin(a) * 10, vx: Math.cos(a) * 340, vz: Math.sin(a) * 340, r: 8, life: 1.4, fx: "projectiles/plasma-shot", dir: true, mul: m.mul, s: { ...proj, kind: "bolt", speed: 340, pierce: 0, tickHit: 0, r: 8, hitFx: "lightning/zap-hit" }, hit: new Map() });
          }
        }
      }
      if (m.life > 0) out.push(m);
    }
    this.summons = out;
  }

  nearestPlayer(x, z) {
    let best = null, bd = 1e9;
    for (const p of this.players) { if (p.down) continue; const d = hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  randPlayer() { const a = this.players.filter((p) => !p.down); return a[Math.floor(this.rng() * a.length)]; }

  // ───────── ボスの行動 ─────────
  bossAtk() {
    const b = this.boss;
    let m = 1 + (b.buffs.rage?.v || 0) + b.enraged;
    if (b.debuffs.weakened) m *= 1 - b.debuffs.weakened.v;
    return b.atk * m;
  }
  buffBoss(k, v, t) { this.boss.buffs[k] = { v, t }; this.ev({ e: "bossbuff", k }); }

  stepBoss(dt) {
    const b = this.boss;
    if (b.dead) return;
    b.hit = Math.max(0, b.hit - dt);
    b.wet = Math.max(0, b.wet - dt);
    if (b.aura) { b.aura.t -= dt; if (b.aura.t <= 0) b.aura = null; }
    b.ccImmune = Math.max(0, (b.ccImmune || 0) - dt);
    b.vuln = Math.max(0, (b.vuln || 0) - dt);
    for (const k of Object.keys(b.buffs)) { b.buffs[k].t -= dt; if (b.buffs[k].t <= 0) delete b.buffs[k]; }
    for (const k of Object.keys(b.debuffs)) { b.debuffs[k].t -= dt; if (b.debuffs[k].t <= 0) delete b.debuffs[k]; }
    for (const k of Object.keys(b.statuses)) {
      const st = b.statuses[k];
      st.t -= dt; st.tick = (st.tick || 0) + dt;
      if (st.tick >= 1) {
        st.tick -= 1;
        if (k === "burning" || k === "poisoned" || k === "bleeding") {
          const dmg = st.pow * .25 * st.mul * (k === "poisoned" ? 1.2 : 1);
          b.hp -= dmg;
          this.ev({ e: "num", x: b.x, z: b.z, h: 50, text: "" + Math.round(dmg), kind: "dot" });
          if (b.hp <= 0) { this.bossDown(b.lastElem); if (b.dead) return; }
        }
      }
      if (st.t <= 0) delete b.statuses[k];
    }
    if (b.buffs.regen) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * b.buffs.regen.v * dt);

    // 制限時間を超えると激化
    const E = enrageAt(this.floor);
    if (this.t > E) {
      const lv = Math.floor((this.t - E) / 15) + 1;
      const next = lv * .25;
      if (next !== b.enraged) { b.enraged = next; this.banner(`ボスの力が増していく… (攻撃 +${Math.round(next * 100)}%)`, "bad"); }
    }
    // フェーズ
    const ph = b.def.phases || [];
    while (b.phase < ph.length && b.hp / b.maxHp < ph[b.phase]) {
      b.phase++;
      this.banner(`${b.def.name} — 第${b.phase + 1}形態`, "bad");
      this.ev({ e: "shake", v: 10 });
      this.ev({ e: "sfx", s: "boom" });
      this.fxAt("arcane/mana-burst", b.x, b.z, { hover: 30, pal: b.def.pal });
      b.bag = [];
      this.buffBoss("rage", .2, 12);
    }

    if (b.stop > 0) { b.stop -= dt; return; }
    if (b.stagger > 0) { b.stagger -= dt; b.cast = 0; return; }
    if (b.air > 0) b.air -= dt;
    if (b.lock > 0) { b.lock -= dt; return; }

    // 移動
    const hasteK = 1 + (b.buffs.haste?.v || 0);
    const speedK = (b.statuses.slowed ? .55 : 1) * hasteK;
    const tgt = this.bossTarget();
    if (tgt && b.state !== "dash") {
      const dx = tgt.x - b.x, dz = tgt.z - b.z, d = hypot(dx, dz) || 1;
      if (b.state !== "tele" && d > b.def.hitR + 50) { b.x += dx / d * b.def.speed * speedK * dt; b.z += dz / d * b.def.speed * speedK * dt; }
      if (Math.abs(dx) > 8) b.facing = dx > 0 ? 1 : -1;
    }
    const e = hypot(b.x, b.z);
    if (e > ARENA_R - 30) { b.x *= (ARENA_R - 30) / e; b.z *= (ARENA_R - 30) / e; }

    // ボスに触れ続けるとじわじわ削られる
    if (!b.air) for (const p of this.players) {
      if (p.down) continue;
      if (hypot(p.x - b.x, p.z - b.z) < b.def.hitR * .8 + 6) {
        p.contactT += dt;
        if (p.contactT >= .5) { p.contactT -= .5; this.hurtPlayer(p, b.atk * CONTACT_K, { tag: "contact" }); this.ev({ e: "sfx", s: "hurt" }); }
      } else p.contactT = Math.min(p.contactT, .3);
    }

    // 状態機械
    b.timer -= dt * hasteK;
    if (b.state === "intro" || b.state === "gap") {
      if (b.timer <= 0) this.chooseMove();
    } else if (b.state === "tele") {
      b.cast = 1;
      if (b.timer <= 0) { const m = b.move; b.cast = 0; b.state = "gap"; b.timer = bossGap(this.floor) * (1 + (this.rng() - .5) * .3); this.execMove(m, b.moveTarget); }
    } else if (b.state === "dash") {
      const m = b.dash;
      b.dashT -= dt;
      const sp = m.speed;
      b.x += Math.cos(m.ang) * sp * dt; b.z += Math.sin(m.ang) * sp * dt;
      for (const p of this.players) if (!p.down && !m.hit.has(p) && hypot(p.x - b.x, p.z - b.z) < b.def.hitR * .6 + m.wid / 2) {
        m.hit.add(p);
        this.hurtPlayer(p, this.bossAtk() * m.pow);
        if (m.status) this.statusPlayer(p, m.status[0], m.status[1]);
        this.ev({ e: "shake", v: 6 });
      }
      if (b.dashT <= 0 || hypot(b.x, b.z) > ARENA_R - 20) {
        b.state = "gap"; b.timer = bossGap(this.floor);
        if (m.fx) this.fxAt(m.fx, b.x, b.z, { rate: m.rate || 1, pal: b.def.pal });
        this.ev({ e: "sfx", s: "boom" });
      }
    }
  }
  bossTarget() {
    const b = this.boss;
    if (!b.tgt || b.tgt.down || this.rng() < .004) b.tgt = this.randPlayer();
    return b.tgt;
  }
  cancelBossMove() { const b = this.boss; if (b.state === "tele") { b.state = "gap"; b.timer = .6; b.cast = 0; } }

  chooseMove() {
    const b = this.boss;
    const avail = b.def.moves.filter((m) => (m.phase || 0) <= b.phase);
    if (!b.bag.length) {
      b.bag = avail.slice();
      for (let i = b.bag.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [b.bag[i], b.bag[j]] = [b.bag[j], b.bag[i]]; }
      // 新しいフェーズの技を先に
      b.bag.sort((x, y) => (y.phase || 0) - (x.phase || 0));
    }
    this.startMove(b.bag.shift());
  }
  startMove(m) {
    const b = this.boss;
    b.move = m;
    b.state = "tele";
    b.moveTarget = this.bossTarget();
    b.timer = (m.tele || .6) * teleScale(this.floor) * (m.k === "spots" || m.k === "nova" || m.k === "donut" || m.k === "cone" || m.k === "line" || m.k === "hex" ? .35 : 1);
    if (m.name) this.ev({ e: "bossmove", name: m.name });
    this.ev({ e: "sfx", s: "boss-cast" });
    // 予告は b.timer のあと実行される execMove が出すので、ボスの詠唱分だけ猶予が増える
  }

  addHazard(h) {
    const b = this.boss;
    const tele = (h.tele ?? 1) * teleScale(this.floor);
    const H = { id: this.uid++, t: tele, tele, side: 1, dmg: this.bossAtk() * (h.pow ?? 1), ...h };
    H.tele = tele; H.t = tele + (h.delay || 0);
    this.hazards.push(H);
    // 追跡する攻撃は予告の前半だけ相手を追い、残り 45% で位置が確定する(その瞬間にエフェクトを出す)
    if (H.track) { H.lockAt = tele * .45; H.spawnFx = H.fx; return H; }
    this.spawnHazardFx(H, h);
    return H;
  }
  spawnHazardFx(H, h) {
    const b = this.boss;
    if (H.fx) {
      const rate = h.rate || Math.max(1, (FX_HIT[H.fx] ?? .3) / Math.max(.15, H.t));
      const hit = (FX_HIT[H.fx] ?? .3) / rate;
      const start = H.t - hit;
      const o = { rate, pal: h.palFx || b.def.pal, startIn: Math.max(0, start), skip: Math.max(0, -start) };
      if (H.shape === "line" || H.shape === "cone") {
        // 方向を持つエフェクト
        const dirFx = DIRECTIONAL.has(H.fx);
        if (dirFx) { o.ang = H.ang; o.flipA = 1; } else o.ground = 1;
        if (H.dur) o.loopFor = H.dur;
        this.fxAt(H.fx, H.x, H.z, o);
      } else if (H.shape === "donut") {
        const n = h.fxRing || 6;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; this.fxAt(H.fx, H.x + Math.cos(a) * (H.r + 70), H.z + Math.sin(a) * (H.r + 70), { ...o, startIn: o.startIn + i * .02 }); }
      } else this.fxAt(H.fx, H.x, H.z, o);
    }
  }

  stepHazards(dt) {
    const out = [];
    for (const h of this.hazards) {
      h.t -= dt;
      if (h.track && h.spawnFx !== undefined) {
        const q = h.track;
        if (h.t > h.lockAt && !q.down) {
          if (h.shape === "circle") {
            const dx = q.x + (h.ox || 0) - h.x, dz = q.z + (h.oz || 0) - h.z, d = hypot(dx, dz), st = 170 * dt;
            if (d > 0) { h.x += dx / Math.max(d, st) * Math.min(d, st); h.z += dz / Math.max(d, st) * Math.min(d, st); }
          } else { h.x = this.boss.x; h.z = this.boss.z; h.ang = Math.atan2(q.z - h.z, q.x - h.x) + (h.angOff || 0); }
        } else if (h.t <= h.lockAt) {
          const F = h.spawnFx; h.spawnFx = undefined;
          if (F) { const rt = Math.max(h.rate || 1, (FX_HIT[F] ?? .3) / Math.max(.12, h.lockAt)); this.spawnHazardFx(h, { rate: rt, palFx: h.palFx, fxRing: h.fxRing }); }
        }
      }
      if (h.t > 0) { out.push(h); continue; }
      if (h.onFire) h.onFire();
      if (h.dur) {
        h.life = (h.life ?? h.dur) - dt;
        h.tt = (h.tt || 0) + dt;
        const iv = h.dur / (h.ticks || 3);
        if (h.sweep) h.ang += h.sweep * dt / h.dur * (h.sweepDir || 1);
        if (h.tt >= iv) { h.tt -= iv; this.fireHazard(h); }
        if (h.life > 0) { h.t = 0; h.firing = true; out.push(h); }
        continue;
      }
      this.fireHazard(h);
    }
    this.hazards = out;
  }

  fireHazard(h) {
    if (h.safe || (h.dmg <= 0 && !h.status)) return;   // 予告だけの印
    for (const p of this.players) {
      if (p.down || !this.inShape(h, p.x, p.z)) continue;
      if (p.dodge > 0) { this.hurtPlayer(p, h.dmg); continue; }
      const before = p.inv > 0;
      const did = this.hurtPlayer(p, h.dmg);
      if (h.status && (h.chance === undefined || this.rng() < h.chance)) this.statusPlayer(p, h.status[0], h.status[1]);
      if (h.silence) { p.silence = h.silence; this.ev({ e: "toast", id: p.id, text: "魔法が封じられた!" }); }
      if (h.lifesteal && did > 0) { const b = this.boss; b.hp = Math.min(b.maxHp, b.hp + b.maxHp * h.lifesteal); }
      if (!before) this.ev({ e: "sfx", s: "hurt" });
    }
    if (h.shake) this.ev({ e: "shake", v: h.shake });
    this.ev({ e: "sfx", s: h.boom ? "boom" : "hit-boss" });
  }
  inShape(h, x, z) {
    const dx = x - h.x, dz = z - h.z, d = hypot(dx, dz);
    if (h.shape === "circle") return d < h.r + 7;
    if (h.shape === "donut") return d > h.r && d < h.r2;
    if (h.shape === "cone") return d < h.len && Math.abs(angDiff(Math.atan2(dz, dx), h.ang)) < h.wid;
    if (h.shape === "line") { const cx = Math.cos(h.ang), cz = Math.sin(h.ang), a = dx * cx + dz * cz, o = Math.abs(dx * cz - dz * cx); return a > 0 && a < h.len && o < h.wid / 2 + 6; }
    return false;
  }

  execMove(m, target) {
    const b = this.boss;
    const tgt = target && !target.down ? target : this.randPlayer();
    if (!tgt) return;
    const phaseK = 1 + b.phase * .08;
    switch (m.k) {
      case "spots": {
        const pts = [];
        if (m.target === "players") {
          const al = this.players.filter((p) => !p.down);
          for (let i = 0; i < m.n; i++) {
            const p = al[i % al.length];
            const sp = i < al.length ? 0 : (m.spread || 40);
            const a = this.rng() * 6.28, r = this.rng() * sp;
            pts.push([p.x + Math.cos(a) * r + p.mx * 28, p.z + Math.sin(a) * r + p.mz * 28]);
          }
        } else {
          for (let i = 0; i < m.n; i++) {
            const a = this.rng() * 6.28, r = Math.sqrt(this.rng()) * (ARENA_R - 20);
            pts.push([Math.cos(a) * r, Math.sin(a) * r]);
          }
          // 必ず 1 つはプレイヤーを狙う
          pts[0] = [tgt.x, tgt.z];
        }
        const al = this.players.filter((p) => !p.down);
        pts.forEach(([x, z], i) => {
          // 最初の数発は相手を追いかける
          const trk = m.target === "players" && i < al.length ? al[i] : i === 0 && m.target !== "players" ? tgt : null;
          this.addHazard({ shape: "circle", x, z, r: m.r, tele: m.tele, delay: (m.stagger || 0) * i, pow: m.pow * phaseK, fx: m.fx, status: m.status, chance: m.chance, rate: m.rate, shake: m.shake, palFx: m.palFx, ...(trk ? { track: trk } : {}) });
        });
        break;
      }
      case "nova":
        this.addHazard({ shape: "circle", x: b.x, z: b.z, r: m.r, tele: m.tele, pow: m.pow * phaseK, fx: m.fx, status: m.status, chance: m.chance, silence: m.silence, boom: 1, rate: m.rate });
        break;
      case "donut":
        this.addHazard({ shape: "donut", x: b.x, z: b.z, r: m.r, r2: m.r2, tele: m.tele, pow: m.pow * phaseK, fx: m.fx, fxRing: m.fxRing, status: m.status, boom: 1, rate: m.rate });
        break;
      case "cone": {
        const ang = Math.atan2(tgt.z - b.z, tgt.x - b.x);
        this.addHazard({ shape: "cone", x: b.x, z: b.z, ang, len: m.len, wid: m.wid, tele: m.tele, pow: m.pow * phaseK, fx: m.fx, status: m.status, dur: m.dur, ticks: m.ticks, sweep: m.sweep, sweepDir: this.rng() < .5 ? -1 : 1, track: tgt });
        b.lock = (m.tele * teleScale(this.floor)) + (m.dur || 0);
        break;
      }
      case "line": {
        const fan = m.multi || 1;
        const ang0 = Math.atan2(tgt.z - b.z, tgt.x - b.x);
        for (let i = 0; i < fan; i++) this.addHazard({ shape: "line", x: b.x, z: b.z, ang: ang0 + (i - (fan - 1) / 2) * .55, len: m.len, wid: m.wid, tele: m.tele, pow: m.pow * phaseK, fx: m.fx, status: m.status, chance: m.chance, dur: m.dur, ticks: m.ticks, sweep: m.sweep, sweepDir: this.rng() < .5 ? -1 : 1, lifesteal: m.lifesteal, rate: m.rate, track: tgt, angOff: (i - (fan - 1) / 2) * .55 });
        b.lock = (m.tele * teleScale(this.floor)) + (m.dur || 0);
        break;
      }
      case "fan": {
        const reps = m.repeat || 1;
        for (let r = 0; r < reps; r++) this.later(r * (m.interval || 0), () => {
          if (b.dead || b.stop > 0) return;
          const tg2 = tgt.down ? this.randPlayer() : tgt;
          if (!tg2) return;
          const a0 = Math.atan2(tg2.z - b.z, tg2.x - b.x);
          for (let i = 0; i < m.n; i++) {
            const a = m.spread >= 6 ? a0 + i / m.n * Math.PI * 2 : a0 + (m.n > 1 ? (i / (m.n - 1) - .5) * m.spread : 0);
            this.bossBolt(m, a, phaseK);
          }
          this.ev({ e: "sfx", s: "boss-shot" });
        });
        break;
      }
      case "spiral": {
        let a0 = this.rng() * 6.28;
        for (let r = 0; r < m.rounds; r++) this.later(r * .34, () => {
          if (b.dead || b.stop > 0) return;
          for (let i = 0; i < m.n; i++) this.bossBolt(m, a0 + i / m.n * Math.PI * 2, phaseK);
          a0 += m.spin ?? .26;
          this.ev({ e: "sfx", s: "boss-shot" });
        });
        break;
      }
      case "zone": {
        for (let i = 0; i < m.n; i++) {
          let x, z;
          if (i === 0) { x = tgt.x; z = tgt.z; }
          else { const a = this.rng() * 6.28, r = Math.sqrt(this.rng()) * (ARENA_R - m.r); x = Math.cos(a) * r; z = Math.sin(a) * r; }
          this.addHazard({ shape: "circle", x, z, r: m.r, tele: m.tele, pow: 0, onFire: null });
          const tele = m.tele * teleScale(this.floor);
          this.later(tele, () => {
            if (b.dead) return;
            this.zones.push({ id: this.uid++, side: 1, x, z, r: m.r, life: m.dur, max: m.dur, tick: m.tick || .6, tt: 0, dmg: this.bossAtk() * m.pow * phaseK * ZONE_K, status: m.status, fx: m.fx, pal: b.def.pal, drift: m.drift || 0, hoverFx: !!m.hoverFx, pullZone: m.pullZone, mire: m.mire });
          });
        }
        break;
      }
      case "dash": {
        const ang = Math.atan2(tgt.z - b.z, tgt.x - b.x);
        const len = Math.min(ARENA_R * 1.6, hypot(tgt.x - b.x, tgt.z - b.z) + 120);
        const tele = m.tele * teleScale(this.floor);
        this.addHazard({ shape: "line", x: b.x, z: b.z, ang, len, wid: m.wid + b.def.hitR * .6, tele, pow: 0, noFire: 1 });
        b.lock = tele;
        this.later(tele, () => {
          if (b.dead) return;
          b.state = "dash"; b.dashT = len / 420;
          b.dash = { ang, speed: 420, pow: m.pow * phaseK, wid: m.wid, hit: new Set(), status: m.status, fx: m.fx, rate: m.rate };
          this.ev({ e: "sfx", s: "boss-dash" });
        });
        break;
      }
      case "buff":
        this.buffBoss(m.buff, m.val, m.dur);
        this.fxAt(m.fx, b.x, b.z, { cut: 1.4, pal: b.def.pal, onBoss: 1 });
        this.banner(`${b.def.name.split(" ").pop()} は「${m.name}」を纏った`, "bad");
        break;
      case "hex":
        for (const p of this.players) if (!p.down) this.addHazard({ shape: "circle", x: p.x, z: p.z, r: m.r, tele: m.tele, pow: m.pow, fx: m.fx, status: [m.status, m.dur], palFx: m.tint, track: p });
        break;
      case "pull": {
        this.fxAt(m.fx, b.x, b.z, { pal: b.def.pal, cut: m.dur, ground: 1 });
        const tEnd = this.t + m.dur;
        const puller = { life: m.dur, force: m.force };
        this.gimPull = puller;
        this.banner("引き寄せられる!", "bad");
        break;
      }
      case "blink": {
        this.fxAt("arcane/blink-out", b.x, b.z, { pal: b.def.pal });
        const a = this.rng() * 6.28, r = this.rng() * (ARENA_R - 60);
        b.x = Math.cos(a) * r; b.z = Math.sin(a) * r;
        this.fxAt("arcane/blink-in", b.x, b.z, { pal: b.def.pal });
        this.ev({ e: "snapb" });
        break;
      }
      case "combo":
        m.list.forEach((x, i) => this.later(i * 1.2, () => { if (!b.dead) this.execMove(x, this.randPlayer()); }));
        break;
    }
  }

  bossBolt(m, a, phaseK) {
    const b = this.boss;
    this.projectiles.push({
      id: this.uid++, side: 1, x: b.x + Math.cos(a) * 24, z: b.z + Math.sin(a) * 24, vx: Math.cos(a) * m.speed, vz: Math.sin(a) * m.speed,
      r: m.r || 8, life: m.life || 3.4, fx: m.fxBolt || m.fx, dir: !!m.dir, hover: !!m.hover, pal: m.palFx || b.def.pal, dmg: this.bossAtk() * m.pow * phaseK * BOLT_K,
      status: m.status, chance: m.chance, homing: m.homing ?? (m.k === "fan" && m.spread < 2.5 ? .55 : 0), hit: new Map(),
    });
  }

  // ───────── ギミック ─────────
  stepGimmick(dt) {
    const b = this.boss, G = this.gim;
    if (this.gimPull) {
      this.gimPull.life -= dt;
      for (const p of this.players) if (!p.down) { const d = hypot(b.x - p.x, b.z - p.z) || 1; p.x += (b.x - p.x) / d * this.gimPull.force * dt; p.z += (b.z - p.z) / d * this.gimPull.force * dt; }
      if (this.gimPull.life <= 0) this.gimPull = null;
    }
    if (!G || b.dead || this.players.every((p) => p.down)) return;
    const C = G.cfg;
    if (b.stop > 0 || b.state === "intro") return;
    G.timer -= dt;

    switch (G.kind) {
      case "ward":
        if (b.ward) {
          b.ward.t -= dt;
          if (b.ward.t <= 0) { b.ward = null; this.execMove(C.punish, this.randPlayer()); this.banner("障壁が解き放たれた!", "bad"); G.timer = C.every; }
        } else if (G.timer <= 0) {
          b.ward = { t: C.dur, dr: C.dr, hits: C.hits, max: C.hits };
          this.ev({ e: "gimmick", kind: "ward" });
          this.banner(`${b.def.name.split(" ").pop()} は分厚い障壁を纏った`, "bad");
          this.fxAt(C.fx || "ice/freeze", b.x, b.z, { pal: b.def.pal, onBoss: 1 });
          G.timer = C.every + C.dur;
        }
        break;
      case "overheat":
        if (b.vent > 0) {
          b.vent -= dt;
          if (b.vent <= 0) { this.buffBoss("rage", .3, 12); this.banner("放熱に失敗…怒りが増した", "bad"); G.timer = C.every; }
        } else if (G.timer <= 0) { b.vent = C.dur; this.ev({ e: "gimmick", kind: "vent" }); this.banner("体が赤熱している…", "info"); }
        break;
      case "air":
        if (G.timer <= 0) {
          b.air = C.dur; G.timer = C.every + C.dur;
          this.banner("空へ舞い上がった!", "bad");
        }
        break;
      case "reflect":
        if (b.reflect > 0) { b.reflect -= dt; if (b.reflect <= 0) G.timer = C.every; }
        else if (G.timer <= 0) { b.reflect = C.dur; this.ev({ e: "sfx", s: "reflect" }); this.fxAt("shadow/hex-sigil", b.x, b.z, { pal: "neon", rate: 3 }); this.banner("人形が妖しく笑っている…", "info"); }
        break;
      case "mire":
        if (G.timer <= 0) {
          G.timer = C.every;
          const x = b.x, z = b.z;
          this.zones.push({ id: this.uid++, side: 1, x, z, r: C.r, life: 12, max: 12, tick: .8, tt: 0, dmg: this.bossAtk() * .3, status: ["poisoned", 3], fx: "nature/poison-cloud", pal: "neon", mire: 1, drift: 0 });
        }
        break;
      case "safeRune": this.tickSafeRune(C, G, dt); break;
      case "crystal":
        if (G.timer <= 0 && !this.crystals.some((c) => !c.dead)) {
          G.timer = C.every;
          this.crystals = [];
          for (let i = 0; i < C.n; i++) { const a = this.rng() * 6.28, r = 90 + this.rng() * 130; this.crystals.push({ id: this.uid++, x: Math.cos(a) * r, z: Math.sin(a) * r, hp: b.maxHp * C.hp, maxHp: b.maxHp * C.hp, kind: "core" }); }
          this.banner(`${C.label}が現れた。ボスの傷が塞がっていく…`, "bad");
          this.ev({ e: "sfx", s: "boss-cast" });
        }
        if (this.crystals.some((c) => !c.dead)) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .002 * dt);
        break;
      case "bloom":
        if (G.timer <= 0) {
          G.timer = C.every;
          for (let i = 0; i < C.n; i++) { const a = this.rng() * 6.28, r = 60 + this.rng() * 170; const x = Math.cos(a) * r, z = Math.sin(a) * r; this.crystals.push({ id: this.uid++, x, z, hp: b.maxHp * C.hp * .4, maxHp: b.maxHp * C.hp * .4, kind: "bloom", ttl: 8 }); this.fxAt(C.fx, x, z, {}); }
          this.banner("命の花が咲いた", "info");
        }
        for (const c of this.crystals) if (!c.dead && c.kind === "bloom") {
          c.ttl -= dt;
          if (c.ttl <= 0) { c.dead = true; const heal = b.maxHp * C.heal; b.hp = Math.min(b.maxHp, b.hp + heal); this.ev({ e: "num", x: b.x, z: b.z, h: 90, text: "+" + Math.round(heal), kind: "absorb" }); this.fxAt("nature/healing-bloom", b.x, b.z, { onBoss: 1 }); this.banner("花が樹霊に吸われた…", "bad"); this.ev({ e: "note", floor: this.floor, text: "千年樹霊: 命の花は枯らされる前に壊す" }); }
        }
        this.crystals = this.crystals.filter((c) => !c.dead);
        break;
      case "judge":
        if (G.timer <= 0) {
          G.timer = C.every;
          // 全員のHPが低いと大回復 / 高い者ほど大ダメージ
          const al = this.players.filter((p) => !p.down);
          for (const p of al) this.addHazard({ shape: "circle", x: p.x, z: p.z, r: 66, tele: 1.25, pow: p.hp / p.maxHp > .6 ? 2.4 : .7, fx: "holy/holy-pillar", palFx: "fallen", boom: 1 });
          this.banner("審判 — 満ち足りた者に重い光を", "bad");
        }
        break;
      case "stealth":
        if (b.stealth > 0) { b.stealth -= dt; if (b.stealth <= 0) { G.timer = C.every; this.ev({ e: "gimmick", kind: "reveal" }); } }
        else if (G.timer <= 0) {
          b.stealth = C.dur;
          this.fxAt("shadow/eclipse", b.x, b.z, { hover: 80, cut: 2, pal: "shadow" });
          this.banner("影に溶けた…", "bad");
        }
        break;
      case "shatterCombo":
        if (G.timer <= 0) {
          G.timer = C.every;
          const al = this.players.filter((p) => !p.down);
          const v = al[Math.floor(this.rng() * al.length)];
          // 凍結 → 数秒後にその場を粉砕。仲間が触れる / 自分で融かせば避けられる
          this.addHazard({ shape: "circle", x: v.x, z: v.z, r: 42, tele: .85, pow: .25, fx: "ice/freeze", status: C.status, palFx: "frost" });
          const px = v.x, pz = v.z, tid = v;
          this.later(2.6, () => {
            if (b.dead || !tid.statuses.frozen || tid.down) return;
            this.addHazard({ shape: "circle", x: tid.x, z: tid.z, r: 58, tele: .55, pow: C.pow, fx: "ice/ice-shatter", palFx: "frost", boom: 1 });
          });
          this.banner(`${v.name} が凍りついた!`, "bad");
        }
        // 凍結中の仲間に味方が触れると解ける
        for (const p of this.players) if (p.statuses.frozen) for (const q of this.players) if (q !== p && !q.down && hypot(p.x - q.x, p.z - q.z) < 40) { delete p.statuses.frozen; this.fxAt("ice/ice-shatter", p.x, p.z, { rate: 2 }); this.banner(`${q.name} が氷を砕いた`, "good"); this.ev({ e: "note", floor: this.floor, text: "凍界の女王: 触れれば凍結を解ける" }); }
        break;
      case "lightningRod":
        if (G.timer <= 0) {
          G.timer = C.every;
          for (let i = 0; i < C.n; i++) {
            const a = i / C.n * 6.28 + this.rng(), r = 150;
            this.addHazard({ shape: "circle", x: Math.cos(a) * r, z: Math.sin(a) * r, r: C.r, tele: 1.5, pow: 0, safe: 1 });
          }
          const safe = this.hazards.filter((h) => h.safe && h.t > 1);
          this.later(1.5 * teleScale(this.floor), () => {
            this.banner("天雷!", "bad");
            for (const p of this.players) {
              if (p.down) continue;
              if (safe.some((h) => hypot(p.x - h.x, p.z - h.z) < h.r)) continue;
              this.fxAt("lightning/lightning-strike", p.x, p.z, { pal: "electric", skip: .2 });
              this.hurtPlayer(p, this.bossAtk() * C.pow);
            }
            this.ev({ e: "shake", v: 12 });
            this.ev({ e: "sfx", s: "thunder" });
          });
          this.banner("避雷の印に入れ", "info");
        }
        break;
      case "mirror":
        if (G.mirrorT !== undefined) {
          G.mirrorT -= dt;
          if (G.mirrorT <= 0 && b.state !== "tele") { G.mirrorT = C.every; this.castMirror(); }
        }
        if ((G.weakT = (G.weakT || 0) - dt) <= 0) this.rotateMirrorWeak();
        break;
      case "gravity": {
        const k = C.force + C.grow * (1 - b.hp / b.maxHp);
        for (const p of this.players) if (!p.down) { const d = hypot(b.x - p.x, b.z - p.z) || 1; p.x += (b.x - p.x) / d * k * dt; p.z += (b.z - p.z) / d * k * dt; }
        break;
      }
      case "rotate":
        if (G.timer <= 0) { G.timer = C.every; this.rotateElement(); }
        if (C.safeRune) this.tickSafeRune(C.safeRune, G, dt);
        G.mirrorT -= dt;
        if (C.mirror && G.mirrorT <= 0 && b.state !== "tele" && b.phase >= 1) { G.mirrorT = C.mirror; this.castMirror(); }
        break;
    }
  }

  tickSafeRune(C, G, dt) {
    const b = this.boss;
    G.runeT = (G.runeT ?? C.every * .8) - dt;
    if (this.runes.length) {
      G.warn -= dt;
      if (G.warn <= 0) {
        const hit = [];
        for (const p of this.players) {
          if (p.down) continue;
          if (this.runes.some((r) => hypot(p.x - r.x, p.z - r.z) < r.r)) continue;
          hit.push(p);
        }
        this.fxAt(C.fx, b.x, b.z, { pal: b.def.pal, hover: 60, rate: 3 });
        this.ev({ e: "flash", v: 1 });
        this.ev({ e: "shake", v: 12 });
        this.ev({ e: "sfx", s: "boom" });
        for (const p of hit) { this.hurtPlayer(p, this.bossAtk() * C.lethal); this.ev({ e: "num", x: p.x, z: p.z, h: 60, text: "時の裁き", kind: "bad" }); }
        if (hit.length === 0) { this.banner("全員が陣に逃れた!", "good"); b.stagger = 3; b.vuln = 5; }
        this.ev({ e: "note", floor: this.floor, text: "光る陣の中にいれば全体攻撃を耐えられ、ボスが隙を見せる" });
        this.runes = [];
      }
    } else if (G.runeT <= 0) {
      G.runeT = C.every;
      G.warn = C.warn * teleScale(this.floor);
      for (let i = 0; i < C.runes; i++) { const a = this.rng() * 6.28, r = 90 + this.rng() * 130; this.runes.push({ id: this.uid++, x: Math.cos(a) * r, z: Math.sin(a) * r, r: C.r }); }
      this.ev({ e: "bossmove", name: "全体攻撃の詠唱" });
      this.banner("空気が凍りつく…", "bad");
      this.ev({ e: "sfx", s: "boss-cast" });
    }
  }

  rotateElement(init) {
    const G = this.gim, C = G.cfg;
    G.ringI = (G.ringI + 1) % C.ring.length;
    const el = C.ring[Math.floor(this.rng() * C.ring.length)];
    this.boss.element = el;
    this.ev({ e: "element", el });
    if (!init) this.banner("王の纏う力が変わった", "info");
  }
  rotateMirrorWeak() {
    const ring = ["fire", "ice", "thunder", "water", "holy", "shadow", "nature", "arcane"];
    const G = this.gim;
    G.weak = ring[Math.floor(this.rng() * ring.length)];
    G.weakT = G.cfg.rotate || 18;
    this.ev({ e: "element", el: G.weak, weakOnly: 1 });
  }

  castMirror() {
    const b = this.boss, G = this.gim;
    const id = G.mirrorQueue[0];
    if (!id) return;
    G.mirrorQueue.push(G.mirrorQueue.shift());
    const s = SKILLS[id];
    const tgt = this.randPlayer();
    if (!tgt) return;
    this.banner(`魔導王が「${s.name}」を真似た!`, "bad");
    this.ev({ e: "note", floor: this.floor, text: "魔導王は使った魔法を真似て返す" });
    const pow = 1.1;
    const m = s.kind === "bolt"
      ? { k: "fan", fx: s.fx, pow, n: 5, spread: .9, speed: Math.min(s.speed || 200, 320), r: s.r || 10, dir: !!s.dir, hover: !!s.hover, tele: 0 }
      : s.kind === "nova"
      ? { k: "nova", fx: s.fx, pow, r: s.r * 1.3, tele: 1 }
      : s.kind === "cone" || s.kind === "line" || s.kind === "linez"
      ? { k: "line", fx: s.fx, pow, len: 300, wid: 30, tele: .9 }
      : { k: "spots", fx: s.fx, pow, n: 3, r: Math.max(40, s.r || 50), tele: .95, target: "players", spread: 40, rate: s.rate };
    this.execMove(m, tgt);
  }

  onBossHit(ctx, el, s) {
    const b = this.boss, G = this.gim;
    if (!G) return;
    const C = G.cfg;
    if (G.kind === "ward" && b.ward && C.by.includes(el)) {
      b.ward.hits--;
      this.ev({ e: "num", x: b.x, z: b.z, h: 90, text: "ヒビ!", kind: "weak" });
      if (b.ward.hits <= 0) this.breakWard();
    }
    if (G.kind === "overheat" && b.vent > 0 && C.by.includes(el)) {
      b.vent = 0; b.stagger = C.stagger; b.vuln = C.stagger + 2; G.timer = C.every;
      this.banner("急冷!体勢が崩れた!", "good");
      this.ev({ e: "note", floor: this.floor, text: "赤熱中に水か氷を当てると大きく怯む" });
      this.fxAt("water/splash", b.x, b.z, { hover: 20 });
      this.ev({ e: "shake", v: 8 });
      this.cancelBossMove();
    }
    if (G.kind === "stealth" && b.stealth > 0 && C.by.includes(el)) {
      b.stealth = 0; G.timer = C.every; b.vuln = 3;
      this.banner("光が影を暴いた!", "good");
      this.ev({ e: "note", floor: this.floor, text: "影に溶けている間は聖か火で暴ける" });
      this.ev({ e: "gimmick", kind: "reveal" });
    }
    if (G.kind === "reflect" && b.reflect > 0) this.ev({ e: "note", floor: this.floor, text: "呪い人形: 笑っている間の攻撃は跳ね返される" });
    if (G.kind === "air" && b.air > 0 && el === "water") { b.air = 0; b.stagger = 3; b.vuln = 4; this.banner("翼が濡れて墜落した!", "good"); this.ev({ e: "note", floor: this.floor, text: "雷雲鴉: 飛行中に水を当てると墜ちる" }); }
  }
  breakWard() {
    const b = this.boss, C = this.gim.cfg;
    b.ward = null; b.stagger = C.stagger; b.vuln = C.stagger + 2;
    this.gim.timer = C.every;
    this.banner("障壁を砕いた!", "good");
    this.ev({ e: "note", floor: this.floor, text: "障壁は特定の属性で砕ける" });
    this.fxAt("ice/ice-shatter", b.x, b.z, { hover: 10, pal: b.def.pal });
    this.ev({ e: "shake", v: 10 });
    this.ev({ e: "sfx", s: "boom" });
    this.cancelBossMove();
  }
  crystalBroken(c) {
    this.fxAt("ice/ice-shatter", c.x, c.z, { pal: this.boss.def.pal, rate: 1.5 });
    this.ev({ e: "sfx", s: "boom" });
    if (c.kind === "core" && !this.crystals.some((k) => !k.dead)) {
      this.boss.stagger = 3; this.boss.vuln = 5;
      this.banner("核をすべて砕いた!", "good");
      this.ev({ e: "note", floor: this.floor, text: "深淵の核を壊すまでボスはほぼ無傷" });
    }
    if (c.kind === "bloom") this.ev({ e: "note", floor: this.floor, text: "千年樹霊: 命の花は枯らされる前に壊す" });
  }

  // ───────── 通信・描画用スナップショット ─────────
  snapshot() {
    const b = this.boss;
    const events = this.events;
    this.events = [];
    return {
      t: Math.round(this.t * 100) / 100, floor: this.floor,
      b: { x: rnd2(b.x), z: rnd2(b.z), hp: Math.round(b.hp), m: Math.round(b.maxHp), id: b.id, f: b.facing, c: b.cast, st: b.state, hit: b.hit > 0 ? 1 : 0, dead: b.dead ? 1 : 0,
        air: b.air > 0 ? 1 : 0, st2: b.stealth > 0 ? 1 : 0, ward: b.ward ? [b.ward.hits, b.ward.max] : 0, rf: b.reflect > 0 ? 1 : 0, vent: b.vent > 0 ? 1 : 0, stag: b.stagger > 0 || b.stop > 0 ? 1 : 0, stop: b.stop > 0 ? 1 : 0, vuln: b.vuln > 0 ? 1 : 0, wet: b.wet > 0 ? 1 : 0, au: b.aura?.el || 0, el: b.element || this.gim?.weak || null, weak: !!this.gim?.weak, ph: b.phase, enr: b.enraged,
        bf: Object.keys(b.buffs), db: Object.keys(b.debuffs), ss: Object.keys(b.statuses), mv: b.state === "tele" ? (b.move?.name || "") : "" },
      p: this.players.map((p) => ({ id: p.id, n: p.name, col: p.color, x: rnd2(p.x), z: rnd2(p.z), hp: Math.round(p.hp), m: Math.round(p.maxHp), bar: Math.round(p.barrier), f: p.facing, d: p.dir, mv: p.moving ? 1 : 0, dn: p.down ? 1 : 0, dg: p.dashT > 0 ? 1 : 0, dcd: Math.round(p.dashCd * 10) / 10, tg: p.target, ult: p.ult, uc: Math.round(p.ultCharge * 10) / 10, syn: p.syn, fl: p.flash > 0 ? 1 : 0, inv: p.inv > 0 ? 1 : 0, cast: p.casting > 0 ? rnd2(1 - p.casting / p.castMax) : 0, ch: p.channel ? 1 : 0, sil: p.silence > 0 ? 1 : 0,
        ss: Object.keys(p.statuses), bf: Object.keys(p.buffs), sk: p.skills.map((s) => { const sp = specOf(s.id, s.rank); return [s.id, s.rank, Math.round(s.cd * 10) / 10, Math.round(sp.cd * 10) / 10, this.inRange(p, sp) ? 1 : 0]; }), ax: rnd2(p.aimX), az: rnd2(p.aimZ), dealt: Math.round(p.dealt) })),
      pr: this.projectiles.map((q) => [q.id, rnd2(q.x), rnd2(q.z), q.fx, q.side, q.dir ? 1 : 0, q.hover ? 1 : 0, rnd2(Math.atan2(q.vz, q.vx) * 10) / 10, q.pal || 0, q.r]),
      z: this.zones.map((z) => [z.id, rnd2(z.x), rnd2(z.z), z.fx, z.side, Math.round(z.r), z.pal || 0, z.hoverFx ? 1 : 0, rnd2(z.life), z.rate || 1, z.max]),
      hz: this.hazards.filter((h) => h.shape && !h.firing).map((h) => [h.id, h.shape, rnd2(h.x), rnd2(h.z), Math.round(h.r || 0), Math.round(h.r2 || 0), rnd2((h.ang || 0) * 10) / 10, Math.round(h.len || 0), rnd2((h.wid || 0) * 10) / 10, Math.max(0, rnd2(h.t * 10) / 10), rnd2(h.tele), h.safe ? 1 : 0]),
      sm: this.summons.map((m) => [m.id, rnd2(m.x), rnd2(m.z), m.type, m.t > m.born ? 1 : 0]),
      cr: this.crystals.filter((c) => !c.dead).map((c) => [c.id, rnd2(c.x), rnd2(c.z), Math.round(c.hp), Math.round(c.maxHp), c.kind, c.hit > 0 ? 1 : 0]),
      ru: this.runes.map((r) => [r.id, rnd2(r.x), rnd2(r.z), r.r]),
      ev: events,
    };
  }
}

const OPPOSITE = { fire: "water", water: "thunder", ice: "fire", thunder: "nature", nature: "fire", holy: "shadow", shadow: "holy", arcane: "shadow" };
const DIRECTIONAL = new Set(["fire/fire-breath", "fire/flamethrower", "ice/frost-breath", "water/water-jet", "arcane/arcane-beam", "lightning/chain-lightning", "shadow/life-steal", "shadow/soul-drain", "ice/ice-spikes", "nature/vine-whip", "arcane/arcane-missiles", "projectiles/magic-missile"]);
