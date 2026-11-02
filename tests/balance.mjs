// ボットで全階層を自動対戦し、勝率と所要時間を出す。 node tests/balance.mjs [試行数] [人数] [上手さ 0..1]
import { Session } from "../src/sim/session.js";
import { TICK, ARENA_R } from "../src/sim/battle.js";
import { SKILLS, STAT_KEYS, isAttack, specOf } from "../src/sim/skills.js";
import { FLOORS } from "../src/sim/bosses.js";
import { ULTS as ULT, ULT_IDS } from "../src/sim/ults.js";

const TRIES = +(process.argv[2] || 5), N = +(process.argv[3] || 1), SKILL = +(process.argv[4] || .9), BUILDS = (process.argv[5] || "balanced,mage,tank,duo").split(",");

// 危険な場所から離れるボット。skill が低いと予告への反応が遅れる。
function botInput(b, p, skill, rngv) {
  const inp = {};
  const boss = b.boss;
  let fx = 0, fz = 0, danger = 0;
  const away = (x, z, w) => { const d = Math.hypot(p.x - x, p.z - z) || 1; fx += (p.x - x) / d * w; fz += (p.z - z) / d * w; };
  for (const h of b.hazards) {
    if (h.safe || h.dmg <= 0 && !h.noFire) continue;
    // 人間らしさ: 反応の遅れと見落とし
    if (h.tele - h.t < (1 - skill) * .9 + .12) continue;
    if (((h.id * 2654435761) >>> 0) / 4294967296 < (1 - skill) * .6) continue;
    if (h.shape === "circle" && Math.hypot(p.x - h.x, p.z - h.z) < h.r + 18) { away(h.x, h.z, 3); danger = 1; }
    else if (h.shape === "donut") { const d = Math.hypot(p.x - h.x, p.z - h.z); if (d > h.r - 15) { away(h.x, h.z, -3); danger = 1; } }
    else if (h.shape === "cone" || h.shape === "line") {
      const dx = p.x - h.x, dz = p.z - h.z, cx = Math.cos(h.ang), cz = Math.sin(h.ang), al = dx * cx + dz * cz, of = dx * cz - dz * cx;
      const w = h.shape === "line" ? h.wid / 2 + 22 : Math.tan(Math.min(1.2, h.wid)) * Math.max(10, al) + 22;
      if (al > -10 && al < (h.len || 300) + 10 && Math.abs(of) < w) { const sgn = of >= 0 ? 1 : -1; fx += cz * sgn * 3; fz += -cx * sgn * 3; danger = 1; }
    }
  }
  for (const z of b.zones) if (z.side === 1 && Math.hypot(p.x - z.x, p.z - z.z) < z.r + 14) { away(z.x, z.z, 2); danger = 1; }
  for (const q of b.projectiles) if (q.side === 1) {
    const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz);
    if (d < 90 * skill + 10 && ((q.id * 2654435761) >>> 0) / 4294967296 > (1 - skill) * .9) { const sp = Math.hypot(q.vx, q.vz) || 1, cx = q.vx / sp, cz = q.vz / sp, al = dx * cx + dz * cz, of = dx * cz - dz * cx; if (al > 0 && Math.abs(of) < q.r + 14) { const sgn = of >= 0 ? 1 : -1; fx += cz * sgn * 2.5; fz += -cx * sgn * 2.5; danger = 1; } }
  }
  // 陣へ
  if (b.runes.length) { const r = [...b.runes].sort((x, y) => Math.hypot(p.x - x.x, p.z - x.z) - Math.hypot(p.x - y.x, p.z - y.z))[0]; const d = Math.hypot(p.x - r.x, p.z - r.z); if (d > 18) { fx = (r.x - p.x) / d * 4; fz = (r.z - p.z) / d * 4; } }
  for (const h of b.hazards) if (h.safe) { const d = Math.hypot(p.x - h.x, p.z - h.z); if (d > 18) { fx += (h.x - p.x) / d * .8; fz += (h.z - p.z) / d * .8; } }
  // 間合いを保つ
  if (!danger) {
    const d = Math.hypot(p.x - boss.x, p.z - boss.z);
    const want = 150;
    if (d > want + 30) { fx += (boss.x - p.x) / d; fz += (boss.z - p.z) / d; }
    else if (d < want - 30) { fx += (p.x - boss.x) / d; fz += (p.z - boss.z) / d; }
    else { fx += -(boss.z - p.z) / d * .6; fz += (boss.x - p.x) / d * .6; }
  }
  // 壁から離れる
  const e = Math.hypot(p.x, p.z);
  if (e > ARENA_R - 40) { fx -= p.x / e * 1.2; fz -= p.z / e * 1.2; }
  inp.mx = fx; inp.mz = fz;
  // 狙い: 花・核があれば優先
  // 回避: 当たりそうな攻撃の直前に踏む。必殺技は溜まったらすぐ使う
  if (p.dashCd <= 0 && danger && rngv() < skill) {
    const soon = b.hazards.some((h) => !h.safe && h.dmg > 0 && h.t < .22 && b.inShape(h, p.x, p.z)) || b.projectiles.some((q) => q.side === 1 && Math.hypot(p.x - q.x, p.z - q.z) < q.r + 26);
    if (soon) inp.dash = true;
  }
  if (p.ult && p.ultCharge >= ULT[p.ult].charge.need) inp.ult = true;

  // 発動: 属性ギミックに合わせ、なければ使えるものから
  if (rngv() < skill * skill * .35) {
    const cands = [];
    const hpLow = p.hp / p.maxHp;
    p.skills.forEach((sk, i) => {
      if (sk.cd > 0) return;
      const s = specOf(sk.id, sk.rank);
      const dist = Math.hypot(p.x - boss.x, p.z - boss.z);
      if (s.dmgless) {
        if (s.heal && hpLow > .7) return;
        if (s.buff?.[0] === "invuln" && !danger) return;
        if ((s.kind === "blink" || s.kind === "port") && !danger) return;
        cands.push([i, 40]);
        return;
      }
      if (s.kind === "nova" && dist > s.r + boss.def.hitR) return;
      if ((s.kind === "line" || s.kind === "cone") && dist > s.len + boss.def.hitR) return;
      if (s.kind === "target" && dist > s.range + boss.def.hitR) return;
      if (s.kind === "ground" && dist > s.range + boss.def.hitR) return;
      if (boss.air > 0 && (s.kind === "ground" || s.kind === "zone" || s.kind === "nova" || s.kind === "linez")) return;
      if (boss.reflect > 0) return;
      let w = s.pow / Math.max(1, s.cd);
      const elems = boss.def.weak || [];
      if (elems.includes(s.elem)) w *= 2;
      if ((boss.def.absorb || []).includes(s.elem)) return;
      if ((boss.ward && b.gim.cfg.by.includes(s.elem)) || (boss.vent > 0 && b.gim.cfg.by.includes(s.elem))) w *= 5;
      cands.push([i, w]);
    });
    if (cands.length) { cands.sort((a, b) => b[1] - a[1]); inp.cast = cands[0][0]; }
  }
  return inp;
}

