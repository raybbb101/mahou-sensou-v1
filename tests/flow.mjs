// 進行ルールのテスト(仕様どおりか)。 node tests/flow.mjs
import assert from "node:assert";
import { Session } from "../src/sim/session.js";
import { isAttack, SKILL_IDS, specOf } from "../src/sim/skills.js";

const S = new Session(42);
S.addPlayer("a", "A");
S.start();
const p = S.players[0];
assert.equal(S.phase, "pick");
assert.equal(p.ultOffer.length, 10, "必殺技も候補が出る");
S.action("a", { type: "togglePick", id: p.offer[0] });
S.action("a", { type: "togglePick", id: p.offer[1] });
S.action("a", { type: "confirmPick" });
assert.equal(S.phase, "pick", "必殺技を選ぶまで進めない");
S.action("a", { type: "togglePick", id: p.offer[0] });
S.action("a", { type: "togglePick", id: p.offer[1] });
S.action("a", { type: "chooseUlt", id: p.ultOffer[0] });
const ultId = p.ult;
assert.equal(ultId, p.ultOffer[0]);
S.action("a", { type: "chooseUlt", id: p.ultOffer[1] });
assert.equal(p.ult, ultId, "必殺技は変えられない");
assert.equal(p.offer.length, 10, "10 個表示");
assert.equal(new Set(p.offer).size, 10, "重複なし");
assert.ok(p.offer.filter(isAttack).length >= 4, "1 層は攻撃魔法を 4 つ保証");

// 3 つ目は選べない
const atk = p.offer.filter(isAttack);
S.action("a", { type: "togglePick", id: atk[0] });
S.action("a", { type: "togglePick", id: atk[1] });
S.action("a", { type: "togglePick", id: atk[2] });
assert.equal(p.picked.length, 2, "2 つしか選べない");
S.action("a", { type: "confirmPick" });
assert.equal(S.phase, "battle");

const win = () => { const b = S.battle; b.boss.hp = 0; b.bossDown(null); b.over = "win"; S.endBattle("win"); };
const next = () => S.action("a", { type: "ready" });
const pick2 = () => {
  const o = S.players[0].offer;
  S.action("a", { type: "togglePick", id: o[0] });
  S.action("a", { type: "togglePick", id: o[1] });
  S.action("a", { type: "confirmPick" });
};
win();
assert.equal(S.phase, "reward");
assert.equal(p.sp, 3, "SP を獲得");
S.action("a", { type: "discard", slot: 0 });
assert.equal(p.skills.length, 2, "1 層の後はまだ捨てられない");
S.action("a", { type: "rank", slot: 0 });
assert.equal(p.skills[0].rank, 2);
S.action("a", { type: "stat", key: "atk", n: 2 });
assert.equal(p.stats.atk, 2);
assert.equal(p.sp, 0);
next();
assert.equal(S.phase, "pick");
assert.equal(S.floor, 2);
pick2();
win();
const before = p.skills.length;
S.action("a", { type: "discard", slot: before - 1 });
assert.equal(p.skills.length, before - 1, "2 層の後から捨てられる");

// 11 個以上になると強制的に捨てる
next();
while (S.phase !== "battle" || p.skills.length < 10) {
  if (S.phase === "pick") { pick2(); while (p.needDiscard) S.action("a", { type: "discard", slot: 0 }); }
  if (S.phase === "battle") { win(); if (p.skills.length >= 10) break; next(); }
}
assert.equal(p.skills.length, 10);
next();
const o = p.offer.filter((id) => !p.skills.some((s) => s.id === id));
S.action("a", { type: "togglePick", id: o[0] });
S.action("a", { type: "togglePick", id: o[1] });
S.action("a", { type: "confirmPick" });
assert.equal(p.skills.length, 12);
assert.equal(p.needDiscard, 2, "あふれた分を捨てる");
assert.equal(S.phase, "pick", "捨てるまで進めない");
S.action("a", { type: "discard", slot: 0 });
S.action("a", { type: "discard", slot: 0 });
assert.equal(p.skills.length, 10);
assert.equal(S.phase, "battle", "捨てれば進む");

// 同じ魔法が出たらレベルアップ
win(); next();
const dup = p.skills[0];
p.offer[0] = dup.id;
const r0 = dup.rank;
S.action("a", { type: "togglePick", id: dup.id });
S.action("a", { type: "togglePick", id: p.offer.find((id) => id !== dup.id && !p.skills.some((s) => s.id === id)) });
S.action("a", { type: "confirmPick" });
assert.equal(dup.rank, r0 + 1, "所持魔法を選ぶとランクアップ");
while (p.needDiscard) S.action("a", { type: "discard", slot: p.skills.length - 1 });

