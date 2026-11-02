// 階層ごとのステージ。塔の円形の部屋を、奥の壁・床・手前の欄干の 3 層に焼いて 2.5D の奥行きを出す。
import { hexc } from "./art.js";
export const VW = 640, VH = 360, PAD = 40;
export const CX = VW / 2, CY = 212;     // 床の中心(画面座標)
export const FLOOR_RX = 268, FLOOR_RY = 134;

const THEMES = {
  moss:   { name: "苔むす門", stone: ["#141a18", "#222c26", "#344238", "#4a5a4c", "#667864", "#8a9a7e"], wall: ["#0d1411", "#18221c", "#26332a", "#38483a"], accent: "#7cc048", sky: ["#3a78a8", "#8cc8e0"], ambient: "motes", glow: "#ffb860", deco: "moss" },
  flood:  { name: "水没の間", stone: ["#0e1e2c", "#163044", "#1f4660", "#2c6280", "#468aa4", "#7cb8c8"], wall: ["#08141e", "#0e2230", "#163244", "#20465a"], accent: "#58c4ee", sky: ["#5088b8", "#a8d8ec"], ambient: "bubbles", glow: "#7cd8f4", deco: "water" },
  ember:  { name: "燠火の間", stone: ["#1c1010", "#2e1a16", "#44261c", "#603424", "#84462c", "#a86238"], wall: ["#120a0a", "#201210", "#301a14", "#44241a"], accent: "#ff7a2a", sky: ["#a84820", "#f09848"], ambient: "embers", glow: "#ff8a30", deco: "cracks" },
  spore:  { name: "胞子の庭", stone: ["#160e1c", "#241830", "#342444", "#483260", "#624680", "#8464a4"], wall: ["#0e0a14", "#180f22", "#241a34", "#342648"], accent: "#b35cc0", sky: ["#5a3a78", "#a078b8"], ambient: "spores", glow: "#d078c8", deco: "fungus" },
  ice:    { name: "氷棺の間", stone: ["#141e34", "#1e3050", "#2c4870", "#40688e", "#6494b4", "#a0cce0"], wall: ["#0c1424", "#141f38", "#1e2e50", "#2c4268"], accent: "#9bdcff", sky: ["#7898c8", "#d0e4f4"], ambient: "snow", glow: "#9bdcff", deco: "ice" },
  storm:  { name: "雷雲の回廊", stone: ["#12141e", "#1e2230", "#2c3244", "#40485c", "#5c6478", "#848ca0"], wall: ["#0a0c14", "#141722", "#1e2232", "#2c3246"], accent: "#ffd23c", sky: ["#1e2438", "#4c5674"], ambient: "rain", glow: "#ffe14a", deco: "bolts" },
  doll:   { name: "人形の私室", stone: ["#1e0f1c", "#30182c", "#462440", "#603058", "#804474", "#a8689c"], wall: ["#160a14", "#241024", "#361834", "#4a2248"], accent: "#f53cd1", sky: ["#3c1c44", "#784070"], ambient: "motes", glow: "#ff86e6", deco: "checker" },
  library:{ name: "時の書庫", stone: ["#1a1224", "#2a1e3a", "#3c2c52", "#523e6e", "#6e5690", "#9078b4"], wall: ["#120c1a", "#1e1428", "#2c1e3c", "#3e2c54"], accent: "#ffd84a", sky: ["#26164a", "#5a3c90"], ambient: "pages", glow: "#ffd98a", deco: "books" },
  crypt:  { name: "骸の聖堂", stone: ["#0e1612", "#18241e", "#24362c", "#344c3e", "#4a6854", "#6c8a74"], wall: ["#090f0c", "#111a15", "#1a2820", "#26382c"], accent: "#7cffc0", sky: ["#1c2c2c", "#486868"], ambient: "motes", glow: "#7cffc0", deco: "graves" },
  lava:   { name: "溶岩の玉座", stone: ["#180c0c", "#281410", "#3a1c14", "#50281a", "#6a3620", "#884828"], wall: ["#100808", "#1c0e0c", "#2a1410", "#3a1c14"], accent: "#ff8c2a", sky: ["#701c10", "#e86020"], ambient: "embers", glow: "#ff6a20", deco: "lava" },
  abyss:  { name: "深海の底", stone: ["#061418", "#0a2228", "#0e343c", "#144a50", "#1e6868", "#348e84"], wall: ["#040e12", "#08181e", "#0c262c", "#123840"], accent: "#58ccac", sky: ["#082a38", "#187088"], ambient: "bubbles", glow: "#58ccac", deco: "water" },
  forest: { name: "千年の森", stone: ["#141a0e", "#222c16", "#323f1e", "#46582a", "#60783a", "#869c54"], wall: ["#0c1208", "#141e0e", "#1e2c14", "#2c3e1c"], accent: "#b4e070", sky: ["#4c8040", "#b0d870"], ambient: "leaves", glow: "#d8f080", deco: "moss" },
  machine:{ name: "機関室", stone: ["#10161c", "#1a242c", "#28343f", "#3a4a58", "#526474", "#748898"], wall: ["#0a0f14", "#121a20", "#1c2730", "#2a3844"], accent: "#4ce8d8", sky: ["#0c2830", "#206068"], ambient: "sparks", glow: "#4ce8d8", deco: "plates" },
  cathedral:{ name: "堕ちた大聖堂", stone: ["#1e1a1c", "#302a2c", "#463e40", "#605656", "#807474", "#a89c98"], wall: ["#141012", "#201a1c", "#2e2628", "#403638"], accent: "#ffd2a0", sky: ["#a85030", "#f8c070"], ambient: "feathers", glow: "#ffc880", deco: "marble" },
  shadow: { name: "影の間", stone: ["#08060e", "#100c1a", "#1a1428", "#261e3a", "#362a52", "#4c3c70"], wall: ["#050409", "#0a0812", "#110d1e", "#1a142c"], accent: "#8048b8", sky: ["#0c0818", "#2c1c50"], ambient: "motes", glow: "#8048b8", deco: "void" },
  frost:  { name: "凍界の玉座", stone: ["#1a1c3c", "#282c58", "#3c427c", "#585ea0", "#8088c4", "#b8c0e8"], wall: ["#10122a", "#1a1d40", "#262b5c", "#363c7c"], accent: "#d4dcfc", sky: ["#8088c8", "#f0f4ff"], ambient: "snow", glow: "#ccd4fc", deco: "ice" },
  sky:    { name: "天空の闘技場", stone: ["#20283c", "#2e3a54", "#404f70", "#58688c", "#7888ac", "#a0b0cc"], wall: ["#141a2c", "#1e2740", "#2a3656", "#3a4a70"], accent: "#7cc8ff", sky: ["#3070c0", "#c0e8ff"], ambient: "rain", glow: "#7cc8ff", deco: "marble" },
  observatory:{ name: "星見の天蓋", stone: ["#141034", "#1e184c", "#2c2468", "#403488", "#5a4ca8", "#8070c8"], wall: ["#0c0a22", "#141034", "#1c1848", "#282260"], accent: "#ffe066", sky: ["#06061c", "#181850"], ambient: "stars", glow: "#ffe066", deco: "stars" },
  void:   { name: "虚無", stone: ["#07020c", "#12061c", "#200c2e", "#321444", "#4a1e60", "#6c2c84"], wall: ["#040108", "#0a0310", "#12061c", "#1c0a2a"], accent: "#d856c0", sky: ["#020004", "#1a0428"], ambient: "motes", glow: "#d856c0", deco: "void" },
  apex:   { name: "塔の頂", stone: ["#1a1014", "#2a1a20", "#3e2830", "#583a42", "#7a5258", "#a87870"], wall: ["#10090c", "#1c1014", "#2a181e", "#3c2228"], accent: "#ffa040", sky: ["#080c28", "#ff8040"], ambient: "embers", glow: "#ffb060", deco: "royal" },
};
export const themeOf = (key) => THEMES[key];

