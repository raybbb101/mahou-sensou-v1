// 魔法戦争 エントリーポイント。ソロはブラウザ内の Session を直接回し、マルチはサーバーの Session に接続する。
import { Session, MAX_PLAYERS } from "./sim/session.js";
import { TICK } from "./sim/battle.js";
import { BOSSES } from "./sim/bosses.js";
import { View } from "./render/view.js";
import { UI } from "./ui/ui.js";
import { ULTS } from "./sim/ults.js";
import { P2PHost, P2PClient } from "./net/p2p.js";

const SAVE_KEY = "mw-save-v2";
const HOLD_MS = 450;
const storage = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };

class Game {
  constructor() {
    this.view = new View(document.getElementById("game"), document.getElementById("overlay"));
    this.ui = new UI(this);
    this.selfId = null;
    this.mode = "title";        // title | solo | net
    this.session = null;
    this.ws = null;
    this.state = null;
    this.keys = new Set();
    this.paused = false;
    this.acc = 0;
    this.lastPhase = null;
    this.lastInput = "";
    this.wire();
    this.view.resize();
    this.view.setFloor(20, false);
    this.ui.title();
    this.titleFxT = 0;
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
    // タブが裏に回ると描画は止まるが、部屋を作った人の戦闘は止めない
    setInterval(() => { if (this.mode === "host" && document.hidden && this.phase() === "battle") this.simulate(); }, 200);
  }

