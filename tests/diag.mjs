// ある階でボットが何で死ぬかを調べる。 node tests/diag.mjs 階 [試行] [SP] 
import { Battle, TICK } from "../src/sim/battle.js";
import { SKILLS, specOf, isAttack, SKILL_IDS } from "../src/sim/skills.js";
import { ULTS, ULT_IDS } from "../src/sim/ults.js";
import { readFileSync } from "fs";
const src = readFileSync(new URL("./balance.mjs", import.meta.url), "utf8");
const bot = new Function("specOf", "ARENA_R", "ULT", src.slice(src.indexOf("function botInput"), src.indexOf("const PLANS")) + "; return botInput;")(specOf, 262, ULTS);
const floor = +process.argv[2], tries = +(process.argv[3] || 20), SP = +(process.argv[4] || Array.from({ length: floor - 1 }, (_, i) => 3 + Math.floor((i + 1) / 4) + ((i + 1) % 5 === 0 ? 2 : 0)).reduce((a, b) => a + b, 0));
const att = SKILL_IDS.filter(isAttack);
let wins = 0, tt = 0, bossLeft = 0; const by = {};
for (let t = 0; t < tries; t++) {
  const nSk = Math.min(10, floor * 2);
  const ids = [...att].sort(() => Math.random() - .5).slice(0, Math.max(2, nSk - 2)).concat(["heal", "divine-shield"].slice(0, nSk > 2 ? 2 : 0));
  const rankPts = Math.round(SP * .4), statPts = SP - rankPts;
  const skills = ids.map((id) => ({ id, rank: 1 + Math.floor(rankPts / ids.length) }));
  const stats = { atk: Math.round(statPts * .4), hp: Math.round(statPts * .3), def: Math.round(statPts * .2), crit: 0, haste: Math.round(statPts * .1) };
  const b = new Battle([{ id: "a", name: "bot", color: "#fff", stats, skills, ult: ULT_IDS[Math.floor(Math.random() * 20)], ultCharge: 0, prevTaken: 5 }], floor, (Math.random() * 1e9) | 0);
  const orig = b.hurtPlayer.bind(b);
  let src1 = "?";
  const fh = b.fireHazard.bind(b); b.fireHazard = (h) => { src1 = "hz:" + (h.fx || h.shape); fh(h); src1 = "?"; };
  b.hurtPlayer = (p, raw, o = {}) => { const before = p.hp + p.barrier; const r = orig(p, raw, o); const d = before - (p.hp + p.barrier); const k = o.tag ? "tag:" + o.tag : src1 !== "?" ? src1 : "other"; by[k] = (by[k] || 0) + d; return r; };
  while (!b.over && b.t < 400) { const p = b.players[0]; if (!p.down) b.input("a", bot(b, p, +(process.env.SK || .95), Math.random)); b.step(); b.events.length = 0; }
  if (b.over === "win") wins++; else bossLeft += b.boss.hp / b.boss.maxHp;
  tt += b.t;
}
const tot = Object.values(by).reduce((a, b) => a + b, 0);
console.log(`F${floor} SP${SP} 勝率 ${Math.round(wins / tries * 100)}% 平均 ${Math.round(tt / tries)}s 敗北時残HP ${tries - wins ? Math.round(bossLeft / (tries - wins) * 100) : "-"}%  被ダメ/戦 ${Math.round(tot / tries)}`);
console.log("  " + Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => `${k} ${Math.round(v / tot * 100)}%`).join("  "));
