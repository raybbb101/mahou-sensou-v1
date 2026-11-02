// メニュー画面と HUD。DOM で組み立てる。
import { SKILLS, specOf, rankMilestones, ELEMENTS, STATS, STAT_KEYS, statValue, STATUS_INFO, MAX_RANK, MAX_SKILLS, isAttack } from "../sim/skills.js";
import { BOSSES, FLOORS } from "../sim/bosses.js";
import { iconUrl, fxIconUrl, playPreview } from "./icons.js";
import { ULTS, chargeLabel } from "../sim/ults.js";
import { SYN } from "../sim/synergies.js";
import { REACTIVE } from "../sim/reactions.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const BUFF_NAMES = { armor: "硬化", rage: "激昂", haste: "加速", regen: "再生", shield: "障壁" };
const DEBUFF_NAMES = { sundered: "防御低下", weakened: "攻撃低下", shocked: "感電" };
const PBUFF = { barrier: "障壁", invuln: "無敵", charged: "雷充填", blessed: "祝福", halo: "光輪", eclipse: "日蝕", haste: "加速", rage: "激昂" };

const elTag = (el) => `<span class="el" style="color:${ELEMENTS[el].color};border-color:${ELEMENTS[el].color}">${ELEMENTS[el].name}</span>`;

function statLine(id, rank, atk = 20) {
  const s = specOf(id, rank);
  const P = [];
  if (s.pow > 0) {
    const hits = s.ticks || s.multi || (s.repeat || 1);
    const per = Math.round(s.pow * (atk / 20));
    P.push(`威力${per}${hits > 1 ? `×${hits}` : s.kind === "zone" ? "/回" : ""}`);
  }
  P.push(`CD${s.cd.toFixed(1)}秒`);
  if (s.r && s.kind !== "bolt" && s.kind !== "blink") P.push(`範囲${Math.round(s.r)}`);
  else if (s.len) P.push(`射程${Math.round(s.len)}`);
  if (s.dur && s.kind === "zone") P.push(`${s.dur.toFixed(1)}秒`);
  if (s.count > 1) P.push(`${s.count}発`);
  if (s.status) P.push(`${STATUS_INFO[s.status[0]].name}${Math.round(s.status[2] * 100)}%`);
  return P.join(" ");
}
function nextLine(id, rank) {
  if (rank >= MAX_RANK) return "最大ランク";
  const a = specOf(id, rank), b = specOf(id, rank + 1), P = [];
  if (b.pow > 0) P.push(`威力${Math.round(a.pow)}→${Math.round(b.pow)}`);
  P.push(`CD${a.cd.toFixed(1)}→${b.cd.toFixed(1)}`);
  for (const [k, txt] of rankMilestones(id)) if (k === rank + 1) P.push(`★${txt}`);
  return P.join(" / ");
}
const nextMilestone = (id, rank) => rankMilestones(id).find(([k]) => k > rank);

export class UI {
  constructor(game) {
    this.game = game;
    this.root = $("#ui");
    this.hud = $("#hud");
    this.banners = $("#banners");
    this.rendered = "";
    this.hudBuilt = false;
    this.previewStop = null;
  }

  send(a) { this.game.action(a); this.game.view.sfx.unlock(); this.game.view.sfx.play("ui"); }
  me(st) { return st.players.find((p) => p.id === this.game.selfId); }