  wire() {
    addEventListener("resize", () => this.view.resize());
    const stage = document.getElementById("stage");
    addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      this.keys.add(e.code);
      const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
      if (m && !e.repeat) { const d = +m[1]; this.castSlot(d === 0 ? 9 : d - 1); }
      if (e.code === "Escape" && this.mode === "solo" && this.phase() === "battle") this.setPaused(!this.paused);
      if (e.code === "KeyM") this.view.sfx.muted = !this.view.sfx.muted;
      if (e.code === "Space" && !e.repeat && this.phase() === "battle" && !this.paused) {
        // 押した瞬間に回避。押し続けると必殺技
        this.spaceAt = performance.now(); this.ultSent = false;
        this.view.sfx.unlock();
        this.sendInput({ dash: true });
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) e.preventDefault();
    });
    addEventListener("keyup", (e) => { this.keys.delete(e.code); if (e.code === "Space") this.spaceAt = 0; });
    addEventListener("blur", () => { this.keys.clear(); this.spaceAt = 0; });
    addEventListener("pointerdown", () => this.view.sfx.unlock());
    this.view.on("banner", (e) => this.ui.banner(e));
    this.view.on("toast", (e) => this.ui.toast(e));
    this.view.on("bossmove", (n) => this.ui.bossMove(n));
    this.view.on("ult", (id) => this.ui.showUlt(id));
    this.view.on("synergy", (e) => this.ui.showSynergy(e));
    const vig = document.getElementById("vignette");
    this.view.on("hurtv", (v) => { vig.style.opacity = v > 0 ? Math.min(1, v) : (this.lowHp ? .35 + Math.sin(performance.now() / 200) * .15 : 0); });
  }

  phase() { return this.state?.phase; }
  canNet() { return location.protocol.startsWith("http") && !window.__MW_NO_NET && (!!window.Peer || !location.hostname.endsWith("github.io")); }
  /** 自分のブラウザで戦闘を計算しているか(ソロ、または部屋を作った人)。 */
  isLocal() { return this.mode === "solo" || this.mode === "host"; }
  hasSave() { return !!storage.get(SAVE_KEY); }

  // ── ソロ ──
  startSolo() {
    this.mode = "solo";
    // 見つけた隠し効果と記録は新しい挑戦にも引き継ぐ
    let old = null;
    try { old = JSON.parse(storage.get(SAVE_KEY)); } catch {}
    this.session = new Session();
    if (old?.v === 2) Object.assign(this.session, { discovered: old.discovered || [], reactions: old.reactions || [], notes: old.notes || {}, runs: old.runs || 0, best: old.best || 0 });
    this.selfId = "solo";
    this.session.addPlayer("solo", "あなた");
    this.session.start();
    this.afterAction();
  }
  continueSolo() {
    try { this.session = Session.load(storage.get(SAVE_KEY)); } catch { storage.del(SAVE_KEY); return this.startSolo(); }
    this.mode = "solo";
    this.selfId = "solo";
    this.session.dirty = true;
    this.afterAction();
  }
  // ── マルチ ──
  net(msg) {
    if (window.Peer) return msg.t === "create" ? this.hostRoom(msg.name) : this.joinRoom(msg.code, msg.name);
    // PeerJS が使えないときは、同じネットワークの node server.mjs へつなぐ
    const send = () => this.link.send(msg);
    if (this.link?.ws?.readyState === 1) return send();
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}`);
    this.link = { ws, send: (o) => ws.readyState === 1 && ws.send(JSON.stringify(o)), close: () => ws.close() };
    ws.onopen = send;
    ws.onerror = () => this.ui.multiMenu("サーバーに接続できません。node server.mjs で起動していますか?");
    ws.onclose = () => this.linkLost();
    ws.onmessage = (ev) => this.onRemote(JSON.parse(ev.data));
  }
  /** 仲間側: 部屋からの通知を処理する。 */
  onRemote(m) {
    if (m.t === "error") { this.link?.close(); this.link = null; this.ui.multiMenu(m.msg); }
    if (m.t === "joined") { this.mode = "net"; this.selfId = m.id; this.code = m.code; }
    if (m.t === "state") { this.code = m.code; this.applyState(m.s); }
    if (m.t === "snap") { this.view.selfId = this.selfId; this.view.apply(m.s, TICK * 2); this.lastSnap = m.s; }
  }
  linkLost(text = "部屋との接続が切れました。") {
    if (this.mode !== "net") return;
    this.toTitle();
    this.ui.multiMenu(text);
  }
  joinRoom(code, name) {
    this.ui.multiMenu("部屋を探しています…");
    const c = new P2PClient(code, {
      open: () => c.send({ t: "join", name }),
      message: (m) => this.onRemote(m),
      close: () => this.linkLost("部屋を作った人との接続が切れました。"),
      error: (text) => this.ui.multiMenu(text),
    });
    this.link = c;
  }
  // 部屋を作った人: 自分のブラウザで Session を動かし、仲間に結果を配る
  hostRoom(name) {
    this.ui.multiMenu("部屋を作っています…");
    const ids = new Map();
    let next = 2;
    const h = new P2PHost({
      ready: (code) => {
        this.mode = "host"; this.code = code; this.selfId = "p1";
        this.session = new Session();
        this.session.addPlayer("p1", name || undefined);
        this.pendingEv = []; this.tickN = 0;
        this.afterAction();
      },
      error: (text) => this.ui.multiMenu(text),
      message: (conn, m) => {
        const S = this.session;
        if (!S) return;
        if (m.t === "join") {
          if (ids.has(conn)) return;
          if (S.phase !== "lobby") return h.send(conn, { t: "error", msg: "この部屋はすでに冒険を始めています。" });
          if (S.players.length >= MAX_PLAYERS) return h.send(conn, { t: "error", msg: "この部屋は満員です。" });
          const id = "p" + next++;
          S.addPlayer(id, String(m.name || "").slice(0, 10) || undefined);
          ids.set(conn, id);
          h.send(conn, { t: "joined", id, code: this.code });
          this.afterAction();
          return;
        }
        const id = ids.get(conn);
        if (!id) return;
        if (m.t === "act") { S.action(id, m.a); this.afterAction(); }
        if (m.t === "input") S.input(id, m.i);
      },
      leave: (conn) => {
        const id = ids.get(conn);
        if (!id || !this.session) return;
        ids.delete(conn);
        this.session.removePlayer(id);
        this.afterAction();
      },
    });
    this.link = h;
  }

  action(a) {
    if (this.isLocal()) { this.session.action(this.selfId, a); this.afterAction(); }
    else if (this.mode === "net") this.link.send({ t: "act", a });
  }
  afterAction() {
    if (this.isLocal() && this.session.dirty) {
      this.session.dirty = false;
      const st = this.session.publicState();
      this.applyState(st);
      if (this.mode === "host") this.link.broadcast({ t: "state", s: st, code: this.code });
      if (this.mode === "solo" && ["pick", "reward", "defeat", "victory"].includes(this.session.phase)) storage.set(SAVE_KEY, this.session.save());
    }
  }
  applyState(st) {
    const prev = this.lastPhase;
    this.state = st;
    this.lastPhase = st.phase;
    const v = this.view;
    if (st.phase === "battle") {
      if (prev !== "battle") {
        v.floorNo = 0;
        v.selfId = this.selfId;
        v.setFloor(st.floor, true);
        this.ui.clear();
        this.ui.buildHud();
        this.ui.showIntro(st.floor, BOSSES[st.floor - 1]);
        document.getElementById("stage").classList.add("play");
      }
      return;
    }
    document.getElementById("stage").classList.remove("play");
    this.ui.hideHud();
    if (prev === "battle" && st.phase !== "battle") { v.sfx.play(st.phase === "defeat" ? "down" : "win"); }
    if (st.floor && st.phase !== "lobby") { v.floorNo === st.floor || v.setFloor(st.floor, false); v.clearAll(); }
    if (st.phase === "lobby") this.ui.lobby(st, this.code);
    else if (st.phase === "pick") this.ui.pick(st);
    else if (st.phase === "reward") this.ui.prep(st);
    else if (st.phase === "defeat") this.ui.defeat(st);
    else if (st.phase === "victory") this.ui.victory(st);
  }
  toTitle() {
    const L = this.link;
    this.link = null;
    this.mode = "title";
    L?.close(); this.session = null; this.state = null; this.lastPhase = null; this.paused = false;
    this.ui.rendered = "";
    this.ui.hideHud();
    document.getElementById("stage").classList.remove("play");
    this.view.floorNo = 0; this.view.setFloor(20, false);
    this.ui.title();
  }
  setPaused(p) {
    this.paused = p;
    if (p) this.ui.pause(); else this.ui.clear();
  }
  giveUp() {
    this.paused = false;
    this.ui.clear();
    if (this.session?.battle) { this.session.battle.over = "lose"; this.session.endBattle("lose"); this.session.dirty = true; this.afterAction(); }
  }
  castSlot(i) {
    if (this.phase() !== "battle" || this.paused) return;
    this.view.sfx.unlock();
    this.sendInput({ cast: i });
    const s = this.ui.slots?.[i];
    if (s) { s.classList.add("flash"); setTimeout(() => s.classList.remove("flash"), 90); }
  }
  sendInput(extra) {
    const K = this.keys;
    const mx = (K.has("KeyD") || K.has("ArrowRight") ? 1 : 0) - (K.has("KeyA") || K.has("ArrowLeft") ? 1 : 0);
    const mz = (K.has("KeyS") || K.has("ArrowDown") ? 1 : 0) - (K.has("KeyW") || K.has("ArrowUp") ? 1 : 0);
    const inp = { mx, mz, ...extra };
    if (this.isLocal()) this.session.input(this.selfId, inp);
    else if (this.mode === "net") {
      const key = JSON.stringify(inp);
      if (extra || key !== this.lastInput) { this.lastInput = key; this.link?.send({ t: "input", i: inp }); }
    }
  }

  /** 経過時間ぶん戦闘を進める。部屋を作った人の処理が遅れても、仲間の時間が止まらないようにする。 */
  simulate() {
    const now = performance.now();
    const cap = this.mode === "host" ? 1 : .05;
    this.acc += Math.min(cap, (now - (this.lastSim ?? now)) / 1000);
    this.lastSim = now;
    while (this.acc >= TICK && this.session?.battle) {
      this.acc -= TICK;
      const b = this.session.step();
      if (b) {
        const snap = b.snapshot();
        this.lastSnap = snap;
        this.view.selfId = this.selfId;
        this.view.apply(snap, TICK);
        if (this.mode === "host") {
          // 仲間には 2 tick に 1 回(15Hz)。その間のイベントもまとめて送る
          this.pendingEv.push(...snap.ev);
          if (++this.tickN % 2 === 0 || this.session.phase !== "battle") { this.link.broadcast({ t: "snap", s: { ...snap, ev: this.pendingEv } }); this.pendingEv = []; }
        }
      }
      this.afterAction();
    }
  }
  holdRatio() { return this.spaceAt && !this.ultSent ? Math.min(1, (performance.now() - this.spaceAt) / HOLD_MS) : 0; }
  loop(now) {
    const dt = Math.min(.05, (now - this.last) / 1000);
    this.last = now;
    const inBattle = this.phase() === "battle";
    if (inBattle && !this.paused) {
      this.sendInput();
      // スペース長押しで必殺技(満タンのときだけ受け付ける)
      if (this.spaceAt && !this.ultSent && now - this.spaceAt >= HOLD_MS) {
        const me = this.view.curr?.p.find((p) => p.id === this.selfId);
        const U = me?.ult && ULTS[me.ult];
        if (U && me.uc >= U.charge.need) { this.ultSent = true; this.sendInput({ ult: true }); }
      }
    }
    if (this.isLocal() && inBattle && !this.paused) this.simulate();
    else this.lastSim = performance.now();
    if (this.phase() === "battle" && this.view.curr) {
      this.ui.updateHud(this.view.curr);
      const me = this.view.curr.p.find((p) => p.id === this.selfId);
      this.lowHp = me && !me.dn && me.hp / me.m < .3;
    } else this.lowHp = false;
    if (this.paused) { /* 止まった画面を保つ */ this.view.render(0); }
    else {
      if (this.mode === "title") this.titleFx(dt);
      this.view.render(dt);
    }
    requestAnimationFrame((t) => this.loop(t));
  }
  titleFx(dt) {
    this.titleFxT -= dt;
    if (this.titleFxT > 0) return;
    this.titleFxT = 2.4;
    const list = ["fire/meteor", "lightning/lightning-strike", "holy/holy-pillar", "ice/frost-nova", "shadow/dark-explosion", "arcane/star-fall", "fire/flame-pillar", "nature/earth-spike"];
    const a = Math.random() * 6.28, r = 90 + Math.random() * 150;
    this.view.handle({ e: "fx", fx: list[Math.floor(Math.random() * list.length)], x: Math.cos(a) * r, z: Math.sin(a) * r + 60 });
  }
}

const start = () => { window.__game = new Game(); };
if (document.fonts?.ready) document.fonts.ready.then(start, start); else start();