// ランク上限 10、ステータス上限なし
assert.equal(S.phase, "battle");
win();
p.sp = 500;
for (let i = 0; i < 30; i++) S.action("a", { type: "rank", slot: 0 });
assert.equal(p.skills[0].rank, 10, "ランク上限 10");
S.action("a", { type: "stat", key: "hp", n: 400 });
assert.ok(p.stats.hp >= 400, "ステータスに上限なし");
const cd1 = specOf(SKILL_IDS[0], 1).cd, cd10 = specOf(SKILL_IDS[0], 10).cd;
assert.ok(cd10 < cd1, "ランクで CD が減る");
assert.ok(specOf("fireball", 10).pow > specOf("fireball", 1).pow, "ランクで威力が増える");

// 全滅 → 第 1 層へ戻る
next(); pick2(); while (p.needDiscard) S.action("a", { type: "discard", slot: p.skills.length - 1 });
assert.equal(S.phase, "battle");
assert.equal(p.ult, ultId, "必殺技は階をまたいでも同じ");
assert.ok(S.floor > 5);
// 保存(選択中)と読み込み
S.battle.over = "lose"; S.endBattle("lose");
assert.equal(S.phase, "defeat");
const L = Session.load(S.save());
assert.equal(L.phase, "defeat");
next();
assert.equal(S.floor, 1, "第 1 層へ戻る");
assert.equal(S.phase, "pick");
assert.equal(p.skills.length, 0, "魔法を失う");
assert.equal(p.ult, null, "必殺技も失う");
assert.equal(p.sp, 0);
assert.equal(p.stats.hp, 0);

// マルチ: 倒れた仲間は、残りが勝てば次の階で復活する
const M = new Session(7);
M.addPlayer("x", "X"); M.addPlayer("y", "Y");
M.start();
for (const q of M.players) { M.action(q.id, { type: "chooseUlt", id: q.ultOffer[0] }); const a = q.offer.filter(isAttack); M.action(q.id, { type: "togglePick", id: a[0] }); M.action(q.id, { type: "togglePick", id: a[1] }); M.action(q.id, { type: "confirmPick" }); }
assert.equal(M.phase, "battle");
const by = M.battle.players.find((q) => q.id === "y");
M.battle.hurtPlayer(by, 1e9, { raw: 1 });
assert.ok(by.down, "仲間が倒れた");
for (let i = 0; i < 200; i++) M.step();
assert.equal(M.phase, "battle", "一人残っていれば続く");
assert.ok(by.down, "戦闘中は復活しない");
M.battle.boss.hp = 0; M.battle.bossDown(null); M.battle.over = "win"; M.endBattle("win");
assert.equal(M.phase, "reward");
for (const q of M.players) M.action(q.id, { type: "ready" });
for (const q of M.players) { const o = q.offer; M.action(q.id, { type: "togglePick", id: o[0] }); M.action(q.id, { type: "togglePick", id: o[1] }); M.action(q.id, { type: "confirmPick" }); }
assert.equal(M.phase, "battle");
assert.ok(!M.battle.players.find((q) => q.id === "y").down, "次の階で復活");
// 全滅なら第 1 層へ
for (const q of M.battle.players) M.battle.hurtPlayer(q, 1e9, { raw: 1 });
for (let i = 0; i < 80; i++) M.step();
assert.equal(M.phase, "defeat", "全滅");

