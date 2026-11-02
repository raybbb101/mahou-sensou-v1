// セッション: ロビー → 魔法選択 → ボス戦 → 報酬 → … の進行。ソロでもマルチでも同じコードを使う。
import { SKILL_IDS, SKILLS, MAX_RANK, MAX_SKILLS, STAT_KEYS, isAttack } from "./skills.js";
import { spReward, FLOORS } from "./bosses.js";
import { Battle, makeRng } from "./battle.js";
import { ULT_IDS, ULTS } from "./ults.js";
import { SYN } from "./synergies.js";

export const COLORS = ["#d8486a", "#3f8cff", "#45b86a", "#e8a218"];
export const MAX_PLAYERS = 4;

export class Session {
  constructor(seed = Date.now() & 0xffffff) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.players = [];
    this.phase = "lobby";
    this.floor = 1;
    this.battle = null;
    this.wipes = 0;
    this.notes = {};      // { floor: [発見したギミック…] }
    this.attempts = {};   // { floor: 挑戦回数 }
    this.lastResult = null;
    this.discovered = [];  // 見つけた隠し効果(死んでも残る)
    this.reactions = [];   // 起こした元素反応・コンボの名前
    this.runs = 0;         // 死んだ回数
    this.best = 0;         // 最高到達層
    this.dirty = true;
  }

  addPlayer(id, name) {
    if (this.players.length >= MAX_PLAYERS) return null;
    const p = { id, name: name || `魔法使い${this.players.length + 1}`, color: COLORS[this.nextColor()], skills: [], stats: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])), sp: 0, spent: 0, offer: [], picked: [], ready: false, needDiscard: 0, ult: null, ultOffer: [], ultCharge: 0, prevTaken: null };
    this.players.push(p);
    this.dirty = true;
    return p;
  }
  nextColor() { for (let i = 0; i < COLORS.length; i++) if (!this.players.some((p) => p.color === COLORS[i])) return i; return 0; }
  removePlayer(id) {
    const i = this.players.findIndex((p) => p.id === id);
    if (i < 0) return;
    this.players.splice(i, 1);
    this.dirty = true;
    if (this.battle) { const j = this.battle.players.find((p) => p.id === id); if (j) { j.down = true; j.hp = 0; } }
    this.maybeAdvance();
  }

  start() {
    if (this.phase !== "lobby" || !this.players.length) return;
    this.floor = 1;
    this.beginPick();
  }

  // ───── 魔法選択 ─────
  beginPick() {
    this.phase = "pick";
    for (const p of this.players) {
      p.ready = false; p.picked = [];
      p.offer = this.rollOffer(p);
      if (!p.ult) p.ultOffer = this.rollUlts();
    }
    this.dirty = true;
  }
  rollOffer(p) {
    const pool = SKILL_IDS.filter((id) => (p.skills.find((s) => s.id === id)?.rank || 0) < MAX_RANK);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const out = pool.slice(0, 10);
    // 1 階では攻撃魔法を最低 4 つ保証する(攻撃手段なしで詰まないように)
    const need = this.floor === 1 ? 4 : p.skills.some((s) => isAttack(s.id)) ? 0 : 3;
    let have = out.filter(isAttack).length;
    for (let i = 10; have < need && i < pool.length; i++) {
      if (!isAttack(pool[i])) continue;
      const k = out.findIndex((x) => !isAttack(x));
      if (k < 0) break;
      out[k] = pool[i]; have++;
    }
    return out;
  }
  rollUlts() {
    const l = [...ULT_IDS];
    for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
    return l.slice(0, 10);
  }
  chooseUlt(p, id) {
    if (this.phase !== "pick" || p.ult || !p.ultOffer.includes(id)) return;
    p.ult = id;
    p.ultCharge = 0;
  }
  action(pid, a) {
    const p = this.players.find((q) => q.id === pid);
    if (!p) return;
    this.dirty = true;
    switch (a.type) {
      case "start": this.start(); break;
      case "chooseUlt": this.chooseUlt(p, a.id); break;
      case "togglePick": this.togglePick(p, a.id); break;
      case "confirmPick": this.confirmPick(p); break;
      case "discard": this.discard(p, a.slot); break;
      case "rank": this.rankUp(p, a.slot); break;
      case "stat": this.statUp(p, a.key, a.n || 1); break;
      case "swap": this.swap(p, a.a, a.b); break;
      case "ready": this.setReady(p); break;
      case "restart": this.restart(); break;
    }
    this.maybeAdvance();
  }
  togglePick(p, id) {
    if (this.phase !== "pick" || p.ready || p.confirmed || !p.offer.includes(id)) return;
    const i = p.picked.indexOf(id);
    if (i >= 0) p.picked.splice(i, 1);
    else if (p.picked.length < 2) p.picked.push(id);
  }
  confirmPick(p) {
    if (this.phase !== "pick" || p.confirmed || p.picked.length !== 2 || !p.ult) return;
    for (const id of p.picked) {
      const own = p.skills.find((s) => s.id === id);
      if (own) { own.rank = Math.min(MAX_RANK, own.rank + 1); own.free = (own.free || 0) + 1; }
      else p.skills.push({ id, rank: 1, free: 0 });
    }
    p.confirmed = true;
    p.needDiscard = Math.max(0, p.skills.length - MAX_SKILLS);
    if (!p.needDiscard) this.tryReadyPick(p);
  }
  tryReadyPick(p) {
    if (!p.skills.some((s) => isAttack(s.id))) return; // UI 側で警告
    p.ready = true;
  }
  discard(p, slot) {
    const canReward = this.phase === "reward" && this.floor >= 2;
    const forced = this.phase === "pick" && p.needDiscard > 0;
    if (!(canReward || forced)) return;
    const s = p.skills[slot];
    if (!s) return;
    // 手放したスキルの SP は戻らない
    p.spent -= s.spent || 0;
    p.skills.splice(slot, 1);
    if (forced) {
      p.needDiscard = Math.max(0, p.skills.length - MAX_SKILLS);
      if (!p.needDiscard) this.tryReadyPick(p);
    }
  }
  rankUp(p, slot) {
    if (this.phase !== "reward" || p.sp < 1) return;
    const s = p.skills[slot];
    if (!s || s.rank >= MAX_RANK) return;
    s.rank++; p.sp--; p.spent++;
    s.spent = (s.spent || 0) + 1;
  }
  statUp(p, key, n) {
    if (this.phase !== "reward" || !STAT_KEYS.includes(key)) return;
    n = Math.min(n, p.sp);
    if (n <= 0) return;
    p.stats[key] += n; p.sp -= n; p.spent += n;
  }
  swap(p, a, b) {
    if (this.phase === "battle") return;
    if (!p.skills[a] || !p.skills[b]) return;
    [p.skills[a], p.skills[b]] = [p.skills[b], p.skills[a]];
  }
  setReady(p) {
    if (this.phase === "defeat") p.ready = true;
    else if (this.phase === "reward") {
      if (!p.skills.some((s) => isAttack(s.id))) return;
      p.ready = true;
    }
  }
  restart() {
    for (const p of this.players) Object.assign(p, { skills: [], stats: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])), sp: 0, spent: 0, offer: [], picked: [], ready: false, confirmed: false, needDiscard: 0, ult: null, ultCharge: 0, prevTaken: null });
    this.floor = 1; this.battle = null; this.wipes = 0; this.lastResult = null;
    this.beginPick();
  }

  maybeAdvance() {
    if (!this.players.length) return;
    if (this.phase === "pick" && this.players.every((p) => p.ready)) this.beginBattle();
    else if (this.phase === "reward" && this.players.every((p) => p.ready)) {
      this.floor++;
      for (const p of this.players) p.confirmed = false;
      this.beginPick();
    } else if (this.phase === "defeat" && this.players.every((p) => p.ready)) this.restart();
  }

  // ───── 戦闘 ─────
  beginBattle() {
    this.phase = "battle";
    this.attempts[this.floor] = (this.attempts[this.floor] || 0) + 1;
    for (const p of this.players) { p.ready = false; p.confirmed = false; }
    this.battle = new Battle(this.players, this.floor, Math.floor(this.rng() * 1e9));
    // 目覚めた隠し効果を知らせる。条件はここで初めて分かる
    for (const bp of this.battle.players) for (const id of bp.syn) {
      this.battle.ev({ e: "synergy", id: bp.id, name: SYN[id].name, desc: SYN[id].desc, bad: SYN[id].fx.bad ? 1 : 0 });
      if (!this.discovered.includes(id)) this.discovered.push(id);
    }
    this.dirty = true;
  }
  input(pid, inp) { this.battle?.input(pid, inp); }
  /** 1 tick 進める。戦闘の決着がついたら次のフェーズへ。 */
  step() {
    if (this.phase !== "battle" || !this.battle) return null;
    this.battle.step();
    const b = this.battle;
    for (const e of b.events) {
      if (e.e === "note") this.addNote(e.floor, e.text);
      if (e.e === "react" && !this.reactions.includes(e.name)) { this.reactions.push(e.name); this.dirty = true; }
    }
    if (b.over) this.endBattle(b.over);
    return b;
  }
  addNote(f, text) {
    const list = (this.notes[f] ||= []);
    if (!list.includes(text)) { list.push(text); this.dirty = true; }
  }
  endBattle(res) {
    const b = this.battle;
    this.lastResult = { res, floor: this.floor, time: Math.round(b.t), dealt: b.players.map((p) => [p.name, Math.round(p.dealt), p.deaths]), bossLeft: Math.round(b.boss.hp / b.boss.maxHp * 100) };
    // 必殺技ゲージと被ダメージを持ち越す
    for (const bp of b.players) { const sp = this.players.find((q) => q.id === bp.id); if (sp) { sp.ultCharge = bp.ultCharge; sp.prevTaken = bp.taken; sp.lastSyn = bp.syn; } }
    this.best = Math.max(this.best, this.floor);
    this.battle = null;
    if (res === "win") {
      this.wipes = 0;
      if (this.floor >= FLOORS) { this.phase = "victory"; }
      else {
        const sp = spReward(this.floor);
        for (const p of this.players) { p.sp += sp; p.ready = false; }
        this.lastResult.sp = sp;
        this.phase = "reward";
      }
    } else {
      // 全滅: 第 1 層からやり直し
      this.runs++;
      for (const p of this.players) p.ready = false;
      this.phase = "defeat";
    }
    this.dirty = true;
  }

  /** クライアントへ送る進行状態(戦闘スナップショットとは別)。 */
  publicState() {
    return {
      phase: this.phase, floor: this.floor, wipes: this.wipes, attempts: this.attempts, notes: this.notes, result: this.lastResult, discovered: this.discovered, reactions: this.reactions, runs: this.runs, best: this.best,
      players: this.players.map((p) => ({ id: p.id, name: p.name, color: p.color, skills: p.skills.map((s) => ({ id: s.id, rank: s.rank, spent: s.spent || 0 })), stats: p.stats, sp: p.sp, spent: p.spent, offer: p.offer, picked: p.picked, ready: p.ready, confirmed: !!p.confirmed, needDiscard: p.needDiscard, ult: p.ult, ultOffer: p.ultOffer, ultCharge: p.ultCharge, lastSyn: p.lastSyn || [] })),
    };
  }

  // ───── 保存(ソロ)─────
  save() { return JSON.stringify({ v: 2, floor: this.floor, phase: this.phase, notes: this.notes, attempts: this.attempts, runs: this.runs, best: this.best, discovered: this.discovered, reactions: this.reactions, seed: this.rng.state(), result: this.lastResult, players: this.players.map((p) => ({ ...p })) }); }
  static load(json) {
    const d = JSON.parse(json);
    const S = new Session(d.seed);
    if (d.v !== 2) throw new Error("old save");
    Object.assign(S, { floor: d.floor, phase: d.phase, notes: d.notes || {}, attempts: d.attempts || {}, runs: d.runs || 0, best: d.best || 0, discovered: d.discovered || [], reactions: d.reactions || [], lastResult: d.result || null, players: d.players });
    return S;
  }
}
