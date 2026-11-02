// プレイヤーキャラ: 尖り帽子の魔法使い。24 x 38 に収め、pixelfx の状態異常がこの輪郭を包めるようにする。
import { Art, hexc } from "./art.js";

const shade = (hex, k) => {
  const v = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return "#" + [f(v >> 16), f((v >> 8) & 255), f(v & 255)].map((c) => c.toString(16).padStart(2, "0")).join("");
};
const SKIN = ["#8a5a4a", "#c98b6c", "#f3c49d", "#ffe2c4"];
const HAIR = ["#2a1c30", "#47304e", "#6b4a6a"];
const LEATHER = ["#2a1a14", "#4a2e20", "#6e4a30"];

/** dir: 0 手前 / 1 奥 / 2 横(右向き), step: 0..3 歩行, cast: 0|1 */
export function paintHero(col, dir = 0, step = 0, cast = 0, down = 0) {
  const a = new Art(24, 38);
  const R = [shade(col, .32), shade(col, .55), shade(col, .8), col, shade(col, 1.25)];
  const H = [shade(col, .28), shade(col, .45), shade(col, .68), shade(col, .9)];
  const GOLD = ["#6a4410", "#c48412", "#ffd84a", "#fff6c4"];
  if (down) {
    // 倒れた姿: 横たわるローブと落ちた帽子
    a.ball(12, 33, 10, 3.6, R);
    a.ball(5, 32, 3, 2.6, SKIN);
    a.poly([[15, 36], [23, 36], [20, 29]], H);
    a.rect(14, 36, 10, 1, GOLD[1]);
    return a.outline();
  }
  const bob = step % 2 === 1 ? 1 : 0;
  const stride = [0, 2, 0, -2][step];
  // 足
  if (dir === 2) {
    a.limb(11 - stride, 31, 11 - stride, 36, 2, 2, LEATHER, { dth: .2 });
    a.limb(13 + stride, 31, 13 + stride, 36, 2, 2, LEATHER, { dth: .2 });
    a.rect(13 + stride - 1, 36, 5, 2, LEATHER[0]); a.rect(11 - stride - 1, 36, 4, 2, LEATHER[1]);
  } else {
    const l = step === 1 ? -1 : 0, r = step === 3 ? -1 : 0;
    a.rect(8, 32 + l, 3, 5, LEATHER[1]); a.rect(13, 32 + r, 3, 5, LEATHER[1]);
    a.rect(7, 36 + l, 4, 2, LEATHER[0]); a.rect(13, 36 + r, 4, 2, LEATHER[0]);
  }
  const y = bob;
  // ローブ
  a.poly([[8, 17 + y], [16, 17 + y], [20, 33], [4, 33]], R);
  a.rect(4, 32, 16, 1, R[1]);
  for (let i = 0; i < 16; i += 3) a.dot(4 + i, 33, R[0]);
  if (dir === 0) { a.rect(11, 18 + y, 2, 14, R[4]); a.rect(8, 24 + y, 8, 1, GOLD[1]); a.dot(12, 24 + y, GOLD[3]); }
  if (dir === 1) { a.poly([[8, 17 + y], [16, 17 + y], [18, 31], [6, 31]], [R[0], R[1], R[2]]); }
  if (dir === 2) { a.rect(15, 19 + y, 2, 13, R[1]); a.rect(7, 24 + y, 10, 1, GOLD[1]); }
  // 腕・杖
  const armX = dir === 2 ? 16 : 19;
  if (cast) {
    a.limb(armX - 3, 19 + y, armX + 2, 12 + y, 1.7, 1.5, R);
    a.ball(armX + 2.5, 10.5 + y, 1.7, 1.7, SKIN);
    a.glow(armX + 2.5, 8 + y, "#fff6c4", 1, .8);
  } else {
    a.limb(armX - 3, 19 + y, armX - 1, 26 + y, 1.8, 1.6, R);
    a.ball(armX - 1, 27 + y, 1.6, 1.6, SKIN);
    a.line(armX, 14 + y, armX - 1, 36, LEATHER[2], 1);
    a.ball(armX, 12 + y, 2, 2, ["#3a70b0", "#7cc8ff", "#e0f8ff"]);
  }
  if (dir !== 2) a.limb(7, 19 + y, 4, 26 + y, 1.8, 1.6, R);
  // 顔
  if (dir === 1) {
    a.ball(12, 13 + y, 5, 4.6, HAIR);
  } else if (dir === 0) {
    a.ball(12, 13 + y, 5, 4.6, SKIN);
    a.rect(7, 10 + y, 10, 2, HAIR[1]); a.rect(6, 11 + y, 2, 5, HAIR[1]); a.rect(16, 11 + y, 2, 5, HAIR[1]);
    a.rect(9, 13 + y, 2, 2, "#17121f"); a.rect(13, 13 + y, 2, 2, "#17121f");
    a.dot(9, 13 + y, "#ffffff"); a.dot(13, 13 + y, "#ffffff");
    a.dot(11, 16 + y, "#c98b6c"); a.dot(12, 16 + y, "#c98b6c");
  } else {
    a.ball(13, 13 + y, 4.6, 4.6, SKIN);
    a.rect(7, 10 + y, 8, 3, HAIR[1]); a.rect(7, 12 + y, 3, 5, HAIR[1]);
    a.rect(14, 13 + y, 2, 2, "#17121f"); a.dot(14, 13 + y, "#ffffff");
  }
  // 帽子(つばと曲がった先端)
  a.ball(12, 9.4 + y, 9.5, 2.5, H, { k: 1 });
  a.poly([[6, 9 + y], [18, 9 + y], [15, 3 + y], [12, -1 + y], [10, 3 + y]], H);
  a.limb(12, 2 + y, dir === 1 ? 8 : 16, 0 + y, 1.5, .8, H);
  a.rect(7, 7 + y, 10, 2, GOLD[1]);
  a.rect(11, 7 + y, 2, 2, GOLD[2]);
  a.outline();
  return a;
}

/** pixelfx の effect に渡す actor(状態異常が輪郭に沿うように)。 */
export function heroActor(col) {
  const art = paintHero(col, 0, 0, 0);
  const data = new Uint8Array(24 * 38);
  for (let i = 0; i < data.length; i++) data[i] = art.px[i] ? 1 : 0;
  return { mask: { w: 24, h: 38, data }, pixels: art.px, x: -12, y: -38, w: 24, h: 38, k: 2, head: [0, -38], chest: [0, -18], eyes: [[9, 13], [13, 13]] };
}

/** 使い魔(サモンライズ) */
export function paintImp(t = 0) {
  const a = new Art(22, 24);
  const y = Math.round(Math.sin(t * 6.28) * 1);
  const B = ["#1c0a30", "#3e1a60", "#6e3498", "#a664d0"];
  a.limb(3, 10 + y, 7, 14 + y, 1.5, 2, B); a.limb(19, 10 + y, 15, 14 + y, 1.5, 2, B);
  a.ball(11, 14 + y, 6, 6.5, B);
  a.poly([[6, 9 + y], [8, 3 + y], [9, 9 + y]], B); a.poly([[13, 9 + y], [14, 3 + y], [16, 9 + y]], B);
  a.glow(9, 13 + y, "#ffe14a", 0, .5); a.glow(13, 13 + y, "#ffe14a", 0, .5);
  a.limb(11, 20 + y, 11, 23, 2, .5, B);
  return a.outline();
}