// 戦闘ルール
import { Battle } from "../src/sim/battle.js";
import { ULTS, ULT_IDS } from "../src/sim/ults.js";
assert.equal(ULT_IDS.length, 20, "必殺技 20 種");
const mk = (extra = {}, floor = 3) => new Battle([{ id: "a", name: "A", color: "#fff", stats: {}, skills: [{ id: "ice-lance", rank: 1 }, { id: "heal", rank: 1 }], ult: "zero", ultCharge: 0, prevTaken: 5, ...extra }], floor, 5);
// 接触ダメージ
let b = mk(); let q = b.players[0];
b.boss.state = "gap"; b.boss.timer = 99;
q.x = b.boss.x; q.z = b.boss.z; const hp0 = q.hp;
for (let i = 0; i < 45; i++) { q.x = b.boss.x; q.z = b.boss.z; b.step(); }
assert.ok(q.hp < hp0, "ボスに触れると減る");
const h1 = q.hp; for (let i = 0; i < 45; i++) { q.x = b.boss.x; q.z = b.boss.z; b.step(); }
assert.ok(q.hp < h1, "触れ続けるとさらに減る");
// 自動追尾: 明後日の方向に撃っても当たる
b = mk(); q = b.players[0]; b.boss.state = "gap"; b.boss.timer = 99; q.aimX = 999;
b.input("a", { cast: 0 });
for (let i = 0; i < 60; i++) b.step();
assert.ok(b.boss.hp < b.boss.maxHp, "魔法が自動で敵を追う");
// 回避: スペースで移動し、無敵中の攻撃は完全回避として数える
b = mk(); q = b.players[0]; b.boss.state = "gap"; b.boss.timer = 99;
const x0 = q.x, z0 = q.z, hp1 = q.hp;
b.input("a", { mx: 1, mz: 0, dash: true }); b.step();
b.addHazard({ shape: "circle", x: q.x, z: q.z, r: 200, tele: .01, pow: 5 });
for (let i = 0; i < 3; i++) b.step();
assert.ok(Math.hypot(q.x - x0, q.z - z0) > 20, "回避で素早く動く");
assert.equal(q.hp, hp1, "無敵中は当たらない");
assert.equal(q.perfects, 1, "完全回避を数える");
assert.equal(q.ultCharge, 1, "必殺ゲージが溜まる");
// 必殺技: 満タンでだけ発動
q.ultCharge = 3; b.input("a", { ult: true }); b.step();
assert.equal(q.ultCharge, 3, "満タンでなければ発動しない");
q.ultCharge = ULTS.zero.charge.need; b.input("a", { ult: true }); b.step();
assert.equal(q.ultCharge, 0, "発動でゲージが空に");
assert.ok(b.boss.stagger > 4, "絶対零度で凍る");
// 全必殺技がエラーなく動き、効果がある
for (const id of ULT_IDS) {
  const t = mk({ ult: id, skills: [{ id: "fireball", rank: 3 }, { id: "chain-lightning", rank: 3 }, { id: "star-fall", rank: 10 }] }, 8), u = t.players[0];
  u.ultCharge = ULTS[id].charge.need; u.hp = 30;
  t.input("a", { ult: true });
  for (let i = 0; i < 180; i++) t.step();
  assert.equal(u.ultUsed, 1, id);
}
// 隠し効果
const syn = (skills, stats = {}, floor = 3) => new Battle([{ id: "a", name: "A", color: "#fff", stats, skills: skills.map((id) => ({ id, rank: 1 })), ult: "zero", prevTaken: 5 }], floor, 1).players[0].syn;
assert.ok(syn(["fireball", "meteor", "fire-ring", "flame-pillar"]).includes("pure4-fire"), "同一属性");
assert.ok(syn(["fireball", "ice-lance", "splash", "zap-hit", "portal", "smite", "curse", "vine-whip"]).includes("rainbow"), "全属性");
assert.ok(syn(["fireball", "ice-lance"], {}, 10).includes("lone-pair"), "2 つだけで 10 層");
assert.ok(!syn(["fireball", "ice-lance"], {}, 9).includes("lone-pair"), "9 層ではまだ");
// 元素反応: 反応魔法同士でだけ起きる
const rb = () => { const t = new Battle([{ id: "a", name: "A", color: "#fff", stats: {}, skills: [{ id: "splash", rank: 1 }, { id: "lightning-strike", rank: 1 }, { id: "zap-hit", rank: 1 }], ult: "zero", prevTaken: 5 }], 1, 9); t.boss.state = "gap"; t.boss.timer = 99; t.boss.hp = t.boss.maxHp = 1e6; return t; };
const hitOf = (t, id) => { const before = t.boss.hp; const sp = specOf(id, 1); t.t += 2; t.hitTarget({ p: t.players[0], s: sp, mul: 1 }, t.boss, 100); return before - t.boss.hp; };
let t1 = rb(); t1.players[0].s.crit = 0; const plain = hitOf(t1, "lightning-strike");
t1 = rb(); t1.players[0].s.crit = 0; hitOf(t1, "splash"); assert.equal(t1.boss.aura.el, "water", "反応魔法は元素を残す");
const shock = hitOf(t1, "lightning-strike");
assert.ok(shock > plain * 1.5, "水 → 雷で感電してダメージが跳ね上がる");
assert.equal(t1.boss.aura, null, "反応すると元素は消える");
assert.ok(t1.boss.debuffs.shocked, "感電のデバフ");
t1 = rb(); t1.players[0].s.crit = 0; hitOf(t1, "splash"); const z = hitOf(t1, "zap-hit");
assert.ok(z < plain * 1.2 && t1.boss.aura, "反応魔法でないものは反応しない");
// コンボ
t1 = rb(); t1.players[0].s.crit = 0; const solo = hitOf(t1, "dark-explosion");
t1 = rb(); t1.players[0].s.crit = 0; hitOf(t1, "curse"); assert.ok(hitOf(t1, "dark-explosion") > solo * 2, "カース → ダークエクスプロージョン");
// 相性の悪い組み合わせ
assert.ok(syn(["fireball", "meteor", "splash", "water-orb"]).includes("clash-fw"), "水火の相克");
assert.ok(!syn(["fireball", "meteor", "splash", "water-orb"]).some((i) => i.startsWith("pure")), "混ざると同一属性の効果は出ない");
// ランクで強くなる
assert.ok(specOf("meteor", 1).pow < 150, "最初は控えめ");
assert.ok(!specOf("meteor", 4).echoes, "低ランクは 1 回");
assert.equal(specOf("meteor", 5).echoes.length, 1, "ランク 5 で追撃");
assert.equal(specOf("meteor", 10).echoes.length, 3, "ランク 10 で 3 回の追撃");
assert.equal(specOf("meteor", 10).repeat, 3, "覚醒の特殊効果");
assert.ok(specOf("meteor", 10).awaken, "属性覚醒");
console.log("すべて合格");
