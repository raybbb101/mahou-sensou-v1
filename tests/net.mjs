// マルチの通し確認: 2 人で部屋を作り、選択して戦闘に入り、スナップショットを受け取る。 node tests/net.mjs [ポート]
import { isAttack } from "../src/sim/skills.js";
const URL_ = `ws://localhost:${process.argv[2] || 8123}`;
const client = (name) => new Promise((res) => {
  const ws = new WebSocket(URL_), c = { ws, name, state: null, snaps: 0, last: null, id: null, code: null, errs: [] };
  ws.onopen = () => res(c);
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.t === "joined") { c.id = m.id; c.code = m.code; } if (m.t === "state") c.state = m.s; if (m.t === "snap") { c.snaps++; c.last = m.s; } if (m.t === "error") c.errs.push(m.msg); };
  c.send = (o) => ws.send(JSON.stringify(o));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const a = await client("A"), b = await client("B");
a.send({ t: "create", name: "ぜろ" }); await sleep(200);
b.send({ t: "join", code: a.code, name: "いち" }); await sleep(200);
console.log("部屋", a.code, "参加者", a.state.players.map((p) => p.name));
a.send({ t: "act", a: { type: "start" } }); await sleep(200);
for (const c of [a, b]) {
  const me = c.state.players.find((p) => p.id === c.id);
  // 攻撃魔法を 1 つは選ばないとボス部屋へ進めない
  c.send({ t: "act", a: { type: "chooseUlt", id: me.ultOffer[0] } });
  const pick = [...new Set(me.offer.filter(isAttack).concat(me.offer))].slice(0, 2);
  for (const id of pick) c.send({ t: "act", a: { type: "togglePick", id } });
  c.send({ t: "act", a: { type: "confirmPick" } });
}
await sleep(300);
console.log("フェーズ", a.state.phase, b.state.phase, "オファーが違う:", JSON.stringify(a.state.players[0].offer) !== JSON.stringify(a.state.players[1].offer));
const t0 = Date.now();
for (let i = 0; i < 30; i++) { a.send({ t: "input", i: { mx: 1, mz: 0, cast: i % 2, dash: i % 7 === 0 } }); b.send({ t: "input", i: { mx: -1, mz: 0, cast: i % 2, dash: i % 7 === 0 } }); await sleep(100); }
const dt = (Date.now() - t0) / 1000;
const S = a.last;
console.log("受信", a.snaps, b.snaps, `(${(a.snaps / dt).toFixed(1)}回/秒)`, "サイズ", JSON.stringify(S).length, "byte");
console.log("ボス", S.b.hp, "/", S.b.m, "プレイヤー", S.p.map((p) => [p.n, p.x, p.hp, p.sk.map((k) => k[2]).join("/")]));
// 途中退出しても部屋が壊れないこと
b.ws.close(); await sleep(400);
console.log("退出後", a.state.players.length, "人 / フェーズ", a.state.phase);
a.ws.close();
await sleep(100);
process.exit(0);