  // ─── タイトル ───
  title() {
    this.hud.classList.add("hidden");
    const save = this.game.hasSave();
    const canNet = this.game.canNet();
    this.root.innerHTML = `<div class="screen clear"><div class="title">
      <div class="logo">魔法戦争</div>
      <div class="sub">── 塔の二十層、魔法だけで頂へ ──</div>
      <div style="height:calc(5px * var(--k))"></div>
      <button class="btn big primary" data-go="solo">ひとりで挑む</button>
      ${save ? `<button class="btn big" data-go="cont">つづきから</button>` : ""}
      <button class="btn big" data-go="multi" ${canNet ? "" : "disabled"}>仲間と挑む${canNet ? "" : "(サーバー起動時のみ)"}</button>
      <div class="help" style="margin-top:calc(4px * var(--k));text-align:center">WASD 移動 / 1〜0 魔法(照準は自動) / スペース 回避・長押しで必殺技 / Esc 一時停止 / M 消音<br>倒れたら第1層へ戻される。命を大切に。</div>
    </div></div>`;
    this.root.onclick = (e) => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      this.game.view.sfx.unlock();
      const g = b.dataset.go;
      if (g === "solo") this.game.startSolo();
      if (g === "cont") this.game.continueSolo();
      if (g === "multi") this.multiMenu();
    };
  }
  multiMenu(err = "") {
    let name = "";
    try { name = localStorage.getItem("mw-name") || ""; } catch {}
    this.root.innerHTML = `<div class="screen clear"><div class="title">
      <div class="logo" style="font-size:calc(22px * var(--k))">仲間と挑む</div>
      <div class="row">名前 <input class="input" id="nm" maxlength="10" value="${esc(name)}" placeholder="魔法使い"></div>
      <div style="height:calc(3px * var(--k))"></div>
      <button class="btn big primary" data-go="create">部屋を作る</button>
      <div class="row">部屋番号 <input class="input" id="code" maxlength="4" inputmode="numeric" style="width:calc(50px * var(--k))"> <button class="btn" data-go="join">入る</button></div>
      <div class="err">${esc(err)}</div>
      <button class="btn" data-go="back">もどる</button>
      <div class="help" style="text-align:center">最大4人。全員が同じ塔を登り、ボスのHPは人数に応じて増える。<br>倒れた仲間は、誰かがボスに勝てば次の階で復活する。全滅すると第1層へ。</div>
    </div></div>`;
    this.root.onclick = (e) => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const nm = $("#nm").value.trim();
      try { localStorage.setItem("mw-name", nm); } catch {}
      if (b.dataset.go === "create") this.game.net({ t: "create", name: nm });
      if (b.dataset.go === "join") { const code = $("#code").value.trim(); if (code) this.game.net({ t: "join", code, name: nm }); }
      if (b.dataset.go === "back") this.title();
    };
  }
  lobby(st, code) {
    const self = this.game.selfId;
    this.setScreen("lobby" + JSON.stringify(st.players.map((p) => p.name)) + code, `<div class="screen clear"><div class="title">
      <div class="sub">部屋番号</div>
      <div class="code">${esc(code)}</div>
      <div class="players">${st.players.map((p) => `<div style="color:${p.color}">◆ ${esc(p.name)}${p.id === self ? "(あなた)" : ""}</div>`).join("")}</div>
      <button class="btn big primary" data-act="start">塔へ入る(${st.players.length}/4)</button>
      <div class="help" style="text-align:center">同じネットワークの仲間に、このページのアドレスと部屋番号を伝えてください。</div>
    </div></div>`);
    this.root.onclick = (e) => { if (e.target.closest('[data-act="start"]')) this.send({ type: "start" }); };
  }

  setScreen(key, html) {
    if (this.rendered === key) return false;
    this.rendered = key;
    if (this.previewStop) { this.previewStop(); this.previewStop = null; }
    const sc = this.root.querySelector(".panel")?.scrollTop;
    this.root.innerHTML = html;
    return true;
  }
  clear() { this.rendered = ""; this.root.innerHTML = ""; this.root.onclick = null; }

  // ─── 魔法選択 ───
  pick(st) {
    const me = this.me(st);
    if (!me) return;
    if (!me.ult) return this.pickUlt(st, me);
    const key = "pick" + JSON.stringify([st.floor, me.offer, me.picked, me.confirmed, me.ready, me.needDiscard, me.skills.length, st.players.map((p) => p.ready)]);
    const atk = statValue("atk", me.stats.atk);
    const needAttack = me.confirmed && !me.needDiscard && !me.ready && !me.skills.some((s) => isAttack(s.id));
    const noAttackWarn = me.picked.length === 2 && !me.skills.some((s) => isAttack(s.id)) && !me.picked.some(isAttack);
    const cards = me.offer.map((id) => {
      const s = SKILLS[id], own = me.skills.find((k) => k.id === id), sel = me.picked.includes(id);
      return `<div class="card ${sel ? "sel" : ""} ${own ? "own" : ""}" data-id="${id}">
        <div class="pic"><img src="${iconUrl(id)}" alt=""><canvas></canvas></div>
        <div class="nm" data-fx="${s.fx}">${elTag(s.elem)}${esc(s.name)}</div>
        <div class="ds">${own ? `<span style="color:var(--gold)">ランク${own.rank}→${own.rank + 1}に強化</span>　` : ""}${esc(s.desc)}</div>
        <div class="st">${REACTIVE.has(id) ? `<span style="color:#ff7ae0">◆反応</span> ` : ""}${statLine(id, own ? own.rank + 1 : 1, atk)}</div>
      </div>`;
    }).join("");
    const owned = Array.from({ length: MAX_SKILLS }, (_, i) => {
      const k = me.skills[i];
      return `<div class="slot ${k ? "" : "empty"}">${k ? `<img src="${iconUrl(k.id)}" alt=""><span class="rk">${k.rank}</span>` : ""}<span class="key">${KEYS[i]}</span></div>`;
    }).join("");
    const waiting = st.players.filter((p) => !p.ready).map((p) => p.name);
    const changed = this.setScreen(key, `<div class="screen">
      <div class="head"><h2><span class="floor">第${st.floor}層</span> 魔法を2つ選べ</h2><span class="r">${me.picked.length}/2 選択中${st.players.length > 1 ? " / 準備中: " + esc(waiting.join("、")) : ""}</span></div>
      <div class="cards">${cards}</div>
      <div class="foot">
        <div class="owned">${owned}</div>
        <span class="sp">${noAttackWarn ? `<span style="color:var(--red)">攻撃魔法が1つもありません!</span>` : `所持 ${me.skills.length}/${MAX_SKILLS}${st.floor > 1 ? ` / 未使用SP ${me.sp}` : ""}`}</span>
        ${me.ready ? `<span class="waiting">仲間を待っています…</span>` : `<button class="btn big primary" data-act="confirm" ${me.picked.length === 2 && !noAttackWarn && !me.confirmed ? "" : "disabled"}>ボス部屋へ</button>`}
      </div>
      ${me.needDiscard ? this.discardModal(me, atk) : ""}
    </div>`);
    if (!changed) return;
    this.root.onclick = (e) => {
      const d = e.target.closest("[data-discard]");
      if (d) return this.send({ type: "discard", slot: +d.dataset.discard });
      const card = e.target.closest(".card");
      if (card) return this.send({ type: "togglePick", id: card.dataset.id });
      if (e.target.closest('[data-act="confirm"]')) this.send({ type: "confirmPick" });
    };
    for (const card of this.root.querySelectorAll(".card")) {
      const cv = card.querySelector("canvas");
      let stop = null;
      card.onmouseenter = () => { card.querySelector("img").style.opacity = 0; stop = playPreview(cv, SKILLS[card.dataset.id].fx); };
      card.onmouseleave = () => { stop?.(); stop = null; card.querySelector("img").style.opacity = 1; };
    }
  }
  pickUlt(st, me) {
    const key = "ult" + JSON.stringify(me.ultOffer);
    const cards = me.ultOffer.map((id) => {
      const U = ULTS[id];
      return `<div class="card" data-ult="${id}">
        <div class="pic"><img src="${fxIconUrl(U.icon)}" alt=""><canvas></canvas></div>
        <div class="nm" style="color:${U.color}">${esc(U.name)}</div>
        <div class="ds">${esc(U.desc)}</div>
        <div class="chg">溜め方: ${esc(chargeLabel(U))}</div>
      </div>`;
    }).join("");
    const changed = this.setScreen(key, `<div class="screen">
      <div class="head"><h2>必殺技を1つ選べ</h2><span class="r">一度選ぶと、死ぬまで変えられない</span></div>
      <div class="cards">${cards}</div>
      <div class="foot"><span class="sp">溜まったらスペース長押しで発動。ゲージは階をまたいで持ち越す。</span></div>
    </div>`);
    if (!changed) return;
    this.root.onclick = (e) => { const c = e.target.closest("[data-ult]"); if (c) this.send({ type: "chooseUlt", id: c.dataset.ult }); };
    for (const card of this.root.querySelectorAll(".card")) {
      let stop = null; const cv = card.querySelector("canvas");
      card.onmouseenter = () => { card.querySelector("img").style.opacity = 0; stop = playPreview(cv, ULTS[card.dataset.ult].icon); };
      card.onmouseleave = () => { stop?.(); stop = null; card.querySelector("img").style.opacity = 1; };
    }
  }
  discardModal(me, atk) {
    return `<div class="modal"><div>
      <h3 style="color:var(--red);font-size:calc(9px * var(--k))">魔法があふれた! あと${me.needDiscard}個 捨ててください</h3>
      <div class="help" style="max-width:none;margin-bottom:calc(3px * var(--k))">魔法は最大${MAX_SKILLS}個まで。捨てた魔法に使ったSPは戻りません。</div>
      ${me.skills.map((k, i) => this.skillRow(k, i, atk, { discard: 1 })).join("")}
    </div></div>`;
  }
  skillRow(k, i, atk, o = {}) {
    const s = SKILLS[k.id];
    const ms = nextMilestone(k.id, k.rank);
    return `<div class="skrow">
      <div class="slot"><img src="${iconUrl(k.id)}" alt=""><span class="key">${KEYS[i]}</span></div>
      <div>
        <div class="ttl">${elTag(s.elem)}${esc(s.name)}<span class="rk">Rank ${k.rank}/${MAX_RANK}</span></div>
        <div class="inf">${statLine(k.id, k.rank, atk)}</div>
        ${o.discard ? "" : `<div class="inf nxt">次: ${nextLine(k.id, k.rank)}</div>${ms ? `<div class="inf">Rank${ms[0]}: ${esc(ms[1])}</div>` : ""}`}
      </div>
      <div class="btns">
        ${o.discard ? `<button class="btn mini" data-discard="${i}" style="border-color:var(--red)">捨てる</button>` : `
        <button class="btn mini" data-rank="${i}" ${o.sp < 1 || k.rank >= MAX_RANK ? "disabled" : ""}>強化 1SP</button>
        <div class="row">
          <button class="btn mini" data-swap="${i},${i - 1}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn mini" data-swap="${i},${i + 1}" ${i === o.count - 1 ? "disabled" : ""}>↓</button>
          ${o.canDiscard ? `<button class="btn mini" data-discard="${i}" style="color:var(--red)">捨</button>` : ""}
        </div>`}
      </div>
    </div>`;
  }

  // ─── 報酬 / 敗北 ───
  prep(st) {
    const me = this.me(st);
    if (!me) return;
    const R = st.result || {};
    const atk = statValue("atk", me.stats.atk);
    const key = "prep" + JSON.stringify([st.phase, st.floor, me.sp, me.stats, me.skills, me.ready, st.players.map((p) => p.ready), st.notes[st.floor]]);
    const statRows = STAT_KEYS.map((k) => {
      const S = STATS[k], cur = statValue(k, me.stats[k]), nx = statValue(k, me.stats[k] + 1);
      const fmt = (v) => (Math.round(v * 100) / 100) + S.unit;
      return `<div class="statrow"><span>${S.name}</span><b>${fmt(cur)}</b><span class="next">→${fmt(nx)}</span>
        <span class="row" style="gap:1px"><button class="btn mini" data-stat="${k}" ${me.sp < 1 ? "disabled" : ""}>+1</button><button class="btn mini" data-stat5="${k}" ${me.sp < 5 ? "disabled" : ""}>+5</button></span></div>`;
    }).join("");
    const canDiscard = st.floor >= 2;
    const list = me.skills.map((k, i) => this.skillRow(k, i, atk, { sp: me.sp, count: me.skills.length, canDiscard })).join("");
    const notes = st.notes[st.floor] || [];
    const boss = BOSSES[st.floor - 1];
    const others = st.players.filter((p) => !p.ready && p.id !== me.id).map((p) => p.name);
    const head = `<h2><span class="floor">第${st.floor}層</span> 突破!</h2><span class="res">${esc(boss.name)}を${R.time}秒で撃破 / <span style="color:var(--gold)">+${R.sp}SP</span></span>`;
    const changed = this.setScreen(key, `<div class="screen">
      <div class="head">${head}<span class="r spbox">残りSP ${me.sp}</span></div>
      <div class="prep">
        <div class="panel"><h3>ステータス(上限なし)</h3>${statRows}
          ${this.ultLine(me)}
          ${me.lastSyn.length ? `<div style="margin-top:calc(4px * var(--k))"><h3>目覚めている力</h3><ul class="notes" style="padding:0;margin:0">${me.lastSyn.map((id) => `<li>${esc(SYN[id].name)}</li>`).join("")}</ul></div>` : ""}
        </div>
        <div class="panel"><h3>魔法 ${me.skills.length}/${MAX_SKILLS}${canDiscard ? `<span style="color:var(--dim);margin-left:.6em;font-size:.8em">不要な魔法はここで捨てられます</span>` : ""}</h3>${list}</div>
      </div>
      <div class="foot">
        <span class="sp">${others.length ? "準備中: " + esc(others.join("、")) : ""}</span>
        <button class="btn" data-act="title">タイトルへ</button>
        ${me.ready ? `<span class="waiting">仲間を待っています…</span>` : `<button class="btn big primary" data-act="ready">OK — 次の階へ</button>`}
      </div>
    </div>`);
    if (!changed) return;
    this.root.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const D = t.dataset;
      if (D.stat) this.send({ type: "stat", key: D.stat, n: 1 });
      if (D.stat5) this.send({ type: "stat", key: D.stat5, n: 5 });
      if (D.rank !== undefined) this.send({ type: "rank", slot: +D.rank });
      if (D.discard !== undefined) this.send({ type: "discard", slot: +D.discard });
      if (D.swap) { const [a, b] = D.swap.split(",").map(Number); this.send({ type: "swap", a, b }); }
      if (D.act === "ready") this.send({ type: "ready" });
      if (D.act === "title") this.game.toTitle();
    };
  }
  ultLine(me) {
    if (!me.ult) return "";
    const U = ULTS[me.ult];
    return `<div style="margin-top:calc(4px * var(--k))"><h3 style="color:${U.color}">必殺技: ${esc(U.name)}</h3><div class="notes">${esc(U.desc)}<br>溜め方: ${esc(chargeLabel(U))}(現在 ${Math.floor(me.ultCharge)})</div></div>`;
  }
  defeat(st) {
    const me = this.me(st);
    if (!me) return;
    const R = st.result || {};
    const boss = BOSSES[st.floor - 1];
    const notes = st.notes[st.floor] || [];
    const key = "defeat" + JSON.stringify([st.floor, st.runs, me.ready, st.players.map((p) => p.ready)]);
    this.setScreen(key, `<div class="screen">
      <div class="head"><h2 style="color:var(--red)">力尽きた — 第${st.floor}層 ${esc(boss.name)}</h2><span class="res">残りHP ${R.bossLeft}% / ${R.time}秒 / 通算 ${st.runs}回の死 / 最高到達 第${st.best}層</span></div>
      <div class="deadbox">
        <div class="panel"><h3>${esc(boss.name)}について分かったこと</h3>${notes.length ? `<ul class="notes" style="padding:0;margin:0">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : `<div class="notes" style="color:var(--dim)">まだ何も分かっていない。次は観察しよう。</div>`}
          <div style="margin-top:calc(4px * var(--k))"><h3>今回の魔法</h3><div class="row" style="justify-content:flex-start;flex-wrap:wrap">${me.skills.map((k) => `<div class="slot"><img src="${iconUrl(k.id)}" alt=""><span class="rk">${k.rank}</span></div>`).join("")}</div></div>
        </div>
        <div class="panel"><h3>見つけた隠された力 ${st.discovered.length}種</h3>${st.discovered.length ? `<ul class="notes" style="padding:0;margin:0">${st.discovered.map((id) => `<li><span style="color:var(--gold)">${esc(SYN[id].name)}</span> ${esc(SYN[id].desc)}</li>`).join("")}</ul>` : `<div class="notes" style="color:var(--dim)">魔法の組み合わせや育て方によって、何かが目覚めるらしい…</div>`}
          <div style="margin-top:calc(4px * var(--k))"><h3>起こした元素反応・コンボ ${st.reactions.length}種</h3>${st.reactions.length ? `<div class="notes">${st.reactions.map(esc).join("、")}</div>` : `<div class="notes" style="color:var(--dim)">◆反応の印がある魔法を、続けて当ててみよう。</div>`}</div></div>
      </div>
      <div class="foot"><span class="sp">魔法もステータスも必殺技も失い、第1層へ戻される。見つけた知識だけは残る。</span>
        <button class="btn" data-act="title">タイトルへ</button>
        ${me.ready ? `<span class="waiting">仲間を待っています…</span>` : `<button class="btn big primary" data-act="ready">第1層からやり直す</button>`}
      </div>
    </div>`);
    this.root.onclick = (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.act === "ready") this.send({ type: "ready" }); if (t.dataset.act === "title") this.game.toTitle(); };
  }
  victory(st) {
    const key = "victory";
    const me = this.me(st);
    const total = Object.values(st.attempts).reduce((a, b) => a + b, 0);
    this.setScreen(key, `<div class="screen clear"><div class="title">
      <div class="logo" style="font-size:calc(30px * var(--k))">二十層 踏破</div>
      <div class="sub">魔法戦争は終わった。塔の頂に、あなたの名が刻まれる。</div>
      <div class="sub">総挑戦回数 ${total} 回</div>
      <div class="row">${me.skills.map((k) => `<div class="slot"><img src="${iconUrl(k.id)}" alt=""><span class="rk">${k.rank}</span></div>`).join("")}</div>
      <div class="row"><button class="btn big primary" data-act="restart">もう一度登る</button><button class="btn big" data-act="title">タイトルへ</button></div>
    </div></div>`);
    this.root.onclick = (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.act === "restart") this.send({ type: "restart" }); if (t.dataset.act === "title") this.game.toTitle(); };
  }
  pause() {
    this.setScreen("pause", `<div class="screen" style="background:#07060bd0"><div class="title">
      <div class="logo" style="font-size:calc(24px * var(--k))">一時停止</div>
      <button class="btn big primary" data-p="resume">つづける</button>
      <button class="btn big" data-p="giveup">あきらめる(第1層へ戻る)</button>
      <div class="help" style="text-align:center">魔法は自動で敵や味方を追いかけます。スペースで回避、長押しで必殺技。</div>
    </div></div>`);
    this.root.onclick = (e) => { const t = e.target.closest("[data-p]"); if (!t) return; if (t.dataset.p === "resume") this.game.setPaused(false); if (t.dataset.p === "giveup") this.game.giveUp(); };
  }

  // ─── HUD ───
  buildHud() {
    this.hud.classList.remove("hidden");
    this.hud.innerHTML = `
      <div class="bossbar">
        <div class="bossname"><small id="bfloor"></small><span id="bname"></span></div>
        <div class="hpwrap"><div class="hpghost" id="bghost"></div><div class="hpfill" id="bhp"></div><div class="hptext" id="btxt"></div></div>
        <div class="badges" id="bbadges"></div>
        <div class="bossmove" id="bmove"></div>
      </div>
      <div class="pinfo" id="pinfo"></div>
      <div class="team" id="team"></div>
      <div class="synbox" id="synbox"></div>
      <div class="mybar" id="mybar">
        <div class="statuses" id="mystat"></div>
        <div class="ultrow">
          <div class="ultbar" id="ultbar"><div class="ultfill" id="ultfill"></div><div class="hptext" id="ulttxt"></div><div class="holdfill" id="holdfill"></div></div>
          <div class="dashpip"><i id="dashfill"></i><span>回避</span></div>
        </div>
        <div class="hpwrap"><div class="hpfill" id="myhp"></div><div class="barrier" id="mybarrier"></div><div class="hptext" id="mytxt"></div></div>
      </div>
      <div class="skillbar" id="skillbar"></div>
      <div class="tip" id="tip"></div>`;
    const bar = $("#skillbar");
    bar.innerHTML = Array.from({ length: MAX_SKILLS }, (_, i) => `<div class="slot empty" data-slot="${i}"><img alt="" style="display:none"><div class="cd" style="height:0"></div><div class="cdn"></div><span class="key">${KEYS[i]}</span><span class="rk"></span></div>`).join("");
    bar.onclick = (e) => { const s = e.target.closest("[data-slot]"); if (s) this.game.castSlot(+s.dataset.slot); };
    this.slots = [...bar.children];
    this.slotId = [];
    this.hudBuilt = true;
    this.lastHud = {};
  }
  hideHud() { this.hud.classList.add("hidden"); this.hudBuilt = false; }
  showIntro(floor, def) {
    const d = document.createElement("div");
    d.className = "intro";
    d.innerHTML = `<i>第${floor}層</i><b>${esc(def.name)}</b>${def.hint ? `<em>「${esc(def.hint)}」</em>` : `<em style="color:var(--dim)">── この敵についての手がかりはない ──</em>`}`;
    $("#stage").appendChild(d);
    setTimeout(() => d.remove(), 2300);
  }
  banner(e) {
    const d = document.createElement("div");
    d.className = "banner " + e.kind;
    d.textContent = e.text;
    this.banners.appendChild(d);
    while (this.banners.children.length > 3) this.banners.firstChild.remove();
    setTimeout(() => d.remove(), 2400);
  }
  bossMove(name) {
    const el = $("#bmove");
    if (el) { el.textContent = name; clearTimeout(this.mvT); this.mvT = setTimeout(() => (el.textContent = ""), 1400); }
  }
  toast(e) {
    const el = $("#tip");
    if (!el) return;
    el.textContent = e.status ? (STATUS_INFO[e.text]?.name || e.text) + "!" : e.text;
    clearTimeout(this.tipT);
    this.tipT = setTimeout(() => (el.textContent = ""), 1200);
  }
  showUlt(id) {
    const U = ULTS[id];
    const d = document.createElement("div");
    d.className = "ultcut";
    d.style.color = U.color;
    d.innerHTML = `<small>必殺技</small><b>${esc(U.name)}</b>`;
    $("#stage").appendChild(d);
    setTimeout(() => d.remove(), 1750);
  }
  showSynergy(e) {
    this.banner({ kind: e.bad ? "bad" : "good", text: e.bad ? `魔法が反発している — ${e.name}` : `隠された力が目覚めた — ${e.name}` });
    const box = $("#synbox");
    if (box) { const sp = document.createElement("span"); sp.textContent = e.name; if (e.bad) sp.style.color = "var(--red)"; sp.title = e.desc; box.appendChild(sp); }
  }
  updateHud(S) {
    if (!S) return;
    if (!this.hudBuilt) this.buildHud();
    const b = S.b, H = this.lastHud;
    const def = BOSSES[S.floor - 1];
    if (H.floor !== S.floor) { H.floor = S.floor; $("#bfloor").textContent = `第${S.floor}層`; $("#bname").textContent = def.name; }
    const pct = Math.max(0, b.hp / b.m) * 100;
    $("#bhp").style.width = pct + "%";
    $("#bghost").style.width = pct + "%";
    $("#btxt").textContent = `${Math.max(0, b.hp).toLocaleString()} / ${b.m.toLocaleString()}`;
    const badges = [];
    for (const k of b.bf) badges.push(`<span class="badge b">${BUFF_NAMES[k] || k}</span>`);
    if (b.enr) badges.push(`<span class="badge b">激化 +${Math.round(b.enr * 100)}%</span>`);
    if (b.ward) badges.push(`<span class="badge b">障壁 ${b.ward[0]}/${b.ward[1]}</span>`);
    if (b.rf) badges.push(`<span class="badge b">反射?</span>`);
    if (b.air) badges.push(`<span class="badge s">飛行中</span>`);
    if (b.st2) badges.push(`<span class="badge s">影化</span>`);
    if (b.vent) badges.push(`<span class="badge s">赤熱</span>`);
    if (b.vuln) badges.push(`<span class="badge d">隙あり! +50%</span>`);
    if (b.stag) badges.push(`<span class="badge d">${b.stop ? "時間停止" : "怯み"}</span>`);
    if (b.wet) badges.push(`<span class="badge d">濡れ</span>`);
    if (b.au) badges.push(`<span class="badge s" style="color:${ELEMENTS[b.au].color};border-color:${ELEMENTS[b.au].color}">元素: ${ELEMENTS[b.au].name}</span>`);
    if (b.el) badges.push(`<span class="badge s" style="color:${ELEMENTS[b.el].color};border-color:${ELEMENTS[b.el].color}">${b.weak ? "弱点" : "纏う力"}: ${ELEMENTS[b.el].name}</span>`);
    for (const k of b.db) badges.push(`<span class="badge d">${DEBUFF_NAMES[k] || k}</span>`);
    for (const k of b.ss) badges.push(`<span class="badge d">${STATUS_INFO[k]?.name || k}</span>`);
    const bk = badges.join("");
    if (H.bk !== bk) { H.bk = bk; $("#bbadges").innerHTML = bk; }

    const me = S.p.find((p) => p.id === this.game.selfId) || S.p[0];
    if (!me) return;
    const low = me.hp / me.m < .3;
    $("#myhp").style.width = Math.max(0, me.hp / me.m) * 100 + "%";
    $("#mybar").classList.toggle("low", low);
    $("#mybarrier").style.width = Math.min(100, me.bar / me.m * 100) + "%";
    $("#mytxt").textContent = me.dn ? "戦闘不能" : `${me.hp} / ${me.m}`;
    const stList = [...me.ss.map((k) => `<span class="badge b">${STATUS_INFO[k]?.name || k}</span>`), ...me.bf.map((k) => `<span class="badge d">${PBUFF[k] || k}</span>`), ...(me.sil ? [`<span class="badge b">沈黙</span>`] : [])].join("");
    if (H.st !== stList) { H.st = stList; $("#mystat").innerHTML = stList; }
    if (me.ult) {
      const U = ULTS[me.ult], need = U.charge.need, full = me.uc >= need;
      $("#ultfill").style.width = Math.min(100, me.uc / need * 100) + "%";
      $("#ultbar").classList.toggle("full", full);
      const label = full ? "スペース長押しで発動!" : `${U.name} ${Math.floor(me.uc)}/${need}`;
      if (H.ul !== label) { H.ul = label; $("#ulttxt").textContent = label; }
      $("#holdfill").style.width = (full ? this.game.holdRatio() * 100 : 0) + "%";
    }
    $("#dashfill").style.width = Math.max(0, 100 - me.dcd / 1.1 * 100) + "%";
    me.sk.forEach(([id, rank, cd, max, inr], i) => {
      const el = this.slots[i];
      if (!el) return;
      if (this.slotId[i] !== id + rank) {
        this.slotId[i] = id + rank;
        el.classList.remove("empty");
        const img = el.querySelector("img");
        img.src = iconUrl(id); img.style.display = "";
        el.querySelector(".rk").textContent = rank;
        el.title = SKILLS[id].name;
      }
      const cdEl = el.querySelector(".cd"), n = el.querySelector(".cdn");
      const r = max ? Math.min(1, cd / max) : 0;
      const h = (r * 100).toFixed(0) + "%";
      if (cdEl.dataset.h !== h) { cdEl.dataset.h = h; cdEl.style.height = h; }
      const txt = cd > 0 ? (cd < 10 ? cd.toFixed(1) : Math.ceil(cd)) : "";
      if (n.textContent !== "" + txt) n.textContent = txt;
      el.classList.toggle("ready", cd <= 0);
      el.classList.toggle("far", !inr);
    });
    for (let i = me.sk.length; i < MAX_SKILLS; i++) if (this.slotId[i]) { this.slotId[i] = null; const el = this.slots[i]; el.classList.add("empty"); el.querySelector("img").style.display = "none"; el.querySelector(".rk").textContent = ""; }
    if (S.p.length > 1) {
      const t = S.p.filter((p) => p.id !== me.id).map((p) => `<div class="tm"><span style="color:${p.col}">${esc(p.n)}</span>${p.dn ? ` <span style="color:var(--red)">戦闘不能</span>` : ""}<div class="hpwrap"><div class="hpfill" style="width:${Math.max(0, p.hp / p.m) * 100}%"></div></div></div>`).join("");
      if (H.team !== t) { H.team = t; $("#team").innerHTML = t; }
    }
    const pi = `挑戦 ${S.t | 0}秒`;
    if (H.pi !== pi) { H.pi = pi; $("#pinfo").textContent = pi; }
  }
}
