// 20 体のボス。すべてこのゲームのオリジナルデザイン。
// paint(a, P): P.b=上下動(-1..1), P.s=sin位相, P.c=詠唱ポーズ(0|1)。足元は canvas 下端の中央。
import { Art } from "./art.js";

const STONE = ["#181a22", "#2e323c", "#494e58", "#6b7078", "#92968f", "#bcbcac"];
const MOSS = ["#1a2c12", "#2e4c1c", "#4c7426", "#78a034", "#aacc4e"];
const SLIME = ["#072a58", "#0e4a8c", "#1a78c0", "#3aaae0", "#7cd8f4", "#d0f6ff"];
const FLAME = ["#7c1c10", "#c83a14", "#f27a1e", "#ffb838", "#ffe67c", "#fff8d0"];
const RED = ["#2c0c12", "#5a1418", "#8c2018", "#bc3a1c", "#e4641e", "#f89c36"];
const CHAR = ["#14100f", "#231917", "#35241f", "#4d322a", "#6a4438"];
const CAP = ["#2a0e3c", "#4e1a64", "#7c2c8c", "#a84ab0", "#d078c8"];
const CREAM = ["#7a6a54", "#ac9a78", "#d4c4a0", "#f0e6c8", "#fff8e4"];
const STEEL = ["#121a2c", "#22344e", "#3a5678", "#5c82a4", "#90b4cc", "#cfe6f0"];
const ICE = ["#143a78", "#1f62a8", "#3f94d4", "#7cc8f0", "#bff0ff", "#ffffff"];
const NIGHT = ["#08081a", "#12122c", "#1e2044", "#2e3260", "#46508a"];
const VOLT = ["#7a4e08", "#c88a10", "#ffcc2c", "#fff08a", "#ffffff"];
const BLACK = ["#08060e", "#141020", "#221a32", "#342848", "#4a3c64"];
const PORC = ["#8c7482", "#bca4ac", "#e4d0d0", "#f8ecea", "#ffffff"];
const PINK = ["#3a0a30", "#6e1656", "#a82a82", "#dc50aa", "#f88ed0"];
const ROBE = ["#16082e", "#2a1252", "#44207e", "#6836aa", "#9460d4"];
const GOLD = ["#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4"];
const BONE = ["#4c4638", "#7a725e", "#a89e84", "#d0c8ac", "#f0ead4", "#ffffff"];
const CRYPT = ["#0c1612", "#16281e", "#223c2c", "#32563e", "#4a7656"];
const LAVA_R = ["#16090a", "#2a1210", "#431c14", "#642a1a", "#8a3e20"];
const DEEP = ["#04141c", "#082a38", "#0e4654", "#1a6a74", "#30968e", "#5cc4a8"];
const BARK = ["#1c1008", "#33200f", "#4f3318", "#6e4a24", "#8e6636"];
const LEAF = ["#0c2410", "#17401a", "#266424", "#3c8a2e", "#62b03a", "#9cd850"];
const METAL = ["#0e1218", "#1e2630", "#323e4c", "#4e5e70", "#7a8ea2", "#b4c8d8"];
const TEAL = ["#043038", "#0a5a62", "#109090", "#2cc8bc", "#8cfce8"];
const PALE = ["#7a6a74", "#a8949c", "#d0bcc0", "#ecdcdc", "#fff4f0"];
const FEATHER = ["#06050c", "#100e1a", "#1e1a2c", "#302a44", "#4a4260"];
const CRIMSON = ["#2c0612", "#560c20", "#861430", "#b82440", "#e04a5a"];
const SHD = ["#04030a", "#0c0816", "#181026", "#261a3c", "#3a2858", "#54397c"];
const FROST = ["#2a2460", "#4c48a0", "#7c7cd0", "#a8b0ec", "#d4dcfc", "#ffffff"];
const STORM = ["#0c1228", "#1a2444", "#2c3c68", "#44608c", "#6c8cb4", "#a4c0dc"];
const CLOUD = ["#28304c", "#454e6c", "#6c7490", "#9ca4b8", "#d0d6e0"];
const VOIDC = ["#050008", "#12041c", "#240a34", "#3c1252", "#5c1c74", "#8a2c9c"];
const MEAT = ["#280414", "#520a24", "#861638", "#b82c50", "#ec5e78"];
const WAR = ["#160a10", "#2a1420", "#422034", "#623050", "#8a4a72"];

const sym = (W, f) => { f(1); f(-1); };