const PLANS = {
  balanced: { rankShare: .4, stats: { atk: 4, hp: 3, def: 2, crit: 1, haste: 1 } },
  mage: { rankShare: .3, stats: { atk: 6, crit: 2, critDmg: 2, haste: 2, hp: 1 } },
  tank: { rankShare: .3, stats: { hp: 4, def: 4, atk: 3, regen: 1 } },
  duo: { rankShare: .5, maxSkills: 2, stats: { atk: 5, hp: 2, def: 2, haste: 2 } },
};

function pickFor(S, p, plan) {
  const score = (id) => {
    const s = SKILLS[id];
    const own = p.skills.find((k) => k.id === id);
    let v = isAttack(id) ? s.pow / s.cd + 6 : 4;
    if (own) v += 10;
    return v + Math.random() * 3;
  };
  const opts = [...p.offer].sort((a, b) => score(b) - score(a));
  if (plan.maxSkills && p.skills.length >= plan.maxSkills) {
    const own = opts.filter((o) => p.skills.some((s) => s.id === o));
    opts.sort((a, b) => (own.includes(b) ? 1 : 0) - (own.includes(a) ? 1 : 0));
  }
  if (!p.ult) S.action(p.id, { type: "chooseUlt", id: p.ultOffer[Math.floor(Math.random() * p.ultOffer.length)] });
  S.action(p.id, { type: "togglePick", id: opts[0] });
  S.action(p.id, { type: "togglePick", id: opts[1] });
  S.action(p.id, { type: "confirmPick" });
  let guard = 20;
  const limit = plan.maxSkills || 10;
  while (p.skills.length > limit && guard--) {
    const worst = p.skills.map((s, i) => [i, (isAttack(s.id) ? SKILLS[s.id].pow / SKILLS[s.id].cd : 3) + s.rank * 2]).sort((a, b) => a[1] - b[1])[0][0];
    const wasForced = p.needDiscard > 0;
    if (wasForced) S.action(p.id, { type: "discard", slot: worst });
    else if (S.phase === "pick") { p.skills.splice(worst, 1); }
  }
  if (!p.ready && !p.needDiscard) S.tryReadyPick(p);
}
function spend(S, p, plan) {
  const statBag = Object.entries(plan.stats).flatMap(([k, v]) => Array(v).fill(k));
  let i = 0;
  while (p.sp > 0) {
    if (Math.random() < plan.rankShare) {
      const c = p.skills.map((s, j) => [j, s]).filter(([, s]) => s.rank < 10 && isAttack(s.id)).sort((a, b) => a[1].rank - b[1].rank);
      if (c.length) { S.action(p.id, { type: "rank", slot: c[0][0] }); continue; }
    }
    S.action(p.id, { type: "stat", key: statBag[i++ % statBag.length] });
  }
}