// ── ノイズ ──
const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1 + 7, y * 2.1 + 3) * .3 + vnoise(x * 4.3 + 11, y * 4.3 + 5) * .15;
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => B4[(y & 3) * 4 + (x & 3)] / 16 - .5;
const pick = (R, v, x, y, d = .5) => R[Math.max(0, Math.min(R.length - 1, Math.round(v * (R.length - 1) + bayer(x, y) * d)))];
const rgb = (c) => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return ((255 << 24) | (Math.round(A[2] + (B[2] - A[2]) * t) << 16) | (Math.round(A[1] + (B[1] - A[1]) * t) << 8) | Math.round(A[0] + (B[0] - A[0]) * t)) >>> 0; };

/** 階層のステージを焼く。bg(壁)/ floor / fore は VW+2PAD x VH+2PAD のレイヤー。 */
export function buildStage(themeKey, floorNo) {
  const T = THEMES[themeKey];
  const W = VW + PAD * 2, H = VH + PAD * 2, cx = CX + PAD, cy = CY + PAD;
  const wall = new Uint32Array(W * H), floor = new Uint32Array(W * H), fore = new Uint32Array(W * H);
  const stone = T.stone.map(hexc), wallC = T.wall.map(hexc), accent = hexc(T.accent), sky0 = hexc(T.sky[0]), sky1 = hexc(T.sky[1]);
  const glow = hexc(T.glow);
  const altitude = (floorNo - 1) / 19;   // 上の階ほど窓の外が高空になる

  // ─ 壁 ─ 円筒の内側を見上げる。窓(アーチ)を一定角度で開ける
  const WINDOWS = 7;
  const torches = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - cx) / (FLOOR_RX + 26);
    const clamped = Math.max(-1, Math.min(1, dx));
    const ang = Math.asin(clamped);                 // 円筒の角度
    const ybase = cy - Math.sqrt(Math.max(0, 1 - clamped * clamped)) * (FLOOR_RY + 14);   // 床との接線
    const hgt = (ybase - y);                        // 床からの高さ
    const persp = 1 + (1 - Math.cos(ang)) * .6;
    const u = ang * 40 / persp * 2.2, v = hgt / (9 * persp);
    const row = Math.floor(v), col = Math.floor(u + (row % 2) * .5);
    const fu = u + (row % 2) * .5 - col, fv = v - row;
    const lit = .35 + .35 * Math.cos(ang * 1.5) - Math.min(.3, Math.max(0, hgt) / 420);
    let c = pick(wallC, lit + (hash(col, row) - .5) * .28 + (fbm(x * .03, y * .03) - .5) * .25, x, y);
    if (fu < .06 || fv < .1) c = wallC[0];
    // 窓
    const wa = ang * WINDOWS / Math.PI * 2;
    const wi = Math.round(wa), wf = (wa - wi) / Math.cos(ang * .7);
    const wh = hgt - 30 * persp;
    const hw = .17;
    if (Math.abs(wi) <= 3 && wh > 0 && Math.abs(wf) < hw) {
      const top = 62 + (Math.sqrt(Math.max(0, 1 - (wf / hw) ** 2))) * 18;
      if (wh < top) {
        // 窓枠と外の空
        const edge = Math.abs(wf) > hw * .82 || wh > top - 3;
        if (edge) c = stone[3];
        else {
          const sy = wh / 80;
          let s = mixc(sky1, sky0, Math.min(1, sy + altitude * .5));
          // 雲。高層では眼下に雲海
          const cl = fbm(x * .05, y * .1 + 3);
          if (cl > .6 - altitude * .1 && wh < 40 + altitude * 30) s = mixc(s, 0xffffffff, .35);
          if (hash(x, y) > .995 - altitude * .01) s = 0xffffffff;
          c = s;
          // 窓の格子
          if (Math.abs(wf) < .015) c = stone[1];
        }
      }
    }
    // 窓の間の松明
    wall[y * W + x] = c;
  }
  for (const a of [-1.2, -.6, 0, .6, 1.2].map((k) => k * .9)) {
    const tx = cx + Math.sin(a) * (FLOOR_RX + 26), ty = cy - Math.cos(a) * (FLOOR_RY + 14) - 52;
    torches.push([Math.round(tx - PAD), Math.round(ty - PAD)]);
    for (let j = -3; j < 8; j++) for (let i = -2; i <= 2; i++) { const X = (tx + i) | 0, Y = (ty + j) | 0; if (X >= 0 && Y >= 0 && X < W && Y < H && (j > 2 || Math.abs(i) < 2)) wall[Y * W + X] = j > 2 ? stone[2] : stone[0]; }
    // 壁に落ちる明かり
    for (let j = -30; j < 30; j++) for (let i = -30; i < 30; i++) {
      const d = Math.hypot(i, j * 1.1) / 30; if (d >= 1) continue;
      const X = (tx + i) | 0, Y = (ty + j) | 0; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const k = (1 - d) * (1 - d) * .55 + bayer(X, Y) * .05;
      wall[Y * W + X] = mixc(wall[Y * W + X], glow, Math.max(0, k));
    }
  }

  // ─ 床 ─
  const deco = T.deco;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = x - cx, wz = (y - cy) * 2;
    const d = Math.hypot(wx, wz);
    const e = Math.hypot(wx / (FLOOR_RX + 18), (y - cy) / (FLOOR_RY + 11));
    if (e > 1) {
      // 床の外側の縁石(手前は側面が見える)
      if (y > cy) {
        const e2 = Math.hypot(wx / (FLOOR_RX + 18), (y - 14 - cy) / (FLOOR_RY + 11));
        if (e2 <= 1) { floor[y * W + x] = pick(stone, .22 - (y - cy) * .001 + (Math.floor(Math.atan2(wz, wx) * 22) % 2 ? .04 : 0), x, y); continue; }
      }
      continue;
    }
    const inner = Math.hypot(wx / FLOOR_RX, (y - cy) / FLOOR_RY);
    const th = Math.atan2(wz, wx);
    if (inner > 1) {
      // 縁石の天面
      const seg = Math.floor(th * 20);
      let v = .62 + (hash(seg, 3) - .5) * .18 - (y < cy ? .1 : 0);
      if (Math.abs(th * 20 - seg) < .08) v = .2;
      floor[y * W + x] = pick(stone, v, x, y);
      continue;
    }
    // 石畳: 同心円と放射の目地
    const ringW = 36;
    const ring = Math.floor(d / ringW);
    const nSeg = Math.max(6, ring * 7 + 6);
    const seg = Math.floor(((th + Math.PI) / (Math.PI * 2)) * nSeg + (ring % 2) * .5);
    const fr = d / ringW - ring;
    const fs = ((th + Math.PI) / (Math.PI * 2)) * nSeg + (ring % 2) * .5 - seg;
    const jointR = fr < .05 ? 1 : 0;
    const jointS = (fs < .03 * (ring + 1) / 2 / Math.max(.4, d / 200)) ? 1 : 0;
    // 中央が明るく端が暗い光
    const light = .62 - inner * inner * .4 + (x - cx) * -.0003 - (y - cy) * .0006;
    let v = light + (hash(ring * 37 + 1, seg) - .5) * .18 + (fbm(x * .04, y * .08) - .5) * .22;
    let c = pick(stone, v, x, y);
    if (jointR || jointS) c = stone[Math.max(0, Math.round(v * 2))];
    if (!jointR && !jointS && fr > .9) c = mixc(c, stone[Math.min(5, Math.round(v * 5) + 1)], .4);

    const n = fbm(x * .022 + 20, y * .044 + 9);
    switch (deco) {
      case "moss": if (n > .56) c = mixc(c, n > .62 ? 0xff30703a : 0xff24502a, .38 + bayer(x, y) * .25); break;
      case "water": if (n > .55) c = mixc(c, n > .6 ? hexc(T.accent) : hexc(T.stone[3]), n > .6 ? .28 : .35); break;
      case "cracks": case "lava": {
        const cr = Math.abs(fbm(x * .03, y * .06) - .5);
        if (cr < (deco === "lava" ? .011 : .007)) c = hexc(cr < .004 ? "#e87a28" : "#a83a18");
        else if (cr < .022 && deco === "lava") c = mixc(c, 0xff1030a0, .28);
        break;
      }
      case "fungus": if (n > .6) c = mixc(c, n > .66 ? hexc("#d078c8") : hexc("#50206c"), .4); break;
      case "ice": { const sh = fbm(x * .01 + (y * .02), y * .04); c = mixc(c, 0xffffffff, Math.max(0, sh - .55) * 1.1); if (hash(x >> 1, y >> 1) > .997) c = 0xffffffff; break; }
      case "bolts": { const cr = Math.abs(fbm(x * .05, y * .1) - .5); if (cr < .006) c = hexc("#a88a20"); break; }
      case "checker": { const cc = (Math.floor(wx / 24 + 100) + Math.floor(wz / 24 + 100)) % 2; c = mixc(c, cc ? stone[4] : stone[0], .5); break; }
      case "books": { if (ring % 3 === 1 && !jointR && fr > .3 && fr < .7 && seg % 3 === 0) c = mixc(c, accent, .35); break; }
      case "graves": { if (n > .6) c = mixc(c, hexc("#0c1a14"), .5); break; }
      case "plates": { const px = Math.floor((wx + 400) / 48), py = Math.floor((wz + 400) / 48); const fx = (wx + 400) / 48 - px, fy = (wz + 400) / 48 - py; c = pick(stone, light + (hash(px, py) - .5) * .12, x, y, .25); if (fx < .03 || fy < .03) c = stone[0]; if ((fx > .06 && fx < .1 && fy > .06 && fy < .1)) c = stone[5]; if (Math.abs(fy - .5) < .012 && hash(px, py) > .6) c = accent; break; }
      case "marble": { const vn = Math.abs(fbm(x * .02, y * .05) - .5); if (vn < .012) c = mixc(c, stone[5], .7); break; }
      case "void": { c = mixc(c, 0xff000000, Math.max(0, n - .45) * .5); if (hash(x, y) > .9975) c = accent; break; }
      case "stars": { if (hash(x, y) > .9975) c = 0xffffffff; const ord = Math.abs(d - 150); if (ord < 1.2) c = accent; break; }
      case "royal": { if (Math.abs(wx) < 40 && y > cy) c = mixc(c, hexc("#861430"), .75 - Math.abs(wx) / 80); if (Math.abs(Math.abs(wx) - 40) < 1.4 && y > cy) c = accent; break; }
    }
    // 中央の紋章
    const em = d / 94;
    if (Math.abs(d - 94) < 1.3 || Math.abs(d - 74) < .9) c = mixc(c, accent, .65);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), al = wx * ca + wz * sa, off = wx * sa - wz * ca;
      if (al > 74 && al < 94 && Math.abs(off) < 1.4) c = mixc(c, accent, .5);
    }
    floor[y * W + x] = c;
  }
  // 窓から床に落ちる光の筋(下層ほど明るい)
  for (let i = -3; i <= 3; i++) {
    const a = i * .42, bx = cx + Math.sin(a) * 180, by = cy - 30 + Math.abs(i) * 6;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = floor[y * W + x]; if (!v) continue;
      const u = (x - bx - (y - by) * Math.sin(a) * .9) / 16, vv = (y - by) / 66;
      if (Math.abs(u) < 1 && Math.abs(vv) < 1) { const k = .12 * (1 - vv * vv) + bayer(x, y) * .03; if (k > 0) floor[y * W + x] = mixc(v, sky1, k); }
    }
  }

  // ─ 手前の欄干(前景)─ 床より手前に立ち、キャラより手前に描く
  const railY = (px) => cy + Math.sqrt(Math.max(0, 1 - ((px - cx) / (FLOOR_RX + 38)) ** 2)) * (FLOOR_RY + 40);
  for (let x = 0; x < W; x++) {
    const ry = railY(x);
    for (let y = Math.floor(ry); y < H; y++) {
      const t = y - ry;
      let c;
      if (t < 3) c = stone[4];
      else if (t < 5) c = stone[1];
      else {
        const px = (x % 30);
        c = pick(wallC, .5 - t * .01 + (px < 3 ? -.3 : 0) + (px > 27 ? .15 : 0), x, y);
      }
      fore[y * W + x] = c;
    }
  }
  // 左右の大柱
  for (const side of [-1, 1]) {
    const pxc = cx + side * (FLOOR_RX + 42);
    for (let y = 0; y < H; y++) for (let x = Math.max(0, Math.round(pxc - 24)); x < Math.min(W, Math.round(pxc + 24)); x++) {
      const u = (x - pxc) / 24;
      let v = .55 - u * .4 * 1 + (hash(Math.floor((x - pxc) / 8), Math.floor(y / 26)) - .5) * .08;
      if (y % 26 < 2) v -= .25;
      fore[y * W + x] = pick(wallC, v * Math.sqrt(Math.max(.1, 1 - u * u)), x, y);
    }
  }
  return { wall, floor, fore, W, H, torches, theme: T };
}