export const BOSS_ART = {
  // 1F 苔むした岩の巨人
  golem: { w: 96, h: 92, paint(a, P) {
    const cx = 48, y = P.b * 1.2, c = P.c;
    a.limb(36, 72, 34, 89, 9, 10, STONE); a.limb(60, 72, 62, 89, 9, 10, STONE);
    a.ball(48, 54 + y, 27, 25, STONE);
    sym(0, (s) => {
      const ax = cx + s * 30, up = c ? -18 : 0;
      a.limb(ax, 40 + y, ax + s * 8, 62 + y + up, 10, 8, STONE);
      a.ball(ax + s * 9, 68 + y + up, 11, 11, STONE);
    });
    a.ball(48, 25 + y, 15, 13, STONE);
    a.speck(48, 54 + y, 26, 24, STONE[1], .04, 3);
    // ひび割れ
    a.line(36, 40 + y, 42, 52 + y, STONE[0]); a.line(42, 52 + y, 38, 62 + y, STONE[0]); a.line(60, 44 + y, 56, 58 + y, STONE[0]);
    // 苔
    a.ball(36, 34 + y, 11, 5, MOSS, { rot: -.3 }); a.ball(60, 33 + y, 12, 5, MOSS, { rot: .3 }); a.ball(48, 15 + y, 12, 4.5, MOSS);
    a.ball(20, 36 + y, 7, 4, MOSS); a.ball(76, 36 + y, 7, 4, MOSS);
    for (let i = 0; i < 6; i++) a.line(26 + i * 8, 36 + y, 26 + i * 8, 40 + y + (i % 3) * 2, MOSS[2]);
    a.glow(42, 25 + y, "#c8ff7a", 1, .9); a.glow(54, 25 + y, "#c8ff7a", 1, .9);
    // 胸のルーン
    a.line(48, 44 + y, 48, 58 + y, "#b0ec6a"); a.line(42, 51 + y, 54, 51 + y, "#b0ec6a"); a.glow(48, 51 + y, "#d8ff9a", 1, .7);
  } },
  // 2F 王冠を載せた泡の王
  slime: { w: 104, h: 84, paint(a, P) {
    const sq = P.s * 2, c = P.c ? -3 : 0;
    a.ball(52, 62 - sq / 2 + c, 44 + sq, 21 - sq / 2 - c, SLIME);
    a.ball(52, 44 - sq / 2 + c, 30 + sq / 2, 30 - sq / 2 - c, SLIME);
    a.ball(14, 76, 8, 4, SLIME); a.ball(90, 77, 10, 4, SLIME);
    // 内部の泡
    for (const [x, y, r] of [[34, 56, 4], [68, 62, 5], [58, 40, 3], [44, 72, 3], [76, 48, 2.5]]) { a.ball(x, y - sq / 2, r, r, [SLIME[2], SLIME[3], SLIME[5]]); }
    a.ball(38, 30 - sq / 2 + c, 6, 3.4, ["#a0e6fa", "#ffffff"], { rot: -.6 });
    // 顔
    a.ball(42, 48 - sq / 2 + c, 5, 6, ["#ffffff", "#ffffff"]); a.ball(62, 48 - sq / 2 + c, 5, 6, ["#ffffff", "#ffffff"]);
    a.rect(42, 47 - sq / 2 + c, 3, 5, "#07203e"); a.rect(62, 47 - sq / 2 + c, 3, 5, "#07203e");
    a.poly([[44, 60 - sq / 2 + c], [60, 60 - sq / 2 + c], [52, 66 - sq / 2 + c]], ["#07203e", "#0e3a60"]);
    // 王冠
    const cy = 13 - sq / 2 + c;
    a.poly([[37, cy + 9], [67, cy + 9], [71, cy - 7], [60, cy + 1], [52, cy - 11], [44, cy + 1], [33, cy - 7]], GOLD);
    a.glow(52, cy + 3, "#ff5a70", 1, .6); a.dot(40, cy + 5, "#7cd8f4"); a.dot(64, cy + 5, "#7cd8f4");
  } },
  // 3F 炎の尾を持つ大トカゲ(横向き)
  salamander: { w: 124, h: 76, paint(a, P) {
    const y = P.b, c = P.c, w = P.s * 3;
    // 炎の尾
    a.limb(44, 52 + y, 24, 46 + y + w, 9, 5, RED);
    a.limb(24, 46 + y + w, 10, 34 + y - w, 5, 2, RED);
    a.poly([[6, 34 + y - w], [14, 22 + y], [12, 12 + y + w], [20, 24 + y], [24, 14 + y - w], [24, 30 + y], [32, 28 + y], [24, 44 + y]], FLAME);
    a.glow(16, 30 + y, "#fff0a0", 2, .5);
    // 足
    a.limb(52, 60 + y, 48, 72, 5, 4, CHAR); a.limb(78, 60 + y, 82, 72, 5, 4, CHAR);
    a.limb(46, 60 + y, 40, 72, 5, 4, RED); a.limb(84, 60 + y, 92, 72, 5, 4, RED);
    // 胴
    a.ball(64, 50 + y, 26, 16, RED);
    a.ball(64, 58 + y, 20, 7, ["#c86a2a", "#f09a40", "#ffd27a"]);
    // 背びれ
    for (let i = 0; i < 6; i++) { const x = 42 + i * 8; a.poly([[x, 38 + y], [x + 7, 38 + y], [x + 3, 28 + y - (i % 2) * 3 + w / 2]], FLAME); }
    // 頭
    const hy = c ? -5 : 0;
    a.limb(86, 46 + y, 96, 40 + y + hy, 11, 9, RED);
    a.ball(102, 41 + y + hy, 13, 10, RED);
    a.poly([[100, 46 + y + hy], [122, 45 + y + hy], [116, 50 + y + hy + (c ? 5 : 1)], [100, 52 + y + hy]], ["#40120e", "#7c1c10"]);
    a.glow(106, 36 + y + hy, "#fff08a", 1, .9); a.rect(107, 36 + y + hy, 1, 2, "#14100f");
    if (c) a.glow(118, 48 + y + hy, "#ffcf60", 2, .9);
    a.poly([[92, 32 + y + hy], [96, 22 + y + hy], [99, 33 + y + hy]], FLAME);
    for (let i = 0; i < 5; i++) a.dot(50 + i * 8, 48 + y - (i % 2) * 2, "#f89c36");
  } },
  // 4F キノコ帽子の魔女
  mycon: { w: 84, h: 96, paint(a, P) {
    const y = P.b * 1.5, c = P.c;
    // ローブ
    a.poly([[32, 48 + y], [52, 48 + y], [66, 94], [18, 94]], ["#1c0a2c", "#34144e", "#50206c", "#6e3088"]);
    for (let i = 0; i < 6; i++) a.poly([[20 + i * 8, 90], [28 + i * 8, 90], [24 + i * 8, 95]], ["#34144e", "#50206c"]);
    // 菌糸の触手
    sym(0, (s) => { a.limb(42 + s * 14, 76, 42 + s * 26, 90 + P.s * 2 * s, 3, 1.5, CREAM); });
    // 腕・杖
    a.limb(52, 54 + y, 66, c ? 36 + y : 58 + y, 3, 2.5, ["#34144e", "#6e3088"]);
    a.line(68, c ? 20 + y : 34 + y, 68, 92, BARK[3], 2);
    a.ball(68, c ? 18 + y : 32 + y, 6, 6, CAP); a.glow(68, c ? 18 + y : 32 + y, "#e8a0f0", 1, .9);
    a.limb(32, 54 + y, 22, 66 + y, 3, 2.5, ["#34144e", "#6e3088"]);
    // キノコの傘(下半分を切り落とす)
    a.ball(42, 30 + y, 34, 22, CAP);
    const cut = Math.round(33 + y);
    for (let yy = cut; yy < 54 + y; yy++) for (let xx = 0; xx < 84; xx++) { const i = Math.round(yy) * 84 + xx; if (i >= 0 && i < a.px.length) { if (Math.abs(xx - 42) > 7 || yy > cut + 6) { if (yy < 50 + y && Math.abs(xx - 42) > 18) a.px[i] = 0; } } }
    a.ball(42, 34 + y, 30, 3.5, CREAM);
    for (let i = 0; i < 9; i++) a.line(16 + i * 6.5, 33 + y, 16 + i * 6.5, 37 + y, CREAM[0]);
    for (const [x, yy, r] of [[28, 20, 5], [46, 14, 6], [62, 24, 4], [36, 27, 3], [54, 28, 3], [16, 27, 3]]) a.ball(x, yy + y, r, r * .8, CREAM);
    // 顔
    a.ball(42, 45 + y, 9, 9, PALE);
    a.rect(32, 40 + y, 3, 12, "#5e1f78"); a.rect(49, 40 + y, 3, 12, "#5e1f78");
    a.glow(38, 44 + y, "#c8ff60", 0, .9); a.glow(46, 44 + y, "#c8ff60", 0, .9);
    a.line(38, 50 + y, 46, 50 + y, "#3a1a3a");
  } },
  // 5F 氷の騎士
  iceknight: { w: 92, h: 100, paint(a, P) {
    const y = P.b, c = P.c;
    // マント
    a.poly([[34, 36 + y], [58, 36 + y], [70, 92 + P.s * 2], [22, 92 - P.s * 2]], ["#0a1830", "#142a52", "#1f3f78"]);
    a.limb(38, 68, 36, 94, 7, 7, STEEL); a.limb(54, 68, 56, 94, 7, 7, STEEL);
    a.rect(28, 92, 14, 6, STEEL[1]); a.rect(50, 92, 14, 6, STEEL[1]);
    a.ball(46, 50 + y, 17, 22, STEEL);
    a.line(46, 30 + y, 46, 70 + y, STEEL[1]);
    a.poly([[34, 40 + y], [58, 40 + y], [46, 58 + y]], ICE);
    a.glow(46, 46 + y, "#c8f4ff", 2, .8);
    // 肩の氷
    sym(0, (s) => {
      a.ball(46 + s * 18, 36 + y, 9, 8, STEEL);
      a.poly([[46 + s * 12, 34 + y], [46 + s * 28, 28 + y], [46 + s * 22, 14 + y]], ICE);
      a.poly([[46 + s * 22, 34 + y], [46 + s * 32, 36 + y], [46 + s * 32, 20 + y]], ICE);
    });
    // 兜
    a.ball(46, 22 + y, 12, 13, STEEL);
    a.rect(36, 21 + y, 20, 3, "#06101e"); a.glow(41, 22 + y, "#9ce8ff", 0, .9); a.glow(51, 22 + y, "#9ce8ff", 0, .9);
    a.poly([[42, 12 + y], [50, 12 + y], [46, -2 + y]], ICE);
    // 大剣
    const sx = 74, sy = c ? -16 : 0;
    a.limb(62, 42 + y, sx, 52 + y + sy, 5, 4, STEEL);
    a.poly([[sx - 4, 50 + y + sy], [sx + 4, 50 + y + sy], [sx + 2, 8 + y + sy], [sx, 2 + y + sy], [sx - 2, 8 + y + sy]], ICE);
    a.rect(sx - 8, 50 + y + sy, 16, 3, STEEL[3]);
    a.limb(30, 42 + y, 22, 58 + y, 5, 4, STEEL);
  } },
  // 6F 雷雲の大鴉
  raven: { w: 132, h: 96, paint(a, P) {
    const w = P.s * 10, y = 8 + P.b * 3, c = P.c;
    sym(0, (s) => {
      const X = (d) => 66 + s * d;
      a.poly([[X(10), 38 + y], [X(38), 22 + y + w], [X(62), 26 + y + w * 1.4], [X(52), 44 + y + w], [X(40), 40 + y + w], [X(34), 56 + y + w * .6], [X(22), 50 + y], [X(12), 58 + y]], BLACK);
      for (let i = 0; i < 4; i++) { const xx = X(24 + i * 10); a.line(xx, 30 + y + w, xx + s * 2, 40 + y + w, "#ffd23c"); }
      a.glow(X(60), 28 + y + w * 1.4, "#fff08a", 1, .7);
      a.limb(X(6), 66 + y, X(10), 80 + y, 2, 1.5, VOLT);
    });
    a.ball(66, 50 + y, 17, 21, BLACK);
    a.poly([[58, 66 + y], [74, 66 + y], [76, 84 + y], [66, 78 + y], [56, 84 + y]], BLACK);
    a.ball(66, 28 + y, 13, 12, BLACK);
    a.poly([[60, 30 + y], [72, 30 + y], [66, 46 + y + (c ? 2 : 0)]], VOLT);
    if (c) a.poly([[61, 36 + y], [71, 36 + y], [66, 50 + y]], ["#2a1a0c", "#5e3a0c"]);
    a.glow(59, 26 + y, "#fff08a", 1, 1); a.glow(73, 26 + y, "#fff08a", 1, 1);
    // 胸の稲妻
    a.line(66, 50 + y, 61, 58 + y, "#ffe14a", 2); a.line(61, 58 + y, 68, 60 + y, "#ffe14a", 2); a.line(68, 60 + y, 62, 70 + y, "#ffe14a", 2);
    a.poly([[60, 18 + y], [62, 8 + y], [66, 17 + y], [70, 6 + y], [72, 18 + y]], BLACK);
  } },
  // 7F 呪いの人形
  doll: { w: 76, h: 92, paint(a, P) {
    const y = P.b * 1.5, tilt = P.s * 1.5, c = P.c;
    // 吊り糸
    for (const x of [18, 38, 58]) a.line(x, 0, 38 + (x - 38) * .6, 20 + y, "#c8b8c8");
    // ドレス
    a.poly([[28, 46 + y], [48, 46 + y], [66, 88], [10, 88]], PINK);
    for (let i = 0; i < 7; i++) { a.ball(14 + i * 8, 88, 5, 3, ["#a82a82", "#f88ed0", "#ffe0f0"]); }
    a.line(38, 46 + y, 38, 84, PINK[0]);
    a.rect(30, 44 + y, 16, 4, PINK[0]);
    // 足(棒)
    a.rect(30, 86, 3, 5, PORC[1]); a.rect(44, 86, 3, 5, PORC[1]);
    // 腕(球体関節)
    sym(0, (s) => {
      const hy = c ? 24 + y : 52 + y;
      a.limb(38 + s * 11, 42 + y, 38 + s * 22, hy + 8, 2.5, 2, PORC);
      a.ball(38 + s * 22, hy + 10, 3, 3, PORC);
      a.ball(38 + s * 11, 42 + y, 3, 3, PINK);
    });
    // 頭
    a.ball(38 + tilt, 27 + y, 16, 16, PORC);
    // ボンネット
    a.ball(38 + tilt, 19 + y, 19, 12, PINK);
    for (let i = 0; i < 9; i++) a.dot(21 + i * 4 + tilt, 25 + y + (i % 2), "#ffe0f0");
    a.ball(38 + tilt, 30 + y, 13, 12, PORC);
    // 縫い目の眼
    a.ball(32 + tilt, 29 + y, 4, 4, ["#120614", "#2c1030"]); a.glow(32 + tilt, 29 + y, "#ff5ad0", 0, .9);
    a.line(41 + tilt, 26 + y, 47 + tilt, 32 + y, "#120614"); a.line(47 + tilt, 26 + y, 41 + tilt, 32 + y, "#120614");
    a.line(32 + tilt, 37 + y, 44 + tilt, 37 + y, "#5a1040");
    for (let i = 0; i < 4; i++) a.line(33 + i * 3 + tilt, 35 + y, 33 + i * 3 + tilt, 39 + y, "#5a1040");
    a.line(30 + tilt, 19 + y, 36 + tilt, 44 + y, PORC[0]);
  } },
  // 8F 時の司書: 頭上に時計、巨大な本
  librarian: { w: 92, h: 104, paint(a, P) {
    const y = -6 + P.b * 3, c = P.c;
    // 時計の輪
    const hy = 24 + y;
    for (let i = 0; i < 40; i++) { const t = i / 40 * 6.283; a.set(46 + Math.cos(t) * 26, hy + Math.sin(t) * 26, i % 10 === 0 ? 0xffffe066 : 0xff86520c); }
    for (let i = 0; i < 12; i++) { const t = i / 12 * 6.283; a.glow(46 + Math.cos(t) * 26, hy + Math.sin(t) * 26, "#ffe066", 0, .4); }
    a.line(46, hy, 46 + Math.cos(P.ph * 6.283) * 22, hy + Math.sin(P.ph * 6.283) * 22, "#fff6c4");
    a.line(46, hy, 46 + Math.cos(P.ph * .5) * 15, hy + Math.sin(P.ph * .5) * 15, "#c48412", 2);
    // 頭巾とローブ
    a.poly([[34, 40 + y], [58, 40 + y], [70, 104], [58, 96], [46, 104], [34, 96], [22, 104]], ROBE);
    a.line(46, 40 + y, 46, 96, ROBE[0]);
    a.ball(46, 32 + y, 15, 15, ROBE);
    a.ball(46, 35 + y, 9, 10, ["#05030a", "#0c0816"], { k: .3 });
    a.glow(42, 35 + y, "#d8a0ff", 0, 1); a.glow(50, 35 + y, "#d8a0ff", 0, 1);
    for (let i = 0; i < 4; i++) a.dot(40 + i * 4, 18 + y, GOLD[4]);
    a.poly([[34, 22 + y], [58, 22 + y], [46, 13 + y]], GOLD);
    // 袖と本
    const by = c ? 54 + y : 66 + y;
    a.limb(30, 50 + y, 24, by, 6, 5, ROBE); a.limb(62, 50 + y, 68, by, 6, 5, ROBE);
    a.poly([[14, by - 6], [46, by + 2], [78, by - 6], [78, by + 12], [46, by + 20], [14, by + 12]], ["#3a1a08", "#6a3010", "#8c4614"]);
    a.poly([[18, by - 5], [46, by + 2], [74, by - 5], [74, by + 8], [46, by + 15], [18, by + 8]], CREAM);
    a.line(46, by + 2, 46, by + 15, "#6a3010");
    for (let i = 0; i < 3; i++) { a.line(23, by + i * 3, 40, by + 4 + i * 3, "#6b2cc0"); a.line(52, by + 4 + i * 3, 69, by + i * 3, "#6b2cc0"); }
    if (c) a.glow(46, by - 2, "#ecc8ff", 2, 1);
  } },
  // 9F 骸の司祭
  necro: { w: 88, h: 104, paint(a, P) {
    const y = P.b * 1.5, c = P.c;
    a.poly([[30, 48 + y], [54, 48 + y], [66, 102], [18, 102]], ["#0a1410", "#14261c", "#203a2a", "#2e5038"]);
    a.poly([[38, 48 + y], [46, 48 + y], [48, 102], [36, 102]], GOLD);
    for (let i = 0; i < 5; i++) { const yy = 58 + i * 9; a.line(38, yy + y, 46, yy + y, "#4a2c08"); a.glow(42, yy + 4 + y, "#6cb896", 0, .3); }
    // 肋骨
    a.ball(42, 46 + y, 13, 12, BONE);
    for (let i = 0; i < 4; i++) { a.line(32, 40 + i * 4 + y, 52, 40 + i * 4 + y, "#2a2820"); }
    a.line(42, 38 + y, 42, 56 + y, BONE[4]);
    // 頭蓋骨とミトラ
    a.ball(42, 26 + y, 12, 12, BONE);
    a.rect(35, 34 + y, 14, 4, BONE[3]);
    for (let i = 0; i < 4; i++) a.line(36 + i * 4, 34 + y, 36 + i * 4, 38 + y, "#2a2820");
    a.ball(37, 26 + y, 3.4, 4, ["#040806", "#0a140e"], { k: .2 }); a.ball(47, 26 + y, 3.4, 4, ["#040806", "#0a140e"], { k: .2 });
    a.glow(37, 26 + y, "#7cffc0", 0, 1); a.glow(47, 26 + y, "#7cffc0", 0, 1);
    a.poly([[40, 30 + y], [44, 30 + y], [42, 33 + y]], ["#2a2820", "#2a2820"]);
    a.poly([[30, 20 + y], [54, 20 + y], [50, 2 + y], [42, -4 + y], [34, 2 + y]], ["#16302a", "#25604a", "#3e8a6c", "#6cb896"]);
    a.poly([[40, 18 + y], [44, 18 + y], [44, 2 + y], [40, 2 + y]], GOLD);
    a.rect(36, 8 + y, 12, 3, GOLD[3]);
    // 骨の手と杖
    const hy = c ? 34 : 56;
    a.limb(54, 46 + y, 70, hy + y, 2.5, 2, BONE);
    a.line(72, 16 + y, 72, 100, "#3a352c", 3);
    a.ball(72, 12 + y, 7, 7, BONE);
    a.glow(70, 12 + y, "#7cffc0", 0, .9); a.glow(75, 12 + y, "#7cffc0", 0, .9);
    a.limb(30, 46 + y, 16, 60 + y, 2.5, 2, BONE);
    for (let i = 0; i < 3; i++) a.line(16, 60 + y, 12 + i * 3, 66 + y, BONE[3]);
  } },
  // 10F 溶岩の巨竜
  drake: { w: 160, h: 124, paint(a, P) {
    const y = P.b * 1.5, w = P.s * 6, c = P.c;
    // 翼
    sym(0, (s) => {
      const X = (d) => 80 + s * d;
      a.poly([[X(14), 44 + y], [X(46), 8 + y + w], [X(76), 22 + y + w], [X(66), 40 + y + w], [X(60), 34 + y + w], [X(52), 58 + y], [X(44), 48 + y], [X(32), 70 + y]], LAVA_R);
      a.line(X(14), 44 + y, X(46), 8 + y + w, LAVA_R[4], 2); a.line(X(46), 8 + y + w, X(52), 58 + y, LAVA_R[3]); a.line(X(46), 8 + y + w, X(68), 38 + y + w, LAVA_R[3]);
    });
    // 尾
    a.limb(104, 96, 136, 108 + w / 2, 9, 3, LAVA_R);
    a.poly([[134, 100], [152, 106 + w / 2], [136, 114]], LAVA_R);
    // 脚
    sym(0, (s) => {
      a.limb(80 + s * 24, 84 + y, 80 + s * 32, 116, 11, 8, LAVA_R);
      for (let i = 0; i < 3; i++) a.poly([[80 + s * 28 + i * 5 - 5, 118], [80 + s * 28 + i * 5, 118], [80 + s * 28 + i * 5 - 2, 123]], BONE);
    });
    // 胴
    a.ball(80, 72 + y, 32, 32, LAVA_R);
    // 溶岩の亀裂
    const G = (x0, y0, x1, y1) => { a.line(x0, y0 + y, x1, y1 + y, "#ff8c2a", 2); a.line(x0, y0 + y, x1, y1 + y, "#ffd25a", 1); };
    G(66, 56, 76, 70); G(76, 70, 68, 86); G(76, 70, 92, 78); G(92, 78, 90, 96); G(96, 56, 92, 78);
    a.glow(78, 74 + y, "#ffc060", 3, .6);
    // 首と頭
    const hy = c ? -8 : 0;
    a.limb(80, 50 + y, 80, 34 + y + hy, 14, 11, LAVA_R);
    a.ball(80, 26 + y + hy, 18, 14, LAVA_R);
    a.poly([[66, 30 + y + hy], [94, 30 + y + hy], [90, 46 + y + hy + (c ? 4 : 0)], [70, 46 + y + hy + (c ? 4 : 0)]], LAVA_R);
    if (c) { a.poly([[70, 40 + y + hy], [90, 40 + y + hy], [86, 48 + y + hy], [74, 48 + y + hy]], FLAME); a.glow(80, 44 + y + hy, "#fff0a0", 3, 1); }
    for (let i = 0; i < 4; i++) { a.poly([[70 + i * 6, 41 + y + hy], [74 + i * 6, 41 + y + hy], [72 + i * 6, 45 + y + hy]], BONE); }
    sym(0, (s) => {
      a.poly([[80 + s * 10, 16 + y + hy], [80 + s * 16, 20 + y + hy], [80 + s * 28, -2 + y + hy]], BONE);
      a.glow(80 + s * 8, 25 + y + hy, "#ffe066", 1, 1);
    });
    for (let i = 0; i < 4; i++) a.poly([[80 - 5, 44 + i * 12 + y], [80 + 5, 44 + i * 12 + y], [80, 37 + i * 12 + y]], ["#642a1a", "#8a3e20", "#f0a040"]);
  } },
  // 11F 深淵の巨大な眼と触手
  kraken: { w: 150, h: 112, paint(a, P) {
    const y = P.b * 2, s0 = P.s, c = P.c;
    const tent = (x0, x1, y1, ph) => {
      let px = x0, py = 100, r = 8;
      const n = 7;
      for (let i = 1; i <= n; i++) {
        const t = i / n, w = Math.sin(P.ph * 6.283 + ph + t * 4) * 9 * t;
        const nx = x0 + (x1 - x0) * t + w, ny = 100 + (y1 - 100) * t;
        const nr = 8 * (1 - t) + 1.5;
        a.limb(px, py, nx, ny, r, nr, DEEP);
        if (i % 2) a.dot(nx, ny, "#a8f0d0");
        px = nx; py = ny; r = nr;
      }
    };
    tent(36, 10, 18 + (c ? -12 : 8), 0); tent(114, 140, 18 + (c ? -12 : 8), 1.6); tent(24, 4, 64, 3); tent(126, 146, 64, 4.6); tent(52, 34, 106, 2); tent(98, 118, 106, 5);
    a.ball(75, 96, 54, 14, ["#04141c", "#082a38", "#0e4654"]);
    a.ball(75, 58 + y, 42, 42, DEEP);
    a.speck(75, 58 + y, 41, 41, DEEP[1], .05, 5);
    // 巨大な眼
    a.ball(75, 54 + y, 26, 24, ["#7cc8a0", "#c4f0d0", "#f4fff0", "#ffffff"], { k: .9, amb: .4 });
    a.ball(75 + s0 * 2, 54 + y, 13, 21, ["#02060a", "#08202c"], { k: .4 });
    a.glow(75 + s0 * 2, 54 + y, "#58ccac", 2, .9);
    a.rect(76 + s0 * 2, 44 + y, 3, 4, "#ffffff");
    // まぶた
    a.ball(75, 30 + y, 30, 8, DEEP); a.ball(75, 79 + y, 28, 6, DEEP);
  } },
  // 12F 千年の樹
  treant: { w: 150, h: 136, paint(a, P) {
    const y = P.b, sway = P.s * 2, c = P.c;
    // 根
    sym(0, (s) => {
      a.limb(75 + s * 16, 112, 75 + s * 44, 132, 9, 3, BARK);
      a.limb(75 + s * 10, 118, 75 + s * 26, 134, 7, 3, BARK);
    });
    // 幹
    a.limb(75, 118, 75, 54 + y, 26, 22, BARK);
    for (let i = 0; i < 7; i++) a.line(56 + i * 6, 62 + y, 54 + i * 6.4, 120, BARK[1]);
    // 枝腕
    sym(0, (s) => {
      const hy = c ? 26 : 52;
      a.limb(75 + s * 22, 68 + y, 75 + s * 48, hy + y + sway * s, 8, 4, BARK);
      a.limb(75 + s * 48, hy + y + sway * s, 75 + s * 64, hy - 14 + y, 4, 1.5, BARK);
      a.limb(75 + s * 48, hy + y + sway * s, 75 + s * 66, hy + 8 + y, 3, 1, BARK);
    });
    // 樹冠
    for (const [x, yy, rx, ry] of [[75, 28, 42, 26], [40, 40, 24, 18], [110, 40, 24, 18], [58, 14, 22, 14], [94, 14, 22, 14]]) a.ball(x + sway, yy + y, rx, ry, LEAF);
    a.speck(75 + sway, 30 + y, 58, 34, LEAF[1], .07, 11);
    a.speck(75 + sway, 26 + y, 56, 30, LEAF[5], .04, 12);
    for (const [x, yy] of [[50, 24], [92, 18], [108, 44], [36, 44], [70, 8]]) { a.ball(x + sway, yy + y, 3, 3, ["#a82a60", "#ec6088", "#ffc0d0"]); a.glow(x + sway, yy + y, "#ffd0e0", 0, .3); }
    // 顔
    a.ball(62, 74 + y, 7, 6, ["#080402", "#160c04"], { k: .2 }); a.ball(88, 74 + y, 7, 6, ["#080402", "#160c04"], { k: .2 });
    a.glow(62, 74 + y, "#c8ff60", 1, 1); a.glow(88, 74 + y, "#c8ff60", 1, 1);
    a.limb(54, 66 + y, 70, 70 + y, 2.5, 2, BARK); a.limb(96, 66 + y, 80, 70 + y, 2.5, 2, BARK);
    a.ball(75, 96 + y, 12, c ? 10 : 6, ["#080402", "#160c04"], { k: .2 });
    for (let i = 0; i < 4; i++) a.poly([[66 + i * 5, 90 + y], [70 + i * 5, 90 + y], [68 + i * 5, 94 + y]], BARK);
    a.ball(45, 96 + y, 6, 3, MOSS); a.ball(100, 106 + y, 8, 3, MOSS);
  } },
  // 13F 機神
  mech: { w: 136, h: 120, paint(a, P) {
    const y = P.b, c = P.c, ph = P.ph;
    // キャタピラ
    a.rect(26, 100, 84, 18, METAL[1]);
    a.ball(30, 109, 9, 9, METAL); a.ball(106, 109, 9, 9, METAL);
    for (let i = 0; i < 10; i++) a.rect(26 + ((i * 9 + Math.floor(ph * 9)) % 84), 100, 4, 18, METAL[2]);
    a.rect(26, 106, 84, 3, METAL[0]);
    // 胴
    a.poly([[38, 96], [98, 96], [108, 44 + y], [90, 28 + y], [46, 28 + y], [28, 44 + y]], METAL);
    a.line(68, 28 + y, 68, 96, METAL[0]);
    a.poly([[44, 80], [92, 80], [86, 96], [50, 96]], ["#6a5008", "#c8a010"]);
    for (let i = 0; i < 5; i++) a.poly([[48 + i * 9, 96], [52 + i * 9, 96], [56 + i * 9, 80], [52 + i * 9, 80]], ["#0e1218", "#1e2630"]);
    // コア
    a.ball(68, 58 + y, 15, 15, METAL);
    a.ball(68, 58 + y, 10, 10, TEAL, { amb: .4 });
    a.glow(68, 58 + y, "#b4fff0", 3, 1);
    // 肩の砲
    sym(0, (s) => {
      const up = c ? -14 : 0;
      a.ball(68 + s * 44, 42 + y, 16, 15, METAL);
      a.limb(68 + s * 44, 42 + y, 68 + s * 56, 16 + y + up, 8, 6, METAL);
      a.glow(68 + s * 57, 12 + y + up, "#4ce8d8", 2, c ? 1 : .5);
      a.limb(68 + s * 46, 54 + y, 68 + s * 54, 78 + y, 7, 6, METAL);
      a.poly([[68 + s * 46, 76 + y], [68 + s * 62, 76 + y], [68 + s * 58, 90 + y], [68 + s * 50, 90 + y]], METAL);
    });
    // 頭
    a.poly([[54, 30 + y], [82, 30 + y], [78, 12 + y], [58, 12 + y]], METAL);
    a.rect(58, 18 + y, 20, 5, "#04161a");
    a.glow(63 + (P.s + 1) * 5, 20 + y, "#ff4a5a", 1, 1);
    a.line(74, 12 + y, 80, 2 + y, METAL[3], 2); a.glow(80, 2 + y, "#ff4a5a", 0, .8);
    for (const [x, yy] of [[40, 50], [96, 50], [44, 74], [92, 74]]) a.dot(x, yy + y, METAL[5]);
  } },
  // 14F 堕天使
  angel: { w: 148, h: 108, paint(a, P) {
    const y = -2 + P.b * 3, w = P.s * 5, c = P.c;
    // 翼
    sym(0, (s) => {
      const X = (d) => 74 + s * d;
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        a.limb(X(14), 42 + y, X(30 + 42 * Math.cos(t * 1.2)), 16 + y + 60 * t + w * (1 - t), 7 - i * .3, 2, FEATHER);
      }
      a.limb(X(14), 42 + y, X(46), 16 + y + w, 7, 4, FEATHER);
      a.limb(X(46), 16 + y + w, X(70), 18 + y + w * 1.3, 4, 1, FEATHER);
      for (let i = 0; i < 4; i++) a.dot(X(30 + i * 9), 18 + y + i, "#d84a52");
    });
    // ドレス
    a.poly([[62, 44 + y], [86, 44 + y], [96, 102], [84, 96], [74, 104], [64, 96], [52, 102]], PALE);
    a.poly([[68, 44 + y], [80, 44 + y], [82, 100], [66, 100]], CRIMSON);
    a.ball(74, 44 + y, 13, 12, PALE);
    // 腕と槍
    const hy = c ? 28 : 56;
    a.limb(86, 42 + y, 104, hy + y, 3, 2.5, PALE);
    a.line(106, hy - 34 + y, 106, hy + 40 + y, "#cfc4b4", 2);
    a.poly([[102, hy - 34 + y], [110, hy - 34 + y], [106, hy - 50 + y]], ["#a4243c", "#f08a78", "#fff4e0"]);
    a.limb(62, 42 + y, 50, 56 + y, 3, 2.5, PALE);
    // 頭
    a.ball(74, 28 + y, 10, 11, PALE);
    a.poly([[64, 24 + y], [84, 24 + y], [90, 52 + y], [80, 34 + y], [68, 34 + y], [58, 52 + y]], ["#0e0a16", "#241a34", "#3a2c50"]);
    a.ball(74, 21 + y, 11, 6, ["#0e0a16", "#241a34", "#3a2c50"]);
    a.glow(70, 29 + y, "#ff5a5a", 0, 1); a.glow(78, 29 + y, "#ff5a5a", 0, 1);
    a.line(70, 31 + y, 70, 35 + y, "#7c1c30");
    // 割れた光輪
    for (let i = 0; i < 36; i++) { if (i > 10 && i < 15) continue; const t = i / 36 * 6.283; a.glow(74 + Math.cos(t) * 15, 9 + y + Math.sin(t) * 4, "#ffcf60", 0, .5); }
  } },
  // 15F 双面の影
  umbra: { w: 112, h: 112, paint(a, P) {
    const y = P.b * 3, ph = P.ph, c = P.c;
    // 影の触手
    for (let i = 0; i < 7; i++) {
      const X = 12 + i * 15, w = Math.sin(ph * 6.283 + i) * 6;
      a.limb(X * .5 + 28, 72 + y, X + w, 108, 7, 2, SHD);
    }
    a.ball(56, 56 + y, 34, 38, SHD);
    a.speck(56, 62 + y, 32, 34, SHD[5], .03, 8);
    // 腕
    sym(0, (s) => {
      const up = c ? -18 : 0;
      a.limb(56 + s * 28, 50 + y, 56 + s * 48, 66 + y + up, 6, 3, SHD);
      for (let i = 0; i < 3; i++) a.line(56 + s * 48, 66 + y + up, 56 + s * (50 + i * 3), 76 + y + up - i * 2, SHD[4], 2);
    });
    // 双面の仮面: 左半分は白、右半分は黒
    a.ball(56, 40 + y, 22, 26, PORC);
    for (let yy = 0; yy < 112; yy++) for (let xx = 56; xx < 84; xx++) { const i = yy * 112 + xx; if (a.px[i] && yy > 10 + y && yy < 70 + y) { const v = Math.hypot((xx - 56) / 22, (yy - 40 - y) / 26); if (v <= 1) a.px[i] = v > .85 ? 0xff26101a : v > .5 ? 0xff120a0c : 0xff1a0e12; } }
    a.line(56, 14 + y, 56, 66 + y, "#c8b4e0");
    // 眼と口
    a.poly([[42, 34 + y], [52, 38 + y], [44, 44 + y]], ["#0a0812", "#14101e"]); a.glow(46, 39 + y, "#c684ff", 0, 1);
    a.poly([[70, 34 + y], [60, 38 + y], [68, 44 + y]], ["#d8c8e8", "#fff"]); a.glow(66, 39 + y, "#ff4a7a", 0, 1);
    a.poly([[44, 52 + y], [55, 52 + y], [55, 58 + y], [48, 56 + y]], ["#0a0812", "#14101e"]);
    a.poly([[57, 52 + y], [68, 52 + y], [64, 56 + y], [57, 58 + y]], ["#d8c8e8", "#fff"]);
    // 角
    a.limb(42, 20 + y, 28, 2 + y, 4, 1, PORC); a.limb(70, 20 + y, 84, 2 + y, 4, 1, SHD);
  } },
  // 16F 凍界の女王
  queen: { w: 108, h: 120, paint(a, P) {
    const y = P.b * 1.5, c = P.c, s0 = P.s;
    // ドレス(氷の裾)
    a.poly([[42, 54 + y], [66, 54 + y], [92, 116], [16, 116]], FROST);
    for (let i = 0; i < 8; i++) { const x = 14 + i * 11; a.poly([[x, 112], [x + 12, 112], [x + 6, 92 - (i % 3) * 10]], ICE); }
    a.line(54, 56 + y, 54, 100, FROST[1]);
    for (let i = 0; i < 4; i++) { a.line(48 - i * 4, 66 + i * 10 + y, 54, 72 + i * 10 + y, FROST[4]); a.line(60 + i * 4, 66 + i * 10 + y, 54, 72 + i * 10 + y, FROST[4]); }
    a.ball(54, 50 + y, 13, 12, FROST);
    // 肩の結晶
    sym(0, (s) => { a.poly([[54 + s * 8, 42 + y], [54 + s * 24, 44 + y], [54 + s * 22, 26 + y]], ICE); });
    // 腕と杖
    const hy = c ? 24 : 50;
    a.limb(66, 46 + y, 84, hy + y, 3, 2.5, PALE);
    a.line(86, hy - 22 + y, 86, hy + 56, "#c8d4f4", 2);
    a.poly([[80, hy - 22 + y], [92, hy - 22 + y], [86, hy - 38 + y + s0]], ICE);
    a.glow(86, hy - 26 + y, "#ffffff", 1, .9);
    a.limb(42, 46 + y, 28, 60 + y, 3, 2.5, PALE);
    // 顔と髪
    a.poly([[42, 22 + y], [66, 22 + y], [72, 62 + y], [62, 44 + y], [46, 44 + y], [36, 62 + y]], ["#7878d0", "#a8b0ec", "#e4ecff", "#ffffff"]);
    a.ball(54, 32 + y, 10, 11, ["#a8a4cc", "#d4d4ec", "#f4f4ff"]);
    a.glow(50, 32 + y, "#8cdcff", 0, 1); a.glow(58, 32 + y, "#8cdcff", 0, 1);
    a.line(52, 38 + y, 56, 38 + y, "#5a58a0");
    // 王冠
    const C = [[40, 22], [46, 4], [50, 18], [54, -2], [58, 18], [62, 4], [68, 22]];
    a.poly(C.map(([x, yy]) => [x, yy + y + 2]), ICE);
    a.glow(54, 14 + y, "#ffffff", 1, 1);
  } },
  // 17F 嵐の巨神
  titan: { w: 164, h: 140, paint(a, P) {
    const y = P.b * 1.5, c = P.c, ph = P.ph;
    // 雲の下半身
    for (const [x, yy, r] of [[82, 118, 46], [44, 124, 28], [120, 124, 30], [62, 106, 26], [104, 106, 26]]) a.ball(x, yy, r, r * .55, CLOUD);
    // 胴
    a.ball(82, 72 + y, 42, 38, STORM);
    // 胸筋の線
    a.line(82, 50 + y, 82, 104 + y, STORM[0], 2);
    a.line(52, 66 + y, 80, 74 + y, STORM[1]); a.line(112, 66 + y, 84, 74 + y, STORM[1]);
    // 刻まれた雷
    a.line(58, 80 + y, 68, 92 + y, "#ffe14a", 2); a.line(106, 80 + y, 96, 92 + y, "#ffe14a", 2);
    // 腕
    sym(0, (s) => {
      const up = c ? -34 : 0;
      a.ball(82 + s * 44, 46 + y, 18, 17, STORM);
      a.limb(82 + s * 50, 54 + y, 82 + s * 64, 84 + y + up, 15, 12, STORM);
      a.ball(82 + s * 66, 94 + y + up, 14, 14, STORM);
      if (c) { a.glow(82 + s * 66, 90 + y + up, "#fff08a", 3, 1); }
      a.line(82 + s * 48, 58 + y, 82 + s * 60, 74 + y + up, "#7cc8ff");
    });
    // 頭と稲妻の髭
    a.ball(82, 28 + y, 19, 20, STORM);
    a.rect(68, 22 + y, 28, 3, STORM[0]);
    a.glow(74, 26 + y, "#ffffff", 1, 1); a.glow(90, 26 + y, "#ffffff", 1, 1);
    const Z = Math.floor(ph * 4) % 2;
    for (let i = 0; i < 5; i++) {
      const x = 70 + i * 6;
      a.line(x, 38 + y, x + (i % 2 ? 3 : -3) * (Z ? 1 : -1), 48 + y, "#fff08a", 1);
      a.line(x + (i % 2 ? 3 : -3) * (Z ? 1 : -1), 48 + y, x, 58 + y, "#7cc8ff", 1);
    }
    // 雷の冠
    for (let i = 0; i < 7; i++) { const x = 62 + i * 6.6; a.poly([[x - 3, 14 + y], [x + 3, 14 + y], [x, 2 + y - (i % 2) * 4]], VOLT); }
    a.ball(82, 13 + y, 19, 3.5, CLOUD);
  } },
  // 18F 魔導王
  archmage: { w: 112, h: 116, paint(a, P) {
    const y = -2 + P.b * 3, c = P.c, ph = P.ph;
    // 大きな襟とローブ
    a.poly([[40, 46 + y], [72, 46 + y], [90, 114], [22, 114]], ROBE);
    a.poly([[50, 48 + y], [62, 48 + y], [68, 114], [44, 114]], GOLD);
    for (let i = 0; i < 5; i++) { a.glow(56, 62 + i * 11 + y, "#ecc8ff", 0, .6); a.line(46 + i, 58 + i * 11 + y, 66 - i, 58 + i * 11 + y, GOLD[0]); }
    sym(0, (s) => {
      a.poly([[56 + s * 6, 44 + y], [56 + s * 34, 16 + y], [56 + s * 28, 54 + y]], ROBE);
      a.line(56 + s * 6, 44 + y, 56 + s * 34, 16 + y, GOLD[4]);
      a.line(56 + s * 34, 16 + y, 56 + s * 28, 54 + y, GOLD[4]);
      // 袖
      a.limb(56 + s * 18, 54 + y, 56 + s * 36, c ? 36 + y : 72 + y, 7, 8, ROBE);
    });
    // 顔(白髭)
    a.ball(56, 36 + y, 10, 11, ["#a88870", "#d8b8a0", "#f4e0d0"]);
    a.poly([[46, 40 + y], [66, 40 + y], [60, 66 + y], [56, 72 + y], [52, 66 + y]], BONE);
    a.glow(52, 34 + y, "#ffe066", 0, 1); a.glow(60, 34 + y, "#ffe066", 0, 1);
    a.line(48, 30 + y, 54, 32 + y, BONE[5]); a.line(64, 30 + y, 58, 32 + y, BONE[5]);
    // 冠
    a.poly([[44, 28 + y], [68, 28 + y], [72, 10 + y], [64, 20 + y], [56, 4 + y], [48, 20 + y], [40, 10 + y]], GOLD);
    a.glow(56, 18 + y, "#ff60e0", 1, .9);
    // 杖
    const hy = c ? 2 : 22;
    a.line(94, hy + y, 92, 112, BARK[3], 2);
    for (let i = 0; i < 30; i++) { const t = i / 30 * 6.283; a.set(94 + Math.cos(t) * 8, hy + y + Math.sin(t) * 8, 0xfff0b424); }
    a.glow(94, hy + y, "#fff6c4", 2, 1);
    // 浮遊する球
    const cols = ["#ff7a2a", "#7cd4ff", "#ffe14a", "#8a5ad0"];
    for (let i = 0; i < 4; i++) { const t = ph * 6.283 + i * 1.57, x = 56 + Math.cos(t) * 48, yy = 62 + y + Math.sin(t) * 14; a.ball(x, yy, 4, 4, ["#120e18", cols[i], "#ffffff"], { amb: .3 }); a.glow(x, yy, cols[i], 0, .6); }
  } },
  // 19F 虚無の顎
  maw: { w: 168, h: 144, paint(a, P) {
    const y = P.b * 2, ph = P.ph, c = P.c, open = c ? 10 : 2 + P.s * 2;
    // 降着円盤
    for (let i = 0; i < 90; i++) { const t = i / 90 * 6.283 + ph * 6.283, R = 78 + (i % 3) * 3; const x = 84 + Math.cos(t) * R, yy = 80 + y + Math.sin(t) * R * .34; if (Math.sin(t) < 0 || Math.abs(Math.cos(t)) > .6) { a.set(x, yy, i % 2 ? 0xffc056d8 : 0xff801870); a.set(x + 1, yy, 0xff60104a); } }
    // 触手状の肉
    for (let i = 0; i < 8; i++) {
      const t = i / 8 * 6.283 + ph * .8, w = Math.sin(ph * 6.283 + i) * 6;
      a.limb(84 + Math.cos(t) * 40, 74 + y + Math.sin(t) * 40, 84 + Math.cos(t) * (70 + w), 74 + y + Math.sin(t) * (62 + w), 8, 2, VOIDC);
    }
    a.ball(84, 74 + y, 60, 58, VOIDC);
    a.speck(84, 74 + y, 58, 56, VOIDC[0], .05, 4);
    // 無数の眼
    for (const [x, yy, r] of [[50, 30, 5], [116, 28, 6], [84, 18, 7], [30, 62, 4], [138, 60, 4], [36, 96, 3], [132, 98, 3]]) {
      a.ball(x, yy + y, r, r, ["#ffa8e8", "#ffffff"], { amb: .6 });
      a.rect(x - 1 + Math.round(Math.cos(ph * 6.283) * 1), yy + y - 1, 2, 3, "#050008");
      a.glow(x, yy + y, "#ffa8e8", 0, .35);
    }
    // 巨大な顎
    a.ball(84, 78 + y, 40, 26 + open, MEAT);
    a.ball(84, 78 + y, 30, 16 + open, ["#000000", "#05000a"], { k: .1 });
    a.glow(84, 78 + y, "#d856c0", 2, .9);
    for (let i = 0; i < 9; i++) {
      const x = 52 + i * 8;
      const dy = Math.abs(i - 4) * 1.7;
      a.poly([[x - 4, 56 - open + y + dy], [x + 4, 56 - open + y + dy], [x, 70 - open + y + dy]], BONE);
      a.poly([[x - 4, 100 + open + y - dy], [x + 4, 100 + open + y - dy], [x, 86 + open + y - dy]], BONE);
    }
  } },
  // 20F 魔法戦争の王
  warlord: { w: 136, h: 132, paint(a, P) {
    const y = -2 + P.b * 2, c = P.c, ph = P.ph, s0 = P.s;
    // 六色の魔剣が背後に浮かぶ
    const cols = [["#7c1c10", "#f27a1e", "#ffe67c"], ["#1f62a8", "#7cc8f0", "#ffffff"], ["#7a4e08", "#ffcc2c", "#ffffff"], ["#86520c", "#fff09a", "#ffffff"], ["#2c1a4a", "#8048b8", "#d0a0ff"], ["#225224", "#7cc048", "#e4ffb0"]];
    for (let i = 0; i < 6; i++) {
      const t = -Math.PI * (i + .5) / 6, r = 46, x = 68 + Math.cos(t) * r, yy = 62 + y + Math.sin(t) * r * .92 + Math.sin(ph * 6.283 + i) * 2;
      const ca = Math.cos(t), sa = Math.sin(t);
      a.poly([[x - sa * 4, yy + ca * 4], [x + sa * 4, yy - ca * 4], [x + ca * 20, yy + sa * 20]], cols[i]);
      a.line(x - sa * 7, yy + ca * 7, x + sa * 7, yy - ca * 7, GOLD[3], 2);
      a.glow(x + ca * 16, yy + sa * 16, cols[i][1], 0, .5);
    }
    // マント
    a.poly([[44, 44 + y], [92, 44 + y], [112, 128 + s0], [68, 118], [24, 128 - s0]], ["#2c0612", "#560c20", "#861430", "#b82440"]);
    // 脚
    a.limb(56, 92, 52, 126, 9, 8, WAR); a.limb(80, 92, 84, 126, 9, 8, WAR);
    a.rect(42, 124, 18, 7, WAR[1]); a.rect(76, 124, 18, 7, WAR[1]);
    sym(0, (s) => { a.poly([[68 + s * 16, 104], [68 + s * 22, 110], [68 + s * 14, 110]], GOLD); });
    // 胴鎧
    a.ball(68, 66 + y, 26, 30, WAR);
    a.poly([[52, 50 + y], [84, 50 + y], [76, 88 + y], [60, 88 + y]], GOLD);
    a.poly([[56, 52 + y], [80, 52 + y], [74, 84 + y], [62, 84 + y]], WAR);
    a.glow(68, 66 + y, "#ffffff", 3, 1);
    a.ball(68, 66 + y, 5, 5, ["#b82440", "#ffa040", "#ffffff"], { amb: .4 });
    // 肩鎧
    sym(0, (s) => {
      const up = c ? -24 : 0;
      a.ball(68 + s * 30, 46 + y, 14, 12, WAR);
      a.poly([[68 + s * 22, 38 + y], [68 + s * 42, 40 + y], [68 + s * 44, 22 + y]], GOLD);
      a.limb(68 + s * 32, 54 + y, 68 + s * 38, 80 + y + up, 8, 7, WAR);
      a.ball(68 + s * 38, 84 + y + up, 7, 7, GOLD);
      if (c) a.glow(68 + s * 38, 78 + y + up, ["#ff7a2a", "#7cd4ff"][s > 0 ? 0 : 1], 2, 1);
    });
    // 兜と大冠
    a.ball(68, 28 + y, 15, 16, WAR);
    a.rect(55, 27 + y, 26, 4, "#060208");
    a.glow(61, 29 + y, "#ff4a2a", 1, 1); a.glow(75, 29 + y, "#7cd4ff", 1, 1);
    a.poly([[50, 18 + y], [86, 18 + y], [92, -2 + y], [80, 10 + y], [76, -4 + y], [68, 10 + y], [60, -4 + y], [56, 10 + y], [44, -2 + y]], GOLD);
    a.glow(68, 13 + y, "#ffffff", 1, 1);
  } },
};