function runFloorSet(buildName) {
  const plan = PLANS[buildName];
  const S = new Session((Math.random() * 1e9) | 0);
  for (let i = 0; i < N; i++) S.addPlayer("p" + i, "bot" + i);
  S.start();
  const log = [];
  let guard = 0;
  while (S.phase !== "victory" && guard++ < 200) {
    if (S.phase === "pick") { for (const p of S.players) pickFor(S, p, plan); S.maybeAdvance(); }
    if (S.phase === "battle") {
      const rng = () => Math.random();
      let ticks = 0;
      while (S.phase === "battle" && ticks++ < 30 * 600) {
        const b = S.battle;
        for (const p of b.players) if (!p.down) b.input(p.id, botInput(b, p, SKILL, rng));
        S.step();
        b.events.length = 0;
      }
      const r = S.lastResult;
      const f = r.floor;
      (log[f] ||= { tries: 0, wins: 0, time: 0 });
      log[f].tries++;
      if (r.res === "win") { log[f].wins++; log[f].time = r.time; }
      else log[f].left = r.bossLeft;
      if (r.res !== "win") return { log, reached: f };
    }
    if (S.phase === "reward" || S.phase === "defeat") {
      for (const p of S.players) { spend(S, p, plan); S.action(p.id, { type: "ready" }); }
    }
  }
  return { log, reached: S.phase === "victory" ? 21 : S.floor };
}

for (const b of BUILDS) {
  const agg = [];
  let clears = 0, sumReach = 0;
  for (let t = 0; t < TRIES; t++) {
    const { log, reached } = runFloorSet(b);
    if (reached > 20) clears++;
    sumReach += Math.min(reached, 20);
    log.forEach((l, f) => { if (!l) return; (agg[f] ||= { tries: 0, wins: 0, time: 0 }); agg[f].tries += l.tries; agg[f].wins += l.wins; agg[f].time += l.time * l.wins; });
  }
  console.log(`\n== ${b} / ${N}人 / 上手さ${SKILL}: クリア ${clears}/${TRIES} 平均到達 ${(sumReach / TRIES).toFixed(1)}階`);
  console.log(agg.map((l, f) => l ? `${String(f).padStart(2)}F 勝率${String(Math.round(l.wins / l.tries * 100)).padStart(3)}% 到達${String(l.tries).padStart(3)}回 ${l.wins ? Math.round(l.time / l.wins) + "s" : "-"}` : "").filter(Boolean).join("\n"));
}