export const FRAMES = 8;
/** ボス 1 体の全フレームを生成する。idle: FRAMES 枚 / cast: 4 枚。 */
export function bakeBoss(id) {
  const def = BOSS_ART[id];
  const make = (i, n, c) => {
    const a = new Art(def.w, def.h);
    const ph = i / n, s = Math.sin(ph * 6.283);
    def.paint(a, { ph, s, b: Math.sin(ph * 6.283), c });
    a.outline("#0a0810");
    return a;
  };
  return {
    w: def.w, h: def.h,
    idle: Array.from({ length: FRAMES }, (_, i) => make(i, FRAMES, 0)),
    cast: Array.from({ length: 4 }, (_, i) => make(i, 4, 1)),
  };
}
/** 状態異常エフェクト用の actor(ボスの輪郭)。 */
export function bossActor(baked) {
  const a = baked.idle[0], data = new Uint8Array(a.w * a.h);
  for (let i = 0; i < data.length; i++) data[i] = a.px[i] ? 1 : 0;
  return { mask: { w: a.w, h: a.h, data }, pixels: a.px, x: -a.w >> 1, y: -a.h, w: a.w, h: a.h, k: 2, head: [0, -a.h], chest: [0, -a.h >> 1], eyes: [[a.w * .4 | 0, a.h * .25 | 0], [a.w * .6 | 0, a.h * .25 | 0]] };
}
